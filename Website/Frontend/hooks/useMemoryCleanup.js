'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced Memory Cleanup Hook
 * Prevents memory leaks by tracking and cleaning up resources
 */
export const useMemoryCleanup = (componentName = 'Component') => {
  const resourcesRef = useRef({
    timers: new Set(),
    intervals: new Set(),
    subscriptions: new Set(),
    observers: new Set(),
    listeners: new Map(),
    promises: new Set(),
    websockets: new Set(),
    caches: new Set(),
    abortControllers: new Set()
  });

  // Track component mount/unmount for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🟢 ${componentName} mounted`);
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔴 ${componentName} unmounting - cleaning up resources`);
      }
      cleanupAllResources();
    };
  }, [componentName]);

  // Cleanup all resources
  const cleanupAllResources = useCallback(() => {
    const resources = resourcesRef.current;
    let cleanupCount = 0;

    // Clear timers
    resources.timers.forEach(timerId => {
      clearTimeout(timerId);
      cleanupCount++;
    });
    resources.timers.clear();

    // Clear intervals
    resources.intervals.forEach(intervalId => {
      clearInterval(intervalId);
      cleanupCount++;
    });
    resources.intervals.clear();

    // Cleanup subscriptions
    resources.subscriptions.forEach(unsubscribe => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
          cleanupCount++;
        }
      } catch (error) {
        console.error('Error during subscription cleanup:', error);
      }
    });
    resources.subscriptions.clear();

    // Disconnect observers
    resources.observers.forEach(observer => {
      try {
        if (observer && typeof observer.disconnect === 'function') {
          observer.disconnect();
          cleanupCount++;
        }
      } catch (error) {
        console.error('Error during observer cleanup:', error);
      }
    });
    resources.observers.clear();

    // Remove event listeners
    resources.listeners.forEach((listener, element) => {
      try {
        if (element && typeof element.removeEventListener === 'function') {
          const { eventType, handler, options } = listener;
          element.removeEventListener(eventType, handler, options);
          cleanupCount++;
        }
      } catch (error) {
        console.error('Error during listener cleanup:', error);
      }
    });
    resources.listeners.clear();

    // Abort pending promises
    resources.abortControllers.forEach(controller => {
      try {
        if (controller && typeof controller.abort === 'function') {
          controller.abort();
          cleanupCount++;
        }
      } catch (error) {
        console.error('Error during promise abort:', error);
      }
    });
    resources.abortControllers.clear();

    // Close WebSocket connections
    resources.websockets.forEach(websocket => {
      try {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          websocket.close(1000, 'Component cleanup');
          cleanupCount++;
        }
      } catch (error) {
        console.error('Error during WebSocket cleanup:', error);
      }
    });
    resources.websockets.clear();

    // Clear caches
    resources.caches.forEach(cache => {
      try {
        if (cache && typeof cache.clear === 'function') {
          cache.clear();
          cleanupCount++;
        }
      } catch (error) {
        console.error('Error during cache cleanup:', error);
      }
    });
    resources.caches.clear();

    if (process.env.NODE_ENV === 'development' && cleanupCount > 0) {
      console.log(`🧹 ${componentName}: Cleaned up ${cleanupCount} resources`);
    }
  }, [componentName]);

  // Resource tracking functions
  const trackTimer = useCallback((timerId) => {
    resourcesRef.current.timers.add(timerId);
    return timerId;
  }, []);

  const trackInterval = useCallback((intervalId) => {
    resourcesRef.current.intervals.add(intervalId);
    return intervalId;
  }, []);

  const trackSubscription = useCallback((unsubscribe) => {
    resourcesRef.current.subscriptions.add(unsubscribe);
    return unsubscribe;
  }, []);

  const trackObserver = useCallback((observer) => {
    resourcesRef.current.observers.add(observer);
    return observer;
  }, []);

  const trackEventListener = useCallback((element, eventType, handler, options) => {
    element.addEventListener(eventType, handler, options);
    resourcesRef.current.listeners.set(element, { eventType, handler, options });
    return () => {
      element.removeEventListener(eventType, handler, options);
      resourcesRef.current.listeners.delete(element);
    };
  }, []);

  const trackPromise = useCallback((promise, abortController) => {
    if (abortController) {
      resourcesRef.current.abortControllers.add(abortController);
    }
    
    // Track the promise and handle cleanup
    const trackedPromise = promise.finally(() => {
      if (abortController) {
        resourcesRef.current.abortControllers.delete(abortController);
      }
      resourcesRef.current.promises.delete(trackedPromise);
    });
    
    resourcesRef.current.promises.add(trackedPromise);
    return trackedPromise;
  }, []);

  const trackWebSocket = useCallback((websocket) => {
    resourcesRef.current.websockets.add(websocket);
    
    // Auto-remove when connection closes
    websocket.addEventListener('close', () => {
      resourcesRef.current.websockets.delete(websocket);
    });
    
    return websocket;
  }, []);

  const trackCache = useCallback((cache) => {
    resourcesRef.current.caches.add(cache);
    return cache;
  }, []);

  // Convenience methods for common patterns
  const safeSetTimeout = useCallback((callback, delay) => {
    const timerId = setTimeout(callback, delay);
    return trackTimer(timerId);
  }, [trackTimer]);

  const safeSetInterval = useCallback((callback, delay) => {
    const intervalId = setInterval(callback, delay);
    return trackInterval(intervalId);
  }, [trackInterval]);

  const createAbortablePromise = useCallback((promiseFactory) => {
    const abortController = new AbortController();
    const promise = promiseFactory(abortController.signal);
    return trackPromise(promise, abortController);
  }, [trackPromise]);

  // Get resource statistics
  const getResourceStats = useCallback(() => {
    const resources = resourcesRef.current;
    return {
      timers: resources.timers.size,
      intervals: resources.intervals.size,
      subscriptions: resources.subscriptions.size,
      observers: resources.observers.size,
      listeners: resources.listeners.size,
      promises: resources.promises.size,
      websockets: resources.websockets.size,
      caches: resources.caches.size,
      abortControllers: resources.abortControllers.size,
      total: resources.timers.size + 
             resources.intervals.size + 
             resources.subscriptions.size + 
             resources.observers.size + 
             resources.listeners.size + 
             resources.promises.size + 
             resources.websockets.size + 
             resources.caches.size + 
             resources.abortControllers.size
    };
  }, []);

  // Manual cleanup trigger
  const manualCleanup = useCallback(() => {
    cleanupAllResources();
  }, [cleanupAllResources]);

  return {
    // Resource tracking
    trackTimer,
    trackInterval,
    trackSubscription,
    trackObserver,
    trackEventListener,
    trackPromise,
    trackWebSocket,
    trackCache,
    
    // Convenience methods
    safeSetTimeout,
    safeSetInterval,
    createAbortablePromise,
    
    // Utilities
    getResourceStats,
    manualCleanup,
    cleanupAllResources
  };
};

/**
 * HOC for automatic memory cleanup
 */
export const withMemoryCleanup = (WrappedComponent, componentName) => {
  const ComponentWithCleanup = (props) => {
    const cleanup = useMemoryCleanup(componentName || WrappedComponent.name);
    
    return (
      <WrappedComponent 
        {...props} 
        memoryCleanup={cleanup}
      />
    );
  };
  
  ComponentWithCleanup.displayName = `withMemoryCleanup(${componentName || WrappedComponent.name})`;
  return ComponentWithCleanup;
};

/**
 * Hook for tracking fetch requests with automatic abort
 */
export const useAbortableFetch = () => {
  const { createAbortablePromise } = useMemoryCleanup('AbortableFetch');
  
  const abortableFetch = useCallback((url, options = {}) => {
    return createAbortablePromise((signal) => {
      return fetch(url, {
        ...options,
        signal
      });
    });
  }, [createAbortablePromise]);
  
  return { abortableFetch };
};

/**
 * Hook for tracked event listeners
 */
export const useTrackedEventListener = (elementRef, eventType, handler, options, deps = []) => {
  const { trackEventListener } = useMemoryCleanup('TrackedEventListener');
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    return trackEventListener(element, eventType, handler, options);
  }, [elementRef, eventType, handler, options, trackEventListener, ...deps]);
};

/**
 * Hook for tracked intervals
 */
export const useTrackedInterval = (callback, delay, immediate = false) => {
  const { safeSetInterval } = useMemoryCleanup('TrackedInterval');
  
  useEffect(() => {
    if (immediate) {
      callback();
    }
    
    if (delay !== null && delay !== undefined) {
      return () => {
        clearInterval(safeSetInterval(callback, delay));
      };
    }
  }, [callback, delay, immediate, safeSetInterval]);
};

/**
 * Hook for tracked timeouts
 */
export const useTrackedTimeout = (callback, delay) => {
  const { safeSetTimeout } = useMemoryCleanup('TrackedTimeout');
  
  useEffect(() => {
    if (delay !== null && delay !== undefined) {
      return () => {
        clearTimeout(safeSetTimeout(callback, delay));
      };
    }
  }, [callback, delay, safeSetTimeout]);
};

export default useMemoryCleanup;