import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview Query Bus for CQRS implementation
 * @module QueryBus
 */

class QueryBus {
  /**
   * @constructor
   * @description Initialize query bus
   */
  constructor() {
    this.handlers = new Map();
    this.middleware = [];
  }

  /**
   * Register a query handler
   * @param {string} queryType - Type of query
   * @param {Object} handler - Query handler
   */
  registerHandler(queryType, handler) {
    this.handlers.set(queryType, handler);
    logger.debug('Query handler registered', { queryType });
  }

  /**
   * Register middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
    logger.debug('Query middleware registered', { middlewareCount: this.middleware.length });
  }

  /**
   * Dispatch a query
   * @param {Query} query - Query to dispatch
   * @returns {Promise<any>} Query result
   */
  async dispatch(query) {
    try {
      // Validate query
      if (!query.validate()) {
        throw new Error('Invalid query');
      }

      const handler = this.handlers.get(query.queryType);
      if (!handler) {
        throw new Error(`No handler registered for query type: ${query.queryType}`);
      }

      // Apply middleware
      for (const middleware of this.middleware) {
        await middleware(query);
      }

      logger.debug('Query dispatched', {
        queryType: query.queryType,
        queryId: query.queryId
      });

      // Execute query handler
      const result = await handler.handle(query);
      
      logger.info('Query executed successfully', {
        queryType: query.queryType,
        queryId: query.queryId
      });

      return result;
    } catch (error) {
      logger.error('Query execution failed', {
        error: error.message,
        queryType: query?.queryType,
        queryId: query?.queryId
      });
      throw error;
    }
  }

  /**
   * Get registered query types
   * @returns {Array} Registered query types
   */
  getRegisteredQueries() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Remove a query handler
   * @param {string} queryType - Type of query
   */
  removeHandler(queryType) {
    this.handlers.delete(queryType);
    logger.debug('Query handler removed', { queryType });
  }
}

export default new QueryBus();