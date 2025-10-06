/**
 * Ultimate Exports Polyfill - Fixes all "exports is not defined" errors
 * Enhanced version targeting vendors.js and all compiled modules
 */

(function() {
  'use strict';
  
  console.log('🏁 Ultimate exports polyfill loading...');
  
  // Function to safely define exports/module with error handling
  function defineGlobalExports(target, context) {
    if (!target) return;
    
    try {
      // Use Object.defineProperty for better compatibility
      if (typeof target.exports === 'undefined') {
        try {
          Object.defineProperty(target, 'exports', {
            value: {},
            writable: true,
            enumerable: false,
            configurable: true
          });
        } catch (e) {
          target.exports = {};
        }
      }
      
      if (typeof target.module === 'undefined') {
        const moduleObj = {
          exports: target.exports,
          id: context + '-module',
          loaded: true,
          parent: null,
          children: []
        };
        
        try {
          Object.defineProperty(target, 'module', {
            value: moduleObj,
            writable: true,
            enumerable: false,
            configurable: true
          });
        } catch (e) {
          target.module = moduleObj;
        }
      }
      
      // Additional Node.js compatibility
      if (typeof target.require === 'undefined') {
        target.require = function(id) {
          console.log(`🔧 Mock require called for: ${id}`);
          return {};
        };
      }
      
      if (typeof target.__dirname === 'undefined') {
        target.__dirname = '/';
      }
      
      if (typeof target.__filename === 'undefined') {
        target.__filename = '/index.js';
      }
      
      console.log(`✅ Exports defined for ${context}`);
    } catch (error) {
      console.warn(`⚠️  Failed to define exports for ${context}:`, error.message);
    }
  }
  
  // Apply to all possible global contexts
  if (typeof globalThis !== 'undefined') {
    defineGlobalExports(globalThis, 'globalThis');
  }
  
  // Safe global access
  (function() {
    try {
      if (typeof global !== 'undefined') {
        defineGlobalExports(global, 'global');
      }
    } catch (e) {
      // global not available, skip
    }
  })();
  
  if (typeof window !== 'undefined') {
    defineGlobalExports(window, 'window');
    
    // Additional window-specific fixes
    if (typeof window.global === 'undefined') {
      window.global = window;
    }
    
    if (typeof window.self === 'undefined') {
      window.self = window;
    }
    
    // Override script execution to handle vendors.js
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      if (tagName.toLowerCase() === 'script') {
        const originalSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
        
        Object.defineProperty(element, 'src', {
          get: function() {
            return originalSrc.get.call(this);
          },
          set: function(value) {
            if (value && value.includes('vendors.js')) {
              console.log('🔧 Vendors.js script intercepted - applying exports fix');
              
              // Ensure exports are available before vendors.js loads
              if (typeof window.exports === 'undefined') {
                window.exports = {};
              }
              if (typeof window.module === 'undefined') {
                window.module = { exports: window.exports };
              }
            }
            return originalSrc.set.call(this, value);
          },
          configurable: true
        });
      }
      
      return element;
    };
  }
  
  if (typeof self !== 'undefined' && typeof window === 'undefined') {
    defineGlobalExports(self, 'self');
  }
  
  // Process environment fixes
  if (typeof process !== 'undefined') {
    if (typeof process.browser === 'undefined') {
      process.browser = typeof window !== 'undefined';
    }
  }
  
  console.log('✅ Ultimate exports polyfill applied to all contexts');
})();

export default {};
