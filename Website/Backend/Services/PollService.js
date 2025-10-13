/**
 * Poll Service - Handles poll creation, voting, and management
 * 
 * This service provides a centralized interface for managing polls
 * including creation, voting, results calculation, and analytics.
 * 
 * @module PollService
 * @version 1.0.0
 */

import Poll from '../Models/FeedModels/Poll.js';

class PollService {
  constructor() {
    this.config = {
      maxOptions: 10,
      maxQuestionLength: 200,
      maxOptionLength: 100,
      defaultPollDuration: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    // Start periodic cleanup
    this.startCleanup();
  }
  
  /**
   * Start periodic cleanup of expired polls
   */
  startCleanup() {
    // Run expired polls cleanup every hour
    setInterval(() => {
      this.closeExpiredPolls();
    }, 60 * 60 * 1000); // 1 hour
  }
  
  /**
   * Create a new poll
   * @param {Object} pollData - Poll data
   * @param {string} pollData.question - Poll question
   * @param {Array} pollData.options - Poll options
   * @param {string} pollData.createdBy - User ID who created the poll
   * @param {string} pollData.chatId - Chat ID where poll is created
   * @param {string} pollData.messageId - Message ID associated with poll
   * @param {Object} options - Additional options
   * @returns {Object} Created poll
   */
  async createPoll(pollData, options = {}) {
    try {
      // Validate poll data
      this.validatePollData(pollData);
      
      // Set default end date if not provided
      if (!pollData.endDate) {
        pollData.endDate = new Date(Date.now() + this.config.defaultPollDuration);
      }
      
      // Create poll
      const poll = await Poll.createPoll(pollData);
      
      console.log(`✅ Poll created: ${poll.pollId}`);
      return poll;
    } catch (error) {
      console.error('❌ Error creating poll:', error);
      throw error;
    }
  }
  
  /**
   * Validate poll data
   * @param {Object} pollData - Poll data to validate
   */
  validatePollData(pollData) {
    // Validate question
    if (!pollData.question || pollData.question.trim().length === 0) {
      throw new Error('Poll question is required');
    }
    
    if (pollData.question.length > this.config.maxQuestionLength) {
      throw new Error(`Poll question exceeds maximum length of ${this.config.maxQuestionLength} characters`);
    }
    
    // Validate options
    if (!pollData.options || !Array.isArray(pollData.options) || pollData.options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }
    
    if (pollData.options.length > this.config.maxOptions) {
      throw new Error(`Poll cannot have more than ${this.config.maxOptions} options`);
    }
    
    // Validate each option
    const optionTexts = new Set();
    for (const option of pollData.options) {
      if (!option.text || option.text.trim().length === 0) {
        throw new Error('Poll option text is required');
      }
      
      if (option.text.length > this.config.maxOptionLength) {
        throw new Error(`Poll option text exceeds maximum length of ${this.config.maxOptionLength} characters`);
      }
      
      // Check for duplicate options
      const optionText = option.text.trim().toLowerCase();
      if (optionTexts.has(optionText)) {
        throw new Error('Duplicate poll options are not allowed');
      }
      optionTexts.add(optionText);
      
      // Add option ID if not present
      if (!option.optionId) {
        option.optionId = `opt_${Math.random().toString(36).substr(2, 9)}`;
      }
    }
    
    // Validate required fields
    if (!pollData.createdBy) {
      throw new Error('Poll creator is required');
    }
    
    if (!pollData.chatId) {
      throw new Error('Chat ID is required');
    }
    
    if (!pollData.messageId) {
      throw new Error('Message ID is required');
    }
  }
  
  /**
   * Get poll by ID
   * @param {string} pollId - Poll ID
   * @returns {Object} Poll document
   */
  async getPoll(pollId) {
    try {
      const poll = await Poll.getByPollId(pollId);
      if (!poll) {
        throw new Error(`Poll not found: ${pollId}`);
      }
      
      return poll;
    } catch (error) {
      console.error(`❌ Error getting poll ${pollId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get polls by chat ID
   * @param {string} chatId - Chat ID
   * @param {Object} options - Query options
   * @returns {Array} Array of poll documents
   */
  async getPollsByChat(chatId, options = {}) {
    try {
      return await Poll.getByChatId(chatId, options);
    } catch (error) {
      console.error(`❌ Error getting polls for chat ${chatId}:`, error);
      throw error;
    }
  }
  
  /**
   * Vote in a poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID
   * @param {Array} optionIds - Option IDs to vote for
   * @returns {Object} Updated poll
   */
  async vote(pollId, userId, optionIds) {
    try {
      // Get poll
      const poll = await this.getPoll(pollId);
      
      // Add vote
      poll.addVote(userId, optionIds);
      
      // Save poll
      await poll.save();
      
      console.log(`✅ Vote recorded for poll ${pollId} by user ${userId}`);
      return poll;
    } catch (error) {
      console.error(`❌ Error voting in poll ${pollId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get poll results
   * @param {string} pollId - Poll ID
   * @returns {Object} Poll results
   */
  async getResults(pollId) {
    try {
      const poll = await this.getPoll(pollId);
      return {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.getResults(),
        totalVotes: poll.getVoteCount(),
        isClosed: poll.isClosed,
        endDate: poll.endDate,
        votersCount: poll.voters.length
      };
    } catch (error) {
      console.error(`❌ Error getting results for poll ${pollId}:`, error);
      throw error;
    }
  }
  
  /**
   * Close a poll
   * @param {string} pollId - Poll ID
   * @returns {Object} Updated poll
   */
  async closePoll(pollId) {
    try {
      const poll = await this.getPoll(pollId);
      poll.isClosed = true;
      await poll.save();
      
      console.log(`✅ Poll closed: ${pollId}`);
      return poll;
    } catch (error) {
      console.error(`❌ Error closing poll ${pollId}:`, error);
      throw error;
    }
  }
  
  /**
   * Reopen a poll
   * @param {string} pollId - Poll ID
   * @returns {Object} Updated poll
   */
  async reopenPoll(pollId) {
    try {
      const poll = await this.getPoll(pollId);
      
      // Reset end date if needed
      if (poll.endDate && new Date() > poll.endDate) {
        poll.endDate = new Date(Date.now() + this.config.defaultPollDuration);
      }
      
      poll.isClosed = false;
      await poll.save();
      
      console.log(`✅ Poll reopened: ${pollId}`);
      return poll;
    } catch (error) {
      console.error(`❌ Error reopening poll ${pollId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a poll
   * @param {string} pollId - Poll ID
   * @returns {Object} Deletion result
   */
  async deletePoll(pollId) {
    try {
      const result = await Poll.deleteOne({ pollId });
      
      if (result.deletedCount === 0) {
        throw new Error(`Poll not found: ${pollId}`);
      }
      
      console.log(`🗑️ Poll deleted: ${pollId}`);
      return { success: true, message: 'Poll deleted successfully' };
    } catch (error) {
      console.error(`❌ Error deleting poll ${pollId}:`, error);
      throw error;
    }
  }
  
  /**
   * Close expired polls
   * @returns {Object} Update result
   */
  async closeExpiredPolls() {
    try {
      const result = await Poll.closeExpiredPolls();
      console.log(`✅ Closed ${result.modifiedCount} expired polls`);
      return result;
    } catch (error) {
      console.error('❌ Error closing expired polls:', error);
      throw error;
    }
  }
  
  /**
   * Get poll analytics
   * @param {string} chatId - Chat ID
   * @param {Object} options - Analytics options
   * @returns {Object} Analytics data
   */
  async getAnalytics(chatId, options = {}) {
    try {
      const polls = await this.getPollsByChat(chatId, options);
      
      const analytics = {
        totalPolls: polls.length,
        totalVotes: 0,
        activePolls: 0,
        closedPolls: 0,
        mostVotedPoll: null,
        averageVotesPerPoll: 0,
        participationRate: 0
      };
      
      let maxVotes = 0;
      let totalVoters = 0;
      let uniqueVoters = new Set();
      
      polls.forEach(poll => {
        const voteCount = poll.getVoteCount();
        analytics.totalVotes += voteCount;
        
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          analytics.mostVotedPoll = {
            pollId: poll.pollId,
            question: poll.question,
            votes: voteCount
          };
        }
        
        if (poll.isClosed) {
          analytics.closedPolls++;
        } else {
          analytics.activePolls++;
        }
        
        // Track unique voters
        poll.voters.forEach(voter => uniqueVoters.add(voter));
        totalVoters += poll.voters.length;
      });
      
      analytics.averageVotesPerPoll = polls.length > 0 ? analytics.totalVotes / polls.length : 0;
      
      return analytics;
    } catch (error) {
      console.error(`❌ Error getting analytics for chat ${chatId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PollService();