/**
 * @fileoverview Standardized API response utility functions
 * @module ApiResponse
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Provides standardized API response formats for consistent API behavior:
 * - Success responses with consistent structure
 * - Error responses with consistent structure
 * - HTTP status code handling
 * - Metadata inclusion
 */

/**
 * Standard success response format
 * @param {any} data - The data to return in the response
 * @param {string} message - Optional message describing the response
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {object} metadata - Optional metadata to include in the response
 * @returns {object} Standardized success response object
 */
export const successResponse = (data = null, message = 'Success', statusCode = 200, metadata = null) => {
  const response = {
    success: true,
    message,
    data,
    statusCode
  };
  
  if (metadata) {
    response.metadata = metadata;
  }
  
  return response;
};

/**
 * Standard error response format
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorCode - Optional error code for client-side handling
 * @param {any} details - Optional detailed error information
 * @returns {object} Standardized error response object
 */
export const errorResponse = (message = 'An error occurred', statusCode = 500, errorCode = null, details = null) => {
  const response = {
    success: false,
    message,
    statusCode
  };
  
  if (errorCode) {
    response.errorCode = errorCode;
  }
  
  if (details) {
    response.details = details;
  }
  
  return response;
};

/**
 * Validation error response format
 * @param {Array} errors - Array of validation errors
 * @param {string} message - Optional message (default: 'Validation failed')
 * @returns {object} Standardized validation error response object
 */
export const validationErrorResponse = (errors, message = 'Validation failed') => {
  return {
    success: false,
    message,
    statusCode: 400,
    errorCode: 'VALIDATION_ERROR',
    details: {
      errors
    }
  };
};

/**
 * Unauthorized error response format
 * @param {string} message - Optional message (default: 'Unauthorized')
 * @returns {object} Standardized unauthorized error response object
 */
export const unauthorizedResponse = (message = 'Unauthorized') => {
  return {
    success: false,
    message,
    statusCode: 401,
    errorCode: 'UNAUTHORIZED'
  };
};

/**
 * Forbidden error response format
 * @param {string} message - Optional message (default: 'Forbidden')
 * @returns {object} Standardized forbidden error response object
 */
export const forbiddenResponse = (message = 'Forbidden') => {
  return {
    success: false,
    message,
    statusCode: 403,
    errorCode: 'FORBIDDEN'
  };
};

/**
 * Not found error response format
 * @param {string} message - Optional message (default: 'Not found')
 * @returns {object} Standardized not found error response object
 */
export const notFoundResponse = (message = 'Not found') => {
  return {
    success: false,
    message,
    statusCode: 404,
    errorCode: 'NOT_FOUND'
  };
};

/**
 * Conflict error response format
 * @param {string} message - Optional message (default: 'Conflict')
 * @param {string} field - Optional field that caused the conflict
 * @returns {object} Standardized conflict error response object
 */
export const conflictResponse = (message = 'Conflict', field = null) => {
  const response = {
    success: false,
    message,
    statusCode: 409,
    errorCode: 'CONFLICT'
  };
  
  if (field) {
    response.details = { field };
  }
  
  return response;
};

/**
 * Too many requests error response format
 * @param {string} message - Optional message (default: 'Too many requests')
 * @returns {object} Standardized too many requests error response object
 */
export const tooManyRequestsResponse = (message = 'Too many requests') => {
  return {
    success: false,
    message,
    statusCode: 429,
    errorCode: 'TOO_MANY_REQUESTS'
  };
};

/**
 * Send a standardized success response
 * @param {object} res - Express response object
 * @param {any} data - The data to return in the response
 * @param {string} message - Optional message describing the response
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {object} metadata - Optional metadata to include in the response
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, metadata = null) => {
  return res.status(statusCode).json(successResponse(data, message, statusCode, metadata));
};

/**
 * Send a standardized error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorCode - Optional error code for client-side handling
 * @param {any} details - Optional detailed error information
 */
export const sendError = (res, message = 'An error occurred', statusCode = 500, errorCode = null, details = null) => {
  return res.status(statusCode).json(errorResponse(message, statusCode, errorCode, details));
};

/**
 * Send a standardized validation error response
 * @param {object} res - Express response object
 * @param {Array} errors - Array of validation errors
 * @param {string} message - Optional message (default: 'Validation failed')
 */
export const sendValidationError = (res, errors, message = 'Validation failed') => {
  return res.status(400).json(validationErrorResponse(errors, message));
};

/**
 * Send a standardized unauthorized error response
 * @param {object} res - Express response object
 * @param {string} message - Optional message (default: 'Unauthorized')
 */
export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json(unauthorizedResponse(message));
};

/**
 * Send a standardized forbidden error response
 * @param {object} res - Express response object
 * @param {string} message - Optional message (default: 'Forbidden')
 */
export const sendForbidden = (res, message = 'Forbidden') => {
  return res.status(403).json(forbiddenResponse(message));
};

/**
 * Send a standardized not found error response
 * @param {object} res - Express response object
 * @param {string} message - Optional message (default: 'Not found')
 */
export const sendNotFound = (res, message = 'Not found') => {
  return res.status(404).json(notFoundResponse(message));
};

/**
 * Send a standardized conflict error response
 * @param {object} res - Express response object
 * @param {string} message - Optional message (default: 'Conflict')
 * @param {string} field - Optional field that caused the conflict
 */
export const sendConflict = (res, message = 'Conflict', field = null) => {
  return res.status(409).json(conflictResponse(message, field));
};

/**
 * Send a standardized too many requests error response
 * @param {object} res - Express response object
 * @param {string} message - Optional message (default: 'Too many requests')
 */
export const sendTooManyRequests = (res, message = 'Too many requests') => {
  return res.status(429).json(tooManyRequestsResponse(message));
};

export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  tooManyRequestsResponse,
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendTooManyRequests
};