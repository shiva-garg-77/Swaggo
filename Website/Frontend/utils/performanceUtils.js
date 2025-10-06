/**
 * 🚀 PERFORMANCE UTILITIES FOR STATE MANAGEMENT
 * 
 * SUPPORTS ISSUE #20:
 * ✅ Debouncing for state updates
 * ✅ Throttling for high-frequency events
 * ✅ Performance monitoring
 * ✅ Memory leak prevention
 * ✅ Optimization helpers
 */

/**
 * Debounce function for batching state updates
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function for high-frequency events
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization for expensive computations
 */
export function memoize(fn, getKey = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return function memoized(...args) {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Prevent memory leaks by limiting cache size
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  marks: new Map(),
  measures: new Map(),
  
  mark(name) {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    return timestamp;
  },
  
  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!start) {
      console.warn(`Performance mark '${startMark}' not found`);
      return 0;
    }
    
    const duration = end - start;
    this.measures.set(name, duration);
    return duration;
  },
  
  getStats() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    };
  },
  
  clear() {
    this.marks.clear();
    this.measures.clear();
  }
};

/**
 * State update batching utility
 */
export class UpdateBatcher {
  constructor(batchSize = 10, timeout = 16) {
    this.queue = [];
    this.batchSize = batchSize;
    this.timeout = timeout;
    this.timer = null;
    this.callbacks = new Set();
  }
  
  add(update) {
    this.queue.push(update);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.timeout);
    }
  }
  
  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0);
    this.callbacks.forEach(callback => {
      try {
        callback(batch);
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    });
  }
  
  onBatch(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  clear() {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}