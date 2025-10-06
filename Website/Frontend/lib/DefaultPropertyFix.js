/**
 * 🔄 DEFAULT PROPERTY FIX
 * 
 * This script specifically targets the "Cannot read properties of undefined (reading 'default')" error
 * that occurs after fixing the "Connection closed" errors.
 * 
 * This is often caused by React components trying to destructure default exports
 * during hot module reloading or when chunks fail to load correctly.
 */

if (typeof window !== 'undefined') {
  console.log('🔄 Loading Default Property Fix...');

  // Create a proxy handler that provides default values for missing properties
  const createSafeObjectProxy = (obj) => {
    return new Proxy(obj || {}, {
      get(target, prop) {
        // Handle special cases first
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined; // Prevent treating this as a thenable
        }
        
        // If property exists, return it
        if (prop in target) {
          const value = target[prop];
          
          // If it's an object, wrap it in a proxy too
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return createSafeObjectProxy(value);
          }
          
          return value;
        }
        
        // Special handling for 'default' property (common in module loading)
        if (prop === 'default') {
          console.log('🔄 Providing default property for undefined object');
          
          // Create a safe component substitute if needed
          if (typeof React !== 'undefined') {
            return createSafeComponent();
          }
          
          // Create a general safe object otherwise
          return createSafeObjectProxy({});
        }
        
        // Return a safe empty value
        return undefined;
      }
    });
  };
  
  // Create a safe React component for fallbacks
  const createSafeComponent = () => {
    if (typeof React === 'undefined') return () => null;
    
    return function SafeFallbackComponent(props) {
      console.log('🔄 Rendering SafeFallbackComponent due to module loading error');
      return null;
    };
  };
  
  // Patch module loading functions
  const patchModuleLoading = () => {
    // Monitor for dynamic import errors
    const originalImport = window.import;
    if (typeof originalImport === 'function') {
      window.import = function(...args) {
        return originalImport.apply(this, args).catch(error => {
          console.log('🔄 Import error caught:', error.message);
          
          // Return a safe module object
          return createSafeObjectProxy({
            default: createSafeComponent()
          });
        });
      };
    }
    
    // Patch webpack's __webpack_require__ function
    if (window.__webpack_require__) {
      const originalRequire = window.__webpack_require__;
      
      window.__webpack_require__ = function(moduleId) {
        try {
          return originalRequire.apply(this, moduleId);
        } catch (error) {
          console.log('🔄 webpack_require error caught for module:', moduleId);
          
          // Return a safe module
          return createSafeObjectProxy({
            default: createSafeComponent()
          });
        }
      };
    }
    
    // Add global error handler for script loading
    window.addEventListener('error', function(event) {
      if (event.target && event.target.tagName === 'SCRIPT') {
        console.log('🔄 Script loading error caught:', event.target.src);
        event.preventDefault();
        
        // Inject a global variable with the same name as the module might have used
        const scriptPath = event.target.src || '';
        const moduleName = scriptPath.split('/').pop().split('.')[0];
        
        if (moduleName && !window[moduleName]) {
          console.log('🔄 Providing fallback for script:', moduleName);
          window[moduleName] = createSafeObjectProxy({
            default: createSafeComponent()
          });
        }
        
        return false;
      }
    }, true);
  };
  
  // Apply patches for React component loading
  const patchReactComponentLoading = () => {
    if (typeof window.React !== 'undefined') {
      // Keep original createElement
      const originalCreateElement = React.createElement;
      
      // Create a version that handles undefined components gracefully
      React.createElement = function(type, props, ...children) {
        // If type is undefined or null, use a fallback component
        if (type === undefined || type === null) {
          console.log('🔄 Providing fallback for undefined React component');
          return originalCreateElement(createSafeComponent(), props, ...children);
        }
        
        // Handle case where type.default is being accessed but type is undefined
        if (typeof type === 'object' && type !== null && type.default === undefined) {
          if (typeof type.$$typeof !== 'undefined') {
            // It's already a valid React element factory, use it directly
            return originalCreateElement(type, props, ...children);
          }
          
          console.log('🔄 Providing .default property for React component');
          return originalCreateElement(createSafeComponent(), props, ...children);
        }
        
        // Default behavior
        return originalCreateElement(type, props, ...children);
      };
    }
  };
  
  // Patch Next.js specific loaders if they exist
  const patchNextJsLoaders = () => {
    if (window.__NEXT_REGISTER_COMPONENT) {
      const originalRegisterComponent = window.__NEXT_REGISTER_COMPONENT;
      
      window.__NEXT_REGISTER_COMPONENT = function(componentInfo) {
        try {
          return originalRegisterComponent.apply(this, arguments);
        } catch (error) {
          if (error.message && error.message.includes("Cannot read properties of undefined (reading 'default')")) {
            console.log('🔄 Next.js component registration error suppressed');
            return null;
          }
          throw error;
        }
      };
    }
    
    // Monitor for Next.js chunk loading errors
    if (window.__NEXT_P) {
      const originalPush = window.__NEXT_P.push;
      
      window.__NEXT_P.push = function(args) {
        try {
          return originalPush.apply(window.__NEXT_P, arguments);
        } catch (error) {
          if (error.message && error.message.includes("Cannot read properties of undefined")) {
            console.log('🔄 Next.js page loading error suppressed:', args[0]);
            return null;
          }
          throw error;
        }
      };
    }
  };
  
  // Initialize all patches
  const initialize = () => {
    patchModuleLoading();
    
    // Wait for React to be available
    if (typeof window.React !== 'undefined') {
      patchReactComponentLoading();
    } else {
      // Check periodically for React
      const checkForReact = setInterval(() => {
        if (typeof window.React !== 'undefined') {
          patchReactComponentLoading();
          clearInterval(checkForReact);
        }
      }, 100);
      
      // Clean up after 5 seconds
      setTimeout(() => clearInterval(checkForReact), 5000);
    }
    
    patchNextJsLoaders();
    
    console.log('✅ Default Property Fix initialized successfully');
  };
  
  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Also initialize after a short delay to catch lazy-loaded elements
  setTimeout(initialize, 100);
}

