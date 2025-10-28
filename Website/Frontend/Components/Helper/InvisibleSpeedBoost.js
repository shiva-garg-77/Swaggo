'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useCallback, useRef } from 'react';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';

// Invisible speed boost - no UI changes, just pure performance
class InvisibleSpeedBooster {
  constructor() {
    this.router = null;
    this.preloadedRoutes = new Set();
    this.isNavigating = false;
    this.routesToPreload = ['/home', '/Profile', '/create', '/reel', '/message', '/dashboard'];
    
    // Define unauthenticated routes that should always be prefetched
    this.unauthenticatedRoutes = ['/', '/signup', '/forget-password', '/reset-password'];
  }

  init(router, isAuthenticated) {
    this.router = router;
    this.preloadCriticalRoutes(isAuthenticated);
  }

  // Preload routes invisibly in the background
  async preloadCriticalRoutes(isAuthenticated) {
    if (typeof window === 'undefined' || !this.router) return;
    
    // Use requestIdleCallback for non-blocking preloading
    const preloadInIdle = (route) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => this.preloadRoute(route, isAuthenticated), { timeout: 2000 });
      } else {
        setTimeout(() => this.preloadRoute(route, isAuthenticated), 100);
      }
    };

    this.routesToPreload.forEach(route => {
      // For unauthenticated users, only preload unauthenticated routes
      if (!isAuthenticated && !this.unauthenticatedRoutes.includes(route)) {
        return;
      }
      preloadInIdle(route);
    });
  }

  async preloadRoute(route, isAuthenticated) {
    // For unauthenticated users, only preload unauthenticated routes
    if (!isAuthenticated && !this.unauthenticatedRoutes.includes(route) && !route.startsWith('/reset-password/')) {
      return;
    }
    
    if (this.preloadedRoutes.has(route)) return;
    
    try {
      // Use Next.js built-in prefetch
      if (this.router?.prefetch) {
        await this.router.prefetch(route);
      }
      
      // Also add link prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
      
      this.preloadedRoutes.add(route);
      
      // Clean up after 30 seconds
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 30000);
      
    } catch (error) {
      // Silent fail
    }
  }

  // Fast navigation with minimal overhead
  async fastNavigate(route) {
    if (this.isNavigating || !this.router) return false;
    
    this.isNavigating = true;
    
    try {
      // If route is preloaded, it should be faster
      await this.router.push(route);
      return true;
    } catch (error) {
      return false;
    } finally {
      this.isNavigating = false;
    }
  }

  // Preload on hover (invisible)
  preloadOnHover(route, isAuthenticated) {
    if (!this.preloadedRoutes.has(route)) {
      this.preloadRoute(route, isAuthenticated);
    }
  }
  
  // Reset preloaded routes (useful for auth state changes)
  reset() {
    this.preloadedRoutes.clear();
  }
}

// Global instance
const speedBooster = new InvisibleSpeedBooster();

// Minimal hook that doesn't interfere with existing code
export const useInvisibleSpeedBoost = () => {
  const router = useRouter();
  const { isAuthenticated } = useFixedSecureAuth();
  
  // Ensure router is properly initialized
  if (!router || typeof router.push !== 'function') {
    console.error('Router not properly initialized in InvisibleSpeedBoost');
  }
  const pathname = usePathname();
  const initRef = useRef(false);

  // Initialize once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    // Ensure router is properly initialized before initializing speed booster
    if (router && typeof router.push === 'function') {
      speedBooster.init(router, isAuthenticated);
    } else {
      console.error('Router not properly initialized for speed booster');
    }
  }, [router, isAuthenticated]);

  // Fast navigate function
  const fastNavigate = useCallback(async (route) => {
    const success = await speedBooster.fastNavigate(route);
    if (!success) {
      // Fallback to normal navigation
      if (router && typeof router.push === 'function') {
        router.push(route);
      } else {
        console.error('Router not available for fallback navigation');
        // Use window.location as ultimate fallback
        if (typeof window !== 'undefined') {
          window.location.href = route;
        }
      }
    }
  }, [router]);

  // Preload on hover
  const preloadOnHover = useCallback((route) => {
    speedBooster.preloadOnHover(route, isAuthenticated);
  }, [isAuthenticated]);

  return {
    fastNavigate,
    preloadOnHover,
    isReady: initRef.current
  };
};

// Invisible preloader component (no visual impact)
export const InvisiblePreloader = ({ routes = [] }) => {
  const { isAuthenticated, isLoading } = useFixedSecureAuth();
  
  useEffect(() => {
    if (typeof window === 'undefined' || !routes.length || isLoading) return;
    
    // Preload routes in the background after page load
    const timer = setTimeout(() => {
      routes.forEach(route => {
        // For unauthenticated users, only preload unauthenticated routes
        if (!isAuthenticated && route !== '/' && route !== '/signup' && route !== '/forget-password' && !route.startsWith('/reset-password/')) {
          return;
        }
        speedBooster.preloadRoute(route, isAuthenticated);
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [routes, isAuthenticated, isLoading]);

  return null; // Completely invisible
};

export default {
  useInvisibleSpeedBoost,
  InvisiblePreloader,
};