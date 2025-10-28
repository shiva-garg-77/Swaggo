/**
 * Comprehensive Performance Optimization Framework
 * Addresses image optimization, caching strategies, bundle optimization, memory management, and lazy loading
 */

const React = require('react');

// Cache Management
class CacheManager {
  static caches = new Map();

  /**
   * Set cache value
   */
  static set(cacheKey, key, value, ttl = 5 * 60 * 1000) {
    if (!this.caches.has(cacheKey)) {
      this.caches.set(cacheKey, new Map());
    }

    const cache = this.caches.get(cacheKey);
    cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache value
   */
  static get(cacheKey, key) {
    const cache = this.caches.get(cacheKey);
    if (!cache) return null;

    const item = cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Clear cache
   */
  static clear(cacheKey) {
    if (cacheKey) {
      this.caches.delete(cacheKey);
    } else {
      this.caches.clear();
    }
  }

  /**
   * Clean expired entries
   */
  static cleanExpired() {
    const now = Date.now();
    
    for (const [, cache] of this.caches) {
      for (const [key, item] of cache) {
        if (now - item.timestamp > item.ttl) {
          cache.delete(key);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const stats = {};
    
    for (const [cacheKey, cache] of this.caches) {
      stats[cacheKey] = {
        size: cache.size,
        hitRate: 0 // Would need to track hits/misses for accurate calculation
      };
    }
    
    return stats;
  }
}

// Image Optimization
class ImageOptimizer {
  static DEFAULT_QUALITY = 0.8;
  static MAX_WIDTH = 1920;
  static MAX_HEIGHT = 1080;

  /**
   * Optimize image file
   */
  static async optimizeImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { maxWidth = this.MAX_WIDTH, maxHeight = this.MAX_HEIGHT, quality = this.DEFAULT_QUALITY } = options;
        
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = this.calculateDimensions(img.width, img.height, maxWidth, maxHeight);
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        }, options.format || file.type, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate responsive image sources
   */
  static generateResponsiveSources(originalUrl) {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    const srcSet = sizes
      .map(size => `${originalUrl}?w=${size} ${size}w`)
      .join(', ');

    const sizesAttr = [
      '(max-width: 320px) 320px',
      '(max-width: 640px) 640px',
      '(max-width: 768px) 768px',
      '(max-width: 1024px) 1024px',
      '(max-width: 1280px) 1280px',
      '1920px'
    ].join(', ');

    return {
      srcSet,
      sizes: sizesAttr
    };
  }

  /**
   * Lazy load images with Intersection Observer
   */
  static setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  static calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if necessary
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }
}

// Bundle Analysis and Optimization
class BundleAnalyzer {
  /**
   * Analyze bundle performance
   */
  static analyzeBundlePerformance() {
    // This would integrate with webpack-bundle-analyzer in a real implementation
    return {
      totalSize: 0,
      gzipSize: 0,
      moduleCount: 0,
      largeDependencies: []
    };
  }

  /**
   * Get code splitting recommendations
   */
  static getCodeSplittingRecommendations() {
    return {
      routeBasedSplits: [
        '/dashboard',
        '/profile',
        '/settings',
        '/admin'
      ],
      componentBasedSplits: [
        'Chart components',
        'Form components',
        'Table components'
      ],
      vendorSplits: [
        'react-bundle',
        'ui-library-bundle',
        'utils-bundle'
      ]
    };
  }
}

// React Performance Optimization
class ReactOptimizer {
  /**
   * Memoization utilities
   */
  static createMemoizedComponent(component, propsAreEqual) {
    return React.memo(component, propsAreEqual);
  }

  /**
   * Performance monitoring hook
   */
  static usePerformanceMonitor(componentName) {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`${componentName} render time: ${endTime - startTime}ms`);
      };
    });
  }

  /**
   * Optimize large lists with virtualization
   */
  static createVirtualizedList(items, renderItemFn, itemHeight = 50) {
    return ({ height, width }) => {
      const [scrollTop, setScrollTop] = React.useState(0);
      
      const visibleStart = Math.floor(scrollTop / itemHeight);
      const visibleEnd = Math.min(
        visibleStart + Math.ceil(height / itemHeight) + 1,
        items.length
      );
      
      const visibleItems = items.slice(visibleStart, visibleEnd);
      
      return React.createElement('div', {
        style: { height, width, overflow: 'auto' },
        onScroll: (e) => setScrollTop(e.target.scrollTop)
      }, React.createElement('div', {
        style: { height: items.length * itemHeight, position: 'relative' }
      }, visibleItems.map((item, index) => 
        React.createElement('div', {
          key: visibleStart + index,
          style: {
            position: 'absolute',
            top: (visibleStart + index) * itemHeight,
            height: itemHeight,
            width: '100%'
          }
        }, renderItemFn(item, visibleStart + index))
      )));
    };
  }
}

// Memory Management
class MemoryManager {
  static subscriptions = new Set();
  static intervals = new Set();
  static timeouts = new Set();

  /**
   * Track subscriptions for cleanup
   */
  static trackSubscription(unsubscribe) {
    this.subscriptions.add(unsubscribe);
  }

