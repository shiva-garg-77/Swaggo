import { useState, useCallback, useEffect } from 'react';
import SentimentAnalysisService from '../services/SentimentAnalysisService';

/**
 * 😊 Sentiment Analysis Hook
 * 
 * Provides AI-powered message sentiment analysis functionality
 * 
 * Features:
 * - Real-time message sentiment analysis
 * - Batch sentiment analysis
 * - Sentiment definitions
 * - Performance metrics
 * - Error handling
 */

export const useSentimentAnalysis = () => {
  const [sentimentDefinitions, setSentimentDefinitions] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [metrics, setMetrics] = useState(null);

  /**
   * Analyze sentiment of a single message
   * @param {string} message - Message content to analyze
   * @param {object} context - User context for personalization
   * @returns {Promise<object>} Sentiment analysis result
   */
  const analyzeSentiment = useCallback(async (message, context = {}) => {
    if (!message?.trim()) {
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0
      };
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const result = await SentimentAnalysisService.analyzeSentiment(message, context);
      
      return result;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      setAnalysisError(error.message || 'Failed to analyze sentiment');
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0.1
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Batch analyze sentiment for multiple messages
   * @param {Array} messages - Array of messages to analyze
   * @returns {Promise<Array>} Array of sentiment analysis results
   */
  const batchAnalyze = useCallback(async (messages) => {
    if (!messages || messages.length === 0) {
      return [];
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      const results = await SentimentAnalysisService.batchAnalyze(messages);
      
      return results;
    } catch (error) {
      console.error('Batch sentiment analysis error:', error);
      setAnalysisError(error.message || 'Failed to analyze sentiment for messages');
      return messages.map(() => ({
        sentiment: 'neutral',
        score: 0,
        confidence: 0.1
      }));
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Get sentiment definitions
   * @returns {Promise<object>} Sentiment definitions
   */
  const getDefinitions = useCallback(async () => {
    try {
      const result = await SentimentAnalysisService.getDefinitions();
      setSentimentDefinitions(result);
      return result;
    } catch (error) {
      console.error('Get sentiment definitions error:', error);
      return {};
    }
  }, []);

  /**
   * Get performance metrics
   * @returns {Promise<object>} Performance metrics
   */
  const getMetrics = useCallback(async () => {
    try {
      const result = await SentimentAnalysisService.getMetrics();
      setMetrics(result);
      return result;
    } catch (error) {
      console.error('Get metrics error:', error);
      return null;
    }
  }, []);

  /**
   * Initialize sentiment definitions
   */
  useEffect(() => {
    getDefinitions();
  }, [getDefinitions]);

  return {
    // State
    sentimentDefinitions,
    isAnalyzing,
    analysisError,
    metrics,
    
    // Functions
    analyzeSentiment,
    batchAnalyze,
    getDefinitions,
    getMetrics
  };
};

export default useSentimentAnalysis;