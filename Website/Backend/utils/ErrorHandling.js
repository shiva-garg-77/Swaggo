import { GraphQLError } from './GraphQLInstance.js';
import StandardizedErrorHandling from './StandardizedErrorHandling.js';

/**
 * Centralized error handling for GraphQL resolvers
 * Uses the unified error handling system
 */

// Export all error classes from standardized system
export const {
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
    APIResponse
} = StandardizedErrorHandling;

// Use standardized error handler for GraphQL
export const handleGraphQLError = (error) => {
    return StandardizedErrorHandling.handleUnifiedError(error, 'graphql');
};

/**
 * Async error wrapper for resolvers using standardized error handling
 */
export const asyncHandler = (fn) => {
    return StandardizedErrorHandling.asyncHandler(fn, 'graphql');
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
        StandardizedErrorHandling.logError(error, 'database_operation', { errorMessage });
        throw new AppError(ERROR_TYPES.DATABASE_ERROR, errorMessage);
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