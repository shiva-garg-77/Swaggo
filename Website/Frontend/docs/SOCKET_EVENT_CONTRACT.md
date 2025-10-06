# 🔌 SOCKET.IO EVENT CONTRACT v3.0
## Single Source of Truth for Frontend-Backend Socket Communication

> **Critical**: This document defines the EXACT contract between frontend and backend socket.io implementations.
> Any changes to this contract MUST be updated in BOTH frontend and backend simultaneously.

---

## 📋 TABLE OF CONTENTS

1. [Connection & Authentication](#connection--authentication)
2. [Chat Room Management](#chat-room-management)
3. [Messaging](#messaging)
4. [Typing Indicators](#typing-indicators)
5. [Message Status](#message-status)
6. [User Presence](#user-presence)
7. [Call Management](#call-management)
8. [WebRTC Signaling](#webrtc-signaling)
9. [Call Controls](#call-controls)
10. [Health & Monitoring](#health--monitoring)
11. [Error Handling](#error-handling)
12. [Legacy Compatibility](#legacy-compatibility)

---

## 🔐 CONNECTION & AUTHENTICATION

### **Client → Server**

#### `connect` (automatic)
**Trigger**: Socket.io automatic connection event
**Authentication**: Via handshake with `withCredentials: true`
```typescript
// Handshake Auth Object
{
  profileid: string,        // REQUIRED: User's profile ID
  timestamp: number         // REQUIRED: Connection timestamp
}

// Cookies (HTTP-only, secure)
accessToken: string         // JWT access token
refreshToken: string        // JWT refresh token
```

**Backend Response Events**:
- ✅ `authenticated` - Connection authenticated successfully
- ❌ `auth_error` - Authentication failed

---

#### `authenticated` (Server → Client)
**When**: Successful socket authentication
**Payload**:
```typescript
{
  user: {
    id: string,
    username: string,
    email: string,
    permissions: object
  },
  profile: {
    profileid: string,
    username: string,
    displayname: string,
    avatar: string
  },
  security: {
    riskScore: number,           // 0-100
    deviceTrusted: boolean,
    deviceFingerprint: string
  },
  session: {
    connectedAt: Date,
    expiresAt: Date
  }
}
```

---

## 🏠 CHAT ROOM MANAGEMENT

### **Client → Server**

#### `join_chat`
**Purpose**: Join a chat room to receive messages
**Payload**:
```typescript
{
  chatid: string              // REQUIRED: Chat room ID
}
// OR
chatid: string                // Simple string format supported
```

**Backend Response Events**:
- ✅ `chat_joined` - Successfully joined chat
- ❌ `chat_error` - Failed to join (not a participant, chat not found, etc.)

---

#### `chat_joined` (Server → Client)
**When**: Successfully joined a chat room
**Payload**:
```typescript
{
  chatid: string,
  role: 'owner' | 'admin' | 'moderator' | 'member',
  permissions: {
    canSendMessages: boolean,
    canAddMembers: boolean,
    canRemoveMembers: boolean,
    canEditSettings: boolean
  },
  chatInfo: {
    chatName: string,
    chatType: 'direct' | 'group' | 'channel',
    participantCount: number,
    settings: object
  }
}
```

---

#### `leave_chat`
**Purpose**: Leave a chat room
**Payload**:
```typescript
{
  chatid: string              // REQUIRED
}
// OR
chatid: string                // Simple string format
```

**Backend Response**: No explicit response, silent success

---

### **Server → Client (Broadcast)**

#### `user_joined_chat`
**When**: Another user joins a chat room
**Payload**:
```typescript
{
  profileid: string,
  username: string,
  role: string,
  isOnline: boolean,
  joinedAt: string            // ISO 8601
}
```

---

#### `user_left`
**When**: Another user leaves a chat room
**Payload**:
```typescript
{
  profileid: string,
  username: string
}
```

---

## 💬 MESSAGING

### **Client → Server**

#### `send_message`
**Purpose**: Send a message to a chat room
**Payload**:
```typescript
{
  chatid: string,               // REQUIRED: Target chat
  clientMessageId: string,      // REQUIRED: Client-generated unique ID
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location',
  content: string,              // REQUIRED for text messages
  attachments?: Array<{
    type: string,
    url: string,
    name: string,
    size: number,
    mimetype: string
  }>,
  replyTo?: string,            // Message ID being replied to
  mentions?: string[],         // Array of mentioned profile IDs
  timestamp?: string           // ISO 8601 (optional, server will override)
}
```

**Callback Response**:
```typescript
{
  success: boolean,
  clientMessageId: string,      // Echo back for matching
  serverMessageId?: string,     // Database message ID
  timestamp?: string,           // Server timestamp
  error?: string,               // Error message if success=false
  code?: string,                // Error code (e.g., 'RATE_LIMITED')
  retryAfter?: number          // Seconds to wait before retry
}
```

---

### **Server → Client (Broadcast)**

#### `new_message`
**When**: New message received in a joined chat
**Payload**:
```typescript
{
  message: {
    messageid: string,          // Server message ID
    chatid: string,
    senderid: string,
    clientMessageId?: string,   // Original client ID if available
    messageType: string,
    content: string,
    attachments: Array<object>,
    replyTo?: object,           // Full message object if reply
    mentions: string[],
    timestamp: string,          // ISO 8601
    messageStatus: 'sent' | 'delivered' | 'read',
    reactions: Array<{
      emoji: string,
      profileid: string,
      timestamp: string
    }>
  },
  chat: {
    chatid: string,
    chatName: string,
    chatType: string
  },
  sender: {
    profileid: string,
    username: string,
    displayname: string,
    avatar: string
  },
  isOfflineDelivery?: boolean,  // True if from offline queue
  deliveredAt?: string,
  queuedDuration?: number        // Milliseconds in queue
}
```

---

#### `message_sent` (Server → Client - to sender only)
**When**: Confirmation that message was saved to database
**Payload**:
```typescript
{
  clientMessageId: string,      // For matching with local message
  serverMessageId: string,      // Database ID
  chatid: string,
  timestamp: string,            // ISO 8601
  status: 'sent',
  deliveredTo: string[]         // Profile IDs of online recipients
}
```

---

#### `message_delivered` (Server → Client - to sender only)
**When**: Message delivered to a recipient
**Payload**:
```typescript
{
  messageid: string,            // Server message ID
  clientMessageId?: string,     // Client ID if available
  deliveredTo: string,          // Recipient profile ID
  deliveredAt: string,          // ISO 8601
  isOfflineDelivery?: boolean
}
```

---

#### `message_read` (Server → Client - to sender only)
**When**: Message read by a recipient
**Payload**:
```typescript
{
  messageid: string,
  clientMessageId?: string,
  readBy: string,               // Reader profile ID
  readAt: string                // ISO 8601
}
```

---

## ⌨️ TYPING INDICATORS

### **Client → Server**

#### `typing_start`
**Purpose**: Notify others that user is typing
**Payload**:
```typescript
{
  chatid: string                // REQUIRED
}
// OR
chatid: string                  // Simple string format
```

**Backend Response**: Broadcasts to other chat participants

---

#### `typing_stop`
**Purpose**: Notify others that user stopped typing
**Payload**:
```typescript
{
  chatid: string                // REQUIRED
}
// OR
chatid: string
```

---

### **Server → Client (Broadcast)**

#### `user_typing`
**When**: Another user is typing in a chat
**Payload**:
```typescript
{
  chatid: string,
  profileid: string,
  username: string,
  startedAt: string             // ISO 8601
}
```

---

#### `user_stopped_typing`
**When**: Another user stopped typing
**Payload**:
```typescript
{
  chatid: string,
  profileid: string,
  username: string
}
```

---

## 📊 MESSAGE STATUS

### **Client → Server**

#### `mark_message_read`
**Purpose**: Mark a message as read
**Payload**:
```typescript
{
  messageid: string,            // REQUIRED: Server message ID
  chatid: string                // REQUIRED
}
```

**Backend Response**: Broadcasts `message_read` to sender

---

#### `react_to_message`
**Purpose**: Add emoji reaction to a message
**Payload**:
```typescript
{
  messageid: string,            // REQUIRED
  chatid: string,               // REQUIRED
  emoji: string                 // REQUIRED: Emoji character or code
}
```

**Backend Response**: Broadcasts `message_reaction_added`

---

### **Server → Client (Broadcast)**

#### `message_reaction_added`
**When**: Someone reacts to a message
**Payload**:
```typescript
{
  messageid: string,
  chatid: string,
  reaction: {
    emoji: string,
    profileid: string,
    username: string,
    timestamp: string           // ISO 8601
  }
}
```

---

## 👥 USER PRESENCE

### **Server → Client (Broadcast)**

#### `user_status_changed`
**When**: User's online status changes
**Payload**:
```typescript
{
  profileid: string,
  isOnline: boolean,
  lastSeen: string              // ISO 8601
}
```

---

#### `user_online` (Deprecated - use user_status_changed)
**Payload**:
```typescript
{
  profileid: string
}
```

---

#### `user_offline` (Deprecated - use user_status_changed)
**Payload**:
```typescript
{
  profileid: string
}
```

---

## 📞 CALL MANAGEMENT

### **Client → Server**

#### `initiate_call`
**Purpose**: Start a new call (voice or video)
**Payload**:
```typescript
{
  targetId: string,             // REQUIRED: Recipient profile ID
  callType: 'voice' | 'video',  // REQUIRED
  chatid?: string,              // Optional: Associated chat
  callId?: string               // Optional: Client-generated call ID
}
```

**Callback Response**:
```typescript
{
  success: boolean,
  callId: string,               // Server call ID
  callerId: string,             // Caller profile ID
  receiverId: string,           // Receiver profile ID
  callType: string,
  timestamp: string,
  error?: string
}
```

---

#### `answer_call`
**Purpose**: Answer an incoming call
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  acceptsVideo: boolean         // Whether accepting with video
}
```

---

#### `end_call`
**Purpose**: End an active call
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  reason?: string               // Optional: 'user_ended', 'network_issue', etc.
}
```

---

#### `call_cancelled`
**Purpose**: Cancel a call before it's answered
**Payload**:
```typescript
{
  callId: string                // REQUIRED
}
```

---

### **Server → Client**

#### `incoming_call`
**When**: Receiving a new call
**Payload**:
```typescript
{
  callId: string,
  callerId: string,
  callerName: string,
  callerAvatar: string,
  callType: 'voice' | 'video',
  chatid?: string,
  timestamp: string             // ISO 8601
}
```

---

#### `call_answered`
**When**: Call was answered by recipient
**Payload**:
```typescript
{
  callId: string,
  answeredBy: string,           // Profile ID
  acceptedVideo: boolean,
  timestamp: string
}
```

---

#### `call_ended`
**When**: Call ended by any participant
**Payload**:
```typescript
{
  callId: string,
  endedBy: string,              // Profile ID or 'system'
  reason: string,               // 'user_ended', 'timeout', 'network_issue', 'participant_disconnected'
  duration?: number,            // Call duration in seconds
  timestamp: string
}
```

---

#### `call_rejected`
**When**: Call declined by recipient
**Payload**:
```typescript
{
  callId: string,
  rejectedBy: string,           // Profile ID
  timestamp: string
}
```

---

#### `call_missed`
**When**: Call not answered within timeout
**Payload**:
```typescript
{
  callId: string,
  callerId: string,
  timestamp: string
}
```

---

## 🎥 WEBRTC SIGNALING

### **Client → Server**

#### `webrtc_offer`
**Purpose**: Send WebRTC offer for peer connection
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  targetId: string,             // REQUIRED: Recipient profile ID
  offer: RTCSessionDescriptionInit  // WebRTC SDP offer
}
```

---

#### `webrtc_answer`
**Purpose**: Send WebRTC answer
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  targetId: string,             // REQUIRED
  answer: RTCSessionDescriptionInit  // WebRTC SDP answer
}
```

---

#### `webrtc_ice_candidate`
**Purpose**: Exchange ICE candidates
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  targetId: string,             // REQUIRED
  candidate: RTCIceCandidateInit  // ICE candidate
}
```

---

### **Server → Client (Forwarded)**

#### `webrtc_offer_received`
**When**: Receiving WebRTC offer
**Payload**:
```typescript
{
  callId: string,
  fromId: string,               // Sender profile ID
  offer: RTCSessionDescriptionInit
}
```

---

#### `webrtc_answer_received`
**When**: Receiving WebRTC answer
**Payload**:
```typescript
{
  callId: string,
  fromId: string,
  answer: RTCSessionDescriptionInit
}
```

---

#### `webrtc_ice_candidate_received`
**When**: Receiving ICE candidate
**Payload**:
```typescript
{
  callId: string,
  fromId: string,
  candidate: RTCIceCandidateInit
}
```

---

## 🎛️ CALL CONTROLS

### **Client → Server**

#### `toggle_mute`
**Purpose**: Toggle microphone mute state
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  muted: boolean                // REQUIRED
}
```

---

#### `toggle_video`
**Purpose**: Toggle video on/off
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  videoEnabled: boolean         // REQUIRED
}
```

---

#### `toggle_screen_share`
**Purpose**: Toggle screen sharing
**Payload**:
```typescript
{
  callId: string,               // REQUIRED
  screenSharing: boolean        // REQUIRED
}
```

---

### **Server → Client (Broadcast to call participants)**

#### `participant_muted`
**When**: Participant toggles mute
**Payload**:
```typescript
{
  callId: string,
  profileid: string,
  muted: boolean,
  timestamp: string
}
```

---

#### `participant_video_toggled`
**When**: Participant toggles video
**Payload**:
```typescript
{
  callId: string,
  profileid: string,
  videoEnabled: boolean,
  timestamp: string
}
```

---

#### `participant_screen_share_toggled`
**When**: Participant toggles screen share
**Payload**:
```typescript
{
  callId: string,
  profileid: string,
  screenSharing: boolean,
  timestamp: string
}
```

---

## 🏥 HEALTH & MONITORING

### **Server → Client**

#### `ping`
**Purpose**: Health check ping
**Payload**:
```typescript
timestamp: number              // Milliseconds since epoch
```

**Expected Client Response**: `pong` with same timestamp

---

#### `heartbeat`
**Purpose**: Regular connection health check
**Payload**:
```typescript
{
  timestamp: Date
}
```

**Expected Client Response**: `heartbeat_response`

---

### **Client → Server**

#### `pong`
**Purpose**: Respond to ping
**Payload**:
```typescript
timestamp: number              // Echo back server timestamp
```

---

#### `heartbeat_response`
**Purpose**: Respond to heartbeat
**Payload**:
```typescript
{
  timestamp: Date,              // Echo back server timestamp
  clientTime: Date              // Client's current time
}
```

---

## ⚠️ ERROR HANDLING

### **Server → Client**

#### `error`
**When**: Generic error occurred
**Payload**:
```typescript
{
  error: string,                // Error type code
  message: string,              // Human-readable message
  details?: any                 // Additional error details
}
```

---

#### `chat_error`
**When**: Chat-specific error
**Payload**:
```typescript
{
  error: string,
  chatid?: string,
  data?: any
}
```

---

#### `rate_limited`
**When**: Rate limit exceeded
**Payload**:
```typescript
{
  error: 'rate_limited',
  message: string,
  retryAfter: number            // Seconds
}
```

---

#### `auth_required`
**When**: Authentication required for operation
**Payload**: None (client should re-authenticate)

---

#### `tokens_refreshed`
**When**: Authentication tokens refreshed
**Payload**:
```typescript
{
  expiresAt: string,            // ISO 8601
  refreshed: boolean
}
```

---

## 🔄 OFFLINE MESSAGE DELIVERY

### **Server → Client**

#### `offline_messages_delivered`
**When**: Offline message queue delivered
**Payload**:
```typescript
{
  total: number,                // Total messages queued
  successful: number,           // Successfully delivered
  failed: number,               // Failed deliveries
  deliveredAt: string           // ISO 8601
}
```

---

#### `offline_delivery_error`
**When**: Error delivering offline messages
**Payload**:
```typescript
{
  error: string,
  details: string
}
```

---

## 🔧 LEGACY COMPATIBILITY

> **Note**: These events are deprecated but supported for backward compatibility.
> **Action Required**: Migrate to unified contract events.

### **Deprecated Events (Still Supported)**

| Legacy Event | New Event | Status |
|-------------|-----------|--------|
| `call_offer` | `initiate_call` | ⚠️ Deprecated |
| `call_answer` | `answer_call` | ⚠️ Deprecated |
| `decline_call` | `call_rejected` | ⚠️ Deprecated |
| `call_reject` | `call_rejected` | ⚠️ Deprecated |
| `call_end` | `end_call` | ⚠️ Deprecated |
| `cancel_call` | `call_cancelled` | ⚠️ Deprecated |
| `ice_candidate` | `webrtc_ice_candidate` | ⚠️ Deprecated |
| `user_online` | `user_status_changed` | ⚠️ Deprecated |
| `user_offline` | `user_status_changed` | ⚠️ Deprecated |

---

## 📝 IMPLEMENTATION NOTES

### **Frontend Implementation**
- File: `Components/Helper/PerfectSocketProvider.jsx` (consolidated)
- All events MUST match this contract exactly
- Use TypeScript interfaces for type safety

### **Backend Implementation**
- File: `Controllers/SocketController.js`
- All events MUST match this contract exactly
- Middleware: `Middleware/SocketAuthMiddleware.js`

### **Connection Flow**
1. Client initiates connection with `io(url, { withCredentials: true, auth: {...} })`
2. Backend authenticates via `SocketAuthMiddleware`
3. Backend emits `authenticated` on success
4. Client stores connection state and is ready

### **Message Flow**
1. Client emits `send_message` with callback
2. Backend validates, saves to DB
3. Backend calls callback with `{ success, serverMessageId }`
4. Backend broadcasts `new_message` to all chat participants
5. Backend emits `message_sent` confirmation to sender
6. Recipients emit `mark_message_read` when read
7. Backend broadcasts `message_read` to sender

### **Call Flow**
1. Caller emits `initiate_call` with callback
2. Backend creates call, sends `incoming_call` to recipient
3. Recipient emits `answer_call`
4. Backend broadcasts `call_answered` to both parties
5. WebRTC signaling via `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`
6. Either party emits `end_call`
7. Backend broadcasts `call_ended` to both parties

---

## ✅ CONTRACT VALIDATION CHECKLIST

Before deploying any socket changes:

- [ ] All new events documented in this contract
- [ ] Both frontend and backend updated simultaneously
- [ ] Event payload types match exactly
- [ ] Error handling implemented for all events
- [ ] Rate limiting applied where appropriate
- [ ] Security validation (authentication, authorization) in place
- [ ] Backward compatibility maintained for deprecated events
- [ ] Testing completed for all event flows
- [ ] Documentation updated
- [ ] Team notified of contract changes

---

## 🔒 SECURITY REQUIREMENTS

### **All Events Must**:
1. ✅ Verify socket authentication via `SocketAuthMiddleware`
2. ✅ Validate user permissions for chat/call operations
3. ✅ Apply rate limiting via `socketRateLimiter`
4. ✅ Sanitize and validate all input data
5. ✅ Log security-relevant events
6. ✅ Handle errors without exposing sensitive data

### **Sensitive Operations**:
- Message sending: Rate limited (10/sec per user)
- Call initiation: Rate limited (5/min per user)
- Chat joining: Authorization check required
- Media upload: Size and type validation required

---

## 📊 PERFORMANCE REQUIREMENTS

### **Event Response Times** (95th percentile):
- Authentication: < 500ms
- Chat join: < 200ms
- Message send: < 100ms
- Message broadcast: < 50ms
- Call signaling: < 50ms
- Heartbeat: < 30ms

### **Resource Limits**:
- Max concurrent sockets per user: 10
- Max offline messages queued: 25 per user
- Max message size: 10KB
- Max attachment size: 50MB
- Call timeout (unanswered): 60 seconds
- Call max duration: 3 hours

---

## 🎯 VERSION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 3.0 | 2025-01-30 | Unified contract, consolidated all events | System |
| 2.1 | 2024-12-15 | Added call controls and screen share | Backend Team |
| 2.0 | 2024-11-20 | WebRTC signaling standardization | Backend Team |
| 1.0 | 2024-10-01 | Initial contract definition | Initial Team |

---

## 📞 SUPPORT

For questions or clarifications about this contract:
- **Frontend Team**: Review `PerfectSocketProvider.jsx`
- **Backend Team**: Review `SocketController.js` and `SocketAuthMiddleware.js`
- **Contract Updates**: Require approval from both teams

---

**Last Updated**: 2025-01-30 09:41 UTC
**Contract Version**: 3.0
**Status**: ✅ ACTIVE & ENFORCED