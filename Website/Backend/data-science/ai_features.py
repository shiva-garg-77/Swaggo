#!/usr/bin/env python3
"""
🤖 AI-Powered Features for Swaggo
Intelligent content moderation, auto-tagging, personalization, and smart features
"""

import re
import json
import logging
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import numpy as np
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics.pairwise import cosine_similarity
import hashlib
import os
import pickle

logger = logging.getLogger(__name__)

@dataclass
class ContentModerationResult:
    """Content moderation analysis result"""
    content_id: str
    is_safe: bool
    confidence_score: float
    detected_issues: List[str]
    severity_level: str  # 'low', 'medium', 'high', 'critical'
    recommended_action: str  # 'approve', 'review', 'reject', 'auto_flag'
    explanation: str
    timestamp: datetime

@dataclass
class ContentTag:
    """Intelligent content tag"""
    tag: str
    confidence: float
    category: str
    relevance_score: float

@dataclass
class PersonalizationProfile:
    """User personalization profile"""
    user_id: str
    interests: Dict[str, float]
    content_preferences: Dict[str, float]
    behavior_patterns: List[str]
    engagement_level: str
    last_updated: datetime

class ContentModerationEngine:
    """AI-powered content moderation system"""
    
    def __init__(self):
        self.toxic_patterns = self._load_toxic_patterns()
        self.spam_detector = self._init_spam_detector()
        self.profanity_filter = self._init_profanity_filter()
        self.sentiment_analyzer = TextBlob
        
    def _load_toxic_patterns(self) -> List[Dict]:
        """Load toxic content patterns"""
        return [
            {
                'pattern': r'\b(hate|kill|die|stupid|idiot)\s+\w+',
                'category': 'hate_speech',
                'severity': 'high'
            },
            {
                'pattern': r'\b(spam|fake|scam|click here|buy now)\b',
                'category': 'spam',
                'severity': 'medium'
            },
            {
                'pattern': r'\b\d{3}-\d{3}-\d{4}\b|\b\w+@\w+\.\w+\b',
                'category': 'personal_info',
                'severity': 'medium'
            },
            {
                'pattern': r'\b(fuck|shit|damn|hell|bitch)\b',
                'category': 'profanity',
                'severity': 'low'
            },
            {
                'pattern': r'\b(suicide|self-harm|hurt myself)\b',
                'category': 'self_harm',
                'severity': 'critical'
            },
            {
                'pattern': r'\b(violence|attack|bomb|weapon)\b',
                'category': 'violence',
                'severity': 'high'
            }
        ]
    
    def _init_spam_detector(self):
        """Initialize spam detection model"""
        # This is a simple implementation - in production, you'd use a trained model
        spam_keywords = [
            'buy now', 'click here', 'limited time', 'free money', 'winner',
            'congratulations', 'act now', 'urgent', 'exclusive', 'guaranteed'
        ]
        return spam_keywords
    
    def _init_profanity_filter(self):
        """Initialize profanity filter"""
        profanity_words = [
            'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'crap'
        ]
        return profanity_words
    
    def moderate_content(self, content: str, content_id: str = None) -> ContentModerationResult:
        """Perform comprehensive content moderation"""
        detected_issues = []
        severity_scores = []
        confidence_scores = []
        
        # Text preprocessing
        content_lower = content.lower()
        
        # Check for toxic patterns
        for pattern_info in self.toxic_patterns:
            matches = re.findall(pattern_info['pattern'], content_lower, re.IGNORECASE)
            if matches:
                detected_issues.append(pattern_info['category'])
                if pattern_info['severity'] == 'critical':
                    severity_scores.append(4)
                elif pattern_info['severity'] == 'high':
                    severity_scores.append(3)
                elif pattern_info['severity'] == 'medium':
                    severity_scores.append(2)
                else:
                    severity_scores.append(1)
                confidence_scores.append(0.8 + len(matches) * 0.1)  # Higher confidence with more matches
        
        # Sentiment analysis
        blob = TextBlob(content)
        sentiment_polarity = blob.sentiment.polarity
        
        if sentiment_polarity < -0.5:
            detected_issues.append('negative_sentiment')
            severity_scores.append(1)
            confidence_scores.append(abs(sentiment_polarity))
        
        # Spam detection
        spam_score = self._calculate_spam_score(content_lower)
        if spam_score > 0.6:
            detected_issues.append('spam')
            severity_scores.append(2)
            confidence_scores.append(spam_score)
        
        # Calculate overall severity and confidence
        if not severity_scores:
            max_severity = 0
            avg_confidence = 0.9  # High confidence for clean content
        else:
            max_severity = max(severity_scores)
            avg_confidence = sum(confidence_scores) / len(confidence_scores)
        
        # Determine severity level and recommended action
        if max_severity >= 4:
            severity_level = 'critical'
            recommended_action = 'reject'
            is_safe = False
        elif max_severity >= 3:
            severity_level = 'high'
            recommended_action = 'review'
            is_safe = False
        elif max_severity >= 2:
            severity_level = 'medium'
            recommended_action = 'auto_flag'
            is_safe = False
        elif max_severity >= 1:
            severity_level = 'low'
            recommended_action = 'review'
            is_safe = True  # Safe but flagged
        else:
            severity_level = 'safe'
            recommended_action = 'approve'
            is_safe = True
        
        # Generate explanation
        if detected_issues:
            explanation = f"Detected issues: {', '.join(set(detected_issues))}. "
            explanation += f"Severity: {severity_level}. "
            explanation += f"Recommended action: {recommended_action}."
        else:
            explanation = "Content appears safe and appropriate."
        
        return ContentModerationResult(
            content_id=content_id or f"content_{hash(content) % 10000}",
            is_safe=is_safe,
            confidence_score=round(avg_confidence, 3),
            detected_issues=list(set(detected_issues)),
            severity_level=severity_level,
            recommended_action=recommended_action,
            explanation=explanation,
            timestamp=datetime.now()
        )
    
    def _calculate_spam_score(self, content: str) -> float:
        """Calculate spam probability score"""
        spam_indicators = 0
        total_checks = len(self.spam_detector)
        
        for keyword in self.spam_detector:
            if keyword in content:
                spam_indicators += 1
        
        # Additional spam indicators
        if len(re.findall(r'[A-Z]{3,}', content)) > 2:  # Too many caps
            spam_indicators += 1
            total_checks += 1
        
        if len(re.findall(r'!{2,}', content)) > 0:  # Multiple exclamation marks
            spam_indicators += 1
            total_checks += 1
        
        if len(re.findall(r'\$\d+', content)) > 0:  # Money amounts
            spam_indicators += 1
            total_checks += 1
        
        return spam_indicators / max(total_checks, 1)

