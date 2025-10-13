#!/usr/bin/env node

/**
 * @fileoverview Run all automated tests
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import path from 'path';

async function runTests() {
  console.log('🚀 Running Automated Tests');
  console.log('='.repeat(40));
  
  // Test suites to run
  const testSuites = [
    {
      name: 'Error Handling Tests',
      path: 'Helper/__tests__/ErrorHandling.test.js'
    },
    {
      name: 'Validation Utils Tests',
      path: 'Helper/__tests__/ValidationUtils.test.js'
    },
    {
      name: 'Health Check Tests',
      path: 'Helper/__tests__/HealthCheck.test.js'
    }
  ];
  
  let passedSuites = 0;
  const startTime = Date.now();
  
  // Run each test suite
  for (const suite of testSuites) {
    console.log(`\n🧪 Running ${suite.name}...`);
    console.log('-'.repeat(30));
    
    try {
      const result = await runTestSuite(suite.path);
      if (result) {
        passedSuites++;
        console.log(`✅ ${suite.name} PASSED`);
      } else {
        console.log(`❌ ${suite.name} FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${suite.name} ERROR: ${error.message}`);
    }
  }
  
  // Summary
  const totalTime = Date.now() - startTime;
  console.log('\n' + '='.repeat(40));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(40));
  console.log(`Total Suites: ${testSuites.length}`);
  console.log(`Passed: ${passedSuites}`);
  console.log(`Failed: ${testSuites.length - passedSuites}`);
  console.log(`Time: ${totalTime}ms`);
  
  if (passedSuites === testSuites.length) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

function runTestSuite(testPath) {
  return new Promise((resolve) => {
    const jest = spawn(
      'node',
      [
        '--experimental-vm-modules',
        'node_modules/jest/bin/jest.js',
        testPath,
        '--verbose',
        '--silent'
      ],
      {
        cwd: process.cwd(),
        stdio: 'inherit'
      }
    );
    
    jest.on('close', (code) => {
      resolve(code === 0);
    });
    
    jest.on('error', (error) => {
      console.error(`Error running test suite: ${error.message}`);
      resolve(false);
    });
  });
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});