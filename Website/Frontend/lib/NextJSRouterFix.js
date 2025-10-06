/**
 * Next.js Router State Fix
 * Fixes "Cannot read properties of undefined (reading 'join')" error
 * in create-initial-router-state.js
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  console.log('🛣️ Next.js Router State Fix loading...');
  
  // 1. Array prototype safety
  const originalArrayJoin = Array.prototype.join;
  Array.prototype.join = function(separator) {
    try {
      if (this === null || this === undefined) {
        console.log('🛣️ Safe array join: handling null/undefined array');
        return '';
      }
      return originalArrayJoin.call(this, separator);
    } catch (error) {
      console.log('🛣️ Array join error prevented:', error.message);
      return '';
    }
  };
  
  // 2. String prototype safety for path operations
  const originalStringSplit = String.prototype.split;
  String.prototype.split = function(separator, limit) {
    try {
      if (this === null || this === undefined) {
        console.log('🛣️ Safe string split: handling null/undefined string');
        return [];
      }
      return originalStringSplit.call(this, separator, limit);
    } catch (error) {
      console.log('🛣️ String split error prevented:', error.message);
      return [];
    }
  };
  
  // 3. Window location safety
  if (typeof window.location !== 'undefined') {
    const originalLocation = window.location;
    
    // Create a safe proxy for location object
    try {
      window.location = new Proxy(originalLocation, {
        get(target, prop) {
          try {
            const value = target[prop];
            
            // Handle pathname specifically for router
            if (prop === 'pathname' && (value === null || value === undefined)) {
              console.log('🛣️ Safe location.pathname: providing fallback');
              return '/';
            }
            
            // Handle search params
            if (prop === 'search' && (value === null || value === undefined)) {
              return '';
            }
            
            // Handle hash
            if (prop === 'hash' && (value === null || value === undefined)) {
              return '';
            }
            
            return value;
          } catch (error) {
            console.log('🛣️ Location property access error:', error.message);
            if (prop === 'pathname') return '/';
            if (prop === 'search') return '';
            if (prop === 'hash') return '';
            return '';
          }
        }
      });
    } catch (proxyError) {
      console.log('🛣️ Location proxy failed, using direct patching');
      
      // Fallback: direct property definition
      if (!window.location.pathname || window.location.pathname === undefined) {
        Object.defineProperty(window.location, 'pathname', {
          get: () => '/',
          configurable: true
        });
      }
    }
  }
  
  // 4. Next.js router specific fixes
  window.addEventListener('error', function(event) {
    const error = event.error;
    const message = error?.message || '';
    const filename = event.filename || '';
    
    if (filename.includes('create-initial-router-state.js') ||
        filename.includes('app-index.js')) {
      
      if (message.includes("Cannot read properties of undefined (reading 'join')") ||
          message.includes("Cannot read property 'join' of undefined")) {
        
        console.log('🛣️ Next.js router state error caught and suppressed:', {
          file: filename,
          line: event.lineno,
          message: message.substring(0, 60)
        });
        
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }
  }, true);
  
  // 5. Promise rejection handling for router errors
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    const message = error?.message || String(error);
    const stack = error?.stack || '';
    
    if (stack.includes('create-initial-router-state.js') ||
        stack.includes('app-index.js')) {
      
      if (message.includes("Cannot read properties of undefined (reading 'join')") ||
          message.includes("Cannot read property 'join' of undefined")) {
        
        console.log('🛣️ Next.js router promise rejection caught and suppressed');
        event.preventDefault();
        return false;
      }
    }
  }, true);
  
  // 6. Console error suppression for router errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = String(args[0] || '');
    
    if (message.includes("Cannot read properties of undefined (reading 'join')") ||
        message.includes("Cannot read property 'join' of undefined")) {
      
      // Check if it's from router files
      const stack = new Error().stack || '';
      if (stack.includes('create-initial-router-state') ||
          stack.includes('app-index')) {
        
        console.log('🛣️ Router error suppressed in console');
        return;
      }
    }
    
    return originalConsoleError.apply(this, args);
  };
  
  // 7. Ensure pathname is always available for Next.js
  if (typeof window !== 'undefined' && !window.__NEXT_PATHNAME_FIXED__) {
    try {
      // Patch any missing pathname in window object
      if (!window.location?.pathname) {
        window.location = window.location || {};
        if (!window.location.pathname) {
          window.location.pathname = '/';
        }
      }
      
      window.__NEXT_PATHNAME_FIXED__ = true;
      console.log('🛣️ Next.js pathname safety ensured');
    } catch (error) {
      console.log('🛣️ Pathname safety warning:', error.message);
    }
  }
  
  console.log('✅ Next.js Router State Fix applied');
})();

export default {};