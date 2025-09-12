import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.svm import SVR, SVC
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import json
import os

class MLPredictor:
    """Machine Learning Prediction Service"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.model_info = {}
        self.confidence = 0.0
        
        # Available model types
        self.regression_models = {
            'linear': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100),
            'svr': SVR()
        }
        
        self.classification_models = {
            'logistic': LogisticRegression(),
            'random_forest': RandomForestClassifier(n_estimators=100),
            'svc': SVC(probability=True)
        }
    
    def train_model(self, data, target_column, model_type='auto', problem_type='auto'):
        """Train a machine learning model"""
        try:
            if isinstance(data, dict):
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame(data)
            
            if target_column not in df.columns:
                return {"error": f"Target column '{target_column}' not found"}
            
            # Prepare features and target
            X = df.drop(columns=[target_column])
            y = df[target_column]
            
            # Auto-detect problem type
            if problem_type == 'auto':
                if y.dtype == 'object' or len(y.unique()) < 10:
                    problem_type = 'classification'
                else:
                    problem_type = 'regression'
            
            # Preprocessing
            X_processed = self._preprocess_features(X, fit=True)
            
            if problem_type == 'classification':
                y_processed = self._encode_target(y, fit=True)
                model = self._get_classification_model(model_type)
            else:
                y_processed = y
                model = self._get_regression_model(model_type)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_processed, y_processed, test_size=0.2, random_state=42
            )
            
            # Train model
            model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test)
            
            if problem_type == 'classification':
                accuracy = accuracy_score(y_test, y_pred)
                metrics = {
                    'accuracy': float(accuracy),
                    'classification_report': classification_report(y_test, y_pred, output_dict=True)
                }
                self.confidence = accuracy
            else:
                mse = mean_squared_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                metrics = {
                    'mse': float(mse),
                    'r2_score': float(r2),
                    'rmse': float(np.sqrt(mse))
                }
                self.confidence = max(0, r2)  # R² can be negative, so ensure positive confidence
            
            # Store model
            model_name = f"{problem_type}_{model_type}_{target_column}"
            self.models[model_name] = model
            self.model_info[model_name] = {
                'problem_type': problem_type,
                'target_column': target_column,
                'features': list(X.columns),
                'metrics': metrics
            }
            
            # Save model to disk
            self._save_model(model_name, model)
            
            return {
                'success': True,
                'model_name': model_name,
                'problem_type': problem_type,
                'metrics': metrics,
                'features': list(X.columns)
            }
            
        except Exception as e:
            return {"error": f"Training failed: {str(e)}"}
    
    def predict(self, data, model_name=None):
        """Make predictions using trained model"""
        try:
            if isinstance(data, dict):
                df = pd.DataFrame([data])
            elif isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame(data)
            
            # If no model specified, use the most recent one
            if model_name is None:
                if not self.models:
                    return {"error": "No trained models available"}
                model_name = list(self.models.keys())[-1]
            
            if model_name not in self.models:
                # Try to load from disk
                if not self._load_model(model_name):
                    return {"error": f"Model '{model_name}' not found"}
            
            model = self.models[model_name]
            model_info = self.model_info[model_name]
            
            # Ensure all required features are present
            required_features = model_info['features']
            for feature in required_features:
                if feature not in df.columns:
                    df[feature] = 0  # Fill missing features with 0
            
            # Select and order features correctly
            X = df[required_features]
            
            # Preprocess features
            X_processed = self._preprocess_features(X, fit=False)
            
            # Make prediction
            predictions = model.predict(X_processed)
            
            # Get prediction probabilities if classification
            probabilities = None
            if model_info['problem_type'] == 'classification' and hasattr(model, 'predict_proba'):
                try:
                    probabilities = model.predict_proba(X_processed).tolist()
                except:
                    probabilities = None
            
            return {
                'success': True,
                'predictions': predictions.tolist() if hasattr(predictions, 'tolist') else predictions,
                'probabilities': probabilities,
                'model_used': model_name,
                'problem_type': model_info['problem_type']
            }
            
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}
    
    def get_confidence(self):
        """Get confidence score of the last prediction"""
        return float(self.confidence)
    
    def _preprocess_features(self, X, fit=False):
        """Preprocess features for training/prediction"""
        X_processed = X.copy()
        
        # Handle categorical variables
        categorical_cols = X_processed.select_dtypes(include=['object']).columns
        
        for col in categorical_cols:
            if fit:
                if col not in self.encoders:
                    self.encoders[col] = LabelEncoder()
                X_processed[col] = self.encoders[col].fit_transform(X_processed[col].astype(str))
            else:
                if col in self.encoders:
                    # Handle unseen categories
                    unique_vals = set(X_processed[col].astype(str))
                    known_vals = set(self.encoders[col].classes_)
                    unknown_vals = unique_vals - known_vals
                    
                    # Replace unknown values with the most frequent known value
                    if unknown_vals:
                        most_frequent = self.encoders[col].classes_[0]
                        X_processed[col] = X_processed[col].astype(str).replace(list(unknown_vals), most_frequent)
                    
                    X_processed[col] = self.encoders[col].transform(X_processed[col].astype(str))
                else:
                    # If encoder not found, fill with 0
                    X_processed[col] = 0
        
        # Scale numerical features
        numerical_cols = X_processed.select_dtypes(include=[np.number]).columns
        
        if len(numerical_cols) > 0:
            scaler_name = 'default'
            if fit:
                if scaler_name not in self.scalers:
                    self.scalers[scaler_name] = StandardScaler()
                X_processed[numerical_cols] = self.scalers[scaler_name].fit_transform(X_processed[numerical_cols])
            else:
                if scaler_name in self.scalers:
                    X_processed[numerical_cols] = self.scalers[scaler_name].transform(X_processed[numerical_cols])
        
        return X_processed
    
    def _encode_target(self, y, fit=False):
        """Encode target variable for classification"""
        target_encoder_name = 'target'
        
        if fit:
            if target_encoder_name not in self.encoders:
                self.encoders[target_encoder_name] = LabelEncoder()
            return self.encoders[target_encoder_name].fit_transform(y.astype(str))
        else:
            if target_encoder_name in self.encoders:
                return self.encoders[target_encoder_name].transform(y.astype(str))
            return y
    
    def _get_classification_model(self, model_type):
        """Get classification model"""
        if model_type == 'auto':
            return RandomForestClassifier(n_estimators=100)
        return self.classification_models.get(model_type, RandomForestClassifier(n_estimators=100))
    
    def _get_regression_model(self, model_type):
        """Get regression model"""
        if model_type == 'auto':
            return RandomForestRegressor(n_estimators=100)
        return self.regression_models.get(model_type, RandomForestRegressor(n_estimators=100))
    
    def _save_model(self, model_name, model):
        """Save model to disk"""
        try:
            model_path = f"models/{model_name}.pkl"
            os.makedirs("models", exist_ok=True)
            
            # Save model and preprocessors
            model_data = {
                'model': model,
                'scalers': self.scalers,
                'encoders': self.encoders,
                'model_info': self.model_info.get(model_name, {})
            }
            
            joblib.dump(model_data, model_path)
            return True
        except Exception as e:
            print(f"Failed to save model: {e}")
            return False
    
    def _load_model(self, model_name):
        """Load model from disk"""
        try:
            model_path = f"models/{model_name}.pkl"
            if os.path.exists(model_path):
                model_data = joblib.load(model_path)
                
                self.models[model_name] = model_data['model']
                self.scalers.update(model_data['scalers'])
                self.encoders.update(model_data['encoders'])
                self.model_info[model_name] = model_data['model_info']
                
                return True
        except Exception as e:
            print(f"Failed to load model: {e}")
        
        return False
    
    def list_models(self):
        """List all available models"""
        return {
            'loaded_models': list(self.models.keys()),
            'model_info': self.model_info
        }
