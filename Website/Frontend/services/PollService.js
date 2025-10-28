/**
 * Poll Service - Frontend service for managing polls
 * 
 * This service provides a client-side interface for interacting with the backend
 * poll API and managing local state.
 */

class PollService {
  constructor() {
    this.baseUrl = '/api/polls';
  }

  /**
   * Create a new poll
   * @param {Object} pollData - Poll data
   * @returns {Promise} Created poll
   */
  async createPoll(pollData) {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(pollData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create poll');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }

  /**
   * Get poll by ID
   * @param {string} pollId - Poll ID
   * @returns {Promise} Poll
   */
  async getPoll(pollId) {
    try {
      const response = await fetch(`${this.baseUrl}/${pollId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get poll');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting poll ${pollId}:`, error);
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
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(`${this.baseUrl}/chat/${chatId}${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get polls');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting polls for chat ${chatId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ optionIds })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to vote');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error voting in poll ${pollId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/${pollId}/results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get results');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting results for poll ${pollId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/${pollId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to close poll');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error closing poll ${pollId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/${pollId}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to reopen poll');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error reopening poll ${pollId}:`, error);
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
      const response = await fetch(`${this.baseUrl}/${pollId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete poll');
      }
      
      return result;
    } catch (error) {
      console.error(`Error deleting poll ${pollId}:`, error);
      throw error;
    }
  }

  /**
   * Get poll analytics
   * @param {string} chatId - Chat ID
   * @param {Object} options - Analytics options
   * @returns {Promise} Analytics data
   */
  async getAnalytics(chatId, options = {}) {
    try {
      const queryParams = new URLSearchParams(options).toString();
      const response = await fetch(`${this.baseUrl}/analytics/${chatId}${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get analytics');
      }
      
      return result.data;
    } catch (error) {
      console.error(`Error getting analytics for chat ${chatId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PollService();