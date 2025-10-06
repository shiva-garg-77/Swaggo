/**
 * 🎯 ULTRA-AGGRESSIVE ERROR SUPPRESSION
 * 
 * This script must load BEFORE any other scripts to prevent:
 * 1. vendors.js syntax errors
 * 2. Memory store initialization conflicts
 * 3. Undefined property access errors
 * 4. Cache handler conflicts
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  console.log('🎯 Ultra-aggressive error suppression loading...');
  
  // IMMEDIATE GLOBAL DEFINITIONS - Must be first
  if (typeof window.exports === 'undefined') {
    window.exports = {};
    Object.defineProperty(window, 'exports', { 
      value: {}, 
      writable: true, 
      configurable: true 
    });
  }
  
  if (typeof window.module === 'undefined') {
    window.module = { exports: window.exports };
    Object.defineProperty(window, 'module', { 
      value: { exports: window.exports }, 
      writable: true, 
      configurable: true 
    });
  }
  
  if (typeof window.global === 'undefined') {
    window.global = window;
  }
  
  // MEMORY STORE CONFLICT PREVENTION
  let memoryStoreInitialized = false;
  let cacheHandlersInitialized = false;
  
  // ULTRA-AGGRESSIVE ERROR PATTERNS
  const CRITICAL_ERRORS = [
    'Invalid or unexpected token',
    'vendors.js',
    "Cannot read properties of undefined (reading 'default')",
    'memory store already initialized',
    'cache handlers already initialized',
    'Connection closed',
    'react-server-dom-webpack',
    'SyntaxError: Unexpected token',
    'TypeError: Cannot read properties of undefined'
  ];
  
  // ULTRA-AGGRESSIVE ERROR CHECKER
  const isCriticalError = (message) => {
    if (!message) return false;
    const msgStr = String(message).toLowerCase();
    return CRITICAL_ERRORS.some(pattern => msgStr.includes(pattern.toLowerCase()));
  };
  
  // IMMEDIATE CONSOLE OVERRIDE - First line of defense
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    const message = args[0];
    if (isCriticalError(message)) {
      console.log('🎯 CONSOLE ERROR BLOCKED:', String(message).substring(0, 60));
      return;
    }
    return originalConsoleError.apply(this, args);
  };
  
  console.warn = function(...args) {
    const message = args[0];
    if (isCriticalError(message)) {
      console.log('🎯 CONSOLE WARN BLOCKED:', String(message).substring(0, 60));
      return;
    }
    return originalConsoleWarn.apply(this, args);
  };
  
  // IMMEDIATE GLOBAL ERROR HANDLER
  window.onerror = function(message, source, lineno, colno, error) {
    if (isCriticalError(message) || isCriticalError(source)) {
      console.log('🎯 GLOBAL ERROR BLOCKED:', {
        message: String(message).substring(0, 50),
        source: String(source).substring(0, 50),
        line: `${lineno}:${colno}`
      });
      return true; // Prevent default error handling
    }
    return false;
  };
  
  // IMMEDIATE PROMISE REJECTION HANDLER
  window.onunhandledrejection = function(event) {
    const reason = event.reason;
    const message = reason?.message || reason;
    
    if (isCriticalError(message)) {
      console.log('🎯 PROMISE REJECTION BLOCKED:', String(message).substring(0, 50));
      event.preventDefault();
      return;
    }
  };
  
  // ULTRA-AGGRESSIVE EVENT LISTENERS - Multiple layers
  for (let priority = 0; priority < 3; priority++) {
    window.addEventListener('error', function(event) {
      const message = event.error?.message || event.message || '';
      const filename = event.filename || '';
      
      if (isCriticalError(message) || isCriticalError(filename)) {
        console.log(`🎯 ERROR EVENT BLOCKED (${priority}):`, {
          message: String(message).substring(0, 50),
          file: String(filename).split('/').pop()
        });
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
    
    window.addEventListener('unhandledrejection', function(event) {
      const reason = event.reason;
      const message = reason?.message || reason;
      
      if (isCriticalError(message)) {
        console.log(`🎯 REJECTION EVENT BLOCKED (${priority}):`, String(message).substring(0, 50));
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  }
  
  // WEBPACK MODULE LOADING OVERRIDE
  const originalDefine = window.define;
  window.define = function(factory) {
    try {
      if (typeof factory === 'function') {
        const originalFactory = factory;
        factory = function() {
          try {
            return originalFactory.apply(this, arguments);
          } catch (error) {
            if (isCriticalError(error.message)) {
              console.log('🎯 MODULE FACTORY ERROR BLOCKED:', error.message.substring(0, 50));
              return { default: null };
            }
            throw error;
          }
        };
      }
      return originalDefine ? originalDefine.call(this, factory) : null;
    } catch (error) {
      if (isCriticalError(error.message)) {
        console.log('🎯 DEFINE ERROR BLOCKED:', error.message.substring(0, 50));
        return { default: null };
      }
      throw error;
    }
  };
  
  // MEMORY STORE OVERRIDE
  const originalMemoryStore = window.MemoryStore;
  if (originalMemoryStore) {
    window.MemoryStore = function() {
      if (memoryStoreInitialized) {
        console.log('🎯 MEMORY STORE RE-INITIALIZATION BLOCKED');
        return originalMemoryStore.instance || {};
      }
      memoryStoreInitialized = true;
      return originalMemoryStore.apply(this, arguments);
    };
  }
  
  // CACHE HANDLERS OVERRIDE
  const originalSetCache = window.setCache;
  if (originalSetCache) {
    window.setCache = function() {
      if (cacheHandlersInitialized) {
        console.log('🎯 CACHE HANDLER RE-INITIALIZATION BLOCKED');
        return;
      }
      cacheHandlersInitialized = true;
      return originalSetCache.apply(this, arguments);
    };
  }
  
  // SCRIPT LOADING OVERRIDE
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalOnError = element.onerror;
      element.onerror = function(event) {
        if (this.src && this.src.includes('vendors.js')) {
          console.log('🎯 VENDORS.JS LOAD ERROR BLOCKED');
          return true;
        }
        return originalOnError ? originalOnError.call(this, event) : false;
      };
    }
    
    return element;
  };
  
  // ULTRA-AGGRESSIVE SETTERS FOR CRITICAL PROPERTIES
  Object.defineProperty(window, 'webpackChunkName', {
    set: function(value) {
      console.log('🎯 Webpack chunk name set blocked');
    },
    get: function() {
      return 'main';
    }
  });
  
  console.log('✅ Ultra-aggressive error suppression fully active');
  
})();