/**
 * CUSTOM ERROR CLASSES
 *
 * Provides comprehensive error handling for GraphQL operations with:
 * - Specific error types for different scenarios
 * - HTTP status codes for REST compatibility
 * - Error codes for client-side handling
 * - Detailed error messages
 *
 * @fileoverview Custom error classes for better error handling
 * @version 1.0.0
 * @author Swaggo Development Team
 */

/**
 * NotFoundError - Resource not found (404)
 * Use when a requested resource doesn't exist in the database
 *
 * @example
 * throw new NotFoundError('Post', postid);
 * // Error: Post not found: abc123
 */
export class NotFoundError extends Error {
  constructor(resource, id = null) {
    const message = `${resource} not found${id ? `: ${id}` : ''}`;
    super(message);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
    this.statusCode = 404;
    this.resource = resource;
    this.resourceId = id;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * ValidationError - Input validation failed (400)
 * Use when user input doesn't meet validation criteria
 *
 * @example
 * throw new ValidationError('Username must be at least 3 characters', 'username');
 * // Error with field-specific details
 */
export class ValidationError extends Error {
  constructor(message, field = null, errors = null) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.statusCode = 400;
    this.field = field;
    this.errors = errors; // Array of validation errors if multiple fields

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * AuthenticationError - User not authenticated (401)
 * Use when operation requires authentication but user is not logged in
 *
 * @example
 * throw new AuthenticationError();
 * // Error: Authentication required
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'UNAUTHENTICATED';
    this.statusCode = 401;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

/**
 * AuthorizationError - User not authorized (403)
 * Use when user is authenticated but doesn't have permission
 *
 * @example
 * throw new AuthorizationError('Can only delete your own posts');
 * // Error: Can only delete your own posts
 */
export class AuthorizationError extends Error {
  constructor(message = 'Unauthorized to perform this action') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'FORBIDDEN';
    this.statusCode = 403;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
  }
}

/**
 * DuplicateError - Resource already exists (409)
 * Use when trying to create a resource that already exists
 *
 * @example
 * throw new DuplicateError('Profile', 'username');
 * // Error: Profile already exists with this username
 */
export class DuplicateError extends Error {
  constructor(resource, field = null) {
    const message = `${resource} already exists${field ? ` with this ${field}` : ''}`;
    super(message);
    this.name = 'DuplicateError';
    this.code = 'DUPLICATE';
    this.statusCode = 409;
    this.resource = resource;
    this.field = field;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DuplicateError);
    }
  }
}

/**
 * RateLimitError - Too many requests (429)
 * Use when user exceeds rate limits
 *
 * @example
 * throw new RateLimitError(60000);
 * // Error: Rate limit exceeded. Try again after...
 */
export class RateLimitError extends Error {
  constructor(retryAfter = null) {
    const message = retryAfter
      ? `Rate limit exceeded. Try again after ${new Date(retryAfter).toISOString()}`
      : 'Rate limit exceeded. Please try again later.';
    super(message);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_EXCEEDED';
    this.statusCode = 429;
    this.retryAfter = retryAfter;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }
}

/**
 * ServerError - Internal server error (500)
 * Use for unexpected server-side errors
 *
 * @example
 * throw new ServerError('Database connection failed');
 * // Error: Internal server error
 */
export class ServerError extends Error {
  constructor(message = 'Internal server error', details = null) {
    super(message);
    this.name = 'ServerError';
    this.code = 'INTERNAL_SERVER_ERROR';
    this.statusCode = 500;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServerError);
    }
  }
}

/**
 * Helper function to format GraphQL errors
 * Converts custom errors into GraphQL-compatible error format
 *
 * @param {Error} error - The error to format
 * @returns {Object} Formatted error object for GraphQL response
 */
export const formatGraphQLError = (error) => {
  // If it's one of our custom errors, format appropriately
  if (error.statusCode && error.code) {
    return {
      message: error.message,
      extensions: {
        code: error.code,
        statusCode: error.statusCode,
        field: error.field || null,
        resource: error.resource || null,
        resourceId: error.resourceId || null,
        errors: error.errors || null,
        retryAfter: error.retryAfter || null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // For standard errors, format as internal server error
  return {
    message: process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : error.message,
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Helper function to check if error is a custom error
 *
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is one of our custom errors
 */
export const isCustomError = (error) => {
  return error instanceof NotFoundError ||
         error instanceof ValidationError ||
         error instanceof AuthenticationError ||
         error instanceof AuthorizationError ||
         error instanceof DuplicateError ||
         error instanceof RateLimitError ||
         error instanceof ServerError;
};

/**
 * Helper function to log errors appropriately
 *
 * @param {Error} error - Error to log
 * @param {Object} context - Additional context (operation name, user, etc.)
 */
export const logError = (error, context = {}) => {
  const errorLog = {
    name: error.name,
    message: error.message,
    code: error.code || 'UNKNOWN',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Log stack trace for server errors
  if (error.statusCode >= 500 || !error.statusCode) {
    errorLog.stack = error.stack;
    console.error('❌ Server Error:', errorLog);
  } else if (error.statusCode >= 400) {
    console.warn('⚠️  Client Error:', errorLog);
  } else {
    console.log('ℹ️  Error:', errorLog);
  }

  return errorLog;
};

/**
 * Export all error classes and helpers
 */
export default {
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DuplicateError,
  RateLimitError,
  ServerError,
  formatGraphQLError,
  isCustomError,
  logError,
};
