/**
 * Standardized Error Handling System
 * Unified error handling across frontend and backend with consistent error types, codes, and recovery strategies
 */

import { GraphQLError } from './GraphQLInstance.js';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * Unified Error Types and Codes
 */
export const ERROR_TYPES = {
  // Authentication & Authorization
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_USER_INPUT: 'BAD_USER_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Operations
  OPERATION_FAILED: 'OPERATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Network and API
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Client-side
  JAVASCRIPT_ERROR: 'JAVASCRIPT_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  BROWSER_COMPATIBILITY_ERROR: 'BROWSER_COMPATIBILITY_ERROR',
  FEATURE_NOT_SUPPORTED: 'FEATURE_NOT_SUPPORTED',

  // File and Upload
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_SIZE_ERROR: 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR: 'FILE_TYPE_ERROR',
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',

  // WebRTC and Media
  WEBRTC_CONNECTION_FAILED: 'WEBRTC_CONNECTION_FAILED',
  WEBRTC_MEDIA_ACCESS_DENIED: 'WEBRTC_MEDIA_ACCESS_DENIED',
  WEBRTC_PEER_CONNECTION_ERROR: 'WEBRTC_PEER_CONNECTION_ERROR',
  WEBRTC_SIGNALING_ERROR: 'WEBRTC_SIGNALING_ERROR',

  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',

  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR'
};

