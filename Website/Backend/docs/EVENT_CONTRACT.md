# SwagGo Chat System - Unified Event Contract

## Overview

This document defines the **UNIFIED EVENT CONTRACT** for the SwagGo Chat System. All Socket.IO events and REST endpoints follow this exact specification to ensure consistency between real-time and REST API interactions.

## Core Principles

1. **Idempotency**: Every message includes a `clientMessageId` for deduplication
2. **Consistency**: Same event structure for Socket.IO and REST endpoints
3. **Reliability**: Proper acknowledgments and delivery tracking
4. **Compatibility**: Legacy events emitted in parallel during transition
5. **Security**: Authentication required for all operations

## Event Categories

### 1. Messaging Events

#### `send_message` (Client → Server)
**Description**: Send a new message to a chat
**Required Fields**: `chatid`, `clientMessageId`

```json
{
  "chatid": "string",
  "clientMessageId": "string",
  "messageType": "text|image|video|audio|file|system",
  "content": "string",
  "attachments": [
    {
      "type": "image|video|audio|file",
      "url": "string",
      "filename": "string",
      "size": "number",
      "mimetype": "string"
    }
  ],
  "replyTo": "string|null",
  "mentions": ["string"]
}
```

#### `message_ack` (Server → Client)
**Description**: Acknowledgment response for sent messages

```json
{
  "success": "boolean",
  "clientMessageId": "string",
  "messageid": "string",
  "timestamp": "ISO string",
  "duplicate": "boolean",
  "error": "string"
}
```

#### `new_message` (Server → Client)
**Description**: Broadcast new message to chat participants

```json
{
  "message": {
    "messageid": "string",
    "chatid": "string",
    "senderid": "string",
    "messageType": "text|image|video|audio|file|system",
    "content": "string",
    "attachments": ["array"],
    "readBy": ["array"],
    "deliveredTo": ["array"],
    "messageStatus": "sent|delivered|read|failed",
    "createdAt": "ISO string"
  },
  "chat": {
    "chatid": "string",
    "lastMessageAt": "Date"
  },
  "timestamp": "ISO string"
}
```

#### `message_delivered` (Server → Client)
**Description**: Notify sender of message delivery

```json
{
  "messageid": "string",
  "deliveredTo": "string",
  "deliveredAt": "ISO string"
}
```

#### `mark_message_read` (Client → Server)
**Description**: Mark a message as read

```json
{
  "chatid": "string",
  "messageid": "string"
}
```

#### `message_read` (Server → Client)
**Description**: Broadcast read status to other participants

```json
{
  "messageid": "string",
  "readBy": {
    "profileid": "string",
    "username": "string",
    "readAt": "ISO string"
  }
}
```

### 2. Typing Indicators

#### `typing_start` (Client → Server)
```json
{ "chatid": "string" }
```

#### `typing_stop` (Client → Server)
```json
{ "chatid": "string" }
```

#### `user_typing` (Server → Client)
```json
{
  "chatid": "string",
  "profileid": "string",
  "username": "string",
  "isTyping": "boolean"
}
```

### 3. Call Events

#### `initiate_call` (Client → Server)
**Description**: Start a voice or video call

```json
{
  "chatid": "string",
  "callType": "voice|video",
  "receiverId": "string",
  "callId": "string"
}
```

#### `call_ringing` (Server → Caller)
```json
{
  "callId": "string",
  "receiverId": "string"
}
```

#### `incoming_call` (Server → Callee)
```json
{
  "callId": "string",
  "callType": "voice|video",
  "caller": {
    "profileid": "string",
    "username": "string"
  },
  "chatid": "string"
}
```

#### `answer_call` (Client → Server)
```json
{
  "callId": "string",
  "accepted": "boolean",
  "chatid": "string"
}
```

#### `call_answer` (Server → Caller)
```json
{
  "callId": "string",
  "accepted": "boolean",
  "answerer": {
    "profileid": "string",
    "username": "string"
  }
}
```

#### `end_call` (Client ↔ Server)
```json
{
  "callId": "string",
  "reason": "string"
}
```

### 4. WebRTC Signaling

#### `webrtc_offer` (Client → Server → Client)
```json
{
  "chatid": "string",
  "callId": "string",
  "offer": "RTCSessionDescription"
}
```

#### `webrtc_answer` (Client → Server → Client)
```json
{
  "chatid": "string",
  "callId": "string",
  "answer": "RTCSessionDescription"
}
```

#### `webrtc_ice_candidate` (Client → Server → Client)
```json
{
  "chatid": "string",
  "callId": "string",
  "candidate": "RTCIceCandidate"
}
```

