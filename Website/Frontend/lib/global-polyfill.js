/**
 * Global Polyfill for Client-Side Builds
 * 
 * Provides a safe global object for webpack client bundles
 */

// Export globalThis as the global object
if (typeof globalThis !== 'undefined') {
  module.exports = globalThis;
} else if (typeof window !== 'undefined') {
  module.exports = window;
} else if (typeof self !== 'undefined') {
  module.exports = self;
} else {
  // Fallback global object
  module.exports = {};
}