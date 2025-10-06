import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { GraphQLError } from 'graphql';

/**
 * Security and Rate Limiting Middleware
 */

// Basic rate limiting for REST endpoints
export const createRateLimit = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMITED',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Remove custom keyGenerator to use default IPv6-safe one
        // Skip successful HEAD requests
        skip: (req) => req.method === 'HEAD',
        ...options
    };

    return rateLimit(defaultOptions);
};

// Specific rate limiters for different endpoints (development-friendly)
export const authRateLimit = createRateLimit({
    windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 2 * 60 * 1000, // 15 min in prod, 2 min in dev
    max: process.env.NODE_ENV === 'production' ? 5 : 50, // 5 attempts in prod, 50 in dev
    message: {
        error: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMITED',
        retryAfter: process.env.NODE_ENV === 'production' ? '15 minutes' : '2 minutes'
    }
});

export const uploadRateLimit = createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
        error: 'Upload limit exceeded, please try again later.',
        code: 'UPLOAD_RATE_LIMITED',
        retryAfter: '1 hour'
    }
});

export const messageRateLimit = createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: {
        error: 'Message sending limit exceeded, please slow down.',
        code: 'MESSAGE_RATE_LIMITED',
        retryAfter: '1 minute'
    }
});

// Advanced rate limiting using rate-limiter-flexible
class AdvancedRateLimiter {
    constructor() {
        // GraphQL query rate limiter
        this.graphqlLimiter = new RateLimiterMemory({
            points: 100, // Number of requests
            duration: 60, // Per 60 seconds
            blockDuration: 60, // Block for 60 seconds if exceeded
        });

        // Mutation rate limiter (stricter)
        this.mutationLimiter = new RateLimiterMemory({
            points: 30, // 30 mutations
            duration: 60, // Per 60 seconds
            blockDuration: 120, // Block for 2 minutes if exceeded
        });

        // File upload rate limiter
        this.uploadLimiter = new RateLimiterMemory({
            points: 10, // 10 uploads
            duration: 3600, // Per hour
            blockDuration: 3600, // Block for 1 hour if exceeded
        });

        // Socket message rate limiter
        this.socketMessageLimiter = new RateLimiterMemory({
            points: 60, // 60 messages
            duration: 60, // Per minute
            blockDuration: 60, // Block for 1 minute
        });

        // Authentication rate limiter (development-friendly)
        this.authLimiter = new RateLimiterMemory({
            points: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 attempts in prod, 100 in dev
            duration: process.env.NODE_ENV === 'production' ? 900 : 60, // 15 min in prod, 1 min in dev
            blockDuration: process.env.NODE_ENV === 'production' ? 1800 : 60, // 30 min in prod, 1 min in dev
        });
    }

    async checkGraphQLRate(userId, isMutation = false) {
        const limiter = isMutation ? this.mutationLimiter : this.graphqlLimiter;
        try {
            await limiter.consume(userId);
            return true;
        } catch (rejRes) {
            const msBeforeNext = rejRes.msBeforeNext;
            throw new GraphQLError('Rate limit exceeded', {
                extensions: {
                    code: 'RATE_LIMITED',
                    retryAfter: Math.round(msBeforeNext / 1000)
                }
            });
        }
    }

    async checkSocketMessageRate(userId) {
        try {
            await this.socketMessageLimiter.consume(userId);
            return true;
        } catch (rejRes) {
            return false;
        }
    }

    async checkUploadRate(userId) {
        try {
            await this.uploadLimiter.consume(userId);
            return true;
        } catch (rejRes) {
            const msBeforeNext = rejRes.msBeforeNext;
            throw new Error(`Upload rate limit exceeded. Try again in ${Math.round(msBeforeNext / 1000)} seconds`);
        }
    }

    async checkAuthRate(identifier) {
        try {
            await this.authLimiter.consume(identifier);
            return true;
        } catch (rejRes) {
            const msBeforeNext = rejRes.msBeforeNext;
            throw new Error(`Too many authentication attempts. Try again in ${Math.round(msBeforeNext / 1000)} seconds`);
        }
    }
}

export const rateLimiter = new AdvancedRateLimiter();

// GraphQL depth limiting to prevent complex query attacks
export const depthLimit = (maxDepth = 10) => {
    return (source, args, context, info) => {
        const depth = getQueryDepth(info);
        if (depth > maxDepth) {
            throw new GraphQLError(`Query depth of ${depth} exceeds maximum depth of ${maxDepth}`, {
                extensions: { code: 'QUERY_TOO_DEEP' }
            });
        }
    };
};

