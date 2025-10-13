/**
 * Sentiment Analysis Service - Frontend service for AI-powered message sentiment analysis
 * 
 * This service provides intelligent sentiment analysis using natural language processing
 * to determine the emotional tone of messages.
 */

import apiService from './ApiService';

class SentimentAnalysisService {
  /**
   * Analyze sentiment of a single message
   * @param {string} message - Message content to analyze
   * @param {object} context - User context for personalization
   * @returns {Promise} Sentiment analysis result
   */
  async analyzeSentiment(message, context = {}) {
    try {
      const response = await apiService.post('/sentiment', {
        message,
        context
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }

  /**
   * Batch analyze sentiment for multiple messages
   * @param {Array} messages - Array of messages to analyze
   * @returns {Promise} Array of sentiment analysis results
   */
  async batchAnalyze(messages) {
    try {
      const response = await apiService.post('/sentiment/batch', {
        messages
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in batch sentiment analysis:', error);
      throw error;
    }
  }

  /**
   * Get sentiment definitions
   * @returns {Promise} Sentiment definitions
   */
  async getDefinitions() {
    try {
      const response = await apiService.get('/sentiment/definitions');
      
      return response.data;
    } catch (error) {
      console.error('Error getting sentiment definitions:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   * @returns {Promise} Performance metrics
   */
  async getMetrics() {
    try {
      const response = await apiService.get('/sentiment/metrics');
      
      return response.data;
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SentimentAnalysisService();