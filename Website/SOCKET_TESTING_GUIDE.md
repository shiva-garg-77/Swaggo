# 🧪 Socket Connection Testing Guide

## Quick Start

### 1. Start Backend Server
```bash
cd Website/Backend
npm install
npm start
```

**Expected Output**:
```
✅ Connected to MongoDB database
✅ Redis cache service initialized successfully
🚀 Starting Apollo Server...
✅ BACKEND: Socket.IO server created with configuration
🔐 BACKEND: Socket.IO authentication middleware applied
✅ BACKEND: Socket.IO connection handler registered in SocketController
Server started on port 45799
```

### 2. Start Frontend Server
```bash
cd Website/Frontend
npm install
npm run dev
```

**Expected Output**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3. Run Automated Tests
```bash
cd Website/Backend
node test-socket-connection.js
```

**Expected Output**:
```
═══════════════════════════════════════════════════════
  COMPREHENSIVE SOCKET CONNECTION TEST SUITE
  Testing all 40 socket connection issues
═══════════════════════════════════════════════════════

✅ PASS Backend Server Running
✅ PASS CORS Configuration
✅ PASS Socket.IO Endpoint Accessible
✅ PASS User Authentication & Cookie Setting
✅ PASS Socket Connection with Cookies
✅ PASS Socket Reconnection Logic
✅ PASS Message Sending & Receiving
✅ PASS Heartbeat Mechanism

═══════════════════════════════════════════════════════
  TEST SUMMARY
═══════════════════════════════════════════════════════

✅ Passed: 8
❌ Failed: 0
⊘  Skipped: 0
   Total: 8

Success Rate: 100.0%

🎉 ALL TESTS PASSED! Socket connection is 10/10 perfect!
```

---

## Manual Testing Steps

### Test 1: Basic Connection
1. Open browser to `http://localhost:3000`
2. Open browser console (F12)
3. Login with test credentials
4. Look for socket connection logs:
   ```
   🚀 PerfectSocketProvider: COMPONENT INITIALIZING
   🔐 PerfectSocketProvider: Auth state: { isAuthenticated: true, hasUser: true }
   🔌 PerfectSocketProvider: Creating socket instance...
   ✅ SOCKET: Connection established
   ```

### Test 2: Cookie Authentication
1. After login, check cookies in DevTools (Application > Cookies)
2. Verify presence of:
   - `accessToken` or `__Host-accessToken` or `__Secure-accessToken`
   - `refreshToken` or `__Host-refreshToken` or `__Secure-refreshToken`
3. Check backend logs for:
   ```
   🔍 SOCKET AUTH: Extracting tokens from socket handshake...
   ✅ SOCKET AUTH: Found access token in cookie: accessToken
   ✅ SOCKET AUTH: AUTHENTICATION SUCCESSFUL!
   ```

### Test 3: Message Sending
1. Navigate to a chat
2. Send a message
3. Check console for:
   ```
   📤 Sending message: { content: "test message" }
   ✅ Message sent successfully
   📩 New message received
   ```

### Test 4: Reconnection
1. Open Network tab in DevTools
2. Throttle network to "Slow 3G"
3. Wait for disconnect
4. Restore network
5. Check for automatic reconnection:
   ```
   ❌ SOCKET: Disconnected from server
   🔄 Reconnecting in 1000ms (attempt 1/5)
   ✅ SOCKET: Connection established
   ```

### Test 5: Heartbeat
1. Keep browser open for 30+ seconds
2. Check console for heartbeat logs:
   ```
   💗 Heartbeat received and responded
   ```

---

## Troubleshooting

### Issue: "Backend Server Not Running"
**Solution**:
```bash
cd Website/Backend
npm start
```
Verify port 45799 is not in use:
```bash
# Windows
netstat -ano | findstr :45799

# Linux/Mac
lsof -i :45799
```

