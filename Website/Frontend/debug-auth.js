// Debug Authentication State
// Run this in browser console to check auth state

console.log('=== AUTHENTICATION DEBUG ===');

// Check cookies
console.log('1. Checking cookies:');
const cookies = document.cookie;
console.log('All cookies:', cookies);

const accessToken = getCookie('__Host-accessToken') || getCookie('accessToken');
const refreshToken = getCookie('__Host-refreshToken') || getCookie('refreshToken'); 
const csrfToken = getCookie('__Host-csrfToken') || getCookie('csrfToken');

console.log('Access Token Present:', !!accessToken);
console.log('Refresh Token Present:', !!refreshToken);
console.log('CSRF Token Present:', !!csrfToken);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Check API connectivity
console.log('\n2. Testing API connectivity:');
fetch('http://localhost:45799/health', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => {
  console.log('Health check:', data);
})
.catch(error => {
  console.error('Health check failed:', error);
});

// Check session status
console.log('\n3. Testing session status:');
fetch('http://localhost:45799/api/auth/session-status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken || ''
  },
  credentials: 'include',
  body: JSON.stringify({
    timestamp: Date.now(),
    purpose: 'debug_check'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Session status response:', data);
  console.log('User present in response:', !!data.user);
  console.log('User profileid:', data.user?.profileid);
})
.catch(error => {
  console.error('Session status failed:', error);
});

// Check auth context state
console.log('\n4. Checking auth context state:');
if (window.__UNIFIED_AUTH__) {
  console.log('Unified auth available:', true);
  console.log('Is authenticated:', window.__UNIFIED_AUTH__.isAuthenticated());
  console.log('User data:', window.__UNIFIED_AUTH__.user());
} else {
  console.log('Unified auth not available');
}