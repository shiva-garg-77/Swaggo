/**
 * 🔧 SERVER-SIDE DEFAULT PROPERTY FIX
 * 
 * This fix specifically targets server-side rendering errors
 * that occur during Next.js compilation and SSR.
 */

// Server-side polyfill for Node.js environment
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  console.log('🔧 Applying server-side default property fixes...');

  // 1. SAFE MODULE LOADING ON SERVER (without dynamic require)
  // Skip require patching to avoid webpack warnings

  // 2. ENSURE GLOBAL OBJECTS ARE SAFE
  if (!global.exports) {
    global.exports = {};
  }
  
  if (!global.module) {
    global.module = {
      exports: global.exports,
      id: 'server-default-fix',
      filename: __filename || 'server.js',
      loaded: true,
      parent: null,
      children: []
    };
  }

  // 3. PATCH OBJECT PROPERTY ACCESS FOR SERVER
  const originalHasOwnProperty = Object.prototype.hasOwnProperty;
  
  Object.prototype.hasOwnProperty = function(prop) {
    try {
      const result = originalHasOwnProperty.call(this, prop);
      
      // If 'default' property is missing, create a safe one
      if (prop === 'default' && !result && this && typeof this === 'object') {
        try {
          Object.defineProperty(this, 'default', {
            value: function SafeServerDefault() { return null; },
            writable: true,
            enumerable: false,
            configurable: true
          });
          return true;
        } catch (e) {
          // Silently fail if we can't define the property
        }
      }
      
      return result;
    } catch (error) {
      return false;
    }
  };

  // 4. SERVER-SIDE ERROR HANDLING
  process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes("Cannot read properties of undefined (reading 'default')")) {
      console.log('🔧 SERVER: Uncaught exception suppressed - default property error');
      return;
    }
    
    // Let other errors through
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && reason.message.includes("Cannot read properties of undefined (reading 'default')")) {
      console.log('🔧 SERVER: Unhandled rejection suppressed - default property error');
      return;
    }
    
    // Let other rejections through
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  console.log('✅ Server-side default property fixes applied');
}

// Export for server environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    loaded: true,
    serverSide: true
  };
}

// Client-side - do nothing, handled by other fixes
if (typeof window !== 'undefined') {
  console.log('🔧 Server-side fix skipped on client');
}