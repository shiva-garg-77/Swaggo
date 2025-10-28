import { GraphQLError } from '../utils/GraphQLInstance.js';
import UnifiedErrorHandling from './UnifiedErrorHandling.js';

/**
 * Centralized error handling for GraphQL resolvers
 * Uses the unified error handling system
 */

// Export all error classes from unified system
export const {
    AppError,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    ConflictError,
    RateLimitError
} = UnifiedErrorHandling;

// Export error codes and status codes
export const { ERROR_CODES, HTTP_STATUS_CODES } = UnifiedErrorHandling;

// Use unified error handler for GraphQL
export const handleGraphQLError = (error) => {
    return UnifiedErrorHandling.handleUnifiedError(error, 'graphql');
};

/**
 * Async error wrapper for resolvers using unified error handling
 */
export const asyncHandler = (fn) => {
    return UnifiedErrorHandling.asyncHandler(fn, 'graphql');
};

/**
 * Authentication checker
 */
export const requireAuth = (user, message = 'Authentication required') => {
    if (!user) {
        throw new AuthenticationError(message);
    }
    return user;
};

/**
 * Authorization checker
 */
export const requireOwnership = (user, resourceUserId, message = 'You can only access your own resources') => {
    requireAuth(user);
    if (user.profileid !== resourceUserId) {
        throw new AuthorizationError(message);
    }
    return true;
};

/**
 * Null-safe data accessor
 */
export const safeAccess = (obj, path, defaultValue = null) => {
    try {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : defaultValue;
        }, obj);
    } catch {
        return defaultValue;
    }
};

/**
 * Database operation wrapper with better error handling
 */
export const dbOperation = async (operation, errorMessage = 'Database operation failed') => {
    try {
        const result = await operation();
        return result;
    } catch (error) {
        if (error.name === 'ValidationError') {
            throw new ValidationError(error.message);
        }
        if (error.name === 'CastError') {
            throw new ValidationError('Invalid ID format');
        }
        if (error.code === 11000) {
            throw new ConflictError('Duplicate entry not allowed');
        }
        UnifiedErrorHandling.logError(error, 'database_operation', { errorMessage });
        throw new AppError(errorMessage);
    }
};

/**
 * Resource existence checker
 */
export const ensureExists = (resource, message = 'Resource not found') => {
    if (!resource) {
        throw new NotFoundError(message);
    }
    return resource;
};

/**
 * Input validation wrapper
 */
export const validateInput = (validator, input, fieldName = 'input') => {
    try {
        return validator(input);
    } catch (error) {
        throw new ValidationError(`Invalid ${fieldName}: ${error.message}`);
    }
};