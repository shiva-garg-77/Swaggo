#!/usr/bin/env node

/**
 * @fileoverview Automated Test Runner for Backend Components
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Test configuration
const TEST_CONFIG = {
  verbose: true,
  coverage: true,
  watch: false,
  maxWorkers: '50%',
  testTimeout: 10000
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Socket Controller Tests',
    pattern: 'Controllers/__tests__/SocketController.automated.test.js',
    description: 'Tests for SocketController with enhanced features'
  },
  {
    name: 'Messaging Controller Tests',
    pattern: 'Controllers/__tests__/MessagingController.test.js',
    description: 'Tests for MessagingController'
  },
  {
    name: 'Link Preview Controller Tests',
    pattern: 'Controllers/__tests__/LinkPreviewController.test.js',
    description: 'Tests for LinkPreviewController'
  },
  {
    name: 'Existing Socket Controller Tests',
    pattern: 'Controllers/__tests__/SocketController.test.js',
    description: 'Existing tests for SocketController'
  }
];

/**
 * Run a single test suite
 * @param {Object} suite - Test suite configuration
 * @returns {Promise<Object>} Test results
 */
function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running ${suite.name}`);
    console.log(`📝 ${suite.description}`);
    console.log('─'.repeat(50));
    
    // Build Jest command
    const jestArgs = [
      '--experimental-vm-modules',
      'node_modules/jest/bin/jest.js',
      suite.pattern
    ];
    
    if (TEST_CONFIG.verbose) {
      jestArgs.push('--verbose');
    }
    
    if (TEST_CONFIG.coverage) {
      jestArgs.push('--coverage');
    }
    
    if (TEST_CONFIG.watch) {
      jestArgs.push('--watch');
    }
    
    jestArgs.push(`--maxWorkers=${TEST_CONFIG.maxWorkers}`);
    jestArgs.push(`--testTimeout=${TEST_CONFIG.testTimeout}`);
    
    // Run Jest
    const jestProcess = spawn('node', jestArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });
    
    jestProcess.on('close', (code) => {
      const passed = code === 0;
      console.log(`\n${passed ? '✅' : '❌'} ${suite.name} ${passed ? 'PASSED' : 'FAILED'}`);
      resolve({
        suite: suite.name,
        passed,
        exitCode: code
      });
    });
    
    jestProcess.on('error', (error) => {
      console.error(`❌ Error running ${suite.name}:`, error.message);
      resolve({
        suite: suite.name,
        passed: false,
        error: error.message
      });
    });
  });
}

/**
 * Run all test suites
 */
async function runAllTestSuites() {
  console.log('🚀 Starting Automated Test Runner');
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  const results = [];
  
  // Run each test suite
  for (const suite of TEST_SUITES) {
    try {
      const result = await runTestSuite(suite);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to run ${suite.name}:`, error.message);
      results.push({
        suite: suite.name,
        passed: false,
        error: error.message
      });
    }
  }
  
  // Calculate summary
  const totalTime = Date.now() - startTime;
  const passedSuites = results.filter(r => r.passed).length;
  const totalSuites = results.length;
  
  // Display summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RUN SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.suite}`);
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log(`🏁 Total Suites: ${totalSuites}`);
  console.log(`✅ Passed: ${passedSuites}`);
  console.log(`❌ Failed: ${totalSuites - passedSuites}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

/**
 * Run specific test suite by name
 * @param {string} suiteName - Name of the test suite to run
 */
async function runSpecificSuite(suiteName) {
  const suite = TEST_SUITES.find(s => 
    s.name.toLowerCase().includes(suiteName.toLowerCase()) ||
    s.pattern.toLowerCase().includes(suiteName.toLowerCase())
  );
  
  if (!suite) {
    console.error(`❌ Test suite '${suiteName}' not found`);
    console.log('Available suites:');
    TEST_SUITES.forEach(s => console.log(`  • ${s.name}`));
    process.exit(1);
  }
  
  const result = await runTestSuite(suite);
  process.exit(result.passed ? 0 : 1);
}

/**
 * List all available test suites
 */
function listTestSuites() {
  console.log('📋 Available Test Suites:');
  console.log('─'.repeat(30));
  
  TEST_SUITES.forEach((suite, index) => {
    console.log(`${index + 1}. ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   Pattern: ${suite.pattern}`);
    console.log('');
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🤖 Automated Test Runner');
    console.log('Usage: node automated-test-runner.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --list, -l     List all available test suites');
    console.log('  --suite NAME   Run specific test suite');
    console.log('  --watch, -w    Run tests in watch mode');
    console.log('');
    return;
  }
  
  if (args.includes('--list') || args.includes('-l')) {
    listTestSuites();
    return;
  }
  
  if (args.includes('--watch') || args.includes('-w')) {
    TEST_CONFIG.watch = true;
  }
  
  const suiteIndex = args.indexOf('--suite');
  if (suiteIndex !== -1 && args[suiteIndex + 1]) {
    await runSpecificSuite(args[suiteIndex + 1]);
    return;
  }
  
  // Run all test suites
  await runAllTestSuites();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('❌ Fatal Error:', error);
  process.exit(1);
});