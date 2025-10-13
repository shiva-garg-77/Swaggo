import { ERROR_CODES } from './UnifiedErrorHandling.js';

/**
 * @fileoverview Utility for validating and standardizing error code usage
 * @module ErrorCodeValidator
 */

/**
 * Validate that an error code is part of the standard set
 * @param {string} code - Error code to validate
 * @returns {boolean} Whether the error code is valid
 */
export const isValidErrorCode = (code) => {
  return Object.values(ERROR_CODES).includes(code);
};

/**
 * Get all valid error codes
 * @returns {Array<string>} List of all valid error codes
 */
export const getValidErrorCodes = () => {
  return Object.values(ERROR_CODES);
};

/**
 * Validate error usage in a function
 * @param {Function} fn - Function to wrap with error code validation
 * @returns {Function} Wrapped function
 */
export const withErrorCodeValidation = (fn) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      // If error has a code that's not in our standard set, log a warning
      if (error.code && !isValidErrorCode(error.code)) {
        console.warn(`Non-standard error code used: ${error.code}`);
      }
      throw error;
    }
  };
};

/**
 * Error code validation middleware for Express
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorCodeValidationMiddleware = (req, res, next) => {
  // Store original methods to intercept error responses
  const originalJson = res.json;
  
  res.json = function(data) {
    // Check if this is an error response with a code
    if (data && data.error && data.error.code && !isValidErrorCode(data.error.code)) {
      console.warn(`Non-standard error code detected in response: ${data.error.code}`);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

export default {
  isValidErrorCode,
  getValidErrorCodes,
  withErrorCodeValidation,
  errorCodeValidationMiddleware
};