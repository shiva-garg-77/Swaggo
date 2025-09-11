"use client";
import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Performance metrics collector
class PerformanceCollector {
  constructor() {
    this.metrics = new Map();
    this.routeTimings = new Map();
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
    
    console.log(`⏱️ Started timing route transition: ${route}`);
  }

  // End timing and calculate metrics
  endRouteTransition(route) {
    if (!this.isEnabled) return;
    
    const key = `route-${route}`;
    const metric = this.metrics.get(key);
    
    if (metric) {
      const endTime = performance.now();
      const duration = endTime - metric.startTime;
      
      // Store route timing
      if (!this.routeTimings.has(route)) {
        this.routeTimings.set(route, []);
      }
      
      this.routeTimings.get(route).push(duration);
      
      // Keep only last 10 measurements
      const timings = this.routeTimings.get(route);
      if (timings.length > 10) {
        timings.shift();
      }
      
      console.log(`✅ Route transition completed: ${route} in ${duration.toFixed(2)}ms`);
      
      // Calculate average
      const average = timings.reduce((a, b) => a + b, 0) / timings.length;
      console.log(`📊 Average time for ${route}: ${average.toFixed(2)}ms`);
      
      this.metrics.delete(key);
      return duration;
    }
    
    return null;
  }

  // Measure component render time
  measureComponent(name, fn) {
    if (!this.isEnabled) return fn();
    
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    console.log(`🔧 Component "${name}" rendered in ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  }

  // Measure async operation
  async measureAsync(name, asyncFn) {
    if (!this.isEnabled) return await asyncFn();
    
    const startTime = performance.now();
    const result = await asyncFn();
    const endTime = performance.now();
    
    console.log(`⚡ Async operation "${name}" completed in ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  }

  // Get Web Vitals
  getWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return {};
    
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      // Time to First Byte
      ttfb: navigation?.responseStart - navigation?.requestStart,
      // First Contentful Paint
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      // Largest Contentful Paint (requires observer)
      lcp: this.lcpValue || null,
      // Cumulative Layout Shift (requires observer)
      cls: this.clsValue || null,
      // First Input Delay (requires observer)
      fid: this.fidValue || null
    };
  }

  // Get route performance summary
  getRoutePerformance() {
    const summary = {};
    
    this.routeTimings.forEach((timings, route) => {
      const average = timings.reduce((a, b) => a + b, 0) / timings.length;
      const min = Math.min(...timings);
      const max = Math.max(...timings);
      
      summary[route] = {
        average: parseFloat(average.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        samples: timings.length
      };
    });
    
    return summary;
  }

  // Initialize Web Vitals observers
  initWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;
    
    try {
      // Largest Contentful Paint
      if (window.PerformanceObserver) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.lcpValue = lastEntry.startTime;
          console.log(`🎨 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.clsValue = clsValue;
          console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.fidValue = entry.processingStart - entry.startTime;
            console.log(`⚡ FID: ${this.fidValue.toFixed(2)}ms`);
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      }
    } catch (error) {
      console.error('Failed to initialize Web Vitals observers:', error);
    }
  }

  // Generate performance report
  generateReport() {
    if (!this.isEnabled) return null;
    
    const webVitals = this.getWebVitals();
    const routePerf = this.getRoutePerformance();
    
    const report = {
      timestamp: new Date().toISOString(),
      webVitals,
      routePerformance: routePerf,
      recommendations: this.generateRecommendations(webVitals, routePerf)
    };
    
    console.log('📋 Performance Report:', report);
    return report;
  }

  // Generate performance recommendations
  generateRecommendations(webVitals, routePerf) {
    const recommendations = [];
    
    // Web Vitals recommendations
    if (webVitals.lcp && webVitals.lcp > 2500) {
      recommendations.push({
        type: 'LCP',
        issue: 'Largest Contentful Paint is slow',
        suggestion: 'Consider lazy loading images and optimizing largest elements'
      });
    }
    
    if (webVitals.fid && webVitals.fid > 100) {
      recommendations.push({
        type: 'FID',
        issue: 'First Input Delay is high',
        suggestion: 'Reduce JavaScript execution time and split large bundles'
      });
    }
    
    if (webVitals.cls && webVitals.cls > 0.1) {
      recommendations.push({
        type: 'CLS',
        issue: 'Cumulative Layout Shift is high',
        suggestion: 'Set dimensions for images and avoid inserting content above existing content'
      });
    }
    
    // Route performance recommendations
    Object.entries(routePerf).forEach(([route, metrics]) => {
      if (metrics.average > 1000) {
        recommendations.push({
          type: 'Route Performance',
          issue: `Route ${route} is slow (${metrics.average}ms average)`,
          suggestion: 'Consider code splitting, lazy loading, or caching optimizations'
        });
      }
    });
    
    return recommendations;
  }
}

// Global performance collector
const performanceCollector = new PerformanceCollector();

// React hook for performance monitoring
export const usePerformanceMonitor = (routeName) => {
  const pathname = usePathname();
  const startTimeRef = useRef(null);
  
  useEffect(() => {
    // Initialize Web Vitals on first mount
    performanceCollector.initWebVitals();
  }, []);

  useEffect(() => {
    // Start timing when route changes
    if (routeName || pathname) {
      const route = routeName || pathname;
      performanceCollector.startRouteTransition(route);
      startTimeRef.current = performance.now();
    }

    return () => {
      // End timing when component unmounts or route changes
      if (routeName || pathname) {
        const route = routeName || pathname;
        performanceCollector.endRouteTransition(route);
      }
    };
  }, [routeName, pathname]);

  const measureRender = useCallback((name, fn) => {
    return performanceCollector.measureComponent(name, fn);
  }, []);

  const measureAsync = useCallback((name, asyncFn) => {
    return performanceCollector.measureAsync(name, asyncFn);
  }, []);

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
      if (report && report.recommendations.length > 0) {
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

export default {
  usePerformanceMonitor,
  PerformanceDebugger,
  PerformanceMetrics,
  performanceCollector
};
