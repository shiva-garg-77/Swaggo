# Socket Connection Debugging Instructions

## The Problem
Messages are not reaching the backend. The backend only shows cleanup logs, no socket events.

## Debugging Steps

### Step 1: Check Browser Console
Open browser console (F12) and look for:

1. **Socket Connection Status**
   ```
   ✅ SOCKET: Connection established
   Socket connected: true
   Socket ID: <some-id>
   ```

2. **When you type and send a message, you should see:**
   ```
   🎯 [FRONTEND] handleSendMessage called
   🚀 [FRONTEND] sendBatchedMessages called
   📤 [FRONTEND] Emitting send_message_batch event
   ```

### Step 2: Test Socket Connection Manually

Open browser console and run this command:
```javascript
// Get the socket from window (if exposed) or from React DevTools
// Find the socket instance and test it:

// Test 1: Check if socket exists and is connected
console.log('Socket connected:', window.socket?.connected);
console.log('Socket ID:', window.socket?.id);

// Test 2: Try emitting a test event
window.socket?.emit('ping', { test: true }, (response) => {
  console.log('Ping response:', response);
});
```

### Step 3: Check Backend Logs

When you send a message, you should see in backend:
```
🔔 [SOCKET] Event received: { eventName: 'send_message_batch', ... }
🟡 [SOCKET-BATCH] send_message_batch event received
```

If you see NOTHING in backend, the socket is not connected.

### Step 4: Check Network Tab

1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket) or "socket.io"
3. Look for socket.io connection
4. Check if it's connected (green) or failed (red)
5. Click on it and check the "Messages" tab to see what's being sent

## Common Issues

### Issue 1: Socket Not Connected
**Symptoms:** Frontend shows "Socket connected: false"
**Solution:** 
- Check if backend is running on correct port
- Check CORS settings
- Check authentication cookies

### Issue 2: Socket Connected But Events Not Received
**Symptoms:** Frontend shows connected, but backend receives nothing
**Solution:**
- Check if event handlers are registered (look for "Setting up event handlers" in backend logs)
- Check if socket authentication passed
- Try the manual ping test above

### Issue 3: Frontend Function Not Called
**Symptoms:** No frontend logs when clicking send
**Solution:**
- Check if the send button is properly wired
- Check if handleSendMessage is being called
- Check React component state

## Quick Test Script

Run this in browser console to test the full flow:
```javascript
// 1. Check socket
console.log('=== SOCKET TEST ===');
console.log('Socket exists:', !!window.socket);
console.log('Socket connected:', window.socket?.connected);
console.log('Socket ID:', window.socket?.id);

// 2. Try sending a test message
if (window.socket?.connected) {
  console.log('Sending test message...');
  window.socket.emit('send_message_batch', [{
    chatid: 'test-chat-id',
    content: 'Test message',
    messageType: 'text',
    clientMessageId: 'test-' + Date.now()
  }], (response) => {
    console.log('Test message response:', response);
  });
} else {
  console.error('Socket not connected!');
}
```

## Next Steps Based on Results

1. **If socket is not connected:**
   - Check backend URL in frontend config
   - Check CORS settings
   - Check authentication

2. **If socket is connected but no events received:**
   - Check if SocketController is initialized
   - Check if event handlers are set up
   - Check backend logs for connection events

3. **If frontend logs don't appear:**
   - Check if MessageArea component is mounted
   - Check if handleSendMessage is being called
   - Add more console.logs to trace the flow
