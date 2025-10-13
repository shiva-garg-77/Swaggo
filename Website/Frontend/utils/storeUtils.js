/**
 * Store utility functions and validation helpers
 */

// Validation functions for store objects
export const validateAuthState = (auth) => {
  if (!auth) return false;
  return typeof auth === 'object' && 
    (auth.user === null || typeof auth.user === 'object') &&
    (auth.token === null || typeof auth.token === 'string') &&
    typeof auth.isAuthenticated === 'boolean' &&
    typeof auth.isLoading === 'boolean' &&
    typeof auth.initialized === 'boolean' &&
    (auth.error === null || typeof auth.error === 'string') &&
    (auth.lastUpdate === null || typeof auth.lastUpdate === 'number');
};

export const validateUser = (user) => {
  if (!user) return false;
  return typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    (user.email === undefined || typeof user.email === 'string') &&
    (user.profileImage === undefined || typeof user.profileImage === 'string') &&
    (user.status === undefined || ['online', 'offline', 'away', 'busy'].includes(user.status)) &&
    (user.lastSeen === undefined || typeof user.lastSeen === 'number');
};

export const validateChat = (chat) => {
  if (!chat) return false;
  return typeof chat === 'object' &&
    typeof chat.id === 'string' &&
    typeof chat.name === 'string' &&
    Array.isArray(chat.participants) &&
    typeof chat.createdAt === 'number' &&
    typeof chat.updatedAt === 'number' &&
    (chat.lastMessageAt === undefined || typeof chat.lastMessageAt === 'number') &&
    (chat.lastMessage === undefined || validateMessage(chat.lastMessage)) &&
    (chat.isArchived === undefined || typeof chat.isArchived === 'boolean') &&
    (chat.isMuted === undefined || typeof chat.isMuted === 'boolean') &&
    (chat.unreadCount === undefined || typeof chat.unreadCount === 'number');
};

export const validateMessage = (message) => {
  if (!message) return false;
  return typeof message === 'object' &&
    typeof message.id === 'string' &&
    typeof message.chatId === 'string' &&
    typeof message.senderId === 'string' &&
    typeof message.content === 'string' &&
    typeof message.timestamp === 'number' &&
    ['text', 'image', 'video', 'gif', 'voice', 'sticker', 'file'].includes(message.type) &&
    ['sending', 'sent', 'delivered', 'read', 'failed'].includes(message.status) &&
    (message.replyTo === undefined || typeof message.replyTo === 'string') &&
    (message.reactions === undefined || Array.isArray(message.reactions)) &&
    (message.isDeleted === undefined || typeof message.isDeleted === 'boolean') &&
    (message.edited === undefined || typeof message.edited === 'boolean') &&
    (message.editedAt === undefined || typeof message.editedAt === 'number');
};

export const validateCall = (call) => {
  if (!call) return false;
  return typeof call === 'object' &&
    typeof call.callId === 'string' &&
    typeof call.chatId === 'string' &&
    Array.isArray(call.participants) &&
    typeof call.callerId === 'string' &&
    ['initiated', 'ringing', 'connected', 'ended', 'missed'].includes(call.status) &&
    (call.startTime === undefined || typeof call.startTime === 'number') &&
    (call.endTime === undefined || typeof call.endTime === 'number') &&
    ['audio', 'video'].includes(call.type) &&
    (call.isScreenSharing === undefined || typeof call.isScreenSharing === 'boolean');
};

// Default state objects
export const DefaultAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  initialized: false,
  error: null,
  lastUpdate: null
};

export const DefaultChatState = {
  activeChat: null,
  chatList: [],
  messages: {},
  drafts: {},
  typingUsers: {},
  unreadCounts: {},
  lastReadMessages: {},
  onlineUsers: new Set(),
  messageStats: {
    totalMessages: 0,
    messagesSent: 0,
    messagesReceived: 0,
    messagesDelivered: 0,
    messagesRead: 0,
    failedMessages: 0,
    syncOperations: 0,
    conflictsResolved: 0
  }
};

export const DefaultCallState = {
  currentCall: null,
  incomingCall: null,
  callState: 'idle',
  callError: null,
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  localStream: null,
  remoteStream: null,
  callStats: null,
  callHistory: []
};

