'use client';

/**
 * 🔧 COMPREHENSIVE MEMORY LEAK FIXES
 * 
 * Addresses all identified memory leak issues:
 * - useEffect cleanup functions missing
 * - Event listeners not being removed
 * - Timers and intervals not being cleared
 * - Subscription cleanup issues
 * - Observer disconnection problems
 * - Cache management improvements
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced useEffect hook with automatic cleanup tracking
 */
export const useCleanupEffect = (effect, deps = []) => {
  const cleanupFns = useRef([]);
  
  useEffect(() => {
    // Run the effect and collect cleanup functions
    const cleanup = effect((cleanupFn) => {
      if (typeof cleanupFn === 'function') {
        cleanupFns.current.push(cleanupFn);
      }
    });
    
    // Return comprehensive cleanup
    return () => {
      // Run effect's own cleanup if it returns one
      if (typeof cleanup === 'function') {
        try { cleanup(); } catch (e) { console.warn('Effect cleanup error:', e); }
      }
      
      // Run all registered cleanup functions
      cleanupFns.current.forEach(fn => {
        try { fn(); } catch (e) { console.warn('Registered cleanup error:', e); }
      });
      
      // Reset cleanup array
      cleanupFns.current = [];
    };
  }, deps);
};

/**
 * Hook for managing multiple timers with automatic cleanup
 */
export const useTimerManager = () => {
  const timers = useRef({
    timeouts: new Set(),
    intervals: new Set()
  });
  
  const createTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timers.current.timeouts.delete(id);
      callback();
    }, delay);
    timers.current.timeouts.add(id);
    return id;
  }, []);
  
  const createInterval = useCallback((callback, delay) => {
    const id = setInterval(callback, delay);
    timers.current.intervals.add(id);
    return id;
  }, []);
  
  const clearTimeout = useCallback((id) => {
    if (timers.current.timeouts.has(id)) {
      window.clearTimeout(id);
      timers.current.timeouts.delete(id);
    }
  }, []);
  
  const clearInterval = useCallback((id) => {
    if (timers.current.intervals.has(id)) {
      window.clearInterval(id);
      timers.current.intervals.delete(id);
    }
  }, []);
  
  const clearAll = useCallback(() => {
    timers.current.timeouts.forEach(id => window.clearTimeout(id));
    timers.current.intervals.forEach(id => window.clearInterval(id));
    timers.current.timeouts.clear();
    timers.current.intervals.clear();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return clearAll;
  }, [clearAll]);
  
  return {
    setTimeout: createTimeout,
    setInterval: createInterval,
    clearTimeout,
    clearInterval,
    clearAll
  };
};

/**
 * Hook for managing event listeners with automatic cleanup
 */
export const useEventManager = () => {
  const listeners = useRef(new Map());
  
  const addEventListener = useCallback((target, event, handler, options) => {
    const key = `${target.constructor.name}-${event}-${handler.name || 'anonymous'}`;
    
    // Remove existing listener if already registered
    if (listeners.current.has(key)) {
      const { target: oldTarget, event: oldEvent, handler: oldHandler } = listeners.current.get(key);
      oldTarget.removeEventListener(oldEvent, oldHandler);
    }
    
    // Add new listener
    target.addEventListener(event, handler, options);
    listeners.current.set(key, { target, event, handler, options });
    
    // Return cleanup function
    return () => {
      target.removeEventListener(event, handler);
      listeners.current.delete(key);
    };
  }, []);
  
  const removeEventListener = useCallback((target, event, handler) => {
    const key = `${target.constructor.name}-${event}-${handler.name || 'anonymous'}`;
    if (listeners.current.has(key)) {
      target.removeEventListener(event, handler);
      listeners.current.delete(key);
    }
  }, []);
  
  const removeAllListeners = useCallback(() => {
    listeners.current.forEach(({ target, event, handler }) => {
      try {
        target.removeEventListener(event, handler);
      } catch (e) {
        console.warn('Error removing event listener:', e);
      }
    });
    listeners.current.clear();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return removeAllListeners;
  }, [removeAllListeners]);
  
  return {
    addEventListener,
    removeEventListener,
    removeAllListeners
  };
};

/**
 * Hook for managing observers with automatic cleanup
 */
