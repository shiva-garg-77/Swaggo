import validator from 'validator';

/**
 * Validation utilities for secure input handling
 */

export const validateProfileId = (profileid) => {
    if (!profileid || typeof profileid !== 'string') {
        throw new Error('Invalid profile ID format');
    }
    
    if (!validator.isUUID(profileid, 4)) {
        throw new Error('Profile ID must be a valid UUID');
    }
    
    return true;
};

export const validatePostId = (postid) => {
    if (!postid || typeof postid !== 'string') {
        throw new Error('Invalid post ID format');
    }
    
    if (!validator.isUUID(postid, 4)) {
        throw new Error('Post ID must be a valid UUID');
    }
    
    return true;
};

export const sanitizeText = (text, maxLength = 5000) => {
    if (!text || typeof text !== 'string') return '';
    
    // Remove potentially dangerous HTML/JS content
    const sanitized = validator.escape(text.trim());
    
    if (sanitized.length > maxLength) {
        throw new Error(`Text content exceeds maximum length of ${maxLength} characters`);
    }
    
    return sanitized;
};

export const validateEmail = (email) => {
    if (!email || !validator.isEmail(email)) {
        throw new Error('Invalid email format');
    }
    
    return validator.normalizeEmail(email, {
        gmail_remove_dots: true,
        gmail_lowercase: true
    });
};

export const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
        throw new Error('Username is required');
    }
    
    const sanitized = username.trim();
    
    if (sanitized.length < 3 || sanitized.length > 30) {
        throw new Error('Username must be between 3 and 30 characters');
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
        throw new Error('Username can only contain letters, numbers, dots, underscores, and hyphens');
    }
    
    return sanitized;
};

export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        throw new Error('Password is required');
    }
    
    if (password.length < 8 || password.length > 128) {
        throw new Error('Password must be between 8 and 128 characters');
    }
    
    // Check for common weak patterns
    const weakPatterns = [
        /^password/i,
        /^123456/,
        /^qwerty/i,
        /^admin/i
    ];
    
    for (const pattern of weakPatterns) {
        if (pattern.test(password)) {
            throw new Error('Password is too weak or common');
        }
    }
    
    return true;
};

export const validatePostContent = (content, postType = 'text') => {
    if (!content) {
        throw new Error('Post content is required');
    }
    
    switch (postType.toLowerCase()) {
        case 'text':
            return sanitizeText(content, 10000); // 10k char limit for text posts
        case 'image':
        case 'video':
            // For media posts, content might be a URL
            if (typeof content === 'string' && content.startsWith('http')) {
                if (!validator.isURL(content, {
                    protocols: ['http', 'https'],
                    require_tld: false // Allow localhost URLs
                })) {
                    throw new Error('Invalid media URL format');
                }
            }
            return content;
        default:
            throw new Error('Invalid post type');
    }
};

export const validatePagination = (limit = 10, offset = 0) => {
    const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100); // 1-100 range
    const validOffset = Math.max(parseInt(offset) || 0, 0); // Non-negative
    
    return { limit: validLimit, offset: validOffset };
};

export const validateFileUpload = (file) => {
    if (!file) {
        throw new Error('File is required');
    }
    
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
        throw new Error('File size exceeds 10MB limit');
    }
    
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'audio/mpeg',
        'audio/wav'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('File type not allowed');
    }
    
    return true;
};

export const rateLimitKey = (userId, action) => {
    return `rate_limit:${action}:${userId}`;
};

export const createStandardError = (message, code = 'BAD_REQUEST', statusCode = 400) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
};

export const formatErrorResponse = (error) => {
    return {
        success: false,
        error: {
            message: error.message,
            code: error.code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        }
    };
};