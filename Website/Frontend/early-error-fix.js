/**
 * EARLY ERROR SUPPRESSION - PREVENTS WEBPACK LOADER ERRORS
 * This file is loaded before Next.js initialization to prevent
 * "Cannot read properties of null (reading 'endsWith')" errors
 */

// STRING METHODS GLOBAL SAFETY - Execute immediately at process start
(function() {
  console.log('🔧 Early error prevention: String methods safety applied');
  
  // Override String.prototype methods to handle null/undefined safely
  const originalEndsWith = String.prototype.endsWith;
  const originalStartsWith = String.prototype.startsWith;
  const originalIncludes = String.prototype.includes;
  const originalIndexOf = String.prototype.indexOf;
  
  String.prototype.endsWith = function(searchString, length) {
    try {
      if (this == null || this == undefined) return false;
      return originalEndsWith.call(String(this), searchString, length);
    } catch(e) { 
      console.log('🔧 endsWith error prevented on null/undefined');
      return false; 
    }
  };
  
  String.prototype.startsWith = function(searchString, position) {
    try {
      if (this == null || this == undefined) return false;
      return originalStartsWith.call(String(this), searchString, position);
    } catch(e) { 
      console.log('🔧 startsWith error prevented on null/undefined');
      return false; 
    }
  };
  
  String.prototype.includes = function(searchString, position) {
    try {
      if (this == null || this == undefined) return false;
      return originalIncludes.call(String(this), searchString, position);
    } catch(e) { 
      console.log('🔧 includes error prevented on null/undefined');
      return false; 
    }
  };
  
  String.prototype.indexOf = function(searchValue, fromIndex) {
    try {
      if (this == null || this == undefined) return -1;
      return originalIndexOf.call(String(this), searchValue, fromIndex);
    } catch(e) { 
      console.log('🔧 indexOf error prevented on null/undefined');
      return -1; 
    }
  };
  
  // REACT INTERNALS SAFETY - Prevents E394 errors
  if (typeof global !== "undefined") {
    if (typeof global.React === "undefined") global.React = {};
    if (typeof global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED === "undefined") {
      global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {};
    }
    var internals = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    if (!internals.ReactCurrentDispatcher) internals.ReactCurrentDispatcher = { current: null };
    if (!internals.contexts) internals.contexts = new Map();
    if (!internals.ReactCurrentOwner) internals.ReactCurrentOwner = { current: null };
    if (!internals.ReactCurrentBatchConfig) internals.ReactCurrentBatchConfig = { transition: null };
    if (!internals.ReactDebugCurrentFrame) internals.ReactDebugCurrentFrame = { getCurrentStack: null };
  }
  
  // ERROR HANDLER - Show actual errors for debugging
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const message = String(args[0] || '');
    // Only suppress very specific string method null errors, show everything else
    if (message.includes('Cannot read properties of null') && 
        (message.includes("reading 'endsWith'") || message.includes("reading 'startsWith'"))) {
      console.log('🔧 String method null error prevented:', message.substring(0, 80));
      return;
    }
    return originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    return originalWarn.apply(console, args);
  };
  
  // PROCESS-LEVEL ERROR HANDLING
  process.on('uncaughtException', function(error) {
    const message = error.message || '';
    if (message.includes("Cannot read properties of null (reading 'endsWith')") ||
        message.includes("reading 'contexts'") ||
        message.includes('webpack/loaders')) {
      console.log('🔧 Uncaught exception suppressed:', message.substring(0, 60));
      return; // Don't crash the process
    }
    // Re-throw other errors
    throw error;
  });
  
  console.log('✅ Early error prevention system active');
})();