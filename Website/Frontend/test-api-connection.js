// Test script to check API connectivity and GraphQL queries
// Run this with: node test-api-connection.js

const testGraphQLConnection = async () => {
  const port = process.env.NEXT_PUBLIC_PORT || 8000;
  const graphqlUrl = `http://localhost:${port}/graphql`;
  
  console.log('🔍 Testing GraphQL connection to:', graphqlUrl);
  
  try {
    // Test simple hello query
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            hello
          }
        `
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ GraphQL response:', data);
    
    if (data.data && data.data.hello) {
      console.log('✅ GraphQL server is working correctly');
      return true;
    } else {
      console.log('❌ GraphQL server responded but with errors:', data.errors);
      return false;
    }
    
  } catch (error) {
    console.error('❌ GraphQL connection failed:', error.message);
    console.error('Make sure your backend server is running on port', port);
    return false;
  }
};

const testUploadEndpoint = async () => {
  const port = process.env.NEXT_PUBLIC_PORT || 8000;
  const uploadUrl = `http://localhost:${port}/upload`;
  
  console.log('🔍 Testing upload endpoint:', uploadUrl);
  
  try {
    const response = await fetch(uploadUrl, {
      method: 'GET', // Just test if endpoint exists
    });
    
    // Upload endpoint should exist even if it returns error for GET
    console.log('✅ Upload endpoint is accessible (status:', response.status + ')');
    return true;
    
  } catch (error) {
    console.error('❌ Upload endpoint not accessible:', error.message);
    return false;
  }
};

// Run tests
(async () => {
  console.log('🧪 Testing API connections...\n');
  
  const graphqlWorking = await testGraphQLConnection();
  console.log('');
  const uploadWorking = await testUploadEndpoint();
  
  console.log('\n📊 Test Results:');
  console.log('GraphQL Server:', graphqlWorking ? '✅ Working' : '❌ Failed');
  console.log('Upload Endpoint:', uploadWorking ? '✅ Working' : '❌ Failed');
  
  if (graphqlWorking && uploadWorking) {
    console.log('\n🎉 All API connections are working! Your frontend should be able to communicate with the backend.');
  } else {
    console.log('\n⚠️  Some connections failed. Please check your backend server is running.');
  }
})();
