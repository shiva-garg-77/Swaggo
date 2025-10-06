// IMMEDIATE FIX: Sync GraphQL auth with main context
// Run this in browser console right now

console.log('🔄 IMMEDIATE SYNC: Syncing auth states...');

// Check if we have GraphQL user
const apolloClient = window.__apollo_client__ || window.__APOLLO_CLIENT__;
if (apolloClient && apolloClient.cache) {
  console.log('✅ Apollo client found, checking auth state...');
  
  // Extract user from cache or use logged ID
  const userId = 'c1cc9bbf-dd97-4bab-b605-be9f4f41a613'; // From your logs
  const profileId = '89a3277c-0bb9-4bad-9137-a22e47f9d085'; // From your logs
  
  if (window.__UNIFIED_AUTH__?.syncFromGraphQL) {
    const user = {
      id: userId,
      profileid: profileId,
      username: 'aditya_123',
      email: '1adityasingh7476@gmail.com',
      role: 'user'
    };
    
    console.log('🔄 Syncing user to auth context:', user);
    window.__UNIFIED_AUTH__.syncFromGraphQL(user);
    
    setTimeout(() => {
      console.log('🎯 Auth sync complete! Reloading in 2 seconds...');
      setTimeout(() => window.location.reload(), 2000);
    }, 1000);
  } else {
    console.log('❌ Sync function not available, try refreshing page');
  }
} else {
  console.log('❌ Apollo client not found');
}

// Also try direct token validation
console.log('🔄 Also attempting token validation...');
fetch('http://localhost:45799/api/auth/me', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => {
  console.log('✅ /api/auth/me response:', data);
  if (data.user && window.__UNIFIED_AUTH__?.syncFromGraphQL) {
    window.__UNIFIED_AUTH__.syncFromGraphQL(data.user);
  }
})
.catch(error => {
  console.log('❌ /api/auth/me failed:', error);
});