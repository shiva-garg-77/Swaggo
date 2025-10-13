import Redis from 'ioredis';
import logger from './logger.js';

/**
 * Redis Client Utility
 * Provides a centralized Redis client with connection management and error handling
 */

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    if (this.isConnecting) {
      logger.info('Redis connection already in progress');
      return;
    }

    if (this.isConnected) {
      logger.info('Redis already connected');
      return;
    }

    this.isConnecting = true;

    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        lazyConnect: true
      };

      // Use Redis URL if provided
      if (process.env.REDIS_URL) {
        this.client = new Redis(process.env.REDIS_URL, redisConfig);
      } else {
        this.client = new Redis(redisConfig);
      }

      // Connection event handlers
      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.isConnecting = false;
        logger.info('Redis client connected and ready');
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis client connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      logger.info('Redis connection test successful');
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to initialize Redis client:', error.message);
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isConnected() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  /**
   * Gracefully disconnect Redis
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis client disconnected');
      } catch (error) {
        logger.error('Error disconnecting Redis client:', error.message);
      } finally {
        this.isConnected = false;
        this.isConnecting = false;
      }
    }
  }
}

// Export singleton instance
export default new RedisClient();