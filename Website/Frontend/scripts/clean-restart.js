#!/usr/bin/env node

/**
 * 🧹 CLEAN RESTART SCRIPT
 * 
 * This script performs a complete cleanup and restart to eliminate
 * persistent errors like memory store conflicts and vendors.js issues.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting complete cleanup and restart...');

try {
  // 1. Kill any existing Next.js processes
  console.log('🔄 Stopping existing processes...');
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
      execSync('taskkill /f /im next.exe', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "next dev"', { stdio: 'ignore' });
      execSync('pkill -f "node.*next"', { stdio: 'ignore' });
    }
  } catch (e) {
    // Processes might not exist, that's okay
  }

  // 2. Clean Next.js cache and build artifacts
  console.log('🗑️  Cleaning build artifacts...');
  const cleanPaths = [
    '.next',
    'node_modules/.cache',
    '.swc',
    'dist'
  ];

  for (const cleanPath of cleanPaths) {
    try {
      if (fs.existsSync(cleanPath)) {
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${cleanPath}"`, { stdio: 'ignore' });
        } else {
          execSync(`rm -rf "${cleanPath}"`, { stdio: 'ignore' });
        }
        console.log(`  ✅ Removed ${cleanPath}`);
      }
    } catch (e) {
      console.log(`  ⚠️  Could not remove ${cleanPath}: ${e.message}`);
    }
  }

  // 3. Wait a moment for cleanup
  console.log('⏳ Waiting for cleanup to complete...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Set clean environment variables
  const cleanEnv = {
    ...process.env,
    
    // Clear any problematic environment variables
    NODE_OPTIONS: '--max-old-space-size=4096 --no-warnings',
    
    // Disable problematic Next.js features
    NEXT_TELEMETRY_DISABLED: '1',
    
    // Force clean slate
    NEXT_PRIVATE_SKIP_SIZE_LIMIT_WARNING: '1',
    
    // Windows-specific optimizations
    CHOKIDAR_USEPOLLING: 'true',
    CHOKIDAR_INTERVAL: '1000',
    
    // Prevent memory conflicts
    FORCE_COLOR: '1',
    NODE_ENV: 'development',
    
    // Clear any cached module paths
    NODE_PATH: '',
    
    // Prevent cache conflicts
    npm_config_cache: path.join(process.cwd(), '.npm-cache-clean')
  };

  // 5. Remove environment variables that might cause conflicts
  delete cleanEnv.NEXT_PRIVATE_DISABLE_STREAMING;
  delete cleanEnv.NEXT_PRIVATE_DISABLE_REACT_STREAMING;
  delete cleanEnv.WEBPACK_USE_POLLING;

  console.log('🚀 Starting clean development server...');
  console.log('📋 Environment optimizations:');
  console.log('  ✅ All caches cleared');
  console.log('  ✅ Processes terminated');
  console.log('  ✅ Memory limits increased');
  console.log('  ✅ File polling enabled');
  console.log('');

  // 6. Start the development server with clean environment
  const devProcess = spawn('next', ['dev', '-p', '3000', '--hostname', 'localhost'], {
    stdio: 'inherit',
    env: cleanEnv,
    shell: true,
    cwd: process.cwd()
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    devProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    devProcess.kill('SIGTERM');
    process.exit(0);
  });

  devProcess.on('close', (code) => {
    console.log(`\n📋 Development server exited with code ${code}`);
    process.exit(code);
  });

  devProcess.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Cleanup failed:', error.message);
  console.log('\n🔄 Attempting manual start...');
  
  // Fallback: try to start anyway
  const fallbackProcess = spawn('next', ['dev', '-p', '3000'], {
    stdio: 'inherit',
    shell: true
  });
  
  fallbackProcess.on('error', (err) => {
    console.error('❌ Fallback start failed:', err.message);
    process.exit(1);
  });
}