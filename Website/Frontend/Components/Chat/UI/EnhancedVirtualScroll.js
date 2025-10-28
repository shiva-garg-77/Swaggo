import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ProgressiveLoadingService from '../../Services/ProgressiveLoadingService';
import useVirtualScrolling from '../../hooks/useVirtualScrolling';

/**
 * 🚀 Enhanced Virtual Scroll Component
 * 
 * Optimizes rendering of large lists with progressive loading and performance monitoring
 * 
 * Features:
 * - Virtual scrolling for large lists
 * - Progressive loading with priority
 * - Performance monitoring
 * - Adaptive loading based on network conditions
 * - Cache management
 */

export default function EnhancedVirtualScroll({ 
  items = [],
  itemHeight,
  containerRef,
  renderItem,
  onScroll,
  buffer = 10,
  overscan = 5,
  theme = 'light'
}) {
  const [loadingStatus, setLoadingStatus] = useState({
    priorityQueue: 0,
    loadingQueue: 0,
    loadedItems: 0
  });
  
  const [networkConditions, setNetworkConditions] = useState('normal');
  const [performanceStats, setPerformanceStats] = useState({
    averageLoadTime: 0,
    totalLoaded: 0,
    totalFailed: 0
  });
  
  const progressiveLoadingRef = useRef(new ProgressiveLoadingService());
  const loadingCallbacksRef = useRef(new Map());
  
  // Initialize virtual scrolling
  const {
    visibleItems,
    visibleRange,
    totalHeight,
    scrollPosition,
    viewportHeight,
    scrollToItem,
    scrollToBottom,
    isItemVisible,
    updateVisibleRange
  } = useVirtualScrolling(items, itemHeight, containerRef, { buffer, overscan, onScroll });

  // Start performance monitoring
  useEffect(() => {
    const loadingService = progressiveLoadingRef.current;
    loadingService.startPerformanceMonitoring();
    
    // Update network conditions periodically
    const interval = setInterval(() => {
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
    }, 1000);
    
    return () => {
      loadingService.stopPerformanceMonitoring();
      clearInterval(interval);
    };
  }, []);

  // Preload critical items when visible range changes
  useEffect(() => {
    const loadingService = progressiveLoadingRef.current;
    
    // Preload items in visible range + buffer
    const preloadStart = Math.max(0, visibleRange.start - buffer);
    const preloadEnd = Math.min(items.length - 1, visibleRange.end + buffer);
    
    for (let i = preloadStart; i <= preloadEnd; i++) {
      const item = items[i];
      if (!item) continue;
      
      // Determine priority based on proximity to visible range
      let priority = 'low';
      if (i >= visibleRange.start && i <= visibleRange.end) {
        priority = 'critical';
      } else if (i >= visibleRange.start - 2 && i <= visibleRange.end + 2) {
        priority = 'high';
      } else if (i >= visibleRange.start - 5 && i <= visibleRange.end + 5) {
        priority = 'medium';
      }
      
      // Add item to loading queue if not already loaded
      const itemId = loadingService.getItemId(item);
      if (!loadingService.loadedItems.has(itemId)) {
        loadingService.addItem(item, priority, (error, result, fromCache) => {
          // Store callback for re-rendering
          loadingCallbacksRef.current.set(itemId, { error, result, fromCache });
          
          // Trigger re-render
          updateVisibleRange();
        });
      }
    }
  }, [visibleRange, items, buffer, updateVisibleRange]);

  // Enhanced render item function that handles loading states
  const renderEnhancedItem = useCallback(({ item, index, offset }) => {
    const loadingService = progressiveLoadingRef.current;
    const itemId = loadingService.getItemId(item);
    
    // Check if item is loaded
    const isLoaded = loadingService.loadedItems.has(itemId);
    const isLoading = loadingService.isLoading(itemId);
    const callbackData = loadingCallbacksRef.current.get(itemId);
    
    // Determine item priority for loading indicator
    let priority = 'low';
    if (index >= visibleRange.start && index <= visibleRange.end) {
      priority = 'critical';
    } else if (index >= visibleRange.start - 2 && index <= visibleRange.end + 2) {
      priority = 'high';
    } else if (index >= visibleRange.start - 5 && index <= visibleRange.end + 5) {
      priority = 'medium';
    }
    
    return (
      <div
        key={itemId}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${offset}px)`,
          zIndex: isLoaded ? 'auto' : 1
        }}
      >
        {isLoaded && callbackData && !callbackData.error ? (
          // Render loaded item
          renderItem(item, index, callbackData.result, callbackData.fromCache)
        ) : isLoading ? (
          // Render loading state
          <div className={`flex items-center justify-center p-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Loading {priority} item...
              </span>
            </div>
          </div>
        ) : callbackData && callbackData.error ? (
          // Render error state
          <div className={`flex items-center justify-center p-4 ${
            theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-red-300' : 'text-red-700'
            }`}>
              Failed to load item
            </div>
          </div>
        ) : (
          // Render placeholder
          <div className={`flex items-center justify-center p-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Queued for loading...
            </div>
          </div>
        )}
      </div>
    );
  }, [renderItem, theme, visibleRange]);

  // Network condition indicator
  const getNetworkIndicator = () => {
    switch (networkConditions) {
      case 'slow':
        return (
          <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1 animate-pulse"></div>
            Slow network
          </div>
        );
      case 'fast':
        return (
          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            Fast network
          </div>
        );
      default:
        return (
          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
            Normal network
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Performance Stats Overlay */}
      <div className={`absolute top-2 right-2 z-10 p-2 rounded-lg text-xs ${
        theme === 'dark' ? 'bg-gray-800/80 text-gray-300' : 'bg-white/80 text-gray-700'
      } shadow-lg`}>
        <div className="flex items-center space-x-3">
          {getNetworkIndicator()}
          
          <div className="flex items-center space-x-2">
            <span>Loaded: {loadingStatus.loadedItems}</span>
            <span>•</span>
            <span>Loading: {loadingStatus.loadingQueue}</span>
            <span>•</span>
            <span>Queue: {loadingStatus.priorityQueue}</span>
          </div>
          
          {performanceStats.averageLoadTime > 0 && (
            <div className="flex items-center space-x-2">
              <span>Avg: {performanceStats.averageLoadTime}ms</span>
              <span>•</span>
              <span>Failed: {performanceStats.totalFailed}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Virtual Scrolling Container */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto relative"
        style={{ 
          height: '100%',
          overflowY: 'auto'
        }}
      >
        {/* Spacer for total height */}
        <div style={{ height: totalHeight }}></div>
        
        {/* Visible items */}
        {visibleItems.map(renderEnhancedItem)}
      </div>
    </div>
  );
}