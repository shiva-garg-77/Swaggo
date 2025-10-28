/*
  Type declarations for backend socket payloads and event contracts.
  This file is consumed by TypeScript tooling and JSDoc (@ts-check) in JS files.
*/

// ===== MESSAGE TYPES =====

export interface JoinChatPayload {
  chatid: string;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'gif'
  | 'voice'
  | 'system'
  | 'poll'
  | 'location'
  | 'contact';

export interface AttachmentRef {
  fileid: string;
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  fileType?: string;
}

export interface StickerData {
  id: string;
  name?: string;
  preview?: string;
  url?: string;
  category?: string;
}

export interface GifData {
  id: string;
  title?: string;
  url: string;
  thumbnail?: string;
  category?: string;
  dimensions?: { width: number; height: number };
}

export interface VoiceData {
  duration: number;
  size?: number;
  mimeType?: string;
  audioBase64?: string;
}

export interface FileData extends AttachmentRef {}

export interface SendMessagePayload {
  chatid: string;
  messageType: MessageType;
  content?: string;
  clientMessageId: string | number;
  attachments?: AttachmentRef[];
  replyTo?: string;
  mentions?: string[];
  receiverId?: string;
  stickerData?: StickerData;
  gifData?: GifData;
  voiceData?: VoiceData;
  fileData?: FileData;
  // legacy
  pollData?: any;
  locationData?: any;
  contactData?: any;
}

export interface ReactionPayload {
  messageid: string;
  emoji: string;
  chatid: string;
}

export interface MarkMessageReadPayload {
  messageid: string;
  chatid: string;
}

// ===== CALL TYPES =====

export type CallType = 'voice' | 'video';

export interface CallInitiatePayload {
  chatid: string;
  callType?: CallType;
  type?: CallType; // legacy alias
  receiverId?: string;
  callId?: string;
  participants?: string[]; // legacy format
  initiator?: string;
}

export interface CallAnswerPayload {
  callId: string;
}

export interface CallEndPayload {
  callId: string;
  reason?: string;
  chatid?: string;
}

// ===== WEBRTC TYPES =====

export interface WebRTCOfferPayload {
  chatid: string;
  sdp: string;
  type?: 'offer';
  callId?: string;
}

export interface WebRTCAnswerPayload {
  chatid: string;
  sdp: string;
  type?: 'answer';
  callId?: string;
}

export interface WebRTCIceCandidatePayload {
  chatid: string;
  candidate: any | { candidate: string };
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  callId?: string;
}

// ===== SOCKET CONTROLLER TYPES =====

export interface SocketUser {
  id: string;
  profileid: string;
  username: string;
  role?: string;
  deviceId?: string;
  sessionId?: string;
  mfaVerified?: boolean;
  isAuthenticated: boolean;
  connectedAt?: Date;
}

export interface ConnectionHealth {
  connectedAt: Date;
  lastPing: Date;
  latency: number;
  status: 'connected' | 'healthy' | 'disconnected';
  transport: string;
  userId: string;
  deviceId?: string;
  sessionId?: string;
}

export interface ActiveCall {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: 'initiated' | 'ringing' | 'answered' | 'ended';
  participants: Set<string>;
  callerSocket?: string;
  receiverSocket?: string;
  startTime: Date;
  answeredAt?: Date;
}

export interface OfflineMessage {
  messageid: string;
  message: any;
  chat: {
    chatid: string;
    lastMessageAt: Date;
  };
  timestamp: string;
  queuedAt: Date;
}

export interface ResourceLimits {
  maxActiveCalls: number;
  maxOfflineMessagesPerUser: number;
  maxOfflineUsers: number;
  maxConnectionHealth: number;
  callTimeoutMs: number;
  offlineMessageTtl: number;
  healthCheckTtl: number;
  maxMessageQueueAge: number;
  cleanupInterval: {
    calls: number;
    messages: number;
    health: number;
    general: number;
  };
}

export interface MapSizeLimits {
  onlineUsers: number;
  userSockets: number;
  offlineMessageQueue: number;
  activeCalls: number;
  connectionHealth: number;
  pushSubscriptions: number;
  joinedRooms: number;
  messageProcessingCache: number;
}

// ===== SOCKET AUTH TYPES =====

export interface AuthenticatedSocket {
  userId: string;
  profileId: string;
  username: string;
  connectedAt: Date;
  lastActivity: Date;
  riskScore?: number;
  deviceFingerprint?: string;
  ipAddress?: string;
  location?: any;
}

export interface SocketAuthContext {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  location?: any;
}

export interface TokenVerificationResult {
  valid: boolean;
  user: any;
  profile?: any;
  riskScore?: number;
  deviceTrusted?: boolean;
  reason?: string;
  payload?: any;
  metadata?: any;
  security?: any;
}

// ===== EVENT PAYLOAD TYPES =====

export interface DisconnectReasonPayload {
  reason: string;
  originalReason: string;
  timestamp: string;
}

export interface AuthSuccessPayload {
  success: boolean;
  user: {
    id: string;
    username: string;
    role: string;
  };
  session: {
    deviceId: string;
    sessionId: string;
    connectedAt: string;
  };
}

export interface AuthErrorPayload {
  error: string;
  details?: any;
  requiresRefresh?: boolean;
  disconnect?: boolean;
}

export interface ChatJoinedPayload {
  chatid: string;
  role: string;
  permissions: any;
  chatInfo: any;
  verified: boolean;
  timestamp: string;
}

export interface UserJoinedChatPayload {
  profileid: string;
  username: string;
  role: string;
  isOnline: boolean;
  joinedAt: string;
}

export interface MessageAckPayload {
  success: boolean;
  clientMessageId: string;
  messageid?: string;
  timestamp?: string;
  duplicate?: boolean;
  error?: string;
}

export interface NewMessagePayload {
  message: any;
  chat: any;
  timestamp: string;
}

export interface MessageDeliveredPayload {
  messageid: string;
  deliveredTo: string;
  deliveredAt: string;
}

export interface MessageReadPayload {
  messageid: string;
  readBy: any;
}

export interface MessageReactionPayload {
  messageid: string;
  chatid: string;
  action: 'added' | 'removed';
  reaction: {
    profileid: string;
    username: string;
    emoji: string;
    createdAt: string;
  };
  allReactions: any[];
}

export interface IncomingCallPayload {
  callId: string;
  callType: string;
  caller: {
    profileid: string;
    username: string;
    profilePic?: string;
  };
  chatid: string;
}

export interface CallAnsweredPayload {
  callId: string;
  accepted: boolean;
  answerer: any;
}

export interface CallEndedPayload {
  callId: string;
  endedBy?: any;
  reason: string;
  duration?: number;
  timestamp?: string;
}

export interface CallDeclinedPayload {
  callId: string;
  declinedBy: any;
  reason: string;
}

export interface CallTimeoutPayload {
  callId: string;
  reason: string;
  age?: number;
  status?: string;
  timestamp?: string;
}

export interface CallFailedPayload {
  callId: string;
  reason: string;
  message: string;
}

export interface UserTypingPayload {
  profileid: string;
  username: string;
  isTyping: boolean;
}

export interface UserStatusChangedPayload {
  profileid: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface RateLimitedPayload {
  message: string;
  retryAfter: number;
  action: string;
}

export interface ChatErrorPayload {
  error: string;
  chatid?: string;
  debug?: string;
}

export type OfflineMessagesDeliveredPayload = {
  success: boolean;
  messageid: string;
  duplicate?: boolean;
  preventedBy?: string;
  timestamp?: string;
}[]
