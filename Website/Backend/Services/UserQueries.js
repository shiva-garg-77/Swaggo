import Query from './Query.js';

/**
 * @fileoverview User Queries for CQRS implementation
 * @module UserQueries
 */

export class GetUserProfileQuery extends Query {
  /**
   * @constructor
   * @param {string} userId - User ID
   */
  constructor(userId) {
    super('GetUserProfile', { userId });
  }

  /**
   * Validate query criteria
   * @returns {boolean} Validation result
   */
  validate() {
    const { userId } = this.criteria;
    return super.validate() && userId;
  }
}

export class SearchUsersQuery extends Query {
  /**
   * @constructor
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   */
  constructor(searchTerm, options = {}) {
    super('SearchUsers', { searchTerm }, options);
  }

  /**
   * Validate query criteria
   * @returns {boolean} Validation result
   */
  validate() {
    const { searchTerm } = this.criteria;
    return super.validate() && searchTerm && searchTerm.length >= 2;
  }
}

export class GetUserChatsQuery extends Query {
  /**
   * @constructor
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  constructor(userId, options = {}) {
    super('GetUserChats', { userId }, options);
  }

  /**
   * Validate query criteria
   * @returns {boolean} Validation result
   */
  validate() {
    const { userId } = this.criteria;
    return super.validate() && userId;
  }
}

export class GetUserStatusQuery extends Query {
  /**
   * @constructor
   * @param {string} userId - User ID
   */
  constructor(userId) {
    super('GetUserStatus', { userId });
  }

  /**
   * Validate query criteria
   * @returns {boolean} Validation result
   */
  validate() {
    const { userId } = this.criteria;
    return super.validate() && userId;
  }
}