/**
 * Quick Login & Cookie Test Script
 * Tests if login properly sets accessToken cookie
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:45799';

async function testLogin() {
  console.log('🧪 Testing Login & Cookie Setting...\n');
  
  try {
    // Test login
    console.log('1️⃣ Attempting login...');
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: 'testuser',
        password: 'TestPassword123!'
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    // Check Set-Cookie headers
    const setCookieHeaders = response.headers.raw()['set-cookie'];
    console.log('\n2️⃣ Checking Set-Cookie headers...');
    console.log(`   Found ${setCookieHeaders ? setCookieHeaders.length : 0} Set-Cookie headers`);
    
    if (setCookieHeaders) {
      console.log('\n3️⃣ Cookie details:');
      setCookieHeaders.forEach((cookie, index) => {
        const cookieName = cookie.split('=')[0];
        const hasHttpOnly = cookie.includes('HttpOnly');
        const hasSecure = cookie.includes('Secure');
        const hasSameSite = cookie.includes('SameSite');
        
        console.log(`   ${index + 1}. ${cookieName}`);
        console.log(`      HttpOnly: ${hasHttpOnly}`);
        console.log(`      Secure: ${hasSecure}`);
        console.log(`      SameSite: ${hasSameSite}`);
        console.log(`      Preview: ${cookie.substring(0, 100)}...`);
      });
      
      // Check for accessToken
      const hasAccessToken = setCookieHeaders.some(cookie => 
        cookie.startsWith('accessToken=') || 
        cookie.startsWith('__Host-accessToken=') || 
        cookie.startsWith('__Secure-accessToken=')
      );
      
      const hasRefreshToken = setCookieHeaders.some(cookie => 
        cookie.startsWith('refreshToken=') || 
        cookie.startsWith('__Host-refreshToken=') || 
        cookie.startsWith('__Secure-refreshToken=')
      );
      
      const hasCsrfToken = setCookieHeaders.some(cookie => 
        cookie.startsWith('csrfToken=') || 
        cookie.startsWith('__Host-csrfToken=') || 
        cookie.startsWith('__Secure-csrfToken=')
      );
      
      console.log('\n4️⃣ Required cookies:');
      console.log(`   ${hasAccessToken ? '✅' : '❌'} accessToken`);
      console.log(`   ${hasRefreshToken ? '✅' : '❌'} refreshToken`);
      console.log(`   ${hasCsrfToken ? '✅' : '❌'} csrfToken`);
      
      if (hasAccessToken && hasRefreshToken && hasCsrfToken) {
        console.log('\n🎉 SUCCESS: All required cookies are set!');
        return true;
      } else {
        console.log('\n❌ FAILURE: Some required cookies are missing!');
        return false;
      }
    } else {
      console.log('\n❌ FAILURE: No Set-Cookie headers found!');
      console.log('   This means cookies are not being set by the backend.');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return false;
  }
}

// Run test
testLogin().then(success => {
  process.exit(success ? 0 : 1);
});