### Issue: "No Access Token Cookie Found"
**Symptoms**: Socket connection fails with authentication error

**Solution**:
1. Clear all cookies
2. Logout and login again
3. Check backend logs for cookie setting:
   ```
   Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict
   ```

### Issue: "CORS Origin Not Allowed"
**Symptoms**: Connection blocked by CORS

**Solution**:
1. Check `Website/Backend/.env.local`:
   ```
   FRONTEND_URLS=http://localhost:3000,http://localhost:3001
   ```
2. Restart backend server
3. Verify CORS headers in Network tab

### Issue: "Connection Timeout"
**Symptoms**: Socket connection times out after 15 seconds

**Solution**:
1. Check firewall settings
2. Verify backend is accessible:
   ```bash
   curl http://localhost:45799/health
   ```
3. Check backend logs for errors
4. Increase timeout in `PerfectSocketProvider.jsx`:
   ```javascript
   timeout: 30000, // Increase to 30 seconds
   ```

### Issue: "Authentication Failed"
**Symptoms**: Socket connects but authentication fails

**Solution**:
1. Check token expiration
2. Verify user exists in database
3. Check backend logs for authentication errors
4. Try refreshing tokens:
   ```javascript
   // In browser console
   localStorage.clear();
   location.reload();
   ```

---

## Debug Mode

### Enable Verbose Logging

**Backend** (`Website/Backend/main.js`):
```javascript
// Add at top of file
process.env.DEBUG = 'socket.io:*';
```

**Frontend** (`Website/Frontend/Components/Helper/PerfectSocketProvider.jsx`):
```javascript
// Change ENABLE_METRICS
ENABLE_METRICS: true, // Always enable for debugging
```

### Check Socket.IO Debug Logs

**Backend**:
```bash
DEBUG=socket.io:* npm start
```

**Frontend**:
```javascript
// In browser console
localStorage.debug = 'socket.io-client:*';
location.reload();
```

---

## Performance Testing

### Test Connection Speed
```bash
cd Website/Backend
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:45799', {
  withCredentials: true,
  transports: ['websocket']
});

const start = Date.now();
socket.on('connect', () => {
  console.log('Connection time:', Date.now() - start, 'ms');
  socket.close();
  process.exit(0);
});
"
```

**Expected**: < 100ms

### Test Message Latency
```bash
cd Website/Backend
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:45799', {
  withCredentials: true
});

socket.on('connect', () => {
  const start = Date.now();
  socket.emit('ping', {}, () => {
    console.log('Round-trip time:', Date.now() - start, 'ms');
    socket.close();
    process.exit(0);
  });
});
"
```

**Expected**: < 50ms

---

## Production Checklist

Before deploying to production:

- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] Cookie authentication working
- [ ] CORS properly configured
- [ ] HTTPS enabled (production only)
- [ ] Rate limiting tested
- [ ] Reconnection logic tested
- [ ] Heartbeat mechanism working
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Load testing completed
- [ ] Security audit passed

---

## Monitoring

### Key Metrics to Monitor

1. **Connection Success Rate**: Should be > 99%
2. **Authentication Success Rate**: Should be > 99%
3. **Average Connection Time**: Should be < 200ms
4. **Reconnection Rate**: Should be < 5%
5. **Message Delivery Rate**: Should be > 99.9%
6. **Heartbeat Success Rate**: Should be 100%

### Logging

Check logs for:
- Connection attempts
- Authentication failures
- CORS errors
- Timeout errors
- Reconnection attempts
- Message delivery failures

---

## Support

If you encounter issues not covered in this guide:

1. Check `Website/SOCKET_FIXES_COMPLETE.md` for detailed fix information
2. Review backend logs in `Website/Backend/logs/`
3. Check browser console for frontend errors
4. Verify environment variables in `.env.local` files
5. Run automated test suite for diagnostics

---

*Last Updated: 2025-01-XX*  
*Version: 1.0.0*
