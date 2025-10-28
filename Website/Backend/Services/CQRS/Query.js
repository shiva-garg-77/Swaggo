import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview Base Query class for CQRS implementation
 * @module Query
 */

class Query {
  /**
   * @constructor
   * @param {string} queryType - Type of query
   * @param {Object} criteria - Query criteria
   * @param {Object} options - Query options
   */
  constructor(queryType, criteria, options = {}) {
    this.queryId = uuidv4();
    this.queryType = queryType;
    this.criteria = criteria;
    this.options = {
      limit: 100,
      offset: 0,
      sort: {},
      ...options
    };
    this.timestamp = new Date();
  }

  /**
   * Validate query criteria
   * @returns {boolean} Validation result
   */
  validate() {
    // Base implementation - should be overridden by subclasses
    return !!this.queryType && !!this.criteria;
  }
}

export default Query;