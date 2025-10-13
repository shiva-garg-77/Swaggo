/**
 * Poll Service - Frontend service for interacting with poll API
 * 
 * This service provides a unified interface for managing polls
 * including creation, voting, and analytics.
 */

import apiService from './ApiService';

class PollService {
  /**
   * Create a new poll
   * @param {Object} pollData - Poll data
   * @returns {Promise} Created poll
   */
  async createPoll(pollData) {
    try {
      const response = await apiService.post('/api/polls', pollData);
      if (response.success) {
        return response.poll;
      } else {
        throw new Error(response.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }

  /**
   * Get poll by ID
   * @param {string} pollId - Poll ID
   * @returns {Promise} Poll data
   */
  async getPoll(pollId) {
    try {
      const response = await apiService.get(`/api/polls/${pollId}`);
      if (response.success) {
        return response.poll;
      } else {
        throw new Error(response.error || 'Failed to get poll');
      }
    } catch (error) {
      console.error('Error getting poll:', error);
      throw error;
    }
  }

  /**
   * Get polls by chat ID
   * @param {string} chatId - Chat ID
   * @param {Object} options - Query options
   * @returns {Promise} Array of polls
   */
  async getPollsByChat(chatId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.excludeClosed) queryParams.append('excludeClosed', options.excludeClosed);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      
      const response = await apiService.get(`/api/polls/chat/${chatId}?${queryParams}`);
      if (response.success) {
        return response.polls;
      } else {
        throw new Error(response.error || 'Failed to get polls');
      }
    } catch (error) {
      console.error('Error getting polls:', error);
      throw error;
    }
  }

  /**
   * Vote in a poll
   * @param {string} pollId - Poll ID
   * @param {Array} optionIds - Option IDs to vote for
   * @returns {Promise} Updated poll
   */
  async vote(pollId, optionIds) {
    try {
      const response = await apiService.post(`/api/polls/${pollId}/vote`, { optionIds });
      if (response.success) {
        return response.poll;
      } else {
        throw new Error(response.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    }
  }

  /**
   * Get poll results
   * @param {string} pollId - Poll ID
   * @returns {Promise} Poll results
   */
  async getResults(pollId) {
    try {
      const response = await apiService.get(`/api/polls/${pollId}/results`);
      if (response.success) {
        return response.results;
      } else {
        throw new Error(response.error || 'Failed to get results');
      }
    } catch (error) {
      console.error('Error getting results:', error);
      throw error;
    }
  }

  /**
   * Close a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise} Updated poll
   */
  async closePoll(pollId) {
    try {
      const response = await apiService.put(`/api/polls/${pollId}/close`);
      if (response.success) {
        return response.poll;
      } else {
        throw new Error(response.error || 'Failed to close poll');
      }
    } catch (error) {
      console.error('Error closing poll:', error);
      throw error;
    }
  }

  /**
   * Reopen a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise} Updated poll
   */
  async reopenPoll(pollId) {
    try {
      const response = await apiService.put(`/api/polls/${pollId}/reopen`);
      if (response.success) {
        return response.poll;
      } else {
        throw new Error(response.error || 'Failed to reopen poll');
      }
    } catch (error) {
      console.error('Error reopening poll:', error);
      throw error;
    }
  }

  /**
   * Delete a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise} Deletion result
   */
  async deletePoll(pollId) {
    try {
      const response = await apiService.delete(`/api/polls/${pollId}`);
      if (response.success) {
        return response;
      } else {
        throw new Error(response.error || 'Failed to delete poll');
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
      throw error;
    }
  }

  /**
   * Get poll analytics for a chat
   * @param {string} chatId - Chat ID
   * @param {Object} options - Analytics options
   * @returns {Promise} Analytics data
   */
  async getAnalytics(chatId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);
      
      const response = await apiService.get(`/api/polls/chat/${chatId}/analytics?${queryParams}`);
      if (response.success) {
        return response.analytics;
      } else {
        throw new Error(response.error || 'Failed to get analytics');
      }
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PollService();