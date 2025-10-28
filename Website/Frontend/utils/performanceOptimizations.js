/**
 * 🚀 Performance Optimization Utilities
 * 
 * Features:
 * - Dynamic imports with loading states
 * - Memory management and cleanup
 * - Bundle size analysis
 * - Image lazy loading
 * - Performance monitoring
 * - Cache management
 */

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { isDevelopment } from '../config/environment';

/**
 * Higher-order component for lazy loading with error boundaries
 */
export const withLazyLoading = (importFunc, fallback = <div>Loading...</div>) => {
  const LazyComponent = React.lazy(importFunc);
  
  return function LazyWrapper(props) {
    const [loadError, setLoadError] = useState(null);
    
    if (loadError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">
            Failed to load component. Please refresh the page.
          </p>
          <button 
            onClick={() => setLoadError(null)}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }
    
    return (
      <Suspense fallback={fallback}>
        <LazyComponent 
          {...props} 
          onError={(error) => {
            console.error('Lazy component load error:', error);
            setLoadError(error);
          }}
        />
      </Suspense>
    );
  };
};

/**
 * Preload component for better UX
 */
export const preloadComponent = (importFunc) => {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback for non-critical preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFunc());
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => importFunc(), 1000);
    }
  }
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [hasIntersected, options]);
  
  return { elementRef, isIntersecting, hasIntersected };
};

/**
 * Lazy image component with intersection observer
 */
export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9hZGluZy4uLjwvdGV4dD4KPHN2Zz4=',
  ...props 
}) => {
  const { elementRef, hasIntersected } = useIntersectionObserver();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);
  
  const handleError = useCallback(() => {
    setError(true);
  }, []);
  
  return (
    <div ref={elementRef} className={`relative ${className}`}>
      {!hasIntersected && (
        <img 
          src={placeholder} 
          alt={alt} 
          className="w-full h-full object-cover"
          {...props}
        />
      )}
      
      {hasIntersected && !error && (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            {...props}
          />
          {!loaded && (
            <img 
              src={placeholder} 
              alt={alt} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </>
      )}
      
      {error && (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

/**
 * Memory management hook
 */
export const useMemoryManagement = () => {
  const cleanupFunctions = useRef([]);
  const timeouts = useRef([]);
  const intervals = useRef([]);
  const observers = useRef([]);
  
  const addCleanupFunction = useCallback((fn) => {
    cleanupFunctions.current.push(fn);
  }, []);
  
  const addTimeout = useCallback((fn, delay) => {
    const timeoutId = setTimeout(fn, delay);
    timeouts.current.push(timeoutId);
    return timeoutId;
  }, []);
  
  const addInterval = useCallback((fn, delay) => {
    const intervalId = setInterval(fn, delay);
    intervals.current.push(intervalId);
    return intervalId;
  }, []);
  
  const addObserver = useCallback((observer) => {
    observers.current.push(observer);
    return observer;
  }, []);
  
  const cleanup = useCallback(() => {
    // Clean up functions
    cleanupFunctions.current.forEach(fn => {
      try { fn(); } catch (e) { console.warn('Cleanup error:', e); }
    });
    cleanupFunctions.current = [];
    
    // Clear timeouts
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    
    // Clear intervals
    intervals.current.forEach(clearInterval);
    intervals.current = [];
    
    // Disconnect observers
    observers.current.forEach(observer => {
      try { observer.disconnect(); } catch (e) { console.warn('Observer cleanup error:', e); }
    });
    observers.current = [];
  }, []);
  
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  return {
    addCleanupFunction,
    addTimeout,
    addInterval,
    addObserver,
    cleanup
  };
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.initialized = false;
  }
  
  init() {
    if (this.initialized || typeof window === 'undefined') return;
    
    this.initialized = true;
    this.observePerformanceMetrics();
    this.observeLongTasks();
    this.observeLayoutShifts();
  }
  
  observePerformanceMetrics() {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.metrics.navigation = {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive - entry.fetchStart,
              firstPaint: 0, // Will be updated by paint observer
              firstContentfulPaint: 0 // Will be updated by paint observer
            };
          }
        });
      });
      
      try {
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (e) {
        console.warn('Navigation observer not supported:', e);
      }
      
      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-paint') {
            this.metrics.navigation = {
              ...this.metrics.navigation,
              firstPaint: entry.startTime
            };
          } else if (entry.name === 'first-contentful-paint') {
            this.metrics.navigation = {
              ...this.metrics.navigation,
              firstContentfulPaint: entry.startTime
            };
          }
        });
      });
      
      try {
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint observer not supported:', e);
      }
    }
  }
  
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!this.metrics.longTasks) {
            this.metrics.longTasks = [];
          }
          this.metrics.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
          
          // Log long tasks in development
          if (isDevelopment) {
            console.warn(`🐌 Long task detected: ${entry.duration}ms`, entry);
          }
        });
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported:', e);
      }
    }
  }
  
  observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cumulativeLayoutShift = clsValue;
            
            // Log significant layout shifts in development
            if (isDevelopment && entry.value > 0.1) {
              console.warn(`📏 Significant layout shift: ${entry.value}`, entry);
            }
          }
        });
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('Layout shift observer not supported:', e);
      }
    }
  }
  
  measureComponentRender(componentName, renderFn) {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    if (!this.metrics.componentRenders) {
      this.metrics.componentRenders = {};
    }
    
    if (!this.metrics.componentRenders[componentName]) {
      this.metrics.componentRenders[componentName] = [];
    }
    
    this.metrics.componentRenders[componentName].push({
      duration: endTime - startTime,
      timestamp: Date.now()
    });
    
    // Keep only last 10 renders per component
    if (this.metrics.componentRenders[componentName].length > 10) {
      this.metrics.componentRenders[componentName].shift();
    }
    
    return result;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    };
  }
  
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
  
  cleanup() {
    this.observers.forEach(observer => {
      try { observer.disconnect(); } catch (e) { /* ignore */ }
    });
    this.observers = [];
    this.metrics = {};
    this.initialized = false;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitoring = (componentName) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    performanceMonitor.init();
  }, []);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (isDevelopment && renderCount.current > 10) {
      console.warn(`🔄 Component "${componentName}" has rendered ${renderCount.current} times`);
    }
  });
  
  const measureRender = useCallback((fn) => {
    return performanceMonitor.measureComponentRender(componentName, fn);
  }, [componentName]);
  
  return {
    measureRender,
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    renderCount: renderCount.current
  };
};

