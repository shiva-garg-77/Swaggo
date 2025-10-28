import Command from './Command.js';

/**
 * @fileoverview User Commands for CQRS implementation
 * @module UserCommands
 */

export class RegisterUserCommand extends Command {
  /**
   * @constructor
   * @param {Object} userData - User registration data
   */
  constructor(userData) {
    super('RegisterUser', userData);
  }

  /**
   * Validate registration data
   * @returns {boolean} Validation result
   */
  validate() {
    const { username, email, password } = this.payload;
    return super.validate() && 
           username && 
           email && 
           password && 
           password.length >= 12;
  }
}

export class UpdateUserProfileCommand extends Command {
  /**
   * @constructor
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile update data
   */
  constructor(userId, profileData) {
    super('UpdateUserProfile', { userId, ...profileData });
  }

  /**
   * Validate profile update data
   * @returns {boolean} Validation result
   */
  validate() {
    const { userId } = this.payload;
    return super.validate() && userId;
  }
}

export class UpdateUserStatusCommand extends Command {
  /**
   * @constructor
   * @param {string} userId - User ID
   * @param {string} status - New status
   */
  constructor(userId, status) {
    super('UpdateUserStatus', { userId, status });
  }

  /**
   * Validate status update data
   * @returns {boolean} Validation result
   */
  validate() {
    const { userId, status } = this.payload;
    const validStatuses = ['online', 'offline', 'away', 'busy'];
    return super.validate() && 
           userId && 
           status && 
           validStatuses.includes(status);
  }
}

export class DeleteUserCommand extends Command {
  /**
   * @constructor
   * @param {string} userId - User ID
   */
  constructor(userId) {
    super('DeleteUser', { userId });
  }

  /**
   * Validate delete user data
   * @returns {boolean} Validation result
   */
  validate() {
    const { userId } = this.payload;
    return super.validate() && userId;
  }
}