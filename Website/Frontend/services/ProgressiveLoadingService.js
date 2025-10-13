/**
 * Progressive Loading Service
 * Optimizes loading of chat messages and media by prioritizing visible content
 */

class ProgressiveLoadingService {
  constructor() {
    this.priorityQueue = [];
    this.loadingQueue = [];
    this.loadedItems = new Set();
    this.loadingLimits = {
      critical: 5,
      high: 3,
      medium: 2,
      low: 1
    };
    this.currentLoading = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.maxConcurrent = 10; // Maximum concurrent requests
    this.currentConcurrent = 0;
    this.networkConditions = 'normal'; // 'slow', 'normal', 'fast'
    this.adaptiveLoading = true;
    this.performanceObserver = null;
    this.loadingStats = {
      totalLoaded: 0,
      totalFailed: 0,
      averageLoadTime: 0,
      lastLoadTimes: []
    };
  }

  /**
   * Add item to loading queue with priority
   */
  addItem(item, priority = 'medium', callback = null) {
    const itemId = this.getItemId(item);
    
    // Don't add if already loaded or loading
    if (this.loadedItems.has(itemId) || this.isLoading(itemId)) {
      return;
    }
    
    const queueItem = {
      id: itemId,
      item,
      priority,
      callback,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };
    
    this.priorityQueue.push(queueItem);
    this.sortQueueByPriority();
    
    // Start loading if we have capacity
    this.processQueue();
  }

