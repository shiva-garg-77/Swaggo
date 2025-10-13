import UserAggregate from './UserAggregate.js';
import EventSourcedRepository from '../Repositories/EventSourcedRepository.js';
import { logger } from '../utils/SanitizedLogger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview User Event Sourcing Service
 * @module UserEventSourcingService
 */

class UserEventSourcingService {
  /**
   * @constructor
   * @description Initialize user event sourcing service
   */
  constructor() {
    this.userRepository = new EventSourcedRepository(UserAggregate);
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registered user
   */
  async registerUser(userData) {
    try {
      // Create new user aggregate
      const user = this.userRepository.create();
      
      // Apply registration event
      user.create({
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName || userData.username
      });
      
      // Save the aggregate (this will commit the events)
      await this.userRepository.save(user);
      
      logger.info('User registered successfully', {
        userId: user.id,
        username: user.username
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      };
    } catch (error) {
      logger.error('Failed to register user', {
        error: error.message,
        userData
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    try {
      // Load user with snapshot optimization
      const user = await this.userRepository.getByIdWithSnapshot(userId);
      
      logger.debug('User retrieved', {
        userId: user.id
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      logger.error('Failed to get user', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated user
   */
  async updateUserProfile(userId, profileData) {
    try {
      // Load user
      const user = await this.userRepository.getByIdWithSnapshot(userId);
      
      // Apply update event
      user.updateProfile(profileData);
      
      // Save the aggregate
      await this.userRepository.save(user);
      
      logger.info('User profile updated', {
        userId: user.id
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      logger.error('Failed to update user profile', {
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
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} Updated user
   */
  async updateUserStatus(userId, isActive) {
    try {
      // Load user
      const user = await this.userRepository.getByIdWithSnapshot(userId);
      
      // Apply status change event
      user.updateStatus(isActive);
      
      // Save the aggregate
      await this.userRepository.save(user);
      
      logger.info('User status updated', {
        userId: user.id,
        isActive
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      logger.error('Failed to update user status', {
        error: error.message,
        userId,
        isActive
      });
      throw error;
    }
  }

  /**
   * Record user login
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async recordUserLogin(userId) {
    try {
      // Load user
      const user = await this.userRepository.getByIdWithSnapshot(userId);
      
      // Apply login event
      user.recordLogin();
      
      // Save the aggregate
      await this.userRepository.save(user);
      
      logger.info('User login recorded', {
        userId: user.id
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      logger.error('Failed to record user login', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Verify user email
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async verifyUserEmail(userId) {
    try {
      // Load user
      const user = await this.userRepository.getByIdWithSnapshot(userId);
      
      // Apply email verification event
      user.verifyEmail();
      
      // Save the aggregate
      await this.userRepository.save(user);
      
      logger.info('User email verified', {
        userId: user.id
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      logger.error('Failed to verify user email', {
        error: error.message,
        userId
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
      // Load user
      const user = await this.userRepository.getByIdWithSnapshot(userId);
      
      // Apply delete event
      user.delete();
      
      // Save the aggregate
      await this.userRepository.save(user);
      
      logger.info('User deleted', {
        userId: user.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete user', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get user events
   * @param {string} userId - User ID
   * @param {Date} since - Optional timestamp to get events since
   * @returns {Promise<Array>} User events
   */
  async getUserEvents(userId, since = null) {
    try {
      const events = await this.userRepository.getEvents(userId, since);
      
      logger.debug('User events retrieved', {
        userId,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      logger.error('Failed to get user events', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Replay user events
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Reconstructed user state
   */
  async replayUserEvents(userId) {
    try {
      // Create a new user aggregate
      const user = new UserAggregate(userId);
      
      // Get all events for this user
      const events = await this.getUserEvents(userId);
      
      // Replay events to reconstruct state
      await user.replayEvents(events);
      
      logger.info('User events replayed', {
        userId,
        eventCount: events.length
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        version: user.version
      };
    } catch (error) {
      logger.error('Failed to replay user events', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

export default new UserEventSourcingService();