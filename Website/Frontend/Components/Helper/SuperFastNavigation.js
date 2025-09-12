"use client";
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCacheOptimizer } from './CacheOptimizer';

// Ultra-optimized navigation system for instant route switching
class SuperFastNavigator {
  constructor() {
    this.preloadedRoutes = new Map();
    this.activePreloads = new Set();
    this.routeComponents = new Map();
    this.performanceMetrics = new Map();
    this.navigationQueue = [];
    this.isNavigating = false;
    
    // Priority routes that should be preloaded immediately
    this.priorityRoutes = ['/home', '/Profile', '/reel', '/create', '/message'];
    
    // Route dependencies map (what routes are commonly accessed together)
    this.routeDependencies = {
      '/home': ['/Profile', '/create', '/reel', '/message'],
      '/Profile': ['/home', '/create', '/message'],
      '/create': ['/home', '/Profile'],
      '/reel': ['/home', '/Profile', '/message'],
      '/message': ['/home', '/Profile'],
    };
  }

  // Preload route with component and data
  async preloadRoute(route, priority = 'normal') {
    if (this.preloadedRoutes.has(route) || this.activePreloads.has(route)) {
      return this.preloadedRoutes.get(route);
    }

    this.activePreloads.add(route);
    const startTime = performance.now();

    try {
      // Preload the Next.js route
      const router = window.__NEXT_ROUTER__;
      if (router?.prefetch) {
        await router.prefetch(route);
      }

      // Create link prefetch as fallback
      this.createLinkPrefetch(route);

      // Preload route-specific resources
      await this.preloadRouteResources(route);

      const loadTime = performance.now() - startTime;
      this.performanceMetrics.set(route, {
        preloadTime: loadTime,
        timestamp: Date.now(),
        priority,
      });

      this.preloadedRoutes.set(route, {
        preloaded: true,
        timestamp: Date.now(),
        loadTime,
      });

      console.log(`🚀 Super-preloaded route: ${route} in ${loadTime.toFixed(2)}ms`);
      
      // Preload related routes if this is a priority route
      if (priority === 'high' || this.priorityRoutes.includes(route)) {
        this.preloadRelatedRoutes(route);
      }

      return this.preloadedRoutes.get(route);
    } catch (error) {
      console.warn(`Preload failed for ${route}:`, error);
      return null;
    } finally {
      this.activePreloads.delete(route);
    }
  }

  // Create optimized link prefetch
  createLinkPrefetch(route) {
    const existingLink = document.querySelector(`link[href="${route}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    link.as = 'document';
    document.head.appendChild(link);
  }

  // Preload route-specific resources
  async preloadRouteResources(route) {
    const resourcePromises = [];

    // Preload route-specific API data
    if (route === '/home') {
      resourcePromises.push(this.preloadAPIData('/api/posts?limit=10'));
      resourcePromises.push(this.preloadAPIData('/api/stories'));
    } else if (route === '/Profile') {
      resourcePromises.push(this.preloadAPIData('/api/profile/me'));
      resourcePromises.push(this.preloadAPIData('/api/posts/me'));
    } else if (route === '/reel') {
      resourcePromises.push(this.preloadAPIData('/api/reels?limit=5'));
    } else if (route === '/message') {
      resourcePromises.push(this.preloadAPIData('/api/conversations'));
    }

    // Wait for resource preloading with timeout
    try {
      await Promise.race([
        Promise.allSettled(resourcePromises),
        new Promise(resolve => setTimeout(resolve, 1000)) // 1s timeout
      ]);
    } catch (error) {
      console.warn('Resource preload timeout:', error);
    }
  }

  // Preload API data with caching
  async preloadAPIData(endpoint) {
    try {
      const cacheKey = `preload-${endpoint}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > 300000; // 5 minutes
        if (!isExpired) return data;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        return data;
      }
    } catch (error) {
      console.warn(`API preload failed for ${endpoint}:`, error);
    }
    return null;
  }

  // Preload related routes based on user behavior patterns
  preloadRelatedRoutes(currentRoute) {
    const relatedRoutes = this.routeDependencies[currentRoute] || [];
    relatedRoutes.forEach((route, index) => {
      setTimeout(() => {
        this.preloadRoute(route, 'low');
      }, index * 100); // Stagger preloading
    });
  }

  // Super-fast navigation with instant feedback
  async navigateInstantly(route, router) {
    if (this.isNavigating) {
      this.navigationQueue.push({ route, router });
      return;
    }

    this.isNavigating = true;
    const startTime = performance.now();

    try {
      // Show instant loading feedback
      this.showInstantFeedback(route);

      // Pre-warm the route if not already preloaded
      if (!this.preloadedRoutes.has(route)) {
        await this.preloadRoute(route, 'high');
      }

      // Navigate with optimized timing
      await router.push(route);

      const navigationTime = performance.now() - startTime;
      console.log(`⚡ Super-fast navigation to ${route}: ${navigationTime.toFixed(2)}ms`);

      // Update performance metrics
      this.updatePerformanceMetrics(route, navigationTime);

      // Process queued navigations
      this.processNavigationQueue();

    } catch (error) {
      console.error('Super-fast navigation failed:', error);
    } finally {
      this.isNavigating = false;
      this.hideInstantFeedback();
    }
  }

  // Show instant visual feedback
  showInstantFeedback(route) {
    const feedback = document.createElement('div');
    feedback.id = 'super-fast-nav-feedback';
    feedback.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50 transform transition-all duration-200';
    feedback.innerHTML = `🚀 Loading ${this.getRouteName(route)}...`;
    feedback.style.transform = 'translateX(100%)';
    
    document.body.appendChild(feedback);
    
    // Animate in
    requestAnimationFrame(() => {
      feedback.style.transform = 'translateX(0)';
    });
  }

  // Hide loading feedback
  hideInstantFeedback() {
    const feedback = document.getElementById('super-fast-nav-feedback');
    if (feedback) {
      feedback.style.transform = 'translateX(100%)';
      setTimeout(() => {
        feedback.remove();
      }, 200);
    }
  }

  // Get human-readable route name
  getRouteName(route) {
    const routeNames = {
      '/home': 'Home',
      '/Profile': 'Profile',
      '/reel': 'Reels',
      '/create': 'Create',
      '/message': 'Messages',
    };
    return routeNames[route] || route;
  }

  // Process queued navigations
  processNavigationQueue() {
    if (this.navigationQueue.length > 0) {
      const { route, router } = this.navigationQueue.shift();
      setTimeout(() => this.navigateInstantly(route, router), 50);
    }
  }

  // Update performance metrics
  updatePerformanceMetrics(route, navigationTime) {
    const existing = this.performanceMetrics.get(route) || {};
    this.performanceMetrics.set(route, {
      ...existing,
      lastNavigationTime: navigationTime,
      totalNavigations: (existing.totalNavigations || 0) + 1,
      averageTime: existing.averageTime 
        ? (existing.averageTime + navigationTime) / 2 
        : navigationTime,
    });
  }

  // Get performance report
  getPerformanceReport() {
    const report = {};
    this.performanceMetrics.forEach((metrics, route) => {
      report[route] = {
        ...metrics,
        isPreloaded: this.preloadedRoutes.has(route),
      };
    });
    return report;
  }
}

