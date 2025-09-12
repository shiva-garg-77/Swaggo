'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DS_SERVER_URL = 'http://localhost:5000';

const DataScienceIntegration = () => {
  const [dsStatus, setDsStatus] = useState('checking');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sampleData, setSampleData] = useState('');

  useEffect(() => {
    checkDataScienceServer();
  }, []);

  const checkDataScienceServer = async () => {
    try {
      const response = await fetch(`${DS_SERVER_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDsStatus('connected');
        console.log('Data Science server connected:', data);
      } else {
        setDsStatus('disconnected');
      }
    } catch (error) {
      console.error('DS server check failed:', error);
      setDsStatus('disconnected');
    }
  };

  const handleAnalyzeData = async () => {
    if (!sampleData.trim()) {
      setError('Please provide some data to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to parse as JSON, otherwise send as text
      let dataToAnalyze;
      try {
        dataToAnalyze = JSON.parse(sampleData);
      } catch {
        // If not valid JSON, create simple array from text
        dataToAnalyze = sampleData.split('\n')
          .map(line => line.split(','))
          .filter(row => row.length > 1);
      }

      const response = await fetch(`${DS_SERVER_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToAnalyze })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      setAnalysis(result);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sample = `[
  {"name": "Alice", "age": 25, "salary": 50000, "department": "Engineering"},
  {"name": "Bob", "age": 30, "salary": 60000, "department": "Sales"},
  {"name": "Charlie", "age": 35, "salary": 70000, "department": "Engineering"}
]`;
    setSampleData(sample);
  };

  const renderStatusIndicator = () => {
    const statusConfig = {
      checking: { color: 'text-yellow-500', bg: 'bg-yellow-100', text: 'Checking...', icon: '🔄' },
      connected: { color: 'text-green-500', bg: 'bg-green-100', text: 'Connected', icon: '🟢' },
      disconnected: { color: 'text-red-500', bg: 'bg-red-100', text: 'Disconnected', icon: '🔴' }
    };
    
    const config = statusConfig[dsStatus];
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
        <span className="mr-2">{config.icon}</span>
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔬 Data Science Integration</h1>
            <p className="text-blue-100">Analyze your data with AI-powered insights</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Server Status</div>
            {renderStatusIndicator()}
          </div>
        </div>
      </motion.div>

      {dsStatus === 'disconnected' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-semibold">Data Science Server Not Available</h3>
              <p className="text-red-700 text-sm mt-1">
                The Data Science server is not running.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Analysis</h2>
        
        <div className="mb-4">
          <label htmlFor="data-input" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your data (JSON format)
          </label>
          <textarea
            id="data-input"
            value={sampleData}
            onChange={(e) => setSampleData(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your data..."
          />
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            📝 Load Sample Data
          </button>
          <button
            onClick={handleAnalyzeData}
            disabled={loading || !sampleData.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>🔍 Analyze Data</>
            )}
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
          >
            <strong>Error:</strong> {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DataScienceIntegration;
