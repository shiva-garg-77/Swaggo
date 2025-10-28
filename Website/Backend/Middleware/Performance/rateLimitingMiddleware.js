import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { createClient } from 'redis';

/**
 * Rate limiting middleware for critical endpoints
 * 
 * This middleware provides rate limiting functionality to prevent abuse
 * of critical endpoints like file uploads, authentication, etc.
 */

// Create Redis client for distributed rate limiting
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  } else if (process.env.REDIS_HOST) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0
    });
  }
} catch (error) {
  console.warn('⚠️ Redis connection failed for rate limiting, falling back to in-memory store:', error.message);
  redisClient = null;
}

// Fallback in-memory store
class InMemoryStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
    this.windowMs = 15 * 60 * 1000; // 15 minutes default
  }

  async increment(key, windowMs) {
    const now = Date.now();
    const resetTime = this.resetTime.get(key);
    
    // Reset if window has expired
    if (!resetTime || now >= resetTime) {
      this.hits.set(key, 1);
      this.resetTime.set(key, now + windowMs);
      return { totalHits: 1, resetTime: now + windowMs };
    }
    
    // Increment within window
    const currentHits = this.hits.get(key) || 0;
    const newHits = currentHits + 1;
    this.hits.set(key, newHits);
    
    return { totalHits: newHits, resetTime: resetTime };
  }

  async resetKey(key) {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }
}

const store = redisClient ? {
  async increment(key, windowMs) {
    try {
      const [totalHits, resetTime] = await redisClient.multi()
        .incr(key)
        .pttl(key)
        .exec();
      
      // If key is new, set expiration
      if (resetTime[1] === -1) {
        await redisClient.pexpire(key, windowMs);
        return { totalHits: totalHits[1], resetTime: Date.now() + windowMs };
      }
      
      return { totalHits: totalHits[1], resetTime: Date.now() + resetTime[1] };
    } catch (error) {
      console.error('Redis error in rate limiting:', error);
      // Fallback to in-memory if Redis fails
      return await inMemoryStore.increment(key, windowMs);
    }
  },
  
  async resetKey(key) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Redis error resetting key:', error);
      // Fallback to in-memory if Redis fails
      await inMemoryStore.resetKey(key);
    }
  }
} : new InMemoryStore();

const inMemoryStore = new InMemoryStore();

// Generic rate limiter factory
const createRateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    statusCode = 429,
    standardHeaders = true,
    legacyHeaders = false,
    keyGenerator = (req) => req.ip,
    handler = (req, res, next, options) => {
      res.status(options.statusCode).json({
        error: options.message,
        retryAfter: Math.ceil((options.resetTime - Date.now()) / 1000)
      });
    },
    skip = () => false
  } = options;

  return async (req, res, next) => {
    // Skip rate limiting if configured to do so
    if (skip(req, res)) {
      return next();
    }

    const key = keyGenerator(req);
    if (!key) {
      return next();
    }

    try {
      const { totalHits, resetTime } = await store.increment(key, windowMs);
      
      // Add rate limit headers
      if (standardHeaders) {
        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', Math.max(0, max - totalHits));
        res.setHeader('RateLimit-Reset', new Date(resetTime).toUTCString());
      }

      // Check if limit exceeded
      if (totalHits > max) {
        // Add retry-after header
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);
        
        // Call custom handler or use default
        if (handler) {
          return handler(req, res, next, { 
            statusCode, 
            message, 
            resetTime,
            retryAfter
          });
        }
        
        return res.status(statusCode).json({
          error: message,
          retryAfter
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting on error
      next();
    }
  };
};

// Rate limiter for file uploads (stricter limits)
export const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per window
  message: 'Too many file upload attempts, please try again later.',
  keyGenerator: (req) => {
    // Use IP + user agent for more accurate limiting
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return `upload_${ip}_${userAgent}`;
  }
});

// Rate limiter for authentication endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per window
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return `auth_${ip}_${userAgent}`;
  }
});

// Rate limiter for API endpoints
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 API requests per window
  message: 'Too many API requests, please try again later.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `api_${ip}`;
  }
});



// Rate limiter for debug endpoints
export const debugRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 debug requests per window
  message: 'Too many debug requests, please try again later.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `debug_${ip}`;
  }
});

// Rate limiter for admin endpoints
export const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 admin requests per window
  message: 'Too many admin requests, please try again later.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `admin_${ip}`;
  }
});

// Rate limiter for password reset endpoints
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset requests, please try again later.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `password_reset_${ip}`;
  }
});

export default {
  uploadRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  debugRateLimiter,
  adminRateLimiter,
  passwordResetRateLimiter,
  createRateLimiter
};