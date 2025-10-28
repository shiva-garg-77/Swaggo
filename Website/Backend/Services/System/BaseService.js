import { logger } from '../../utils/SanitizedLogger.js';
import { AppError, NotFoundError, ValidationError, AuthorizationError } from '../../Helper/UnifiedErrorHandling.js';

/**
 * @fileoverview Base service class providing common functionality for all services
 * @module BaseService
 */

class BaseService {
  /**
   * @constructor
   * @description Initialize base service with common utilities
   */
  constructor() {
    this.logger = logger;
  }

  /**
   * Validate required parameters
   * @param {Object} params - Parameters to validate
   * @param {Array<string>} requiredFields - Required field names
   * @throws {ValidationError} If any required field is missing
   */
  validateRequiredParams(params, requiredFields) {
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null) {
        throw new ValidationError(`Missing required parameter: ${field}`);
      }
    }
  }

  /**
   * Validate user authorization for a resource
   * @param {string} userId - User ID
   * @param {string} resourceUserId - Resource owner ID
   * @param {string} message - Error message
   * @throws {AuthorizationError} If user is not authorized
   */
  validateUserAuthorization(userId, resourceUserId, message = 'You can only access your own resources') {
    if (userId !== resourceUserId) {
      throw new AuthorizationError(message);
    }
  }

  /**
   * Handle service operation with standardized error handling
   * @param {Function} operation - Async operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @param {Object} context - Context information for logging
   * @returns {Promise<any>} Operation result
   */
  async handleOperation(operation, operationName, context = {}) {
    try {
      this.logger.debug(`Starting service operation: ${operationName}`, context);
      const result = await operation();
      this.logger.debug(`Completed service operation: ${operationName}`, { ...context, success: true });
      return result;
    } catch (error) {
      this.logger.error(`Failed service operation: ${operationName}`, { 
        ...context, 
        error: error.message,
        stack: error.stack
      });
      
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  /**
   * Format entity for API response
   * @param {Object} entity - Entity to format
   * @returns {Object} Formatted entity
   */
  formatEntity(entity) {
    if (!entity) return null;
    
    // Remove internal fields that shouldn't be exposed
    const { __v, ...formattedEntity } = entity.toObject ? entity.toObject() : entity;
    
    return formattedEntity;
  }

  /**
   * Format list of entities for API response
   * @param {Array} entities - Entities to format
   * @returns {Array} Formatted entities
   */
  formatEntities(entities) {
    if (!entities || !Array.isArray(entities)) return [];
    return entities.map(entity => this.formatEntity(entity));
  }
}

export default BaseService;