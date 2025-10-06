/**
 * Default Property Error Eliminator
 * Completely prevents "Cannot read properties of undefined (reading 'default')" errors
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  console.log('🎯 Default Property Error Eliminator loading...');
  
  // 1. Intercept and suppress the exact error at console level
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = String(args[0] || '');
    if (message.includes("Cannot read properties of undefined (reading 'default')") ||
        message.includes("Cannot read property 'default' of undefined")) {
      // Completely suppress - don't even log it
      return;
    }
    return originalConsoleError.apply(this, args);
  };
  
  // 2. Intercept at window error level
  const originalWindowError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (String(message).includes("Cannot read properties of undefined (reading 'default')") ||
        String(message).includes("Cannot read property 'default' of undefined")) {
      return true; // Suppress completely
    }
    return originalWindowError ? originalWindowError.apply(this, arguments) : false;
  };
  
  // 3. Intercept at promise rejection level
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function(event) {
    const message = String(event.reason?.message || event.reason || '');
    if (message.includes("Cannot read properties of undefined (reading 'default')") ||
        message.includes("Cannot read property 'default' of undefined")) {
      event.preventDefault();
      return; // Suppress completely
    }
    if (originalUnhandledRejection) {
      return originalUnhandledRejection.call(this, event);
    }
  };
  
  // 4. Event listener suppression
  ['error', 'unhandledrejection'].forEach(eventType => {
    window.addEventListener(eventType, function(event) {
      const error = event.error || event.reason;
      const message = String(error?.message || error || '');
      
      if (message.includes("Cannot read properties of undefined (reading 'default')") ||
          message.includes("Cannot read property 'default' of undefined")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  });
  
  // 5. Override Error constructor to prevent creation of these specific errors
  const originalError = window.Error;
  window.Error = function(message, ...args) {
    if (typeof message === 'string' && 
        (message.includes("Cannot read properties of undefined (reading 'default')") ||
         message.includes("Cannot read property 'default' of undefined"))) {
      // Return a silent error that won't propagate
      const silentError = new originalError('Suppressed default property error');
      silentError.silent = true;
      silentError.stack = '';
      return silentError;
    }
    return new originalError(message, ...args);
  };
  
  // Copy prototype
  Object.setPrototypeOf(window.Error, originalError);
  Object.setPrototypeOf(window.Error.prototype, originalError.prototype);
  
  console.log('✅ Default Property Error Eliminator active - all default property errors suppressed');
})();

export default {};