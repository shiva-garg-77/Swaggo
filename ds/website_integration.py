import requests
import json
from datetime import datetime
import asyncio
import aiohttp
from typing import Dict, List, Any, Optional

class WebsiteAIIntegration:
    """Integration service to connect data science server with existing website AI functionality"""
    
    def __init__(self, backend_url="http://localhost:4000", frontend_url="http://localhost:3000"):
        self.backend_url = backend_url
        self.frontend_url = frontend_url
        self.session = requests.Session()
        
    def connect_to_ai_handler(self, data_insights):
        """Send data insights to the website's AI handler"""
        try:
            # Format data for AI processing
            ai_payload = {
                "type": "data_science_insights",
                "data": data_insights,
                "timestamp": datetime.now().isoformat(),
                "source": "ds_server"
            }
            
            # Send to backend GraphQL endpoint
            graphql_query = {
                "query": """
                    mutation ProcessDataInsights($input: DataInsightsInput!) {
                        processDataInsights(input: $input) {
                            success
                            insights
                            recommendations
                        }
                    }
                """,
                "variables": {
                    "input": ai_payload
                }
            }
            
            response = self.session.post(
                f"{self.backend_url}/graphql",
                json=graphql_query,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Backend connection failed: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"AI integration failed: {str(e)}"}
    
    def send_insights_to_frontend(self, insights):
        """Send insights to frontend components"""
        try:
            # Format for frontend consumption
            frontend_payload = {
                "type": "ai_insights",
                "insights": insights,
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "source": "data_science_server",
                    "version": "1.0.0"
                }
            }
            
            # This would typically use WebSocket or SSE for real-time updates
            # For now, we'll use a REST endpoint
            response = self.session.post(
                f"{self.frontend_url}/api/ai-insights",
                json=frontend_payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Frontend integration error: {e}")
            return False
    
    def get_user_context(self, user_id=None):
        """Get user context from the main website"""
        try:
            params = {"user_id": user_id} if user_id else {}
            
            response = self.session.get(
                f"{self.backend_url}/api/user/context",
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": "Failed to get user context"}
                
        except Exception as e:
            return {"error": f"Context retrieval failed: {str(e)}"}
    
    def enhance_ai_response(self, original_response, data_context):
        """Enhance AI responses with data science context"""
        try:
            enhanced_response = {
                "original": original_response,
                "data_insights": data_context,
                "enhanced_content": self._generate_enhanced_content(original_response, data_context),
                "visualizations": data_context.get("visualizations", {}),
                "recommendations": self._generate_data_recommendations(data_context),
                "timestamp": datetime.now().isoformat()
            }
            
            return enhanced_response
            
        except Exception as e:
            return {"error": f"Enhancement failed: {str(e)}"}
    
    def _generate_enhanced_content(self, original_response, data_context):
        """Generate enhanced content by combining AI response with data insights"""
        try:
            insights = data_context.get("insights", [])
            stats = data_context.get("descriptive_stats", {})
            
            enhanced_content = original_response
            
            # Add data context to response
            if insights:
                enhanced_content += "\n\n## Data Insights:\n"
                for insight in insights[:3]:  # Limit to top 3 insights
                    if isinstance(insight, dict):
                        message = insight.get("message", "")
                        enhanced_content += f"• {message}\n"
                    else:
                        enhanced_content += f"• {insight}\n"
            
            # Add statistical summary
            if stats:
                enhanced_content += "\n## Statistical Summary:\n"
                for column, column_stats in list(stats.items())[:2]:  # Limit to 2 columns
                    if isinstance(column_stats, dict):
                        mean_val = column_stats.get("mean")
                        if mean_val is not None:
                            enhanced_content += f"• **{column}**: Average = {mean_val:.2f}\n"
            
            return enhanced_content
            
        except Exception as e:
            return original_response + f"\n\n*Note: Enhanced content generation failed: {str(e)}*"
    
    def _generate_data_recommendations(self, data_context):
        """Generate actionable recommendations based on data insights"""
        recommendations = []
        
        try:
            insights = data_context.get("insights", [])
            correlations = data_context.get("correlations", {})
            outliers = data_context.get("outliers", {})
            
            # Recommendations based on data quality
            missing_values = data_context.get("missing_values", {})
            if missing_values.get("columns_with_missing"):
                recommendations.append({
                    "type": "data_quality",
                    "priority": "high",
                    "action": "Address missing data",
                    "description": f"Found missing values in {len(missing_values['columns_with_missing'])} columns"
                })
            
            # Recommendations based on correlations
            if isinstance(correlations, dict) and len(correlations) > 0:
                high_corr_count = 0
                for col1_corrs in correlations.values():
                    if isinstance(col1_corrs, dict):
                        for corr_val in col1_corrs.values():
                            if isinstance(corr_val, (int, float)) and abs(corr_val) > 0.8:
                                high_corr_count += 1
                
                if high_corr_count > 0:
                    recommendations.append({
                        "type": "feature_engineering",
                        "priority": "medium",
                        "action": "Investigate strong correlations",
                        "description": f"Found {high_corr_count} strong correlations for potential feature engineering"
                    })
            
            # Recommendations based on outliers
            if isinstance(outliers, dict):
                high_outlier_cols = [col for col, info in outliers.items() 
                                   if isinstance(info, dict) and info.get("percentage", 0) > 10]
                
                if high_outlier_cols:
                    recommendations.append({
                        "type": "outlier_handling",
                        "priority": "medium",
                        "action": "Handle outliers",
                        "description": f"Columns {high_outlier_cols} have significant outliers"
                    })
            
            return recommendations
            
        except Exception as e:
            return [{"type": "error", "action": f"Recommendation generation failed: {str(e)}"}]
    
    async def async_send_insights(self, insights):
        """Async method to send insights to multiple endpoints"""
        tasks = []
        
        try:
            async with aiohttp.ClientSession() as session:
                # Send to backend
                tasks.append(self._async_post(session, f"{self.backend_url}/api/insights", insights))
                
                # Send to frontend
                tasks.append(self._async_post(session, f"{self.frontend_url}/api/ai-insights", insights))
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                return {
                    "backend_result": results[0] if len(results) > 0 else None,
                    "frontend_result": results[1] if len(results) > 1 else None
                }
                
        except Exception as e:
            return {"error": f"Async integration failed: {str(e)}"}
    
    async def _async_post(self, session, url, data):
        """Helper method for async POST requests"""
        try:
            async with session.post(url, json=data) as response:
                return {
                    "status": response.status,
                    "data": await response.json() if response.status == 200 else None
                }
        except Exception as e:
            return {"error": str(e)}
    
    def create_ai_enhanced_response(self, user_query, data_analysis_result):
        """Create an AI-enhanced response that combines user query with data analysis"""
        try:
            # Extract key insights
            insights = data_analysis_result.get("insights", [])
            stats = data_analysis_result.get("descriptive_stats", {})
            visualizations = data_analysis_result.get("visualizations", {})
            
            # Create enhanced response
            enhanced_response = {
                "query": user_query,
                "ai_response": self._generate_contextual_ai_response(user_query, data_analysis_result),
                "data_insights": insights,
                "statistical_summary": stats,
                "visualizations": visualizations,
                "recommendations": self._generate_data_recommendations(data_analysis_result),
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "data_points": len(data_analysis_result.get("basic_info", {}).get("shape", [0]))-1 or 0,
                    "features": len(data_analysis_result.get("basic_info", {}).get("columns", [])),
                    "confidence_score": self._calculate_confidence_score(data_analysis_result)
                }
            }
            
            return enhanced_response
            
        except Exception as e:
            return {"error": f"Enhanced response creation failed: {str(e)}"}
    
    def _generate_contextual_ai_response(self, user_query, data_analysis):
        """Generate contextual AI response based on user query and data analysis"""
        try:
            # Analyze query intent
            query_lower = user_query.lower()
            
            if any(keyword in query_lower for keyword in ['trend', 'pattern', 'correlation']):
                return self._generate_pattern_response(data_analysis)
            elif any(keyword in query_lower for keyword in ['outlier', 'anomaly', 'unusual']):
                return self._generate_outlier_response(data_analysis)
            elif any(keyword in query_lower for keyword in ['summary', 'overview', 'describe']):
                return self._generate_summary_response(data_analysis)
            elif any(keyword in query_lower for keyword in ['predict', 'forecast', 'model']):
                return self._generate_prediction_response(data_analysis)
            else:
                return self._generate_general_response(user_query, data_analysis)
                
        except Exception as e:
            return f"I encountered an error while analyzing your data: {str(e)}"
    
    def _generate_pattern_response(self, data_analysis):
        """Generate response focused on patterns and correlations"""
        correlations = data_analysis.get("correlations", {})
        
        if isinstance(correlations, dict) and correlations:
            strong_correlations = []
            for col1, col1_corrs in correlations.items():
                if isinstance(col1_corrs, dict):
                    for col2, corr_val in col1_corrs.items():
                        if isinstance(corr_val, (int, float)) and abs(corr_val) > 0.7 and col1 != col2:
                            strong_correlations.append((col1, col2, corr_val))
            
            if strong_correlations:
                response = "Based on my analysis of the data patterns, here are the key findings:\n\n"
                response += "**Strong Correlations Detected:**\n"
                for col1, col2, corr_val in strong_correlations[:3]:
                    relationship = "positive" if corr_val > 0 else "negative"
                    response += f"• {col1} and {col2}: {relationship} correlation ({corr_val:.3f})\n"
                
                response += "\n**Insights:**\nThese correlations suggest meaningful relationships between variables that could be valuable for predictive modeling or business decision-making."
                return response
        
        return "I've analyzed the data for patterns, but no strong correlations were detected in this dataset. This could indicate independent variables or require deeper analysis techniques."
    
    def _generate_outlier_response(self, data_analysis):
        """Generate response focused on outliers and anomalies"""
        outliers = data_analysis.get("outliers", {})
        
        if isinstance(outliers, dict) and outliers:
            response = "Here's my analysis of outliers and anomalies in your data:\n\n"
            
            high_outlier_cols = []
            for col, outlier_info in outliers.items():
                if isinstance(outlier_info, dict):
                    percentage = outlier_info.get("percentage", 0)
                    if percentage > 5:  # More than 5% outliers
                        high_outlier_cols.append((col, percentage))
            
            if high_outlier_cols:
                response += "**Columns with Significant Outliers:**\n"
                for col, percentage in high_outlier_cols:
                    response += f"• {col}: {percentage:.1f}% outliers detected\n"
                
                response += "\n**Recommendations:**\n"
                response += "• Investigate these outliers - they might represent important edge cases or data quality issues\n"
                response += "• Consider outlier treatment methods if they're affecting your analysis\n"
                response += "• Verify if outliers represent valid business scenarios"
                
                return response
        
        return "Good news! Your data appears to be relatively clean with minimal outliers detected. This suggests consistent data quality."
    
    def _generate_summary_response(self, data_analysis):
        """Generate comprehensive summary response"""
        basic_info = data_analysis.get("basic_info", {})
        stats = data_analysis.get("descriptive_stats", {})
        
        shape = basic_info.get("shape", [0, 0])
        response = f"Here's a comprehensive summary of your dataset:\n\n"
        response += f"**Dataset Overview:**\n"
        response += f"• Dimensions: {shape[0]} rows × {shape[1]} columns\n"
        response += f"• Missing values: {basic_info.get('null_count', 0)} cells\n"
        response += f"• Duplicate rows: {basic_info.get('duplicate_count', 0)}\n\n"
        
        if isinstance(stats, dict) and stats:
            response += "**Statistical Highlights:**\n"
            for col, col_stats in list(stats.items())[:3]:  # Show top 3 columns
                if isinstance(col_stats, dict):
                    mean_val = col_stats.get("mean")
                    std_val = col_stats.get("std")
                    if mean_val is not None and std_val is not None:
                        response += f"• **{col}**: Mean = {mean_val:.2f}, Std Dev = {std_val:.2f}\n"
        
        response += "\n**Data Quality Assessment:**\n"
        quality_score = self._calculate_quality_score(data_analysis)
        response += f"• Overall data quality score: {quality_score}/10\n"
        
        return response
    
    def _generate_prediction_response(self, data_analysis):
        """Generate response for prediction-related queries"""
        basic_info = data_analysis.get("basic_info", {})
        shape = basic_info.get("shape", [0, 0])
        
        response = "Based on my analysis, here's the machine learning readiness assessment:\n\n"
        
        # Check dataset size
        if shape[0] < 100:
            response += "⚠️ **Dataset Size**: Small dataset ({} rows) - consider gathering more data for robust models\n".format(shape[0])
        elif shape[0] < 1000:
            response += "✅ **Dataset Size**: Moderate size ({} rows) - suitable for basic modeling\n".format(shape[0])
        else:
            response += "✅ **Dataset Size**: Large dataset ({} rows) - excellent for advanced modeling\n".format(shape[0])
        
        # Check feature count
        if shape[1] > 1:
            response += f"✅ **Features**: {shape[1]} features available for modeling\n"
        
        # Check data quality
        missing_pct = (basic_info.get('null_count', 0) / (shape[0] * shape[1])) * 100 if shape[0] * shape[1] > 0 else 0
        if missing_pct < 5:
            response += "✅ **Data Quality**: Low missing data - ready for modeling\n"
        else:
            response += f"⚠️ **Data Quality**: {missing_pct:.1f}% missing data - preprocessing needed\n"
        
        response += "\n**Next Steps:**\n"
        response += "• Use the ML prediction endpoint to train models\n"
        response += "• Consider feature engineering for better performance\n"
        response += "• Validate models with cross-validation\n"
        
        return response
    
    def _generate_general_response(self, user_query, data_analysis):
        """Generate general response for other queries"""
        return f"I've analyzed your data in response to: '{user_query}'\n\nYour dataset contains valuable information that can be explored through various analytical approaches. Consider asking specific questions about patterns, outliers, summaries, or predictions to get more targeted insights."
    
    def _calculate_confidence_score(self, data_analysis):
        """Calculate confidence score for the analysis"""
        try:
            score = 10.0
            basic_info = data_analysis.get("basic_info", {})
            
            # Penalize for missing data
            shape = basic_info.get("shape", [1, 1])
            total_cells = shape[0] * shape[1]
            missing_pct = (basic_info.get('null_count', 0) / total_cells) * 100 if total_cells > 0 else 0
            score -= min(missing_pct / 10, 3)  # Up to 3 points penalty
            
            # Penalize for small dataset
            if shape[0] < 50:
                score -= 2
            elif shape[0] < 100:
                score -= 1
            
            # Penalize for few features
            if shape[1] < 3:
                score -= 1
            
            return max(0, min(10, score))
            
        except Exception:
            return 5.0  # Default medium confidence
    
    def _calculate_quality_score(self, data_analysis):
        """Calculate data quality score"""
        return min(10, max(1, int(self._calculate_confidence_score(data_analysis))))
    
    def close(self):
        """Close the integration session"""
        self.session.close()
