# 🧪 SOCKET CONNECTION TEST PLAN

## Test Scenarios

### Test 1: Fresh Page Load
1. Clear all cookies
2. Navigate to http://localhost:3000
3. Log in with credentials
4. **Expected Results:**
   - ✅ Session-status endpoint returns user data
   - ✅ Cookies are set in response (accessToken, refreshToken, csrfToken)
   - ✅ Frontend receives cookies
   - ✅ Socket provider finds access token cookie
   - ✅ Socket connection is established
   - ✅ Backend logs show socket connection attempt
   - ✅ Socket authentication succeeds

### Test 2: Hard Reload (Ctrl+Shift+R)
1. After successful login and socket connection
2. Press Ctrl+Shift+R (hard reload)
3. **Expected Results:**
   - ✅ Session-status endpoint validates existing cookies
   - ✅ Cookies are re-set in response
   - ✅ Socket reconnects within 2 seconds
   - ✅ No authentication errors

### Test 3: Soft Reload (F5)
1. After successful login and socket connection
2. Press F5 (soft reload)
3. **Expected Results:**
   - ✅ Session-status endpoint validates existing cookies
   - ✅ Cookies are re-set in response
   - ✅ Socket reconnects within 1 second
   - ✅ No authentication errors

### Test 4: Navigate Between Pages
1. After successful login and socket connection
2. Navigate to different pages (home, profile, messages)
3. **Expected Results:**
   - ✅ Socket connection persists
   - ✅ No reconnection attempts
   - ✅ Real-time features work

## Debug Checklist

### Backend Logs to Check:
- [ ] `🍪 CRITICAL FIX: Re-setting authentication cookies for socket connection...`
- [ ] `✅ Authentication cookies re-set successfully for socket connection`
- [ ] `🔐 Setting cookie: accessToken with value:...`
- [ ] `🔌 SOCKET AUTH: NEW CONNECTION ATTEMPT STARTED`
- [ ] `✅ SOCKET AUTH: AUTHENTICATION SUCCESSFUL!`

### Frontend Console Logs to Check:
- [ ] `✅ Session status check successful:`
- [ ] `🍪 Cookie verification before socket-ready dispatch:`
- [ ] `🎉 AUTH CONTEXT: auth-socket-ready event dispatched!`
- [ ] `🍪 Cookie check attempt 1/5:`
- [ ] `✅ Access token cookie found! Proceeding with socket initialization...`
- [ ] `🔌 PerfectSocketProvider: Creating socket instance...`
- [ ] `✅ SOCKET: Connection established`

### Browser DevTools to Check:
1. **Application Tab → Cookies:**
   - [ ] `accessToken` cookie present
   - [ ] `refreshToken` cookie present
   - [ ] `csrfToken` cookie present
   - [ ] All cookies have proper flags (HttpOnly, Secure if HTTPS, SameSite)

2. **Network Tab:**
   - [ ] `/api/v1/auth/session-status` request shows 200 OK
   - [ ] Response headers include `Set-Cookie` headers
   - [ ] Socket.io polling requests show 200 OK
   - [ ] Socket.io upgrade to WebSocket succeeds

3. **Console Tab:**
   - [ ] No "Socket initialization aborted" errors
   - [ ] No CORS errors
   - [ ] No authentication errors

## Common Issues and Solutions

### Issue: "Socket initialization aborted - no access token cookie"
**Solution:** Check if session-status endpoint is setting cookies in response

### Issue: Cookies not visible in document.cookie
**Solution:** Check if cookies have HttpOnly flag (they won't be visible in JS)

### Issue: Socket connects but immediately disconnects
**Solution:** Check backend socket authentication logs for errors

### Issue: CORS errors
**Solution:** Verify FRONTEND_URLS in backend .env.local includes http://localhost:3000

## Performance Metrics

- **Target:** Socket connection within 2 seconds of page load
- **Acceptable:** Socket connection within 3 seconds
- **Unacceptable:** Socket connection takes more than 5 seconds or fails

## Success Criteria

All tests pass with:
- ✅ 100% socket connection success rate
- ✅ No authentication errors
- ✅ No cookie-related errors
- ✅ Connection time < 2 seconds
- ✅ Reconnection time < 1 second
