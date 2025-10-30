import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';
import { RegisterUserCommand, UpdateUserProfileCommand, UpdateUserStatusCommand, DeleteUserCommand } from './UserCommands.js';
import EventPublisherService from './EventPublisherService.js';
import { logger } from '../utils/SanitizedLogger.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview User Command Handler for CQRS implementation
 * @module UserCommandHandler
 */

class UserCommandHandler {
  /**
   * @constructor
   * @description Initialize user command handler
   */
  constructor() {
    // Register this handler with the command bus
    // This would typically be done in an initialization file
  }

  /**
   * Handle user registration command
   * @param {RegisterUserCommand} command - Registration command
   * @returns {Promise<Object>} Registered user
   */
  async handleRegisterUser(command) {
    try {
      const { username, email, password, displayName } = command.payload;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate IDs
      const userId = uuidv4();
      const profileId = userId; // Use same ID for both

      // Create user
      const newUser = new User({
        id: userId,
        profileid: profileId, // ✅ Link to profile
        username,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newUser.save();

      // Create profile
      const newProfile = new Profile({
        profileid: profileId,
        userid: userId, // ✅ Link to user
        username,
        email,
        displayName: displayName || username,
        profilePic: 'https://www.tenforums.com/attachments/user-accounts-family-safety/322690d1615743307t-user-account-image-log-user.png',
        isVerified: false,
        isPrivate: false,
        isActive: true,
        accountStatus: 'active',
        role: 'user'
      });

      await newProfile.save();

      // Publish event
      await EventPublisherService.publish('UserRegistered', {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newProfile.displayName,
        createdAt: newUser.createdAt
      }, {
        aggregateId: newUser.id,
        aggregateType: 'User'
      });

      logger.info('User registered successfully', {
        userId: newUser.id,
        username: newUser.username
      });

      return {
        user: newUser,
        profile: newProfile
      };
    } catch (error) {
      logger.error('Failed to register user', {
        error: error.message,
        payload: command.payload
      });
      throw error;
    }
  }

  /**
   * Handle user profile update command
   * @param {UpdateUserProfileCommand} command - Profile update command
   * @returns {Promise<Object>} Updated profile
   */
  async handleUpdateUserProfile(command) {
    try {
      const { userId, displayName, profilePic, isPrivate } = command.payload;

      // Find and update profile
      const profile = await Profile.findOneAndUpdate(
        { profileid: userId },
        {
          $set: {
            displayName: displayName || undefined,
            profilePic: profilePic || undefined,
            isPrivate: isPrivate !== undefined ? isPrivate : undefined,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Publish event
      await EventPublisherService.publish('UserProfileUpdated', {
        userId: profile.profileid,
        displayName: profile.displayName,
        profilePic: profile.profilePic,
        isPrivate: profile.isPrivate,
        updatedAt: profile.updatedAt
      }, {
        aggregateId: profile.profileid,
        aggregateType: 'User'
      });

      logger.info('User profile updated', {
        userId: profile.profileid
      });

      return profile;
    } catch (error) {
      logger.error('Failed to update user profile', {
        error: error.message,
        payload: command.payload
      });
      throw error;
    }
  }

  /**
   * Handle user status update command
   * @param {UpdateUserStatusCommand} command - Status update command
   * @returns {Promise<Object>} Updated user
   */
  async handleUpdateUserStatus(command) {
    try {
      const { userId, status } = command.payload;

      // Find and update user
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { status, updatedAt: new Date() } },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Update profile status
      await Profile.findOneAndUpdate(
        { profileid: userId },
        { $set: { status, updatedAt: new Date() } }
      );

      // Publish event
      await EventPublisherService.publish('UserStatusChanged', {
        userId: user.id,
        status: user.status,
        updatedAt: user.updatedAt
      }, {
        aggregateId: user.id,
        aggregateType: 'User'
      });

      logger.info('User status updated', {
        userId: user.id,
        status: user.status
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user status', {
        error: error.message,
        payload: command.payload
      });
      throw error;
    }
  }

  /**
   * Handle user deletion command
   * @param {DeleteUserCommand} command - Delete user command
   * @returns {Promise<boolean>} Success status
   */
  async handleDeleteUser(command) {
    try {
      const { userId } = command.payload;

      // Soft delete user
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            isActive: false, 
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete profile
      await Profile.findOneAndUpdate(
        { profileid: userId },
        {
          $set: {
            isActive: false,
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Publish event
      await EventPublisherService.publish('UserDeleted', {
        userId: user.id,
        deletedAt: user.deletedAt
      }, {
        aggregateId: user.id,
        aggregateType: 'User'
      });

      logger.info('User deleted', {
        userId: user.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete user', {
        error: error.message,
        payload: command.payload
      });
      throw error;
    }
  }

  /**
   * Handle command based on type
   * @param {Command} command - Command to handle
   * @returns {Promise<any>} Command result
   */
  async handle(command) {
    switch (command.commandType) {
      case 'RegisterUser':
        return this.handleRegisterUser(command);
      case 'UpdateUserProfile':
        return this.handleUpdateUserProfile(command);
      case 'UpdateUserStatus':
        return this.handleUpdateUserStatus(command);
      case 'DeleteUser':
        return this.handleDeleteUser(command);
      default:
        throw new Error(`Unsupported command type: ${command.commandType}`);
    }
  }
}

export default new UserCommandHandler();