  /**
   * Get item ID for tracking
   */
  getItemId(item) {
    if (typeof item === 'string') return item;
    if (item && item.messageid) return `msg_${item.messageid}`;
    if (item && item.id) return `item_${item.id}`;
    return `item_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sort queue by priority (high to low)
   */
  sortQueueByPriority() {
    const priorityOrder = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    this.priorityQueue.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Process loading queue
   */
  async processQueue() {
    // Process items based on priority and loading limits
    for (const item of [...this.priorityQueue]) {
      if (this.canLoadItem(item)) {
        this.startLoadingItem(item);
      }
    }
  }

  /**
   * Enhanced process queue with adaptive loading
   */
  async processQueueAdaptive() {
    // Adapt loading limits based on network conditions
    if (this.adaptiveLoading) {
      this.adaptLoadingLimits();
    }
    
    // Process items based on priority and loading limits
    for (const item of [...this.priorityQueue]) {
      if (this.canLoadItem(item) && this.canLoadConcurrently()) {
        this.startLoadingItem(item);
      }
    }
  }

  /**
   * Check if we can load more items concurrently
   */
  canLoadConcurrently() {
    return this.currentConcurrent < this.maxConcurrent;
  }

  /**
   * Adapt loading limits based on network conditions and performance
   */
  adaptLoadingLimits() {
    // Adjust based on network conditions
    switch (this.networkConditions) {
      case 'slow':
        this.loadingLimits = {
          critical: 2,
          high: 1,
          medium: 1,
          low: 1
        };
        this.maxConcurrent = 3;
        break;
      case 'normal':
        this.loadingLimits = {
          critical: 5,
          high: 3,
          medium: 2,
          low: 1
        };
        this.maxConcurrent = 10;
        break;
      case 'fast':
        this.loadingLimits = {
          critical: 8,
          high: 5,
          medium: 3,
          low: 2
        };
        this.maxConcurrent = 15;
        break;
    }
    
    // Adjust based on performance stats
    const avgLoadTime = this.getAverageLoadTime();
    if (avgLoadTime > 2000) { // If average load time > 2s
      // Reduce concurrent loading
      this.maxConcurrent = Math.max(1, Math.floor(this.maxConcurrent * 0.7));
    } else if (avgLoadTime < 500) { // If average load time < 0.5s
      // Increase concurrent loading
      this.maxConcurrent = Math.min(20, Math.ceil(this.maxConcurrent * 1.3));
    }
  }

  /**
   * Check if we can load an item based on priority limits
   */
  canLoadItem(item) {
    const currentLoading = this.currentLoading[item.priority] || 0;
    const limit = this.loadingLimits[item.priority] || 1;
    
    return currentLoading < limit;
  }

  /**
   * Check if item is currently loading
   */
  isLoading(itemId) {
    return this.loadingQueue.some(loadingItem => loadingItem.id === itemId);
  }

  /**
   * Start loading an item
   */
  async startLoadingItem(queueItem) {
    // Remove from priority queue
    this.priorityQueue = this.priorityQueue.filter(item => item.id !== queueItem.id);
    
    // Add to loading queue
    this.loadingQueue.push(queueItem);
    this.currentLoading[queueItem.priority] = (this.currentLoading[queueItem.priority] || 0) + 1;
    this.currentConcurrent++;
    
    // Track load start time
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cached = this.getFromCache(queueItem.id);
      if (cached) {
        this.completeLoading(queueItem, cached, true, performance.now() - startTime);
        return;
      }
      
      // Load the item
      const result = await this.loadItem(queueItem.item);
      
      // Cache the result
      this.addToCache(queueItem.id, result);
      
      // Complete loading
      this.completeLoading(queueItem, result, false, performance.now() - startTime);
    } catch (error) {
      console.error('Progressive loading failed for item:', queueItem.id, error);
      
      // Track failed load
      this.trackLoadTime(performance.now() - startTime, true);
      
      // Retry if possible
      if (queueItem.retryCount < queueItem.maxRetries) {
        queueItem.retryCount++;
        setTimeout(() => {
          this.priorityQueue.push(queueItem);
          this.sortQueueByPriority();
          this.processQueue();
        }, Math.pow(2, queueItem.retryCount) * 1000); // Exponential backoff
      } else {
        // Failed permanently
        this.failLoading(queueItem, error, performance.now() - startTime);
      }
    }
  }

  /**
   * Load an item (to be implemented by consumer)
   */
  async loadItem(item) {
    // This should be implemented by the consumer
    // For example, loading an image, video, or message data
    
    // Simulate async loading
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(item);
      }, 100);
    });
  }

  /**
   * Complete loading of an item
   */
  completeLoading(queueItem, result, fromCache = false, loadTime = 0) {
    // Remove from loading queue
    this.loadingQueue = this.loadingQueue.filter(item => item.id !== queueItem.id);
    this.currentLoading[queueItem.priority] = Math.max(0, (this.currentLoading[queueItem.priority] || 0) - 1);
    this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
    
    // Track successful load
    if (loadTime > 0) {
      this.trackLoadTime(loadTime, false);
    }
    
    // Mark as loaded
    this.loadedItems.add(queueItem.id);
    this.loadingStats.totalLoaded++;
    
    // Call callback
    if (queueItem.callback) {
      queueItem.callback(null, result, fromCache);
    }
    
    // Process next items
    this.processQueueAdaptive();
  }

  /**
   * Handle loading failure
   */
  failLoading(queueItem, error, loadTime = 0) {
    // Remove from loading queue
    this.loadingQueue = this.loadingQueue.filter(item => item.id !== queueItem.id);
    this.currentLoading[queueItem.priority] = Math.max(0, (this.currentLoading[queueItem.priority] || 0) - 1);
    this.currentConcurrent = Math.max(0, this.currentConcurrent - 1);
    
    // Track failed load
    if (loadTime > 0) {
      this.trackLoadTime(loadTime, true);
    }
    this.loadingStats.totalFailed++;
    
    // Call callback with error
    if (queueItem.callback) {
      queueItem.callback(error, null);
    }
    
    // Process next items
    this.processQueueAdaptive();
  }

  /**
   * Track load time for performance monitoring
   */
  trackLoadTime(loadTime, failed = false) {
    // Add to stats
    this.loadingStats.lastLoadTimes.push({
      time: loadTime,
      failed,
      timestamp: Date.now()
    });
    
    // Keep only last 100 load times
    if (this.loadingStats.lastLoadTimes.length > 100) {
      this.loadingStats.lastLoadTimes.shift();
    }
    
    // Update average load time
    const successfulLoads = this.loadingStats.lastLoadTimes.filter(l => !l.failed);
    if (successfulLoads.length > 0) {
      const totalTime = successfulLoads.reduce((sum, load) => sum + load.time, 0);
      this.loadingStats.averageLoadTime = totalTime / successfulLoads.length;
    }
  }

  /**
   * Get average load time
   */
  getAverageLoadTime() {
    return this.loadingStats.averageLoadTime || 0;
  }

  /**
   * Get loading statistics
   */
  getLoadingStats() {
    return { ...this.loadingStats };
  }

  /**
   * Add item to cache
   */
  addToCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Get item from cache
   */
  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear loaded items (for example, when switching chats)
   */
  clearLoadedItems() {
    this.loadedItems.clear();
    this.priorityQueue = [];
    this.loadingQueue = [];
    this.currentLoading = {
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    };
  }

  /**
   * Update loading limits
   */
  updateLoadingLimits(limits) {
    this.loadingLimits = { ...this.loadingLimits, ...limits };
  }

  /**
   * Get current loading status
   */
  getLoadingStatus() {
    return {
      priorityQueue: this.priorityQueue.length,
      loadingQueue: this.loadingQueue.length,
      loadedItems: this.loadedItems.size,
      currentLoading: { ...this.currentLoading }
    };
  }

  /**
   * Cancel loading of specific item
   */
  cancelItem(itemId) {
    // Remove from priority queue
    this.priorityQueue = this.priorityQueue.filter(item => item.id !== itemId);
    
    // Remove from loading queue
    const loadingItem = this.loadingQueue.find(item => item.id === itemId);
    if (loadingItem) {
      this.loadingQueue = this.loadingQueue.filter(item => item.id !== itemId);
      this.currentLoading[loadingItem.priority] = Math.max(0, (this.currentLoading[loadingItem.priority] || 0) - 1);
    }
  }

  /**
   * Cancel all loading
   */
  cancelAll() {
    this.priorityQueue = [];
    this.loadingQueue = [];
    this.currentLoading = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    this.currentConcurrent = 0;
  }

  /**
   * Detect network conditions
   */
  detectNetworkConditions() {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        // Use connection API if available
        if (connection.effectiveType) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              return 'slow';
            case '3g':
              return 'normal';
            case '4g':
            case '5g':
              return 'fast';
            default:
              return 'normal';
          }
        }
        
        // Fallback to downlink speed
        if (connection.downlink) {
          if (connection.downlink < 1) return 'slow';
          if (connection.downlink > 10) return 'fast';
          return 'normal';
        }
      }
    }
    
    // Fallback to performance API
    if ('performance' in window) {
      const perf = performance.getEntriesByType('navigation')[0];
      if (perf && perf.loadEventEnd > 0) {
        const loadTime = perf.loadEventEnd - perf.fetchStart;
        if (loadTime < 1000) return 'fast';
        if (loadTime > 3000) return 'slow';
        return 'normal';
      }
    }
    
    return 'normal';
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Detect initial network conditions
    this.networkConditions = this.detectNetworkConditions();
    
    // Set up network change listener
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.networkConditions = this.detectNetworkConditions();
        });
      }
    }
    
    // Set up performance observer for resource timing
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            // Monitor resource load times
            this.trackResourceLoad(entry);
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Track resource load for performance analysis
   */
  trackResourceLoad(entry) {
    // Only track significant resources (>100ms)
    if (entry.duration > 100) {
      // Log slow resources
      if (entry.duration > 1000) {
        console.warn('Slow resource load detected:', entry.name, entry.duration + 'ms');
      }
    }
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources(resources) {
    if (!resources || !Array.isArray(resources)) return;
    
    resources.forEach((resource, index) => {
      // Assign priority based on position (first items are more critical)
      const priority = index < 3 ? 'critical' : index < 10 ? 'high' : 'medium';
      this.addItem(resource, priority);
    });
  }

  /**
   * Get current network conditions
   */
  getNetworkConditions() {
    return this.networkConditions;
  }

  /**
   * Set adaptive loading
   */
  setAdaptiveLoading(enabled) {
    this.adaptiveLoading = enabled;
  }
}

export default ProgressiveLoadingService;