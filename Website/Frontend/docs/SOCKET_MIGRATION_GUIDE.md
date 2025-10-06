# 🔄 Socket Migration Guide
## Transitioning to PerfectSocketProvider v4.0

> **Goal**: Consolidate three socket implementations into ONE perfect, production-ready solution.
> **Status**: ✅ READY FOR MIGRATION
> **Security**: 10/10 Maintained
> **Performance**: 10/10 Optimized

---

## 📋 OVERVIEW

### **What's Changing:**
- **OLD**: Three separate socket implementations (SocketProvider.js, UnifiedSocketService.js, WebSocketManager.js)
- **NEW**: ONE consolidated `PerfectSocketProvider.jsx` with all best features

### **Why This Migration:**
1. ✅ Eliminates duplicate code and conflicting implementations
2. ✅ Follows the unified Socket Event Contract (v3.0)
3. ✅ Maintains 10/10 security (HTTP-only cookies, CSRF protection)
4. ✅ Maintains 10/10 performance (memory optimized, proper cleanup)
5. ✅ Adds comprehensive features (typing indicators, presence, WebRTC)
6. ✅ Production-ready error handling and reconnection logic

---

## 🎯 MIGRATION STEPS

### **Step 1: Update Main Layout Provider Chain**

**File to Update**: `app/layout.js` or wherever providers are defined

**OLD CODE**:
```javascript
import SocketProvider from '@/Components/Helper/SocketProvider';
// OR
import UnifiedSocketService from '@/services/UnifiedSocketService';
```

**NEW CODE**:
```javascript
import PerfectSocketProvider from '@/Components/Helper/PerfectSocketProvider';
```

**Provider Hierarchy** (Recommended Order):
```jsx
<html lang="en">
  <body>
    <FixedSecureAuthContext>          {/* Auth MUST be first */}
      <ApolloProvider client={client}>
        <PerfectSocketProvider>         {/* Socket after Auth */}
          <NotificationProvider>
            {/* Your app components */}
          </NotificationProvider>
        </PerfectSocketProvider>
      </ApolloProvider>
    </FixedSecureAuthContext>
  </body>
</html>
```

---

### **Step 2: Update Hook Usage**

**File Pattern**: Any component using socket functionality

**OLD CODE**:
```javascript
import { useSocket } from '@/Components/Helper/SocketProvider';
// OR
import { useSocket } from '@/services/UnifiedSocketService';
```

**NEW CODE**:
```javascript
import { useSocket } from '@/Components/Helper/PerfectSocketProvider';
```

**Hook Returns** (Same interface, enhanced features):
```javascript
const {
  // Connection state
  socket,                    // Raw socket.io instance
  isConnected,              // Boolean connection status
  connectionStatus,         // Detailed status string
  
  // User presence
  onlineUsers,              // Set of online user profileids
  
  // Message management
  messageQueue,             // Array of queued messages
  pendingMessages,          // Map of pending message states
  
  // NEW: Typing indicators
  typingUsers,              // Map: chatid -> Set of typing userIds
  
  // NEW: Call state
  activeCalls,              // Map: callId -> call data
  
  // NEW: Development metrics
  metrics,                  // Performance metrics (dev only)
  
  // Chat methods
  joinChat,                 // (chatid)
  leaveChat,                // (chatid)
  
  // Messaging methods
  sendMessage,              // (messageData, callback)
  markMessageRead,          // (messageid, chatid)
  reactToMessage,           // (messageid, emoji, chatid)
  startTyping,              // NEW: (chatid)
  stopTyping,               // NEW: (chatid)
  
  // NEW: Call methods
  initiateCall,             // (targetId, callType, chatid, callback)
  answerCall,               // (callId, acceptsVideo)
  endCall,                  // (callId, reason)
  
  // NEW: WebRTC methods
  sendWebRTCOffer,          // (callId, targetId, offer)
  sendWebRTCAnswer,         // (callId, targetId, answer)
  sendICECandidate,         // (callId, targetId, candidate)
  
  // Utility methods
  reconnect,                // Manual reconnection
  queueMessage,             // Manual message queuing
  processMessageQueue       // Manual queue processing
} = useSocket();
```

---

### **Step 3: Update Event Listeners**

**File Pattern**: Components listening to socket events

