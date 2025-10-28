/**
 * @fileoverview Unified Socket Service - Consolidates all Socket.IO implementations
 * @version 3.2.0 
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
 * ✅ Added TypeScript support
 * ✅ Improved error handling and reconnection logic
 * ✅ Enhanced message queuing with deduplication
 * ✅ Better resource management
 * ✅ Enhanced connection quality monitoring
 * ✅ Advanced reconnection strategies
 * ✅ Connection health metrics
 */

import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';

// Import existing services but use them carefully
// Remove direct import of notificationService to avoid circular dependency
// notificationService will be injected via constructor
import connectionState from '@lib/ConnectionState.js';
// Import secure environment configuration
import secureEnvironment, { getUrlConfig, getConnectionConfig } from '../config/SecureEnvironment.js';
// Import socket event constants
import SocketEvents, { CONNECTION_EVENTS, AUTH_EVENTS, MESSAGE_EVENTS, CALL_EVENTS } from '../constants/SocketEvents.js';
// Import TypeScript types
import { ConnectionStates, SocketConfig, ConnectionStatus, MessageQueueItem, AuthData, UnifiedSocketServiceInterface } from '@types/socket.js';

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
 * Enhanced connection quality metrics
 */
export const CONNECTION_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  UNKNOWN: 'unknown'
};

/**
 * Unified Socket Service Class
 * Consolidates all socket implementations into one reliable service
 */
class UnifiedSocketService extends EventEmitter {
  /**
   * @type {Socket | null}
   */
  socket = null;
  
  /**
   * @type {ConnectionStates}
   */
  connectionState = CONNECTION_STATES.DISCONNECTED;
  
  /**
   * @type {boolean}
   */
  isConnecting = false;
  
  /**
   * @type {SocketConfig}
   */
  config;
  
  /**
   * @type {any}
   */
  currentUser = null;
  
  /**
   * @type {any}
   */
  authTokens = null;
  
  /**
   * @type {boolean}
   */
  isAuthenticated = false;
  
  /**
   * @type {number}
   */
  reconnectAttempts = 0;
  
  /**
   * @type {number}
   */
  maxReconnectAttempts;
  
  /**
   * @type {number}
   */
  reconnectDelay = 1000;
  
  /**
   * @type {number}
   */
  maxReconnectDelay;
  
  /**
   * @type {number}
   */
  backoffMultiplier = 1.5;
  
  /**
   * @type {any}
   */
  reconnectTimer = null;
  
  /**
   * @type {any}
   */
  heartbeatTimer = null;
  
  /**
   * @type {MessageQueueItem[]}
   */
  messageQueue = [];
  
  /**
   * @type {Map<string, any>}
   */
  pendingMessages = new Map();
  
  /**
   * @type {Set<string>}
   */
  onlineUsers = new Set();
  
  /**
   * @type {Map<string, any>}
   */
  eventListeners = new Map();
  
  /**
   * @type {Set<string>}
   */
  activeRooms = new Set();
  
  /**
   * @type {Set<any>}
   */
  timeouts = new Set();
  
  /**
   * @type {Map<string, number>}
   */
  messageProcessingCache = new Map();
  
  /**
   * @type {number}
   */
  messageCacheTtl = 300000; // 5 minutes
  
  /**
   * @type {number}
   */
  maxMessageCacheSize = 1000;

  /**
   * @type {Map<string, any>}
   */
  connectionMetrics = new Map();
  
  /**
   * @type {string}
   */
  connectionQuality = CONNECTION_QUALITY.UNKNOWN;
  
  /**
   * @type {number}
   */
  latency = 0;
  
  /**
   * @type {number}
   */
  packetLoss = 0;
  
  /**
   * @type {number}
   */
  jitter = 0;
  
  /**
   * @type {number}
   */
  bandwidth = 0;
  
  /**
   * @type {boolean}
   */
  isNetworkStable = true;