class IntelligentTaggingEngine:
    """AI-powered content tagging system"""
    
    def __init__(self):
        self.category_keywords = self._init_category_keywords()
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.tag_cache = {}
        
    def _init_category_keywords(self) -> Dict[str, List[str]]:
        """Initialize category-specific keywords"""
        return {
            'technology': [
                'ai', 'artificial intelligence', 'machine learning', 'python', 'javascript',
                'programming', 'coding', 'software', 'development', 'tech', 'innovation',
                'algorithm', 'data science', 'blockchain', 'cryptocurrency'
            ],
            'business': [
                'startup', 'entrepreneur', 'marketing', 'sales', 'revenue', 'profit',
                'strategy', 'management', 'leadership', 'investment', 'funding',
                'business model', 'growth', 'scaling', 'competition'
            ],
            'lifestyle': [
                'health', 'fitness', 'wellness', 'food', 'cooking', 'travel',
                'fashion', 'beauty', 'home', 'family', 'relationships', 'personal',
                'self-care', 'productivity', 'mindfulness'
            ],
            'education': [
                'learning', 'education', 'course', 'training', 'skill', 'knowledge',
                'study', 'university', 'student', 'teacher', 'academic', 'research',
                'tutorial', 'guide', 'how-to'
            ],
            'entertainment': [
                'movie', 'film', 'music', 'game', 'gaming', 'sports', 'celebrity',
                'news', 'funny', 'humor', 'meme', 'viral', 'trending', 'pop culture'
            ],
            'science': [
                'research', 'study', 'experiment', 'discovery', 'breakthrough',
                'analysis', 'theory', 'hypothesis', 'data', 'evidence', 'scientific',
                'biology', 'chemistry', 'physics', 'medicine'
            ]
        }
    
    def generate_tags(self, content: str, title: str = "", max_tags: int = 10) -> List[ContentTag]:
        """Generate intelligent tags for content"""
        # Combine title and content for analysis
        full_text = f"{title} {content}".lower()
        
        # Check cache first
        content_hash = hashlib.md5(full_text.encode()).hexdigest()
        if content_hash in self.tag_cache:
            return self.tag_cache[content_hash]
        
        tags = []
        
        # Category-based tagging
        category_scores = {}
        for category, keywords in self.category_keywords.items():
            score = 0
            matched_keywords = []
            for keyword in keywords:
                if keyword in full_text:
                    score += 1
                    matched_keywords.append(keyword)
            
            if score > 0:
                confidence = min(score / len(keywords), 1.0)
                category_scores[category] = confidence
                
                # Add category as a tag
                tags.append(ContentTag(
                    tag=category,
                    confidence=confidence,
                    category='topic',
                    relevance_score=confidence * 2
                ))
                
                # Add top matched keywords as tags
                for keyword in matched_keywords[:3]:  # Top 3 keywords per category
                    tags.append(ContentTag(
                        tag=keyword,
                        confidence=0.7,
                        category=category,
                        relevance_score=0.6
                    ))
        
        # Extract key phrases using TF-IDF
        try:
            # Fit vectorizer on the text
            tfidf_matrix = self.vectorizer.fit_transform([full_text])
            feature_names = self.vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            
            # Get top scoring words
            top_indices = scores.argsort()[-10:][::-1]
            for idx in top_indices:
                if scores[idx] > 0.1:  # Minimum relevance threshold
                    word = feature_names[idx]
                    if len(word) > 3 and word not in [tag.tag for tag in tags]:
                        tags.append(ContentTag(
                            tag=word,
                            confidence=float(scores[idx]),
                            category='keyword',
                            relevance_score=float(scores[idx])
                        ))
        except:
            # Fallback to simple word frequency if TF-IDF fails
            words = re.findall(r'\b\w{4,}\b', full_text)
            word_freq = Counter(words)
            for word, freq in word_freq.most_common(5):
                if word not in [tag.tag for tag in tags]:
                    tags.append(ContentTag(
                        tag=word,
                        confidence=min(freq / 10, 1.0),
                        category='keyword',
                        relevance_score=min(freq / 10, 1.0)
                    ))
        
        # Sentiment-based tags
        blob = TextBlob(full_text)
        sentiment = blob.sentiment
        
        if sentiment.polarity > 0.3:
            tags.append(ContentTag(
                tag='positive',
                confidence=float(sentiment.polarity),
                category='sentiment',
                relevance_score=0.5
            ))
        elif sentiment.polarity < -0.3:
            tags.append(ContentTag(
                tag='critical',
                confidence=float(abs(sentiment.polarity)),
                category='sentiment',
                relevance_score=0.5
            ))
        
        if sentiment.subjectivity > 0.7:
            tags.append(ContentTag(
                tag='opinion',
                confidence=float(sentiment.subjectivity),
                category='sentiment',
                relevance_score=0.4
            ))
        
        # Sort by relevance and limit to max_tags
        tags.sort(key=lambda x: x.relevance_score, reverse=True)
        final_tags = tags[:max_tags]
        
        # Cache results
        self.tag_cache[content_hash] = final_tags
        
        return final_tags