### 5. Chat Management

#### `join_chat` (Client → Server)
```json
"chatid"
```

#### `leave_chat` (Client → Server)
```json
"chatid"
```

## REST API Endpoints

### Message Operations

- `POST /api/message/send` - Send message (same contract as `send_message`)
- `POST /api/message/mark-read` - Mark as read (same contract as `mark_message_read`)
- `GET /api/message/chat/:chatId/messages` - Get message history with pagination
- `GET /api/message/chat/:chatId` - Get chat information
- `GET /api/message/chat/:chatId/calls` - Get call history

### File Upload

- `POST /upload` - Upload file, returns absolute URL

```json
{
  "success": true,
  "fileUrl": "http://localhost:45799/uploads/filename.ext",
  "filename": "filename.ext",
  "originalname": "original.ext",
  "size": 12345,
  "mimetype": "image/jpeg",
  "uploadedAt": "ISO string"
}
```

## Legacy Event Support

During the transition period, the server emits both unified and legacy events:

### Legacy Call Events (Deprecated)
- `call_offer` → Use `incoming_call`
- `call_answered` → Use `call_answer`  
- `call_ended` → Use `end_call`
- `ice_candidate` → Use `webrtc_ice_candidate`

## Error Handling

All operations return standardized error responses:

```json
{
  "success": false,
  "error": "Error description",
  "clientMessageId": "string",
  "timestamp": "ISO string"
}
```

## Authentication

- All Socket.IO connections require valid JWT token in `auth.token`
- All REST endpoints require `Authorization: Bearer <token>` header
- Demo tokens only allowed in development environment

## Message Flow Examples

### Successful Message Send
1. Client: `send_message` with `clientMessageId`
2. Server: Validates, saves, broadcasts `new_message`
3. Server: Responds with `message_ack` 
4. Server: Emits `message_delivered` for online recipients
5. Recipients: Can emit `mark_message_read`
6. Server: Broadcasts `message_read` to other participants

### Duplicate Message Handling
1. Client: Resends `send_message` with same `clientMessageId`
2. Server: Finds existing message, returns `message_ack` with `duplicate: true`
3. No additional processing or broadcasting

### Call Flow
1. Caller: `initiate_call`
2. Server: `call_ringing` to caller, `incoming_call` to callee
3. Callee: `answer_call` 
4. Server: `call_answer` to caller
5. Both: Exchange WebRTC signals (`webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`)
6. Either: `end_call`

## Implementation Notes

1. **Idempotency**: Always check `clientMessageId` before processing
2. **Room Management**: Users must join chat room before sending messages
3. **Delivery Tracking**: Update `deliveredTo` and `readBy` arrays in database
4. **Error Responses**: Always include `clientMessageId` for client-side mapping
5. **Timestamp Format**: Use ISO 8601 strings consistently
6. **Message Status**: Track progression: sent → delivered → read
7. **Call Rooms**: Use `chatid` as the room for WebRTC signaling
8. **Attachment URLs**: Always return absolute URLs from upload endpoints

## Migration Guide

### For Frontend Clients

1. **Update Socket Events**:
   - Replace `call_offer` with `initiate_call`
   - Use `incoming_call` instead of `call_offer` for receiving
   - Replace `ice_candidate` with `webrtc_ice_candidate`

2. **Message Handling**:
   - Always include `clientMessageId` in `send_message`
   - Handle `message_ack` responses for optimistic UI updates
   - Listen for `message_delivered` and `message_read` events

3. **Call Implementation**:
   - Use unified call methods from MasterSocketService
   - Ensure room joining before WebRTC signaling
   - Handle both unified and legacy events during transition

### For Backend Services

1. **Event Handlers**:
   - Emit both unified and legacy events in parallel
   - Gradually phase out legacy event emission
   - Maintain backward compatibility for 1 release cycle

2. **Database Updates**:
   - Ensure `clientMessageId` is indexed
   - Update schemas to include all required fields
   - Normalize participant data structures

## Testing Requirements

### Unit Tests
- Message idempotency by `clientMessageId`
- Read receipt single and batch operations
- Call flow state machine transitions

### Integration Tests
- Two-browser message exchange with delivery/read tracking
- Offline message queue processing and deduplication
- Voice and video call establishment with WebRTC signaling
- File upload with absolute URL return

### End-to-End Tests
- Complete message lifecycle: send → ack → deliver → read
- Call lifecycle: initiate → ring → answer → signaling → end
- Chat room join order and message sending validation
- Cross-browser compatibility with different socket implementations

---

**Version**: 1.0
**Last Updated**: 2025-09-17
**Status**: Active Implementation