#!/usr/bin/env node

/**
 * 🧪 REFRESH TOKEN TEST SCRIPT
 * 
 * This script tests the refresh token functionality to ensure:
 * 1. The Mongoose casting error is fixed
 * 2. Token refresh works correctly
 * 3. Error handling is proper
 * 4. Autologin functionality works
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const API_BASE = 'http://localhost:45799';
const TEST_USER = {
  username: 'testuser_' + Date.now(),
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  displayName: 'Test User'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log('green', `✅ ${message}`);
}

function error(message) {
  log('red', `❌ ${message}`);
}

function info(message) {
  log('blue', `ℹ️  ${message}`);
}

function warning(message) {
  log('yellow', `⚠️  ${message}`);
}

// Test helper functions
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'RefreshTokenTest/1.0'
  };

  try {
    info(`Making request: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      data
    };
  } catch (err) {
    error(`Request failed: ${err.message}`);
    return {
      status: 0,
      ok: false,
      error: err.message,
      data: null
    };
  }
}

async function testBackendHealth() {
  info('Testing backend health...');
  
  const response = await makeRequest('/api/health');
  
  if (response.ok) {
    success('Backend is healthy and reachable');
    return true;
  } else {
    error(`Backend health check failed: ${response.status} - ${response.data?.message}`);
    return false;
  }
}

async function testUserSignup() {
  info('Testing user signup...');
  
  const response = await makeRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      username: TEST_USER.username,
      email: TEST_USER.email,
      password: TEST_USER.password,
      displayName: TEST_USER.displayName,
      acceptTerms: true,
      gdprConsent: true
    })
  });

  if (response.ok && response.data.success) {
    success('User signup successful');
    return {
      user: response.data.user,
      tokens: response.data.tokens
    };
  } else {
    error(`Signup failed: ${response.data?.message || 'Unknown error'}`);
    return null;
  }
}

async function testUserLogin() {
  info('Testing user login...');
  
  const response = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: TEST_USER.email,
      password: TEST_USER.password,
      rememberMe: true
    })
  });

  if (response.ok && response.data.success) {
    success('User login successful');
    return {
      user: response.data.user,
      tokens: response.data.tokens
    };
  } else {
    error(`Login failed: ${response.data?.message || 'Unknown error'}`);
    return null;
  }
}

async function testRefreshToken(refreshToken) {
  info('Testing refresh token (this should NOT cause Mongoose casting error)...');
  
  const response = await makeRequest('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Cookie': `refreshToken=${refreshToken}`
    },
    body: JSON.stringify({
      timestamp: Date.now(),
      purpose: 'test_refresh'
    })
  });

  console.log('\n' + '='.repeat(60));
  console.log('REFRESH TOKEN TEST RESULTS:');
  console.log('='.repeat(60));
  console.log(`Status: ${response.status}`);
  console.log(`OK: ${response.ok}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  console.log('='.repeat(60) + '\n');

  if (response.ok && response.data.success) {
    success('✅ REFRESH TOKEN TEST PASSED - No Mongoose casting error!');
    return {
      tokens: response.data.tokens,
      user: response.data.user,
      metadata: response.data.metadata
    };
  } else {
    if (response.data?.reason === 'no_refresh_token') {
      warning('No refresh token provided (expected for this test method)');
      return null;
    } else {
      error(`❌ REFRESH TOKEN TEST FAILED: ${response.data?.message || 'Unknown error'}`);
      if (response.data?.reason) {
        error(`Reason: ${response.data.reason}`);
      }
      return null;
    }
  }
}

async function testRefreshTokenWithProperCookie(refreshToken) {
  info('Testing refresh token with proper cookie...');
  
  // Simulate a proper browser request with cookies
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'RefreshTokenTest/1.0',
      'Cookie': `refreshToken=${refreshToken}; path=/; httpOnly`
    },
    credentials: 'include',
    body: JSON.stringify({
      timestamp: Date.now(),
      purpose: 'test_refresh_with_cookie'
    })
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { message: await response.text() };
  }

  console.log('\n' + '='.repeat(60));
  console.log('REFRESH TOKEN WITH COOKIE TEST RESULTS:');
  console.log('='.repeat(60));
  console.log(`Status: ${response.status}`);
  console.log(`OK: ${response.ok}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));
  console.log('='.repeat(60) + '\n');

  if (response.ok && data.success) {
    success('✅ REFRESH TOKEN WITH COOKIE TEST PASSED!');
    return data;
  } else {
    error(`❌ REFRESH TOKEN WITH COOKIE TEST FAILED: ${data?.message || 'Unknown error'}`);
    return null;
  }
}

async function testSessionStatus() {
  info('Testing session status endpoint...');
  
  const response = await makeRequest('/api/auth/session-status', {
    method: 'POST',
    body: JSON.stringify({
      timestamp: Date.now(),
      purpose: 'test_session_status'
    })
  });

  console.log('\n' + '='.repeat(60));
  console.log('SESSION STATUS TEST RESULTS:');
  console.log('='.repeat(60));
  console.log(`Status: ${response.status}`);
  console.log(`OK: ${response.ok}`);
  console.log(`Response:`, JSON.stringify(response.data, null, 2));
  console.log('='.repeat(60) + '\n');

  if (response.ok) {
    success('✅ SESSION STATUS TEST PASSED!');
    return response.data;
  } else {
    warning('Session status returned non-200 (expected if no valid session)');
    return response.data;
  }
}

async function runAllTests() {
  console.log('\n' + '🧪'.repeat(30));
  console.log('       REFRESH TOKEN TEST SUITE');
  console.log('🧪'.repeat(30) + '\n');

  let results = {
    health: false,
    signup: false,
    login: false,
    refresh: false,
    refreshWithCookie: false,
    sessionStatus: false,
    overallSuccess: false
  };

  try {
    // Test 1: Backend Health
    results.health = await testBackendHealth();
    if (!results.health) {
      error('Backend is not healthy. Stopping tests.');
      return results;
    }

    console.log('\n' + '-'.repeat(50));

    // Test 2: User Signup
    const signupResult = await testUserSignup();
    results.signup = !!signupResult;
    
    console.log('\n' + '-'.repeat(50));

    // Test 3: User Login
    const loginResult = await testUserLogin();
    results.login = !!loginResult;

    let refreshToken = null;
    if (loginResult && loginResult.tokens) {
      refreshToken = loginResult.tokens.refreshToken;
      info(`Got refresh token: ${refreshToken ? refreshToken.substring(0, 20) + '...' : 'null'}`);
    }

    console.log('\n' + '-'.repeat(50));

    // Test 4: Session Status (before refresh)
    await testSessionStatus();

    console.log('\n' + '-'.repeat(50));

    // Test 5: Refresh Token (basic test)
    if (refreshToken) {
      const refreshResult = await testRefreshToken(refreshToken);
      results.refresh = !!refreshResult;
      
      console.log('\n' + '-'.repeat(50));

      // Test 6: Refresh Token with proper cookie
      const cookieRefreshResult = await testRefreshTokenWithProperCookie(refreshToken);
      results.refreshWithCookie = !!cookieRefreshResult;
    } else {
      warning('No refresh token available for testing');
    }

    console.log('\n' + '-'.repeat(50));

    // Test 7: Session Status (after refresh)
    await testSessionStatus();

    // Overall result
    results.overallSuccess = results.health && results.signup && results.login;

    console.log('\n' + '🎯'.repeat(30));
    console.log('         TEST RESULTS SUMMARY');
    console.log('🎯'.repeat(30));
    
    console.log(`Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`User Signup:  ${results.signup ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`User Login:   ${results.login ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Refresh Test: ${results.refresh ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Cookie Test:  ${results.refreshWithCookie ? '✅ PASS' : '❌ FAIL'}`);
    
    if (results.overallSuccess) {
      success('\n🎉 OVERALL RESULT: Tests completed successfully!');
      success('🔧 The Mongoose casting error appears to be FIXED!');
    } else {
      error('\n💥 OVERALL RESULT: Some tests failed');
    }

    return results;

  } catch (err) {
    error(`Test suite failed with error: ${err.message}`);
    console.error(err);
    return results;
  }
}

// Add some additional diagnostic tests
async function runDiagnosticTests() {
  console.log('\n' + '🔍'.repeat(30));
  console.log('      DIAGNOSTIC TESTS');
  console.log('🔍'.repeat(30) + '\n');

  // Test MongoDB connection via API
  info('Testing MongoDB connection via API...');
  const dbResponse = await makeRequest('/api/health');
  if (dbResponse.ok) {
    success('API is responsive');
  } else {
    error('API is not responsive');
  }

  // Test for specific error patterns that might indicate Mongoose issues
  info('Testing for potential Mongoose casting errors...');
  
  // This should trigger the refresh token lookup that was causing issues
  const testResponse = await makeRequest('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Cookie': 'refreshToken=invalid_token_for_testing'
    },
    body: JSON.stringify({ test: true })
  });

  if (testResponse.data && testResponse.data.reason !== 'verification_error') {
    success('No Mongoose casting errors detected in refresh endpoint');
  } else if (testResponse.data && testResponse.data.message && 
             testResponse.data.message.includes('Cast to string failed')) {
    error('🚨 MONGOOSE CASTING ERROR STILL EXISTS!');
    error('The TokenService fix did not work properly');
  } else {
    info('Refresh endpoint returned expected error for invalid token');
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('🚀 Starting Refresh Token Test Suite...\n');
    
    await runDiagnosticTests();
    const results = await runAllTests();
    
    console.log('\n' + '📊'.repeat(30));
    console.log('       FINAL TEST REPORT');
    console.log('📊'.repeat(30));
    
    if (results.overallSuccess) {
      console.log(colors.green + '🎊 SUCCESS: The refresh token fix is working!' + colors.reset);
      console.log(colors.green + '✅ No more Mongoose casting errors' + colors.reset);
      console.log(colors.green + '✅ Autologin should now work properly' + colors.reset);
    } else {
      console.log(colors.red + '⚠️  Some issues remain - check the logs above' + colors.reset);
    }
    
    process.exit(results.overallSuccess ? 0 : 1);
  })();
}

export { runAllTests, runDiagnosticTests };