class PersonalizationEngine:
    """AI-powered personalization system"""
    
    def __init__(self):
        self.user_profiles = {}
        self.content_embeddings = {}
        self.interaction_weights = {
            'view': 1.0,
            'like': 2.0,
            'share': 3.0,
            'comment': 2.5,
            'save': 4.0,
            'follow': 3.0,
            'skip': -0.5,
            'hide': -2.0,
            'report': -5.0
        }
    
    def update_user_profile(self, user_id: str, content_tags: List[str], interaction_type: str, content_category: str = None):
        """Update user personalization profile based on interaction"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = PersonalizationProfile(
                user_id=user_id,
                interests={},
                content_preferences={},
                behavior_patterns=[],
                engagement_level='medium',
                last_updated=datetime.now()
            )
        
        profile = self.user_profiles[user_id]
        weight = self.interaction_weights.get(interaction_type, 1.0)
        
        # Update interests based on tags
        for tag in content_tags:
            if tag in profile.interests:
                profile.interests[tag] += weight * 0.1
            else:
                profile.interests[tag] = weight * 0.1
            
            # Cap interest levels
            profile.interests[tag] = min(profile.interests[tag], 10.0)
        
        # Update content preferences
        if content_category:
            if content_category in profile.content_preferences:
                profile.content_preferences[content_category] += weight * 0.2
            else:
                profile.content_preferences[content_category] = weight * 0.2
            
            profile.content_preferences[content_category] = min(profile.content_preferences[content_category], 10.0)
        
        # Update behavior patterns
        profile.behavior_patterns.append(interaction_type)
        if len(profile.behavior_patterns) > 50:  # Keep last 50 interactions
            profile.behavior_patterns = profile.behavior_patterns[-50:]
        
        # Calculate engagement level
        recent_interactions = profile.behavior_patterns[-20:]  # Last 20 interactions
        engagement_score = sum([self.interaction_weights.get(action, 0) for action in recent_interactions])
        
        if engagement_score > 30:
            profile.engagement_level = 'high'
        elif engagement_score > 10:
            profile.engagement_level = 'medium'
        else:
            profile.engagement_level = 'low'
        
        profile.last_updated = datetime.now()
    
    def get_personalized_score(self, user_id: str, content_tags: List[str], content_category: str = None) -> float:
        """Calculate personalized relevance score for content"""
        if user_id not in self.user_profiles:
            return 0.5  # Neutral score for new users
        
        profile = self.user_profiles[user_id]
        score = 0.0
        
        # Score based on interests
        for tag in content_tags:
            if tag in profile.interests:
                score += profile.interests[tag] * 0.1
        
        # Score based on content preferences
        if content_category and content_category in profile.content_preferences:
            score += profile.content_preferences[content_category] * 0.2
        
        # Engagement level multiplier
        if profile.engagement_level == 'high':
            score *= 1.2
        elif profile.engagement_level == 'low':
            score *= 0.8
        
        # Normalize score to 0-1 range
        return min(max(score / 10, 0.0), 1.0)
    
    def get_user_recommendations(self, user_id: str, content_pool: List[Dict], num_recommendations: int = 10) -> List[Dict]:
        """Get personalized content recommendations"""
        if not content_pool:
            return []
        
        recommendations = []
        
        for content in content_pool:
            content_tags = content.get('tags', [])
            content_category = content.get('category')
            
            # Calculate personalization score
            personalization_score = self.get_personalized_score(user_id, content_tags, content_category)
            
            # Add to recommendations with score
            content_with_score = content.copy()
            content_with_score['personalization_score'] = personalization_score
            recommendations.append(content_with_score)
        
        # Sort by personalization score
        recommendations.sort(key=lambda x: x['personalization_score'], reverse=True)
        
        return recommendations[:num_recommendations]

class SmartNotificationEngine:
    """AI-powered smart notification system with keyword-based notifications"""
    
    def __init__(self):
        self.notification_preferences = {}
        self.optimal_times = {}  # User optimal notification times
        self.keyword_alerts = {}  # User-defined keyword alerts
        self.mention_patterns = {
            'direct': r'@(\w+)',  # Direct mentions like @username
            'indirect': r'(\w+)\s+mentioned',  # Indirect mentions
        }
        self.urgency_keywords = {
            'critical': ['urgent', 'emergency', 'asap', 'critical', 'important'],
            'high': ['meeting', 'deadline', 'project', 'task', 'reminder'],
            'medium': ['update', 'status', 'progress', 'review'],
            'low': ['info', 'general', 'news', 'update']
        }
        
    def should_send_notification(self, user_id: str, notification_type: str, content_priority: str = 'medium') -> Tuple[bool, str]:
        """Determine if and when to send a notification"""
        current_time = datetime.now()
        
        # Check if it's a reasonable time to send notifications (9 AM - 9 PM)
        hour = current_time.hour
        if hour < 9 or hour > 21:
            return False, "Outside optimal hours"
        
        # Priority-based sending
        if content_priority == 'critical':
            return True, "Critical priority"
        
        # Check user preferences
        if user_id in self.notification_preferences:
            prefs = self.notification_preferences[user_id]
            if notification_type in prefs and not prefs[notification_type]:
                return False, "User disabled this notification type"
        
        # Check optimal times
        if user_id in self.optimal_times:
            optimal_hour = self.optimal_times[user_id]
            if abs(hour - optimal_hour) <= 2:  # Within 2 hours of optimal time
                return True, "Within optimal time window"
        
        # Default behavior for medium priority
        if content_priority == 'high':
            return True, "High priority"
        elif content_priority == 'medium':
            # Send medium priority notifications during peak hours
            if 10 <= hour <= 12 or 14 <= hour <= 16 or 19 <= hour <= 21:
                return True, "Peak engagement hours"
        
        return False, "Low priority outside peak hours"
    
    def add_keyword_alert(self, user_id: str, keyword: str, priority: str = 'medium', 
                         case_sensitive: bool = False, whole_word: bool = True):
        """Add a keyword alert for a user"""
        if user_id not in self.keyword_alerts:
            self.keyword_alerts[user_id] = []
        
        alert = {
            'keyword': keyword,
            'priority': priority,
            'case_sensitive': case_sensitive,
            'whole_word': whole_word,
            'created_at': datetime.now(),
            'active': True
        }
        
        self.keyword_alerts[user_id].append(alert)
        return True
    
    def remove_keyword_alert(self, user_id: str, keyword: str):
        """Remove a keyword alert for a user"""
        if user_id in self.keyword_alerts:
            self.keyword_alerts[user_id] = [
                alert for alert in self.keyword_alerts[user_id] 
                if alert['keyword'] != keyword
            ]
        return True
    
    def get_keyword_alerts(self, user_id: str):
        """Get all keyword alerts for a user"""
        return self.keyword_alerts.get(user_id, [])
    
    def analyze_message_for_keywords(self, message_content: str, user_id: str) -> Dict:
        """Analyze message content for keyword matches and mentions"""
        import re
        
        results = {
            'keyword_matches': [],
            'mentions': [],
            'urgency_level': 'low',
            'should_notify': False,
            'notification_reason': ''
        }
        
        if not message_content or user_id not in self.keyword_alerts:
            return results
        
        content_lower = message_content.lower()
        
        # Check for keyword matches
        for alert in self.keyword_alerts[user_id]:
            if not alert['active']:
                continue
                
            keyword = alert['keyword']
            search_content = content_lower if not alert['case_sensitive'] else message_content
            
            if alert['whole_word']:
                # Whole word matching
                pattern = r'\b' + re.escape(keyword) + r'\b'
                if re.search(pattern, search_content, re.IGNORECASE if not alert['case_sensitive'] else 0):
                    results['keyword_matches'].append({
                        'keyword': keyword,
                        'priority': alert['priority'],
                        'match_type': 'whole_word'
                    })
            else:
                # Partial matching
                if keyword.lower() in search_content.lower():
                    results['keyword_matches'].append({
                        'keyword': keyword,
                        'priority': alert['priority'],
                        'match_type': 'partial'
                    })
        
        # Check for mentions
        for pattern_name, pattern in self.mention_patterns.items():
            matches = re.findall(pattern, message_content, re.IGNORECASE)
            for match in matches:
                results['mentions'].append({
                    'mentioned_user': match,
                    'pattern_type': pattern_name
                })
        
        # Determine urgency level based on content
        for urgency_level, keywords in self.urgency_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                results['urgency_level'] = urgency_level
                break
        
        # Determine if notification should be sent
        if results['keyword_matches'] or results['mentions']:
            results['should_notify'] = True
            if results['keyword_matches']:
                results['notification_reason'] = f"Keyword match: {', '.join([m['keyword'] for m in results['keyword_matches']])}"
            if results['mentions']:
                results['notification_reason'] += f" | Mentions: {', '.join([m['mentioned_user'] for m in results['mentions']])}"
        
        return results
    
    def get_smart_notification_content(self, message_content: str, sender_name: str, 
                                     keyword_analysis: Dict) -> Dict:
        """Generate smart notification content based on analysis"""
        notification = {
            'title': '',
            'body': '',
            'priority': 'medium',
            'actions': [],
            'sound': 'default'
        }
        
        # Generate title based on context
        if keyword_analysis['mentions']:
            notification['title'] = f"@{sender_name} mentioned you"
            notification['priority'] = 'high'
            notification['sound'] = 'mention'
        elif keyword_analysis['keyword_matches']:
            notification['title'] = f"@{sender_name} - Keyword Alert"
            notification['priority'] = keyword_analysis['keyword_matches'][0]['priority']
        else:
            notification['title'] = f"New message from {sender_name}"
        
        # Generate body with smart truncation
        max_body_length = 100
        if len(message_content) > max_body_length:
            notification['body'] = message_content[:max_body_length-3] + "..."
        else:
            notification['body'] = message_content
        
        # Add context based on urgency
        if keyword_analysis['urgency_level'] in ['critical', 'high']:
            notification['priority'] = keyword_analysis['urgency_level']
            notification['sound'] = 'urgent'
        
        # Add quick actions
        notification['actions'] = [
            {'id': 'reply', 'title': 'Reply'},
            {'id': 'view', 'title': 'View Message'},
            {'id': 'mark_read', 'title': 'Mark as Read'}
        ]
        
        return notification

# Global instances
_moderation_engine = None
_tagging_engine = None
_personalization_engine = None
_notification_engine = None

def get_moderation_engine() -> ContentModerationEngine:
    """Get or create the global moderation engine instance"""
    global _moderation_engine
    if _moderation_engine is None:
        _moderation_engine = ContentModerationEngine()
    return _moderation_engine

def get_tagging_engine() -> IntelligentTaggingEngine:
    """Get or create the global tagging engine instance"""
    global _tagging_engine
    if _tagging_engine is None:
        _tagging_engine = IntelligentTaggingEngine()
    return _tagging_engine

def get_personalization_engine() -> PersonalizationEngine:
    """Get or create the global personalization engine instance"""
    global _personalization_engine
    if _personalization_engine is None:
        _personalization_engine = PersonalizationEngine()
    return _personalization_engine

def get_notification_engine() -> SmartNotificationEngine:
    """Get or create the global notification engine instance"""
    global _notification_engine
    if _notification_engine is None:
        _notification_engine = SmartNotificationEngine()
    return _notification_engine

if __name__ == "__main__":
    # Example usage
    print("🤖 Testing AI-Powered Features")
    
    # Test content moderation
    moderation = get_moderation_engine()
    test_content = "This is a great post about artificial intelligence and machine learning!"
    result = moderation.moderate_content(test_content)
    print(f"Moderation result: {result}")
    
    # Test intelligent tagging
    tagging = get_tagging_engine()
    tags = tagging.generate_tags(test_content, "AI and ML Guide")
    print(f"Generated tags: {[tag.tag for tag in tags]}")
    
    # Test personalization
    personalization = get_personalization_engine()
    personalization.update_user_profile("user123", [tag.tag for tag in tags], "like", "technology")
    score = personalization.get_personalized_score("user123", [tag.tag for tag in tags], "technology")
    print(f"Personalization score: {score}")