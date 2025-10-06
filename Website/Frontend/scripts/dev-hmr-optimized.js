#!/usr/bin/env node

/**
 * 🔥 OPTIMIZED WINDOWS HMR DEVELOPMENT SERVER
 * 
 * This script starts Next.js with optimal settings for Hot Module Replacement on Windows.
 * It ensures that soft reloads work properly and file changes trigger recompilation.
 * 
 * Usage: node scripts/dev-hmr-optimized.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔥 Starting Windows HMR Optimized Development Server...');

// Set Windows-specific environment variables for HMR
process.env.FAST_REFRESH = 'true';
process.env.CHOKIDAR_USEPOLLING = 'true';
process.env.CHOKIDAR_INTERVAL = '1000';
process.env.WATCHPACK_POLLING = 'true';
process.env.NEXT_PRIVATE_DEBUG_HMR = 'true';
process.env.NODE_OPTIONS = '--max-old-space-size=8192 --no-warnings';

// Start Next.js development server with HMR optimizations
const nextProcess = spawn('npx', [
  'next', 
  'dev', 
  '-p', '3000', 
  '--hostname', 'localhost'
], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: {
    ...process.env,
    // Additional HMR optimizations
    NODE_ENV: 'development',
    FORCE_COLOR: '1',
    NEXT_TELEMETRY_DISABLED: '1'
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
  process.exit(0);
});

nextProcess.on('close', (code) => {
  console.log(`\n🏁 Development server exited with code ${code}`);
  process.exit(code);
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

console.log('✅ HMR optimized server started!');
console.log('📝 Test HMR by editing files - you should see instant updates without full page reloads');
console.log('🔍 Look for the green HMR Test widget in the top-right corner');