  /**
   * Track intervals for cleanup
   */
  static trackInterval(intervalId) {
    this.intervals.add(intervalId);
  }

  /**
   * Track timeouts for cleanup
   */
  static trackTimeout(timeoutId) {
    this.timeouts.add(timeoutId);
  }

  /**
   * Clean up all tracked resources
   */
  static cleanup() {
    // Clean up subscriptions
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error during subscription cleanup:', error);
      }
    });
    this.subscriptions.clear();

    // Clean up intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();

    // Clean up timeouts
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
  }

  /**
   * Monitor memory usage
   */
  static getMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }

    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * Garbage collection hint (if available)
   */
  static triggerGC() {
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }
}

// WebSocket Optimization
class WebSocketOptimizer {
  static connections = new Map();
  static reconnectAttempts = new Map();
  static heartbeatIntervals = new Map();

  /**
   * Create optimized WebSocket connection
   */
  static createConnection(url, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        maxReconnectAttempts = 5,
        reconnectDelay = 1000,
        heartbeatInterval = 30000,
        protocols
      } = options;

      const connect = () => {
        const ws = new WebSocket(url, protocols);
        
        ws.onopen = () => {
          console.log(`WebSocket connected to ${url}`);
          this.connections.set(url, ws);
          this.reconnectAttempts.set(url, 0);
          
          // Setup heartbeat
          this.setupHeartbeat(url, ws, heartbeatInterval);
          
          resolve(ws);
        };

        ws.onclose = (event) => {
          console.log(`WebSocket disconnected from ${url}`, event);
          this.cleanup(url);
          
          // Attempt reconnection if not a normal closure
          if (event.code !== 1000 && event.code !== 1001) {
            const attempts = this.reconnectAttempts.get(url) || 0;
            if (attempts < maxReconnectAttempts) {
              this.reconnectAttempts.set(url, attempts + 1);
              setTimeout(connect, reconnectDelay * Math.pow(2, attempts));
            }
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for ${url}:`, error);
          reject(error);
        };
      };

      connect();
    });
  }

  /**
   * Close connection with cleanup
   */
  static closeConnection(url) {
    const ws = this.connections.get(url);
    if (ws) {
      ws.close(1000, 'Normal closure');
      this.cleanup(url);
    }
  }

  /**
   * Cleanup connection resources
   */
  static cleanup(url) {
    // Clear heartbeat
    const heartbeatId = this.heartbeatIntervals.get(url);
    if (heartbeatId) {
      clearInterval(heartbeatId);
      this.heartbeatIntervals.delete(url);
    }

    // Remove connection reference
    this.connections.delete(url);
  }

  /**
   * Setup heartbeat mechanism
   */
  static setupHeartbeat(url, ws, interval) {
    const heartbeatId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    }, interval);
    
    this.heartbeatIntervals.set(url, heartbeatId);
  }
}

// Performance Monitoring
class PerformanceMonitor {
  static metrics = new Map();

  /**
   * Mark performance timing
   */
  static mark(name) {
    performance.mark(name);
  }

  /**
   * Measure performance between marks
   */
  static measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
    
    const entries = performance.getEntriesByName(name, 'measure');
    const duration = entries[entries.length - 1]?.duration || 0;
    
    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(duration);
    
    return duration;
  }

  /**
   * Get performance statistics
   */
  static getStats(metricName) {
    if (metricName) {
      const values = this.metrics.get(metricName) || [];
      return this.calculateStats(values);
    }

    const stats = {};
    for (const [name, values] of this.metrics) {
      stats[name] = this.calculateStats(values);
    }
    
    return stats;
  }

  /**
   * Get Core Web Vitals
   */
  static getCoreWebVitals() {
    return new Promise((resolve) => {
      const vitals = { lcp: 0, fid: 0, cls: 0 };
      
      // This would use actual web-vitals library in production
      // For now, returning mock data
      setTimeout(() => {
        resolve(vitals);
      }, 100);
    });
  }

  static calculateStats(values) {
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      avg: sum / values.length,
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      count: values.length
    };
  }
}

// Lazy Loading Utilities
class LazyLoadManager {
  static observers = new Map();

  /**
   * Setup lazy loading for routes
   */
  static setupRouteLazyLoading() {
    // This would integrate with React Router for code splitting
    console.log('Route lazy loading setup complete');
  }

  /**
   * Create lazy-loaded component
   */
  static createLazyComponent(importFunction) {
    return React.lazy(importFunction);
  }

  /**
   * Setup content lazy loading
   */
  static setupContentLazyLoading(selector, callback) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });

    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });

    this.observers.set(selector, observer);
  }

  /**
   * Cleanup lazy loading observers
   */
  static cleanup(selector) {
    if (selector) {
      const observer = this.observers.get(selector);
      if (observer) {
        observer.disconnect();
        this.observers.delete(selector);
      }
    } else {
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
    }
  }
}

module.exports = {
  CacheManager,
  ImageOptimizer,
  BundleAnalyzer,
  ReactOptimizer,
  MemoryManager,
  WebSocketOptimizer,
  PerformanceMonitor,
  LazyLoadManager
};