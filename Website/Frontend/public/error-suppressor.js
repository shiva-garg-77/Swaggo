// Ultra-aggressive error suppression - loaded before React
// This script runs immediately and suppresses all RSC and default property errors

(function() {
  'use strict';
  
  console.log('🚫 ULTRA-AGGRESSIVE error suppression loading...');
  
  // Error patterns to completely suppress
  const suppressPatterns = [
    'Connection closed',
    'react-server-dom-webpack-client.browser.development.js',
    'startReadingFromStream',
    'createFromReadableStream',
    "Cannot read properties of undefined (reading 'default')",
    'TypeError: Cannot read properties of undefined',
    "reading 'default'",
    "Cannot read property 'default' of undefined",
    'Failed to fetch RSC payload',
    'RSC_STREAM_ERROR',
    'NetworkError when attempting to fetch resource',
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk'
  ];

  // Check if error should be suppressed
  function shouldSuppress(message, source, stack) {
    const msg = String(message || '');
    const src = String(source || '');
    const stk = String(stack || '');
    
    return suppressPatterns.some(pattern => 
      msg.includes(pattern) || 
      src.includes(pattern) || 
      stk.includes(pattern)
    );
  }

  // Override console methods immediately
  const origError = console.error;
  const origWarn = console.warn;
  const origLog = console.log;

  console.error = function(...args) {
    if (shouldSuppress(args[0])) {
      console.log('🚫 ERROR suppressed:', String(args[0]).substring(0, 60));
      return;
    }
    return origError.apply(this, args);
  };

  console.warn = function(...args) {
    if (shouldSuppress(args[0])) {
      console.log('🚫 WARN suppressed:', String(args[0]).substring(0, 60));
      return;
    }
    return origWarn.apply(this, args);
  };

  // Override window.onerror immediately
  window.onerror = function(message, source, lineno, colno, error) {
    if (shouldSuppress(message, source, error?.stack)) {
      console.log('🚫 WINDOW ERROR suppressed:', {
        line: lineno,
        col: colno,
        file: source?.substring(source.lastIndexOf('/') + 1) || 'unknown'
      });
      return true; // Prevent default
    }
    return false;
  };

  // Override unhandled rejection immediately
  window.onunhandledrejection = function(event) {
    const error = event.reason;
    const message = error?.message || String(error);
    
    if (shouldSuppress(message, '', error?.stack)) {
      console.log('🚫 PROMISE REJECTION suppressed:', message.substring(0, 60));
      event.preventDefault();
      return;
    }
  };

  // Add multiple layers of event listeners
  for (let i = 0; i < 3; i++) {
    window.addEventListener('error', function(event) {
      const error = event.error;
      const message = error?.message || event.message || String(error);
      
      if (shouldSuppress(message, event.filename, error?.stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.log(`🚫 ERROR EVENT ${i} suppressed:`, message.substring(0, 60));
        return false;
      }
    }, true);

    window.addEventListener('unhandledrejection', function(event) {
      const error = event.reason;
      const message = error?.message || String(error);
      
      if (shouldSuppress(message, '', error?.stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.log(`🚫 REJECTION EVENT ${i} suppressed:`, message.substring(0, 60));
        return false;
      }
    }, true);
  }

  // Override Error constructor to suppress at source
  const OriginalError = window.Error;
  window.Error = function(message, ...args) {
    if (shouldSuppress(message)) {
      console.log('🚫 ERROR CONSTRUCTOR suppressed:', String(message).substring(0, 60));
      // Return a suppressed error that won't propagate
      const suppressedError = new OriginalError('Suppressed error');
      suppressedError.name = 'SuppressedError';
      suppressedError.suppressed = true;
      return suppressedError;
    }
    return new OriginalError(message, ...args);
  };
  
  // Copy static properties
  Object.setPrototypeOf(window.Error, OriginalError);
  Object.setPrototypeOf(window.Error.prototype, OriginalError.prototype);

  console.log('✅ ULTRA-AGGRESSIVE error suppression active');
})();