// Helper function to calculate query depth
function getQueryDepth(info) {
    const { fieldNodes } = info;
    let maxDepth = 0;

    const calculateDepth = (node, currentDepth = 0) => {
        if (node.selectionSet) {
            const depth = currentDepth + 1;
            maxDepth = Math.max(maxDepth, depth);
            
            node.selectionSet.selections.forEach(selection => {
                if (selection.selectionSet) {
                    calculateDepth(selection, depth);
                }
            });
        }
    };

    fieldNodes.forEach(node => calculateDepth(node));
    return maxDepth;
}

// Query complexity analysis
export const complexityLimit = (maxComplexity = 1000) => {
    return (source, args, context, info) => {
        const complexity = calculateComplexity(info);
        if (complexity > maxComplexity) {
            throw new GraphQLError(`Query complexity of ${complexity} exceeds maximum complexity of ${maxComplexity}`, {
                extensions: { code: 'QUERY_TOO_COMPLEX' }
            });
        }
    };
};

function calculateComplexity(info) {
    // Simple complexity calculation - can be enhanced
    const { fieldNodes } = info;
    let complexity = 0;

    const calculateFieldComplexity = (node, multiplier = 1) => {
        complexity += multiplier;
        
        if (node.selectionSet) {
            node.selectionSet.selections.forEach(selection => {
                // Arrays and relations increase complexity
                const fieldMultiplier = selection.name?.value?.endsWith('s') ? 10 : 1;
                calculateFieldComplexity(selection, multiplier * fieldMultiplier);
            });
        }
    };

    fieldNodes.forEach(node => calculateFieldComplexity(node));
    return complexity;
}

// Security headers middleware - modified to not interfere with CORS
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow file uploads
    crossOriginResourcePolicy: false, // Don't interfere with CORS
    crossOriginOpenerPolicy: false,   // Don't interfere with CORS
    // Only enable security headers that don't conflict with CORS - moved up to avoid duplicates
    hsts: process.env.NODE_ENV === 'production' // Enable HSTS only in production
});

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    // Remove potentially dangerous characters
                    obj[key] = obj[key]
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                        .replace(/javascript:/gi, '')
                        .replace(/on\w+\s*=/gi, '');
                } else if (typeof obj[key] === 'object') {
                    sanitize(obj[key]);
                }
            }
        }
    };

    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
};

// File upload security
export const secureFileUpload = (req, res, next) => {
    if (req.file) {
        const allowedMimes = [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/quicktime'
        ];

        if (!allowedMimes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: 'File type not allowed',
                allowedTypes: allowedMimes
            });
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (req.file.size > maxSize) {
            return res.status(400).json({
                error: 'File size too large',
                maxSize: '10MB'
            });
        }

        // Check for malicious file names
        const dangerousPatterns = [
            /\.\./, // Directory traversal
            /[<>:"'|?*]/, // Invalid filename characters
            /^\.|\.$/,  // Files starting or ending with dot
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(req.file.originalname)) {
                return res.status(400).json({
                    error: 'Invalid filename',
                    filename: req.file.originalname
                });
            }
        }
    }

    next();
};

// GraphQL security middleware
export const graphqlSecurity = async (resolve, source, args, context, info) => {
    const { user } = context;
    const userId = user?.profileid || context.req?.ip;

    // Rate limiting check
    const isMutation = info.operation.operation === 'mutation';
    await rateLimiter.checkGraphQLRate(userId, isMutation);

    // Depth limiting
    const depth = getQueryDepth(info);
    if (depth > 10) {
        throw new GraphQLError('Query too deep', {
            extensions: { code: 'QUERY_TOO_DEEP' }
        });
    }

    // Complexity limiting
    const complexity = calculateComplexity(info);
    if (complexity > 1000) {
        throw new GraphQLError('Query too complex', {
            extensions: { code: 'QUERY_TOO_COMPLEX' }
        });
    }

    return resolve(source, args, context, info);
};

// Socket.IO rate limiting middleware
export const socketRateLimit = (socket, next) => {
    const originalEmit = socket.emit;
    
    socket.emit = function(event, ...args) {
        const userId = socket.user?.profileid || socket.id;
        
        // Check rate limit for message events
        if (event === 'send_message') {
            rateLimiter.checkSocketMessageRate(userId).then(allowed => {
                if (allowed) {
                    originalEmit.call(this, event, ...args);
                } else {
                    this.emit('rate_limited', {
                        message: 'Message rate limit exceeded',
                        event: event
                    });
                }
            });
        } else {
            originalEmit.call(this, event, ...args);
        }
    };
    
    next();
};