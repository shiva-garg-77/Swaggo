import redisClient from '../utils/RedisClient.js';
import logger from '../utils/logger.js';

/**
 * Redis Cache Service
 * Provides a high-level caching interface with Redis backend
 */

class RedisCacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutes default TTL
    this.prefix = 'swaggo:cache:';
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
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache get operation skipped');
      return null;
    }

    try {
      const client = redisClient.getClient();
      const fullKey = this.generateKey(key);
      const value = await client.get(fullKey);
      
      if (value === null) {
        logger.debug(`Cache miss for key: ${key}`);
        return null;
      }
      
      logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(value);
    } catch (error) {
      logger.error('Error getting from cache:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache set operation skipped');
      return false;
    }

    try {
      const client = redisClient.getClient();
      const fullKey = this.generateKey(key);
      const stringValue = JSON.stringify(value);
      
      if (ttl) {
        await client.setex(fullKey, ttl, stringValue);
      } else {
        await client.set(fullKey, stringValue);
      }
      
      logger.debug(`Cached value for key: ${key} with TTL: ${ttl}`);
      return true;
    } catch (error) {
      logger.error('Error setting cache value:', error.message);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache delete operation skipped');
      return false;
    }

    try {
      const client = redisClient.getClient();
      const fullKey = this.generateKey(key);
      const result = await client.del(fullKey);
      
      if (result > 0) {
        logger.debug(`Deleted cache entry for key: ${key}`);
      } else {
        logger.debug(`No cache entry found for key: ${key}`);
      }
      
      return result > 0;
    } catch (error) {
      logger.error('Error deleting from cache:', error.message);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache exists operation skipped');
      return false;
    }

    try {
      const client = redisClient.getClient();
      const fullKey = this.generateKey(key);
      const result = await client.exists(fullKey);
      return result > 0;
    } catch (error) {
      logger.error('Error checking cache existence:', error.message);
      return false;
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache mset operation skipped');
      return false;
    }

    try {
      const client = redisClient.getClient();
      const keyValueArray = [];
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = this.generateKey(key);
        keyValueArray.push(fullKey, JSON.stringify(value));
      }
      
      if (keyValueArray.length > 0) {
        await client.mset(keyValueArray);
        
        // Set TTL for all keys if specified
        if (ttl) {
          for (const key of Object.keys(keyValuePairs)) {
            const fullKey = this.generateKey(key);
            await client.expire(fullKey, ttl);
          }
        }
        
        logger.debug(`Cached ${Object.keys(keyValuePairs).length} values`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error setting multiple cache values:', error.message);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget(keys) {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache mget operation skipped');
      return [];
    }

    try {
      const client = redisClient.getClient();
      const fullKeys = keys.map(key => this.generateKey(key));
      const values = await client.mget(fullKeys);
      
      return values.map((value, index) => {
        if (value === null) {
          logger.debug(`Cache miss for key: ${keys[index]}`);
          return null;
        }
        
        logger.debug(`Cache hit for key: ${keys[index]}`);
        return JSON.parse(value);
      });
    } catch (error) {
      logger.error('Error getting multiple cache values:', error.message);
      return [];
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key, amount = 1, ttl = this.defaultTTL) {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache increment operation skipped');
      return null;
    }

    try {
      const client = redisClient.getClient();
      const fullKey = this.generateKey(key);
      const result = await client.incrby(fullKey, amount);
      
      // Set TTL if this is a new key
      if (result === amount && ttl) {
        await client.expire(fullKey, ttl);
      }
      
      logger.debug(`Incremented cache key: ${key} by ${amount}`);
      return result;
    } catch (error) {
      logger.error('Error incrementing cache value:', error.message);
      return null;
    }
  }

  /**
   * Clear all cache entries with our prefix
   */
  async flush() {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache flush operation skipped');
      return false;
    }

    try {
      const client = redisClient.getClient();
      const keys = await client.keys(`${this.prefix}*`);
      
      if (keys.length > 0) {
        await client.del(...keys);
        logger.info(`Flushed ${keys.length} cache entries`);
      } else {
        logger.info('No cache entries to flush');
      }
      
      return true;
    } catch (error) {
      logger.error('Error flushing cache:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!redisClient.isConnected()) {
      logger.warn('Redis not connected, cache stats operation skipped');
      return null;
    }

    try {
      const client = redisClient.getClient();
      const info = await client.info();
      
      // Parse Redis info
      const infoLines = info.split('\n');
      const stats = {};
      
      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key.trim()] = value ? value.trim() : '';
        }
      });
      
      // Get our cache-specific stats
      const cacheKeys = await client.keys(`${this.prefix}*`);
      
      return {
        redisInfo: stats,
        cacheEntries: cacheKeys.length,
        prefix: this.prefix
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error.message);
      return null;
    }
  }
}

// Export singleton instance
export default new RedisCacheService();