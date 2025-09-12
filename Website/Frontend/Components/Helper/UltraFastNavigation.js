'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Ultra-fast navigation system with aggressive preloading
class UltraFastNavigator {
  constructor() {
    this.preloadedRoutes = new Set();
    this.isNavigating = false;
    this.routeCache = new Map();
    this.priorityRoutes = ['/home', '/Profile', '/create', '/reel', '/message', '/dashboard'];
    this.preloadQueue = [];
    this.isProcessingQueue = false;
  }

  // Aggressive route preloading
  async preloadRoute(route, priority = 'normal') {
    if (typeof window === 'undefined') return;
    if (this.preloadedRoutes.has(route)) return;
    if (!route || typeof route !== 'string') return;

    try {
      // Add to cache immediately
      this.routeCache.set(route, { preloaded: true, timestamp: Date.now() });
      this.preloadedRoutes.add(route);

      // Prefetch the route
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      
      // High priority routes get dns-prefetch too
      if (priority === 'high') {
        const dnsLink = document.createElement('link');
        dnsLink.rel = 'dns-prefetch';
        dnsLink.href = window.location.origin;
        document.head.appendChild(dnsLink);
      }

      document.head.appendChild(link);

      // Also try to fetch the page data
      if (window.next && window.next.router && window.next.router.prefetch) {
        window.next.router.prefetch(route);
      }

      console.log(`⚡ Ultra-fast preload: ${route} (${priority})`);
    } catch (error) {
      console.warn('Ultra preload failed:', route, error);
    }
  }

  // Process preload queue
  async processPreloadQueue() {
    if (this.isProcessingQueue || this.preloadQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.preloadQueue.length > 0) {
      const { route, priority } = this.preloadQueue.shift();
      await this.preloadRoute(route, priority);
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    this.isProcessingQueue = false;
  }

  // Add route to preload queue
  queuePreload(route, priority = 'normal') {
    if (!this.preloadedRoutes.has(route)) {
      this.preloadQueue.push({ route, priority });
      this.processPreloadQueue();
    }
  }

  // Instant navigation with visual feedback
  async navigateInstantly(route, router) {
    if (this.isNavigating) return;
    if (!route || !router) return;
    
    this.isNavigating = true;
    const startTime = performance.now();

    try {
      // Immediate visual feedback
      this.showInstantFeedback(route);
      
      // Use router.replace for faster navigation if same origin
      const currentPath = window.location.pathname;
      if (this.isSameOriginNavigation(currentPath, route)) {
        // Push state immediately for instant UI update
        window.history.pushState({}, '', route);
        
        // Then use Next.js router
        await router.push(route);
      } else {
        await router.push(route);
      }
      
      const navigationTime = performance.now() - startTime;
      console.log(`🚀 Ultra-fast navigation to ${route}: ${navigationTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Ultra navigation failed:', error);
      // Fallback
      window.location.href = route;
    } finally {
      this.isNavigating = false;
      setTimeout(() => this.hideFeedback(), 500);
    }
  }

  isSameOriginNavigation(from, to) {
    try {
      const fromUrl = new URL(from, window.location.origin);
      const toUrl = new URL(to, window.location.origin);
      return fromUrl.origin === toUrl.origin;
    } catch {
      return true; // Assume same origin if parsing fails
    }
  }

  showInstantFeedback(route) {
    if (typeof window === 'undefined') return;
    
    // Remove existing feedback
    const existing = document.getElementById('ultra-nav-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'ultra-nav-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6);
      background-size: 300% 300%;
      animation: gradientShift 0.5s ease-in-out;
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    `;
    
    // Add gradient animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes pulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);
    
    feedback.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>
        <span>Lightning Fast Loading...</span>
      </div>
    `;
    
    // Add spin animation
    if (!document.getElementById('ultra-nav-styles')) {
      const spinStyle = document.createElement('style');
      spinStyle.id = 'ultra-nav-styles';
      spinStyle.textContent += `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(spinStyle);
    }
    
    document.body.appendChild(feedback);
    
    // Animate in
    setTimeout(() => {
      if (feedback && feedback.parentNode) {
        feedback.style.animation = 'gradientShift 0.5s ease-in-out, pulse 2s ease-in-out infinite';
      }
    }, 10);
  }

  hideFeedback() {
    if (typeof window === 'undefined') return;
    
    const feedback = document.getElementById('ultra-nav-feedback');
    if (feedback) {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateX(-50%) scale(0.9)';
      feedback.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.remove();
        }
      }, 300);
    }
  }
}

// Global ultra-fast navigator
const ultraNavigator = new UltraFastNavigator();

// Ultra-fast navigation hook
export const useUltraFastNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const initRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize ultra-fast navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initRef.current) return;
    
    initRef.current = true;

    const initializeUltraFast = async () => {
      try {
        console.log('🚀 Initializing ultra-fast navigation system...');
        
        // Preload all priority routes immediately
        const preloadPromises = ultraNavigator.priorityRoutes
          .filter(route => route !== pathname)
          .map((route, index) => {
            return new Promise(resolve => {
              setTimeout(() => {
                ultraNavigator.queuePreload(route, 'high');
                resolve();
              }, index * 100); // Staggered loading
            });
          });

        await Promise.all(preloadPromises);
        
        // Set ready after initialization
        setTimeout(() => {
          setIsReady(true);
          console.log('✅ Ultra-fast navigation ready!');
        }, 1000);

      } catch (error) {
        console.warn('Ultra-fast navigation init failed:', error);
        setIsReady(true); // Still set ready for fallback
      }
    };

    // Start initialization after a short delay
    const timer = setTimeout(initializeUltraFast, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Ultra-fast navigation function
  const navigateUltraFast = useCallback(async (route) => {
    if (!route || typeof route !== 'string') {
      console.warn('Invalid route for ultra-fast navigation:', route);
      return;
    }
    
    if (!isReady) {
      console.log('Ultra-fast navigation not ready, using fallback');
      router.push(route);
      return;
    }

    try {
      await ultraNavigator.navigateInstantly(route, router);
    } catch (error) {
      console.error('Ultra-fast navigation failed:', error);
      // Fallback to normal navigation
      router.push(route);
    }
  }, [router, isReady]);

  // Preload on hover with ultra-fast preloading
  const preloadOnHover = useCallback((route) => {
    if (!route || typeof route !== 'string') return;
    if (!isReady) return;
    
    ultraNavigator.queuePreload(route, 'high');
  }, [isReady]);

  // Preload multiple routes
  const preloadRoutes = useCallback((routes) => {
    if (!Array.isArray(routes) || !isReady) return;
    
    routes.forEach(route => {
      if (route && typeof route === 'string') {
        ultraNavigator.queuePreload(route, 'normal');
      }
    });
  }, [isReady]);

  return {
    navigateUltraFast,
    preloadOnHover,
    preloadRoutes,
    isReady,
    isNavigating: ultraNavigator.isNavigating,
  };
};

// Ultra-fast preloader component
export const UltraFastPreloader = ({ routes = [], enabled = true }) => {
  const { preloadRoutes, isReady } = useUltraFastNavigation();

  useEffect(() => {
    if (!enabled || !routes || !Array.isArray(routes)) return;
    if (!isReady) return;

    // Preload routes when ready
    preloadRoutes(routes);
  }, [routes, enabled, isReady, preloadRoutes]);

  return null;
};

export default {
  useUltraFastNavigation,
  UltraFastPreloader,
  ultraNavigator,
};
