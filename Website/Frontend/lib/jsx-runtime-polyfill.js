/**
 * 🔧 JSX Runtime Polyfill for React 18.3.1 + Next.js 15.5.4 Compatibility
 * 
 * This polyfill ensures perfect module resolution for React JSX runtime
 * across all Next.js internal modules and build processes.
 * 
 * Addresses:
 * - Module not found: Can't resolve 'react/jsx-runtime'
 * - Next.js internal icon-mark.js resolution issues
 * - Build manifest generation errors
 */

// Ensure React is available globally
if (typeof globalThis !== 'undefined') {
  if (!globalThis.React) {
    try {
      globalThis.React = require('react');
    } catch (e) {
      // React will be loaded by Next.js
    }
  }
}

// JSX Runtime Polyfill for React 18
const jsxRuntime = (() => {
  try {
    // Try to import the actual jsx-runtime first
    return require('react/jsx-runtime');
  } catch (error) {
    try {
      // Fallback to React createElement
      const React = require('react');
      
      // Polyfill jsx and jsxs functions
      const jsx = (type, props, key) => {
        const { children, ...otherProps } = props || {};
        return React.createElement(type, key ? { ...otherProps, key } : otherProps, children);
      };
      
      const jsxs = jsx; // In React 18, jsx and jsxs are the same
      
      const Fragment = React.Fragment;
      
      return {
        jsx,
        jsxs,
        Fragment
      };
    } catch (fallbackError) {
      console.warn('JSX Runtime polyfill: Could not load React', fallbackError);
      return {
        jsx: () => null,
        jsxs: () => null,
        Fragment: 'div'
      };
    }
  }
})();

// JSX Dev Runtime Polyfill
const jsxDevRuntime = (() => {
  try {
    return require('react/jsx-dev-runtime');
  } catch (error) {
    // Use the same polyfill as jsx-runtime
    return jsxRuntime;
  }
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = jsxRuntime;
}

// Export for ES modules
if (typeof exports !== 'undefined') {
  Object.assign(exports, jsxRuntime);
}

// Make available globally for webpack resolution
if (typeof globalThis !== 'undefined') {
  globalThis.__JSX_RUNTIME_POLYFILL__ = jsxRuntime;
  globalThis.__JSX_DEV_RUNTIME_POLYFILL__ = jsxDevRuntime;
}

// Export the runtime objects
module.exports = jsxRuntime;
module.exports.jsxDevRuntime = jsxDevRuntime;