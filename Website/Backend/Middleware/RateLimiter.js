import rateLimit from 'express-rate-limit';
import { isDevelopment } from '../Config/EnvironmentValidator.js';
import Redis from 'ioredis';

/**
 * Socket Rate Limiting System with Redis Support
 * Prevents DoS attacks and abuse with adaptive rate limiting
 */
class SocketRateLimiter {
  constructor() {
    // Try to connect to Redis for distributed rate limiting
    this.redis = null;
    this.initRedis();
    
    // User-based rate limiting
    this.userLimits = new Map(); // userId -> { count, windowStart, limits, penaltyLevel }
    
    // IP-based rate limiting  
    this.ipLimits = new Map(); // ip -> { count, windowStart, limits, penaltyLevel }
    
    // Rate limit configurations with adaptive limits
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
      
      // Typing indicator limits - Relaxed for fast typers with auto-stop on server
      typing: {
        maxPerMinute: isDevelopment() ? 1000 : 300,  // Increased for better UX
        maxPerHour: isDevelopment() ? 20000 : 5000,  // Increased proportionally
        windowMs: 60 * 1000  // 1 minute window
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
    
    // Progressive penalty levels with exponential backoff
    this.penaltyLevels = [
      { level: 0, multiplier: 1.0, description: "Normal" },
      { level: 1, multiplier: 0.5, description: "Light penalty" },
      { level: 2, multiplier: 0.25, description: "Moderate penalty" },
      { level: 3, multiplier: 0.1, description: "Heavy penalty" },
      { level: 4, multiplier: 0.01, description: "Severe penalty" }
    ];
    
    // User trust scores for adaptive rate limiting
    this.userTrustScores = new Map(); // userId -> trustScore (0-100)
    
    // Suspicious activity log
    this.suspiciousActivity = [];
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredLimits();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Initialize Redis connection for distributed rate limiting
   */
  async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 3
        });
        
        this.redis.on('connect', () => {
          console.log('✅ Redis connected for rate limiting');
        });
        
