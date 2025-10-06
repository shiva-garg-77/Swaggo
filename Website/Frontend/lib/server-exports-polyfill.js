/**
 * Enhanced Server-side exports polyfill for webpack
 * Provides comprehensive safe fallbacks for exports and module on server-side
 */

// Ensure we're running in a safe server environment
if (typeof global !== 'undefined') {
  // Safe exports object with proper descriptor
  if (typeof global.exports === 'undefined') {
    Object.defineProperty(global, 'exports', {
      value: {},
      writable: true,
      enumerable: false,
      configurable: true
    });
  }
  
  // Safe module object with exports reference
  if (typeof global.module === 'undefined') {
    Object.defineProperty(global, 'module', {
      value: {
        exports: global.exports,
        id: 'server-polyfill',
        loaded: true,
        parent: null,
        children: []
      },
      writable: true,
      enumerable: false,
      configurable: true
    });
  }
  
  // Safe require function
  if (typeof global.require === 'undefined') {
    global.require = function(id) {
      console.log(`🔧 Server polyfill require called for: ${id}`);
      return {};
    };
  }
}

// Fallback objects for direct usage
const safeExports = (typeof global !== 'undefined' && global.exports) || {};
const safeModule = (typeof global !== 'undefined' && global.module) || { exports: safeExports };

// Export for webpack ProvidePlugin (ES modules)
export const exports = safeExports;
export const module = safeModule;
export default safeExports;

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = safeExports;
  module.exports.default = safeExports;
  module.exports.exports = safeExports;
  module.exports.module = safeModule;
}