export const useObserverManager = () => {
  const observers = useRef(new Set());
  
  const createObserver = useCallback((ObserverClass, callback, options) => {
    const observer = new ObserverClass(callback, options);
    observers.current.add(observer);
    
    return {
      observer,
      disconnect: () => {
        observer.disconnect();
        observers.current.delete(observer);
      }
    };
  }, []);
  
  const disconnectAll = useCallback(() => {
    observers.current.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn('Error disconnecting observer:', e);
      }
    });
    observers.current.clear();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return disconnectAll;
  }, [disconnectAll]);
  
  return {
    createObserver,
    disconnectAll
  };
};

/**
 * Hook for managing memory-intensive operations
 */
export const useMemoryManager = () => {
  const resources = useRef({
    caches: new Map(),
    websockets: new Set(),
    workers: new Set(),
    mediaStreams: new Set()
  });
  
  const registerCache = useCallback((key, cache) => {
    resources.current.caches.set(key, cache);
  }, []);
  
  const registerWebSocket = useCallback((ws) => {
    resources.current.websockets.add(ws);
    
    // Auto-cleanup on close
    ws.addEventListener('close', () => {
      resources.current.websockets.delete(ws);
    });
  }, []);
  
  const registerWorker = useCallback((worker) => {
    resources.current.workers.add(worker);
  }, []);
  
  const registerMediaStream = useCallback((stream) => {
    resources.current.mediaStreams.add(stream);
  }, []);
  
  const cleanup = useCallback(() => {
    // Clear caches
    resources.current.caches.forEach((cache, key) => {
      try {
        if (cache.clear) cache.clear();
        if (cache.delete) cache.delete();
      } catch (e) {
        console.warn(`Error clearing cache ${key}:`, e);
      }
    });
    resources.current.caches.clear();
    
    // Close WebSockets
    resources.current.websockets.forEach(ws => {
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      } catch (e) {
        console.warn('Error closing WebSocket:', e);
      }
    });
    resources.current.websockets.clear();
    
    // Terminate Workers
    resources.current.workers.forEach(worker => {
      try {
        worker.terminate();
      } catch (e) {
        console.warn('Error terminating worker:', e);
      }
    });
    resources.current.workers.clear();
    
    // Stop Media Streams
    resources.current.mediaStreams.forEach(stream => {
      try {
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping media stream:', e);
      }
    });
    resources.current.mediaStreams.clear();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return {
    registerCache,
    registerWebSocket,
    registerWorker,
    registerMediaStream,
    cleanup
  };
};

/**
 * Comprehensive cleanup hook that combines all managers
 */
export const useComprehensiveCleanup = () => {
  const timerManager = useTimerManager();
  const eventManager = useEventManager();
  const observerManager = useObserverManager();
  const memoryManager = useMemoryManager();
  
  const cleanupAll = useCallback(() => {
    console.log('🧹 Performing comprehensive cleanup...');
    
    timerManager.clearAll();
    eventManager.removeAllListeners();
    observerManager.disconnectAll();
    memoryManager.cleanup();
    
    // Force garbage collection if available
    if (window.gc) {
      try {
        window.gc();
        console.log('🗑️ Forced garbage collection');
      } catch (e) {
        // Ignore GC errors
      }
    }
  }, [timerManager, eventManager, observerManager, memoryManager]);
  
  // Global cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupAll();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupAll();
    };
  }, [cleanupAll]);
  
  return {
    ...timerManager,
    ...eventManager,
    ...observerManager,
    ...memoryManager,
    cleanupAll
  };
};

/**
 * Memory monitoring and alerting
 */
export const useMemoryMonitoring = (options = {}) => {
  const {
    alertThreshold = 50 * 1024 * 1024, // 50MB
    checkInterval = 30000, // 30 seconds
    onMemoryAlert = () => {}
  } = options;
  
  const { setTimeout, clearTimeout } = useTimerManager();
  
  useEffect(() => {
    if (!performance.memory) return;
    
    const checkMemory = () => {
      const used = performance.memory.usedJSHeapSize;
      
      if (used > alertThreshold) {
        console.warn(`⚠️ Memory usage high: ${(used / 1024 / 1024).toFixed(2)}MB`);
        onMemoryAlert({
          used,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          percentage: (used / performance.memory.totalJSHeapSize) * 100
        });
      }
    };
    
    // Initial check
    checkMemory();
    
    // Periodic checks
    const intervalId = setTimeout(() => {
      checkMemory();
    }, checkInterval);
    
    return () => clearTimeout(intervalId);
  }, [alertThreshold, checkInterval, onMemoryAlert, setTimeout, clearTimeout]);
};

