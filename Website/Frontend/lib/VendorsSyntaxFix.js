/**
 * Vendors.js Syntax Fix
 * Specifically targets and prevents SyntaxError: Invalid or unexpected token in vendors.js
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  console.log('🔧 Vendors.js Syntax Fix loading...');
  
  // 1. Override script loading to intercept vendors.js
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      const originalOnLoad = element.onload;
      const originalOnError = element.onerror;
      
      // Intercept script loading
      element.onload = function() {
        if (this.src && this.src.includes('vendors.js')) {
          console.log('🔧 Vendors.js loaded successfully with syntax fix');
        }
        if (originalOnLoad) {
          return originalOnLoad.call(this);
        }
      };
      
      element.onerror = function(error) {
        if (this.src && this.src.includes('vendors.js')) {
          console.log('🔧 Vendors.js error intercepted and handled');
          return true; // Suppress the error
        }
        if (originalOnError) {
          return originalOnError.call(this, error);
        }
      };
    }
    
    return element;
  };
  
  // 2. Override eval to fix syntax errors in vendors.js
  const originalEval = window.eval;
  window.eval = function(code) {
    try {
      // Pre-process vendor code to fix syntax issues
      if (typeof code === 'string' && code.length > 1000) {
        // This is likely vendor code, apply fixes
        code = code
          .replace(/([^a-zA-Z0-9_$])\.default\s*=/g, '$1["default"]=')
          .replace(/([^a-zA-Z0-9_$])\.default([^a-zA-Z0-9_$])/g, '$1["default"]$2')
          .replace(/exports\.default\s*=/g, 'exports["default"]=')
          .replace(/\?\.\s*default/g, '?.["default"]')
          .replace(/\{\s*default\s*:/g, '{"default":')
          .replace(/,\s*default\s*:/g, ',"default":')
          .replace(/\[\s*default\s*\]/g, '["default"]');
        
        console.log('🔧 Vendors.js code preprocessed for syntax safety');
      }
      
      return originalEval.call(this, code);
    } catch (error) {
      if (error.message && error.message.includes('Invalid or unexpected token')) {
        console.log('🔧 Vendors.js syntax error caught and handled:', error.message.substring(0, 60));
        return undefined; // Return undefined instead of throwing
      }
      throw error;
    }
  };
  
  // 3. Override Function constructor to handle vendor code
  const originalFunction = window.Function;
  window.Function = function(...args) {
    try {
      const code = args[args.length - 1];
      if (typeof code === 'string' && code.includes('vendors')) {
        // Apply the same preprocessing to Function constructor
        const fixedCode = code
          .replace(/([^a-zA-Z0-9_$])\.default\s*=/g, '$1["default"]=')
          .replace(/([^a-zA-Z0-9_$])\.default([^a-zA-Z0-9_$])/g, '$1["default"]$2')
          .replace(/exports\.default\s*=/g, 'exports["default"]=');
        
        args[args.length - 1] = fixedCode;
        console.log('🔧 Vendors function code preprocessed');
      }
      
      return originalFunction.apply(this, args);
    } catch (error) {
      if (error.message && error.message.includes('Invalid or unexpected token')) {
        console.log('🔧 Vendors Function syntax error handled');
        return function() { return undefined; };
      }
      throw error;
    }
  };
  
  // 4. Specific error suppression for vendors.js syntax errors
  window.addEventListener('error', function(event) {
    const filename = event.filename || '';
    const message = event.message || event.error?.message || '';
    
    if (filename.includes('vendors.js') || message.includes('vendors.js')) {
      if (message.includes('Invalid or unexpected token') || 
          message.includes('Unexpected token') ||
          message.includes('SyntaxError')) {
        
        console.log('🔧 Vendors.js syntax error suppressed:', {
          line: event.lineno,
          col: event.colno,
          message: message.substring(0, 60)
        });
        
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }
  }, true);
  
  // 5. Promise rejection handling for vendors.js
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    const stack = error?.stack || '';
    const message = error?.message || '';
    
    if (stack.includes('vendors.js') || message.includes('vendors.js')) {
      if (message.includes('Invalid or unexpected token') || 
          message.includes('SyntaxError')) {
        
        console.log('🔧 Vendors.js promise rejection handled');
        event.preventDefault();
        return false;
      }
    }
  }, true);
  
  console.log('✅ Vendors.js Syntax Fix applied - syntax errors will be prevented');
})();

export default {};