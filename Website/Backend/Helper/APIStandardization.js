import { GraphQLError } from 'graphql';

/**
 * API Response Standardization and Consistency
 */

// Standard API response formats
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

    error: (message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) => {
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
                code: 'VALIDATION_ERROR',
                statusCode: 400,
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

// GraphQL response standardization
export const GraphQLResponse = {
    success: (data, message = null) => {
        if (message) {
            return {
                ...data,
                _meta: {
                    success: true,
                    message,
                    timestamp: new Date().toISOString()
                }
            };
        }
        return data;
    },

    error: (message, code = 'INTERNAL_ERROR', extensions = {}) => {
        throw new GraphQLError(message, {
            extensions: {
                code,
                timestamp: new Date().toISOString(),
                ...extensions
            }
        });
    },

    // Consistent return for operations that might return null/empty
    safeReturn: (data, fallback = null) => {
        return data || fallback;
    },

    // Consistent list returns
    listReturn: (data, defaultEmpty = []) => {
        if (!data) return defaultEmpty;
        if (!Array.isArray(data)) return [data];
        return data;
    }
};

// Standard HTTP status codes mapping
export const StatusCodes = {
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

// Standard error codes
export const ErrorCodes = {
    // Authentication & Authorization
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    UNAUTHORIZED: 'UNAUTHORIZED', 
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
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

// Input validation schemas
export const ValidationSchemas = {
    profileId: {
        required: true,
        type: 'string',
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        message: 'Profile ID must be a valid UUID'
    },

    username: {
        required: true,
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9._-]+$/,
        message: 'Username must be 3-30 characters and contain only letters, numbers, dots, underscores, and hyphens'
    },

    email: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
    },

    password: {
        required: true,
        type: 'string',
        minLength: 8,
        maxLength: 128,
        message: 'Password must be 8-128 characters'
    },

    postId: {
        required: true,
        type: 'string',
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        message: 'Post ID must be a valid UUID'
    },

    postType: {
        required: true,
        type: 'string',
        enum: ['IMAGE', 'VIDEO', 'TEXT'],
        message: 'Post type must be IMAGE, VIDEO, or TEXT'
    },

    pagination: {
        page: {
            type: 'number',
            min: 1,
            default: 1,
            message: 'Page must be a positive number'
        },
        limit: {
            type: 'number',
            min: 1,
            max: 100,
            default: 20,
            message: 'Limit must be between 1 and 100'
        }
    }
};

// Consistent pagination helper
export const createPaginationInfo = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
    };
};

// Validation helper
export const validateInput = (input, schema) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
        const value = input[field];

        // Check required
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field,
                message: `${field} is required`,
                code: ErrorCodes.MISSING_REQUIRED_FIELD
            });
            continue;
        }

        // Skip further validation if not required and empty
        if (!rules.required && (value === undefined || value === null || value === '')) {
            continue;
        }

        // Type validation
        if (rules.type) {
            const actualType = typeof value;
            if (rules.type === 'number' && actualType === 'string' && !isNaN(value)) {
                // Allow string numbers
            } else if (actualType !== rules.type) {
                errors.push({
                    field,
                    message: `${field} must be of type ${rules.type}`,
                    code: ErrorCodes.INVALID_FORMAT
                });
                continue;
            }
        }

        // Pattern validation
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
            errors.push({
                field,
                message: rules.message || `${field} format is invalid`,
                code: ErrorCodes.INVALID_FORMAT
            });
        }

        // Length validation
        if (rules.minLength && value.length < rules.minLength) {
            errors.push({
                field,
                message: `${field} must be at least ${rules.minLength} characters`,
                code: ErrorCodes.INVALID_VALUE
            });
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push({
                field,
                message: `${field} must not exceed ${rules.maxLength} characters`,
                code: ErrorCodes.INVALID_VALUE
            });
        }

        // Number validation
        if (rules.min !== undefined && value < rules.min) {
            errors.push({
                field,
                message: `${field} must be at least ${rules.min}`,
                code: ErrorCodes.INVALID_VALUE
            });
        }

        if (rules.max !== undefined && value > rules.max) {
            errors.push({
                field,
                message: `${field} must not exceed ${rules.max}`,
                code: ErrorCodes.INVALID_VALUE
            });
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push({
                field,
                message: `${field} must be one of: ${rules.enum.join(', ')}`,
                code: ErrorCodes.INVALID_VALUE
            });
        }
    }

    return errors;
};

// Consistent error handling middleware for Express
export const errorHandler = (err, req, res, next) => {
    console.error('API Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle different error types
    if (err.name === 'ValidationError') {
        return res.status(StatusCodes.BAD_REQUEST).json(
            APIResponse.validation(err.details || err.message)
        );
    }

    if (err.name === 'UnauthorizedError' || err.message.includes('token')) {
        return res.status(StatusCodes.UNAUTHORIZED).json(
            APIResponse.error('Authentication required', ErrorCodes.UNAUTHENTICATED, StatusCodes.UNAUTHORIZED)
        );
    }

    if (err.name === 'CastError' || err.message.includes('UUID')) {
        return res.status(StatusCodes.BAD_REQUEST).json(
            APIResponse.error('Invalid ID format', ErrorCodes.INVALID_FORMAT, StatusCodes.BAD_REQUEST)
        );
    }

    if (err.code === 11000) {
        return res.status(StatusCodes.CONFLICT).json(
            APIResponse.error('Resource already exists', ErrorCodes.ALREADY_EXISTS, StatusCodes.CONFLICT)
        );
    }

    // Default error response
    const statusCode = err.statusCode || StatusCodes.INTERNAL_ERROR;
    const code = err.code || ErrorCodes.INTERNAL_ERROR;
    
    res.status(statusCode).json(
        APIResponse.error(
            process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
            code,
            statusCode,
            process.env.NODE_ENV === 'production' ? null : err.stack
        )
    );
};

// Async handler wrapper for consistent error handling
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Standard success response helper
export const sendSuccess = (res, data, message = 'Success', statusCode = StatusCodes.OK) => {
    res.status(statusCode).json(APIResponse.success(data, message));
};

// Standard error response helper
export const sendError = (res, message, code = ErrorCodes.INTERNAL_ERROR, statusCode = StatusCodes.INTERNAL_ERROR) => {
    res.status(statusCode).json(APIResponse.error(message, code, statusCode));
};

// Consistent model return formats
export const ModelFormatters = {
    user: (user) => ({
        profileid: user.profileid,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        isPrivate: user.isPrivate,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
    }),

    post: (post) => ({
        postid: post.postid,
        profileid: post.profileid,
        postUrl: post.postUrl,
        postType: post.postType,
        title: post.title,
        Description: post.Description,
        location: post.location,
        tags: post.tags || [],
        taggedPeople: post.taggedPeople || [],
        allowComments: post.allowComments,
        hideLikeCount: post.hideLikeCount,
        isCloseFriendOnly: post.isCloseFriendOnly,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
    }),

    comment: (comment) => ({
        commentid: comment.commentid,
        postid: comment.postid,
        profileid: comment.profileid,
        comment: comment.comment,
        usertoid: comment.usertoid,
        commenttoid: comment.commenttoid,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
    }),

    message: (message) => ({
        messageid: message.messageid,
        chatid: message.chatid,
        senderid: message.senderid,
        messageType: message.messageType,
        content: message.content,
        attachments: message.attachments || [],
        messageStatus: message.messageStatus,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
        readBy: message.readBy || [],
        deliveredTo: message.deliveredTo || []
    })
};