import { useState, useEffect, useCallback, useRef } from 'react';
import ProgressiveLoadingService from '../Services/ProgressiveLoadingService';

/**
 * 🚀 Progressive Loading Hook
 * 
 * Provides progressive loading functionality with performance optimization
 * 
 * Features:
 * - Priority-based loading
 * - Performance monitoring
 * - Adaptive loading based on network conditions
 * - Cache management
 * - Loading state tracking
 */

export const useProgressiveLoading = (options = {}) => {
  const {
    maxConcurrent = 10,
    adaptiveLoading = true,
    cacheTimeout = 5 * 60 * 1000 // 5 minutes
  } = options;

  const [loadingStatus, setLoadingStatus] = useState({
    priorityQueue: 0,
    loadingQueue: 0,
    loadedItems: 0,
    currentLoading: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  });

  const [networkConditions, setNetworkConditions] = useState('normal');
  const [performanceStats, setPerformanceStats] = useState({
    averageLoadTime: 0,
    totalLoaded: 0,
    totalFailed: 0
  });

  const [error, setError] = useState(null);

  const loadingServiceRef = useRef(new ProgressiveLoadingService());
  const loadingCallbacksRef = useRef(new Map());

  // Initialize loading service
  useEffect(() => {
    const loadingService = loadingServiceRef.current;
    
    // Configure service
    loadingService.maxConcurrent = maxConcurrent;
    loadingService.cacheTimeout = cacheTimeout;
    loadingService.setAdaptiveLoading(adaptiveLoading);
    
    // Start performance monitoring
    loadingService.startPerformanceMonitoring();
    
    // Update status periodically
    const interval = setInterval(() => {
      // Update network conditions
      const conditions = loadingService.getNetworkConditions();
      setNetworkConditions(conditions);
      
      // Update loading stats
      const stats = loadingService.getLoadingStats();
      setPerformanceStats({
        averageLoadTime: Math.round(stats.averageLoadTime),
        totalLoaded: stats.totalLoaded,
        totalFailed: stats.totalFailed
      });
      
      // Update loading status
      const status = loadingService.getLoadingStatus();
      setLoadingStatus(status);
    }, 500);
    
    return () => {
      loadingService.stopPerformanceMonitoring();
      clearInterval(interval);
    };
  }, [maxConcurrent, cacheTimeout, adaptiveLoading]);

  /**
   * Add item to loading queue
   * @param {any} item - Item to load
   * @param {string} priority - Priority level (critical, high, medium, low)
   * @param {function} callback - Callback function (error, result, fromCache)
   */
  const addItem = useCallback((item, priority = 'medium', callback = null) => {
    const loadingService = loadingServiceRef.current;
    
    try {
      loadingService.addItem(item, priority, (error, result, fromCache) => {
        // Store callback data
        const itemId = loadingService.getItemId(item);
        loadingCallbacksRef.current.set(itemId, { error, result, fromCache });
        
        // Call user callback
        if (callback) {
          callback(error, result, fromCache);
        }
      });
      
      setError(null);
    } catch (err) {
      console.error('Failed to add item to loading queue:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Check if item is loaded
   * @param {any} item - Item to check
   * @returns {boolean} True if item is loaded
   */
  const isItemLoaded = useCallback((item) => {
    const loadingService = loadingServiceRef.current;
    const itemId = loadingService.getItemId(item);
    return loadingService.loadedItems.has(itemId);
  }, []);

  /**
   * Check if item is loading
   * @param {any} item - Item to check
   * @returns {boolean} True if item is loading
   */
  const isItemLoading = useCallback((item) => {
    const loadingService = loadingServiceRef.current;
    const itemId = loadingService.getItemId(item);
    return loadingService.isLoading(itemId);
  }, []);

  /**
   * Get item data
   * @param {any} item - Item to get data for
   * @returns {object|null} Item data or null if not loaded
   */
  const getItemData = useCallback((item) => {
    const loadingService = loadingServiceRef.current;
    const itemId = loadingService.getItemId(item);
    return loadingCallbacksRef.current.get(itemId) || null;
  }, []);

  /**
   * Preload critical resources
   * @param {Array} resources - Array of resources to preload
   */
  const preloadCriticalResources = useCallback((resources) => {
    const loadingService = loadingServiceRef.current;
    loadingService.preloadCriticalResources(resources);
  }, []);

  /**
   * Clear loaded items
   */
  const clearLoadedItems = useCallback(() => {
    const loadingService = loadingServiceRef.current;
    loadingService.clearLoadedItems();
    loadingCallbacksRef.current.clear();
  }, []);

  /**
   * Cancel all loading
   */
  const cancelAll = useCallback(() => {
    const loadingService = loadingServiceRef.current;
    loadingService.cancelAll();
  }, []);

  /**
   * Update loading limits
   * @param {object} limits - New loading limits
   */
  const updateLoadingLimits = useCallback((limits) => {
    const loadingService = loadingServiceRef.current;
    loadingService.updateLoadingLimits(limits);
  }, []);

  /**
   * Set adaptive loading
   * @param {boolean} enabled - Whether adaptive loading is enabled
   */
  const setAdaptiveLoading = useCallback((enabled) => {
    const loadingService = loadingServiceRef.current;
    loadingService.setAdaptiveLoading(enabled);
  }, []);

  /**
   * Get current network conditions
   * @returns {string} Network conditions (slow, normal, fast)
   */
  const getNetworkConditions = useCallback(() => {
    const loadingService = loadingServiceRef.current;
    return loadingService.getNetworkConditions();
  }, []);

  /**
   * Get loading statistics
   * @returns {object} Loading statistics
   */
  const getLoadingStats = useCallback(() => {
    const loadingService = loadingServiceRef.current;
    return loadingService.getLoadingStats();
  }, []);

  return {
    // State
    loadingStatus,
    networkConditions,
    performanceStats,
    error,
    
    // Functions
    addItem,
    isItemLoaded,
    isItemLoading,
    getItemData,
    preloadCriticalResources,
    clearLoadedItems,
    cancelAll,
    updateLoadingLimits,
    setAdaptiveLoading,
    getNetworkConditions,
    getLoadingStats
  };
};

export default useProgressiveLoading;