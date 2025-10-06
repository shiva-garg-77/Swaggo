// QUICK FIX: Force token refresh in browser console
// Run this in your browser console right now

console.log('🔄 QUICK FIX: Forcing token refresh...');

fetch('http://localhost:45799/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    timestamp: Date.now(),
    purpose: 'manual_refresh'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Token refresh result:', data);
  if (data.success) {
    console.log('🎉 Tokens refreshed! Reload the page.');
    // Auto-reload after 1 second
    setTimeout(() => window.location.reload(), 1000);
  } else {
    console.log('❌ Refresh failed, you may need to login again');
  }
})
.catch(error => {
  console.error('❌ Refresh error:', error);
  console.log('💡 Try logging in again manually');
});