import { useState, useCallback, useEffect } from 'react';
import SmartCategorizationService from '../services/SmartCategorizationService';

/**
 * 🧠 Smart Categorization Hook
 * 
 * Provides AI-powered message categorization functionality
 * 
 * Features:
 * - Real-time message categorization
 * - Batch categorization
 * - Category management
 * - Performance metrics
 * - Error handling
 */

export const useSmartCategorization = () => {
  const [categories, setCategories] = useState([]);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizationError, setCategorizationError] = useState(null);
  const [metrics, setMetrics] = useState(null);

  /**
   * Categorize a single message
   * @param {string} message - Message content to categorize
   * @param {object} context - User context for personalization
   * @returns {Promise<object>} Categorization result
   */
  const categorizeMessage = useCallback(async (message, context = {}) => {
    if (!message?.trim()) {
      return {
        categories: [],
        tags: [],
        keywords: [],
        confidence: 0
      };
    }

    try {
      setIsCategorizing(true);
      setCategorizationError(null);
      
      const result = await SmartCategorizationService.categorizeMessage(message, context);
      
      return result;
    } catch (error) {
      console.error('Categorization error:', error);
      setCategorizationError(error.message || 'Failed to categorize message');
      return {
        categories: ['uncategorized'],
        tags: ['message'],
        keywords: [],
        confidence: 0.1
      };
    } finally {
      setIsCategorizing(false);
    }
  }, []);

  /**
   * Batch categorize multiple messages
   * @param {Array} messages - Array of messages to categorize
   * @returns {Promise<Array>} Array of categorization results
   */
  const batchCategorize = useCallback(async (messages) => {
    if (!messages || messages.length === 0) {
      return [];
    }

    try {
      setIsCategorizing(true);
      setCategorizationError(null);
      
      const results = await SmartCategorizationService.batchCategorize(messages);
      
      return results;
    } catch (error) {
      console.error('Batch categorization error:', error);
      setCategorizationError(error.message || 'Failed to categorize messages');
      return messages.map(() => ({
        categories: ['uncategorized'],
        tags: ['message'],
        keywords: [],
        confidence: 0.1
      }));
    } finally {
      setIsCategorizing(false);
    }
  }, []);

  /**
   * Get category definitions
   * @returns {Promise<Array>} Category definitions
   */
  const getCategories = useCallback(async () => {
    try {
      const result = await SmartCategorizationService.getCategories();
      setCategories(result);
      return result;
    } catch (error) {
      console.error('Get categories error:', error);
      return {};
    }
  }, []);

  /**
   * Get performance metrics
   * @returns {Promise<object>} Performance metrics
   */
  const getMetrics = useCallback(async () => {
    try {
      const result = await SmartCategorizationService.getMetrics();
      setMetrics(result);
      return result;
    } catch (error) {
      console.error('Get metrics error:', error);
      return null;
    }
  }, []);

  /**
   * Initialize categories
   */
  useEffect(() => {
    getCategories();
  }, [getCategories]);

  return {
    // State
    categories,
    isCategorizing,
    categorizationError,
    metrics,
    
    // Functions
    categorizeMessage,
    batchCategorize,
    getCategories,
    getMetrics
  };
};

export default useSmartCategorization;