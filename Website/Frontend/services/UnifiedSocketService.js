/**
 * @fileoverview Unified Socket Service - Consolidates all Socket.IO implementations
 * @version 3.0.0 
 * @author Swaggo Development Team
 * 
 * @description
 * This service replaces and consolidates:
 * - SocketProvider.js
 * - SocketService.js  
 * - WebSocketManager.ts
 * - SocketClient.js
 * - SocketController.js (partial)
 * 
 * Fixes critical issues:
 * ✅ Single source of truth for Socket.IO connections
 * ✅ Proper HTTP protocol for Socket.IO (not WebSocket protocol)
 * ✅ Unified authentication handling
 * ✅ Centralized connection state management
 * ✅ Proper cleanup and lifecycle management
 * ✅ Windows RSC streaming compatibility
 */

import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

// Import existing services but use them carefully
import notificationService from './UnifiedNotificationService.js';
import connectionState from '../lib/ConnectionState.js';
// Import secure environment configuration
import secureEnvironment, { getUrlConfig, getConnectionConfig } from '../config/SecureEnvironment.js';

/**
 * Connection states for the unified service
 */
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  UNAUTHORIZED: 'unauthorized'
};

/**
 * Socket events that the service handles
 */
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect', 
  CONNECT_ERROR: 'connect_error',
  
  // Authentication events
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  
  // Message events
  MESSAGE: 'message',
  MESSAGE_SENT: 'message_sent',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  
  // User events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  
  // System events
  SYSTEM_MESSAGE: 'system_message'
};

/**
 * Unified Socket Service Class
 * Consolidates all socket implementations into one reliable service
 */
class UnifiedSocketService extends EventEmitter {
  constructor() {
    super();
    
    // Single socket instance - no more multiple connections!
    this.socket = null;
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.isConnecting = false;
    
    // Connection configuration
    this.config = this.getSocketConfig();
    
    // Authentication state
    this.currentUser = null;
    this.authTokens = null;
    this.isAuthenticated = false;
    
    // Connection management (using secure configuration)
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = getConnectionConfig().retryAttempts;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = Math.max(getConnectionConfig().timeout, 30000);
    this.backoffMultiplier = 1.5;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    
    // Message management  
    this.messageQueue = [];
    this.pendingMessages = new Map();
    this.onlineUsers = new Set();
    
    // Cleanup tracking
    this.eventListeners = new Map();
    this.activeRooms = new Set();
    this.timeouts = new Set();
    
    // Initialize service
    this.initializeService();
    
    console.log('🚀 UnifiedSocketService: Initialized successfully');
  }
  
  /**
   * Get socket configuration from secure environment
   */
  getSocketConfig() {
    // Get URLs and connection config from secure environment
    const urlConfig = getUrlConfig();
    const connectionConfig = getConnectionConfig();
    
    console.log('🔒 UnifiedSocketService: Using secure configuration:', {
      socketUrl: urlConfig.socket,
      timeout: connectionConfig.timeout,
      retryAttempts: connectionConfig.retryAttempts
    });
    
    return {
      url: urlConfig.socket,
      options: {
        autoConnect: false, // Manual connection control
        forceNew: true,
        timeout: connectionConfig.timeout,
        transports: ['websocket', 'polling'], // Socket.IO transports
        upgrade: true,
        rememberUpgrade: false,
        compression: true,
        withCredentials: true, // Important for auth cookies
        reconnection: false, // We handle reconnection manually
        // Platform-specific optimizations applied by SecureEnvironment
        pingTimeout: Math.max(connectionConfig.timeout + 5000, 25000),
        pingInterval: Math.min(connectionConfig.timeout / 2, 10000)
      }
    };
  }
  
  /**
   * Initialize the service
   */
  initializeService() {
    // Register with connection state manager
    connectionState.registerConnection('socket', {
      type: 'socket',
      url: this.config.url,
      state: CONNECTION_STATES.DISCONNECTED,
      lastPing: null,
      errors: []
    });
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Setup cleanup handlers
    this.setupCleanupHandlers();
    
    console.log('✅ UnifiedSocketService: Service initialized');
  }
  
