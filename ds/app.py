from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import data science modules
from services.data_analysis import DataAnalyzer
from services.ml_models import MLPredictor
from services.ai_integration import AIProcessor
from utils.data_utils import DataProcessor
from config.settings import Config

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:4000"])  # Allow frontend connections

# Initialize services
data_analyzer = DataAnalyzer()
ml_predictor = MLPredictor()
ai_processor = AIProcessor()
data_processor = DataProcessor()

@app.route('/')
def home():
    """Home endpoint for data science server"""
    return jsonify({
        "message": "Swaggo Data Science Server is running!",
        "status": "active",
        "version": "1.0.0",
        "endpoints": [
            "/api/analyze",
            "/api/predict",
            "/api/process",
            "/api/health",
            "/api/ai-insights"
        ]
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "data_analyzer": "active",
            "ml_predictor": "active",
            "ai_processor": "active"
        }
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """Analyze uploaded data"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Process the data
        processed_data = data_processor.clean_data(data)
        analysis_result = data_analyzer.analyze(processed_data)
        
        return jsonify({
            "success": True,
            "analysis": analysis_result,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def make_prediction():
    """Make ML predictions"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        prediction = ml_predictor.predict(data)
        
        return jsonify({
            "success": True,
            "prediction": prediction,
            "confidence": ml_predictor.get_confidence(),
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai-insights', methods=['POST'])
def get_ai_insights():
    """Get AI-powered insights from data"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        insights = ai_processor.generate_insights(data)
        
        return jsonify({
            "success": True,
            "insights": insights,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/process', methods=['POST'])
def process_data():
    """Process and clean data"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        processed = data_processor.process(data)
        
        return jsonify({
            "success": True,
            "processed_data": processed,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_data():
    """Upload and process data files"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Process uploaded file
        result = data_processor.process_file(file)
        
        return jsonify({
            "success": True,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
