/**
 * 🚀 API Optimization Utilities
 * 
 * Provides utilities for optimizing API calls including:
 * - Request debouncing to reduce excessive API calls
 * - Request batching for combining multiple requests
 * - Caching for frequently accessed data
 * - Request deduplication
 * - Performance monitoring
 */

import { debounce, throttle } from './performanceUtils';

/**
 * API Request Debouncer
 * Reduces excessive API calls by debouncing similar requests
 */
class ApiRequestDebouncer {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTimeouts = new Map();
  }

  /**
   * Debounce API requests with automatic caching
   * @param {string} key - Unique key for the request
   * @param {Function} requestFn - Function that makes the API request
   * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
   * @param {number} cacheTtl - Cache TTL in milliseconds (default: 5000)
   * @returns {Promise} - Promise that resolves with the API response
   */
  async debounceRequest(key, requestFn, debounceMs = 300, cacheTtl = 5000) {
    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < cacheTtl) {
        console.log(`🔄 Using cached response for: ${key}`);
        return cached.data;
      } else {
        // Expired cache
        this.cache.delete(key);
        if (this.cacheTimeouts.has(key)) {
          clearTimeout(this.cacheTimeouts.get(key));
          this.cacheTimeouts.delete(key);
        }
      }
    }

    // Cancel existing pending request if any
    if (this.pendingRequests.has(key)) {
      clearTimeout(this.pendingRequests.get(key));
    }

    // Create new debounced request
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          // Remove from pending requests
          this.pendingRequests.delete(key);
          
          // Execute request
          const result = await requestFn();
          
          // Cache result
          this.cache.set(key, {
            data: result,
            timestamp: Date.now()
          });
          
          // Set cache expiration
          const cacheTimeout = setTimeout(() => {
            this.cache.delete(key);
            this.cacheTimeouts.delete(key);
          }, cacheTtl);
          
          this.cacheTimeouts.set(key, cacheTimeout);
          
          resolve(result);
        } catch (error) {
          this.pendingRequests.delete(key);
          this.cache.delete(key);
          reject(error);
        }
      }, debounceMs);
      
      this.pendingRequests.set(key, timeoutId);
    });
  }

  /**
   * Cancel pending debounced request
   * @param {string} key - Request key to cancel
   */
  cancelRequest(key) {
    if (this.pendingRequests.has(key)) {
      clearTimeout(this.pendingRequests.get(key));
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear all cached responses
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimeouts.forEach(timeout => clearTimeout(timeout));
    this.cacheTimeouts.clear();
  }

  /**
   * Clear specific cached response
   * @param {string} key - Cache key to clear
   */
  clearCacheKey(key) {
    this.cache.delete(key);
    if (this.cacheTimeouts.has(key)) {
      clearTimeout(this.cacheTimeouts.get(key));
      this.cacheTimeouts.delete(key);
    }
  }
}

/**
 * API Request Batcher
 * Combines multiple similar requests into a single batch request
 */
class ApiRequestBatcher {
  constructor(batchDelay = 50) {
    this.pendingBatch = new Map();
    this.batchDelay = batchDelay;
    this.batchTimeouts = new Map();
  }

  /**
   * Add request to batch
   * @param {string} batchKey - Key to group requests
   * @param {any} requestData - Data for this specific request
   * @param {Function} batchExecutor - Function to execute the batch
   * @returns {Promise} - Promise that resolves with individual request result
   */
  async addToBatch(batchKey, requestData, batchExecutor) {
    return new Promise((resolve, reject) => {
      // Initialize batch if not exists
      if (!this.pendingBatch.has(batchKey)) {
        this.pendingBatch.set(batchKey, []);
      }

      // Add request to batch
      this.pendingBatch.get(batchKey).push({
        data: requestData,
        resolve,
        reject
      });

      // Set timeout to execute batch
      if (this.batchTimeouts.has(batchKey)) {
        clearTimeout(this.batchTimeouts.get(batchKey));
      }

      const timeoutId = setTimeout(() => {
        this.executeBatch(batchKey, batchExecutor);
      }, this.batchDelay);

      this.batchTimeouts.set(batchKey, timeoutId);
    });
  }

