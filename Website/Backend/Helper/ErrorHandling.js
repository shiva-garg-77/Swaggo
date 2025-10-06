import { GraphQLError } from 'graphql';

/**
 * Centralized error handling for GraphQL resolvers
 */

export class AppError extends Error {
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, isOperational = true) {
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
        super(message, 'UNAUTHENTICATED', 401);
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 'FORBIDDEN', 403);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Invalid input') {
        super(message, 'BAD_USER_INPUT', 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 'NOT_FOUND', 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 'CONFLICT', 409);
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 'RATE_LIMITED', 429);
    }
}

export const handleGraphQLError = (error) => {
    // Log error for monitoring
    console.error('GraphQL Error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    // Return appropriate GraphQL error
    if (error instanceof AppError) {
        return new GraphQLError(error.message, {
            extensions: {
                code: error.code,
                statusCode: error.statusCode
            }
        });
    }

    // Handle mongoose/database errors
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return new GraphQLError(`Validation failed: ${messages.join(', ')}`, {
            extensions: { code: 'BAD_USER_INPUT' }
        });
    }

    if (error.name === 'CastError') {
        return new GraphQLError('Invalid ID format', {
            extensions: { code: 'BAD_USER_INPUT' }
        });
    }

    if (error.code === 11000) {
        return new GraphQLError('Duplicate value not allowed', {
            extensions: { code: 'CONFLICT' }
        });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        return new GraphQLError('Invalid token', {
            extensions: { code: 'UNAUTHENTICATED' }
        });
    }

    if (error.name === 'TokenExpiredError') {
        return new GraphQLError('Token expired', {
            extensions: { code: 'UNAUTHENTICATED' }
        });
    }

    // Generic error for production
    if (process.env.NODE_ENV === 'production') {
        return new GraphQLError('Internal server error', {
            extensions: { code: 'INTERNAL_ERROR' }
        });
    }

    // Development: expose full error
    return new GraphQLError(error.message, {
        extensions: { 
            code: 'INTERNAL_ERROR',
            originalError: error.stack
        }
    });
};

/**
 * Async error wrapper for resolvers
 */
export const asyncHandler = (fn) => {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            throw handleGraphQLError(error);
        }
    };
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
        console.error('Database operation error:', error);
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