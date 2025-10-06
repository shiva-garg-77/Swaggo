/**
 * Quick Network Test Script
 * Run this in the browser console to diagnose network issues
 */

const testNetworkConnectivity = async () => {
  console.log('🔍 Starting network connectivity test...');
  
  // Test 1: Backend Health
  try {
    console.log('Testing backend health...');
    const healthResponse = await fetch('http://localhost:45799/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend health:', healthData);
    } else {
      console.error('❌ Backend health failed:', healthResponse.status);
    }
  } catch (error) {
    console.error('❌ Backend unreachable:', error.message);
  }
  
  // Test 2: GraphQL Direct
  try {
    console.log('Testing GraphQL direct...');
    const directResponse = await fetch('http://localhost:45799/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query { hello }' })
    });
    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log('✅ GraphQL direct:', directData);
    } else {
      console.error('❌ GraphQL direct failed:', directResponse.status);
    }
  } catch (error) {
    console.error('❌ GraphQL direct error:', error.message);
  }
  
  // Test 3: GraphQL Proxy
  try {
    console.log('Testing GraphQL proxy...');
    const proxyResponse = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query { hello }' })
    });
    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      console.log('✅ GraphQL proxy:', proxyData);
    } else {
      console.error('❌ GraphQL proxy failed:', proxyResponse.status);
    }
  } catch (error) {
    console.error('❌ GraphQL proxy error:', error.message);
  }
  
  // Test 4: Socket.IO
  try {
    console.log('Testing Socket.IO...');
    const socketResponse = await fetch('http://localhost:45799/socket.io/');
    console.log('📊 Socket.IO status:', socketResponse.status, '(400 is expected)');
  } catch (error) {
    console.error('❌ Socket.IO error:', error.message);
  }
  
  console.log('🔍 Network test complete. Check results above.');
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.testNetworkConnectivity = testNetworkConnectivity;
  console.log('💡 Run testNetworkConnectivity() in console to test connectivity');
}

export default testNetworkConnectivity;