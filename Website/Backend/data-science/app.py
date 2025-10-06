#!/usr/bin/env python3
"""
🔬 Swaggo Data Science Server
Simple Flask-based data analysis service
Port: 5000 (no conflict with main backend on 45799)
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
import logging
import sys
from textblob import TextBlob
from collections import defaultdict
import redis
from scipy import stats
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Add ML models path
sys.path.append('../../ds/services')
from ml_models import MLPredictor
from analytics_pipeline import get_analytics_pipeline
from ai_features import (
    get_moderation_engine, 
    get_tagging_engine, 
    get_personalization_engine, 
    get_notification_engine
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv('DS_SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, origins=['http://localhost:3000', 'http://localhost:45799'])

# Configuration
DS_PORT = int(os.getenv('DS_PORT', 5000))
DS_ENV = os.getenv('DS_ENV', 'development')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://api:45799')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CACHE_EXPIRY = int(os.getenv('CACHE_EXPIRY', 3600))  # 1 hour

# Initialize services
ml_predictor = MLPredictor()
executor = ThreadPoolExecutor(max_workers=4)

# Redis connection (optional, graceful fallback)
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info(f"Connected to Redis at {REDIS_URL}")
except Exception as e:
    logger.warning(f"Redis not available: {e}. Using in-memory caching.")
    redis_client = None

# In-memory cache fallback
in_memory_cache = {}
cache_timestamps = {}

def get_cache(key):
    """Get cached value with fallback"""
    if redis_client:
        try:
            return redis_client.get(key)
        except:
            pass
    
    # Fallback to in-memory cache
    if key in in_memory_cache:
        timestamp = cache_timestamps.get(key, 0)
        if datetime.now().timestamp() - timestamp < CACHE_EXPIRY:
            return in_memory_cache[key]
        else:
            # Expired
            del in_memory_cache[key]
            del cache_timestamps[key]
    return None

def set_cache(key, value, expiry=CACHE_EXPIRY):
    """Set cached value with fallback"""
    if redis_client:
        try:
            redis_client.setex(key, expiry, value)
            return
        except:
            pass
    
    # Fallback to in-memory cache
    in_memory_cache[key] = value
    cache_timestamps[key] = datetime.now().timestamp()

class AnalyticsService:
    """Analytics and data processing service"""
    
    def __init__(self):
        self.user_sessions = defaultdict(list)
        self.content_views = defaultdict(int)
        self.engagement_metrics = defaultdict(dict)
        
    def track_user_activity(self, user_id, activity_type, metadata=None):
        """Track user activity for analytics"""
        activity = {
            'timestamp': datetime.now().isoformat(),
            'type': activity_type,
            'metadata': metadata or {}
        }
        
        self.user_sessions[user_id].append(activity)
        
        # Cache the activity
        cache_key = f"user_activity:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        cached_activities = get_cache(cache_key)
        
        if cached_activities:
            activities = json.loads(cached_activities)
            activities.append(activity)
        else:
            activities = [activity]
        
        set_cache(cache_key, json.dumps(activities))
        
    def get_user_analytics(self, user_id, days=7):
        """Get user analytics for specified days"""
        analytics = {
            'user_id': user_id,
            'period_days': days,
            'activities': [],
            'summary': {
                'total_activities': 0,
                'activity_types': {},
                'daily_breakdown': {},
                'engagement_score': 0
            }
        }
        
        # Collect activities from cache
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            cache_key = f"user_activity:{user_id}:{date}"
            cached_activities = get_cache(cache_key)
            
            if cached_activities:
                daily_activities = json.loads(cached_activities)
                analytics['activities'].extend(daily_activities)
                analytics['summary']['daily_breakdown'][date] = len(daily_activities)
        
        # Calculate summary metrics
        for activity in analytics['activities']:
            analytics['summary']['total_activities'] += 1
            activity_type = activity.get('type', 'unknown')
            analytics['summary']['activity_types'][activity_type] = \
                analytics['summary']['activity_types'].get(activity_type, 0) + 1
        
        # Calculate engagement score (0-100)
        if analytics['summary']['total_activities'] > 0:
            base_score = min(analytics['summary']['total_activities'] * 2, 50)
            variety_bonus = len(analytics['summary']['activity_types']) * 5
            consistency_bonus = len([d for d in analytics['summary']['daily_breakdown'].values() if d > 0]) * 3
            analytics['summary']['engagement_score'] = min(base_score + variety_bonus + consistency_bonus, 100)
        
        return analytics

class RecommendationEngine:
    """Content recommendation engine"""
    
    def __init__(self):
        self.user_preferences = defaultdict(dict)
        self.content_features = defaultdict(dict)
        self.interaction_matrix = defaultdict(dict)
        
    def update_user_preferences(self, user_id, content_id, interaction_type, strength=1.0):
        """Update user preferences based on interactions"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = defaultdict(float)
        
        # Weight different interaction types
        weights = {
            'view': 1.0,
            'like': 2.0,
            'share': 3.0,
            'comment': 2.5,
            'save': 4.0,
            'follow': 3.0
        }
        
        weight = weights.get(interaction_type, 1.0) * strength
        self.user_preferences[user_id][content_id] += weight
        
        # Update interaction matrix
        if content_id not in self.interaction_matrix:
            self.interaction_matrix[content_id] = defaultdict(float)
        self.interaction_matrix[content_id][user_id] += weight
        
    def get_content_recommendations(self, user_id, content_pool, num_recommendations=10):
        """Get content recommendations for user"""
        if not content_pool:
            return []
            
        # Get user's interaction history
        user_interactions = self.user_preferences.get(user_id, {})
        
        if not user_interactions:
            # For new users, return popular content
            return self._get_popular_content(content_pool, num_recommendations)
        
        # Calculate similarity scores
        recommendations = []
        
        for content in content_pool:
            if content['id'] not in user_interactions:  # Don't recommend already interacted content
                score = self._calculate_recommendation_score(user_id, content)
                recommendations.append((content, score))
        
        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return [rec[0] for rec in recommendations[:num_recommendations]]
    
    def _calculate_recommendation_score(self, user_id, content):
        """Calculate recommendation score for content"""
        score = 0.0
        content_id = content['id']
        
        # Collaborative filtering component
        content_interactions = self.interaction_matrix.get(content_id, {})
        user_interactions = self.user_preferences.get(user_id, {})
        
        # Find similar users
        similar_users = []
        for other_user, interaction_strength in content_interactions.items():
            if other_user != user_id:
                # Calculate user similarity based on common interactions
                common_content = set(user_interactions.keys()) & set(self.user_preferences.get(other_user, {}).keys())
                if common_content:
                    similarity = len(common_content) / (len(user_interactions) + len(self.user_preferences.get(other_user, {})))
                    similar_users.append((other_user, similarity * interaction_strength))
        
        # Weight by similar users' interactions
        for _, weighted_similarity in similar_users[:5]:  # Top 5 similar users
            score += weighted_similarity
        
        # Content-based filtering component
        content_features = content.get('features', {})
        
        # Category preference
        category = content_features.get('category', 'general')
        user_category_score = sum([v for k, v in user_interactions.items() 
                                  if self.content_features.get(k, {}).get('category') == category])
        score += user_category_score * 0.1
        
        # Recency boost for newer content
        if 'created_at' in content:
            try:
                content_age = (datetime.now() - datetime.fromisoformat(content['created_at'].replace('Z', '+00:00'))).days
                recency_boost = max(0, (30 - content_age) / 30)  # Boost content less than 30 days old
                score += recency_boost * 5
            except:
                pass
        
        # Popularity boost
        if 'popularity_score' in content:
            score += content.get('popularity_score', 0) * 0.05
        
        return score
    
    def _get_popular_content(self, content_pool, num_recommendations):
        """Get popular content for new users"""
        # Sort by popularity metrics
        sorted_content = sorted(
            content_pool, 
            key=lambda x: (
                x.get('views', 0) * 1 + 
                x.get('likes', 0) * 2 + 
                x.get('shares', 0) * 3 + 
                x.get('comments', 0) * 2
            ), 
            reverse=True
        )
        return sorted_content[:num_recommendations]

