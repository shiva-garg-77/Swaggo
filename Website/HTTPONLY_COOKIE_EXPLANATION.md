# 🔒 HttpOnly Cookie Explanation - Why You Can't See accessToken

## The "Problem" (It's Actually Correct!)

You're seeing this in browser cookies:
- ✅ `csrfToken` - **VISIBLE** in `document.cookie`
- ❌ `accessToken` - **INVISIBLE** in `document.cookie`
- ❌ `refreshToken` - **INVISIBLE** in `document.cookie`

**This is CORRECT and SECURE behavior!**

## Why HttpOnly Cookies Are Invisible

### What is HttpOnly?

HttpOnly is a security flag on cookies that prevents JavaScript from reading them:

```javascript
// Backend sets cookie with HttpOnly flag
res.cookie('accessToken', token, {
  httpOnly: true,  // ← This makes it invisible to JavaScript
  secure: true,
  sameSite: 'strict'
});
```

### Why Use HttpOnly?

**Security**: Prevents XSS (Cross-Site Scripting) attacks from stealing authentication tokens.

If a malicious script is injected into your page:
```javascript
// ❌ This CANNOT steal HttpOnly cookies
const stolenToken = document.cookie; // Won't include accessToken!

// ✅ But it CAN steal non-HttpOnly cookies
const csrfToken = document.cookie; // Will include csrfToken
```

### Why CSRF Token is NOT HttpOnly?

The CSRF token needs to be:
1. Read by JavaScript
2. Included in request headers: `X-CSRF-Token: <token>`

So it's set with `httpOnly: false`:
```javascript
res.cookie('csrfToken', token, {
  httpOnly: false,  // ← JavaScript can read this
  secure: true,
  sameSite: 'strict'
});
```

## How Authentication Works with HttpOnly Cookies

### 1. Login Flow
```
User logs in
    ↓
Backend generates tokens
    ↓
Backend sets cookies:
  - accessToken (HttpOnly: true) ← Invisible to JS
  - refreshToken (HttpOnly: true) ← Invisible to JS
  - csrfToken (HttpOnly: false) ← Visible to JS
    ↓
Browser stores ALL cookies
    ↓
JavaScript can only see csrfToken
```

### 2. Socket Connection Flow
```
Frontend initiates socket connection
    ↓
Browser AUTOMATICALLY sends ALL cookies
(including HttpOnly ones)
    ↓
Backend receives cookies in handshake
    ↓
Backend extracts accessToken from cookies
    ↓
Backend authenticates user
    ↓
Socket connection succeeds!
```

### 3. Key Point: Browser Handles HttpOnly Cookies

```javascript
// Frontend code
const socket = io('http://localhost:45799', {
  withCredentials: true  // ← Browser sends ALL cookies automatically
});

// Browser automatically includes in request:
// Cookie: accessToken=...; refreshToken=...; csrfToken=...
```

**You don't need to manually send HttpOnly cookies - the browser does it!**

## Verification Steps

### 1. Check Browser DevTools

**Application > Cookies**:
- ✅ You SHOULD see: `accessToken`, `refreshToken`, `csrfToken`
- ✅ HttpOnly column should be checked for `accessToken` and `refreshToken`
- ❌ HttpOnly column should be unchecked for `csrfToken`

### 2. Check JavaScript Console

```javascript
// This will ONLY show csrfToken
console.log(document.cookie);
// Output: "csrfToken=XbFUPRg6-NhZWVkIwBT06rZTcQ6G6co41xds..."

// accessToken and refreshToken are INVISIBLE (this is correct!)
```

### 3. Check Network Tab

**Look at socket connection request**:
- Headers > Request Headers > Cookie
- You SHOULD see: `accessToken=...; refreshToken=...; csrfToken=...`

Even though JavaScript can't see them, the browser sends them!

## Common Misconceptions

### ❌ Misconception 1: "No accessToken cookie means login failed"
**Reality**: The cookie IS there, just invisible to JavaScript for security.

### ❌ Misconception 2: "I need to read accessToken in JavaScript"
**Reality**: You should NEVER read auth tokens in JavaScript. The browser handles it.

### ❌ Misconception 3: "Socket won't work without seeing the cookie"
**Reality**: Socket works fine. Browser sends HttpOnly cookies automatically.

## Troubleshooting

### Issue: Socket connection fails with "No authentication tokens"

**Check**:
1. **Browser DevTools > Application > Cookies**
   - Do you see `accessToken` cookie?
   - Is HttpOnly checked?

2. **Network Tab > Socket Request > Headers**
   - Does Cookie header include `accessToken=...`?

3. **Backend Logs**
   - Does it show "Found access token in cookie"?

### Issue: Cookies not visible in DevTools

**Possible Causes**:
1. Login failed (check response status)
2. Cookies expired
3. Wrong domain/path
4. CORS issue (credentials not included)

**Solution**:
```javascript
// Ensure credentials are included in requests
fetch('/api/login', {
  credentials: 'include'  // ← Required for cookies
});

// For socket
io('http://localhost:45799', {
  withCredentials: true  // ← Required for cookies
});
```

## Security Best Practices

### ✅ DO:
- Use HttpOnly for authentication tokens
- Use Secure flag in production (HTTPS)
- Use SameSite=Strict or Lax
- Let browser handle cookie transmission

### ❌ DON'T:
- Store auth tokens in localStorage (vulnerable to XSS)
- Make auth tokens readable by JavaScript
- Try to manually send HttpOnly cookies
- Disable HttpOnly for convenience

## Summary

**The "missing" accessToken cookie is actually there!**

1. ✅ Backend sets it with HttpOnly flag
2. ✅ Browser stores it securely
3. ✅ JavaScript cannot see it (security feature)
4. ✅ Browser sends it automatically with requests
5. ✅ Backend receives it and authenticates user

**This is the CORRECT and SECURE way to handle authentication!**

---

## Quick Test

Run this in browser console after login:

```javascript
// Check visible cookies
console.log('Visible cookies:', document.cookie);
// Should show: csrfToken=...

// Check if browser has HttpOnly cookies
// (You can't read them, but you can check DevTools)
console.log('Check DevTools > Application > Cookies for:');
console.log('- accessToken (HttpOnly: ✓)');
console.log('- refreshToken (HttpOnly: ✓)');
console.log('- csrfToken (HttpOnly: ✗)');
```

---

**Status**: ✅ Working as Designed  
**Security**: ✅ 10/10 Secure  
**Issue**: ❌ No Issue - This is correct behavior!
