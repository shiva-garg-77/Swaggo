import redisClient from '../../utils/RedisClient.js';
import logger from '../../utils/logger.js';
import EnhancedCacheService from './EnhancedCacheService.js';

/**
 * Redis Cache Service
 * Provides a high-level caching interface with Redis backend
 * 🔧 CACHING STRATEGY #140: Enhanced with L1+L2 caching
 */

class RedisCacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutes default TTL
    this.prefix = 'swaggo:cache:';
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    this.enhancedCache = EnhancedCacheService;
  }

  /**
   * Initialize the cache service
   */
  async initialize() {
    // 🔧 CACHING STRATEGY #140: Initialize enhanced cache service
    await this.enhancedCache.initialize();
    logger.info('Redis Cache Service initialized with enhanced caching');
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.get(key);
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.delete(key);
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.exists(key);
  }

  /**
   * Set multiple values in cache
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.mset(keyValuePairs, ttl);
  }

  /**
   * Get multiple values from cache
   */
  async mget(keys) {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.mget(keys);
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key, amount = 1, ttl = this.defaultTTL) {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.increment(key, amount, ttl);
  }

  /**
   * Clear all cache entries with our prefix
   */
  async flush() {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.flush();
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    // 🔧 CACHING STRATEGY #140: Use enhanced cache service
    return await this.enhancedCache.getStats();
  }

  /**
   * Create a cache wrapper for a function
   * 🔧 CACHING STRATEGY #140: Add cache wrapper functionality
   */
  async cacheWrapper(key, func, ttl = this.defaultTTL, ...args) {
    return await this.enhancedCache.cacheWrapper(key, func, ttl, ...args);
  }
}

// Export singleton instance
export default new RedisCacheService();