# Initialize services
analytics_service = AnalyticsService()
recommendation_engine = RecommendationEngine()
analytics_pipeline = get_analytics_pipeline()

# Initialize AI-powered features
moderation_engine = get_moderation_engine()
tagging_engine = get_tagging_engine()
personalization_engine = get_personalization_engine()
notification_engine = get_notification_engine()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'data-science-server',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'port': DS_PORT,
        'environment': DS_ENV,
        'backend_url': API_BASE_URL
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """Analyze data endpoint"""
    try:
        # Get data from request
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Please provide data in the request body'
            }), 400
        
        # Convert data to DataFrame for analysis
        input_data = data['data']
        
        # Handle different data formats
        if isinstance(input_data, list):
            if len(input_data) == 0:
                return jsonify({'error': 'Empty data provided'}), 400
                
            # If it's a list of dictionaries, create DataFrame directly
            if isinstance(input_data[0], dict):
                df = pd.DataFrame(input_data)
            else:
                # If it's a list of lists, assume first row is headers
                if len(input_data) > 1 and isinstance(input_data[0], list):
                    df = pd.DataFrame(input_data[1:], columns=input_data[0])
                else:
                    return jsonify({'error': 'Invalid data format'}), 400
        else:
            return jsonify({'error': 'Data must be a list'}), 400
        
        # Perform basic data analysis
        analysis_result = {
            'summary': {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'columns': list(df.columns),
                'data_types': df.dtypes.astype(str).to_dict()
            },
            'statistics': {},
            'insights': []
        }
        
        # Numeric statistics
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        if len(numeric_columns) > 0:
            numeric_stats = df[numeric_columns].describe().to_dict()
            analysis_result['statistics']['numeric'] = numeric_stats
            
            # Generate insights
            for col in numeric_columns:
                mean_val = df[col].mean()
                analysis_result['insights'].append(f"Average {col}: {mean_val:.2f}")
        
        # Categorical statistics
        categorical_columns = df.select_dtypes(include=['object']).columns
        if len(categorical_columns) > 0:
            categorical_stats = {}
            for col in categorical_columns:
                categorical_stats[col] = {
                    'unique_values': int(df[col].nunique()),
                    'most_common': df[col].mode().iloc[0] if not df[col].mode().empty else None
                }
            analysis_result['statistics']['categorical'] = categorical_stats
            
            # Generate insights
            for col in categorical_columns:
                unique_count = df[col].nunique()
                analysis_result['insights'].append(f"Column '{col}' has {unique_count} unique values")
        
        # Missing data analysis
        missing_data = df.isnull().sum()
        if missing_data.sum() > 0:
            analysis_result['data_quality'] = {
                'missing_values': missing_data.to_dict(),
                'completeness_percentage': ((len(df) - missing_data) / len(df) * 100).to_dict()
            }
        
        logger.info(f"Successfully analyzed data with {len(df)} rows and {len(df.columns)} columns")
        
        return jsonify({
            'success': True,
            'analysis': analysis_result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Data analysis failed: {str(e)}")
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e)
        }), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """Simple prediction endpoint (placeholder)"""
    try:
        data = request.get_json()
        
        # This is a placeholder for machine learning predictions
        # In a real implementation, you would load ML models and make predictions
        
        return jsonify({
            'success': True,
            'prediction': 'Prediction functionality not yet implemented',
            'message': 'This endpoint is ready for ML model integration',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

# ============ ML MODEL ENDPOINTS ============

@app.route('/api/ml/train', methods=['POST'])
def train_ml_model():
    """Train a machine learning model"""
    try:
        data = request.get_json()
        
        if not data or 'data' not in data or 'target_column' not in data:
            return jsonify({
                'error': 'Missing required fields: data, target_column'
            }), 400
        
        model_type = data.get('model_type', 'auto')
        problem_type = data.get('problem_type', 'auto')
        
        # Train the model
        result = ml_predictor.train_model(
            data['data'], 
            data['target_column'],
            model_type=model_type,
            problem_type=problem_type
        )
        
        if 'error' in result:
            return jsonify(result), 400
        
        logger.info(f"Successfully trained model: {result['model_name']}")
        return jsonify({
            'success': True,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"ML training failed: {str(e)}")
        return jsonify({
            'error': 'ML training failed',
            'message': str(e)
        }), 500

@app.route('/api/ml/predict', methods=['POST'])
def ml_predict():
    """Make predictions using trained ML models"""
    try:
        data = request.get_json()
        
        if not data or 'data' not in data:
            return jsonify({
                'error': 'Missing required field: data'
            }), 400
        
        model_name = data.get('model_name', None)
        
        # Make prediction
        result = ml_predictor.predict(data['data'], model_name)
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Add confidence score
        result['confidence'] = ml_predictor.get_confidence()
        
        logger.info(f"Prediction made using model: {result['model_used']}")
        return jsonify({
            'success': True,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"ML prediction failed: {str(e)}")
        return jsonify({
            'error': 'ML prediction failed',
            'message': str(e)
        }), 500

@app.route('/api/ml/models', methods=['GET'])
def list_ml_models():
    """List available ML models"""
    try:
        models = ml_predictor.list_models()
        return jsonify({
            'success': True,
            'models': models,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        return jsonify({
            'error': 'Failed to list models',
            'message': str(e)
        }), 500

# ============ ANALYTICS ENDPOINTS ============

@app.route('/api/analytics/track', methods=['POST'])
def track_user_activity():
    """Track user activity for analytics"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'activity_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        activity_type = data['activity_type']
        metadata = data.get('metadata', {})
        
        # Track the activity
        analytics_service.track_user_activity(user_id, activity_type, metadata)
        
        return jsonify({
            'success': True,
            'message': 'Activity tracked successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Activity tracking failed: {str(e)}")
        return jsonify({
            'error': 'Activity tracking failed',
            'message': str(e)
        }), 500

@app.route('/api/analytics/user/<user_id>', methods=['GET'])
def get_user_analytics(user_id):
    """Get user analytics"""
    try:
        days = int(request.args.get('days', 7))
        days = min(days, 30)  # Limit to 30 days max
        
        analytics = analytics_service.get_user_analytics(user_id, days)
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"User analytics failed: {str(e)}")
        return jsonify({
            'error': 'User analytics failed',
            'message': str(e)
        }), 500

@app.route('/api/analytics/content-performance', methods=['POST'])
def analyze_content_performance():
    """Analyze content performance metrics"""
    try:
        data = request.get_json()
        
        if not data or 'content_data' not in data:
            return jsonify({
                'error': 'Missing required field: content_data'
            }), 400
        
        content_data = data['content_data']
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(content_data)
        
        # Calculate performance metrics
        performance_metrics = {
            'total_content': len(df),
            'average_views': float(df.get('views', pd.Series([0])).mean()),
            'average_likes': float(df.get('likes', pd.Series([0])).mean()),
            'average_shares': float(df.get('shares', pd.Series([0])).mean()),
            'average_comments': float(df.get('comments', pd.Series([0])).mean()),
            'engagement_rate': 0,
            'top_performers': [],
            'insights': []
        }
        
        # Calculate engagement rate
        if 'views' in df.columns and len(df) > 0:
            total_engagement = df.get('likes', 0).sum() + df.get('shares', 0).sum() + df.get('comments', 0).sum()
            total_views = df['views'].sum()
            if total_views > 0:
                performance_metrics['engagement_rate'] = float(total_engagement / total_views * 100)
        
        # Find top performers
        if len(df) > 0:
            # Calculate engagement score for each content
            df['engagement_score'] = (
                df.get('likes', 0) * 2 + 
                df.get('shares', 0) * 3 + 
                df.get('comments', 0) * 2.5 + 
                df.get('views', 0) * 0.1
            )
            
            top_content = df.nlargest(min(5, len(df)), 'engagement_score')
            performance_metrics['top_performers'] = top_content[['id', 'title', 'engagement_score']].to_dict('records')
        
        # Generate insights
        insights = []
        if performance_metrics['engagement_rate'] > 5:
            insights.append("High engagement rate indicates strong audience connection")
        elif performance_metrics['engagement_rate'] < 2:
            insights.append("Low engagement rate suggests need for content optimization")
        
        if performance_metrics['average_shares'] > performance_metrics['average_likes']:
            insights.append("Content is highly shareable - consider similar content strategies")
        
        performance_metrics['insights'] = insights
        
        return jsonify({
            'success': True,
            'performance': performance_metrics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Content performance analysis failed: {str(e)}")
        return jsonify({
            'error': 'Content performance analysis failed',
            'message': str(e)
        }), 500

# ============ RECOMMENDATION ENDPOINTS ============

@app.route('/api/recommendations/update', methods=['POST'])
def update_user_preferences():
    """Update user preferences for recommendations"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'content_id', 'interaction_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        content_id = data['content_id']
        interaction_type = data['interaction_type']
        strength = data.get('strength', 1.0)
        
        recommendation_engine.update_user_preferences(
            user_id, content_id, interaction_type, strength
        )
        
        return jsonify({
            'success': True,
            'message': 'User preferences updated',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Preference update failed: {str(e)}")
        return jsonify({
            'error': 'Preference update failed',
            'message': str(e)
        }), 500

@app.route('/api/recommendations/get', methods=['POST'])
def get_content_recommendations():
    """Get content recommendations for user"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'content_pool']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        content_pool = data['content_pool']
        num_recommendations = data.get('num_recommendations', 10)
        
        recommendations = recommendation_engine.get_content_recommendations(
            user_id, content_pool, num_recommendations
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'user_id': user_id,
            'count': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Recommendation generation failed: {str(e)}")
        return jsonify({
            'error': 'Recommendation generation failed',
            'message': str(e)
        }), 500

# ============ TEXT ANALYSIS ENDPOINTS ============

@app.route('/api/text/sentiment', methods=['POST'])
def analyze_sentiment():
    """Analyze text sentiment"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        
        if isinstance(text, list):
            # Batch processing
            results = []
            for item in text:
                blob = TextBlob(str(item))
                results.append({
                    'text': str(item)[:100] + '...' if len(str(item)) > 100 else str(item),
                    'sentiment': {
                        'polarity': float(blob.sentiment.polarity),
                        'subjectivity': float(blob.sentiment.subjectivity),
                        'classification': 'positive' if blob.sentiment.polarity > 0.1 else 'negative' if blob.sentiment.polarity < -0.1 else 'neutral'
                    }
                })
            
            # Calculate aggregated metrics
            avg_polarity = sum([r['sentiment']['polarity'] for r in results]) / len(results)
            avg_subjectivity = sum([r['sentiment']['subjectivity'] for r in results]) / len(results)
            
            return jsonify({
                'success': True,
                'results': results,
                'summary': {
                    'total_texts': len(results),
                    'average_polarity': float(avg_polarity),
                    'average_subjectivity': float(avg_subjectivity),
                    'overall_sentiment': 'positive' if avg_polarity > 0.1 else 'negative' if avg_polarity < -0.1 else 'neutral'
                },
                'timestamp': datetime.now().isoformat()
            })
        else:
            # Single text analysis
            blob = TextBlob(str(text))
            
            return jsonify({
                'success': True,
                'text': str(text),
                'sentiment': {
                    'polarity': float(blob.sentiment.polarity),
                    'subjectivity': float(blob.sentiment.subjectivity),
                    'classification': 'positive' if blob.sentiment.polarity > 0.1 else 'negative' if blob.sentiment.polarity < -0.1 else 'neutral'
                },
                'timestamp': datetime.now().isoformat()
            })
        
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {str(e)}")
        return jsonify({
            'error': 'Sentiment analysis failed',
            'message': str(e)
        }), 500

@app.route('/api/text/keywords', methods=['POST'])
def extract_keywords():
    """Extract keywords from text using TF-IDF"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing required field: text'
            }), 400
        
        texts = data['text']
        max_keywords = data.get('max_keywords', 10)
        
        if isinstance(texts, str):
            texts = [texts]
        
        # Use TF-IDF to extract keywords
        vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )
        
        try:
            tfidf_matrix = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            
            # Get scores for each document
            results = []
            for i, text in enumerate(texts):
                # Get TF-IDF scores for this document
                doc_scores = tfidf_matrix[i].toarray()[0]
                
                # Get top keywords
                top_indices = doc_scores.argsort()[-max_keywords:][::-1]
                keywords = [
                    {
                        'keyword': feature_names[idx],
                        'score': float(doc_scores[idx])
                    }
                    for idx in top_indices if doc_scores[idx] > 0
                ]
                
                results.append({
                    'text': text[:100] + '...' if len(text) > 100 else text,
                    'keywords': keywords
                })
            
            return jsonify({
                'success': True,
                'results': results,
                'timestamp': datetime.now().isoformat()
            })
            
        except ValueError as e:
            # Handle edge cases like empty text
            return jsonify({
                'success': True,
                'results': [{'text': text, 'keywords': []} for text in texts],
                'message': 'No meaningful keywords found',
                'timestamp': datetime.now().isoformat()
            })
        
    except Exception as e:
        logger.error(f"Keyword extraction failed: {str(e)}")
        return jsonify({
            'error': 'Keyword extraction failed',
            'message': str(e)
        }), 500

# ============ AI-POWERED FEATURE ENDPOINTS ============

@app.route('/api/ai/moderate-content', methods=['POST'])
def moderate_content():
    """Moderate content using AI-powered content moderation"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'error': 'Missing required field: content'
            }), 400
        
        content = data['content']
        content_id = data.get('content_id')
        
        # Moderate the content
        result = moderation_engine.moderate_content(content, content_id)
        
        return jsonify({
            'success': True,
            'moderation': {
                'content_id': result.content_id,
                'is_safe': result.is_safe,
                'confidence_score': result.confidence_score,
                'detected_issues': result.detected_issues,
                'severity_level': result.severity_level,
                'recommended_action': result.recommended_action,
                'explanation': result.explanation,
                'timestamp': result.timestamp.isoformat()
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Content moderation failed: {str(e)}")
        return jsonify({
            'error': 'Content moderation failed',
            'message': str(e)
        }), 500

@app.route('/api/ai/generate-tags', methods=['POST'])
def generate_intelligent_tags():
    """Generate intelligent tags for content"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'error': 'Missing required field: content'
            }), 400
        
        content = data['content']
        title = data.get('title', '')
        max_tags = data.get('max_tags', 10)
        
        # Generate tags
        tags = tagging_engine.generate_tags(content, title, max_tags)
        
        # Convert to serializable format
        tag_results = []
        for tag in tags:
            tag_results.append({
                'tag': tag.tag,
                'confidence': tag.confidence,
                'category': tag.category,
                'relevance_score': tag.relevance_score
            })
        
        return jsonify({
            'success': True,
            'tags': tag_results,
            'total_tags': len(tag_results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Tag generation failed: {str(e)}")
        return jsonify({
            'error': 'Tag generation failed',
            'message': str(e)
        }), 500

@app.route('/api/ai/personalize/update-profile', methods=['POST'])
def update_personalization_profile():
    """Update user personalization profile"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'content_tags', 'interaction_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        content_tags = data['content_tags']
        interaction_type = data['interaction_type']
        content_category = data.get('content_category')
        
        # Update user profile
        personalization_engine.update_user_profile(
            user_id, content_tags, interaction_type, content_category
        )
        
        return jsonify({
            'success': True,
            'message': 'User profile updated successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Profile update failed: {str(e)}")
        return jsonify({
            'error': 'Profile update failed',
            'message': str(e)
        }), 500

@app.route('/api/ai/personalize/score', methods=['POST'])
def get_personalization_score():
    """Get personalized content score for user"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'content_tags']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        content_tags = data['content_tags']
        content_category = data.get('content_category')
        
        # Calculate personalization score
        score = personalization_engine.get_personalized_score(
            user_id, content_tags, content_category
        )
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'personalization_score': score,
            'content_category': content_category,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Personalization scoring failed: {str(e)}")
        return jsonify({
            'error': 'Personalization scoring failed',
            'message': str(e)
        }), 500

@app.route('/api/ai/personalize/recommendations', methods=['POST'])
def get_personalized_recommendations():
    """Get personalized content recommendations"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'content_pool']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        content_pool = data['content_pool']
        num_recommendations = data.get('num_recommendations', 10)
        
        # Get personalized recommendations
        recommendations = personalization_engine.get_user_recommendations(
            user_id, content_pool, num_recommendations
        )
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'recommendations': recommendations,
            'total_recommendations': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Personalized recommendations failed: {str(e)}")
        return jsonify({
            'error': 'Personalized recommendations failed',
            'message': str(e)
        }), 500

@app.route('/api/ai/notifications/should-send', methods=['POST'])
def check_notification_timing():
    """Check if notification should be sent to user"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'notification_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        notification_type = data['notification_type']
        content_priority = data.get('content_priority', 'medium')
        
        # Check if notification should be sent
        should_send, reason = notification_engine.should_send_notification(
            user_id, notification_type, content_priority
        )
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'should_send': should_send,
            'reason': reason,
            'notification_type': notification_type,
            'content_priority': content_priority,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Notification check failed: {str(e)}")
        return jsonify({
            'error': 'Notification check failed',
            'message': str(e)
        }), 500

@app.route('/api/ai/content-pipeline', methods=['POST'])
def ai_content_processing_pipeline():
    """Complete AI content processing pipeline"""
    try:
        data = request.get_json()
        
        required_fields = ['content', 'user_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        content = data['content']
        user_id = data['user_id']
        title = data.get('title', '')
        content_id = data.get('content_id')
        
        pipeline_results = {}
        
        # Step 1: Content Moderation
        moderation_result = moderation_engine.moderate_content(content, content_id)
        pipeline_results['moderation'] = {
            'is_safe': moderation_result.is_safe,
            'confidence_score': moderation_result.confidence_score,
            'detected_issues': moderation_result.detected_issues,
            'severity_level': moderation_result.severity_level,
            'recommended_action': moderation_result.recommended_action,
            'explanation': moderation_result.explanation
        }
        
        # Step 2: Intelligent Tagging (only if content is safe)
        if moderation_result.is_safe:
            tags = tagging_engine.generate_tags(content, title, 10)
            pipeline_results['tags'] = [{
                'tag': tag.tag,
                'confidence': tag.confidence,
                'category': tag.category,
                'relevance_score': tag.relevance_score
            } for tag in tags]
            
            # Step 3: Personalization Score
            content_tags = [tag.tag for tag in tags]
            primary_category = tags[0].category if tags else None
            personalization_score = personalization_engine.get_personalized_score(
                user_id, content_tags, primary_category
            )
            pipeline_results['personalization'] = {
                'score': personalization_score,
                'primary_category': primary_category,
                'user_id': user_id
            }
        else:
            pipeline_results['tags'] = []
            pipeline_results['personalization'] = {
                'score': 0.0,
                'primary_category': None,
                'user_id': user_id,
                'note': 'Content flagged by moderation'
            }
        
        # Step 4: Notification Decision
        notification_priority = 'high' if moderation_result.severity_level in ['high', 'critical'] else 'medium'
        should_notify, notify_reason = notification_engine.should_send_notification(
            user_id, 'content_processed', notification_priority
        )
        pipeline_results['notification'] = {
            'should_send': should_notify,
            'reason': notify_reason,
            'priority': notification_priority
        }
        
        return jsonify({
            'success': True,
            'content_id': content_id,
            'user_id': user_id,
            'pipeline_results': pipeline_results,
            'processing_complete': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"AI content pipeline failed: {str(e)}")
        return jsonify({
            'error': 'AI content pipeline failed',
            'message': str(e)
        }), 500

# ============ ADVANCED ANALYTICS PIPELINE ENDPOINTS ============

@app.route('/api/analytics/pipeline/track-user-event', methods=['POST'])
def track_user_event():
    """Track user event in advanced analytics pipeline"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'event_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        event_type = data['event_type']
        session_id = data.get('session_id')
        metadata = data.get('metadata', {})
        
        # Track the event in the pipeline
        analytics_pipeline.track_user_event(user_id, event_type, session_id, metadata)
        
        return jsonify({
            'success': True,
            'message': 'User event tracked successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"User event tracking failed: {str(e)}")
        return jsonify({
            'error': 'User event tracking failed',
            'message': str(e)
        }), 500

@app.route('/api/analytics/pipeline/track-content-event', methods=['POST'])
def track_content_event():
    """Track content event in advanced analytics pipeline"""
    try:
        data = request.get_json()
        
        required_fields = ['content_id', 'user_id', 'event_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        content_id = data['content_id']
        user_id = data['user_id']
        event_type = data['event_type']
        duration = data.get('duration')
        metadata = data.get('metadata', {})
        
        # Track the event in the pipeline
        analytics_pipeline.track_content_event(content_id, user_id, event_type, duration, metadata)
        
        return jsonify({
            'success': True,
            'message': 'Content event tracked successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Content event tracking failed: {str(e)}")
        return jsonify({
            'error': 'Content event tracking failed',
            'message': str(e)
        }), 500

@app.route('/api/analytics/pipeline/realtime-metrics', methods=['GET'])
def get_realtime_metrics():
    """Get real-time analytics metrics"""
    try:
        metrics = analytics_pipeline.get_realtime_metrics()
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Real-time metrics failed: {str(e)}")
        return jsonify({
            'error': 'Real-time metrics failed',
            'message': str(e)
        }), 500

@app.route('/api/analytics/pipeline/user-behavior', methods=['GET'])
def get_user_behavior_insights():
    """Get user behavior insights from analytics pipeline"""
    try:
        lookback_hours = int(request.args.get('hours', 24))
        lookback_hours = min(lookback_hours, 168)  # Max 7 days
        
        insights = analytics_pipeline.get_user_behavior_insights(lookback_hours)
        
        return jsonify({
            'success': True,
            'insights': insights,
            'lookback_hours': lookback_hours,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"User behavior insights failed: {str(e)}")
        return jsonify({
            'error': 'User behavior insights failed',
            'message': str(e)
        }), 500

@app.route('/api/analytics/pipeline/content-performance', methods=['GET'])
def get_content_performance_insights():
    """Get content performance insights from analytics pipeline"""
    try:
        lookback_hours = int(request.args.get('hours', 24))
        lookback_hours = min(lookback_hours, 168)  # Max 7 days
        
        insights = analytics_pipeline.get_content_performance_insights(lookback_hours)
        
        return jsonify({
            'success': True,
            'insights': insights,
            'lookback_hours': lookback_hours,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Content performance insights failed: {str(e)}")
        return jsonify({
            'error': 'Content performance insights failed',
            'message': str(e)
        }), 500

@app.route('/api/analytics/dashboard', methods=['GET'])
def get_analytics_dashboard_data():
    """Get comprehensive analytics dashboard data"""
    try:
        lookback_hours = int(request.args.get('hours', 24))
        lookback_hours = min(lookback_hours, 168)  # Max 7 days
        
        # Get all analytics data
        realtime_metrics = analytics_pipeline.get_realtime_metrics()
        user_behavior = analytics_pipeline.get_user_behavior_insights(lookback_hours)
        content_performance = analytics_pipeline.get_content_performance_insights(lookback_hours)
        
        # Calculate KPIs
        kpis = {
            'total_events': 0,
            'active_users': 0,
            'total_content_views': 0,
            'avg_engagement_rate': 0,
            'top_content_categories': {},
            'user_growth_trend': 'stable',
            'engagement_trend': 'stable'
        }
        
        # Extract metrics from realtime data
        if 'counters' in realtime_metrics:
            counters = realtime_metrics['counters']
            kpis['total_events'] = counters.get('user_events.total', {}).get('user_events.total', 0)
            kpis['total_content_views'] = counters.get('content_events.view', {}).get('content_events.view', 0)
        
        # Extract user insights
        if 'aggregated_metrics' in user_behavior:
            agg_metrics = user_behavior['aggregated_metrics']
            kpis['avg_engagement_rate'] = agg_metrics.get('avg_engagement_score', 0)
            kpis['active_users'] = user_behavior.get('total_journeys', 0)
        
        # Extract content insights
        if 'summary_statistics' in content_performance:
            summary = content_performance['summary_statistics']
            kpis['avg_content_engagement'] = summary.get('avg_engagement_rate', 0)
        
        dashboard_data = {
            'kpis': kpis,
            'realtime_metrics': realtime_metrics,
            'user_behavior': user_behavior,
            'content_performance': content_performance,
            'period': {
                'hours': lookback_hours,
                'start_time': (datetime.now() - timedelta(hours=lookback_hours)).isoformat(),
                'end_time': datetime.now().isoformat()
            }
        }
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Analytics dashboard failed: {str(e)}")
        return jsonify({
            'error': 'Analytics dashboard failed',
            'message': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def status():
    """Detailed status endpoint"""
    return jsonify({
        'service': 'Swaggo Data Science Server',
        'status': 'running',
        'version': '2.0.0',
        'environment': DS_ENV,
        'port': DS_PORT,
        'backend_api': API_BASE_URL,
        'cache_status': 'redis' if redis_client else 'memory',
        'endpoints': {
            '/api/health': 'Health check',
            '/api/analyze': 'Data analysis',
            '/api/predict': 'ML predictions (deprecated - use /api/ml/predict)',
            '/api/ml/train': 'Train ML models',
            '/api/ml/predict': 'ML predictions',
            '/api/ml/models': 'List ML models',
            '/api/analytics/track': 'Track user activity (legacy)',
            '/api/analytics/user/<id>': 'Get user analytics (legacy)',
            '/api/analytics/content-performance': 'Analyze content performance (legacy)',
            '/api/ai/moderate-content': 'AI-powered content moderation',
            '/api/ai/generate-tags': 'Intelligent content tagging',
            '/api/ai/personalize/update-profile': 'Update user personalization profile',
            '/api/ai/personalize/score': 'Get personalized content score',
            '/api/ai/personalize/recommendations': 'Get personalized recommendations',
            '/api/ai/notifications/should-send': 'Smart notification timing',
            '/api/ai/content-pipeline': 'Complete AI content processing pipeline',
            '/api/analytics/pipeline/track-user-event': 'Track user event (advanced pipeline)',
            '/api/analytics/pipeline/track-content-event': 'Track content event (advanced pipeline)',
            '/api/analytics/pipeline/realtime-metrics': 'Get real-time metrics',
            '/api/analytics/pipeline/user-behavior': 'Get user behavior insights',
            '/api/analytics/pipeline/content-performance': 'Get content performance insights (advanced)',
            '/api/analytics/dashboard': 'Get comprehensive analytics dashboard data',
            '/api/recommendations/update': 'Update user preferences',
            '/api/recommendations/get': 'Get content recommendations',
            '/api/text/sentiment': 'Text sentiment analysis',
            '/api/text/keywords': 'Extract keywords from text',
            '/api/status': 'Service status'
        },
        'libraries': {
            'pandas': pd.__version__,
            'numpy': np.__version__,
            'scikit-learn': '1.3.0',
            'textblob': '0.17.1',
            'flask': '2.3.3'
        },
        'services': {
            'ml_predictor': 'active',
            'analytics_service': 'active (legacy)',
            'recommendation_engine': 'active (legacy)',
            'analytics_pipeline': 'active (advanced)',
            'ai_moderation_engine': 'active',
            'ai_tagging_engine': 'active',
            'ai_personalization_engine': 'active',
            'ai_notification_engine': 'active'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info(f"🔬 Starting Swaggo Data Science Server")
    logger.info(f"   Port: {DS_PORT}")
    logger.info(f"   Environment: {DS_ENV}")
    logger.info(f"   Backend API: {API_BASE_URL}")
    
    app.run(
        host='0.0.0.0',
        port=DS_PORT,
        debug=(DS_ENV == 'development')
    )