export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const RECOVERY_ACTIONS = {
  RETRY: 'retry',
  REFRESH_TOKEN: 'refresh_token',
  REDIRECT_LOGIN: 'redirect_login',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  USER_ACTION_REQUIRED: 'user_action_required',
  RESTART_SERVICE: 'restart_service',
  RELOAD_PAGE: 'reload_page',
  NONE: 'none'
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Standardized Error Class
 */
export class AppError extends Error {
  constructor(type, message, details = {}, statusCode = HTTP_STATUS_CODES.INTERNAL_ERROR, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.id = this.generateErrorId();
    this.severity = this.determineSeverity(type);
    this.recoveryActions = this.getRecoveryActions(type);
    this.userMessage = this.generateUserMessage(type, message, details);
    this.technicalMessage = message;
    Error.captureStackTrace(this, this.constructor);
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  determineSeverity(type) {
    const severityMap = {
      [ERROR_TYPES.UNAUTHENTICATED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.UNAUTHORIZED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.TOKEN_EXPIRED]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.INVALID_CREDENTIALS]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.VALIDATION_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.BAD_USER_INPUT]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.MISSING_REQUIRED_FIELD]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.INVALID_FORMAT]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.INVALID_VALUE]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.NOT_FOUND]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.ALREADY_EXISTS]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.RESOURCE_CONFLICT]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.OPERATION_FAILED]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.PERMISSION_DENIED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.QUOTA_EXCEEDED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.RATE_LIMITED]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.TOO_MANY_REQUESTS]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.NETWORK_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.API_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.TIMEOUT_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.SERVER_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.INTERNAL_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.SERVICE_UNAVAILABLE]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.DATABASE_ERROR]: ERROR_SEVERITY.CRITICAL,
      [ERROR_TYPES.CACHE_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.STORAGE_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.JAVASCRIPT_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.MEMORY_ERROR]: ERROR_SEVERITY.CRITICAL,
      [ERROR_TYPES.BROWSER_COMPATIBILITY_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.FEATURE_NOT_SUPPORTED]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.FILE_SIZE_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.FILE_TYPE_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.FILE_PROCESSING_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.WEBRTC_CONNECTION_FAILED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.WEBRTC_MEDIA_ACCESS_DENIED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.WEBRTC_PEER_CONNECTION_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.WEBRTC_SIGNALING_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.BUSINESS_RULE_VIOLATION]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.CONCURRENT_MODIFICATION]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.UNKNOWN_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.CONFIGURATION_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.DEPENDENCY_ERROR]: ERROR_SEVERITY.HIGH
    };
    
    return severityMap[type] || ERROR_SEVERITY.MEDIUM;
  }

  getRecoveryActions(type) {
    const recoveryMap = {
      [ERROR_TYPES.UNAUTHENTICATED]: [RECOVERY_ACTIONS.REDIRECT_LOGIN],
      [ERROR_TYPES.UNAUTHORIZED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.TOKEN_EXPIRED]: [RECOVERY_ACTIONS.REFRESH_TOKEN],
      [ERROR_TYPES.INVALID_CREDENTIALS]: [RECOVERY_ACTIONS.REDIRECT_LOGIN],
      [ERROR_TYPES.VALIDATION_ERROR]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.BAD_USER_INPUT]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.MISSING_REQUIRED_FIELD]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.INVALID_FORMAT]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.INVALID_VALUE]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.NOT_FOUND]: [RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.ALREADY_EXISTS]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.RESOURCE_CONFLICT]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.OPERATION_FAILED]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.PERMISSION_DENIED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.QUOTA_EXCEEDED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.RATE_LIMITED]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.TOO_MANY_REQUESTS]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.NETWORK_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.API_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.TIMEOUT_ERROR]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.SERVER_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.INTERNAL_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.SERVICE_UNAVAILABLE]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.DATABASE_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.CACHE_ERROR]: [RECOVERY_ACTIONS.IGNORE, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.STORAGE_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.JAVASCRIPT_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.MEMORY_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE],
      [ERROR_TYPES.BROWSER_COMPATIBILITY_ERROR]: [RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.FEATURE_NOT_SUPPORTED]: [RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.FILE_SIZE_ERROR]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.FILE_TYPE_ERROR]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.FILE_PROCESSING_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.WEBRTC_CONNECTION_FAILED]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.RESTART_SERVICE],
      [ERROR_TYPES.WEBRTC_MEDIA_ACCESS_DENIED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.WEBRTC_PEER_CONNECTION_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.RESTART_SERVICE],
      [ERROR_TYPES.WEBRTC_SIGNALING_ERROR]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.BUSINESS_RULE_VIOLATION]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.CONCURRENT_MODIFICATION]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.UNKNOWN_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.CONFIGURATION_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE],
      [ERROR_TYPES.DEPENDENCY_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE, RECOVERY_ACTIONS.FALLBACK]
    };
    
    return recoveryMap[type] || [RECOVERY_ACTIONS.NONE];
  }

  generateUserMessage(type, technicalMessage, details) {
    const userMessages = {
      [ERROR_TYPES.UNAUTHENTICATED]: 'Please log in to continue.',
      [ERROR_TYPES.UNAUTHORIZED]: 'You don\'t have permission to perform this action.',
      [ERROR_TYPES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
      [ERROR_TYPES.INVALID_CREDENTIALS]: 'Invalid username or password.',
      [ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ERROR_TYPES.BAD_USER_INPUT]: 'Invalid input. Please check your entry.',
      [ERROR_TYPES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
      [ERROR_TYPES.INVALID_FORMAT]: 'Invalid format. Please check your entry.',
      [ERROR_TYPES.INVALID_VALUE]: 'Invalid value. Please check your entry.',
      [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
      [ERROR_TYPES.ALREADY_EXISTS]: 'This item already exists.',
      [ERROR_TYPES.RESOURCE_CONFLICT]: 'Resource conflict. Please resolve and try again.',
      [ERROR_TYPES.OPERATION_FAILED]: 'Operation failed. Please try again.',
      [ERROR_TYPES.PERMISSION_DENIED]: 'You don\'t have permission to access this resource.',
      [ERROR_TYPES.QUOTA_EXCEEDED]: 'Usage limit exceeded. Please upgrade or try later.',
      [ERROR_TYPES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
      [ERROR_TYPES.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',
      [ERROR_TYPES.NETWORK_ERROR]: 'Connection problem. Please check your internet connection.',
      [ERROR_TYPES.API_ERROR]: 'Service temporarily unavailable. Please try again.',
      [ERROR_TYPES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [ERROR_TYPES.SERVER_ERROR]: 'Server error. Please try again later.',
      [ERROR_TYPES.INTERNAL_ERROR]: 'Internal server error. Please try again later.',
      [ERROR_TYPES.SERVICE_UNAVAILABLE]: 'Service unavailable. Please try again later.',
      [ERROR_TYPES.DATABASE_ERROR]: 'Data access error. Please try again later.',
      [ERROR_TYPES.CACHE_ERROR]: 'Cache error. The system will continue to work normally.',
      [ERROR_TYPES.STORAGE_ERROR]: 'Storage error. Please try again or contact support.',
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: 'External service unavailable. Please try again later.',
      [ERROR_TYPES.JAVASCRIPT_ERROR]: 'Application error. Please refresh the page.',
      [ERROR_TYPES.MEMORY_ERROR]: 'Memory error. Please refresh the page.',
      [ERROR_TYPES.BROWSER_COMPATIBILITY_ERROR]: 'Your browser doesn\'t support this feature.',
      [ERROR_TYPES.FEATURE_NOT_SUPPORTED]: 'Feature not available in your current environment.',
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: 'File upload failed. Please try again.',
      [ERROR_TYPES.FILE_SIZE_ERROR]: 'File is too large. Please choose a smaller file.',
      [ERROR_TYPES.FILE_TYPE_ERROR]: 'File type not supported. Please choose a different file.',
      [ERROR_TYPES.FILE_PROCESSING_ERROR]: 'Error processing file. Please try again.',
      [ERROR_TYPES.WEBRTC_CONNECTION_FAILED]: 'Failed to establish connection. Please try again.',
      [ERROR_TYPES.WEBRTC_MEDIA_ACCESS_DENIED]: 'Camera/microphone access denied. Please allow permissions.',
      [ERROR_TYPES.WEBRTC_PEER_CONNECTION_ERROR]: 'Connection to peer failed. Please try again.',
      [ERROR_TYPES.WEBRTC_SIGNALING_ERROR]: 'Communication error. Please refresh and try again.',
      [ERROR_TYPES.BUSINESS_RULE_VIOLATION]: 'Operation not allowed. Please check the requirements.',
      [ERROR_TYPES.CONCURRENT_MODIFICATION]: 'Resource was modified by another user. Please refresh and try again.',
      [ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [ERROR_TYPES.CONFIGURATION_ERROR]: 'Configuration error. Please refresh the page.',
      [ERROR_TYPES.DEPENDENCY_ERROR]: 'Service dependency error. Please refresh the page.'
    };
    
    return userMessages[type] || technicalMessage || 'An error occurred. Please try again.';
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      message: this.message,
      technicalMessage: this.technicalMessage,
      userMessage: this.userMessage,
      details: this.details,
      severity: this.severity,
      recoveryActions: this.recoveryActions,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

/**
 * Specific Error Classes
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(ERROR_TYPES.UNAUTHENTICATED, message, {}, HTTP_STATUS_CODES.UNAUTHORIZED);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(ERROR_TYPES.UNAUTHORIZED, message, {}, HTTP_STATUS_CODES.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input') {
    super(ERROR_TYPES.VALIDATION_ERROR, message, {}, HTTP_STATUS_CODES.BAD_REQUEST);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(ERROR_TYPES.NOT_FOUND, message, {}, HTTP_STATUS_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(ERROR_TYPES.RESOURCE_CONFLICT, message, {}, HTTP_STATUS_CODES.CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(ERROR_TYPES.RATE_LIMITED, message, {}, HTTP_STATUS_CODES.RATE_LIMITED);
  }
}

/**
 * Standardized API Response Format
 */
export const APIResponse = {
  success: (data, message = 'Success', meta = null) => {
    return {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString()
    };
  },

  error: (error) => {
    // If it's already an AppError, use its properties
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          type: error.type,
          message: process.env.NODE_ENV === 'production' ? error.userMessage : error.technicalMessage,
          code: error.type,
          statusCode: error.statusCode,
          details: process.env.NODE_ENV === 'production' ? null : error.details,
          timestamp: error.timestamp
        }
      };
    }
    
    // Otherwise, create a generic error response
    return {
      success: false,
      error: {
        type: ERROR_TYPES.UNKNOWN_ERROR,
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
        code: ERROR_TYPES.UNKNOWN_ERROR,
        statusCode: HTTP_STATUS_CODES.INTERNAL_ERROR,
        details: process.env.NODE_ENV === 'production' ? null : { message: error.message, stack: error.stack },
        timestamp: new Date().toISOString()
      }
    };
  },

  validation: (errors, message = 'Validation failed') => {
    return {
      success: false,
      error: {
        type: ERROR_TYPES.VALIDATION_ERROR,
        message,
        code: ERROR_TYPES.VALIDATION_ERROR,
        statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
        details: errors,
        timestamp: new Date().toISOString()
      }
    };
  },

  pagination: (data, pagination, message = 'Success') => {
    return {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Unified Error Handler
 */
export const handleUnifiedError = (error, contextType = 'unknown') => {
  // Log error with context
  logger.error(`${contextType.toUpperCase()} Error:`, {
    message: error.message,
    type: error.type || error.name,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace hidden in production',
    timestamp: new Date().toISOString()
  });

  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return new ValidationError(`Validation failed: ${messages.join(', ')}`);
  }

  if (error.name === 'CastError') {
    return new ValidationError('Invalid ID format');
  }

  if (error.code === 11000) {
    return new ConflictError('Duplicate value not allowed');
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  // Generic error
  return new AppError(
    ERROR_TYPES.UNKNOWN_ERROR,
    error.message || 'Internal server error',
    { originalError: { name: error.name, message: error.message } }
  );
};

/**
 * Async Handler Wrapper
 */
export const asyncHandler = (fn, contextType = 'rest') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const unifiedError = handleUnifiedError(error, contextType);
      
      // Handle based on context type
      if (contextType === 'graphql') {
        // For GraphQL, throw GraphQL errors
        throw new GraphQLError(unifiedError.message, {
          extensions: {
            code: unifiedError.type,
            statusCode: unifiedError.statusCode
          }
        });
      } else if (contextType === 'rest') {
        // For REST APIs, send JSON response
        const req = args[0];
        const res = args[1];
        
        if (res && typeof res.status === 'function') {
          return res.status(unifiedError.statusCode).json(APIResponse.error(unifiedError));
        }
      }
      
      // For other contexts, re-throw the unified error
      throw unifiedError;
    }
  };
};

/**
 * Error Logging Function
 */
export const logError = (error, context, additionalInfo = {}) => {
  logger.error('Application Error:', {
    context,
    type: error.type || error.name,
    message: error.message,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...additionalInfo,
    timestamp: new Date().toISOString()
  });
};

/**
 * Success Response Helper
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = HTTP_STATUS_CODES.OK) => {
  return res.status(statusCode).json(APIResponse.success(data, message));
};

/**
 * Error Response Helper
 */
export const sendError = (res, error) => {
  const unifiedError = handleUnifiedError(error);
  return res.status(unifiedError.statusCode).json(APIResponse.error(unifiedError));
};

export default {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ERROR_TYPES,
  ERROR_SEVERITY,
  RECOVERY_ACTIONS,
  HTTP_STATUS_CODES,
  APIResponse,
  handleUnifiedError,
  asyncHandler,
  logError,
  sendSuccess,
  sendError
};