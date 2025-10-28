const { spawn } = require('child_process');
const path = require('path');

// Get port from environment variable or default to 3000
const port = process.env.PORT || '3000';

// Set environment variables
process.env.NODE_OPTIONS = '--max-old-space-size=4096 --no-warnings';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Copy env file
const copyEnv = spawn('copy', ['.env.development.clean', '.env.development.local'], {
  cwd: process.cwd(),
  shell: true
});

copyEnv.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to copy env file');
    process.exit(1);
  }

  // Start Next.js dev server
  const nextDev = spawn('next', ['dev', '-p', port, '--hostname', 'localhost'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit'
  });

  nextDev.on('close', (code) => {
    process.exit(code);
  });
});