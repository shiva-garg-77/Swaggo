import AggregateRoot from './AggregateRoot.js';

/**
 * @fileoverview User Aggregate for event sourcing implementation
 * @module UserAggregate
 */

class UserAggregate extends AggregateRoot {
  /**
   * @constructor
   * @param {string} id - User identifier
   */
  constructor(id) {
    super(id, 'User');
    this.username = null;
    this.email = null;
    this.displayName = null;
    this.isActive = false;
    this.isVerified = false;
    this.createdAt = null;
    this.lastLoginAt = null;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   */
  create(userData) {
    this.raiseEvent('UserRegistered', {
      userId: this.id,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Handle UserRegistered event
   * @param {Object} payload - Event payload
   */
  onUserRegistered(payload) {
    this.username = payload.username;
    this.email = payload.email;
    this.displayName = payload.displayName;
    this.isActive = true;
    this.createdAt = new Date(payload.createdAt);
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   */
  updateProfile(profileData) {
    this.raiseEvent('UserProfileUpdated', {
      userId: this.id,
      ...profileData,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Handle UserProfileUpdated event
   * @param {Object} payload - Event payload
   */
  onUserProfileUpdated(payload) {
    if (payload.username) this.username = payload.username;
    if (payload.email) this.email = payload.email;
    if (payload.displayName) this.displayName = payload.displayName;
  }

  /**
   * Update user status
   * @param {boolean} isActive - Active status
   */
  updateStatus(isActive) {
    this.raiseEvent('UserStatusChanged', {
      userId: this.id,
      isActive,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Handle UserStatusChanged event
   * @param {Object} payload - Event payload
   */
  onUserStatusChanged(payload) {
    this.isActive = payload.isActive;
  }

  /**
   * Record user login
   */
  recordLogin() {
    this.raiseEvent('UserLoggedIn', {
      userId: this.id,
      loginAt: new Date().toISOString()
    });
  }

  /**
   * Handle UserLoggedIn event
   * @param {Object} payload - Event payload
   */
  onUserLoggedIn(payload) {
    this.lastLoginAt = new Date(payload.loginAt);
  }

  /**
   * Verify user email
   */
  verifyEmail() {
    this.raiseEvent('UserEmailVerified', {
      userId: this.id,
      verifiedAt: new Date().toISOString()
    });
  }

  /**
   * Handle UserEmailVerified event
   * @param {Object} payload - Event payload
   */
  onUserEmailVerified(payload) {
    this.isVerified = true;
  }

  /**
   * Delete user
   */
  delete() {
    this.raiseEvent('UserDeleted', {
      userId: this.id,
      deletedAt: new Date().toISOString()
    });
  }

  /**
   * Handle UserDeleted event
   * @param {Object} payload - Event payload
   */
  onUserDeleted(payload) {
    this.isActive = false;
  }

  /**
   * Get the current state of the user
   * @returns {Object} Current user state
   */
  getState() {
    return {
      ...super.getState(),
      username: this.username,
      email: this.email,
      displayName: this.displayName,
      isActive: this.isActive,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt
    };
  }
}

export default UserAggregate;