  /**
   * Execute batch request
   * @param {string} batchKey - Key for the batch to execute
   * @param {Function} batchExecutor - Function to execute the batch
   */
  async executeBatch(batchKey, batchExecutor) {
    // Clear timeout
    if (this.batchTimeouts.has(batchKey)) {
      clearTimeout(this.batchTimeouts.get(batchKey));
      this.batchTimeouts.delete(batchKey);
    }

    // Get batch requests
    const batch = this.pendingBatch.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Remove from pending
    this.pendingBatch.delete(batchKey);

    try {
      // Extract request data
      const requestData = batch.map(item => item.data);
      
      // Execute batch
      const results = await batchExecutor(requestData);
      
      // Resolve individual promises
      batch.forEach((item, index) => {
        if (index < results.length) {
          item.resolve(results[index]);
        } else {
          item.resolve(null);
        }
      });
    } catch (error) {
      // Reject all promises in batch
      batch.forEach(item => item.reject(error));
    }
  }

  /**
   * Cancel all pending batches
   */
  cancelAllBatches() {
    this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.batchTimeouts.clear();
    this.pendingBatch.clear();
  }
}

/**
 * API Deduplicator
 * Prevents duplicate simultaneous requests for the same resource
 */
class ApiDeduplicator {
  constructor() {
    this.inFlightRequests = new Map();
  }

  /**
   * Execute request with deduplication
   * @param {string} key - Unique key for the request
   * @param {Function} requestFn - Function that makes the request
   * @returns {Promise} - Promise that resolves with the response
   */
  async deduplicate(key, requestFn) {
    // Check if request is already in flight
    if (this.inFlightRequests.has(key)) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return this.inFlightRequests.get(key);
    }

    // Execute new request
    const promise = requestFn()
      .finally(() => {
        // Remove from in-flight requests when completed
        this.inFlightRequests.delete(key);
      });

    // Store in in-flight requests
    this.inFlightRequests.set(key, promise);
    
    return promise;
  }

  /**
   * Cancel all in-flight requests
   */
  cancelAll() {
    this.inFlightRequests.clear();
  }
}

/**
 * API Performance Monitor
 * Tracks API performance metrics
 */
class ApiPerformanceMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      cachedResponses: 0,
      batchedRequests: 0
    };
  }

  /**
   * Record request metrics
   * @param {Object} data - Request metrics data
   */
  recordRequest(data) {
    this.metrics.totalRequests++;
    
    if (data.success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    if (data.responseTime) {
      this.metrics.totalResponseTime += data.responseTime;
    }
    
    if (data.cached) {
      this.metrics.cachedResponses++;
    }
    
    if (data.batched) {
      this.metrics.batchedRequests++;
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      averageResponseTime: this.metrics.successfulRequests > 0
        ? (this.metrics.totalResponseTime / this.metrics.successfulRequests).toFixed(2) + 'ms'
        : '0ms',
      cacheHitRate: this.metrics.totalRequests > 0
        ? (this.metrics.cachedResponses / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      batchEfficiency: this.metrics.totalRequests > 0
        ? (this.metrics.batchedRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0;
    });
  }
}

// Create singleton instances
const apiRequestDebouncer = new ApiRequestDebouncer();
const apiRequestBatcher = new ApiRequestBatcher();
const apiDeduplicator = new ApiDeduplicator();
const apiPerformanceMonitor = new ApiPerformanceMonitor();

// Export utilities
export {
  ApiRequestDebouncer,
  ApiRequestBatcher,
  ApiDeduplicator,
  ApiPerformanceMonitor,
  apiRequestDebouncer,
  apiRequestBatcher,
  apiDeduplicator,
  apiPerformanceMonitor
};

// Convenience functions
export const debounceApiRequest = (key, requestFn, debounceMs = 300, cacheTtl = 5000) => {
  return apiRequestDebouncer.debounceRequest(key, requestFn, debounceMs, cacheTtl);
};

export const batchApiRequest = (batchKey, requestData, batchExecutor) => {
  return apiRequestBatcher.addToBatch(batchKey, requestData, batchExecutor);
};

export const deduplicateApiRequest = (key, requestFn) => {
  return apiDeduplicator.deduplicate(key, requestFn);
};

export const getApiPerformanceStats = () => {
  return apiPerformanceMonitor.getStats();
};

export const resetApiPerformanceStats = () => {
  apiPerformanceMonitor.reset();
};

export default {
  ApiRequestDebouncer,
  ApiRequestBatcher,
  ApiDeduplicator,
  ApiPerformanceMonitor,
  apiRequestDebouncer,
  apiRequestBatcher,
  apiDeduplicator,
  apiPerformanceMonitor,
  debounceApiRequest,
  batchApiRequest,
  deduplicateApiRequest,
  getApiPerformanceStats,
  resetApiPerformanceStats
};