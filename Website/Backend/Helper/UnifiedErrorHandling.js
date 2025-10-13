import { GraphQLError } from 'graphql';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * Unified Error Handling System
 * Standardizes error handling across GraphQL, REST APIs, and Socket.IO
 */

// Standard error codes and HTTP status mappings
export const ERROR_CODES = {
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

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // GraphQL specific
  QUERY_TOO_DEEP: 'QUERY_TOO_DEEP',
  QUERY_TOO_COMPLEX: 'QUERY_TOO_COMPLEX'
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

// Custom error classes
export class AppError extends Error {
  constructor(message, code = ERROR_CODES.INTERNAL_ERROR, statusCode = HTTP_STATUS_CODES.INTERNAL_ERROR, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, ERROR_CODES.UNAUTHENTICATED, HTTP_STATUS_CODES.UNAUTHORIZED);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, ERROR_CODES.FORBIDDEN, HTTP_STATUS_CODES.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input') {
    super(message, ERROR_CODES.BAD_USER_INPUT, HTTP_STATUS_CODES.BAD_REQUEST);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, ERROR_CODES.CONFLICT, HTTP_STATUS_CODES.CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, ERROR_CODES.RATE_LIMITED, HTTP_STATUS_CODES.RATE_LIMITED);
  }
}

// Standardized API response format
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

  error: (message, code = ERROR_CODES.INTERNAL_ERROR, statusCode = HTTP_STATUS_CODES.INTERNAL_ERROR, details = null) => {
    return {
      success: false,
      error: {
        message,
        code,
        statusCode,
        details,
        timestamp: new Date().toISOString()
      }
    };
  },

  validation: (errors, message = 'Validation failed') => {
    return {
      success: false,
      error: {
        message,
        code: ERROR_CODES.VALIDATION_ERROR,
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

// Unified error handler for all contexts
export const handleUnifiedError = (error, contextType = 'unknown') => {
  // Log error with context
  logger.error(`${contextType.toUpperCase()} Error:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Return appropriate error based on context
  if (error instanceof AppError) {
    return error;
  }

  // Handle mongoose/database errors
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
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  );
};

// Standardized async handler wrapper for consistent error handling
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
            code: unifiedError.code,
            statusCode: unifiedError.statusCode
          }
        });
      } else if (contextType === 'rest') {
        // For REST APIs, send JSON response
        const req = args[0];
        const res = args[1];
        
        if (res && typeof res.status === 'function') {
          return res.status(unifiedError.statusCode).json(
            APIResponse.error(
              process.env.NODE_ENV === 'production' ? 'Internal server error' : unifiedError.message,
              unifiedError.code,
              unifiedError.statusCode,
              process.env.NODE_ENV === 'production' ? null : unifiedError.stack
            )
          );
        }
      }
      
      // For other contexts (socket, services, etc.), re-throw the unified error
      throw unifiedError;
    }
  };
};

// Standardized error logging function
export const logError = (error, context, additionalInfo = {}) => {
  logger.error('Application Error:', {
    context,
    message: error.message,
    code: error.code,
    stack: error.stack,
    ...additionalInfo,
    timestamp: new Date().toISOString()
  });
};

// Standardized success response helper
export const sendSuccess = (res, data, message = 'Success', statusCode = HTTP_STATUS_CODES.OK) => {
  return res.status(statusCode).json(APIResponse.success(data, message));
};

// Standardized error response helper
export const sendError = (res, message, code = ERROR_CODES.INTERNAL_ERROR, statusCode = HTTP_STATUS_CODES.INTERNAL_ERROR) => {
  return res.status(statusCode).json(APIResponse.error(message, code, statusCode));
};

export default {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ERROR_CODES,
  HTTP_STATUS_CODES,
  APIResponse,
  handleUnifiedError,
  asyncHandler,
  logError,
  sendSuccess,
  sendError
};