  /**
   * Connect to the socket server
   */
  async connect(authData = null) {
    if (this.isConnecting || this.connectionState === CONNECTION_STATES.CONNECTED) {
      console.log('🔄 UnifiedSocketService: Already connecting/connected, skipping');
      return this.socket;
    }
    
    try {
      this.isConnecting = true;
      this.setConnectionState(CONNECTION_STATES.CONNECTING);
      
      console.log('🔌 UnifiedSocketService: Connecting to:', this.config.url);
      
      // Create socket connection
      this.socket = io(this.config.url, {
        ...this.config.options,
        auth: authData || this.getAuthData()
      });
      
      // Setup event handlers
      this.setupSocketEventHandlers();
      
      // Wait for connection
      await this.waitForConnection();
      
      console.log('✅ UnifiedSocketService: Connected successfully');
      return this.socket;
      
    } catch (error) {
      console.error('❌ UnifiedSocketService: Connection failed:', error);
      this.handleConnectionError(error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }
  
  /**
   * Wait for socket connection to establish
   */
  waitForConnection() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('No socket instance'));
        return;
      }
      
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.options.timeout);
      
      this.timeouts.add(timeout);
      
      this.socket.once('connect', () => {
        clearTimeout(timeout);
        this.timeouts.delete(timeout);
        this.setConnectionState(CONNECTION_STATES.CONNECTED);
        this.reconnectAttempts = 0;
        resolve(this.socket);
      });
      
      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        this.timeouts.delete(timeout);
        reject(error);
      });
    });
  }
  
  /**
   * Setup socket event handlers
   */
  setupSocketEventHandlers() {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ UnifiedSocketService: Socket connected');
      this.setConnectionState(CONNECTION_STATES.CONNECTED);
      this.emit('connect');
      this.processMessageQueue();
      this.startHeartbeat();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('📡 UnifiedSocketService: Socket disconnected:', reason);
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
      this.emit('disconnect', reason);
      this.stopHeartbeat();
      
      // Auto-reconnect on certain disconnect reasons
      if (['ping timeout', 'transport close', 'transport error'].includes(reason)) {
        this.scheduleReconnect();
      }
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ UnifiedSocketService: Connection error:', error);
      this.handleConnectionError(error);
      this.emit('connect_error', error);
    });
    
    // Authentication events
    this.socket.on('auth_success', (data) => {
      console.log('✅ UnifiedSocketService: Authentication successful');
      this.isAuthenticated = true;
      this.currentUser = data.user;
      this.emit('auth_success', data);
    });
    
    this.socket.on('auth_error', (error) => {
      console.error('❌ UnifiedSocketService: Authentication error:', error);
      this.setConnectionState(CONNECTION_STATES.UNAUTHORIZED);
      this.emit('auth_error', error);
    });
    
    // Message events
    this.socket.on('message', (data) => {
      console.log('📩 UnifiedSocketService: Message received:', data);
      this.emit('message', data);
    });
    
    // User events
    this.socket.on('user_online', (userId) => {
      this.onlineUsers.add(userId);
      this.emit('user_online', userId);
    });
    
    this.socket.on('user_offline', (userId) => {
      this.onlineUsers.delete(userId);
      this.emit('user_offline', userId);
    });
    
    console.log('✅ UnifiedSocketService: Event handlers setup complete');
  }
  
  /**
   * Get authentication data
   */
  getAuthData() {
    if (typeof document === 'undefined') return null;
    
    // Get tokens from cookies (supporting multiple formats)
    const getToken = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    
    const accessToken = getToken('accessToken') || 
                       getToken('__Secure-accessToken') || 
                       getToken('__Host-accessToken');
                       
    const refreshToken = getToken('refreshToken') || 
                        getToken('__Secure-refreshToken') || 
                        getToken('__Host-refreshToken');
    
    return {
      accessToken,
      refreshToken,
      timestamp: Date.now(),
      clientInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };
  }
  
  /**
   * Set connection state and update connection manager
   */
  setConnectionState(state) {
    this.connectionState = state;
    
    // Update connection state manager
    connectionState.updateConnection('socket', {
      state,
      lastPing: Date.now(),
      connected: state === CONNECTION_STATES.CONNECTED
    });
    
    this.emit('state_change', state);
  }
  
  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    console.error('❌ UnifiedSocketService: Connection error:', error);
    
    this.setConnectionState(CONNECTION_STATES.FAILED);
    
    // Update connection state with error
    connectionState.updateConnection('socket', {
      errors: [{ message: error.message, timestamp: Date.now() }]
    });
    
    // Show user notification
    if (notificationService && typeof notificationService.error === 'function') {
      notificationService.error('Connection Error', 'Failed to connect to server. Retrying...');
    }
    
    // Schedule reconnect
    this.scheduleReconnect();
  }
  
  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ UnifiedSocketService: Max reconnect attempts reached');
      this.setConnectionState(CONNECTION_STATES.FAILED);
      this.emit('max_reconnects_reached');
      return;
    }
    
    const delay = Math.min(
      this.reconnectDelay * Math.pow(this.backoffMultiplier, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    console.log(`🔄 UnifiedSocketService: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.setConnectionState(CONNECTION_STATES.RECONNECTING);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
    
    this.timeouts.add(this.reconnectTimer);
  }
  
  /**
   * Process queued messages
   */
  processMessageQueue() {
    if (!this.socket || !this.socket.connected || this.messageQueue.length === 0) {
      return;
    }
    
    console.log(`📤 UnifiedSocketService: Processing ${this.messageQueue.length} queued messages`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(({ event, data, callback }) => {
      this.socket.emit(event, data, callback);
    });
  }
  
  /**
   * Send message through socket
   */
  emit(event, data, callback) {
    if (!this.socket || !this.socket.connected) {
      console.log('📥 UnifiedSocketService: Queuing message:', event);
      this.messageQueue.push({ event, data, callback });
      return false;
    }
    
    this.socket.emit(event, data, callback);
    return true;
  }
  
  /**
   * Join a room
   */
  joinRoom(roomId) {
    if (this.emit('join_room', { roomId })) {
      this.activeRooms.add(roomId);
      console.log('🏠 UnifiedSocketService: Joined room:', roomId);
      return true;
    }
    return false;
  }
  
  /**
   * Leave a room  
   */
  leaveRoom(roomId) {
    if (this.emit('leave_room', { roomId })) {
      this.activeRooms.delete(roomId);
      console.log('🚪 UnifiedSocketService: Left room:', roomId);
      return true;
    }
    return false;
  }
  
  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.stopHeartbeat(); // Clear existing
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
    
    this.timeouts.add(this.heartbeatTimer);
  }
  
  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.timeouts.delete(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      console.log('🌐 UnifiedSocketService: Network online');
      if (this.connectionState === CONNECTION_STATES.DISCONNECTED) {
        this.connect();
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('🌐 UnifiedSocketService: Network offline'); 
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    });
  }
  
  /**
   * Setup cleanup handlers
   */
  setupCleanupHandlers() {
    if (typeof window === 'undefined') return;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Cleanup on visibility change (mobile apps going to background)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Don't disconnect immediately, just prepare for potential cleanup
        console.log('📱 UnifiedSocketService: App went to background');
      } else {
        // Reconnect if needed when app becomes visible again
        console.log('📱 UnifiedSocketService: App became visible');
        if (this.connectionState === CONNECTION_STATES.DISCONNECTED) {
          this.connect();
        }
      }
    });
  }
  
  /**
   * Disconnect from socket server
   */
  disconnect() {
    console.log('🔌 UnifiedSocketService: Disconnecting...');
    
    this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    
    // Stop timers
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.timeouts.delete(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Leave all rooms
    this.activeRooms.forEach(roomId => {
      if (this.socket) {
        this.socket.emit('leave_room', { roomId });
      }
    });
    this.activeRooms.clear();
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.reconnectAttempts = 0;
    
    console.log('✅ UnifiedSocketService: Disconnected');
  }
  
  /**
   * Complete cleanup of the service
   */
  cleanup() {
    console.log('🧹 UnifiedSocketService: Starting cleanup...');
    
    // Disconnect
    this.disconnect();
    
    // Clear all timeouts
    this.timeouts.forEach(timeout => {
      if (typeof timeout === 'number') {
        clearTimeout(timeout);
      } else {
        clearInterval(timeout);
      }
    });
    this.timeouts.clear();
    
    // Clear message queue
    this.messageQueue = [];
    this.pendingMessages.clear();
    this.onlineUsers.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log('✅ UnifiedSocketService: Cleanup complete');
  }
  
  /**
   * Get current service status
   */
  getStatus() {
    return {
      connectionState: this.connectionState,
      isConnected: this.connectionState === CONNECTION_STATES.CONNECTED,
      isAuthenticated: this.isAuthenticated,
      currentUser: this.currentUser,
      onlineUsersCount: this.onlineUsers.size,
      messageQueueLength: this.messageQueue.length,
      activeRoomsCount: this.activeRooms.size,
      reconnectAttempts: this.reconnectAttempts,
      socketUrl: this.config.url
    };
  }
}

// Export singleton instance
export default new UnifiedSocketService();