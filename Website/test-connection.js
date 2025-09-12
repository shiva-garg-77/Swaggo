#!/usr/bin/env node

// Simple script to test backend connection
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:45799';

console.log('🔍 Testing SwagGo Backend Connection...\n');

async function testConnection() {
  try {
    console.log(`📡 Testing connection to: ${BACKEND_URL}`);
    
    // Test basic endpoint
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test GraphQL endpoint
    const graphqlResponse = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }'
      })
    });
    
    if (graphqlResponse.ok) {
      console.log('✅ GraphQL endpoint is responsive');
    } else {
      console.log('⚠️ GraphQL endpoint returned:', graphqlResponse.status);
    }
    
    console.log('\n🎉 Backend server is running and accessible!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure frontend is running on port 3000');
    console.log('2. Open http://localhost:3000/chat-test');
    console.log('3. Check browser console for connection details');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🚨 Troubleshooting steps:');
    console.log('1. Make sure backend server is running: npm run dev (in Backend folder)');
    console.log('2. Check if port 45799 is being used by backend');
    console.log('3. Verify .env.local file has PORT=45799');
    console.log('4. Try accessing http://localhost:45799 in your browser');
  }
}

testConnection();
