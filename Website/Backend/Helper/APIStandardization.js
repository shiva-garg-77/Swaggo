import { GraphQLError } from 'graphql';
import UnifiedErrorHandling from './UnifiedErrorHandling.js';

/**
 * API Response Standardization and Consistency
 * Uses the unified error handling system
 */

// Export API response formats from unified system
export const { APIResponse } = UnifiedErrorHandling;

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

// Export standard HTTP status codes and error codes from unified system
export const { HTTP_STATUS_CODES: StatusCodes, ERROR_CODES: ErrorCodes } = UnifiedErrorHandling;

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

// Consistent error handling middleware for Express using unified error handling
export const errorHandler = (err, req, res, next) => {
    const unifiedError = UnifiedErrorHandling.handleUnifiedError(err, 'rest');
    
    UnifiedErrorHandling.logError(unifiedError, 'rest_api', {
        url: req.url,
        method: req.method
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
    const statusCode = unifiedError.statusCode || StatusCodes.INTERNAL_ERROR;
    const code = unifiedError.code || ErrorCodes.INTERNAL_ERROR;
    
    res.status(statusCode).json(
        APIResponse.error(
            process.env.NODE_ENV === 'production' ? 'Internal server error' : unifiedError.message,
            code,
            statusCode,
            process.env.NODE_ENV === 'production' ? null : unifiedError.stack
        )
    );
};

// Async handler wrapper for consistent error handling using unified system
export const asyncHandler = (fn) => {
    return UnifiedErrorHandling.asyncHandler(fn, 'rest');
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