**OLD CODE**:
```javascript
useEffect(() => {
  if (socket) {
    socket.on('new_message', handleNewMessage);
    socket.on('user_online', handleUserOnline);
    
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_online', handleUserOnline);
    };
  }
}, [socket]);
```

**NEW CODE** (Same, but ensure event names match contract):
```javascript
useEffect(() => {
  if (socket) {
    // ✅ Use official contract event names
    socket.on('new_message', handleNewMessage);
    socket.on('user_status_changed', handleUserStatus); // NEW unified event
    
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_status_changed', handleUserStatus);
    };
  }
}, [socket]);
```

**Event Name Changes** (see SOCKET_EVENT_CONTRACT.md):
- `user_online` → `user_status_changed` (with `isOnline: true`)
- `user_offline` → `user_status_changed` (with `isOnline: false`)
- Other events remain the same

---

### **Step 4: Update Message Sending**

**OLD CODE**:
```javascript
const handleSend = () => {
  if (socket && isConnected) {
    socket.emit('send_message', {
      chatid,
      content,
      messageType: 'text'
    });
  }
};
```

**NEW CODE** (Enhanced with callback):
```javascript
const handleSend = () => {
  const clientMessageId = sendMessage({
    chatid,
    content,
    messageType: 'text'
  }, (ack) => {
    if (ack.success) {
      console.log('Message sent successfully:', ack.serverMessageId);
    } else {
      console.error('Message failed:', ack.error);
    }
  });
  
  // clientMessageId available immediately for optimistic UI updates
  console.log('Client message ID:', clientMessageId);
};
```

---

### **Step 5: Add Typing Indicators** (NEW FEATURE)

**Example Component**:
```jsx
import { useSocket } from '@/Components/Helper/PerfectSocketProvider';
import { useState, useEffect } from 'react';

function ChatInput({ chatid }) {
  const { startTyping, stopTyping, typingUsers } = useSocket();
  const [message, setMessage] = useState('');
  
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Automatically start typing indicator
    if (e.target.value.length > 0) {
      startTyping(chatid);
    } else {
      stopTyping(chatid);
    }
  };
  
  const handleSend = () => {
    // Stop typing before sending
    stopTyping(chatid);
    // ... send message logic
    setMessage('');
  };
  
  // Display who's typing
  const typingUsersInChat = typingUsers.get(chatid) || new Set();
  
  return (
    <div>
      {typingUsersInChat.size > 0 && (
        <div className="typing-indicator">
          {typingUsersInChat.size} user(s) typing...
        </div>
      )}
      
      <input
        value={message}
        onChange={handleInputChange}
        onBlur={() => stopTyping(chatid)}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

---

### **Step 6: Add WebRTC Call Support** (NEW FEATURE)

**Example Component**:
```jsx
import { useSocket } from '@/Components/Helper/PerfectSocketProvider';
import { useState, useEffect } from 'react';