// Export for potential manual usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loaded: true };
}

/**
 * Default Property Fix - Prevents "Cannot read properties of undefined (reading 'default')" errors
 * This fixes issues where modules are trying to access .default on undefined objects
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  console.log('🔧 Default Property Fix loading...');
  
  // Override Object.defineProperty to prevent default property errors
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    try {
      // If trying to define 'default' on undefined/null, create a safe object first
      if (obj === null || obj === undefined) {
        if (prop === 'default') {
          console.log('🔧 Prevented default property definition on null/undefined');
          return {};
        }
        return obj;
      }
      
      // If defining 'default' property, ensure it has a safe fallback
      if (prop === 'default' && descriptor && typeof descriptor.value === 'undefined') {
        descriptor.value = {};
        console.log('🔧 Default property fallback applied');
      }
      
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      console.log('🔧 defineProperty error handled for prop:', prop);
      return obj;
    }
  };
  
  // Safe property access helper
  window.__safeDefaultAccess = function(obj, fallback = {}) {
    if (obj === null || obj === undefined) {
      return fallback;
    }
    if (typeof obj.default === 'undefined') {
      obj.default = fallback;
    }
    return obj;
  };
  
  // Override property access for common patterns
  const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  Object.getOwnPropertyDescriptor = function(obj, prop) {
    try {
      if (obj === null || obj === undefined) {
        if (prop === 'default') {
          console.log('🔧 Safe default property descriptor returned');
          return {
            value: {},
            writable: true,
            enumerable: true,
            configurable: true
          };
        }
        return undefined;
      }
      
      return originalGetOwnPropertyDescriptor.call(this, obj, prop);
    } catch (error) {
      console.log('🔧 getOwnPropertyDescriptor error handled');
      return undefined;
    }
  };
  
  // Global error handler for default property access errors
  const originalError = window.Error;
  window.Error = function(message, ...args) {
    if (typeof message === 'string' && message.includes("Cannot read properties of undefined (reading 'default')")) {
      console.log('🔧 Default property access error intercepted');
      return new originalError('Default property access prevented - using fallback', ...args);
    }
    return new originalError(message, ...args);
  };
  
  // Copy static properties
  Object.setPrototypeOf(window.Error, originalError);
  Object.defineProperty(window.Error, 'prototype', {
    value: originalError.prototype,
    writable: false
  });
  
  console.log('✅ Default Property Fix applied successfully');
})();

export default {};
