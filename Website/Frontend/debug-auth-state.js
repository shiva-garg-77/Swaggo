// IMMEDIATE AUTH DEBUG - Run in console
console.log('🔍 DEBUGGING AUTH STATE...');

// 1. Check auth context state
if (window.__UNIFIED_AUTH__) {
  console.log('✅ Unified auth available');
  console.log('Is authenticated:', window.__UNIFIED_AUTH__.isAuthenticated());
  console.log('User data:', window.__UNIFIED_AUTH__.user());
} else {
  console.log('❌ Unified auth NOT available');
}

// 2. Check cookies
console.log('🍪 Cookies:', document.cookie);

// 3. Test direct session status
fetch('/api/auth/session-status', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ timestamp: Date.now(), purpose: 'debug' })
})
.then(r => r.json())
.then(data => {
  console.log('📡 Session status:', data);
})
.catch(err => {
  console.log('❌ Session status error:', err);
});

// 4. Test user search
fetch('/graphql', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query SearchUsers($query: String!, $limit: Int) {
      searchUsers(query: $query, limit: $limit) {
        profileid
        username
        name
        profilePic
      }
    }`,
    variables: { query: 'shiva', limit: 10 }
  })
})
.then(r => r.json())
.then(data => {
  console.log('🔍 User search result:', data);
})
.catch(err => {
  console.log('❌ User search error:', err);
});