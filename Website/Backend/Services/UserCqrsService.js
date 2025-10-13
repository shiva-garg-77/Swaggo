import CommandBus from './CommandBus.js';
import QueryBus from './QueryBus.js';
import UserCommandHandler from './UserCommandHandler.js';
import UserQueryHandler from './UserQueryHandler.js';
import { 
  RegisterUserCommand, 
  UpdateUserProfileCommand, 
  UpdateUserStatusCommand, 
  DeleteUserCommand 
} from './UserCommands.js';
import { 
  GetUserProfileQuery, 
  SearchUsersQuery, 
  GetUserChatsQuery, 
  GetUserStatusQuery 
} from './UserQueries.js';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview User CQRS Service - Integration service for CQRS operations
 * @module UserCqrsService
 */

class UserCqrsService {
  /**
   * @constructor
   * @description Initialize user CQRS service
   */
  constructor() {
    // Register handlers
    CommandBus.registerHandler('RegisterUser', UserCommandHandler);
    CommandBus.registerHandler('UpdateUserProfile', UserCommandHandler);
    CommandBus.registerHandler('UpdateUserStatus', UserCommandHandler);
    CommandBus.registerHandler('DeleteUser', UserCommandHandler);

    QueryBus.registerHandler('GetUserProfile', UserQueryHandler);
    QueryBus.registerHandler('SearchUsers', UserQueryHandler);
    QueryBus.registerHandler('GetUserChats', UserQueryHandler);
    QueryBus.registerHandler('GetUserStatus', UserQueryHandler);

    logger.info('User CQRS service initialized');
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registered user
   */
  async registerUser(userData) {
    try {
      const command = new RegisterUserCommand(userData);
      return await CommandBus.dispatch(command);
    } catch (error) {
      logger.error('Failed to register user via CQRS', {
        error: error.message,
        userData
      });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateUserProfile(userId, profileData) {
    try {
      const command = new UpdateUserProfileCommand(userId, profileData);
      return await CommandBus.dispatch(command);
    } catch (error) {
      logger.error('Failed to update user profile via CQRS', {
        error: error.message,
        userId,
        profileData
      });
      throw error;
    }
  }

  /**
   * Update user status
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated user
   */
  async updateUserStatus(userId, status) {
    try {
      const command = new UpdateUserStatusCommand(userId, status);
      return await CommandBus.dispatch(command);
    } catch (error) {
      logger.error('Failed to update user status via CQRS', {
        error: error.message,
        userId,
        status
      });
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    try {
      const command = new DeleteUserCommand(userId);
      return await CommandBus.dispatch(command);
    } catch (error) {
      logger.error('Failed to delete user via CQRS', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    try {
      const query = new GetUserProfileQuery(userId);
      return await QueryBus.dispatch(query);
    } catch (error) {
      logger.error('Failed to get user profile via CQRS', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Search users
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Search results
   */
  async searchUsers(searchTerm, options = {}) {
    try {
      const query = new SearchUsersQuery(searchTerm, options);
      return await QueryBus.dispatch(query);
    } catch (error) {
      logger.error('Failed to search users via CQRS', {
        error: error.message,
        searchTerm,
        options
      });
      throw error;
    }
  }

  /**
   * Get user chats
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User chats
   */
  async getUserChats(userId, options = {}) {
    try {
      const query = new GetUserChatsQuery(userId, options);
      return await QueryBus.dispatch(query);
    } catch (error) {
      logger.error('Failed to get user chats via CQRS', {
        error: error.message,
        userId,
        options
      });
      throw error;
    }
  }

  /**
   * Get user status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User status
   */
  async getUserStatus(userId) {
    try {
      const query = new GetUserStatusQuery(userId);
      return await QueryBus.dispatch(query);
    } catch (error) {
      logger.error('Failed to get user status via CQRS', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get registered command types
   * @returns {Array} Registered command types
   */
  getRegisteredCommands() {
    return CommandBus.getRegisteredCommands();
  }

  /**
   * Get registered query types
   * @returns {Array} Registered query types
   */
  getRegisteredQueries() {
    return QueryBus.getRegisteredQueries();
  }
}

export default new UserCqrsService();