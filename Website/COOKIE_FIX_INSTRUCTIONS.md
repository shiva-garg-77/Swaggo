# 🍪 Cookie Authentication Fix - Step by Step

## Problem
Frontend shows "Access token not found" even though user is logged in. The `csrfToken` cookie is present but `accessToken` is missing.

## Root Cause
The `accessToken` cookie is not being set properly by the backend after login, or the frontend is not detecting it correctly.

## Solution Applied

### 1. Enhanced Backend Cookie Setting
**File**: `Website/Backend/Middleware/Authentication/AuthenticationMiddleware.js`

**Changes**:
- Added validation to ensure `accessToken` is a valid string before setting cookie
- Added detailed logging for cookie setting process
- Added verification of Set-Cookie headers in response
- Throws error if token is undefined or invalid

### 2. Enhanced Frontend Cookie Detection
**File**: `Website/Frontend/Components/Helper/PerfectSocketProvider.jsx`

**Changes**:
- Improved cookie detection with regex patterns
- Added support for all cookie name formats (accessToken, __Host-accessToken, __Secure-accessToken)
- Enhanced debugging to show all cookie names
- Better error messages

## Testing Steps

### Step 1: Test Backend Cookie Setting
```bash
cd Website
node test-login-cookies.js
```

**Expected Output**:
```
🧪 Testing Login & Cookie Setting...

1️⃣ Attempting login...
   Status: 200 OK

2️⃣ Checking Set-Cookie headers...
   Found 3 Set-Cookie headers

3️⃣ Cookie details:
   1. accessToken
      HttpOnly: true
      Secure: false
      SameSite: true
   2. refreshToken
      HttpOnly: true
      Secure: false
      SameSite: true
   3. csrfToken
      HttpOnly: false
      Secure: false
      SameSite: true

4️⃣ Required cookies:
   ✅ accessToken
   ✅ refreshToken
   ✅ csrfToken

🎉 SUCCESS: All required cookies are set!
```

### Step 2: Check Backend Logs
After login, check backend console for:
```
🔐 Setting cookie: accessToken
🔐 Cookie value preview: swg_at_...
✅ Successfully set accessToken cookie
🔍 VERIFICATION: Set-Cookie headers in response: { hasSetCookie: true, headerCount: 3 }
```

### Step 3: Check Frontend Browser Console
After login, check browser console for:
```
🍪 Cookie check attempt 1/15: {
  cookieNames: ['__next_hmr_refresh_hash__', 'csrfToken', 'accessToken'],
  lookingFor: ['accessToken', '__Host-accessToken', '__Secure-accessToken']
}
✅ Access token found matching pattern: /\baccessToken=/
✅ Access token cookie found! Proceeding with socket initialization...
```

### Step 4: Check Browser DevTools
1. Open DevTools (F12)
2. Go to Application > Cookies
3. Check for cookies:
   - ✅ `accessToken` (or `__Host-accessToken` in HTTPS)
   - ✅ `refreshToken` (or `__Host-refreshToken` in HTTPS)
   - ✅ `csrfToken` (or `__Host-csrfToken` in HTTPS)

## Troubleshooting

### Issue: "No Set-Cookie headers found"
**Cause**: Backend is not setting cookies
**Solution**:
1. Check backend logs for errors in `setAuthenticationCookies()`
2. Verify `tokens.accessToken` is not undefined
3. Check if `res.cookie()` is working properly

### Issue: "Access token not found" in frontend
**Cause**: Cookie name mismatch or cookie not sent to frontend
**Solution**:
1. Check cookie name in backend logs (should be `accessToken` in HTTP, `__Host-accessToken` in HTTPS)
2. Verify cookie is visible in browser DevTools
3. Check if cookie has correct `Path=/` and `Domain` settings
4. Verify `SameSite` policy allows cookie to be sent

### Issue: Cookie set but not visible in browser
**Cause**: CORS or cookie policy issue
**Solution**:
1. Verify `credentials: 'include'` in frontend fetch/axios requests
2. Check CORS headers allow credentials: `Access-Control-Allow-Credentials: true`
3. Verify frontend and backend are on same domain or CORS is properly configured
4. Check if `SameSite=None` requires `Secure=true` (HTTPS)

### Issue: Cookie visible but socket still disconnected
**Cause**: Socket not sending cookies in handshake
**Solution**:
1. Verify socket options include `withCredentials: true`
2. Check socket URL matches backend URL
3. Verify cookies are sent in socket handshake (check backend logs)
4. Check `extractSocketTokens()` is finding the cookie

## Manual Fix (If Automated Fix Doesn't Work)

### Backend Fix
Edit `Website/Backend/Middleware/Authentication/AuthenticationMiddleware.js`:

```javascript
// Around line 1203, replace:
res.cookie(`${cookiePrefix}accessToken`, tokens.accessToken, {
  ...baseCookieOptions,
  maxAge: accessTokenMaxAge
});

// With:
if (!tokens.accessToken || typeof tokens.accessToken !== 'string') {
  throw new Error('Invalid accessToken for cookie setting');
}
res.cookie(`${cookiePrefix}accessToken`, tokens.accessToken, {
  ...baseCookieOptions,
  maxAge: accessTokenMaxAge
});
console.log('✅ Set accessToken cookie:', `${cookiePrefix}accessToken`);
```

### Frontend Fix
Edit `Website/Frontend/Components/Helper/PerfectSocketProvider.jsx`:

```javascript
// Around line 730, replace cookie check with:
const cookiePatterns = [
  /\baccessToken=/,
  /__Host-accessToken=/,
  /__Secure-accessToken=/
];
hasAccessToken = cookiePatterns.some(pattern => pattern.test(allCookies));
```

## Verification Checklist

After applying fixes:
- [ ] Backend test passes: `node test-login-cookies.js`
- [ ] Backend logs show "✅ Successfully set accessToken cookie"
- [ ] Backend logs show "Set-Cookie headers in response: { hasSetCookie: true }"
- [ ] Frontend logs show "✅ Access token found matching pattern"
- [ ] Browser DevTools shows `accessToken` cookie
- [ ] Socket connection succeeds
- [ ] No "Access token not found" errors

## Next Steps

1. **If test passes but socket still fails**:
   - Check socket authentication middleware
   - Verify `extractSocketTokens()` is working
   - Check backend socket logs for cookie extraction

2. **If test fails**:
   - Check if login route is calling `setAuthenticationCookies()`
   - Verify token generation is working
   - Check for errors in backend logs

3. **If cookies are set but not visible in browser**:
   - Check CORS configuration
   - Verify `credentials: 'include'` in requests
   - Check cookie `Domain` and `Path` settings

## Success Criteria

✅ All three cookies are set after login  
✅ Cookies are visible in browser DevTools  
✅ Frontend detects `accessToken` cookie  
✅ Socket connection succeeds  
✅ No authentication errors  

---

**Status**: Fixes Applied  
**Date**: 2025-01-XX  
**Next**: Run `node test-login-cookies.js` to verify
