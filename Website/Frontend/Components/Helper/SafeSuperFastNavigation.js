"use client";
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Simple and safe super-fast navigation system
class SafeNavigator {
  constructor() {
    this.preloadedRoutes = new Map();
    this.isNavigating = false;
    this.priorityRoutes = ['/home', '/Profile', '/reel', '/create', '/message'];
  }

  async preloadRoute(route, priority = 'normal') {
    if (typeof window === 'undefined') return;
    if (this.preloadedRoutes.has(route)) return;
    if (!route || typeof route !== 'string') return;

    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      document.head.appendChild(link);
      
      this.preloadedRoutes.set(route, Date.now());
      console.log(`🚀 Preloaded route: ${route}`);
      
      // Clean up after 5 seconds
      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 5000);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }

  async navigateInstantly(route, router) {
    if (this.isNavigating) return;
    if (!route || !router) return;
    
    this.isNavigating = true;
    const startTime = Date.now();

    try {
      // Show instant feedback
      this.showFeedback(route);
      
      // Navigate
      await router.push(route);
      
      const navigationTime = Date.now() - startTime;
      console.log(`⚡ Navigation to ${route}: ${navigationTime}ms`);
    } catch (error) {
      console.error('Navigation failed:', error);
    } finally {
      this.isNavigating = false;
      this.hideFeedback();
    }
  }

  showFeedback(route) {
    if (typeof window === 'undefined') return;
    
    const existing = document.getElementById('safe-nav-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'safe-nav-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #10b981, #3b82f6);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    feedback.textContent = `🚀 Loading...`;
    
    document.body.appendChild(feedback);
  }

  hideFeedback() {
    if (typeof window === 'undefined') return;
    
    const feedback = document.getElementById('safe-nav-feedback');
    if (feedback) {
      feedback.style.opacity = '0';
      feedback.style.transition = 'opacity 0.3s ease';
      setTimeout(() => feedback.remove(), 300);
    }
  }
}

// Global instance
const safeNavigator = new SafeNavigator();

// React hook for safe super-fast navigation
export const useSafeSuperFastNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const initRef = useRef(false);

  // Initialize navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initRef.current) return;
    
    initRef.current = true;
    
    // Preload priority routes
    const preloadRoutes = async () => {
      try {
        console.log('🚀 Initializing safe super-fast navigation...');
        
        for (const route of safeNavigator.priorityRoutes) {
          if (route && route !== pathname) {
            await safeNavigator.preloadRoute(route, 'high');
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          }
        }
        
        console.log('✅ Safe navigation initialized');
      } catch (error) {
        console.warn('Navigation initialization failed:', error);
      }
    };

    setTimeout(preloadRoutes, 1000);
  }, [pathname]);

  // Navigate function with safety checks
  const navigateInstantly = useCallback(async (route) => {
    if (!route || typeof route !== 'string') {
      console.warn('Invalid route:', route);
      return;
    }
    
    try {
      await safeNavigator.navigateInstantly(route, router);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to normal navigation
      router.push(route);
    }
  }, [router]);

  // Preload on hover
  const preloadOnHover = useCallback((route) => {
    if (!route || typeof route !== 'string') return;
    safeNavigator.preloadRoute(route, 'high');
  }, []);

  return useMemo(() => ({
    navigateInstantly,
    preloadOnHover,
    isReady: initRef.current,
  }), [navigateInstantly, preloadOnHover]);
};

// Simple preloader component
export const SafeSuperFastPreloader = ({ routes = [], enabled = true }) => {
  useEffect(() => {
    if (!enabled || !routes || !Array.isArray(routes)) return;
    if (typeof window === 'undefined') return;

    const preloadRoutes = async () => {
      try {
        for (const route of routes) {
          if (route && typeof route === 'string') {
            await safeNavigator.preloadRoute(route);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.warn('Preloader error:', error);
      }
    };

    setTimeout(preloadRoutes, 500);
  }, [routes, enabled]);

  return null;
};

export default {
  useSafeSuperFastNavigation,
  SafeSuperFastPreloader,
  safeNavigator,
};
