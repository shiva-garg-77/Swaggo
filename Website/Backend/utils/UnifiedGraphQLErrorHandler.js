/**
 * @fileoverview Unified GraphQL Error Handler
 * @module UnifiedGraphQLErrorHandler
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Centralized error handling for all GraphQL operations.
 * Replaces multiple error handling modules with a single, consistent implementation.
 * Handles:
 * - GraphQL errors
 * - Validation errors
 * - Authentication errors
 * - Authorization errors
 * - Database errors
 * - API standardization
 */

import { GraphQLError } from '../utils/GraphQLInstance.js';
import winston from 'winston';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'graphql-error-handler' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Error codes for standardized error responses
 */
const ERROR_CODES = {
  // Authentication errors (4000-4099)
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  
  // Authorization errors (4100-4199)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Validation errors (4200-4299)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors (4300-4399)
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_STATE: 'INVALID_STATE',
  
  // Database errors (4400-4499)
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Rate limiting errors (4500-4599)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Server errors (5000-5099)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

/**
 * HTTP status code mapping for error codes
 */
const ERROR_STATUS_CODES = {
  UNAUTHENTICATED: 401,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  TOKEN_REVOKED: 401,
  FORBIDDEN: 403,
  INSUFFICIENT_PERMISSIONS: 403,
  RESOURCE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  BUSINESS_LOGIC_ERROR: 422,
  DUPLICATE_ENTRY: 409,
  INVALID_STATE: 422,
  DATABASE_ERROR: 500,
  QUERY_ERROR: 500,
  CONNECTION_ERROR: 503,
  RATE_LIMIT_EXCEEDED: 429,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Unified GraphQL Error Handler
 */
class UnifiedGraphQLErrorHandler {
  /**
   * Create a standardized GraphQL error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {object} options - Additional options
   * @returns {GraphQLError} Formatted GraphQL error
   */
  static createError(message, code = ERROR_CODES.INTERNAL_SERVER_ERROR, options = {}) {
    const {
      statusCode = ERROR_STATUS_CODES[code] || 500,
      path = null,
      locations = null,
      extensions = {},
      originalError = null
    } = options;

    const error = new GraphQLError(message, {
      nodes: locations,
      path,
      originalError,
      extensions: {
        code,
        statusCode,
        timestamp: new Date().toISOString(),
        ...extensions
      }
    });

    logger.error('GraphQL Error Created', {
      message,
      code,
      statusCode,
      path,
      timestamp: new Date().toISOString()
    });

    return error;
  }

  /**
   * Handle authentication errors
   * @param {string} message - Error message
   * @param {object} options - Additional options
   * @returns {GraphQLError} Authentication error
   */
  static authenticationError(message = 'Authentication required', options = {}) {
    return this.createError(message, ERROR_CODES.UNAUTHENTICATED, {
      statusCode: 401,
      ...options
    });
  }

  /**
   * Handle authorization errors
   * @param {string} message - Error message
   * @param {object} options - Additional options
   * @returns {GraphQLError} Authorization error
   */
  static authorizationError(message = 'Insufficient permissions', options = {}) {
    return this.createError(message, ERROR_CODES.FORBIDDEN, {
      statusCode: 403,
      ...options
    });
  }

  /**
   * Handle validation errors
   * @param {string} message - Error message
   * @param {object} details - Validation details
   * @param {object} options - Additional options
   * @returns {GraphQLError} Validation error
   */
  static validationError(message = 'Validation failed', details = {}, options = {}) {
    return this.createError(message, ERROR_CODES.VALIDATION_ERROR, {
      statusCode: 400,
      extensions: { details },
      ...options
    });
  }

  /**
   * Handle database errors
   * @param {string} message - Error message
   * @param {Error} originalError - Original database error
   * @param {object} options - Additional options
   * @returns {GraphQLError} Database error
   */
  static databaseError(message = 'Database operation failed', originalError = null, options = {}) {
    return this.createError(message, ERROR_CODES.DATABASE_ERROR, {
      statusCode: 500,
      originalError,
      ...options
    });
  }

  /**
   * Handle rate limiting errors
   * @param {string} message - Error message
   * @param {object} options - Additional options
   * @returns {GraphQLError} Rate limit error
   */
  static rateLimitError(message = 'Rate limit exceeded', options = {}) {
    return this.createError(message, ERROR_CODES.RATE_LIMIT_EXCEEDED, {
      statusCode: 429,
      ...options
    });
  }

  /**
   * Handle not found errors
   * @param {string} resource - Resource name
   * @param {object} options - Additional options
   * @returns {GraphQLError} Not found error
   */
  static notFoundError(resource = 'Resource', options = {}) {
    const message = `${resource} not found`;
    return this.createError(message, ERROR_CODES.RESOURCE_NOT_FOUND, {
      statusCode: 404,
      ...options
    });
  }

  /**
   * Handle duplicate entry errors
   * @param {string} resource - Resource name
   * @param {object} options - Additional options
   * @returns {GraphQLError} Duplicate entry error
   */
  static duplicateError(resource = 'Entry', options = {}) {
    const message = `${resource} already exists`;
    return this.createError(message, ERROR_CODES.DUPLICATE_ENTRY, {
      statusCode: 409,
      ...options
    });
  }

  /**
   * Handle internal server errors
   * @param {string} message - Error message
   * @param {Error} originalError - Original error
   * @param {object} options - Additional options
   * @returns {GraphQLError} Internal server error
   */
  static internalError(message = 'Internal server error', originalError = null, options = {}) {
    return this.createError(message, ERROR_CODES.INTERNAL_SERVER_ERROR, {
      statusCode: 500,
      originalError,
      ...options
    });
  }

  /**
   * Format error for client response
   * @param {Error} error - Error to format
   * @param {boolean} isProduction - Whether in production mode
   * @returns {object} Formatted error object
   */
  static formatErrorForClient(error, isProduction = false) {
    const formatted = {
      message: error.message,
      code: error.extensions?.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: error.extensions?.statusCode || 500
    };

    if (!isProduction) {
      formatted.path = error.path;
      formatted.locations = error.locations;
      formatted.stack = error.stack;
    }

    if (error.extensions?.details) {
      formatted.details = error.extensions.details;
    }

    return formatted;
  }

  /**
   * Log error with context
   * @param {Error} error - Error to log
   * @param {object} context - Additional context
   */
  static logError(error, context = {}) {
    logger.error('Error occurred', {
      message: error.message,
      code: error.extensions?.code,
      statusCode: error.extensions?.statusCode,
      path: error.path,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sanitize and validate arguments to prevent injection attacks
   * @param {object} args - Arguments to sanitize
   * @returns {object} Sanitized arguments
   */
  static sanitizeArgs(args) {
    if (!args || typeof args !== 'object') {
      return args;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(args)) {
      // Validate key name (prevent injection)
      if (!/^[a-zA-Z0-9_$]+$/.test(key)) {
        logger.warn('Invalid argument key detected', { key });
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        sanitized[key] = value
          .replace(/[<>\"'`]/g, '')
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeArgs(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get error statistics
   * @returns {object} Error statistics
   */
  static getStats() {
    return {
      errorCodes: ERROR_CODES,
      statusCodeMapping: ERROR_STATUS_CODES,
      timestamp: new Date().toISOString()
    };
  }
}

export default UnifiedGraphQLErrorHandler;
export { ERROR_CODES, ERROR_STATUS_CODES };
