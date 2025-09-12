import pandas as pd
import numpy as np
import json
import requests
from datetime import datetime
import os
from typing import Dict, List, Any

class AIProcessor:
    """AI Integration Service for connecting with website AI features"""
    
    def __init__(self):
        self.backend_url = "http://localhost:4000"  # Your existing backend
        self.frontend_url = "http://localhost:3000"  # Your existing frontend
        self.insights_cache = {}
        
    def generate_insights(self, data):
        """Generate AI-powered insights from data"""
        try:
            # Convert data to DataFrame for analysis
            if isinstance(data, dict):
                if 'data' in data:
                    df = pd.DataFrame(data['data'])
                else:
                    df = pd.DataFrame([data])
            elif isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame(data)
            
            insights = []
            
            # Basic data insights
            insights.extend(self._generate_basic_insights(df))
            
            # Statistical insights
            insights.extend(self._generate_statistical_insights(df))
            
            # Business insights
            insights.extend(self._generate_business_insights(df))
            
            # Trend insights
            insights.extend(self._generate_trend_insights(df))
            
            return {
                "insights": insights,
                "data_summary": {
                    "rows": len(df),
                    "columns": len(df.columns),
                    "numeric_columns": len(df.select_dtypes(include=[np.number]).columns),
                    "categorical_columns": len(df.select_dtypes(include=['object']).columns)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"error": f"Insight generation failed: {str(e)}"}
    
    def _generate_basic_insights(self, df):
        """Generate basic data insights"""
        insights = []
        
        try:
            # Data quality insights
            total_cells = len(df) * len(df.columns)
            missing_cells = df.isnull().sum().sum()
            
            if missing_cells > 0:
                missing_percentage = (missing_cells / total_cells) * 100
                if missing_percentage > 20:
                    insights.append({
                        "type": "warning",
                        "category": "data_quality",
                        "message": f"⚠️ High missing data: {missing_percentage:.1f}% of values are missing",
                        "severity": "high",
                        "recommendation": "Consider data cleaning or imputation strategies"
                    })
                elif missing_percentage > 5:
                    insights.append({
                        "type": "info",
                        "category": "data_quality",
                        "message": f"ℹ️ Moderate missing data: {missing_percentage:.1f}% of values are missing",
                        "severity": "medium",
                        "recommendation": "Review missing data patterns"
                    })
            
            # Duplicate data insights
            duplicates = df.duplicated().sum()
            if duplicates > 0:
                duplicate_percentage = (duplicates / len(df)) * 100
                insights.append({
                    "type": "warning",
                    "category": "data_quality",
                    "message": f"🔄 Found {duplicates} duplicate rows ({duplicate_percentage:.1f}%)",
                    "severity": "medium",
                    "recommendation": "Consider removing or investigating duplicate records"
                })
            
            return insights
            
        except Exception as e:
            return [{"type": "error", "message": f"Basic insights generation failed: {str(e)}"}]
    
    def _generate_statistical_insights(self, df):
        """Generate statistical insights"""
        insights = []
        
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols[:5]:  # Limit to first 5 numeric columns
                col_data = df[col].dropna()
                
                if len(col_data) == 0:
                    continue
                
                # Outlier detection
                Q1 = col_data.quantile(0.25)
                Q3 = col_data.quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
                
                if len(outliers) > 0:
                    outlier_percentage = (len(outliers) / len(col_data)) * 100
                    if outlier_percentage > 10:
                        insights.append({
                            "type": "warning",
                            "category": "statistical",
                            "message": f"📊 Column '{col}' has many outliers ({outlier_percentage:.1f}%)",
                            "severity": "medium",
                            "recommendation": "Investigate unusual values in this column"
                        })
                
                # Distribution insights
                skewness = col_data.skew()
                if abs(skewness) > 2:
                    skew_type = "right-skewed" if skewness > 0 else "left-skewed"
                    insights.append({
                        "type": "info",
                        "category": "statistical",
                        "message": f"📈 Column '{col}' is highly {skew_type} (skewness: {skewness:.2f})",
                        "severity": "low",
                        "recommendation": "Consider data transformation for modeling"
                    })
            
            return insights
            
        except Exception as e:
            return [{"type": "error", "message": f"Statistical insights generation failed: {str(e)}"}]
    
    def _generate_business_insights(self, df):
        """Generate business-relevant insights"""
        insights = []
        
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            # Look for potential KPIs or important metrics
            for col in numeric_cols:
                col_lower = col.lower()
                
                # Revenue/Sales patterns
                if any(keyword in col_lower for keyword in ['revenue', 'sales', 'amount', 'price', 'cost']):
                    mean_val = df[col].mean()
                    median_val = df[col].median()
                    
                    if mean_val > median_val * 1.5:  # Mean significantly higher than median
                        insights.append({
                            "type": "insight",
                            "category": "business",
                            "message": f"💰 '{col}' shows high variability - few high values are skewing the average",
                            "severity": "medium",
                            "recommendation": "Investigate high-value transactions or outliers"
                        })
                
                # User/Customer metrics
                if any(keyword in col_lower for keyword in ['user', 'customer', 'client', 'account']):
                    unique_vals = df[col].nunique()
                    if unique_vals == len(df):
                        insights.append({
                            "type": "info",
                            "category": "business",
                            "message": f"👥 '{col}' appears to be unique identifiers",
                            "severity": "low",
                            "recommendation": "Good for customer-level analysis"
                        })
            
            # Time-based insights
            date_cols = df.select_dtypes(include=['datetime64']).columns
            for col in date_cols:
                date_range = df[col].max() - df[col].min()
                insights.append({
                    "type": "info",
                    "category": "business",
                    "message": f"📅 Data spans {date_range.days} days in column '{col}'",
                    "severity": "low",
                    "recommendation": "Consider seasonal or temporal patterns"
                })
            
            return insights
            
        except Exception as e:
            return [{"type": "error", "message": f"Business insights generation failed: {str(e)}"}]
    
    def _generate_trend_insights(self, df):
        """Generate trend and pattern insights"""
        insights = []
        
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            # Look for trends in sequential data
            if len(df) > 10:  # Need sufficient data for trend analysis
                for col in numeric_cols[:3]:  # Limit to first 3 columns
                    col_data = df[col].dropna()
                    
                    if len(col_data) > 5:
                        # Simple trend detection using correlation with index
                        trend_corr = col_data.corr(pd.Series(range(len(col_data))))
                        
                        if abs(trend_corr) > 0.7:
                            trend_direction = "increasing" if trend_corr > 0 else "decreasing"
                            insights.append({
                                "type": "insight",
                                "category": "trend",
                                "message": f"📈 Strong {trend_direction} trend detected in '{col}' (correlation: {trend_corr:.3f})",
                                "severity": "medium",
                                "recommendation": f"Monitor this {trend_direction} pattern for business implications"
                            })
            
            # Correlation insights
            if len(numeric_cols) >= 2:
                corr_matrix = df[numeric_cols].corr()
                
                # Find strong correlations
                for i in range(len(corr_matrix.columns)):
                    for j in range(i + 1, len(corr_matrix.columns)):
                        corr_val = corr_matrix.iloc[i, j]
                        
                        if abs(corr_val) > 0.8 and not np.isnan(corr_val):
                            col1, col2 = corr_matrix.columns[i], corr_matrix.columns[j]
                            relationship = "positive" if corr_val > 0 else "negative"
                            
                            insights.append({
                                "type": "insight",
                                "category": "relationship",
                                "message": f"🔗 Strong {relationship} correlation ({corr_val:.3f}) between '{col1}' and '{col2}'",
                                "severity": "high",
                                "recommendation": "Investigate this relationship for business insights or model features"
                            })
            
            return insights
            
        except Exception as e:
            return [{"type": "error", "message": f"Trend insights generation failed: {str(e)}"}]
    
    def integrate_with_website_ai(self, data, ai_type="general"):
        """Integrate with existing website AI functionality"""
        try:
            # This would integrate with your existing AI components
            integration_result = {
                "data_analysis": self.generate_insights(data),
                "ai_type": ai_type,
                "integration_status": "success",
                "recommendations": self._generate_ai_recommendations(data)
            }
            
            return integration_result
            
        except Exception as e:
            return {"error": f"AI integration failed: {str(e)}"}
    
    def _generate_ai_recommendations(self, data):
        """Generate AI-powered recommendations"""
        recommendations = []
        
        try:
            if isinstance(data, dict):
                df = pd.DataFrame([data]) if 'data' not in data else pd.DataFrame(data['data'])
            else:
                df = pd.DataFrame(data)
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            # Data preprocessing recommendations
            if df.isnull().sum().sum() > 0:
                recommendations.append({
                    "category": "data_preprocessing",
                    "action": "Handle missing values",
                    "priority": "high",
                    "description": "Consider imputation strategies or removal of incomplete records"
                })
            
            # Feature engineering recommendations
            if len(numeric_cols) > 5:
                recommendations.append({
                    "category": "feature_engineering",
                    "action": "Feature selection",
                    "priority": "medium",
                    "description": "Consider dimensionality reduction or feature selection techniques"
                })
            
            # Model recommendations
            if len(df) > 100 and len(numeric_cols) > 2:
                recommendations.append({
                    "category": "modeling",
                    "action": "Machine learning ready",
                    "priority": "high",
                    "description": "Dataset is suitable for machine learning model training"
                })
            
            return recommendations
            
        except Exception as e:
            return [{"category": "error", "action": f"Recommendation generation failed: {str(e)}"}]
    
    def get_cached_insights(self, data_hash):
        """Get cached insights for faster response"""
        return self.insights_cache.get(data_hash, None)
    
    def cache_insights(self, data_hash, insights):
        """Cache insights for future use"""
        self.insights_cache[data_hash] = insights
        
        # Limit cache size
        if len(self.insights_cache) > 100:
            # Remove oldest entries
            oldest_key = next(iter(self.insights_cache))
            del self.insights_cache[oldest_key]
