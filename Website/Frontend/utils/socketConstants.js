/**
 * @fileoverview JavaScript constants for Socket Service
 * @version 1.1.0
 */

// Connection states
export const ConnectionStates = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  UNAUTHORIZED: 'unauthorized'
};

// Connection quality levels
export const ConnectionQuality = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  UNKNOWN: 'unknown'
};

// Extended socket events
export const SocketEvents = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  DISCONNECT_REASON: 'disconnect_reason',
  RECONNECT: 'reconnect',
  RECONNECTING: 'reconnecting',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  
  // Authentication events
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  AUTH_REQUIRED: 'auth_required',
  AUTHENTICATED: 'authenticated',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_REFRESHED: 'token_refreshed',
  TOKENS_REFRESHED: 'tokens_refreshed',
  REFRESH_TOKEN: 'refresh_token',
  
  // Chat room events
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  CHAT_JOINED: 'chat_joined',
  CHAT_LEFT: 'chat_left',
  CHAT_ERROR: 'chat_error',
  USER_JOINED_CHAT: 'user_joined_chat',
  USER_LEFT_CHAT: 'user_left_chat',
  
  // Message events
  SEND_MESSAGE: 'send_message',
  MESSAGE_SENT: 'message_sent',
  NEW_MESSAGE: 'new_message',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_ACK: 'message_ack',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  MESSAGE_STATUS_UPDATE: 'message_status_update',
  MARK_MESSAGE_READ: 'mark_message_read',
  REACT_TO_MESSAGE: 'react_to_message',
  MESSAGE_REACTION: 'message_reaction',
  REACTION_ADDED: 'reaction_added',
  REACTION_REMOVED: 'reaction_removed',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  OFFLINE_MESSAGES_DELIVERED: 'offline_messages_delivered',
  OFFLINE_MESSAGE_QUEUED: 'offline_message_queued',
  
  // Call events
  INITIATE_CALL: 'initiate_call',
  CALL_INITIATED: 'call_initiated',
  INCOMING_CALL: 'incoming_call',
  CALL_OFFER: 'call_offer',
  ANSWER_CALL: 'answer_call',
  CALL_ANSWERED: 'call_answered',
  DECLINE_CALL: 'decline_call',
  CALL_DECLINED: 'call_declined',
  CALL_REJECTED: 'call_rejected',
  END_CALL: 'end_call',
  CALL_ENDED: 'call_ended',
  CANCEL_CALL: 'cancel_call',
  CALL_CANCELLED: 'call_cancelled',
  CALL_RINGING: 'call_ringing',
  CALL_CONNECTING: 'call_connecting',
  CALL_CONNECTED: 'call_connected',
  CALL_FAILED: 'call_failed',
  CALL_TIMEOUT: 'call_timeout',
  CALL_MISSED: 'call_missed',
  CALL_BUSY: 'call_busy',
  TOGGLE_MUTE: 'toggle_mute',
  TOGGLE_VIDEO: 'toggle_video',
  TOGGLE_SCREEN_SHARE: 'toggle_screen_share',
  MUTE_TOGGLED: 'mute_toggled',
  VIDEO_TOGGLED: 'video_toggled',
  SCREEN_SHARE_TOGGLED: 'screen_share_toggled',
  CALL_CONVERTED_TO_VOICE: 'call_converted_to_voice',
  CALL_CONVERTED_TO_VIDEO: 'call_converted_to_video',
  CALL_ANSWERED_AUDIO_ONLY: 'call_answered_audio_only',
  CALL_DURATION_SYNC: 'call_duration_sync',
  CALL_DURATION_UPDATE: 'call_duration_update',
  
  // WebRTC events
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  ICE_CANDIDATE: 'ice_candidate',
  PEER_CONNECTION_STATE: 'peer_connection_state',
  CONNECTION_STATE_CHANGE: 'connection_state_change',
  
  // Presence events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_STATUS_CHANGED: 'user_status_changed',
  ONLINE_USERS: 'online_users',
  GET_ONLINE_USERS: 'get_online_users',
  
  // System events
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_RESPONSE: 'heartbeat_response',
  RATE_LIMITED: 'rate_limited',
  CONNECTION_ERROR: 'connection_error',
  SYSTEM_MESSAGE: 'system_message',
  SERVER_ERROR: 'server_error',
  
  // Custom events
  STATE_CHANGE: 'state_change',
  CONNECTION_QUALITY_CHANGE: 'connection_quality_change',
  CONNECTION_METRICS: 'connection_metrics',
  MAX_RECONNECTS_REACHED: 'max_reconnects_reached'
};

// Socket configuration defaults
export const SocketConfigDefaults = {
  url: '',
  options: {
    autoConnect: true,
    forceNew: false,
    timeout: 20000,
    transports: ['websocket'],
    upgrade: true,
    rememberUpgrade: false,
    compression: true,
    withCredentials: true,
    reconnection: true,
    pingTimeout: 5000,
    pingInterval: 25000
  }
};

// Default connection metrics
export const DefaultConnectionMetrics = {
  connectedAt: null,
  disconnectedAt: null,
  disconnectReason: null,
  lastPing: null,
  lastPong: null,
  lastHealthCheck: null,
  lastCleanup: null,
  isConnected: false,
  connectionState: ConnectionStates.DISCONNECTED
};

// Default connection status
export const DefaultConnectionStatus = {
  connectionState: ConnectionStates.DISCONNECTED,
  isConnected: false,
  isAuthenticated: false,
  currentUser: null,
  onlineUsersCount: 0,
  messageQueueLength: 0,
  activeRoomsCount: 0,
  reconnectAttempts: 0,
  socketUrl: '',
  connectionQuality: ConnectionQuality.UNKNOWN,
  latency: 0,
  packetLoss: 0,
  jitter: 0,
  bandwidth: 0,
  isNetworkStable: true
};

export default {
  ConnectionStates,
  ConnectionQuality,
  SocketEvents,
  SocketConfigDefaults,
  DefaultConnectionMetrics,
  DefaultConnectionStatus
};