"use client";
import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Lightweight performance metrics collector
class LightweightPerformanceCollector {
  constructor() {
    this.metrics = new Map();
    this.routeTimings = new Map();
    // Disable in production for better performance
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Start timing for a route transition
  startRouteTransition(route) {
    if (!this.isEnabled) return;
    
    const key = `route-${route}`;
    this.metrics.set(key, {
      startTime: performance.now(),
      route,
      type: 'route-transition'
    });
  }

  // End timing and calculate metrics
  endRouteTransition(route) {
    if (!this.isEnabled) return;
    
    const key = `route-${route}`;
    const metric = this.metrics.get(key);
    
    if (metric) {
      const endTime = performance.now();
      const duration = endTime - metric.startTime;
      
      if (!this.routeTimings.has(route)) {
        this.routeTimings.set(route, []);
      }
      
      this.routeTimings.get(route).push(duration);
      
      // Keep only last 5 measurements
      const timings = this.routeTimings.get(route);
      if (timings.length > 5) {
        timings.shift();
      }
      
      this.metrics.delete(key);
      return duration;
    }
    
    return null;
  }

  // Measure component render time (lightweight)
  measureComponent(name, fn) {
    // Completely disabled in production for maximum performance
    if (process.env.NODE_ENV !== 'development') return fn();
    
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    return result;
  }

  // Measure async operation (lightweight)
  async measureAsync(name, asyncFn) {
    // Completely disabled in production for maximum performance
    if (process.env.NODE_ENV !== 'development') return await asyncFn();
    
    const startTime = performance.now();
    const result = await asyncFn();
    const endTime = performance.now();
    
    return result;
  }

  // Initialize Web Vitals observers (lightweight)
  initWebVitals() {
    // Disable in production for better performance
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;
    
    try {
      // Only initialize critical Web Vitals
      if (window.PerformanceObserver) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // Generate performance report
  generateReport() {
    if (!this.isEnabled) {
      return {
        recommendations: []
      };
    }

    // In a real implementation, you would gather actual metrics
    // For now, we'll create a sample report with no recommendations
    return {
      timestamp: new Date().toISOString(),
      recommendations: []
    };
  }
}

// Create singleton instance
const performanceCollector = new LightweightPerformanceCollector();

// Export the collector
export default performanceCollector;

// Hook for measuring component performance
export const usePerformanceMonitor = () => {
  const pathname = usePathname();
  const routeStartRef = useRef(null);
  
  // Start route transition timing
  useEffect(() => {
    if (pathname) {
      performanceCollector.startRouteTransition(pathname);
      routeStartRef.current = Date.now();
    }
  }, [pathname]);
  
  // End route transition timing
  useEffect(() => {
    return () => {
      if (pathname && routeStartRef.current) {
        performanceCollector.endRouteTransition(pathname);
      }
    };
  }, [pathname]);
  
  const measureRender = useCallback((componentName, renderFn) => {
    return performanceCollector.measureComponent(componentName, renderFn);
  }, []);
  
  const measureAsync = useCallback(async (operationName, asyncFn) => {
    return await performanceCollector.measureAsync(operationName, asyncFn);
  }, []);

  // Get performance report
  const getReport = useCallback(() => {
    return performanceCollector.generateReport();
  }, []);
  
  return {
    measureRender,
    measureAsync,
    getReport
  };
};

// Performance debugging component
export const PerformanceDebugger = ({ enabled = false }) => {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      const report = performanceCollector.generateReport();
      if (report && report.recommendations && report.recommendations.length > 0) {
        console.group('🚨 Performance Recommendations');
        report.recommendations.forEach(rec => {
          console.warn(`${rec.type}: ${rec.issue}`);
          console.info(`💡 ${rec.suggestion}`);
        });
        console.groupEnd();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  return null;
};

// Performance metrics display component
export const PerformanceMetrics = ({ show = false }) => {
  const { getReport } = usePerformanceMonitor();

  useEffect(() => {
    if (!show) return;

    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        const report = getReport();
        if (report) {
          // Create a formatted display
          const perfWindow = window.open('', 'performance', 'width=800,height=600');
          perfWindow.document.write(`
            <html>
              <head><title>Performance Report</title></head>
              <body style="font-family: monospace; padding: 20px;">
                <h1>🚀 Performance Report</h1>
                <pre>${JSON.stringify(report, null, 2)}</pre>
              </body>
            </html>
          `);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [show, getReport]);

  return null;
};