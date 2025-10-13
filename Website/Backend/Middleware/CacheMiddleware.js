import redisCacheService from '../Services/RedisCacheService.js';
import logger from '../utils/logger.js';

/**
 * Redis Cache Middleware
 * Provides Express middleware for caching API responses in Redis
 */

/**
 * Cache middleware for Express routes
 * @param {string} cacheKey - The cache key or function to generate cache key
 * @param {number} ttl - Time to live in seconds (default: 300)
 * @param {function} shouldCache - Function to determine if response should be cached
 */
export const redisCacheMiddleware = (cacheKey, ttl = 300, shouldCache = null) => {
  return async (req, res, next) => {
    // Skip caching if Redis is not connected
    if (!redisCacheService.isConnected()) {
      logger.debug('Redis not connected, skipping cache middleware');
      return next();
    }

    try {
      // Generate cache key
      const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
      
      if (!key) {
        logger.debug('No cache key provided, skipping cache');
        return next();
      }

      // Try to get from cache first
      const cached = await redisCacheService.get(key);
      
      if (cached !== null) {
        logger.info(`Cache hit for key: ${key}`);
        return res.json(cached);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Check if we should cache this response
        const shouldCacheResult = shouldCache ? shouldCache(req, res, data) : 
          (res.statusCode >= 200 && res.statusCode < 300);
        
        if (shouldCacheResult) {
          // Cache the response
          redisCacheService.set(key, data, ttl)
            .then(() => {
              logger.info(`Cached response for key: ${key} with TTL: ${ttl}`);
            })
            .catch(error => {
              logger.error('Error caching response:', error.message);
            });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error in cache middleware:', error.message);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * @param {string|string[]} cacheKeys - Cache key(s) to invalidate
 */
export const cacheInvalidateMiddleware = (cacheKeys) => {
  return async (req, res, next) => {
    // Skip if Redis is not connected
    if (!redisCacheService.isConnected()) {
      return next();
    }

    try {
      // Override res.json to invalidate cache after successful response
      const originalJson = res.json;
      res.json = function(data) {
        // Only invalidate on successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
          
          // Delete cache entries
          Promise.all(keys.map(key => redisCacheService.delete(key)))
            .then(results => {
              const deletedCount = results.filter(Boolean).length;
              if (deletedCount > 0) {
                logger.info(`Invalidated ${deletedCount} cache entries`);
              }
            })
            .catch(error => {
              logger.error('Error invalidating cache:', error.message);
            });
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Error in cache invalidation middleware:', error.message);
      next();
    }
  };
};

/**
 * Generic cache wrapper for async functions
 * @param {string} key - Cache key
 * @param {function} fn - Async function to cache
 * @param {number} ttl - Time to live in seconds
 * @param {boolean} forceRefresh - Force refresh cache
 */
export const cachedFunction = async (key, fn, ttl = 300, forceRefresh = false) => {
  // Skip if Redis is not connected
  if (!redisCacheService.isConnected()) {
    logger.debug('Redis not connected, executing function without cache');
    return await fn();
  }

  try {
    // Try to get from cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await redisCacheService.get(key);
      if (cached !== null) {
        logger.debug(`Cache hit for function result: ${key}`);
        return cached;
      }
    }

    // Execute function
    const result = await fn();
    
    // Cache result
    await redisCacheService.set(key, result, ttl);
    logger.debug(`Cached function result for key: ${key} with TTL: ${ttl}`);
    
    return result;
  } catch (error) {
    logger.error('Error in cached function:', error.message);
    // Fallback to executing function without cache
    return await fn();
  }
};

export default {
  redisCacheMiddleware,
  cacheInvalidateMiddleware,
  cachedFunction
};