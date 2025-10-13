/**
 * React Profiler Utilities
 * 
 * Performance monitoring and optimization tools for React components
 * 🔧 PERFORMANCE FIX #89: React DevTools optimization
 */

import React, { Profiler, useCallback, useState, useEffect, useMemo } from 'react';

/**
 * Profiler callback for measuring component performance
 */
const onRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Profiler] ${id}: ${phase} - Actual: ${actualDuration.toFixed(2)}ms, Base: ${baseDuration.toFixed(2)}ms`);
  }
};

/**
 * Higher-order component for profiling React components
 */
export const withProfiler = (Component, id) => {
  // Only wrap with Profiler in development mode
  if (process.env.NODE_ENV !== 'development') {
    return Component;
  }

  const ProfilerWrapper = (props) => {
    return (
      <Profiler id={id || Component.displayName || Component.name || 'Unknown'} onRender={onRenderCallback}>
        <Component {...props} />
      </Profiler>
    );
  };

  ProfilerWrapper.displayName = `Profiler(${Component.displayName || Component.name || 'Component'})`;
  
  return ProfilerWrapper;
};

/**
 * Custom hook for measuring component render performance
 */
export const useRenderPerformance = (componentName) => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(0);
  const [performanceData, setPerformanceData] = useState([]);

  // Track render count
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    setLastRenderTime(Date.now());
  });

  // Add performance data point
  const addPerformanceData = useCallback((duration) => {
    setPerformanceData(prev => {
      const newData = [...prev, {
        timestamp: Date.now(),
        duration,
        renderCount: renderCount + 1
      }];
      
      // Keep only last 100 data points
      return newData.slice(-100);
    });
  }, [renderCount]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (performanceData.length === 0) return null;
    
    const durations = performanceData.map(d => d.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    return {
      avgDuration: avgDuration.toFixed(2),
      maxDuration: maxDuration.toFixed(2),
      minDuration: minDuration.toFixed(2),
      totalRenders: renderCount,
      dataPoints: performanceData.length
    };
  }, [performanceData, renderCount]);

  return {
    renderCount,
    lastRenderTime,
    addPerformanceData,
    performanceMetrics
  };
};

/**
 * Performance monitoring context
 */
export const PerformanceContext = React.createContext({
  isProfiling: false,
  toggleProfiling: () => {},
  performanceData: {}
});

/**
 * Performance monitoring provider
 */
export const PerformanceProvider = ({ children }) => {
  const [isProfiling, setIsProfiling] = useState(false);
  const [performanceData, setPerformanceData] = useState({});

  const toggleProfiling = useCallback(() => {
    setIsProfiling(prev => !prev);
  }, []);

  const updatePerformanceData = useCallback((componentId, data) => {
    setPerformanceData(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        ...data,
        lastUpdated: Date.now()
      }
    }));
  }, []);

  const value = useMemo(() => ({
    isProfiling,
    toggleProfiling,
    performanceData,
    updatePerformanceData
  }), [isProfiling, performanceData, toggleProfiling, updatePerformanceData]);

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

/**
 * Hook for accessing performance context
 */
export const usePerformance = () => {
  const context = React.useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

/**
 * Component for displaying performance metrics
 */
export const PerformanceMetrics = ({ componentName }) => {
  const { performanceData } = usePerformance();
  const metrics = performanceData[componentName];

  if (!metrics) return null;

  return (
    <div className="performance-metrics" style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div><strong>{componentName} Performance</strong></div>
      <div>Render Time: {metrics.duration?.toFixed(2)}ms</div>
      <div>Last Updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}</div>
    </div>
  );
};

/**
 * Profiler component with enhanced metrics
 */
export const EnhancedProfiler = ({ id, children, disabled = false }) => {
  // Only enable in development mode
  if (process.env.NODE_ENV !== 'development' || disabled) {
    return children;
  }

  const { updatePerformanceData } = usePerformance();

  const handleRender = useCallback((
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    // Update performance data
    updatePerformanceData(id, {
      phase,
      duration: actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions: interactions ? Array.from(interactions).length : 0
    });

    // Log to console in development
    console.log(`[EnhancedProfiler] ${id}:`, {
      phase,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
      startTime,
      commitTime,
      interactionCount: interactions ? Array.from(interactions).length : 0
    });
  }, [id, updatePerformanceData]);

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
};

/**
 * Utility function to wrap components with performance monitoring
 */
export const withPerformanceMonitoring = (Component, options = {}) => {
  const {
    id = Component.displayName || Component.name || 'Component',
    profile = true,
    logRenders = false
  } = options;

  if (process.env.NODE_ENV !== 'development') {
    return Component;
  }

  const WrappedComponent = React.forwardRef((props, ref) => {
    const { addPerformanceData } = useRenderPerformance(id);
    const startTime = performance.now();

    // Log renders if enabled
    if (logRenders) {
      console.log(`[Render] ${id} rendered at ${new Date().toLocaleTimeString()}`);
    }

    // Measure render duration
    useEffect(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      addPerformanceData(duration);
    }, [addPerformanceData, startTime]);

    // Wrap with profiler if enabled
    if (profile) {
      return (
        <EnhancedProfiler id={id}>
          <Component ref={ref} {...props} />
        </EnhancedProfiler>
      );
    }

    return <Component ref={ref} {...props} />;
  });

  WrappedComponent.displayName = `PerformanceMonitored(${id})`;
  
  return WrappedComponent;
};

export default {
  withProfiler,
  useRenderPerformance,
  PerformanceProvider,
  usePerformance,
  PerformanceMetrics,
  EnhancedProfiler,
  withPerformanceMonitoring
};