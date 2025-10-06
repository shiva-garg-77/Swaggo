#!/usr/bin/env node
/**
 * 🧪 Data Science Server Integration Test
 * Verifies DS server connectivity and functionality
 */

import fetch from 'node-fetch';

const DS_URL = process.env.DS_URL || 'http://localhost:5000';
const TIMEOUT = 5000;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function testEndpoint(url, method = 'GET', body = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log(`🔬 Testing Data Science Server Integration`);
  console.log(`📡 DS Server URL: ${DS_URL}`);
  console.log('─'.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Health Check
  log.info('Testing health endpoint...');
  const healthResult = await testEndpoint(`${DS_URL}/api/health`);
  
  if (healthResult.success) {
    log.success(`Health check passed (${healthResult.status})`);
    console.log(`   Service: ${healthResult.data.service}`);
    console.log(`   Version: ${healthResult.data.version}`);
    console.log(`   Environment: ${healthResult.data.environment}`);
    passed++;
  } else {
    log.error(`Health check failed: ${healthResult.error || healthResult.status}`);
    failed++;
  }
  
  console.log('');
  
  // Test 2: Status Check
  log.info('Testing status endpoint...');
  const statusResult = await testEndpoint(`${DS_URL}/api/status`);
  
  if (statusResult.success) {
    log.success(`Status check passed (${statusResult.status})`);
    console.log(`   Libraries: pandas ${statusResult.data.libraries?.pandas}, numpy ${statusResult.data.libraries?.numpy}`);
    passed++;
  } else {
    log.error(`Status check failed: ${statusResult.error || statusResult.status}`);
    failed++;
  }
  
  console.log('');
  
  // Test 3: Data Analysis
  log.info('Testing data analysis endpoint...');
  const testData = {
    data: [
      { "name": "Alice", "age": 25, "salary": 50000, "department": "Engineering" },
      { "name": "Bob", "age": 30, "salary": 60000, "department": "Sales" },
      { "name": "Charlie", "age": 35, "salary": 70000, "department": "Engineering" }
    ]
  };
  
  const analyzeResult = await testEndpoint(`${DS_URL}/api/analyze`, 'POST', testData);
  
  if (analyzeResult.success) {
    log.success(`Data analysis passed (${analyzeResult.status})`);
    const analysis = analyzeResult.data.analysis;
    console.log(`   Rows analyzed: ${analysis.summary.total_rows}`);
    console.log(`   Columns: ${analysis.summary.columns.join(', ')}`);
    console.log(`   Insights: ${analysis.insights.length} generated`);
    passed++;
  } else {
    log.error(`Data analysis failed: ${analyzeResult.error || analyzeResult.status}`);
    failed++;
  }
  
  console.log('');
  
  // Test 4: Prediction Endpoint (placeholder)
  log.info('Testing prediction endpoint...');
  const predictResult = await testEndpoint(`${DS_URL}/api/predict`, 'POST', { data: "test" });
  
  if (predictResult.success) {
    log.success(`Prediction endpoint accessible (${predictResult.status})`);
    console.log(`   Message: ${predictResult.data.message}`);
    passed++;
  } else {
    log.error(`Prediction endpoint failed: ${predictResult.error || predictResult.status}`);
    failed++;
  }
  
  // Summary
  console.log('');
  console.log('─'.repeat(50));
  console.log(`📊 Test Summary:`);
  log.success(`${passed} tests passed`);
  
  if (failed > 0) {
    log.error(`${failed} tests failed`);
  }
  
  console.log(`🎯 Overall: ${passed}/${passed + failed} tests passed`);
  
  if (failed === 0) {
    log.success('🎉 Data Science server integration is working correctly!');
    
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Start the DS server: docker-compose up data-science');
    console.log('  2. Test from frontend: Visit Data Science Integration component');
    console.log('  3. Deploy with: docker-compose up -d');
    
    process.exit(0);
  } else {
    log.error('🚨 Some tests failed. Please check the Data Science server configuration.');
    
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('  1. Ensure DS server is running on port 5000');
    console.log('  2. Check Docker Compose configuration');
    console.log('  3. Verify network connectivity');
    console.log('  4. Check server logs for errors');
    
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  log.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});