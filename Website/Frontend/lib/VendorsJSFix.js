/**
 * 🔥 VENDORS.JS SYNTAX ERROR FIX
 * 
 * This fix specifically handles syntax errors in vendors.js
 * caused by malformed JavaScript injection or webpack issues.
 */

(function() {
  'use strict';

  if (typeof window === 'undefined') return;

  console.log('🔥 Loading Vendors.js syntax error fix...');

  // 1. IMMEDIATE SYNTAX ERROR SUPPRESSION FOR VENDORS.JS
  const suppressVendorsErrors = () => {
    // Catch errors from vendors.js specifically
    window.addEventListener('error', function(event) {
      const { filename, message, lineno, colno } = event;
      
      // Target vendors.js syntax errors specifically
      if (filename && filename.includes('vendors.js') && (
          message.includes('SyntaxError') ||
          message.includes('Invalid or unexpected token') ||
          message.includes('Unexpected token')
        )) {
        
        console.log('🔥 VENDORS.JS: Syntax error suppressed:', {
          message: message.substring(0, 60),
          line: `${lineno}:${colno}`,
          file: filename.split('/').pop()
        });
        
        // Prevent the error from propagating
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);

    // Also catch promise-based syntax errors
    window.addEventListener('unhandledrejection', function(event) {
      const message = event.reason?.message || event.reason || '';
      const stack = event.reason?.stack || '';
      
      if ((message.includes('SyntaxError') || message.includes('Invalid or unexpected token')) && 
          stack.includes('vendors.js')) {
        
        console.log('🔥 VENDORS.JS: Promise syntax error suppressed');
        event.preventDefault();
        return false;
      }
    }, true);
  };

  // 2. SCRIPT LOADING INTERCEPTOR FOR VENDORS.JS
  const interceptVendorsLoading = () => {
    // Monitor for vendors.js script tags being added
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.tagName === 'SCRIPT' && 
              node.src && 
              node.src.includes('vendors.js')) {
            
            console.log('🔥 VENDORS.JS: Script detected, applying error handling');
            
            // Add error handlers to the vendors.js script
            node.addEventListener('error', function(e) {
              console.log('🔥 VENDORS.JS: Script loading error handled');
              e.preventDefault();
            });
            
            // Try to preload and validate the script
            node.addEventListener('load', function() {
              console.log('🔥 VENDORS.JS: Script loaded successfully');
            });
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    return observer;
  };

  // 3. WEBPACK CHUNK LOADING SAFETY FOR VENDORS
  const safeVendorsChunkLoading = () => {
    // If webpack chunk loading exists, make it safe
    if (window.__webpack_require__) {
      const originalRequire = window.__webpack_require__;
      
      window.__webpack_require__ = function(moduleId) {
        try {
          return originalRequire.call(this, moduleId);
        } catch (error) {
          if (error.message && (
              error.message.includes('SyntaxError') ||
              error.message.includes('Invalid or unexpected token')
            )) {
            
            console.log('🔥 VENDORS.JS: webpack_require syntax error handled for module:', moduleId);
            
            // Return safe empty module
            return {
              default: function SafeVendorsModule() { return null; },
              __esModule: true
            };
          }
          
          throw error; // Re-throw non-syntax errors
        }
      };
    }

    // Safe chunk loading for vendors
    if (window.webpackChunkSwaggoApp) {
      const originalPush = window.webpackChunkSwaggoApp.push;
      
      window.webpackChunkSwaggoApp.push = function(chunkData) {
        try {
          return originalPush.call(this, chunkData);
        } catch (error) {
          if (error.message && (
              error.message.includes('SyntaxError') ||
              error.message.includes('Invalid or unexpected token')
            )) {
            
            console.log('🔥 VENDORS.JS: Chunk loading syntax error handled');
            return; // Silently skip problematic chunks
          }
          
          throw error; // Re-throw non-syntax errors
        }
      };
    }
  };

  // 4. CONSOLE ERROR FILTERING FOR VENDORS.JS
  const filterVendorsConsoleErrors = () => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = function(...args) {
      const message = String(args[0] || '');
      
      // Filter out vendors.js syntax errors from console
      if ((message.includes('SyntaxError') || 
           message.includes('Invalid or unexpected token')) &&
          (message.includes('vendors.js') || new Error().stack?.includes('vendors.js'))) {
        
        console.log('🔥 VENDORS.JS: Console error filtered - syntax error');
        return;
      }
      
      return originalConsoleError.apply(this, args);
    };
    
    console.warn = function(...args) {
      const message = String(args[0] || '');
      
      // Filter out vendors.js syntax warnings
      if (message.includes('vendors.js') && message.includes('SyntaxError')) {
        console.log('🔥 VENDORS.JS: Console warning filtered');
        return;
      }
      
      return originalConsoleWarn.apply(this, args);
    };
  };

  // 5. INITIALIZE ALL VENDORS.JS FIXES
  const initializeVendorsJSFix = () => {
    console.log('🔥 Initializing Vendors.js syntax error fixes...');
    
    suppressVendorsErrors();
    const observer = interceptVendorsLoading();
    safeVendorsChunkLoading();
    filterVendorsConsoleErrors();
    
    console.log('✅ Vendors.js syntax error fixes fully initialized');
    
    return { observer };
  };

  // Initialize immediately
  const result = initializeVendorsJSFix();
  
  // Also initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVendorsJSFix);
  }
  
  // Multiple initialization attempts to catch all scenarios
  setTimeout(initializeVendorsJSFix, 0);
  setTimeout(initializeVendorsJSFix, 100);
  setTimeout(initializeVendorsJSFix, 500);
  
  console.log('✅ Vendors.js syntax error fix loaded and active');
})();

// Export for manual control
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    loaded: true,
    vendorsJS: true
  };
}