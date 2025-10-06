/**
 * @fileoverview Lightweight Performance Monitoring Dashboard
 * @module PerformanceMonitoringDashboard
 * @version 1.0.0
 * @author Swaggo Development Team
 * 
 * @description
 * Lightweight performance monitoring for production use
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo
} from 'react';

// Lightweight performance monitoring context
const PerformanceMonitoringContext = createContext();

// Simple performance monitor class
class SimplePerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isWindowsPlatform = typeof navigator !== 'undefined' && navigator.platform.includes('Win');
  }

  // Update a metric
  updateMetric(name, value) {
    this.metrics.set(name, {
      value,
      timestamp: Date.now()
    });
  }

  // Get a metric
  getMetric(name) {
    return this.metrics.get(name)?.value || null;
  }

  // Get all metrics
  getAllMetrics() {
    const result = {};
    this.metrics.forEach((value, key) => {
      result[key] = value.value;
    });
    return result;
  }
}

// Create singleton instance
const simpleMonitor = new SimplePerformanceMonitor();

// Performance monitoring provider
export const PerformanceMonitoringProvider = ({ children }) => {
  const [metrics, setMetrics] = useState({});
  
  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(simpleMonitor.getAllMetrics());
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const value = useMemo(() => ({
    metrics,
    updateMetric: simpleMonitor.updateMetric.bind(simpleMonitor),
    getMetric: simpleMonitor.getMetric.bind(simpleMonitor)
  }), [metrics]);
  
  return (
    <PerformanceMonitoringContext.Provider value={value}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
};

// Hook to use performance monitoring
export const usePerformanceMonitoring = () => {
  const context = useContext(PerformanceMonitoringContext);
  
  if (!context) {
    throw new Error('usePerformanceMonitoring must be used within a PerformanceMonitoringProvider');
  }
  
  return context;
};

// Lightweight performance dashboard
export const PerformanceDashboard = () => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const { metrics } = usePerformanceMonitoring();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: 10,
      borderRadius: 5,
      fontSize: 12,
      zIndex: 9999,
      maxWidth: 300
    }}>
      <h4 style={{ margin: 0, marginBottom: 5 }}>Performance Metrics</h4>
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} style={{ marginBottom: 3 }}>
          <strong>{key}:</strong> {typeof value === 'number' ? value.toFixed(2) : value}
        </div>
      ))}
    </div>
  );
};

// Performance monitoring hook for components
export const useComponentPerformance = (componentName) => {
  const { updateMetric } = usePerformanceMonitoring();
  const renderStartRef = useRef(null);
  
  // Measure render time
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderStartRef.current = performance.now();
      
      return () => {
        if (renderStartRef.current) {
          const renderTime = performance.now() - renderStartRef.current;
          updateMetric(`${componentName}_renderTime`, renderTime);
        }
      };
    }
  }, [componentName, updateMetric]);
  
  // Measure interaction time
  const measureInteraction = useCallback((interactionName, fn) => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      updateMetric(`${componentName}_${interactionName}_time`, end - start);
      return result;
    }
    return fn();
  }, [componentName, updateMetric]);
  
  return {
    measureInteraction
  };
};