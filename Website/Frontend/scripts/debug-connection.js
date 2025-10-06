#!/usr/bin/env node

/**
 * Debug script for troubleshooting "Connection closed" issues
 * Run this to check your development environment
 */

const { spawn } = require('child_process');
const os = require('os');
const net = require('net');

console.log('🔍 Connection Debug Tool');
console.log('========================');

// System information
console.log(`Platform: ${os.platform()}`);
console.log(`Architecture: ${os.arch()}`);
console.log(`Node.js Version: ${process.version}`);
console.log(`Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB total, ${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB free`);

// Check if ports are available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

async function main() {
  // Check port availability
  const ports = [3000, 3001, 45799];
  console.log('\n📡 Port Status:');
  
  for (const port of ports) {
    const isAvailable = await checkPort(port);
    console.log(`Port ${port}: ${isAvailable ? '✅ Available' : '❌ In use'}`);
  }

  // Check network connectivity
  console.log('\n🌐 Network Check:');
  
  try {
    const testConnection = net.createConnection(80, 'google.com');
    testConnection.on('connect', () => {
      console.log('✅ Internet connection: OK');
      testConnection.destroy();
    });
    testConnection.on('error', () => {
      console.log('❌ Internet connection: Failed');
    });
  } catch (error) {
    console.log('❌ Internet connection: Error -', error.message);
  }

  // Check Windows-specific issues
  if (os.platform() === 'win32') {
    console.log('\n🪟 Windows-specific checks:');
    
    // Check Windows Defender/Firewall
    console.log('⚠️  If you see connection errors:');
    console.log('   1. Check Windows Defender firewall exceptions');
    console.log('   2. Ensure Node.js is allowed through firewall');
    console.log('   3. Try running terminal as administrator');
    console.log('   4. Check antivirus software interference');

    // Environment variables
    console.log('\n📋 Environment:');
    console.log(`NODE_OPTIONS: ${process.env.NODE_OPTIONS || 'Not set'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
  }

  console.log('\n🚀 Recommended Actions:');
  console.log('1. Use the updated dev script: npm run dev');
  console.log('2. Open browser to http://localhost:3000');
  console.log('3. Check browser console for any remaining errors');
  console.log('4. If issues persist, try: npm run dev:stable');
}

main().catch(console.error);