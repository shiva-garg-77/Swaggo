import pandas as pd
import numpy as np
import json
import csv
from io import StringIO
import base64
from datetime import datetime
import hashlib

class DataProcessor:
    """Data Processing Utilities for cleaning and transforming data"""
    
    def __init__(self):
        self.supported_formats = ['csv', 'json', 'excel', 'xlsx', 'txt']
    
    def clean_data(self, data):
        """Clean and preprocess data"""
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
            
            # Store original shape
            original_shape = df.shape
            
            # Clean data
            cleaned_df = df.copy()
            
            # Handle missing values
            cleaned_df = self._handle_missing_values(cleaned_df)
            
            # Remove duplicates
            cleaned_df = cleaned_df.drop_duplicates()
            
            # Clean column names
            cleaned_df.columns = self._clean_column_names(cleaned_df.columns)
            
            # Convert data types
            cleaned_df = self._optimize_dtypes(cleaned_df)
            
            # Handle outliers (optional)
            cleaned_df = self._handle_outliers(cleaned_df)
            
            return {
                'cleaned_data': cleaned_df.to_dict('records'),
                'cleaning_summary': {
                    'original_shape': original_shape,
                    'cleaned_shape': cleaned_df.shape,
                    'rows_removed': original_shape[0] - cleaned_df.shape[0],
                    'columns_cleaned': len(cleaned_df.columns)
                }
            }
            
        except Exception as e:
            return {"error": f"Data cleaning failed: {str(e)}"}
    
    def process(self, data):
        """Process data with comprehensive transformations"""
        try:
            # First clean the data
            cleaned_result = self.clean_data(data)
            
            if 'error' in cleaned_result:
                return cleaned_result
            
            df = pd.DataFrame(cleaned_result['cleaned_data'])
            
            # Additional processing
            processed_df = df.copy()
            
            # Normalize numerical columns
            processed_df = self._normalize_numerical_columns(processed_df)
            
            # Encode categorical variables
            processed_df = self._encode_categorical_columns(processed_df)
            
            # Create features
            processed_df = self._create_features(processed_df)
            
            return {
                'processed_data': processed_df.to_dict('records'),
                'processing_summary': {
                    'cleaning_summary': cleaned_result['cleaning_summary'],
                    'features_created': len(processed_df.columns) - len(df.columns),
                    'final_shape': processed_df.shape
                }
            }
            
        except Exception as e:
            return {"error": f"Data processing failed: {str(e)}"}
    
    def process_file(self, file):
        """Process uploaded file"""
        try:
            filename = file.filename
            file_extension = filename.split('.')[-1].lower()
            
            if file_extension not in self.supported_formats:
                return {"error": f"Unsupported file format: {file_extension}"}
            
            # Read file content
            if file_extension == 'csv':
                df = pd.read_csv(file)
            elif file_extension == 'json':
                df = pd.read_json(file)
            elif file_extension in ['excel', 'xlsx']:
                df = pd.read_excel(file)
            else:  # txt or other formats
                content = file.read().decode('utf-8')
                # Try to parse as CSV first
                try:
                    df = pd.read_csv(StringIO(content))
                except:
                    # If CSV parsing fails, try JSON
                    try:
                        data = json.loads(content)
                        df = pd.DataFrame(data)
                    except:
                        return {"error": "Unable to parse file content"}
            
            # Process the data
            processed_result = self.process(df.to_dict('records'))
            
            if 'error' in processed_result:
                return processed_result
            
            return {
                'success': True,
                'filename': filename,
                'file_type': file_extension,
                'original_shape': df.shape,
                'processed_result': processed_result
            }
            
        except Exception as e:
            return {"error": f"File processing failed: {str(e)}"}
    
    def _handle_missing_values(self, df):
        """Handle missing values in the dataset"""
        for column in df.columns:
            if df[column].dtype in ['object', 'string']:
                # Fill categorical/text columns with mode or 'Unknown'
                mode_val = df[column].mode()
                if len(mode_val) > 0:
                    df[column].fillna(mode_val[0], inplace=True)
                else:
                    df[column].fillna('Unknown', inplace=True)
            else:
                # Fill numerical columns with median
                df[column].fillna(df[column].median(), inplace=True)
        
        return df
    
    def _clean_column_names(self, columns):
        """Clean column names"""
        cleaned_names = []
        for col in columns:
            # Convert to string and strip whitespace
            cleaned = str(col).strip()
            # Replace spaces with underscores
            cleaned = cleaned.replace(' ', '_')
            # Remove special characters
            cleaned = ''.join(c for c in cleaned if c.isalnum() or c == '_')
            # Convert to lowercase
            cleaned = cleaned.lower()
            cleaned_names.append(cleaned)
        
        return cleaned_names
    
    def _optimize_dtypes(self, df):
        """Optimize data types for memory efficiency"""
        for column in df.columns:
            if df[column].dtype == 'object':
                # Try to convert to datetime
                try:
                    df[column] = pd.to_datetime(df[column])
                    continue
                except:
                    pass
                
                # Try to convert to numeric
                try:
                    df[column] = pd.to_numeric(df[column])
                    continue
                except:
                    pass
            
            # Optimize integer types
            if df[column].dtype in ['int64']:
                if df[column].min() >= 0:
                    if df[column].max() <= 255:
                        df[column] = df[column].astype('uint8')
                    elif df[column].max() <= 65535:
                        df[column] = df[column].astype('uint16')
                    elif df[column].max() <= 4294967295:
                        df[column] = df[column].astype('uint32')
                else:
                    if df[column].min() >= -128 and df[column].max() <= 127:
                        df[column] = df[column].astype('int8')
                    elif df[column].min() >= -32768 and df[column].max() <= 32767:
                        df[column] = df[column].astype('int16')
                    elif df[column].min() >= -2147483648 and df[column].max() <= 2147483647:
                        df[column] = df[column].astype('int32')
            
            # Optimize float types
            elif df[column].dtype in ['float64']:
                df[column] = pd.to_numeric(df[column], downcast='float')
        
        return df
    
    def _handle_outliers(self, df, method='iqr'):
        """Handle outliers in numerical columns"""
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        for column in numeric_columns:
            if method == 'iqr':
                Q1 = df[column].quantile(0.25)
                Q3 = df[column].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                # Cap outliers instead of removing them
                df[column] = df[column].clip(lower_bound, upper_bound)
            
            elif method == 'zscore':
                z_scores = np.abs((df[column] - df[column].mean()) / df[column].std())
                df = df[z_scores < 3]  # Remove rows with z-score > 3
        
        return df
    
    def _normalize_numerical_columns(self, df):
        """Normalize numerical columns"""
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        for column in numeric_columns:
            # Min-max normalization
            min_val = df[column].min()
            max_val = df[column].max()
            
            if max_val != min_val:  # Avoid division by zero
                df[f'{column}_normalized'] = (df[column] - min_val) / (max_val - min_val)
        
        return df
    
    def _encode_categorical_columns(self, df):
        """Encode categorical columns"""
        categorical_columns = df.select_dtypes(include=['object']).columns
        
        for column in categorical_columns:
            # One-hot encoding for categorical variables with few unique values
            if df[column].nunique() <= 10:
                dummies = pd.get_dummies(df[column], prefix=column)
                df = pd.concat([df, dummies], axis=1)
            else:
                # Label encoding for high-cardinality categorical variables
                from sklearn.preprocessing import LabelEncoder
                le = LabelEncoder()
                df[f'{column}_encoded'] = le.fit_transform(df[column].astype(str))
        
        return df
    
    def _create_features(self, df):
        """Create additional features"""
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        
        # Create interaction features for first few numeric columns
        if len(numeric_columns) >= 2:
            for i, col1 in enumerate(numeric_columns[:3]):
                for col2 in numeric_columns[i+1:4]:
                    # Multiplication interaction
                    df[f'{col1}_x_{col2}'] = df[col1] * df[col2]
                    
                    # Ratio feature (avoid division by zero)
                    df[f'{col1}_div_{col2}'] = df[col1] / (df[col2] + 1e-8)
        
        # Create statistical features
        if len(numeric_columns) >= 3:
            # Row-wise statistics
            df['row_mean'] = df[numeric_columns[:5]].mean(axis=1)
            df['row_std'] = df[numeric_columns[:5]].std(axis=1)
            df['row_sum'] = df[numeric_columns[:5]].sum(axis=1)
        
        return df
    
    def generate_data_hash(self, data):
        """Generate hash for data caching"""
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def export_data(self, data, format='csv'):
        """Export processed data to different formats"""
        try:
            if isinstance(data, dict):
                df = pd.DataFrame(data)
            elif isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                df = data
            
            if format == 'csv':
                return df.to_csv(index=False)
            elif format == 'json':
                return df.to_json(orient='records', indent=2)
            elif format == 'excel':
                # For Excel, we'd need to save to file
                return df.to_excel('exported_data.xlsx', index=False)
            else:
                return {"error": f"Unsupported export format: {format}"}
                
        except Exception as e:
            return {"error": f"Export failed: {str(e)}"}