// Global instance
const superFastNavigator = new SuperFastNavigator();

// React hook for super-fast navigation
export const useSuperFastNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { setCache, getCache } = useCacheOptimizer();
  const initRef = useRef(false);

  // Initialize super-fast navigation on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      
      // Preload priority routes immediately
      const preloadPriorityRoutes = async () => {
        console.log('🚀 Initializing super-fast navigation...');
        
        for (const route of superFastNavigator.priorityRoutes) {
          if (route !== pathname) {
            await superFastNavigator.preloadRoute(route, 'high');
          }
        }
        
        console.log('✅ Super-fast navigation initialized');
      };

      // Start preloading after a short delay
      if (typeof window !== 'undefined') {
        setTimeout(preloadPriorityRoutes, 100);
      }
    }
  }, [pathname]);

  // Smart preloading based on current route
  useEffect(() => {
    const timer = setTimeout(() => {
      superFastNavigator.preloadRelatedRoutes(pathname);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  // Super-fast navigate function
  const navigateInstantly = useCallback(async (route) => {
    await superFastNavigator.navigateInstantly(route, router);
  }, [router]);

  // Preload specific route
  const preloadRoute = useCallback(async (route, priority = 'normal') => {
    return await superFastNavigator.preloadRoute(route, priority);
  }, []);

  // Preload on hover for instant navigation
  const preloadOnHover = useCallback((route) => {
    superFastNavigator.preloadRoute(route, 'high');
  }, []);

  // Get performance metrics
  const getPerformanceReport = useCallback(() => {
    return superFastNavigator.getPerformanceReport();
  }, []);

  // Memoized return value
  return useMemo(() => ({
    navigateInstantly,
    preloadRoute,
    preloadOnHover,
    getPerformanceReport,
    isReady: initRef.current,
  }), [navigateInstantly, preloadRoute, preloadOnHover, getPerformanceReport]);
};

// Component for preloading routes in background
export const SuperFastPreloader = ({ routes = [], enabled = true }) => {
  useEffect(() => {
    if (!enabled || routes.length === 0) return;

    const preloadRoutes = async () => {
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        await superFastNavigator.preloadRoute(route, i < 3 ? 'high' : 'normal');
        
        // Small delay between preloads to avoid overwhelming
        if (i < routes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };

    // Start preloading after component mount
    const timer = setTimeout(preloadRoutes, 200);
    return () => clearTimeout(timer);
  }, [routes, enabled]);

  return null;
};

// Performance monitoring component
export const SuperFastPerformanceMonitor = ({ enabled = false }) => {
  const { getPerformanceReport } = useSuperFastNavigation();

  useEffect(() => {
    if (!enabled) return;

    const logPerformance = () => {
      const report = getPerformanceReport();
      console.log('🔥 Super-Fast Navigation Performance Report:', report);
    };

    // Log performance every 30 seconds in development
    const interval = setInterval(logPerformance, 30000);
    return () => clearInterval(interval);
  }, [enabled, getPerformanceReport]);

  // Keyboard shortcut for performance report (Ctrl+Shift+F)
  useEffect(() => {
    if (!enabled) return;

    const handleKeydown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        const report = getPerformanceReport();
        console.table(report);
        alert('Performance report logged to console!');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [enabled, getPerformanceReport]);

  return null;
};

export default {
  useSuperFastNavigation,
  SuperFastPreloader,
  SuperFastPerformanceMonitor,
  superFastNavigator,
};
