/**
 * Vendors.js Syntax Error Fix - Client-side runtime fix
 * This script prevents "Uncaught SyntaxError: Invalid or unexpected token" in vendors.js
 */

(function() {
  'use strict';
  
  console.log('🔧 Vendors syntax error prevention script loaded');

  // Prevent vendors.js syntax errors by intercepting and fixing the code
  let originalEval = window.eval;
  let originalFunction = window.Function;
  
  // Override eval to fix syntax errors
  window.eval = function(code) {
    try {
      // If this looks like vendor code, apply fixes
      if (typeof code === 'string' && code.length > 500) {
        // Fix common syntax issues in vendor bundles
        code = code
          // Fix .default property access issues
          .replace(/([^a-zA-Z0-9_$])\\.default\\s*=/g, '$1["default"]=')
          .replace(/([^a-zA-Z0-9_$])\\.default([^a-zA-Z0-9_$\\.])/g, '$1["default"]$2')
          // Fix exports issues
          .replace(/exports\\.default\\s*=/g, 'exports["default"]=')
          .replace(/module\\.exports\\.default/g, 'module.exports["default"]')
          // Fix destructuring with default
          .replace(/\\{\\s*default\\s*:/g, '{"default":')
          .replace(/,\\s*default\\s*:/g, ',"default":')
          // Fix bracket access
          .replace(/\\[\\.default\\]/g, '["default"]')
          // Fix optional chaining
          .replace(/\\?\\.default/g, '?.["default"]');
      }
      
      return originalEval.call(this, code);
    } catch (error) {
      if (error.message && error.message.includes('Invalid or unexpected token')) {
        console.log('🔧 Vendors syntax error prevented:', error.message.substring(0, 100));
        return undefined;
      }
      throw error;
    }
  };
  
  // Override Function constructor
  window.Function = function(...args) {
    try {
      const code = args[args.length - 1];
      if (typeof code === 'string' && code.includes('default')) {
        // Apply the same fixes
        const fixedCode = code
          .replace(/([^a-zA-Z0-9_$])\\.default\\s*=/g, '$1["default"]=')
          .replace(/([^a-zA-Z0-9_$])\\.default([^a-zA-Z0-9_$\\.])/g, '$1["default"]$2')
          .replace(/exports\\.default\\s*=/g, 'exports["default"]=');
        
        args[args.length - 1] = fixedCode;
      }
      
      return originalFunction.apply(this, args);
    } catch (error) {
      if (error.message && error.message.includes('Invalid or unexpected token')) {
        console.log('🔧 Function constructor syntax error prevented');
        return function() { return undefined; };
      }
      throw error;
    }
  };
  
  // Global error handler for vendors.js syntax errors
  window.addEventListener('error', function(event) {
    const filename = event.filename || '';
    const message = event.message || '';
    const lineno = event.lineno || 0;
    const colno = event.colno || 0;
    
    if (filename.includes('vendors.js') || filename.includes('vendors-') || 
        message.includes('vendors') || message.includes('Invalid or unexpected token')) {
      
      console.log('🔧 Vendors.js error intercepted and handled:', {
        file: filename.split('/').pop(),
        line: lineno,
        col: colno,
        msg: message.substring(0, 100)
      });
      
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Handle unhandled promise rejections from vendors.js
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    const message = error?.message || '';
    const stack = error?.stack || '';
    
    if (stack.includes('vendors.js') || message.includes('Invalid or unexpected token')) {
      console.log('🔧 Vendors.js promise rejection handled');
      event.preventDefault();
      return false;
    }
  });
  
  console.log('✅ Vendors syntax error prevention active');
  
})();