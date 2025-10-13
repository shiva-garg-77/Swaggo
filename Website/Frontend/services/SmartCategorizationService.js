/**
 * Smart Categorization Service - Frontend service for AI-powered message categorization
 * 
 * This service provides intelligent message categorization using natural language processing
 * and machine learning techniques to automatically tag and categorize messages.
 */

import apiService from './ApiService';

class SmartCategorizationService {
  /**
   * Categorize a single message
   * @param {string} message - Message content to categorize
   * @param {object} context - User context for personalization
   * @returns {Promise} Categorization result
   */
  async categorizeMessage(message, context = {}) {
    try {
      const response = await apiService.post('/categorize', {
        message,
        context
      });
      
      return response.data;
    } catch (error) {
      console.error('Error categorizing message:', error);
      throw error;
    }
  }

  /**
   * Batch categorize multiple messages
   * @param {Array} messages - Array of messages to categorize
   * @returns {Promise} Array of categorization results
   */
  async batchCategorize(messages) {
    try {
      const response = await apiService.post('/categorize/batch', {
        messages
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in batch categorization:', error);
      throw error;
    }
  }

  /**
   * Get category definitions
   * @returns {Promise} Category definitions
   */
  async getCategories() {
    try {
      const response = await apiService.get('/categorize/categories');
      
      return response.data;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   * @returns {Promise} Performance metrics
   */
  async getMetrics() {
    try {
      const response = await apiService.get('/categorize/metrics');
      
      return response.data;
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Update category definitions
   * @param {string} category - Category name
   * @param {Array} keywords - Array of keywords
   * @param {number} weight - Weight value between 0 and 1
   * @returns {Promise} Update result
   */
  async updateCategory(category, keywords, weight) {
    try {
      const response = await apiService.put(`/categorize/categories/${category}`, {
        keywords,
        weight
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SmartCategorizationService();