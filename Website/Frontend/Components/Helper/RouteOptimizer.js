"use client";
import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { OptimizedLoadingIndicator } from './OptimizedErrorDisplay';

// Enhanced route prefetching utility with performance optimizations
class RoutePrefetcher {
  constructor() {
    this.prefetchedRoutes = new Set();
    this.prefetchTimeout = null;
    this.prefetchPromises = new Map();
    this.priorityRoutes = new Set(['/home', '/Profile', '/reel', '/create', '/message']);
    this.maxConcurrentPrefetch = 2;
    this.currentPrefetchCount = 0;
  }

  async prefetchRoute(route, priority = false) {
    if (this.prefetchedRoutes.has(route) || typeof window === 'undefined') {
      return;
    }

    // Skip if we have too many concurrent prefetch operations
    if (!priority && this.currentPrefetchCount >= this.maxConcurrentPrefetch) {
      console.log(`⏳ Skipping prefetch for ${route} - too many concurrent operations`);
      return;
    }

    // Clear any existing timeout
    if (this.prefetchTimeout) {
      clearTimeout(this.prefetchTimeout);
    }

    // Immediate prefetch for priority routes, debounced for others
    const delay = priority || this.priorityRoutes.has(route) ? 0 : 100;
    
    this.prefetchTimeout = setTimeout(async () => {
      try {
        // Check if we already have a prefetch promise for this route
        if (this.prefetchPromises.has(route)) {
          return await this.prefetchPromises.get(route);
        }

        this.currentPrefetchCount++;
        
        // Create prefetch promise
        const prefetchPromise = this.performPrefetch(route);
        this.prefetchPromises.set(route, prefetchPromise);
        
        await prefetchPromise;
        
        this.prefetchedRoutes.add(route);
        this.prefetchPromises.delete(route);
        console.log(`🚀 Prefetched route: ${route}`);
        
      } catch (err) {
        console.log('Prefetch failed:', route, err);
        this.prefetchPromises.delete(route);
      } finally {
        this.currentPrefetchCount--;
      }
    }, delay);
  }

  async performPrefetch(route) {
    // Try multiple prefetch strategies
    const strategies = [
      () => this.nextjsPrefetch(route),
      () => this.linkPrefetch(route),
      () => this.resourcePrefetch(route)
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        return; // If successful, exit
      } catch (err) {
        continue; // Try next strategy
      }
    }
  }

  async nextjsPrefetch(route) {
    const router = window.__NEXT_ROUTER__;
    if (router && router.prefetch) {
      await router.prefetch(route);
    } else {
      throw new Error('Next.js router not available');
    }
  }

  async linkPrefetch(route) {
    // Create a prefetch link element
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    
    return new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
      
      // Clean up after 5 seconds
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 5000);
    });
  }

  async resourcePrefetch(route) {
    // Use fetch to prefetch the route
    const response = await fetch(route, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    if (!response.ok && response.status !== 0) { // status 0 is ok for no-cors
      throw new Error(`Failed to prefetch: ${response.status}`);
    }
  }

  async prefetchMultiple(routes, priorityRoutes = []) {
    // Prefetch priority routes first
    const priorityPromises = priorityRoutes.map(route => 
      this.prefetchRoute(route, true)
    );
    
    // Wait for priority routes to start
    await Promise.allSettled(priorityPromises);
    
    // Then prefetch remaining routes with staggered timing
    const remainingRoutes = routes.filter(route => !priorityRoutes.includes(route));
    remainingRoutes.forEach((route, index) => {
      setTimeout(() => this.prefetchRoute(route), index * 150);
    });
  }
  
  // Smart prefetch based on user behavior
  smartPrefetch(currentRoute) {
    const routeMap = {
      '/home': ['/Profile', '/create', '/reel'],
      '/Profile': ['/home', '/create'],
      '/create': ['/home', '/Profile'],
      '/reel': ['/home', '/message'],
      '/message': ['/home', '/Profile']
    };
    
    const suggestedRoutes = routeMap[currentRoute] || [];
    suggestedRoutes.forEach(route => this.prefetchRoute(route));
  }
}

// Global instance
const routePrefetcher = new RoutePrefetcher();

// Hook for optimized navigation with performance monitoring
export const useOptimizedNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  
  const navigateWithPreload = useCallback(async (route) => {
    const startTime = performance.now();
    
    // Show loading indicator immediately
    setShowLoadingIndicator(true);

    try {
      // Prefetch the route if not already prefetched
      await routePrefetcher.prefetchRoute(route, true);
      
      // Navigate to route
      await router.push(route);
      
      const endTime = performance.now();
      console.log(`⚡ Navigation to ${route} took ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (err) {
      console.error('Navigation error:', err);
    } finally {
      // Remove loading indicator
      setShowLoadingIndicator(false);
    }
  }, [router]);

  const prefetchRoute = useCallback((route, priority = false) => {
    routePrefetcher.prefetchRoute(route, priority);
  }, []);

  const prefetchMainRoutes = useCallback(async () => {
    const mainRoutes = ['/home', '/Profile', '/create', '/reel', '/message'];
    const priorityRoutes = ['/home', '/Profile']; // Most commonly accessed
    await routePrefetcher.prefetchMultiple(mainRoutes, priorityRoutes);
  }, []);

  const smartPrefetch = useCallback(() => {
    routePrefetcher.smartPrefetch(pathname);
  }, [pathname]);

  // Auto smart prefetch on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      smartPrefetch();
    }, 1000); // Delay to avoid interfering with current page load
    
    return () => clearTimeout(timer);
  }, [pathname, smartPrefetch]);

  return {
    navigateWithPreload,
    prefetchRoute,
    prefetchMainRoutes,
    smartPrefetch
  };
};

// Enhanced component to automatically prefetch routes with connection awareness
export const RoutePreloader = ({ routes = [], priority = [], delay = 2000 }) => {
  useEffect(() => {
    // Check connection quality
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    if (isSlowConnection) {
      console.log('⚠️ Slow connection detected, skipping route prefetch');
      return;
    }
    
    const timer = setTimeout(async () => {
      if (routes.length > 0) {
        await routePrefetcher.prefetchMultiple(routes, priority);
      } else {
        // Default prefetch main routes
        const mainRoutes = ['/home', '/Profile', '/create', '/reel', '/message'];
        const priorityRoutes = ['/home', '/Profile'];
        await routePrefetcher.prefetchMultiple(mainRoutes, priorityRoutes);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [routes, priority, delay]);

  return null;
};

// Enhanced loading wrapper for route transitions
export const RouteTransitionWrapper = ({ children, isLoading }) => {
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  
  if (isLoading || showLoadingIndicator) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
        {showLoadingIndicator && <OptimizedLoadingIndicator />}
      </>
    );
  }

  return children;
};

export default {
  useOptimizedNavigation,
  RoutePreloader,
  RouteTransitionWrapper
};
