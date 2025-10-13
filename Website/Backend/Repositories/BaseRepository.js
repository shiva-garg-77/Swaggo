import { logger } from '../utils/SanitizedLogger.js';
import { ValidationError } from '../Helper/UnifiedErrorHandling.js';
// 🔧 OPTIMIZATION #77: Import Redis for caching
import Redis from 'ioredis';
import crypto from 'crypto';

/**
 * @fileoverview Base repository class providing common data access functionality
 * @module BaseRepository
 */

/**
 * Default cache TTL in seconds
 * @type {number}
 */
const DEFAULT_CACHE_TTL = 300; // 5 minutes

/**
 * Default cache key prefix
 * @type {string}
 */
const DEFAULT_CACHE_KEY_PREFIX = 'swaggo:repo:';

/**
 * Default maximum items per page
 * @type {number}
 */
const DEFAULT_MAX_PAGE_SIZE = 100;

class BaseRepository {
  /**
   * @constructor
   * @description Initialize base repository with model
   * @param {Object} model - Mongoose model
   */
  constructor(model) {
    if (!model) {
      throw new ValidationError('Model is required for repository');
    }
    this.model = model;
    this.logger = logger;
    
    // 🔧 OPTIMIZATION #77: Initialize Redis cache if enabled
    this.cache = null;
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        this.cache = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3
        });
        
        this.cache.on('ready', () => {
          logger.info('Redis cache connected for repository');
        });
        
        this.cache.on('error', (err) => {
          logger.warn('Redis cache error in repository', { error: err.message });
        });
      } catch (error) {
        logger.warn('Failed to initialize Redis cache for repository', { error: error.message });
      }
    }
    
    // Cache configuration
    this.cacheConfig = {
      ttl: parseInt(process.env.CACHE_TTL) || DEFAULT_CACHE_TTL,
      keyPrefix: DEFAULT_CACHE_KEY_PREFIX
    };
  }
  
  /**
   * Generate cache key for query
   */
  generateCacheKey(criteria, options) {
    const criteriaStr = JSON.stringify(criteria, Object.keys(criteria || {}).sort());
    const optionsStr = JSON.stringify(options, Object.keys(options || {}).sort());
    const hash = crypto.createHash('md5').update(`${criteriaStr}:${optionsStr}`).digest('hex');
    return `${this.cacheConfig.keyPrefix}${this.model.modelName}:${hash}`;
  }
  
  /**
   * Get data from cache
   */
  async getFromCache(key) {
    if (!this.cache) return null;
    
    try {
      const cached = await this.cache.get(key);
      if (cached) {
        this.logger.debug(`Cache hit for ${key}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Cache get error', { error: error.message });
    }
    
    return null;
  }
  
  /**
   * Set data in cache
   */
  async setInCache(key, data) {
    if (!this.cache) return;
    
    try {
      await this.cache.setex(key, this.cacheConfig.ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.warn('Cache set error', { error: error.message });
    }
  }

  /**
   * Find documents by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of documents
   */
  async find(criteria = {}, options = {}) {
    try {
      // 🔧 OPTIMIZATION #77: Try cache first for read-only queries
      const useCache = this.cache && options.useCache !== false && !options.skip && !options.limit;
      let cacheKey;
      
      if (useCache) {
        cacheKey = this.generateCacheKey(criteria, options);
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      const query = this.model.find(criteria);
      
      // Apply options
      if (options.sort) query.sort(options.sort);
      if (options.limit) query.limit(options.limit);
      if (options.skip) query.skip(options.skip);
      if (options.select) query.select(options.select);
      if (options.populate) query.populate(options.populate);
      // 🔧 OPTIMIZATION #75: Always use lean for better performance unless explicitly disabled
      if (options.lean !== false) query.lean();
      
      const results = await query.exec();
      this.logger.debug(`Found ${results.length} documents in ${this.model.modelName}`, { criteria, options });
      
      // 🔧 OPTIMIZATION #77: Store in cache if enabled
      if (useCache && results) {
        await this.setInCache(cacheKey, results);
      }
      
      return results;
    } catch (error) {
      this.logger.error(`Error finding documents in ${this.model.modelName}:`, { error: error.message, criteria, options });
      throw error;
    }
  }

  /**
   * Find one document by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Document
   */
  async findOne(criteria = {}, options = {}) {
    try {
      // 🔧 OPTIMIZATION #77: Try cache first for read-only queries
      const useCache = this.cache && options.useCache !== false;
      let cacheKey;
      
      if (useCache) {
        cacheKey = this.generateCacheKey(criteria, options);
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      const query = this.model.findOne(criteria);
      
      // Apply options
      if (options.select) query.select(options.select);
      if (options.populate) query.populate(options.populate);
      // 🔧 OPTIMIZATION #75: Always use lean for better performance unless explicitly disabled
      if (options.lean !== false) query.lean();
      
      const result = await query.exec();
      this.logger.debug(`Found document in ${this.model.modelName}`, { criteria, options });
      
      // 🔧 OPTIMIZATION #77: Store in cache if enabled
      if (useCache && result) {
        await this.setInCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error finding document in ${this.model.modelName}:`, { error: error.message, criteria, options });
      throw error;
    }
  }

  /**
   * Find document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Document
   */
  async findById(id, options = {}) {
    try {
      // 🔧 OPTIMIZATION #77: Try cache first for read-only queries
      const useCache = this.cache && options.useCache !== false;
      let cacheKey;
      
      if (useCache) {
        cacheKey = this.generateCacheKey({ _id: id }, options);
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      const query = this.model.findById(id);
      
      // Apply options
      if (options.select) query.select(options.select);
      if (options.populate) query.populate(options.populate);
      // 🔧 OPTIMIZATION #75: Always use lean for better performance unless explicitly disabled
      if (options.lean !== false) query.lean();
      
      const result = await query.exec();
      this.logger.debug(`Found document by ID in ${this.model.modelName}`, { id, options });
      
      // 🔧 OPTIMIZATION #77: Store in cache if enabled
      if (useCache && result) {
        await this.setInCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error finding document by ID in ${this.model.modelName}:`, { error: error.message, id, options });
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(data) {
    try {
      const document = new this.model(data);
      const result = await document.save();
      this.logger.info(`Created document in ${this.model.modelName}`, { id: result._id });
      return result;
    } catch (error) {
      this.logger.error(`Error creating document in ${this.model.modelName}:`, { error: error.message, data });
      throw error;
    }
  }

  /**
   * Update documents by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async update(criteria, data, options = {}) {
    try {
      // Remove timestamps from update data to prevent overwriting
      const updateData = { ...data };
      delete updateData.createdAt;
      delete updateData.updatedAt;
      
      // Add updatedAt timestamp
      updateData.updatedAt = new Date();
      
      const result = await this.model.updateMany(criteria, updateData, options);
      this.logger.info(`Updated documents in ${this.model.modelName}`, { criteria, matched: result.matchedCount, modified: result.modifiedCount });
      return result;
    } catch (error) {
      this.logger.error(`Error updating documents in ${this.model.modelName}:`, { error: error.message, criteria, data, options });
      throw error;
    }
  }

  /**
   * Update one document by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated document
   */
  async updateOne(criteria, data, options = {}) {
    try {
      // Remove timestamps from update data to prevent overwriting
      const updateData = { ...data };
      delete updateData.createdAt;
      delete updateData.updatedAt;
      
      // Add updatedAt timestamp
      updateData.updatedAt = new Date();
      
      const result = await this.model.findOneAndUpdate(criteria, updateData, { 
        new: true, 
        runValidators: true,
        ...options 
      });
      this.logger.info(`Updated document in ${this.model.modelName}`, { criteria, id: result?._id });
      return result;
    } catch (error) {
      this.logger.error(`Error updating document in ${this.model.modelName}:`, { error: error.message, criteria, data, options });
      throw error;
    }
  }

  /**
   * Delete documents by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Delete result
   */
  async delete(criteria) {
    try {
      const result = await this.model.deleteMany(criteria);
      this.logger.info(`Deleted documents in ${this.model.modelName}`, { criteria, deleted: result.deletedCount });
      return result;
    } catch (error) {
      this.logger.error(`Error deleting documents in ${this.model.modelName}:`, { error: error.message, criteria });
      throw error;
    }
  }

  /**
   * Delete one document by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(criteria) {
    try {
      const result = await this.model.deleteOne(criteria);
      this.logger.info(`Deleted document in ${this.model.modelName}`, { criteria, deleted: result.deletedCount });
      return result;
    } catch (error) {
      this.logger.error(`Error deleting document in ${this.model.modelName}:`, { error: error.message, criteria });
      throw error;
    }
  }

  /**
   * Count documents by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Document count
   */
  async count(criteria = {}) {
    try {
      const count = await this.model.countDocuments(criteria);
      this.logger.debug(`Counted documents in ${this.model.modelName}`, { criteria, count });
      return count;
    } catch (error) {
      this.logger.error(`Error counting documents in ${this.model.modelName}:`, { error: error.message, criteria });
      throw error;
    }
  }

  /**
   * Check if document exists by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<boolean>} Existence check result
   */
  async exists(criteria) {
    try {
      const result = await this.model.exists(criteria);
      this.logger.debug(`Checked existence in ${this.model.modelName}`, { criteria, exists: !!result });
      return !!result;
    } catch (error) {
      this.logger.error(`Error checking existence in ${this.model.modelName}:`, { error: error.message, criteria });
      throw error;
    }
  }

  /**
   * 🔧 PAGINATION #83: Generic pagination method for all list endpoints
   * @param {Object} criteria - Search criteria
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated results with metadata
   */
  async paginate(criteria = {}, paginationOptions = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = { createdAt: -1 },
        select = '',
        populate = '',
        lean = true
      } = paginationOptions;

      // Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(DEFAULT_MAX_PAGE_SIZE, parseInt(limit) || 20)); // Max 100 items per page
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = this.model.find(criteria);

      // Apply sorting
      if (sort) query.sort(sort);

      // Apply limit and skip for pagination
      query.limit(limitNum).skip(skip);

      // Apply field selection
      if (select) query.select(select);

      // Apply population
      if (populate) query.populate(populate);

      // Apply lean for better performance unless explicitly disabled
      if (lean) query.lean();

      // Execute query
      const results = await query.exec();

      // Get total count for pagination metadata
      const totalCount = await this.model.countDocuments(criteria);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      this.logger.debug(`Paginated query in ${this.model.modelName}`, {
        criteria,
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      });

      return {
        data: results,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      this.logger.error(`Error in paginated query in ${this.model.modelName}:`, {
        error: error.message,
        criteria,
        paginationOptions
      });
      throw error;
    }
  }
}

export default BaseRepository;