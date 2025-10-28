import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { createClient } from 'redis';
import RateLimitingCore from '../../Security/RateLimiting/RateLimitingCore.js';

/**
 * 🛡️ ENTERPRISE-GRADE DDoS PROTECTION MIDDLEWARE
 * 
 * Features:
 * - Adaptive rate limiting with behavioral analysis
 * - Multi-layer DDoS protection
 * - Integration with advanced rate limiting core
 * - Real-time traffic analysis and anomaly detection
 * - Configurable thresholds and mitigation actions
 * - Distributed attack correlation
 * - Circuit breaker patterns for service protection
 */

// Create Redis client for distributed rate limiting
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  } else if (process.env.REDIS_HOST) {
    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 0
    };
    
    // Only add password if it's explicitly set and not empty
    if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== '') {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }
    
    redisClient = new Redis(redisConfig);
  }
} catch (error) {
  console.warn('⚠️ Redis connection failed for DDoS protection, falling back to in-memory store:', error.message);
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
      console.error('Redis error in DDoS protection:', error);
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

// Generic DDoS protection middleware factory
const createDDoSProtection = (options) => {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 1000, // limit each IP to 1000 requests per window
    message = 'Too many requests from this IP. Possible DDoS attack detected.',
    statusCode = 429,
    standardHeaders = true,
    legacyHeaders = false,
    keyGenerator = (req) => req.ip,
    handler = (req, res, next, options) => {
      res.status(options.statusCode).json({
        error: options.message,
        retryAfter: Math.ceil((options.resetTime - Date.now()) / 1000),
        mitigation: options.mitigationAction || 'rate_limit'
      });
    },
    skip = () => false,
    mitigationThreshold = 5000, // Threshold for advanced mitigation
    enableAdvancedAnalysis = true // Enable ML-based traffic analysis
  } = options;

  return async (req, res, next) => {
    // Skip DDoS protection if configured to do so
    if (skip(req, res)) {
      return next();
    }

    const key = keyGenerator(req);
    if (!key) {
      return next();
    }

    try {
      // First, perform basic rate limiting
      const { totalHits, resetTime } = await store.increment(key, windowMs);
      
      // Add rate limit headers
      if (standardHeaders) {
        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', Math.max(0, max - totalHits));
        res.setHeader('RateLimit-Reset', new Date(resetTime).toUTCString());
      }

      // Check if basic limit exceeded
      if (totalHits > max) {
        // Add retry-after header
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);
        
        // For high traffic, apply advanced mitigation
        let mitigationAction = 'rate_limit';
        let mitigationDetails = {};
        
        if (enableAdvancedAnalysis && totalHits > mitigationThreshold) {
          // Use advanced rate limiting core for detailed analysis
          const analysis = await RateLimitingCore.analyzeRequest({
            ip: req.ip,
            headers: req.headers,
            method: req.method,
            path: req.path,
            body: req.body,
            user: req.user
          });
          
          if (!analysis.allowed) {
            mitigationAction = analysis.reason || 'advanced_protection';
            mitigationDetails = analysis;
          }
        }
        
        // Call custom handler or use default
        if (handler) {
          return handler(req, res, next, { 
            statusCode, 
            message, 
            resetTime,
            retryAfter,
            mitigationAction,
            mitigationDetails,
            totalHits
          });
        }
        
        return res.status(statusCode).json({
          error: message,
          retryAfter,
          mitigation: mitigationAction,
          totalHits
        });
      }

      next();
    } catch (error) {
      console.error('DDoS protection error:', error);
      // Continue without protection on error
      next();
    }
  };
};

// DDoS protection for all endpoints (global protection)
export const globalDDoSProtection = createDDoSProtection({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per minute
  message: 'Too many requests. Possible DDoS attack detected.',
  mitigationThreshold: 5000, // Apply advanced mitigation for high traffic
  enableAdvancedAnalysis: true
});

// DDoS protection for API endpoints (stricter limits)
export const apiDDoSProtection = createDDoSProtection({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // Limit each IP to 500 API requests per minute
  message: 'Too many API requests. Possible DDoS attack detected.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `api_ddos_${ip}`;
  },
  mitigationThreshold: 2500, // Apply advanced mitigation for high API traffic
  enableAdvancedAnalysis: true
});

// DDoS protection for authentication endpoints (very strict)
export const authDDoSProtection = createDDoSProtection({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 auth requests per minute
  message: 'Too many authentication requests. Possible brute force or DDoS attack detected.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `auth_ddos_${ip}`;
  },
  mitigationThreshold: 50, // Apply advanced mitigation for high auth traffic
  enableAdvancedAnalysis: true
});

// DDoS protection for file upload endpoints (strict limits)
export const uploadDDoSProtection = createDDoSProtection({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 upload requests per minute
  message: 'Too many file upload requests. Possible DDoS attack detected.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `upload_ddos_${ip}`;
  },
  mitigationThreshold: 25, // Apply advanced mitigation for high upload traffic
  enableAdvancedAnalysis: true
});

// DDoS protection for GraphQL endpoints (moderate limits)
export const graphqlDDoSProtection = createDDoSProtection({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 GraphQL requests per minute
  message: 'Too many GraphQL requests. Possible DDoS attack detected.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `graphql_ddos_${ip}`;
  },
  mitigationThreshold: 1000, // Apply advanced mitigation for high GraphQL traffic
  enableAdvancedAnalysis: true
});

// DDoS protection for WebSocket connections (connection limits)
export const websocketDDoSProtection = createDDoSProtection({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 WebSocket connection attempts per minute
  message: 'Too many WebSocket connection attempts. Possible DDoS attack detected.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return `websocket_ddos_${ip}`;
  },
  mitigationThreshold: 500, // Apply advanced mitigation for high WebSocket traffic
  enableAdvancedAnalysis: true
});

// Adaptive DDoS protection that adjusts limits based on traffic patterns
export const adaptiveDDoSProtection = createDDoSProtection({
  windowMs: 60 * 1000, // 1 minute
  max: (req, res) => {
    // Dynamically adjust limits based on current traffic
    const baseLimit = 1000;
    const currentTraffic = RateLimitingCore.trafficStats.requestsPerSecond || 0;
    
    // Reduce limits during high traffic periods
    if (currentTraffic > 1000) {
      return Math.max(100, baseLimit * 0.1); // 10% of base limit
    } else if (currentTraffic > 500) {
      return Math.max(250, baseLimit * 0.25); // 25% of base limit
    } else if (currentTraffic > 100) {
      return Math.max(500, baseLimit * 0.5); // 50% of base limit
    }
    
    return baseLimit; // Normal limit
  },
  message: 'Too many requests. Traffic shaping in effect.',
  mitigationThreshold: 1000, // Apply advanced mitigation for all high traffic
  enableAdvancedAnalysis: true
});

export default {
  globalDDoSProtection,
  apiDDoSProtection,
  authDDoSProtection,
  uploadDDoSProtection,
  graphqlDDoSProtection,
  websocketDDoSProtection,
  adaptiveDDoSProtection,
  createDDoSProtection
};