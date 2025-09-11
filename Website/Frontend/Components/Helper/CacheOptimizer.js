"use client";
import { useEffect, useCallback } from 'react';

// Enhanced cache management for route data
class RouteCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.maxCacheSize = 50;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.persistentKeys = new Set(['user-profile', 'main-routes', 'theme-settings']);
  }

  // Set cache with automatic expiry
  set(key, data, persistent = false) {
    try {
      // Remove oldest entries if cache is full
      if (this.cache.size >= this.maxCacheSize) {
        this.cleanup();
      }

      this.cache.set(key, data);
      this.cacheTimestamps.set(key, Date.now());
      
      if (persistent) {
        this.persistentKeys.add(key);
        // Store in localStorage for persistent cache
        localStorage.setItem(`route-cache-${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }

      console.log(`📦 Cached: ${key}`);
    } catch (error) {
      console.error('Cache set failed:', error);
    }
  }

  // Get cached data with expiry check
  get(key, allowExpired = false) {
    try {
      const timestamp = this.cacheTimestamps.get(key);
      const now = Date.now();
      
      // Check if cache exists and is valid
      if (this.cache.has(key)) {
        const isExpired = timestamp && (now - timestamp) > this.cacheExpiry;
        
        if (!isExpired || allowExpired || this.persistentKeys.has(key)) {
          console.log(`✅ Cache hit: ${key}`);
          return this.cache.get(key);
        } else {
          // Remove expired cache
          this.cache.delete(key);
          this.cacheTimestamps.delete(key);
          console.log(`⏰ Cache expired: ${key}`);
        }
      }

      // Try to get from localStorage for persistent cache
      if (this.persistentKeys.has(key)) {
        const stored = localStorage.getItem(`route-cache-${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const isExpired = (now - parsed.timestamp) > this.cacheExpiry;
          
          if (!isExpired || allowExpired) {
            this.cache.set(key, parsed.data);
            this.cacheTimestamps.set(key, parsed.timestamp);
            console.log(`💾 Restored from localStorage: ${key}`);
            return parsed.data;
          }
        }
      }

      console.log(`❌ Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }

  // Check if cache exists and is valid
  has(key) {
    const timestamp = this.cacheTimestamps.get(key);
    const now = Date.now();
    
    if (this.cache.has(key)) {
      const isExpired = timestamp && (now - timestamp) > this.cacheExpiry;
      return !isExpired || this.persistentKeys.has(key);
    }
    
    return false;
  }

  // Remove specific cache entry
  delete(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    this.persistentKeys.delete(key);
    localStorage.removeItem(`route-cache-${key}`);
    console.log(`🗑️ Deleted cache: ${key}`);
  }

  // Cleanup old cache entries
  cleanup() {
    const now = Date.now();
    const entriesToDelete = [];

    this.cacheTimestamps.forEach((timestamp, key) => {
      if (!this.persistentKeys.has(key) && (now - timestamp) > this.cacheExpiry) {
        entriesToDelete.push(key);
      }
    });

    entriesToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    });

    // If still over limit, remove oldest non-persistent entries
    if (this.cache.size >= this.maxCacheSize) {
      const sortedEntries = Array.from(this.cacheTimestamps.entries())
        .filter(([key]) => !this.persistentKeys.has(key))
        .sort(([, a], [, b]) => a - b);
      
      const toRemove = sortedEntries.slice(0, Math.ceil(this.maxCacheSize * 0.2));
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      });
    }

    console.log(`🧹 Cache cleanup completed. Size: ${this.cache.size}`);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    
    // Clear localStorage cache
    const keys = Object.keys(localStorage).filter(key => key.startsWith('route-cache-'));
    keys.forEach(key => localStorage.removeItem(key));
    
    console.log('🧽 Cache cleared');
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      persistentCount: this.persistentKeys.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const routeCache = new RouteCache();

// Cache-aware fetch wrapper
export const cachedFetch = async (url, options = {}, cacheKey, cacheDuration = 300000) => {
  const key = cacheKey || `fetch-${url}`;
  
  // Try to get from cache first
  const cached = routeCache.get(key);
  if (cached && !options.skipCache) {
    return cached;
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache successful responses
    if (response.ok) {
      routeCache.set(key, data, options.persistent);
    }
    
    return data;
  } catch (error) {
    // Return cached data if available on error
    const fallback = routeCache.get(key, true);
    if (fallback) {
      console.log(`🔄 Using cached data as fallback for ${url}`);
      return fallback;
    }
    throw error;
  }
};

// React hook for cache management
export const useCacheOptimizer = () => {
  // Periodic cleanup
  useEffect(() => {
    const cleanup = () => routeCache.cleanup();
    const interval = setInterval(cleanup, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  // Cache operations
  const setCache = useCallback((key, data, persistent = false) => {
    routeCache.set(key, data, persistent);
  }, []);

  const getCache = useCallback((key, allowExpired = false) => {
    return routeCache.get(key, allowExpired);
  }, []);

  const hasCache = useCallback((key) => {
    return routeCache.has(key);
  }, []);

  const deleteCache = useCallback((key) => {
    routeCache.delete(key);
  }, []);

  const clearCache = useCallback(() => {
    routeCache.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return routeCache.getStats();
  }, []);

  return {
    setCache,
    getCache,
    hasCache,
    deleteCache,
    clearCache,
    getCacheStats
  };
};

// Component cache wrapper
export const CacheProvider = ({ children, enableStats = false }) => {
  useEffect(() => {
    // Initialize cache on app start
    console.log('🚀 Cache system initialized');
    
    // Log stats in development
    if (process.env.NODE_ENV === 'development' && enableStats) {
      const logStats = () => {
        console.log('📊 Cache Stats:', routeCache.getStats());
      };
      
      const interval = setInterval(logStats, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [enableStats]);

  return <>{children}</>;
};

// Pre-cache hook for route data
export const useRoutePreCache = (routeData = []) => {
  useEffect(() => {
    if (routeData.length > 0) {
      routeData.forEach(({ key, data, persistent = false }) => {
        if (key && data) {
          routeCache.set(key, data, persistent);
        }
      });
    }
  }, [routeData]);
};

export default {
  cachedFetch,
  useCacheOptimizer,
  CacheProvider,
  useRoutePreCache,
  routeCache
};