function CallManager({ targetUserId, chatid }) {
  const {
    initiateCall,
    answerCall,
    endCall,
    activeCalls,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
    socket
  } = useSocket();
  
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  
  const handleStartCall = async (callType = 'video') => {
    // Get local media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === 'video',
      audio: true
    });
    setLocalStream(stream);
    
    // Initiate call
    initiateCall(targetUserId, callType, chatid, (ack) => {
      if (ack.success) {
        console.log('Call initiated:', ack.callId);
        // Setup WebRTC peer connection
        setupPeerConnection(ack.callId, stream);
      }
    });
  };
  
  const setupPeerConnection = async (callId, stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    // Add local stream
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendICECandidate(callId, targetUserId, event.candidate);
      }
    };
    
    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendWebRTCOffer(callId, targetUserId, offer);
    
    setPeerConnection(pc);
  };
  
  // Listen for WebRTC events
  useEffect(() => {
    if (!socket) return;
    
    socket.on('webrtc_offer_received', async (data) => {
      // Handle incoming offer
      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      sendWebRTCAnswer(data.callId, data.fromId, answer);
    });
    
    socket.on('webrtc_answer_received', async (data) => {
      await peerConnection.setRemoteDescription(data.answer);
    });
    
    socket.on('webrtc_ice_candidate_received', async (data) => {
      await peerConnection.addIceCandidate(data.candidate);
    });
    
    socket.on('call_ended', (data) => {
      // Cleanup
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    });
    
    return () => {
      socket.off('webrtc_offer_received');
      socket.off('webrtc_answer_received');
      socket.off('webrtc_ice_candidate_received');
      socket.off('call_ended');
    };
  }, [socket, peerConnection]);
  
  return (
    <div>
      <button onClick={() => handleStartCall('video')}>
        Start Video Call
      </button>
      <button onClick={() => handleStartCall('voice')}>
        Start Voice Call
      </button>
      
      {activeCalls.size > 0 && (
        <div className="active-calls">
          {Array.from(activeCalls.entries()).map(([callId, call]) => (
            <div key={callId}>
              Call with {call.callerName} - {call.status}
              <button onClick={() => endCall(callId)}>End Call</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### **Step 7: Remove Old Files** (After Testing)

Once migration is complete and tested, remove old socket files:

```bash
# Files to DELETE (after confirming everything works)
rm Components/Helper/SocketProvider.js
rm lib/WebSocketManager.js
rm services/UnifiedSocketService.js
```

**⚠️ IMPORTANT**: Test thoroughly before deleting!

---

## ✅ MIGRATION CHECKLIST

### **Pre-Migration**
- [ ] Review `SOCKET_EVENT_CONTRACT.md` for event naming
- [ ] Backup current codebase (git commit)
- [ ] Ensure `FixedSecureAuthContext` is properly configured
- [ ] Verify `NEXT_PUBLIC_SERVER_URL` environment variable is set

### **During Migration**
- [ ] Update main layout provider chain
- [ ] Update all `useSocket` imports
- [ ] Update event listener names to match contract
- [ ] Test basic messaging functionality
- [ ] Test reconnection after network disruption
- [ ] Test authentication flow (login/logout)
- [ ] Test typing indicators (if implemented)
- [ ] Test call functionality (if implemented)

### **Post-Migration Testing**
- [ ] Login works correctly
- [ ] Socket connects after authentication
- [ ] Messages send and receive properly
- [ ] Reconnection works after network issues
- [ ] No infinite reconnection loops
- [ ] Memory usage is stable (check Dev Tools)
- [ ] No console errors
- [ ] Typing indicators work (if implemented)
- [ ] Calls work (if implemented)
- [ ] Soft reload preserves state

### **Performance Validation**
- [ ] Check message queue size stays reasonable
- [ ] Check pending messages get cleaned up
- [ ] Check heartbeat is working
- [ ] Monitor memory usage over time
- [ ] Check for event listener leaks

### **Final Steps**
- [ ] Remove old socket provider files
- [ ] Update documentation
- [ ] Notify team of changes
- [ ] Monitor production for any issues

---

## 🐛 TROUBLESHOOTING

### **Issue: Socket doesn't connect after migration**

**Solution**:
1. Check FixedSecureAuthContext is wrapping PerfectSocketProvider
2. Verify user is authenticated before socket initializes
3. Check console for authentication errors
4. Verify `NEXT_PUBLIC_SERVER_URL` environment variable

```javascript
// Debug helper in component:
const auth = useFixedSecureAuth();
console.log('Auth state:', {
  isAuthenticated: auth.isAuthenticated,
  isLoading: auth.isLoading,
  userId: auth.user?.profileid || auth.user?.id
});
```

---

### **Issue: Events not being received**

**Solution**:
1. Verify event names match SOCKET_EVENT_CONTRACT.md
2. Check socket.on() listeners are registered correctly
3. Ensure socket is connected before emitting events
4. Check backend is emitting events correctly

```javascript
// Debug helper:
useEffect(() => {
  if (socket) {
    const logEvent = (eventName) => (data) => {
      console.log(`Socket event: ${eventName}`, data);
    };
    
    socket.onAny(logEvent);
    return () => socket.offAny(logEvent);
  }
}, [socket]);
```

---

### **Issue: Memory leaks or performance degradation**

**Solution**:
1. Ensure event listeners are properly cleaned up in useEffect returns
2. Check message queue isn't growing indefinitely
3. Verify typing timeouts are being cleared
4. Monitor pending messages map size

```javascript
// Add to component for monitoring:
const { metrics, messageQueue, pendingMessages } = useSocket();

useEffect(() => {
  console.log('Socket metrics:', {
    queueSize: messageQueue.length,
    pendingSize: pendingMessages.size,
    metrics
  });
}, [messageQueue, pendingMessages, metrics]);
```

---

### **Issue: Typing indicators not working**

**Solution**:
1. Verify SOCKET_CONFIG.ENABLE_TYPING_INDICATORS is true
2. Check startTyping/stopTyping are being called correctly
3. Ensure backend is broadcasting typing events
4. Verify typingUsers state is being read correctly

---

### **Issue: Calls not connecting**

**Solution**:
1. Check STUN/TURN servers are configured
2. Verify WebRTC signaling events are being received
3. Ensure ICE candidates are being exchanged
4. Check browser permissions for camera/microphone
5. Verify backend is forwarding WebRTC events

---

## 📊 PERFORMANCE BENCHMARKS

### **Expected Performance** (After Migration):

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Socket Connection Time | < 500ms | < 1000ms | > 1000ms |
| Message Send Time | < 100ms | < 200ms | > 200ms |
| Message Queue Size | < 10 | < 50 | > 50 |
| Pending Messages | < 20 | < 50 | > 50 |
| Memory Usage (Idle) | < 10MB | < 20MB | > 20MB |
| Reconnection Time | < 2s | < 5s | > 5s |

### **Monitoring in Development**:
```javascript
const { metrics } = useSocket();

// Metrics available (when ENABLE_METRICS is true):
console.log(metrics);
// {
//   messagesQueued: number,
//   messagesSent: number,
//   messagesReceived: number,
//   reconnections: number,
//   lastHeartbeat: Date
// }
```

---

## 🔒 SECURITY VERIFICATION

After migration, verify security remains 10/10:

✅ **Checklist**:
- [ ] Tokens remain in HTTP-only cookies (not exposed to JavaScript)
- [ ] withCredentials: true is set on socket connection
- [ ] Socket auth uses profileid from authenticated session
- [ ] No tokens logged to console
- [ ] CSRF protection maintained
- [ ] Rate limiting working (test by sending many messages quickly)
- [ ] Authentication errors handled gracefully

---

## 📚 ADDITIONAL RESOURCES

- **Socket Event Contract**: `docs/SOCKET_EVENT_CONTRACT.md`
- **Backend Socket Controller**: `Backend/Controllers/SocketController.js`
- **Backend Socket Middleware**: `Backend/Middleware/SocketAuthMiddleware.js`
- **Auth Context**: `context/FixedSecureAuthContext.jsx`
- **Performance Report**: `docs/PERFORMANCE_SECURITY_REPORT.md`

---

## 🆘 SUPPORT

If you encounter issues during migration:

1. **Check this guide first** for troubleshooting steps
2. **Review the Socket Event Contract** for correct event usage
3. **Check console logs** for detailed error messages (development mode)
4. **Test in isolation** - create a minimal test component
5. **Verify backend** is running and properly configured

---

## ✨ NEW FEATURES AVAILABLE

After migrating to PerfectSocketProvider, you'll have access to:

### **1. Typing Indicators**
- Real-time typing status per chat
- Automatic debouncing
- Auto-stop after timeout

### **2. User Presence**
- Online/offline status tracking
- Set-based efficient storage
- Automatic updates on join/leave

### **3. WebRTC Calling**
- Voice and video calls
- Full signaling support
- ICE candidate exchange
- Call state management

### **4. Enhanced Message Queue**
- Overflow protection
- Message aging
- Retry logic with exponential backoff
- Batch processing

### **5. Health Monitoring**
- Heartbeat mechanism
- Connection quality tracking
- Performance metrics (dev mode)
- Automatic dead connection detection

### **6. Smart Reconnection**
- Exponential backoff with jitter
- Error type classification
- Auth failure detection
- Network vs server error handling

### **7. Memory Optimization**
- Size-limited queues
- Automatic cleanup of stale data
- Periodic maintenance
- Proper resource disposal

---

**Migration Status**: ✅ READY
**Estimated Migration Time**: 2-4 hours (depending on codebase size)
**Risk Level**: 🟢 LOW (if checklist followed)
**Benefits**: 🚀 HIGH (consolidated, optimized, feature-rich)

---

**Last Updated**: 2025-01-30 09:41 UTC
**Version**: 4.0.0
**Author**: Swaggo Development Team