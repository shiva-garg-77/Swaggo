/**
 * 🛡️ React JSX Runtime Global Fix
 * 
 * This module ensures React JSX runtime is available globally
 * for all Next.js internal modules, preventing module resolution errors.
 */

// Ensure React is available globally
if (typeof globalThis !== 'undefined') {
  try {
    const React = require('react');
    const jsxRuntime = require('react/jsx-runtime');
    const jsxDevRuntime = require('react/jsx-dev-runtime');
    
    // Make React and JSX runtime globally available
    globalThis.React = React;
    globalThis.__jsx = jsxRuntime.jsx;
    globalThis.__jsxs = jsxRuntime.jsxs;
    globalThis.__Fragment = jsxRuntime.Fragment;
    
    // Dev runtime
    if (jsxDevRuntime.jsxDEV) {
      globalThis.__jsxDEV = jsxDevRuntime.jsxDEV;
    }
    
    // Create a module cache to prevent repeated resolution issues
    const moduleCache = new Map();
    
    // Override require for jsx-runtime specifically
    const originalRequire = require;
    require = function(id) {
      if (id === 'react/jsx-runtime') {
        if (!moduleCache.has(id)) {
          moduleCache.set(id, jsxRuntime);
        }
        return moduleCache.get(id);
      }
      if (id === 'react/jsx-dev-runtime') {
        if (!moduleCache.has(id)) {
          moduleCache.set(id, jsxDevRuntime);
        }
        return moduleCache.get(id);
      }
      return originalRequire.apply(this, arguments);
    };
    
    // Copy all properties from original require
    Object.setPrototypeOf(require, Object.getPrototypeOf(originalRequire));
    Object.defineProperties(require, Object.getOwnPropertyDescriptors(originalRequire));
    
  } catch (error) {
    console.warn('JSX Runtime global setup warning:', error.message);
  }
}

// Export the runtime for modules that import this file
module.exports = {
  jsx: globalThis.__jsx,
  jsxs: globalThis.__jsxs,
  Fragment: globalThis.__Fragment,
  jsxDEV: globalThis.__jsxDEV
};