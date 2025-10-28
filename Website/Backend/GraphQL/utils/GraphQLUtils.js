/**
 * @fileoverview GraphQL Utilities - Helper functions for GraphQL operations
 * @module GraphQLUtils
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Provides utility functions for GraphQL operations:
 * - Schema manipulation
 * - Data transformation
 * - Error handling
 * - Performance optimization
 */

import winston from 'winston';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'graphql-utils' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Convert a Mongoose document to a plain object
 * @param {object} mongooseDoc - Mongoose document
 * @returns {object} Plain JavaScript object
 */
export const toPlainObject = (mongooseDoc) => {
  try {
    if (!mongooseDoc) return null;
    
    // If it's already a plain object, return as is
    if (typeof mongooseDoc.toObject === 'function') {
      return mongooseDoc.toObject({ getters: true, virtuals: true });
    }
    
    // If it's a regular object, return it
    if (typeof mongooseDoc === 'object' && mongooseDoc !== null) {
      return mongooseDoc;
    }
    
    return mongooseDoc;
  } catch (error) {
    logger.error('❌ Error converting to plain object', { 
      error: error.message, 
      stack: error.stack 
    });
    return mongooseDoc;
  }
};

/**
 * Paginate results
 * @param {Array} items - Array of items to paginate
 * @param {number} limit - Number of items per page
 * @param {number} offset - Offset for pagination
 * @returns {object} Paginated result object
 */
export const paginateResults = (items, limit = 50, offset = 0) => {
  try {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    
    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    return {
      items: paginatedItems,
      totalCount: items.length,
      hasNextPage: endIndex < items.length,
      hasPreviousPage: startIndex > 0
    };
  } catch (error) {
    logger.error('❌ Error paginating results', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
};

/**
 * Create a connection object for GraphQL pagination
 * @param {Array} items - Array of items
 * @param {string} cursor - Cursor for pagination
 * @returns {object} Connection object
 */
export const createConnection = (items, cursor = null) => {
  try {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }
    
    // Generate edges with cursors
    const edges = items.map((item, index) => ({
      node: item,
      cursor: Buffer.from(index.toString()).toString('base64')
    }));
    
    // Determine page info
    const pageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
    };
    
    return {
      edges,
      pageInfo,
      totalCount: items.length
    };
  } catch (error) {
    logger.error('❌ Error creating connection', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
};

/**
 * Sanitize GraphQL input
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
export const sanitizeInput = (input) => {
  try {
    return GraphQLSecurityService.sanitizeInput(input);
  } catch (error) {
    logger.error('❌ Error sanitizing input', { 
      error: error.message, 
      stack: error.stack 
    });
    return input;
  }
};

/**
 * Mask sensitive data
 * @param {object} data - Data to mask
 * @param {Array} sensitiveFields - Fields to mask
 * @returns {object} Data with sensitive fields masked
 */
export const maskSensitiveData = (data, sensitiveFields = []) => {
  try {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const maskedData = { ...data };
    
    sensitiveFields.forEach(field => {
      if (field in maskedData) {
        maskedData[field] = '***MASKED***';
      }
    });
    
    return maskedData;
  } catch (error) {
    logger.error('❌ Error masking sensitive data', { 
      error: error.message, 
      stack: error.stack 
    });
    return data;
  }
};

/**
 * Format GraphQL response
 * @param {any} data - Data to format
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @returns {object} Formatted response
 */
export const formatResponse = (data, success = true, message = '') => {
  try {
    return {
      data,
      success,
      message
    };
  } catch (error) {
    logger.error('❌ Error formatting response', { 
      error: error.message, 
      stack: error.stack 
    });
    return {
      data: null,
      success: false,
      message: 'Internal server error'
    };
  }
};

export default {
  toPlainObject,
  paginateResults,
  createConnection,
  sanitizeInput,
  maskSensitiveData,
  formatResponse
};