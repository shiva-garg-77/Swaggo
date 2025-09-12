'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useCallback, useRef } from 'react';

// Invisible speed boost - no UI changes, just pure performance
class InvisibleSpeedBooster {
  constructor() {
    this.router = null;
    this.preloadedRoutes = new Set();
    this.isNavigating = false;
    this.routesToPreload = ['/home', '/Profile', '/create', '/reel', '/message', '/dashboard'];
  }

  init(router) {
    this.router = router;
    this.preloadCriticalRoutes();
  }

  // Preload routes invisibly in the background
  async preloadCriticalRoutes() {
    if (typeof window === 'undefined' || !this.router) return;
    
    // Use requestIdleCallback for non-blocking preloading
    const preloadInIdle = (route) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => this.preloadRoute(route), { timeout: 2000 });
      } else {
        setTimeout(() => this.preloadRoute(route), 100);
      }
    };

    this.routesToPreload.forEach(route => preloadInIdle(route));
  }

  async preloadRoute(route) {
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
  preloadOnHover(route) {
    if (!this.preloadedRoutes.has(route)) {
      this.preloadRoute(route);
    }
  }
}

// Global instance
const speedBooster = new InvisibleSpeedBooster();

// Minimal hook that doesn't interfere with existing code
export const useInvisibleSpeedBoost = () => {
  const router = useRouter();
  const pathname = usePathname();
  const initRef = useRef(false);

  // Initialize once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    speedBooster.init(router);
  }, [router]);

  // Fast navigate function
  const fastNavigate = useCallback(async (route) => {
    const success = await speedBooster.fastNavigate(route);
    if (!success) {
      // Fallback to normal navigation
      router.push(route);
    }
  }, [router]);

  // Preload on hover
  const preloadOnHover = useCallback((route) => {
    speedBooster.preloadOnHover(route);
  }, []);

  return {
    fastNavigate,
    preloadOnHover,
    isReady: initRef.current
  };
};

// Invisible preloader component (no visual impact)
export const InvisiblePreloader = ({ routes = [] }) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !routes.length) return;
    
    // Preload routes in the background after page load
    const timer = setTimeout(() => {
      routes.forEach(route => speedBooster.preloadRoute(route));
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [routes]);

  return null; // Completely invisible
};

export default {
  useInvisibleSpeedBoost,
  InvisiblePreloader,
};
