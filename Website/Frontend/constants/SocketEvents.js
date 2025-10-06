/**
 * @fileoverview Unified Socket Event Constants
 * @version 2.0.0
 * @description Single source of truth for all socket events
 * Fixes Issue #5: Socket Event Contract Mismatches
 * 
 * CRITICAL: Backend and Frontend MUST use these exact event names
 */

/**
 * Connection Events
 */
export const CONNECTION_EVENTS = {
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
  ERROR: 'error'
};

/**
 * Authentication Events
 */
export const AUTH_EVENTS = {
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  AUTH_REQUIRED: 'auth_required',
  AUTHENTICATED: 'authenticated',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_REFRESHED: 'token_refreshed',
  TOKENS_REFRESHED: 'tokens_refreshed',
  REFRESH_TOKEN: 'refresh_token'
};

/**
 * Chat Room Events
 */
export const CHAT_EVENTS = {
  JOIN_CHAT: 'join_chat',
  LEAVE_CHAT: 'leave_chat',
  CHAT_JOINED: 'chat_joined',
  CHAT_LEFT: 'chat_left',
  CHAT_ERROR: 'chat_error',
  USER_JOINED_CHAT: 'user_joined_chat',
  USER_LEFT_CHAT: 'user_left_chat'
};

/**
 * Message Events - UNIFIED with backend
 */
export const MESSAGE_EVENTS = {
  // Sending
  SEND_MESSAGE: 'send_message',
  MESSAGE_SENT: 'message_sent',
  
  // Receiving
  NEW_MESSAGE: 'new_message',
  MESSAGE_RECEIVED: 'message_received',
  
  // Status Updates
  MESSAGE_ACK: 'message_ack',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  MESSAGE_STATUS_UPDATE: 'message_status_update',
  MARK_MESSAGE_READ: 'mark_message_read',
  
  // Reactions
  REACT_TO_MESSAGE: 'react_to_message',
  MESSAGE_REACTION: 'message_reaction',
  REACTION_ADDED: 'reaction_added',
  REACTION_REMOVED: 'reaction_removed',
  
  // Typing
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  
  // Offline Messages
  OFFLINE_MESSAGES_DELIVERED: 'offline_messages_delivered',
  OFFLINE_MESSAGE_QUEUED: 'offline_message_queued'
};

/**
 * Call Events - UNIFIED with backend
 */
export const CALL_EVENTS = {
  // Call Initiation
  INITIATE_CALL: 'initiate_call',
  CALL_INITIATED: 'call_initiated',
  INCOMING_CALL: 'incoming_call',
  CALL_OFFER: 'call_offer',
  
  // Call Actions
  ANSWER_CALL: 'answer_call',
  CALL_ANSWERED: 'call_answered',
  DECLINE_CALL: 'decline_call',
  CALL_DECLINED: 'call_declined',
  CALL_REJECTED: 'call_rejected',
  END_CALL: 'end_call',
  CALL_ENDED: 'call_ended',
  CANCEL_CALL: 'cancel_call',
  CALL_CANCELLED: 'call_cancelled',
  
  // Call States
  CALL_RINGING: 'call_ringing',
  CALL_CONNECTING: 'call_connecting',
  CALL_CONNECTED: 'call_connected',
  CALL_FAILED: 'call_failed',
  CALL_TIMEOUT: 'call_timeout',
  CALL_MISSED: 'call_missed',
  CALL_BUSY: 'call_busy',
  
  // Call Controls
  TOGGLE_MUTE: 'toggle_mute',
  TOGGLE_VIDEO: 'toggle_video',
  TOGGLE_SCREEN_SHARE: 'toggle_screen_share',
  MUTE_TOGGLED: 'mute_toggled',
  VIDEO_TOGGLED: 'video_toggled',
  SCREEN_SHARE_TOGGLED: 'screen_share_toggled',
  
  // Call Conversion
  CALL_CONVERTED_TO_VOICE: 'call_converted_to_voice',
  CALL_CONVERTED_TO_VIDEO: 'call_converted_to_video',
  CALL_ANSWERED_AUDIO_ONLY: 'call_answered_audio_only',
  
  // Call Duration
  CALL_DURATION_SYNC: 'call_duration_sync',
  CALL_DURATION_UPDATE: 'call_duration_update'
};

/**
 * WebRTC Signaling Events
 */
export const WEBRTC_EVENTS = {
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  ICE_CANDIDATE: 'ice_candidate',
  PEER_CONNECTION_STATE: 'peer_connection_state',
  CONNECTION_STATE_CHANGE: 'connection_state_change'
};

/**
 * User Presence Events
 */
export const PRESENCE_EVENTS = {
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_STATUS_CHANGED: 'user_status_changed',
  ONLINE_USERS: 'online_users',
  GET_ONLINE_USERS: 'get_online_users'
};

/**
 * System Events
 */
export const SYSTEM_EVENTS = {
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_RESPONSE: 'heartbeat_response',
  RATE_LIMITED: 'rate_limited',
  CONNECTION_ERROR: 'connection_error',
  SYSTEM_MESSAGE: 'system_message',
  SERVER_ERROR: 'server_error'
};

/**
 * All Events Combined (for type checking)
 */
export const ALL_SOCKET_EVENTS = {
  ...CONNECTION_EVENTS,
  ...AUTH_EVENTS,
  ...CHAT_EVENTS,
  ...MESSAGE_EVENTS,
  ...CALL_EVENTS,
  ...WEBRTC_EVENTS,
  ...PRESENCE_EVENTS,
  ...SYSTEM_EVENTS
};

/**
 * Event Mapping for Legacy Support
 * Maps old event names to new unified names
 */
export const LEGACY_EVENT_MAPPING = {
  // Old -> New
  'call_answer': CALL_EVENTS.ANSWER_CALL,
  'call_reject': CALL_EVENTS.DECLINE_CALL,
  'call_end': CALL_EVENTS.END_CALL,
  'message': MESSAGE_EVENTS.NEW_MESSAGE,
  'user_typing': MESSAGE_EVENTS.TYPING_START,
  'user_stopped_typing': MESSAGE_EVENTS.TYPING_STOP
};

/**
 * Get standardized event name
 */
export function getStandardizedEventName(eventName) {
  return LEGACY_EVENT_MAPPING[eventName] || eventName;
}

/**
 * Validate event name
 */
export function isValidSocketEvent(eventName) {
  return Object.values(ALL_SOCKET_EVENTS).includes(eventName);
}

/**
 * Export default object for convenience
 */
export default {
  CONNECTION: CONNECTION_EVENTS,
  AUTH: AUTH_EVENTS,
  CHAT: CHAT_EVENTS,
  MESSAGE: MESSAGE_EVENTS,
  CALL: CALL_EVENTS,
  WEBRTC: WEBRTC_EVENTS,
  PRESENCE: PRESENCE_EVENTS,
  SYSTEM: SYSTEM_EVENTS,
  ALL: ALL_SOCKET_EVENTS,
  getStandardizedEventName,
  isValidSocketEvent
};