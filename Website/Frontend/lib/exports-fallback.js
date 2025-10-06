// Simple exports fallback for Next.js modules
if (typeof exports === 'undefined' && typeof global !== 'undefined') {
  global.exports = {};
}

if (typeof module === 'undefined' && typeof global !== 'undefined') {
  global.module = { exports: global.exports || {} };
}

export default {};