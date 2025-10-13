/**
 * AI Moderation Service - Frontend service for interacting with AI-powered content moderation
 * 
 * This service provides a unified interface for content moderation, intelligent tagging, 
 * and other AI-powered features.
 */

import apiService from './ApiService';

class AIModerationService {
  /**
   * Moderate content using AI-powered content moderation
   * @param {string} content - Content to moderate
   * @param {string} contentId - Optional content ID
   * @param {string} title - Optional content title
   * @returns {Promise} Moderation result
   */
  async moderateContent(content, contentId = null, title = null) {
    try {
      const response = await apiService.post('http://localhost:5000/api/ai/moderate-content', {
        content,
        content_id: contentId,
        title
      });
      
      if (response.success) {
        return response.moderation;
      } else {
        throw new Error(response.error || 'Failed to moderate content');
      }
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent tags for content
   * @param {string} content - Content to tag
   * @param {string} title - Optional content title
   * @param {number} maxTags - Maximum number of tags to generate
   * @returns {Promise} Array of tags
   */
  async generateTags(content, title = null, maxTags = 10) {
    try {
      const response = await apiService.post('http://localhost:5000/api/ai/generate-tags', {
        content,
        title,
        max_tags: maxTags
      });
      
      if (response.success) {
        return response.tags;
      } else {
        throw new Error(response.error || 'Failed to generate tags');
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      throw error;
    }
  }

  /**
   * Analyze sentiment of content
   * @param {string} text - Text to analyze
   * @returns {Promise} Sentiment analysis result
   */
  async analyzeSentiment(text) {
    try {
      const response = await apiService.post('http://localhost:5000/api/text/sentiment', {
        text
      });
      
      if (response.success) {
        return response.sentiment;
      } else {
        throw new Error(response.error || 'Failed to analyze sentiment');
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }

  /**
   * Run complete AI content processing pipeline
   * @param {string} content - Content to process
   * @param {string} userId - User ID
   * @param {string} title - Optional content title
   * @param {string} contentId - Optional content ID
   * @returns {Promise} Pipeline results
   */
  async runContentPipeline(content, userId, title = null, contentId = null) {
    try {
      const response = await apiService.post('http://localhost:5000/api/ai/content-pipeline', {
        content,
        user_id: userId,
        title,
        content_id: contentId
      });
      
      if (response.success) {
        return response.pipeline_results;
      } else {
        throw new Error(response.error || 'Failed to process content pipeline');
      }
    } catch (error) {
      console.error('Error running content pipeline:', error);
      throw error;
    }
  }

  /**
   * Update user personalization profile
   * @param {string} userId - User ID
   * @param {Array} tags - Content tags
   * @param {string} action - User action (like, dislike, view, etc.)
   * @param {string} category - Content category
   * @returns {Promise} Update result
   */
  async updateUserProfile(userId, tags, action, category = null) {
    try {
      const response = await apiService.post('http://localhost:5000/api/ai/personalize/update-profile', {
        user_id: userId,
        tags,
        action,
        category
      });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to update user profile');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get personalized content recommendations
   * @param {string} userId - User ID
   * @param {Array} contentPool - Content pool to recommend from
   * @param {number} numRecommendations - Number of recommendations
   * @returns {Promise} Recommendations
   */
  async getRecommendations(userId, contentPool, numRecommendations = 10) {
    try {
      const response = await apiService.post('http://localhost:5000/api/ai/personalize/recommendations', {
        user_id: userId,
        content_pool: contentPool,
        num_recommendations: numRecommendations
      });
      
      if (response.success) {
        return response.recommendations;
      } else {
        throw new Error(response.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Check if notification should be sent
   * @param {string} userId - User ID
   * @param {string} notificationType - Type of notification
   * @param {string} priority - Notification priority
   * @returns {Promise} Notification decision
   */
  async shouldSendNotification(userId, notificationType, priority) {
    try {
      const response = await apiService.post('http://localhost:5000/api/ai/notifications/should-send', {
        user_id: userId,
        notification_type: notificationType,
        priority
      });
      
      if (response.success) {
        return {
          shouldSend: response.should_send,
          reason: response.reason
        };
      } else {
        throw new Error(response.error || 'Failed to check notification');
      }
    } catch (error) {
      console.error('Error checking notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AIModerationService();