        this.redis.on('error', (error) => {
          console.warn('⚠️ Redis connection error for rate limiting:', error.message);
          this.redis = null; // Fall back to in-memory
        });
      } else if (process.env.REDIS_HOST) {
        this.redis = new Redis({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 3
        });
        
        this.redis.on('connect', () => {
          console.log('✅ Redis connected for rate limiting');
        });
        
        this.redis.on('error', (error) => {
          console.warn('⚠️ Redis connection error for rate limiting:', error.message);
          this.redis = null; // Fall back to in-memory
        });
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize Redis for rate limiting:', error.message);
      this.redis = null;
    }
  }
  
  /**
   * Check if user/IP is rate limited for a specific action with Redis support
   */
  async isRateLimited(userId, ip, action = 'general') {
    const config = this.rateLimits[action] || this.rateLimits.general;
    const now = Date.now();
    
    // Check user-based limits with Redis if available
    if (userId) {
      const userKey = `${userId}:${action}`;
      let userLimit;
      
      if (this.redis) {
        try {
          const redisData = await this.redis.get(`rate_limit:${userKey}`);
          if (redisData) {
            userLimit = JSON.parse(redisData);
          }
        } catch (error) {
          console.warn('⚠️ Redis error reading user limit:', error.message);
        }
      } else {
        userLimit = this.userLimits.get(userKey);
      }
      
      if (this.checkLimit(userLimit, config, now)) {
        // Log suspicious activity
        this.logSuspiciousActivity({
          type: 'user',
          userId,
          ip,
          action,
          timestamp: new Date().toISOString(),
          limit: userLimit,
          config
        });
        
        return {
          limited: true,
          type: 'user',
          retryAfter: this.calculateRetryAfter(userLimit, config, now),
          penaltyLevel: userLimit ? userLimit.penaltyLevel : 0
        };
      }
      
      // Update user limit
      await this.updateLimit(this.userLimits, userKey, now, config, userId);
    }
    
    // Check IP-based limits with Redis if available
    if (ip) {
      const ipKey = `${ip}:${action}`;
      let ipLimit;
      
      if (this.redis) {
        try {
          const redisData = await this.redis.get(`rate_limit:${ipKey}`);
          if (redisData) {
            ipLimit = JSON.parse(redisData);
          }
        } catch (error) {
          console.warn('⚠️ Redis error reading IP limit:', error.message);
        }
      } else {
        ipLimit = this.ipLimits.get(ipKey);
      }
      
      if (this.checkLimit(ipLimit, config, now)) {
        // Log suspicious activity
        this.logSuspiciousActivity({
          type: 'ip',
          userId,
          ip,
          action,
          timestamp: new Date().toISOString(),
          limit: ipLimit,
          config
        });
        
        return {
          limited: true,
          type: 'ip',
          retryAfter: this.calculateRetryAfter(ipLimit, config, now),
          penaltyLevel: ipLimit ? ipLimit.penaltyLevel : 0
        };
      }
      
      // Update IP limit
      await this.updateLimit(this.ipLimits, ipKey, now, config, null, ip);
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
    
    // Apply progressive penalty and user trust score
    const penaltyMultiplier = this.penaltyLevels[limitData.penaltyLevel]?.multiplier || 1.0;
    const trustScore = limitData.userId ? (this.userTrustScores.get(limitData.userId) || 50) : 50;
    const trustMultiplier = 0.5 + (trustScore / 200); // 0.5 to 1.0 based on trust score
    const effectiveLimit = Math.max(1, Math.floor(config.maxPerMinute * penaltyMultiplier * trustMultiplier));
    
    return limitData.count >= effectiveLimit;
  }
  
  /**
   * Update limit counters with Redis support
   */
  async updateLimit(limitMap, key, now, config, userId = null, ip = null) {
    let existing;
    
    if (this.redis) {
      try {
        const redisData = await this.redis.get(`rate_limit:${key}`);
        if (redisData) {
          existing = JSON.parse(redisData);
        }
      } catch (error) {
        console.warn('⚠️ Redis error reading limit:', error.message);
      }
    } else {
      existing = limitMap.get(key);
    }
    
    let updatedLimit;
    
    if (!existing || (now - existing.windowStart) > config.windowMs) {
      // New window
      updatedLimit = {
        count: 1,
        windowStart: now,
        config,
        penaltyLevel: existing ? Math.max(0, existing.penaltyLevel - 1) : 0, // Reduce penalty level over time
        userId,
        ip
      };
    } else {
      // Increment existing
      updatedLimit = {
        ...existing,
        count: existing.count + 1
      };
      
      // Check if we need to increase penalty level
      if (updatedLimit.count > config.maxPerMinute * 1.5) {
        updatedLimit.penaltyLevel = Math.min(this.penaltyLevels.length - 1, updatedLimit.penaltyLevel + 1);
        console.warn(`🚨 Increased penalty level for ${key} to ${updatedLimit.penaltyLevel}`);
      }
    }
    
    // Save to Redis or in-memory
    if (this.redis) {
      try {
        await this.redis.setex(
          `rate_limit:${key}`,
          Math.ceil(config.windowMs / 1000), // TTL in seconds
          JSON.stringify(updatedLimit)
        );
      } catch (error) {
        console.warn('⚠️ Redis error saving limit:', error.message);
        // Fall back to in-memory
        limitMap.set(key, updatedLimit);
      }
    } else {
      limitMap.set(key, updatedLimit);
    }
  }
  
  /**
   * Calculate retry after time with exponential backoff
   */
  calculateRetryAfter(limitData, config, now) {
    if (!limitData) return 60; // Default 60 seconds
    
    const penaltyLevel = limitData.penaltyLevel || 0;
    const baseRetry = Math.ceil(config.windowMs / 1000);
    const exponentialBackoff = Math.pow(2, penaltyLevel); // 1, 2, 4, 8, 16...
    
    const retryAfter = baseRetry * exponentialBackoff;
    return Math.max(retryAfter, 1);
  }
  
  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(activity) {
    // Add to suspicious activity log
    this.suspiciousActivity.push({
      ...activity,
      id: this.suspiciousActivity.length + 1
    });
    
    // Keep only the last 1000 activities
    if (this.suspiciousActivity.length > 1000) {
      this.suspiciousActivity = this.suspiciousActivity.slice(-1000);
    }
    
    // Log to console
    console.warn(`🚨 SUSPICIOUS ACTIVITY DETECTED:`, {
      type: activity.type,
      userId: activity.userId,
      ip: activity.ip,
      action: activity.action,
      timestamp: activity.timestamp,
      count: activity.limit?.count,
      penaltyLevel: activity.limit?.penaltyLevel
    });
  }
  
  /**
   * Get suspicious activity log
   */
  getSuspiciousActivity(limit = 100) {
    return this.suspiciousActivity.slice(-limit);
  }
  
  /**
   * Update user trust score based on behavior
   */
  updateUserTrustScore(userId, scoreChange) {
    const currentScore = this.userTrustScores.get(userId) || 50;
    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
    this.userTrustScores.set(userId, newScore);
    
    // If we have Redis, also store the trust score there
    if (this.redis) {
      this.redis.setex(`trust_score:${userId}`, 24 * 60 * 60, newScore); // 24 hours TTL
    }
  }
  
  /**
   * Get user trust score
   */
  async getUserTrustScore(userId) {
    if (this.redis) {
      try {
        const score = await this.redis.get(`trust_score:${userId}`);
        return score ? parseInt(score) : 50;
      } catch (error) {
        console.warn('⚠️ Redis error getting trust score:', error.message);
      }
    }
    return this.userTrustScores.get(userId) || 50;
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
    
    // Clean user trust scores (older than 7 days)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    for (const [userId, score] of this.userTrustScores) {
      // We don't have timestamps for trust scores, so we'll keep them for now
      // In a real implementation, we'd store timestamps with trust scores
    }
    
    // Clean old suspicious activity (older than 24 hours)
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    this.suspiciousActivity = this.suspiciousActivity.filter(
      activity => new Date(activity.timestamp).getTime() > oneDayAgo
    );
    
    console.log(`🧹 Rate limiter cleanup: ${this.userLimits.size} user limits, ${this.ipLimits.size} IP limits`);
  }
  
  /**
   * Get current rate limit status
   */
  async getLimitStatus(userId, ip, action = 'general') {
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
      let userLimit;
      
      if (this.redis) {
        try {
          const redisData = await this.redis.get(`rate_limit:${userKey}`);
          if (redisData) {
            userLimit = JSON.parse(redisData);
          }
        } catch (error) {
          console.warn('⚠️ Redis error reading user limit status:', error.message);
        }
      } else {
        userLimit = this.userLimits.get(userKey);
      }
      
      if (userLimit && (now - userLimit.windowStart) <= config.windowMs) {
        const penaltyMultiplier = this.penaltyLevels[userLimit.penaltyLevel]?.multiplier || 1.0;
        const trustScore = await this.getUserTrustScore(userId);
        const trustMultiplier = 0.5 + (trustScore / 200); // 0.5 to 1.0 based on trust score
        const effectiveLimit = Math.max(1, Math.floor(config.maxPerMinute * penaltyMultiplier * trustMultiplier));
        
        status.user = {
          count: userLimit.count,
          remaining: Math.max(0, effectiveLimit - userLimit.count),
          resetTime: userLimit.windowStart + config.windowMs,
          penaltyLevel: userLimit.penaltyLevel,
          penaltyDescription: this.penaltyLevels[userLimit.penaltyLevel]?.description || "Unknown",
          effectiveLimit: effectiveLimit,
          trustScore: trustScore
        };
      }
    }
    
    // IP status
    if (ip) {
      const ipKey = `${ip}:${action}`;
      let ipLimit;
      
      if (this.redis) {
        try {
          const redisData = await this.redis.get(`rate_limit:${ipKey}`);
          if (redisData) {
            ipLimit = JSON.parse(redisData);
          }
        } catch (error) {
          console.warn('⚠️ Redis error reading IP limit status:', error.message);
        }
      } else {
        ipLimit = this.ipLimits.get(ipKey);
      }
      
      if (ipLimit && (now - ipLimit.windowStart) <= config.windowMs) {
        const penaltyMultiplier = this.penaltyLevels[ipLimit.penaltyLevel]?.multiplier || 1.0;
        const trustScore = 50; // Default trust score for IPs
        const trustMultiplier = 0.5 + (trustScore / 200); // 0.5 to 1.0 based on trust score
        const effectiveLimit = Math.max(1, Math.floor(config.maxPerMinute * penaltyMultiplier * trustMultiplier));
        
        status.ip = {
          count: ipLimit.count,
          remaining: Math.max(0, effectiveLimit - ipLimit.count),
          resetTime: ipLimit.windowStart + config.windowMs,
          penaltyLevel: ipLimit.penaltyLevel,
          penaltyDescription: this.penaltyLevels[ipLimit.penaltyLevel]?.description || "Unknown",
          effectiveLimit: effectiveLimit,
          trustScore: trustScore
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
    this.userTrustScores.clear();
    this.suspiciousActivity = [];
    
    if (this.redis) {
      this.redis.quit();
    }
  }
}

/**
 * Express Rate Limiters for API endpoints with Redis support
 */

// General API rate limiter with Redis support
let RedisStore;
try {
  RedisStore = (await import('rate-limit-redis')).default;
} catch (error) {
  console.warn('⚠️ rate-limit-redis not available, using in-memory store');
  RedisStore = null;
}

const createRedisRateLimit = (config) => {
  // Check if Redis is available
  let redisClient = null;
  try {
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        password: process.env.REDIS_PASSWORD,
        keyPrefix: 'api_rate_limit:'
      });
    } else if (process.env.REDIS_HOST) {
      redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        keyPrefix: 'api_rate_limit:'
      });
    }
  } catch (error) {
    console.warn('⚠️ Redis not available for API rate limiting:', error.message);
  }
  
  const options = {
    ...config,
    standardHeaders: true,
    legacyHeaders: false
  };
  
  // Add Redis store if available
  if (redisClient && RedisStore) {
    options.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'api_rate_limit'
    });
  }
  
  return rateLimit(options);
};

// General API rate limiter
export const generalRateLimit = createRedisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment() ? 2000 : 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
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
export const authRateLimit = createRedisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment() ? 50 : 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
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
export const uploadRateLimit = createRedisRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment() ? 100 : 20, // 20 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 minute'
  }
});

// Message API rate limiter
export const messageRateLimit = createRedisRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment() ? 500 : 100, // 100 message operations per minute
  message: {
    success: false,
    message: 'Too many message requests, please slow down.',
    retryAfter: '1 minute'
  }
});

// Create singleton instance
const socketRateLimiter = new SocketRateLimiter();

export default socketRateLimiter;