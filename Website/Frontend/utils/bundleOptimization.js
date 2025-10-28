'use client';

import React, { lazy, Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '../Components/ErrorBoundary';

/**
 * Bundle Optimization Utilities
 * Provides code splitting, lazy loading, and bundle analysis tools
 */

// Loading components for different scenarios
export const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

export const PageLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const ComponentLoadingSkeleton = ({ lines = 3, height = '16px' }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }, (_, i) => (
      <div 
        key={i}
        className="bg-gray-200 rounded"
        style={{ height: height, width: i === lines - 1 ? '75%' : '100%' }}
      />
    ))}
  </div>
);

/**
 * Enhanced lazy loading wrapper with error handling
 */
export const createLazyComponent = (
  importFunction,
  fallback = <LoadingSpinner />,
  errorFallback = <div>Error loading component</div>
) => {
  const LazyComponent = lazy(importFunction);

  return (props) => (
    <Suspense fallback={fallback}>
      <ErrorBoundary fallback={errorFallback}>
        <LazyComponent {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * Dynamic component loader with Next.js optimizations
 */
export const createDynamicComponent = (
  importFunction,
  options = {}
) => {
  const defaultOptions = {
    loading: () => <LoadingSpinner />,
    ssr: true,
    suspense: false
  };

  return dynamic(importFunction, { ...defaultOptions, ...options });
};

/**
 * Route-based code splitting utilities
 */
export const RouteComponents = {
  // Main routes
  Dashboard: createDynamicComponent(
    () => import('../app/(main-Body)/dashboard/page'),
    { 
      loading: () => <PageLoadingSkeleton />,
      ssr: true 
    }
  ),
  
  Profile: createDynamicComponent(
    () => import('../app/(Main-body)/Profile/page'),
    { 
      loading: () => <PageLoadingSkeleton />,
      ssr: true 
    }
  ),
  
  AIAssistant: createDynamicComponent(
    () => import('../app/(Main-body)/ai-assistant/page'),
    { 
      loading: () => <PageLoadingSkeleton />,
      ssr: false // AI features don't need SSR
    }
  ),
  
  Game: createDynamicComponent(
    () => import('../app/(Main-body)/game/page'),
    { 
      loading: () => <PageLoadingSkeleton />,
      ssr: false // Games don't need SSR
    }
  ),
  
  // Chat components
  ChatInterface: createDynamicComponent(
    () => import('../components/Chat/ComprehensiveChatInterface'),
    { 
      loading: () => <ComponentLoadingSkeleton lines={10} />,
      ssr: false // Chat is client-only
    }
  ),
  
  MessageArea: createDynamicComponent(
    () => import('../components/Chat/MessageArea'),
    { 
      loading: () => <ComponentLoadingSkeleton lines={5} />,
      ssr: false
    }
  )
};

/**
 * Feature-based code splitting
 */
export const FeatureComponents = {
  // Admin features - only load when needed
  AdminDashboard: createDynamicComponent(
    () => import('../components/Admin/AdminDashboard'),
    { 
      loading: () => <PageLoadingSkeleton />,
      ssr: false 
    }
  ),
  
  UserManagement: createDynamicComponent(
    () => import('../components/Admin/UserManagement'),
    { 
      loading: () => <ComponentLoadingSkeleton />,
      ssr: false 
    }
  ),
  
  // Heavy UI components
  DataVisualization: createDynamicComponent(
    () => import('../components/Analytics/DataVisualization'),
    { 
      loading: () => <div>Loading charts...</div>,
      ssr: false 
    }
  ),
  
  FileUploader: createDynamicComponent(
    () => import('../components/FileUpload/FileUploader'),
    { 
      loading: () => <div>Loading file uploader...</div>,
      ssr: false 
    }
  ),
  
  RichTextEditor: createDynamicComponent(
    () => import('../components/Editor/RichTextEditor'),
    { 
      loading: () => <ComponentLoadingSkeleton lines={8} />,
      ssr: false 
    }
  )
};

/**
 * Third-party library lazy loading
 */
export const ThirdPartyComponents = {
  // Chart libraries
  Chart: createDynamicComponent(
    () => import('react-chartjs-2').then(mod => ({ default: mod.Chart })),
    { 
      loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse"></div>,
      ssr: false 
    }
  ),
  
  // Date picker
  DatePicker: createDynamicComponent(
    () => import('react-datepicker').then(mod => ({ default: mod.default })),
    { 
      loading: () => <div className="w-full h-10 bg-gray-100 rounded animate-pulse"></div>,
      ssr: false 
    }
  ),
  
  // Code editor
  CodeEditor: createDynamicComponent(
    () => import('@monaco-editor/react').then(mod => ({ default: mod.default })),
    { 
      loading: () => <div className="w-full h-96 bg-gray-900 rounded animate-pulse"></div>,
      ssr: false 
    }
  )
};

/**
 * Progressive loading for images and media
 */
export const ProgressiveImage = ({ 
  src, 
  placeholder, 
  alt, 
  className = '', 
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && !imageFailed && placeholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded">
          {placeholder}
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageFailed(true)}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
        {...props}
      />
      
      {imageFailed && (
        <div className="flex items-center justify-center bg-gray-200 rounded">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

/**
 * Bundle analysis utilities
 */
export const BundleAnalyzer = {
  // Measure component load times
  measureComponentLoad: (componentName) => {
    const startTime = performance.now();
    
    return {
      finish: () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
        }
        
        return loadTime;
      }
    };
  },
  
  // Track bundle sizes (dev only)
  trackBundleSize: (bundleName, size) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 ${bundleName} bundle size: ${size} bytes`);
    }
  },
  
  // Monitor memory usage
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return null;
  }
};

/**
 * Resource preloading utilities
 */
export const ResourcePreloader = {
  // Preload critical routes
  preloadRoute: (routePath) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = routePath;
      document.head.appendChild(link);
    }
  },
  
  // Preload components on hover
  preloadOnHover: (importFunction, delay = 100) => {
    let timeoutId;
    
    return {
      onMouseEnter: () => {
        timeoutId = setTimeout(() => {
          importFunction();
        }, delay);
      },
      onMouseLeave: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };
  },
  
  // Preload critical resources
  preloadCriticalResources: () => {
    const criticalResources = [
      { href: '/api/auth/session', as: 'fetch' },
      { href: '/api/user/profile', as: 'fetch' }
      // Inter font is handled by next/font/google - no need for manual preload
    ];
    
    criticalResources.forEach(resource => {
      if (typeof window !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        if (resource.type) link.type = resource.type;
        if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
        document.head.appendChild(link);
      }
    });
  }
};

/**
 * Code splitting wrapper component
 */
export const CodeSplitBoundary = ({ 
  children, 
  fallback = <LoadingSpinner />, 
  chunkName,
  onLoad,
  onError 
}) => {
  useEffect(() => {
    if (chunkName && onLoad) {
      const timer = BundleAnalyzer.measureComponentLoad(chunkName);
      
      return () => {
        const loadTime = timer.finish();
        onLoad(loadTime);
      };
    }
  }, [chunkName, onLoad]);

  return (
    <Suspense 
      fallback={fallback}
      onError={onError}
    >
      {children}
    </Suspense>
  );
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitoring = (componentName) => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes(componentName)) {
          console.log(`⚡ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, [componentName]);
  
  const markStart = (operationName) => {
    performance.mark(`${componentName}-${operationName}-start`);
  };
  
  const markEnd = (operationName) => {
    const startMark = `${componentName}-${operationName}-start`;
    const endMark = `${componentName}-${operationName}-end`;
    const measureName = `${componentName}-${operationName}`;
    
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
  };
  
  return { markStart, markEnd };
};

export default {
  RouteComponents,
  FeatureComponents,
  ThirdPartyComponents,
  createLazyComponent,
  createDynamicComponent,
  BundleAnalyzer,
  ResourcePreloader,
  CodeSplitBoundary,
  usePerformanceMonitoring
};