/**
 * Bundle analyzer utilities for development
 */
export const BundleAnalyzer = {
  analyzeBundle: () => {
    if (typeof window === 'undefined' || !isDevelopment) return;
    
    const modules = {};
    const scripts = Array.from(document.scripts);
    
    scripts.forEach((script, index) => {
      if (script.src) {
        const url = new URL(script.src);
        const size = script.textContent ? script.textContent.length : 0;
        modules[`script-${index}`] = {
          src: url.pathname,
          size,
          loaded: !script.defer && !script.async
        };
      }
    });
    
    console.group('📦 Bundle Analysis');
    console.table(modules);
    console.groupEnd();
    
    return modules;
  },
  
  reportLargeAssets: (threshold = 100000) => {
    if (typeof window === 'undefined' || !isDevelopment) return;
    
    const largeAssets = [];
    
    // Check images
    Array.from(document.images).forEach((img, index) => {
      if (img.naturalWidth * img.naturalHeight > threshold) {
        largeAssets.push({
          type: 'image',
          element: img,
          src: img.src,
          dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
          estimated_size: img.naturalWidth * img.naturalHeight * 4 // Rough estimate
        });
      }
    });
    
    if (largeAssets.length > 0) {
      console.warn('🖼️ Large assets detected:', largeAssets);
    }
    
    return largeAssets;
  }
};

// Initialize performance monitoring in development
if (isDevelopment && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.init();
      BundleAnalyzer.analyzeBundle();
      BundleAnalyzer.reportLargeAssets();
    }, 1000);
  });
}

export default {
  withLazyLoading,
  preloadComponent,
  useIntersectionObserver,
  LazyImage,
  useMemoryManagement,
  PerformanceMonitor,
  performanceMonitor,
  usePerformanceMonitoring,
  BundleAnalyzer
};