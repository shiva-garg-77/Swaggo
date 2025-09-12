import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.preprocessing import StandardScaler, LabelEncoder
import io
import base64
import json

class DataAnalyzer:
    """Data Analysis Service for comprehensive data insights"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.encoder = LabelEncoder()
    
    def analyze(self, data):
        """Perform comprehensive data analysis"""
        try:
            if isinstance(data, dict):
                if 'data' in data:
                    df = pd.DataFrame(data['data'])
                else:
                    df = pd.DataFrame([data])
            elif isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame(data)
            
            analysis_result = {
                "basic_info": self._get_basic_info(df),
                "descriptive_stats": self._get_descriptive_stats(df),
                "missing_values": self._analyze_missing_values(df),
                "data_types": self._analyze_data_types(df),
                "correlations": self._calculate_correlations(df),
                "outliers": self._detect_outliers(df),
                "visualizations": self._generate_visualizations(df)
            }
            
            return analysis_result
            
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}
    
    def _get_basic_info(self, df):
        """Get basic information about the dataset"""
        return {
            "shape": df.shape,
            "columns": list(df.columns),
            "memory_usage": df.memory_usage().sum(),
            "null_count": df.isnull().sum().sum(),
            "duplicate_count": df.duplicated().sum()
        }
    
    def _get_descriptive_stats(self, df):
        """Get descriptive statistics"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) == 0:
            return {"message": "No numeric columns found"}
        
        stats_dict = {}
        for col in numeric_cols:
            stats_dict[col] = {
                "mean": float(df[col].mean()) if not df[col].isna().all() else None,
                "median": float(df[col].median()) if not df[col].isna().all() else None,
                "std": float(df[col].std()) if not df[col].isna().all() else None,
                "min": float(df[col].min()) if not df[col].isna().all() else None,
                "max": float(df[col].max()) if not df[col].isna().all() else None,
                "count": int(df[col].count())
            }
        
        return stats_dict
    
    def _analyze_missing_values(self, df):
        """Analyze missing values"""
        missing_data = df.isnull().sum()
        missing_percentage = (missing_data / len(df)) * 100
        
        return {
            "missing_counts": missing_data.to_dict(),
            "missing_percentages": missing_percentage.to_dict(),
            "columns_with_missing": missing_data[missing_data > 0].index.tolist()
        }
    
    def _analyze_data_types(self, df):
        """Analyze data types"""
        return {
            "data_types": df.dtypes.astype(str).to_dict(),
            "numeric_columns": df.select_dtypes(include=[np.number]).columns.tolist(),
            "categorical_columns": df.select_dtypes(include=['object']).columns.tolist(),
            "datetime_columns": df.select_dtypes(include=['datetime64']).columns.tolist()
        }
    
    def _calculate_correlations(self, df):
        """Calculate correlations between numeric variables"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 2:
            return {"message": "Need at least 2 numeric columns for correlation"}
        
        corr_matrix = df[numeric_cols].corr()
        
        # Convert to serializable format
        correlations = {}
        for i, col1 in enumerate(corr_matrix.columns):
            correlations[col1] = {}
            for j, col2 in enumerate(corr_matrix.columns):
                if not np.isnan(corr_matrix.iloc[i, j]):
                    correlations[col1][col2] = float(corr_matrix.iloc[i, j])
        
        return correlations
    
    def _detect_outliers(self, df):
        """Detect outliers using IQR method"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        outliers = {}
        
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outlier_indices = df[(df[col] < lower_bound) | (df[col] > upper_bound)].index.tolist()
            outliers[col] = {
                "count": len(outlier_indices),
                "percentage": (len(outlier_indices) / len(df)) * 100,
                "bounds": {"lower": float(lower_bound), "upper": float(upper_bound)}
            }
        
        return outliers
    
    def _generate_visualizations(self, df):
        """Generate basic visualizations as base64 encoded images"""
        visualizations = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        try:
            if len(numeric_cols) > 0:
                # Histogram
                plt.figure(figsize=(12, 6))
                df[numeric_cols].hist(bins=20, figsize=(12, 6))
                plt.tight_layout()
                
                buffer = io.BytesIO()
                plt.savefig(buffer, format='png')
                buffer.seek(0)
                image_png = buffer.getvalue()
                buffer.close()
                
                graphic = base64.b64encode(image_png)
                visualizations['histograms'] = graphic.decode('utf-8')
                plt.close()
                
                # Correlation heatmap if multiple numeric columns
                if len(numeric_cols) > 1:
                    plt.figure(figsize=(10, 8))
                    corr = df[numeric_cols].corr()
                    sns.heatmap(corr, annot=True, cmap='coolwarm', center=0)
                    plt.title('Correlation Matrix')
                    
                    buffer = io.BytesIO()
                    plt.savefig(buffer, format='png')
                    buffer.seek(0)
                    image_png = buffer.getvalue()
                    buffer.close()
                    
                    graphic = base64.b64encode(image_png)
                    visualizations['correlation_heatmap'] = graphic.decode('utf-8')
                    plt.close()
            
            return visualizations
            
        except Exception as e:
            return {"error": f"Visualization generation failed: {str(e)}"}
    
    def generate_insights(self, df):
        """Generate AI-like insights from data analysis"""
        insights = []
        
        try:
            if isinstance(df, dict):
                df = pd.DataFrame(df)
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            # Data quality insights
            missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
            if missing_pct > 10:
                insights.append(f"⚠️ Dataset has {missing_pct:.1f}% missing values. Consider data cleaning.")
            
            # Distribution insights
            for col in numeric_cols[:3]:  # Limit to first 3 numeric columns
                skewness = stats.skew(df[col].dropna())
                if abs(skewness) > 1:
                    insights.append(f"📊 Column '{col}' is heavily skewed (skewness: {skewness:.2f})")
            
            # Correlation insights
            if len(numeric_cols) > 1:
                corr_matrix = df[numeric_cols].corr()
                high_corr_pairs = []
                for i in range(len(corr_matrix.columns)):
                    for j in range(i+1, len(corr_matrix.columns)):
                        corr_val = corr_matrix.iloc[i, j]
                        if abs(corr_val) > 0.8:
                            high_corr_pairs.append((corr_matrix.columns[i], corr_matrix.columns[j], corr_val))
                
                if high_corr_pairs:
                    for pair in high_corr_pairs[:2]:  # Limit to 2 pairs
                        insights.append(f"🔗 Strong correlation ({pair[2]:.2f}) between '{pair[0]}' and '{pair[1]}'")
            
            return insights
            
        except Exception as e:
            return [f"Error generating insights: {str(e)}"]
