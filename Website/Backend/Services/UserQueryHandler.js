import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';
import Chat from '../Models/FeedModels/Chat.js';
import { GetUserProfileQuery, SearchUsersQuery, GetUserChatsQuery, GetUserStatusQuery } from './UserQueries.js';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview User Query Handler for CQRS implementation
 * @module UserQueryHandler
 */

class UserQueryHandler {
  /**
   * @constructor
   * @description Initialize user query handler
   */
  constructor() {
    // Register this handler with the query bus
    // This would typically be done in an initialization file
  }

  /**
   * Handle get user profile query
   * @param {GetUserProfileQuery} query - Get user profile query
   * @returns {Promise<Object>} User profile
   */
  async handleGetUserProfile(query) {
    try {
      const { userId } = query.criteria;

      // Find profile
      const profile = await Profile.findOne({ profileid: userId }).lean();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Find user for additional data
      const user = await User.findById(userId).lean();

      logger.debug('User profile retrieved', {
        userId: profile.profileid
      });

      return {
        ...profile,
        email: user?.email,
        createdAt: user?.createdAt,
        lastLoginAt: user?.lastLoginAt
      };
    } catch (error) {
      logger.error('Failed to get user profile', {
        error: error.message,
        criteria: query.criteria
      });
      throw error;
    }
  }

  /**
   * Handle search users query
   * @param {SearchUsersQuery} query - Search users query
   * @returns {Promise<Array>} Search results
   */
  async handleSearchUsers(query) {
    try {
      const { searchTerm } = query.criteria;
      const { limit = 50, offset = 0 } = query.options;

      // Search profiles
      const profiles = await Profile.find({
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { displayName: { $regex: searchTerm, $options: 'i' } }
        ],
        isActive: true
      })
      .limit(limit)
      .skip(offset)
      .sort({ displayName: 1 })
      .lean();

      logger.debug('Users searched', {
        searchTerm,
        resultCount: profiles.length
      });

      return profiles;
    } catch (error) {
      logger.error('Failed to search users', {
        error: error.message,
        criteria: query.criteria
      });
      throw error;
    }
  }

  /**
   * Handle get user chats query
   * @param {GetUserChatsQuery} query - Get user chats query
   * @returns {Promise<Array>} User chats
   */
  async handleGetUserChats(query) {
    try {
      const { userId } = query.criteria;
      const { limit = 50, offset = 0 } = query.options;

      // Find chats where user is a participant
      const chats = await Chat.find({
        participants: userId
      })
      .limit(limit)
      .skip(offset)
      .sort({ updatedAt: -1 })
      .lean();

      logger.debug('User chats retrieved', {
        userId,
        chatCount: chats.length
      });

      return chats;
    } catch (error) {
      logger.error('Failed to get user chats', {
        error: error.message,
        criteria: query.criteria
      });
      throw error;
    }
  }

  /**
   * Handle get user status query
   * @param {GetUserStatusQuery} query - Get user status query
   * @returns {Promise<Object>} User status
   */
  async handleGetUserStatus(query) {
    try {
      const { userId } = query.criteria;

      // Find profile for status
      const profile = await Profile.findOne({ profileid: userId }, { status: 1, lastSeen: 1 }).lean();

      if (!profile) {
        throw new Error('User not found');
      }

      logger.debug('User status retrieved', {
        userId
      });

      return {
        status: profile.status,
        lastSeen: profile.lastSeen
      };
    } catch (error) {
      logger.error('Failed to get user status', {
        error: error.message,
        criteria: query.criteria
      });
      throw error;
    }
  }

  /**
   * Handle query based on type
   * @param {Query} query - Query to handle
   * @returns {Promise<any>} Query result
   */
  async handle(query) {
    switch (query.queryType) {
      case 'GetUserProfile':
        return this.handleGetUserProfile(query);
      case 'SearchUsers':
        return this.handleSearchUsers(query);
      case 'GetUserChats':
        return this.handleGetUserChats(query);
      case 'GetUserStatus':
        return this.handleGetUserStatus(query);
      default:
        throw new Error(`Unsupported query type: ${query.queryType}`);
    }
  }
}

export default new UserQueryHandler();