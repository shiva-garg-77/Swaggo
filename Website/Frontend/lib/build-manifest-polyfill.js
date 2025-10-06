/**
 * 🛠️ Build Manifest Polyfill for Next.js 15.5.4
 * 
 * Ensures fallback-build-manifest.json is available for development builds
 * and prevents ENOENT errors during compilation.
 */

const fs = require('fs');
const path = require('path');

// Fallback build manifest structure
const fallbackManifest = {
  __rewrites: {
    beforeFiles: [],
    afterFiles: [],
    fallback: []
  },
  polyfillFiles: [
    "static/chunks/polyfills.js"
  ],
  devFiles: [
    "static/chunks/react-refresh.js"
  ],
  ampDevFiles: [],
  lowPriorityFiles: [
    "static/chunks/webpack.js"
  ],
  pages: {
    "/": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/index.js"
    ],
    "/_app": [
      "static/chunks/webpack.js", 
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js", 
      "static/chunks/pages/_error.js"
    ]
  },
  ampFirstPages: []
};

// Ensure .next directory exists
const nextDir = path.join(process.cwd(), '.next');
const manifestPath = path.join(nextDir, 'fallback-build-manifest.json');

function createFallbackManifest() {
  try {
    // Create .next directory if it doesn't exist
    if (!fs.existsSync(nextDir)) {
      fs.mkdirSync(nextDir, { recursive: true });
    }
    
    // Create fallback manifest if it doesn't exist
    if (!fs.existsSync(manifestPath)) {
      fs.writeFileSync(manifestPath, JSON.stringify(fallbackManifest, null, 2), 'utf8');
      console.log('✅ Created fallback-build-manifest.json for development');
    }
  } catch (error) {
    console.warn('⚠️ Could not create fallback manifest:', error.message);
  }
}

// Auto-create on require
createFallbackManifest();

module.exports = {
  createFallbackManifest,
  fallbackManifest
};