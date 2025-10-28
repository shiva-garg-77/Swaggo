/**
 * GraphQL Rate Limiting Middleware
 * 
 * Implements rate limiting for GraphQL queries to prevent abuse and DoS attacks.
 * 
 * @module GraphQLRateLimiting
 * @version 1.0.0
 */

import { createRateLimitRule, getGraphQLRateLimiter } from 'graphql-rate-limit';
import { logger } from '../../utils/SanitizedLogger.js';

/**
| * Create GraphQL rate limiting rules
| * @returns {Object} Rate limiting rules
| */
const createRateLimitRules = () => {
  // Define rate limiting rules for different operations
  const rateLimitRule = createRateLimitRule({
    identifyContext: (ctx) => {
      // Use user ID if authenticated, otherwise use IP address
      if (ctx.user && ctx.user.id) {
        return `user:${ctx.user.id}`;
      }
      
      // Extract IP address from context
      const ipAddress = ctx.authContext?.ipAddress || 
                       ctx.req?.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                       ctx.req?.connection?.remoteAddress ||
                       'unknown';
      
      return `ip:${ipAddress}`;
    },
    store: new Map(), // In-memory store (use Redis in production)
    formatError: (limit) => {
      logger.warn('GraphQL rate limit exceeded', {
        limit,
        timestamp: new Date().toISOString()
      });
      
      return new Error(`Rate limit exceeded. Please try again in ${Math.ceil(limit.resetIn / 1000)} seconds.`);
    }
  });

  return {
    // Global rate limit: 1000 requests per 15 minutes
    globalLimit: rateLimitRule({
      window: '15m',
      max: 1000,
      message: 'Too many requests. Please try again later.'
    }),
    
    // Query rate limit: 500 queries per 15 minutes
    queryLimit: rateLimitRule({
      window: '15m',
      max: 500,
      message: 'Too many queries. Please try again later.'
    }),
    
    // Mutation rate limit: 100 mutations per 15 minutes
    mutationLimit: rateLimitRule({
      window: '15m',
      max: 100,
      message: 'Too many mutations. Please try again later.'
    }),
    
    // Specific field rate limits
    // User lookup limit: 50 per hour
    userLookupLimit: rateLimitRule({
      window: '1h',
      max: 50,
      message: 'Too many user lookups. Please try again later.'
    }),
    
    // Message sending limit: 200 per hour
    messageSendLimit: rateLimitRule({
      window: '1h',
      max: 200,
      message: 'Too many messages. Please try again later.'
    }),
    
    // File upload limit: 20 per day
    fileUploadLimit: rateLimitRule({
      window: '1d',
      max: 20,
      message: 'Too many file uploads. Please try again tomorrow.'
    })
  };
};

/**
| * Get GraphQL rate limiter with configured rules
| * @returns {Function} GraphQL rate limiter middleware
| */
const getGraphQLRateLimiterMiddleware = () => {
  const rules = createRateLimitRules();
  
  return getGraphQLRateLimiter({
    rules: {
      Query: {
        '*': rules.queryLimit,
        getUser: rules.userLookupLimit,
        getUsers: rules.userLookupLimit,
        searchUsers: rules.userLookupLimit,
        getChat: rules.queryLimit,
        getChats: rules.queryLimit,
        getMessages: rules.queryLimit,
        searchMessages: rules.queryLimit
      },
      Mutation: {
        '*': rules.mutationLimit,
        createUser: rules.mutationLimit,
        updateUser: rules.mutationLimit,
        deleteUser: rules.mutationLimit,
        createChat: rules.mutationLimit,
        updateChat: rules.mutationLimit,
        deleteChat: rules.mutationLimit,
        sendMessage: rules.messageSendLimit,
        updateMessage: rules.mutationLimit,
        deleteMessage: rules.mutationLimit,
        uploadFile: rules.fileUploadLimit,
        createProfile: rules.mutationLimit,
        updateProfile: rules.mutationLimit
      }
    },
    fallbackRule: rules.globalLimit
  });
};

export { createRateLimitRules, getGraphQLRateLimiterMiddleware };
