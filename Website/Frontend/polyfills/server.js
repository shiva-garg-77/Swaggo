/**
 * Server-side polyfills for browser-only globals
 * 
 * This file provides polyfills for browser globals that may be referenced
 * in bundled code but are not available in Node.js server environment.
 * 
 * SECURITY MAINTAINED: These polyfills only provide the minimum necessary 
 * functionality to prevent runtime errors, without compromising security.
 */

// Apply polyfills only in Node.js environment (server-side)
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  // Define 'self' global - essential for webpack chunks
  if (typeof self === 'undefined') {
    global.self = globalThis;
  }
  
  // Additional polyfills for potential browser globals
  if (typeof global.window === 'undefined') {
    // Minimal window object - prevents errors but maintains server context
    global.window = {
      location: {
        href: 'https://localhost',
        origin: 'https://localhost', 
        protocol: 'https:', // Maintain security with HTTPS
        host: 'localhost'
      },
      document: {
        createElement: () => ({}),
        getElementById: () => null,
        querySelector: () => null,
        addEventListener: () => {},
        removeEventListener: () => {}
      },
      navigator: {
        userAgent: 'Node.js'
      },
      console: global.console
    };
  }
}
