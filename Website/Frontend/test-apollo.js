// Test script to check if Apollo Client is working correctly
console.log('Testing Apollo Client...');

try {
  // Try to import Apollo Client
  const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');
  console.log('✅ Apollo Client modules loaded successfully');
  
  // Try to create a simple client
  const client = new ApolloClient({
    uri: 'http://localhost:45799/graphql',
    cache: new InMemoryCache()
  });
  
  console.log('✅ Apollo Client instance created successfully');
  
  // Try to import required dependencies
  const { Observable } = require('rxjs');
  console.log('✅ RxJS Observable loaded successfully');
  
  const { wrap } = require('optimism');
  console.log('✅ Optimism loaded successfully');
  
  const { WeakCache } = require('@wry/caches');
  console.log('✅ @wry/caches loaded successfully');
  
  console.log('\n🎉 All Apollo Client dependencies loaded successfully!');
  
} catch (error) {
  console.error('❌ Error loading Apollo Client:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}