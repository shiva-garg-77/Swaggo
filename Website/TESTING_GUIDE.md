# 🚀 Quick Testing Guide - SwagGo Chat System

## Step 1: Start the Servers

### Backend Server
```bash
cd Backend
npm run dev
```
**Expected:** Server should start on `http://localhost:8000`
**Look for:** `🚀 Server ready at http://localhost:8000/graphql`

### Frontend Server  
```bash
cd Frontend
npm run dev
```
**Expected:** Frontend should start on `http://localhost:3000`

## Step 2: Access the Test Page

Open your browser and go to:
```
http://localhost:3000/chat-test
```

## Step 3: Check Connection Status

Look at the **Debug Panel** (bottom-left corner) and verify:

- ✅ **Socket: Created** 
- ✅ **Connected: Yes**
- ✅ **Socket ID:** Should show an ID (like `abc123`)
- ✅ **User:** Should show "Demo User XX"
- ✅ **Chat:** Should show "chat_demo_123"

**If you see ❌ on any of these:**
1. Check that both servers are running
2. Check browser console for errors (F12 → Console)
3. Try refreshing the page

## Step 4: Test Real-Time Messaging

### Option A: Single Browser Tab
1. Click **"Send Test Message"** button in debug panel
2. You should see the test message appear in the chat
3. Try typing in the message input and press Enter

### Option B: Multiple Tabs (Recommended)
1. Open a **second browser tab** with the same URL: `http://localhost:3000/chat-test`
2. In the second tab, click **"Switch User"** to simulate a different user
3. Send messages from both tabs
4. **Expected:** Messages should appear in real-time in both tabs

## Step 5: Test Voice/Video Calls

1. **Make sure connection is green** (✅ Connected: Yes)
2. Click the **phone icon** 📞 for voice call
3. Click the **video icon** 📹 for video call
4. **Expected:** 
   - Call modal should open
   - Browser should ask for microphone/camera permissions
   - You should see the call interface

### Multi-Tab Call Testing
1. Open two tabs as described above
2. In Tab 1: Click phone/video icon to start call
3. In Tab 2: You should see an **incoming call notification**
4. Click "Accept" to answer the call
5. **Expected:** Both tabs should show the call interface

## Step 6: Troubleshooting

### ❌ "Socket or selectedChat not available"
**Solution:**
- Make sure backend server is running on port 8000
- Check the debug panel shows "Connected: Yes" 
- Try refreshing the page
- Check browser console for errors

### ❌ Messages not sending/receiving
**Solution:**
1. Verify socket connection (green dot in debug panel)
2. Click "Join Chat" button in debug panel
3. Try sending a test message from debug panel first
4. Check browser console and backend server logs

### ❌ Video/Voice calls not working
**Solution:**
1. **Browser Permissions:** Allow microphone and camera access
2. **HTTPS:** For production, calls require HTTPS
3. **Firewall:** Check if WebRTC ports are blocked
4. **Browser Support:** Use Chrome, Firefox, or Safari

### ❌ Connection keeps failing
**Solution:**
1. **Backend Server:** Make sure it's running on port 8000
2. **CORS:** Backend should show your frontend URL in CORS settings
3. **Network:** Try disabling VPN/proxy
4. **Port Conflict:** Make sure no other app is using port 8000

## Step 7: Advanced Testing

### Test Multiple Users
1. **Chrome Tab 1:** User A
2. **Firefox Tab:** User B  
3. **Chrome Incognito:** User C
4. Send messages between all tabs

### Test Call Features
- Start a video call and test:
  - Mute/unmute microphone
  - Turn camera on/off
  - End call functionality
  - Screen sharing (if implemented)

### Test Mobile
- Open the test page on your phone
- Test touch interactions
- Verify responsive design

## Expected Results ✅

When everything works correctly:
- ✅ **Real-time messaging** between tabs/browsers
- ✅ **Voice calls** with audio
- ✅ **Video calls** with camera feed
- ✅ **Incoming call notifications**
- ✅ **Call controls** (mute, video toggle)
- ✅ **Typing indicators** 
- ✅ **Message status** updates
- ✅ **Cross-browser compatibility**

## Debug Console Commands

Open browser console (F12) and try:

```javascript
// Check socket connection
window.socket = socketClient.getSocket();
console.log('Socket connected:', window.socket?.connected);

// Manual message send
if (window.socket?.connected) {
  window.socket.emit('send_message', {
    chatid: 'chat_demo_123',
    content: 'Manual test message',
    messageType: 'text'
  });
}

// Join chat manually
if (window.socket?.connected) {
  window.socket.emit('join_chat', 'chat_demo_123');
}
```

## Get Help

If you're still having issues:

1. **Check server logs:** Look at the backend console output
2. **Browser console:** Check for JavaScript errors (F12 → Console)
3. **Network tab:** Check if WebSocket connections are established (F12 → Network)
4. **Try different browsers:** Chrome, Firefox, Safari
5. **Port conflicts:** Make sure ports 3000 and 8000 are available

## Success Indicators

You'll know it's working when you see:

- **Backend:** 
  ```
  👤 User connected: Demo User XX (demo_user_xyz)
  📨 John joined chat: chat_demo_123
  💬 Message sent in chat_demo_123 by Demo User XX
  ```

- **Frontend Debug Panel:**
  ```
  Socket: ✅ Created
  Connected: ✅ Yes  
  Socket ID: abc123xyz
  ```

- **Browser Console:**
  ```
  ✅ Connected to chat server with ID: abc123
  📨 Received new message: {...}
  📞 Starting voice call...
  ```

🎉 **Once you see these indicators, your chat system is fully functional!**
