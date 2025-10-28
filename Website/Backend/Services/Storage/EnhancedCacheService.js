import redisClient from '../../utils/RedisClient.js';
import logger from '../../utils/logger.js';
import crypto from 'crypto';
import environmentConfig from '../../Config/EnvironmentConfig.js';

/**
 * Enhanced Cache Service
 * Provides a comprehensive caching interface with Redis backend and advanced features
 * 🔧 REDIS CONNECTION OPTIMIZATION #150: Enhanced with connection pooling and performance settings
 */

class EnhancedCacheService {
  constructor() {
    this.defaultTTL = environmentConfig.get('CACHE_TTL') || 300; // 5 minutes default TTL
    this.prefix = 'swaggo:cache:';
    this.cacheLayers = {
      L1: new Map(), // In-memory L1 cache
      L2: null // Redis L2 cache
    };
    this.maxL1Size = 1000; // Max size for L1 cache
    this.stats = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Initialize the cache service
   */
  async initialize() {
    try {
      // Initialize Redis connection if not already done
      if (!redisClient.checkConnection()) {
        await redisClient.initialize();
      }
      
      this.cacheLayers.L2 = redisClient.getClient();
      logger.info('🟢 Enhanced Cache Service initialized with L1+L2 caching');
      
      // 🔧 REDIS CONNECTION OPTIMIZATION #150: Log Redis connection stats
      // Commented out as getConnectionStats method doesn't exist
      // const redisStats = redisClient.getConnectionStats();
      // if (redisStats) {
      //   logger.info(`📊 Redis connection stats: ${JSON.stringify(redisStats)}`);
      // }
    } catch (error) {
      logger.error('❌ Failed to initialize Enhanced Cache Service:', {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Generate cache key with prefix and optional hash for long keys
   */
  generateKey(key) {
    const fullKey = `${this.prefix}${key}`;
    
    // If key is too long, hash it to avoid Redis key size limits
    if (fullKey.length > 250) {
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      return `${this.prefix}${hash}`;
    }
    
    return fullKey;
  }

  /**
   * Get value from cache (L1 first, then L2)
   */
  async get(key) {
    const fullKey = this.generateKey(key);
    
    try {
      // Try L1 cache first (fastest)
      if (this.cacheLayers.L1.has(fullKey)) {
        this.stats.hits++;
        this.stats.l1Hits++;
        logger.debug(`L1 cache hit for key: ${key}`);
        return this.cacheLayers.L1.get(fullKey);
      }
      
      // If not in L1, try L2 (Redis)
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const value = await this.cacheLayers.L2.get(fullKey);
        
        if (value !== null) {
          const parsedValue = JSON.parse(value);
          this.stats.hits++;
          this.stats.l2Hits++;
          logger.debug(`L2 cache hit for key: ${key}`);
          
          // Promote to L1 cache
          this.setL1(fullKey, parsedValue);
          
          return parsedValue;
        }
      }
      
      // Cache miss
      this.stats.misses++;
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Error getting from cache for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache (both L1 and L2)
   */
  async set(key, value, ttl = this.defaultTTL) {
    const fullKey = this.generateKey(key);
    
    try {
      // Set in L1 cache
      this.setL1(fullKey, value, ttl);
      
      // Set in L2 cache (Redis)
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const stringValue = JSON.stringify(value);
        
        if (ttl) {
          await this.cacheLayers.L2.setex(fullKey, ttl, stringValue);
        } else {
          await this.cacheLayers.L2.set(fullKey, stringValue);
        }
      }
      
      this.stats.sets++;
      logger.debug(`Cached value for key: ${key} with TTL: ${ttl}`);
      return true;
    } catch (error) {
      logger.error(`Error setting cache value for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Set value in L1 cache with size management
   */
  setL1(key, value, ttl = this.defaultTTL) {
    // Manage L1 cache size
    if (this.cacheLayers.L1.size >= this.maxL1Size) {
      // Remove oldest entries (simple FIFO)
      const firstKey = this.cacheLayers.L1.keys().next().value;
      if (firstKey) {
        this.cacheLayers.L1.delete(firstKey);
      }
    }
    
    this.cacheLayers.L1.set(key, value);
    
    // Set TTL for L1 cache entry
    if (ttl) {
      setTimeout(() => {
        this.cacheLayers.L1.delete(key);
      }, ttl * 1000);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    const fullKey = this.generateKey(key);
    
    try {
      // Delete from L1 cache
      this.cacheLayers.L1.delete(fullKey);
      
      // Delete from L2 cache (Redis)
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const result = await this.cacheLayers.L2.del(fullKey);
        
        if (result > 0) {
          logger.debug(`Deleted cache entry for key: ${key}`);
        } else {
          logger.debug(`No cache entry found for key: ${key}`);
        }
        
        this.stats.deletes++;
        return result > 0;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error deleting from cache for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    const fullKey = this.generateKey(key);
    
    try {
      // Check L1 cache first
      if (this.cacheLayers.L1.has(fullKey)) {
        return true;
      }
      
      // Check L2 cache (Redis)
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const result = await this.cacheLayers.L2.exists(fullKey);
        return result > 0;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error checking cache existence for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      // Set in L1 cache
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = this.generateKey(key);
        this.setL1(fullKey, value, ttl);
      }
      
      // Set in L2 cache (Redis)
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const keyValueArray = [];
        
        for (const [key, value] of Object.entries(keyValuePairs)) {
          const fullKey = this.generateKey(key);
          keyValueArray.push(fullKey, JSON.stringify(value));
        }
        
        if (keyValueArray.length > 0) {
          await this.cacheLayers.L2.mset(keyValueArray);
          
          // Set TTL for all keys if specified
          if (ttl) {
            for (const key of Object.keys(keyValuePairs)) {
              const fullKey = this.generateKey(key);
              await this.cacheLayers.L2.expire(fullKey, ttl);
            }
          }
          
          logger.debug(`Cached ${Object.keys(keyValuePairs).length} values`);
        }
      }
      
      this.stats.sets += Object.keys(keyValuePairs).length;
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
    try {
      const results = [];
      
      // Try to get from L1 cache first
      const l1MissingKeys = [];
      for (const key of keys) {
        const fullKey = this.generateKey(key);
        if (this.cacheLayers.L1.has(fullKey)) {
          results.push(this.cacheLayers.L1.get(fullKey));
          this.stats.hits++;
          this.stats.l1Hits++;
        } else {
          l1MissingKeys.push(key);
          results.push(null);
        }
      }
      
      // Get missing keys from L2 cache (Redis)
      if (l1MissingKeys.length > 0 && this.cacheLayers.L2 && redisClient.checkConnection()) {
        const fullKeys = l1MissingKeys.map(key => this.generateKey(key));
        const values = await this.cacheLayers.L2.mget(fullKeys);
        
        let l1Index = 0;
        for (let i = 0; i < results.length; i++) {
          if (results[i] === null) {
            const value = values[l1Index];
            if (value !== null) {
              const parsedValue = JSON.parse(value);
              results[i] = parsedValue;
              this.stats.hits++;
              this.stats.l2Hits++;
              
              // Promote to L1 cache
              this.setL1(fullKeys[i], parsedValue);
            } else {
              this.stats.misses++;
            }
            l1Index++;
          }
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error getting multiple cache values:', error.message);
      return [];
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key, amount = 1, ttl = this.defaultTTL) {
    const fullKey = this.generateKey(key);
    
    try {
      // Increment in L2 cache (Redis) - this is the source of truth
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const result = await this.cacheLayers.L2.incrby(fullKey, amount);
        
        // Set TTL if this is a new key
        if (result === amount && ttl) {
          await this.cacheLayers.L2.expire(fullKey, ttl);
        }
        
        // Update L1 cache
        if (this.cacheLayers.L1.has(fullKey)) {
          this.cacheLayers.L1.set(fullKey, result);
        }
        
        logger.debug(`Incremented cache key: ${key} by ${amount}`);
        return result;
      }
      
      return null;
    } catch (error) {
      logger.error(`Error incrementing cache value for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Clear all cache entries with our prefix
   */
  async flush() {
    try {
      // Clear L1 cache
      this.cacheLayers.L1.clear();
      
      // Clear L2 cache (Redis)
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const keys = await this.cacheLayers.L2.keys(`${this.prefix}*`);
        
        if (keys.length > 0) {
          await this.cacheLayers.L2.del(...keys);
          logger.info(`Flushed ${keys.length} cache entries`);
        } else {
          logger.info('No cache entries to flush');
        }
      }
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        l1Hits: 0,
        l2Hits: 0,
        sets: 0,
        deletes: 0
      };
      
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
    try {
      let redisStats = null;
      
      // Get Redis stats
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const info = await this.cacheLayers.L2.info();
        
        // Parse Redis info
        const infoLines = info.split('\n');
        const stats = {};
        
        infoLines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            stats[key.trim()] = value ? value.trim() : '';
          }
        });
        
        redisStats = stats;
      }
      
      // Get cache entry count
      let cacheEntries = 0;
      if (this.cacheLayers.L2 && redisClient.checkConnection()) {
        const keys = await this.cacheLayers.L2.keys(`${this.prefix}*`);
        cacheEntries = keys.length;
      }
      
      return {
        redisInfo: redisStats,
        cacheEntries,
        prefix: this.prefix,
        stats: this.stats,
        l1Size: this.cacheLayers.L1.size,
        hitRate: this.stats.hits > 0 ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0,
        l1HitRate: this.stats.l1Hits > 0 ? (this.stats.l1Hits / this.stats.hits) * 100 : 0,
        l2HitRate: this.stats.l2Hits > 0 ? (this.stats.l2Hits / this.stats.hits) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error.message);
      return null;
    }
  }

  /**
   * Create a cache wrapper for a function
   */
  async cacheWrapper(key, func, ttl = this.defaultTTL, ...args) {
    try {
      // Try to get from cache first
      const cachedResult = await this.get(key);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // Execute function and cache result
      const result = await func(...args);
      await this.set(key, result, ttl);
      
      return result;
    } catch (error) {
      logger.error(`Error in cache wrapper for key ${key}:`, error.message);
      // If cache fails, execute function directly
      return await func(...args);
    }
  }
}

// Export singleton instance
export default new EnhancedCacheService();