export const DefaultUIState = {
  theme: 'system',
  sidebarCollapsed: false,
  modalStack: [],
  notifications: [],
  loadingStates: {},
  connectionStatus: 'online',
  toastNotifications: []
};

export const DefaultFileState = {
  uploads: {},
  downloads: {}
};

export const DefaultSettingsState = {
  notifications: {
    sound: true,
    vibration: true,
    push: true
  },
  privacy: {
    onlineStatus: true,
    readReceipts: true,
    lastSeen: true
  },
  appearance: {
    theme: 'light',
    fontSize: 'medium',
    language: 'en'
  },
  calls: {
    autoAnswer: false,
    videoQuality: 'high',
    audioQuality: 'high'
  }
};

export const DefaultPerformanceState = {
  stateVersion: 0,
  lastUpdated: Date.now(),
  updateCounts: {},
  renderCounts: {}
};

// Utility functions
export const createMessageStats = () => ({
  totalMessages: 0,
  messagesSent: 0,
  messagesReceived: 0,
  messagesDelivered: 0,
  messagesRead: 0,
  failedMessages: 0,
  syncOperations: 0,
  conflictsResolved: 0
});

export const createCallStats = () => ({
  packetsLost: 0,
  bitrate: 0,
  latency: 0,
  quality: 'excellent'
});

export const createParticipant = (profileid, role = 'member', joinedAt = Date.now()) => ({
  profileid,
  role,
  joinedAt
});

export const createReaction = (emoji, userIds = []) => ({
  emoji,
  userIds
});

export const createMessageMetadata = (data = {}) => ({
  fileName: undefined,
  fileSize: undefined,
  mimeType: undefined,
  width: undefined,
  height: undefined,
  duration: undefined,
  url: undefined,
  thumbnail: undefined,
  ...data
});

export const createModal = (id, type, props = {}) => ({
  id,
  type,
  props
});

export const createNotification = (title, message, type = 'info', action = undefined) => ({
  id: crypto.randomUUID(),
  title,
  message,
  type,
  timestamp: Date.now(),
  read: false,
  action
});

export const createToastNotification = (title, message, type = 'info', duration = 5000) => ({
  id: crypto.randomUUID(),
  title,
  message,
  type,
  duration,
  timestamp: Date.now()
});

export const createFileUpload = (filename) => ({
  filename,
  progress: 0,
  status: 'uploading'
});

export const createFileDownload = (filename) => ({
  filename,
  progress: 0,
  status: 'downloading'
});

// State merging utilities
export const mergeAuthState = (currentState, newState) => ({
  ...currentState,
  ...newState
});

export const mergeChatState = (currentState, newState) => ({
  ...currentState,
  ...newState,
  messageStats: {
    ...currentState.messageStats,
    ...newState.messageStats
  }
});

export const mergeCallState = (currentState, newState) => ({
  ...currentState,
  ...newState
});

export const mergeUIState = (currentState, newState) => ({
  ...currentState,
  ...newState
});

export const mergeFileState = (currentState, newState) => ({
  ...currentState,
  ...newState
});

export const mergeSettingsState = (currentState, newState) => ({
  ...currentState,
  ...newState,
  notifications: {
    ...currentState.notifications,
    ...newState.notifications
  },
  privacy: {
    ...currentState.privacy,
    ...newState.privacy
  },
  appearance: {
    ...currentState.appearance,
    ...newState.appearance
  },
  calls: {
    ...currentState.calls,
    ...newState.calls
  }
});

export const mergePerformanceState = (currentState, newState) => ({
  ...currentState,
  ...newState
});

export default {
  // Validation functions
  validateAuthState,
  validateUser,
  validateChat,
  validateMessage,
  validateCall,
  
  // Default states
  DefaultAuthState,
  DefaultChatState,
  DefaultCallState,
  DefaultUIState,
  DefaultFileState,
  DefaultSettingsState,
  DefaultPerformanceState,
  
  // Utility functions
  createMessageStats,
  createCallStats,
  createParticipant,
  createReaction,
  createMessageMetadata,
  createModal,
  createNotification,
  createToastNotification,
  createFileUpload,
  createFileDownload,
  
  // State merging utilities
  mergeAuthState,
  mergeChatState,
  mergeCallState,
  mergeUIState,
  mergeFileState,
  mergeSettingsState,
  mergePerformanceState
};