  constructor(notificationService = null) {
    super();
    
    console.log('🚀 UnifiedSocketService: CONSTRUCTOR STARTED', { notificationService: !!notificationService });
    
    // Connection configuration
    this.config = this.getSocketConfig();
    console.log('⚙️ UnifiedSocketService: Config loaded:', this.config);
    
    // Connection management (using secure configuration)
    this.maxReconnectAttempts = getConnectionConfig().retryAttempts;
    this.maxReconnectDelay = Math.max(getConnectionConfig().timeout, 30000);
    console.log('🔄 UnifiedSocketService: Reconnection config:', { 
      maxReconnectAttempts: this.maxReconnectAttempts, 
      maxReconnectDelay: this.maxReconnectDelay 
    });
    
    // Inject notification service to avoid circular dependency
    this.notificationService = notificationService;
    
    // Initialize service
    this.initializeService();
    
    console.log('✅ UnifiedSocketService: CONSTRUCTOR COMPLETED');
  }
  
  /**
   * Get socket configuration from secure environment
   * @returns {SocketConfig}
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
    
    // Setup periodic cleanup
    this.setupPeriodicCleanup();
    
    console.log('✅ UnifiedSocketService: Service initialized');
  }
  
  /**
   * Connect to the socket server
   * @param {AuthData | null} authData
   * @returns {Promise<Socket | null>}
   */
  async connect(authData = null) {
    console.log('🔌 UnifiedSocketService: CONNECT METHOD CALLED', { 
      authData: !!authData, 
      isConnecting: this.isConnecting, 
      connectionState: this.connectionState,
      hasSocket: !!this.socket
    });
    
    if (this.isConnecting || this.connectionState === CONNECTION_STATES.CONNECTED) {
      console.log('⚠️ UnifiedSocketService: Already connecting/connected, skipping');
      return this.socket;
    }
    
    try {
      this.isConnecting = true;
      this.setConnectionState(CONNECTION_STATES.CONNECTING);
      
      const finalAuthData = authData || this.getAuthData();
      console.log('🔐 UnifiedSocketService: Using auth data:', { 
        hasAuth: !!finalAuthData,
        authKeys: finalAuthData ? Object.keys(finalAuthData) : 'none'
      });
      
      console.log('🔌 UnifiedSocketService: Creating socket connection to:', this.config.url);
      console.log('⚙️ UnifiedSocketService: Socket options:', this.config.options);
      
      // Create socket connection
      this.socket = io(this.config.url, {
        ...this.config.options,
        auth: finalAuthData
      });
      
      console.log('🔌 UnifiedSocketService: Socket instance created:', {
        socketId: this.socket?.id,
        connected: this.socket?.connected,
        disconnected: this.socket?.disconnected
      });
      
      // Setup event handlers
      console.log('🛠️ UnifiedSocketService: Setting up socket event handlers...');
      this.setupSocketEventHandlers();
      
      // Wait for connection
      console.log('⏳ UnifiedSocketService: Waiting for connection...');
      await this.waitForConnection();
      
      console.log('✅ UnifiedSocketService: Connected successfully');
      return this.socket;
      
    } catch (error) {
      console.error('❌ UnifiedSocketService: Connection failed:', error);
      console.error('❌ UnifiedSocketService: Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      this.handleConnectionError(error);
      throw error;
    } finally {
      this.isConnecting = false;
      console.log('📝 UnifiedSocketService: Connect method finished, isConnecting reset to false');
    }
  }
  
  /**
   * Wait for socket connection to establish
   * @returns {Promise<Socket>}
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
      
      this.socket.once(CONNECTION_EVENTS.CONNECT, () => {
        clearTimeout(timeout);
        this.timeouts.delete(timeout);
        this.setConnectionState(CONNECTION_STATES.CONNECTED);
        this.reconnectAttempts = 0;
        resolve(this.socket);
      });
      
      this.socket.once(CONNECTION_EVENTS.CONNECT_ERROR, (error) => {
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
    this.socket.on(CONNECTION_EVENTS.CONNECT, () => {
      console.log('✅ UnifiedSocketService: Socket connected');
      this.setConnectionState(CONNECTION_STATES.CONNECTED);
      this.updateConnectionMetrics({ connectedAt: Date.now() });
      this.emit(CONNECTION_EVENTS.CONNECT);
      this.processMessageQueue();
      this.startHeartbeat();
      this.startConnectionQualityMonitoring();
    });
    
    this.socket.on(CONNECTION_EVENTS.DISCONNECT, (reason) => {
      console.log('📡 UnifiedSocketService: Socket disconnected:', reason);
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
      this.updateConnectionMetrics({ disconnectedAt: Date.now(), disconnectReason: reason });
      this.emit(CONNECTION_EVENTS.DISCONNECT, reason);
      this.stopHeartbeat();
      this.stopConnectionQualityMonitoring();
      
      // Auto-reconnect on certain disconnect reasons
      if (['ping timeout', 'transport close', 'transport error'].includes(reason)) {
        this.scheduleReconnect();
      }
    });
    
    this.socket.on(CONNECTION_EVENTS.CONNECT_ERROR, (error) => {
      console.error('❌ UnifiedSocketService: Connection error:', error);
      this.handleConnectionError(error);
      this.emit(CONNECTION_EVENTS.CONNECT_ERROR, error);
    });
    
    // Authentication events
    this.socket.on(AUTH_EVENTS.AUTH_SUCCESS, (data) => {
      console.log('✅ UnifiedSocketService: Authentication successful');
      this.isAuthenticated = true;
      this.currentUser = data.user;
      this.emit(AUTH_EVENTS.AUTH_SUCCESS, data);
    });
    
    this.socket.on(AUTH_EVENTS.AUTH_ERROR, (error) => {
      console.error('❌ UnifiedSocketService: Authentication error:', error);
      this.setConnectionState(CONNECTION_STATES.UNAUTHORIZED);
      this.emit(AUTH_EVENTS.AUTH_ERROR, error);
    });
    
    // Message events
    this.socket.on(MESSAGE_EVENTS.NEW_MESSAGE, (data) => {
      console.log('📩 UnifiedSocketService: Message received:', data);
      this.emit(MESSAGE_EVENTS.NEW_MESSAGE, data);
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
    
    // Heartbeat events for connection quality monitoring
    this.socket.on(CONNECTION_EVENTS.PING, (data) => {
      // Respond to server ping
      this.socket.emit(CONNECTION_EVENTS.PONG, data);
    });
    
    this.socket.on(CONNECTION_EVENTS.PONG, (data) => {
      // Calculate latency
      if (data && data.timestamp) {
        this.latency = Date.now() - data.timestamp;
        this.updateConnectionQuality();
      }
    });
    
    // Error handling
    this.socket.on(CONNECTION_EVENTS.ERROR, (error) => {
      console.error('❌ UnifiedSocketService: Socket error:', error);
      this.emit(CONNECTION_EVENTS.ERROR, error);
    });
    
    console.log('✅ UnifiedSocketService: Event handlers setup complete');
  }
  
  /**
   * Get authentication data
   * @returns {AuthData | null}
   */
  getAuthData() {
    if (typeof document === 'undefined') return null;
    
    // Get tokens from cookies (supporting multiple formats)
    // 🔒 SECURITY FIX (Issue #4): Remove direct token access from client-side JavaScript
    // HttpOnly cookies are automatically sent by the browser, no need to read them in JS
    // This prevents XSS attacks from stealing authentication tokens
    
    return {
      // Tokens are now handled by HttpOnly cookies, sent automatically by browser
      accessToken: null, // No longer read from JavaScript
      refreshToken: null, // No longer read from JavaScript
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
   * @param {ConnectionStates} state
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
   * @param {Error} error
   */
  handleConnectionError(error) {
    console.error('❌ UnifiedSocketService: Connection error:', error);
    
    this.setConnectionState(CONNECTION_STATES.FAILED);
    
    // Update connection state with error
    connectionState.updateConnection('socket', {
      errors: [{ message: error.message, timestamp: Date.now() }]
    });
    
    // Show user notification using injected service
    if (this.notificationService && typeof this.notificationService.error === 'function') {
      this.notificationService.error('Connection Error', 'Failed to connect to server. Retrying...');
    }
    
    // Schedule reconnect
    this.scheduleReconnect();
  }
  
  /**
   * Schedule reconnection attempt with advanced strategies
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ UnifiedSocketService: Max reconnect attempts reached');
      this.setConnectionState(CONNECTION_STATES.FAILED);
      this.emit('max_reconnects_reached');
      return;
    }
    
    // Advanced backoff strategy based on error type and network conditions
    const delay = this.calculateReconnectDelay();
    
    console.log(`🔄 UnifiedSocketService: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.setConnectionState(CONNECTION_STATES.RECONNECTING);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
    
    this.timeouts.add(this.reconnectTimer);
  }
  
  /**
   * Calculate reconnect delay with advanced strategies
   * @returns {number}
   */
  calculateReconnectDelay() {
    // Base exponential backoff
    let baseDelay = this.reconnectDelay * Math.pow(this.backoffMultiplier, this.reconnectAttempts);
    
    // Adjust based on network stability
    if (!this.isNetworkStable) {
      baseDelay *= 2; // Double delay if network is unstable
    }
    
    // Adjust based on connection quality
    switch (this.connectionQuality) {
      case CONNECTION_QUALITY.POOR:
        baseDelay *= 3;
        break;
      case CONNECTION_QUALITY.FAIR:
        baseDelay *= 1.5;
        break;
      case CONNECTION_QUALITY.GOOD:
        baseDelay *= 0.8;
        break;
      case CONNECTION_QUALITY.EXCELLENT:
        baseDelay *= 0.5;
        break;
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    
    // Cap at maximum delay
    return Math.min(baseDelay + jitter, this.maxReconnectDelay);
  }
  
  /**
   * Process queued messages
   */
  processMessageQueue() {
    if (!this.socket || !this.socket.connected || this.messageQueue.length === 0) {
      return;
    }
    
    console.log(`📤 UnifiedSocketService: Processing ${this.messageQueue.length} queued messages`);
    
    // Sort messages by priority (system messages first)
    const sortedMessages = [...this.messageQueue].sort((a, b) => {
      const isSystemA = a.event.startsWith('system_') || a.event === 'auth';
      const isSystemB = b.event.startsWith('system_') || b.event === 'auth';
      return isSystemA === isSystemB ? 0 : isSystemA ? -1 : 1;
    });
    
    this.messageQueue = [];
    
    sortedMessages.forEach(({ event, data, callback }) => {
      this.emitMessage(event, data, callback);
    });
  }
  
  /**
   * Enhanced message sending with deduplication
   * @param {string} event
   * @param {any} data
   * @param {Function} callback
   * @returns {boolean}
   */
  emitMessage(event, data, callback) {
    // Generate unique key for message deduplication
    const messageKey = this.generateMessageKey(event, data);
    
    // Check if we're already processing this message
    if (this.messageProcessingCache.has(messageKey)) {
      const timestamp = this.messageProcessingCache.get(messageKey);
      const age = Date.now() - timestamp;
      
      // If message is still being processed (within TTL), skip
      if (age < this.messageCacheTtl) {
        console.log('⚠️ UnifiedSocketService: Skipping duplicate message:', event);
        return false;
      }
    }
    
    // Add to processing cache
    this.messageProcessingCache.set(messageKey, Date.now());
    
    // Clean up old entries periodically
    this.cleanupMessageCache();
    
    // Send the message
    return this.emit(event, data, callback);
  }
  
  /**
   * Generate unique key for message deduplication
   * @param {string} event
   * @param {any} data
   * @returns {string}
   */
  generateMessageKey(event, data) {
    // For messages with clientMessageId, use that as the key
    if (data && data.clientMessageId) {
      return `${event}-${data.clientMessageId}`;
    }
    
    // For other messages, create a hash of the data
    try {
      const dataString = JSON.stringify(data);
      return `${event}-${this.hashCode(dataString)}`;
    } catch (error) {
      // Fallback to timestamp if serialization fails
      return `${event}-${Date.now()}`;
    }
  }
  
  /**
   * Simple hash function for string data
   * @param {string} str
   * @returns {number}
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
  
  /**
   * Clean up message cache periodically
   */
  cleanupMessageCache() {
    if (this.messageProcessingCache.size <= this.maxMessageCacheSize) {
      return;
    }
    
    const now = Date.now();
    for (const [key, timestamp] of this.messageProcessingCache.entries()) {
      if (now - timestamp > this.messageCacheTtl) {
        this.messageProcessingCache.delete(key);
      }
    }
  }
  
  /**
   * Send message through socket
   * @param {string} event
   * @param {any} data
   * @param {Function} callback
   * @returns {boolean}
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
   * @param {string} roomId
   * @returns {boolean}
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
   * @param {string} roomId
   * @returns {boolean}
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
        this.socket.emit(CONNECTION_EVENTS.PING, { timestamp: Date.now() });
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
   * Start connection quality monitoring
   */
  startConnectionQualityMonitoring() {
    // Monitor network changes
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const handleNetworkChange = () => {
        this.isNetworkStable = navigator.connection.effectiveType !== 'slow-2g';
        this.updateConnectionQuality();
      };
      
      navigator.connection.addEventListener('change', handleNetworkChange);
      this.eventListeners.set('networkChange', handleNetworkChange);
    }
    
    // Start detailed connection quality monitoring
    this.startDetailedConnectionMonitoring();
  }
  
  /**
   * Start detailed connection quality monitoring
   */
  startDetailedConnectionMonitoring() {
    if (!this.socket) return;
    
    // Clear existing monitoring
    if (this.connectionQualityTimer) {
      clearInterval(this.connectionQualityTimer);
    }
    
    // Start monitoring connection quality every 5 seconds
    this.connectionQualityTimer = setInterval(() => {
      this.measureConnectionQuality();
    }, 5000);
    
    this.timeouts.add(this.connectionQualityTimer);
  }
  
  /**
   * Measure detailed connection quality metrics
   */
  async measureConnectionQuality() {
    if (!this.socket || !this.socket.connected) return;
    
    try {
      // Measure latency
      const startTime = Date.now();
      this.socket.emit('ping', { timestamp: startTime }, (response) => {
        if (response && response.timestamp) {
          this.latency = Date.now() - response.timestamp;
        }
      });
      
      // If we have access to navigator.connection, get more detailed metrics
      if (typeof navigator !== 'undefined' && navigator.connection) {
        const connection = navigator.connection;
        this.bandwidth = connection.downlink || 0; // Mbps
        this.jitter = connection.rtt ? connection.rtt * 0.1 : 0; // Estimate jitter
      }
      
      // Update connection quality based on all metrics
      this.updateConnectionQuality();
      
      // Emit connection quality metrics for monitoring
      this.emit('connection_metrics', {
        latency: this.latency,
        packetLoss: this.packetLoss,
        jitter: this.jitter,
        bandwidth: this.bandwidth,
        quality: this.connectionQuality,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Error measuring connection quality:', error);
    }
  }
  
  /**
   * Stop connection quality monitoring
   */
  stopConnectionQualityMonitoring() {
    if (this.eventListeners.has('networkChange')) {
      const handleNetworkChange = this.eventListeners.get('networkChange');
      if (typeof navigator !== 'undefined' && navigator.connection) {
        navigator.connection.removeEventListener('change', handleNetworkChange);
      }
      this.eventListeners.delete('networkChange');
    }
    
    // Stop detailed monitoring
    if (this.connectionQualityTimer) {
      clearInterval(this.connectionQualityTimer);
      this.timeouts.delete(this.connectionQualityTimer);
      this.connectionQualityTimer = null;
    }
  }
  
  /**
   * Update connection quality based on all metrics
   */
  updateConnectionQuality() {
    // Determine quality based on multiple factors
    let qualityScore = 0;
    let factors = 0;
    
    // Latency factor (0-100)
    if (this.latency !== undefined) {
      factors++;
      if (this.latency < 100) {
        qualityScore += 100;
      } else if (this.latency < 300) {
        qualityScore += 75;
      } else if (this.latency < 500) {
        qualityScore += 50;
      } else {
        qualityScore += 25;
      }
    }
    
    // Packet loss factor (0-100)
    if (this.packetLoss !== undefined) {
      factors++;
      if (this.packetLoss < 1) {
        qualityScore += 100;
      } else if (this.packetLoss < 3) {
        qualityScore += 75;
      } else if (this.packetLoss < 5) {
        qualityScore += 50;
      } else {
        qualityScore += 25;
      }
    }
    
    // Jitter factor (0-100)
    if (this.jitter !== undefined) {
      factors++;
      if (this.jitter < 30) {
        qualityScore += 100;
      } else if (this.jitter < 50) {
        qualityScore += 75;
      } else if (this.jitter < 100) {
        qualityScore += 50;
      } else {
        qualityScore += 25;
      }
    }
    
    // Bandwidth factor (0-100)
    if (this.bandwidth !== undefined) {
      factors++;
      if (this.bandwidth > 10) {
        qualityScore += 100;
      } else if (this.bandwidth > 5) {
        qualityScore += 75;
      } else if (this.bandwidth > 2) {
        qualityScore += 50;
      } else {
        qualityScore += 25;
      }
    }
    
    // Calculate average quality score
    const averageScore = factors > 0 ? qualityScore / factors : 0;
    
    // Determine quality level
    if (averageScore >= 85) {
      this.connectionQuality = CONNECTION_QUALITY.EXCELLENT;
    } else if (averageScore >= 70) {
      this.connectionQuality = CONNECTION_QUALITY.GOOD;
    } else if (averageScore >= 50) {
      this.connectionQuality = CONNECTION_QUALITY.FAIR;
    } else {
      this.connectionQuality = CONNECTION_QUALITY.POOR;
    }
    
    this.emit('connection_quality_change', this.connectionQuality);
  }
  
  /**
   * Update connection metrics
   * @param {Object} metrics
   */
  updateConnectionMetrics(metrics) {
    this.connectionMetrics = new Map([...this.connectionMetrics, ...Object.entries(metrics)]);
  }
  
  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      console.log('🌐 UnifiedSocketService: Network online');
      this.isNetworkStable = true;
      this.updateConnectionQuality();
      if (this.connectionState === CONNECTION_STATES.DISCONNECTED) {
        this.connect();
      }
    };
    
    const handleOffline = () => {
      console.log('🌐 UnifiedSocketService: Network offline'); 
      this.isNetworkStable = false;
      this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Store references for cleanup
    this.eventListeners.set('online', handleOnline);
    this.eventListeners.set('offline', handleOffline);
  }
  
  /**
   * Setup cleanup handlers
   */
  setupCleanupHandlers() {
    if (typeof window === 'undefined') return;
    
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      this.cleanup();
    };
    
    // Cleanup on visibility change (mobile apps going to background)
    const handleVisibilityChange = () => {
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
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Store references for cleanup
    this.eventListeners.set('beforeunload', handleBeforeUnload);
    this.eventListeners.set('visibilitychange', handleVisibilityChange);
  }
  
  /**
   * Setup periodic cleanup
   */
  setupPeriodicCleanup() {
    // Clean up old timeouts and cache entries every 5 minutes
    const cleanupInterval = setInterval(() => {
      this.cleanupMessageCache();
      
      // Also update connection metrics periodically
      this.updateConnectionMetrics({
        lastCleanup: Date.now()
      });
    }, 300000); // 5 minutes
    
    this.timeouts.add(cleanupInterval);
    
    // Add connection health check every minute
    const healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // 1 minute
    
    this.timeouts.add(healthCheckInterval);
  }
  
  /**
   * Perform connection health check
   */
  performHealthCheck() {
    if (!this.socket) return;
    
    // Update connection metrics
    this.updateConnectionMetrics({
      lastHealthCheck: Date.now(),
      isConnected: this.socket.connected,
      connectionState: this.connectionState
    });
    
    // If disconnected but should be connected, try to reconnect
    if (!this.socket.connected && 
        this.connectionState !== CONNECTION_STATES.DISCONNECTED && 
        this.connectionState !== CONNECTION_STATES.FAILED) {
      console.log('🔍 UnifiedSocketService: Performing health check - attempting reconnect');
      this.connect();
    }
  }
  
  /**
   * Disconnect from socket server
   */
  disconnect() {
    console.log('🔌 UnifiedSocketService: Disconnecting...');
    
    this.setConnectionState(CONNECTION_STATES.DISCONNECTED);
    
    // Stop timers
    this.stopHeartbeat();
    this.stopConnectionQualityMonitoring();
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
    this.messageProcessingCache.clear();
    this.connectionMetrics.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log('✅ UnifiedSocketService: Cleanup complete');
  }
  
  /**
   * Get current service status
   * @returns {ConnectionStatus}
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
      socketUrl: this.config.url,
      connectionQuality: this.connectionQuality,
      latency: this.latency,
      isNetworkStable: this.isNetworkStable
    };
  }
}

// Export the class itself, not an instance, to allow proper dependency injection
// The service container will manage the singleton instance
export default UnifiedSocketService;
