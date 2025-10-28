import User from '../../Models/User.js';
import Profile from '../../Models/FeedModels/Profile.js';
import Followers from '../../Models/FeedModels/Followers.js';
import Following from '../../Models/FeedModels/Following.js';
import BlockedAccount from '../../Models/FeedModels/BlockedAccounts.js';
import RestrictedAccount from '../../Models/FeedModels/RestrictedAccounts.js';
import CloseFriends from '../../Models/FeedModels/CloseFriends.js';
import UserSettings from '../../Models/FeedModels/UserSettings.js';
import { v4 as uuidv4 } from 'uuid';
import BaseService from '../System/BaseService.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../../Helper/UnifiedErrorHandling.js';
import MongoDBSanitizer from '../../utils/MongoDBSanitizer.js';
import ProfileRepository from '../../Repositories/ProfileRepository.js';

/**
 * @fileoverview User service handling all user-related business logic
 * @module UserService
 */

class UserService extends BaseService {
  /**
   * @constructor
   * @description Initialize user service
   */
  constructor() {
    super();
    // Repository will be injected by the DI container
    this.profileRepository = null;
  }

  /**
   * Get user by username
   * @param {string} username - Username
   * @param {Object} currentUser - Current authenticated user (optional)
   * @returns {Promise<Object>} User profile
   */
  async getUserByUsername(username, currentUser = null) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ username }, ['username']);
      
      // 🔒 SECURITY FIX: Sanitize username to prevent MongoDB injection
      const sanitizedUsername = MongoDBSanitizer.sanitizeString(username);
      if (!sanitizedUsername) {
        throw new ValidationError('Invalid username');
      }
      
      const profile = await this.profileRepository.getProfileByUsername(sanitizedUsername);
      if (!profile) {
        throw new NotFoundError(`User with username ${sanitizedUsername} not found`);
      }
      
      return this.formatEntity(profile);
    }, 'getUserByUsername', { username });
  }

  /**
   * Create user profile
   * @param {string} username - Username
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} Created user profile
   */
  async createProfile(username, userData = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ username }, ['username']);
      
      // Check if the user already exists
      const existingUser = await this.profileRepository.getProfileByUsername(username);
      if (existingUser) {
        throw new ValidationError(`User with username ${username} already exists`);
      }
      
      const profile = new Profile({
        profileid: uuidv4(),
        username,
        ...userData
      });
      
      await profile.save();
      return this.formatEntity(profile);
    }, 'createProfile', { username });
  }

  /**
   * Update user profile
   * @param {string} profileId - Profile ID
   * @param {Object} updateData - Data to update
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(profileId, updateData, currentUser) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId, updateData, currentUser }, ['profileId', 'updateData', 'currentUser']);
      
      // Verify that the profileId matches the authenticated user's profile
      if (currentUser.profileid !== profileId) {
        throw new AuthorizationError('You can only update your own profile');
      }
      
      // Check if the new username exists (if username is being updated)
      if (updateData.username) {
        const existingProfile = await this.profileRepository.getProfileByUsername(updateData.username);
        if (existingProfile && existingProfile.profileid !== profileId) {
          throw new ValidationError(`Profile with username ${updateData.username} already exists`);
        }
      }
      
      const profile = await this.profileRepository.getProfileById(profileId);
      if (!profile) {
        throw new NotFoundError(`Profile not found for id ${profileId}`);
      }
      
      // Update the profile fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          profile[key] = updateData[key];
        }
      });
      
      await profile.save();
      return this.formatEntity(profile);
    }, 'updateProfile', { profileId });
  }

  /**
   * Delete user profile
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Deleted user profile
   */
  async deleteProfile(profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId }, ['profileId']);
      
      const profile = await this.profileRepository.deleteOne({ profileid: profileId });
      if (!profile) {
        throw new NotFoundError(`Profile with id ${profileId} not found`);
      }
      
      return this.formatEntity(profile);
    }, 'deleteProfile', { profileId });
  }

  /**
   * Toggle follow user
   * @param {string} profileId - Follower profile ID
   * @param {string} followId - Followed profile ID
   * @returns {Promise<Object>} Follow relationship
   */
  async toggleFollowUser(profileId, followId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId, followId }, ['profileId', 'followId']);
      
      // Check if the users exist
      const userProfile = await this.profileRepository.getProfileById(profileId);
      if (!userProfile) {
        throw new NotFoundError(`User with id ${profileId} does not exist`);
      }
      
      const followUser = await this.profileRepository.getProfileById(followId);
      if (!followUser) {
        throw new NotFoundError(`User with id ${followId} does not exist`);
      }
      
      // Check if the users are already a follower 
      const existingFollow = await Following.findOne({ profileid: profileId, followingid: followId });
      let result;
      
      if (existingFollow) {
        // Unfollow the user
        await Following.deleteOne({ profileid: profileId, followingid: followId });
        // Also remove the follower relationship
        await Followers.deleteOne({ profileid: followId, followerid: profileId });
        result = existingFollow;
      } else {
        // Follow the user
        const newFollow = new Following({ profileid: profileId, followingid: followId });
        const newFollower = new Followers({ profileid: followId, followerid: profileId });
        await newFollower.save();
        await newFollow.save();
        result = newFollow;
      }
      
      return this.formatEntity(result);
    }, 'toggleFollowUser', { profileId, followId });
  }

  /**
   * Get user followers
   * @param {string} profileId - Profile ID
   * @returns {Promise<Array>} Array of followers
   */
  async getFollowers(profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId }, ['profileId']);
      
      const followers = await Followers.find({ profileid: profileId });
      return this.formatEntities(followers);
    }, 'getFollowers', { profileId });
  }

  /**
   * Get user following
   * @param {string} profileId - Profile ID
   * @returns {Promise<Array>} Array of following
   */
  async getFollowing(profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId }, ['profileId']);
      
      const following = await Following.find({ profileid: profileId });
      return this.formatEntities(following);
    }, 'getFollowing', { profileId });
  }

  /**
   * Toggle block account
   * @param {string} profileId - User profile ID
   * @param {string} targetProfileId - Target profile ID
   * @returns {Promise<Object>} Block relationship
   */
  async toggleBlockAccount(profileId, targetProfileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId, targetProfileId }, ['profileId', 'targetProfileId']);
      
      // Check if the users exist
      const userProfile = await Profile.findOne({ profileid: profileId });
      if (!userProfile) {
        throw new NotFoundError(`User with id ${profileId} does not exist`);
      }
      
      const targetUser = await Profile.findOne({ profileid: targetProfileId });
      if (!targetUser) {
        throw new NotFoundError(`User with id ${targetProfileId} does not exist`);
      }
      
      // Check if already blocked
      const existingBlock = await BlockedAccount.findOne({ profileid: profileId, blockedprofileid: targetProfileId });
      let result;
      
      if (existingBlock) {
        // Unblock the user
        await BlockedAccount.deleteOne({ profileid: profileId, blockedprofileid: targetProfileId });
        result = existingBlock;
      } else {
        // Block the user
        const newBlock = new BlockedAccount({ 
          profileid: profileId, 
          blockedprofileid: targetProfileId,
          blockedAt: new Date()
        });
        await newBlock.save();
        result = newBlock;
      }
      
      return this.formatEntity(result);
    }, 'toggleBlockAccount', { profileId, targetProfileId });
  }

  /**
   * Toggle restrict account
   * @param {string} profileId - User profile ID
   * @param {string} targetProfileId - Target profile ID
   * @returns {Promise<Object>} Restrict relationship
   */
  async toggleRestrictAccount(profileId, targetProfileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId, targetProfileId }, ['profileId', 'targetProfileId']);
      
      // Check if the users exist
      const userProfile = await Profile.findOne({ profileid: profileId });
      if (!userProfile) {
        throw new NotFoundError(`User with id ${profileId} does not exist`);
      }
      
      const targetUser = await Profile.findOne({ profileid: targetProfileId });
      if (!targetUser) {
        throw new NotFoundError(`User with id ${targetProfileId} does not exist`);
      }
      
      // Check if already restricted
      const existingRestrict = await RestrictedAccount.findOne({ profileid: profileId, restrictedprofileid: targetProfileId });
      let result;
      
      if (existingRestrict) {
        // Remove restriction
        await RestrictedAccount.deleteOne({ profileid: profileId, restrictedprofileid: targetProfileId });
        result = existingRestrict;
      } else {
        // Restrict the user
        const newRestrict = new RestrictedAccount({ 
          profileid: profileId, 
          restrictedprofileid: targetProfileId,
          restrictedAt: new Date()
        });
        await newRestrict.save();
        result = newRestrict;
      }
      
      return this.formatEntity(result);
    }, 'toggleRestrictAccount', { profileId, targetProfileId });
  }

  /**
   * Toggle close friend
   * @param {string} profileId - User profile ID
   * @param {string} targetProfileId - Target profile ID
   * @returns {Promise<Object>} Close friend relationship
   */
  async toggleCloseFriend(profileId, targetProfileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId, targetProfileId }, ['profileId', 'targetProfileId']);
      
      // Check if the users exist
      const userProfile = await Profile.findOne({ profileid: profileId });
      if (!userProfile) {
        throw new NotFoundError(`User with id ${profileId} does not exist`);
      }
      
      const targetUser = await Profile.findOne({ profileid: targetProfileId });
      if (!targetUser) {
        throw new NotFoundError(`User with id ${targetProfileId} does not exist`);
      }
      
      // Check if already close friends
      const existingCloseFriend = await CloseFriends.findOne({ profileid: profileId, closefriendid: targetProfileId });
      let result;
      
      if (existingCloseFriend) {
        // Remove from close friends
        await CloseFriends.deleteOne({ profileid: profileId, closefriendid: targetProfileId });
        result = existingCloseFriend;
      } else {
        // Add to close friends
        const newCloseFriend = new CloseFriends({ 
          profileid: profileId, 
          closefriendid: targetProfileId,
          status: 'active',
          addedAt: new Date()
        });
        await newCloseFriend.save();
        result = newCloseFriend;
      }
      
      return this.formatEntity(result);
    }, 'toggleCloseFriend', { profileId, targetProfileId });
  }

  /**
   * Get user settings
   * @param {string} profileId - Profile ID
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} User settings
   */
  async getUserSettings(profileId, currentUser) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId, currentUser }, ['profileId', 'currentUser']);
      
      // Allow users to get their own settings or admin access
      if (currentUser && currentUser.profileid !== profileId) {
        throw new AuthorizationError('You can only access your own settings');
      }
      
      let settings = await UserSettings.findOne({ profileid: profileId });
      if (!settings) {
        // Create default settings if they don't exist
        settings = new UserSettings({ profileid: profileId });
        await settings.save();
      }
      
      return this.formatEntity(settings);
    }, 'getUserSettings', { profileId });
  }

  /**
   * Update user settings
   * @param {string} profileId - Profile ID
   * @param {Object} updateData - Settings to update
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Updated user settings
   */
  async updateUserSettings(profileId, updateData, currentUser) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId, updateData, currentUser }, ['profileId', 'updateData', 'currentUser']);
      
      // Allow users to update their own settings or admin access
      if (currentUser && currentUser.profileid !== profileId) {
        throw new AuthorizationError('You can only update your own settings');
      }
      
      let settings = await UserSettings.findOne({ profileid: profileId });
      if (!settings) {
        // Create settings if they don't exist
        settings = new UserSettings({ profileid: profileId });
      }
      
      // Update settings
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          settings[key] = updateData[key];
        }
      });
      
      settings.updatedAt = new Date();
      await settings.save();
      
      return this.formatEntity(settings);
    }, 'updateUserSettings', { profileId });
  }

  /**
   * Search users with pagination
   * @param {string} query - Search query
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated users with metadata
   */
  async searchUsersPaginated(query, paginationOptions = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ query }, ['query']);
      
      // 🔒 SECURITY FIX: Sanitize query to prevent MongoDB injection
      const sanitizedQuery = MongoDBSanitizer.sanitizeString(query);
      if (!sanitizedQuery) {
        throw new ValidationError('Invalid search query');
      }

      // 🔧 PAGINATION #83: Use the new paginated repository method
      const paginatedProfiles = await this.profileRepository.searchProfilesPaginated(sanitizedQuery, paginationOptions);

      return paginatedProfiles;
    }, 'searchUsersPaginated', { query, paginationOptions });
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of users
   */
  async searchUsers(query, options = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ query }, ['query']);
      
      // 🔒 SECURITY FIX: Sanitize query to prevent MongoDB injection
      const sanitizedQuery = MongoDBSanitizer.sanitizeString(query);
      if (!sanitizedQuery) {
        throw new ValidationError('Invalid search query');
      }
      
      const profiles = await this.profileRepository.searchProfiles(sanitizedQuery, options);
      return this.formatEntities(profiles);
    }, 'searchUsers', { query });
  }
}

export default UserService;