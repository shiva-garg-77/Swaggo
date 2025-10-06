import rateLimit from 'express-rate-limit';
import { isDevelopment } from '../Config/EnvironmentValidator.js';

/**
 * Socket Rate Limiting System
 * Prevents DoS attacks and abuse
 */
class SocketRateLimiter {
  constructor() {
    // User-based rate limiting
    this.userLimits = new Map(); // userId -> { count, windowStart, limits }
    
    // IP-based rate limiting  
    this.ipLimits = new Map(); // ip -> { count, windowStart, limits }
    
    // Rate limit configurations
    this.rateLimits = {
      // Message sending limits
      sendMessage: {
        maxPerMinute: isDevelopment() ? 100 : 30,
        maxPerHour: isDevelopment() ? 5000 : 1000,
        windowMs: 60 * 1000 // 1 minute
      },
      
      // Call initiation limits
      initiateCall: {
        maxPerMinute: isDevelopment() ? 20 : 5,
        maxPerHour: isDevelopment() ? 200 : 50,
        windowMs: 60 * 1000
      },
      
      // Join/leave chat limits
      joinChat: {
        maxPerMinute: isDevelopment() ? 100 : 20,
        maxPerHour: isDevelopment() ? 1000 : 200,
        windowMs: 60 * 1000
      },
      
      // Typing indicator limits
      typing: {
        maxPerMinute: isDevelopment() ? 200 : 60,
        maxPerHour: isDevelopment() ? 5000 : 1000,
        windowMs: 60 * 1000
      },
      
      // General socket events
      general: {
        maxPerMinute: isDevelopment() ? 500 : 100,
        maxPerHour: isDevelopment() ? 20000 : 5000,
        windowMs: 60 * 1000
      },
      
      // Connection attempts (IP-based)
      connect: {
        maxPerMinute: isDevelopment() ? 100 : 10, // More lenient in development
        maxPerHour: isDevelopment() ? 1000 : 100,
        windowMs: 60 * 1000
      }
    };
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredLimits();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Check if user/IP is rate limited for a specific action
   */
  isRateLimited(userId, ip, action = 'general') {
    const config = this.rateLimits[action] || this.rateLimits.general;
    const now = Date.now();
    
    // Check user-based limits
    if (userId) {
      const userKey = `${userId}:${action}`;
      const userLimit = this.userLimits.get(userKey);
      
      if (this.checkLimit(userLimit, config, now)) {
        return {
          limited: true,
          type: 'user',
          retryAfter: this.calculateRetryAfter(userLimit, config, now)
        };
      }
      
      // Update user limit
      this.updateLimit(this.userLimits, userKey, now, config);
    }
    
    // Check IP-based limits
    if (ip) {
      const ipKey = `${ip}:${action}`;
      const ipLimit = this.ipLimits.get(ipKey);
      
      if (this.checkLimit(ipLimit, config, now)) {
        return {
          limited: true,
          type: 'ip',
          retryAfter: this.calculateRetryAfter(ipLimit, config, now)
        };
      }
      
      // Update IP limit
      this.updateLimit(this.ipLimits, ipKey, now, config);
    }
    
    return { limited: false };
  }
  
  /**
   * Check if a specific limit is exceeded
   */
  checkLimit(limitData, config, now) {
    if (!limitData) return false;
    
    // Check if window has expired
    if (now - limitData.windowStart > config.windowMs) {
      return false; // Window expired, reset
    }
    
    return limitData.count >= config.maxPerMinute;
  }
  
  /**
   * Update limit counters
   */
  updateLimit(limitMap, key, now, config) {
    const existing = limitMap.get(key);
    
    if (!existing || (now - existing.windowStart) > config.windowMs) {
      // New window
      limitMap.set(key, {
        count: 1,
        windowStart: now,
        config
      });
    } else {
      // Increment existing
      existing.count++;
    }
  }
  
  /**
   * Calculate retry after time
   */
  calculateRetryAfter(limitData, config, now) {
    if (!limitData) return 60; // Default 60 seconds
    
    const windowEnd = limitData.windowStart + config.windowMs;
    const retryAfter = Math.ceil((windowEnd - now) / 1000);
    return Math.max(retryAfter, 1);
  }
  
  /**
   * Clean up expired limits
   */
  cleanupExpiredLimits() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    // Clean user limits
    for (const [key, limit] of this.userLimits) {
      if (now - limit.windowStart > maxAge) {
        this.userLimits.delete(key);
      }
    }
    
    // Clean IP limits
    for (const [key, limit] of this.ipLimits) {
      if (now - limit.windowStart > maxAge) {
        this.ipLimits.delete(key);
      }
    }
    
    console.log(`🧹 Rate limiter cleanup: ${this.userLimits.size} user limits, ${this.ipLimits.size} IP limits`);
  }
  
  /**
   * Get current rate limit status
   */
  getLimitStatus(userId, ip, action = 'general') {
    const config = this.rateLimits[action] || this.rateLimits.general;
    const now = Date.now();
    
    const status = {
      action,
      limits: {
        maxPerMinute: config.maxPerMinute,
        windowMs: config.windowMs
      },
      user: null,
      ip: null
    };
    
    // User status
    if (userId) {
      const userKey = `${userId}:${action}`;
      const userLimit = this.userLimits.get(userKey);
      if (userLimit && (now - userLimit.windowStart) <= config.windowMs) {
        status.user = {
          count: userLimit.count,
          remaining: Math.max(0, config.maxPerMinute - userLimit.count),
          resetTime: userLimit.windowStart + config.windowMs
        };
      }
    }
    
    // IP status
    if (ip) {
      const ipKey = `${ip}:${action}`;
      const ipLimit = this.ipLimits.get(ipKey);
      if (ipLimit && (now - ipLimit.windowStart) <= config.windowMs) {
        status.ip = {
          count: ipLimit.count,
          remaining: Math.max(0, config.maxPerMinute - ipLimit.count),
          resetTime: ipLimit.windowStart + config.windowMs
        };
      }
    }
    
    return status;
  }
  
  /**
   * Shutdown cleanup
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.userLimits.clear();
    this.ipLimits.clear();
  }
}

/**
 * Express Rate Limiters for API endpoints
 */

// General API rate limiter
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(15 * 60) // seconds
    });
  }
});

// Auth endpoints rate limiter
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.warn(`🚨 Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

// File upload rate limiter
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Message API rate limiter
export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 message operations per minute
  message: {
    success: false,
    message: 'Too many message requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create singleton instance
const socketRateLimiter = new SocketRateLimiter();

export default socketRateLimiter;