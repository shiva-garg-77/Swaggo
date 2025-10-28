/**
 * @fileoverview TypeScript types for Socket.IO service
 */

/**
 * Connection states for the unified service
 */
export const ConnectionStates = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  UNAUTHORIZED: 'unauthorized'
};

/**
 * Socket configuration options
 */
export const SocketConfig = {
  url: '',
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 20000,
  autoConnect: true,
  forceNew: false,
  rejectUnauthorized: true,
  path: '/socket.io',
  secure: true
};

/**
 * Connection status information
 */
export const ConnectionStatus = {
  state: ConnectionStates.DISCONNECTED,
  connectedAt: null,
  disconnectedAt: null,
  lastError: null,
  attempts: 0,
  latency: 0
};

/**
 * Message queue item structure
 */
export const MessageQueueItem = {
  id: '',
  event: '',
  data: {},
  timestamp: Date.now(),
  retries: 0,
  ack: false
};

/**
 * Authentication data structure
 */
export const AuthData = {
  token: '',
  refreshToken: '',
  userId: '',
  expiresAt: 0
};

/**
 * Unified Socket Service Interface
 */
export const UnifiedSocketServiceInterface = {
  connect: () => {},
  disconnect: () => {},
  emit: (event, data) => {},
  on: (event, callback) => {},
  off: (event, callback) => {},
  once: (event, callback) => {},
  removeAllListeners: () => {},
  isAuthenticated: false,
  connectionState: ConnectionStates.DISCONNECTED,
  config: SocketConfig
};

export default {
  ConnectionStates,
  SocketConfig,
  ConnectionStatus,
  MessageQueueItem,
  AuthData,
  UnifiedSocketServiceInterface
};