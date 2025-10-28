/**
 * @fileoverview GraphQL Service - Central service for GraphQL operations
 * @module GraphQLService
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Provides centralized GraphQL service functionality:
 * - Schema validation
 * - Query complexity analysis
 * - Performance monitoring
 * - Error handling utilities
 * - Security enhancements
 */

import { validateSchema } from '../../utils/GraphQLInstance.js';
import pkg from 'graphql-validation-complexity';
const { createComplexityRule } = pkg;
import winston from 'winston';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'graphql-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class GraphQLService {
  /**
   * Validate GraphQL schema
   * @param {GraphQLSchema} schema - The GraphQL schema to validate
   * @returns {object} Validation result with isValid flag and errors if any
   */
  static validateSchema(schema) {
    try {
      logger.info('Validating GraphQL schema');
      const errors = validateSchema(schema);
      
      if (errors.length > 0) {
        logger.error('GraphQL schema validation failed', { errorCount: errors.length });
        return {
          isValid: false,
          errors: errors.map(error => ({
            message: error.message,
            locations: error.locations
          }))
        };
      }
      
      logger.info('✅ GraphQL schema validation passed');
      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      logger.error('❌ Error during GraphQL schema validation', { 
        error: error.message, 
        stack: error.stack 
      });
      return {
        isValid: false,
        errors: [{ message: error.message }]
      };
    }
  }

  /**
   * Create complexity rule for query validation
   * @param {number} maxComplexity - Maximum allowed complexity
   * @param {object} estimators - Custom complexity estimators
   * @returns {Function} Complexity validation rule
   */
  static createComplexityRule(maxComplexity = 1000, estimators = {}) {
    try {
      logger.info('Creating GraphQL complexity rule', { maxComplexity });
      return createComplexityRule(maxComplexity, estimators);
    } catch (error) {
      logger.error('❌ Error creating complexity rule', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Format GraphQL errors for client consumption
   * @param {GraphQLError} error - The GraphQL error to format
   * @param {boolean} isProduction - Whether we're in production mode
   * @returns {object} Formatted error object
   */
  static formatError(error, isProduction = false) {
    try {
      logger.debug('Formatting GraphQL error', { 
        message: error.message,
        path: error.path
      });
      
      // Don't expose internal details in production
      if (isProduction) {
        return {
          message: 'Internal server error',
          path: error.path
        };
      }
      
      // In development, provide more details
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        stack: error.stack
      };
    } catch (formatError) {
      logger.error('❌ Error formatting GraphQL error', { 
        error: formatError.message, 
        stack: formatError.stack 
      });
      return {
        message: 'Internal server error'
      };
    }
  }

  /**
   * Log GraphQL operation
   * @param {string} operationName - Name of the GraphQL operation
   * @param {string} operationType - Type of operation (query/mutation/subscription)
   * @param {object} context - GraphQL context
   * @param {number} duration - Operation duration in milliseconds
   * @param {object} result - Operation result
   */
  static logOperation(operationName, operationType, context, duration, result) {
    try {
      const logData = {
        operationName,
        operationType,
        duration,
        userId: context.user ? context.user.id : 'anonymous',
        timestamp: new Date().toISOString()
      };
      
      // Log slow operations
      if (duration > 5000) {
        logger.warn('Slow GraphQL operation detected', logData);
      } else {
        logger.info('GraphQL operation completed', logData);
      }
    } catch (logError) {
      logger.error('❌ Error logging GraphQL operation', { 
        error: logError.message, 
        stack: logError.stack 
      });
    }
  }

  /**
   * Get GraphQL service statistics
   * @returns {object} Service statistics
   */
  static getStats() {
    try {
      logger.info('Retrieving GraphQL service stats');
      // In a real implementation, this would collect actual metrics
      return {
        service: 'GraphQLService',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Error getting GraphQL service stats', { 
        error: error.message, 
        stack: error.stack 
      });
      return {
        service: 'GraphQLService',
        error: error.message
      };
    }
  }
}

export default GraphQLService;