import crypto from 'crypto';
import LRUCache from '../utils/LRUCache.js';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview WebSocket reconnection service handling automatic reconnection, session recovery, and connection state management
 * @module WebSocketReconnectionService
 * @version 1.0.0
 * @author Swaggo Development Team
 */

class WebSocketReconnectionService {
  /**
   * @constructor
   * @description Initialize WebSocket reconnection service with configuration
   */
  constructor() {
    // Reconnection configuration
    this.config = {
      maxReconnectionAttempts: 10,
      minReconnectionDelay: 1000, // 1 second
      maxReconnectionDelay: 30000, // 30 seconds
      reconnectionDelayGrowth: 1.5, // Exponential backoff factor
      sessionRecoveryTimeout: 300000, // 5 minutes
      heartbeatInterval: 25000, // 25 seconds
      heartbeatTimeout: 60000, // 60 seconds
      maxConcurrentReconnections: 100
    };

    // Session recovery tracking
    this.sessionRecovery = new LRUCache(5000); // sessionId -> session data
    
    // Reconnection state tracking
    this.reconnectionAttempts = new LRUCache(10000); // socketId -> attempt count
    this.reconnectionDelays = new LRUCache(10000); // socketId -> current delay
    
    // Active connections tracking
    this.activeConnections = new LRUCache(10000); // socketId -> connection data
    
    // Disconnection reasons tracking
    this.disconnectionReasons = new LRUCache(10000); // socketId -> reason
    
    // Initialize cleanup intervals
    this.initializeCleanup();
  }

  /**
   * Initialize cleanup intervals for memory management
   */
  initializeCleanup() {
    // Clean up old session recovery data
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Every minute

    // Clean up old reconnection attempts
    setInterval(() => {
      this.cleanupOldReconnectionAttempts();
    }, 300000); // Every 5 minutes
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} authData - Authentication data from middleware
   */
  handleNewConnection(socket, authData) {
    const sessionId = this.generateSessionId(socket, authData);
    
    // Store connection data
    this.activeConnections.set(socket.id, {
      sessionId,
      userId: authData.userId,
      username: authData.username,
      connectedAt: new Date(),
      lastActivity: new Date(),
      ipAddress: authData.ipAddress,
      deviceFingerprint: authData.deviceFingerprint
    });

    // Clear any previous reconnection attempts for this socket
    this.reconnectionAttempts.delete(socket.id);
    this.reconnectionDelays.delete(socket.id);
    this.disconnectionReasons.delete(socket.id);

    // Store session data for potential recovery
    this.sessionRecovery.set(sessionId, {
      userId: authData.userId,
      username: authData.username,
      sessionId,
      createdAt: new Date(),
      lastConnectedSocketId: socket.id,
      deviceFingerprint: authData.deviceFingerprint,
      ipAddress: authData.ipAddress
    });

    logger.info('WebSocket connection established', {
      socketId: socket.id,
      sessionId,
      userId: authData.userId,
      username: authData.username
    });
  }

  /**
   * Handle socket disconnection
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} reason - Disconnection reason
   */
  handleDisconnection(socket, reason) {
    const connectionData = this.activeConnections.get(socket.id);
    
    if (!connectionData) {
      logger.warn('Disconnection for unknown socket', {
        socketId: socket.id,
        reason
      });
      return;
    }

    // Store disconnection reason with timestamp
    this.disconnectionReasons.set(socket.id, {
      reason,
      timestamp: Date.now()
    });
    
    // Update session data
    const sessionData = this.sessionRecovery.get(connectionData.sessionId);
    if (sessionData) {
      sessionData.lastDisconnectedAt = new Date();
      sessionData.lastDisconnectionReason = reason;
      sessionData.disconnectedSocketId = socket.id;
      this.sessionRecovery.set(connectionData.sessionId, sessionData);
    }

    // Remove from active connections
    this.activeConnections.delete(socket.id);

    logger.info('WebSocket disconnected', {
      socketId: socket.id,
      sessionId: connectionData.sessionId,
      userId: connectionData.userId,
      reason,
      shouldAttemptReconnect: this.shouldAttemptReconnect(reason)
    });

    // Emit disconnection event for potential reconnection
    if (this.shouldAttemptReconnect(reason)) {
      socket.emit('disconnection_info', {
        sessionId: connectionData.sessionId,
        canReconnect: true,
        reconnectionTimeout: this.config.sessionRecoveryTimeout
      });
    }
  }

  /**
   * Determine if reconnection should be attempted based on disconnection reason
   * @param {string} reason - Disconnection reason
   * @returns {boolean} Whether reconnection should be attempted
   */
  shouldAttemptReconnect(reason) {
    // Don't attempt reconnection for these reasons
    const noReconnectReasons = [
      'transport error', // Client-side issues
      'ping timeout', // Network issues (but we'll still try)
      'transport close' // Client explicitly closed
    ];

    // Always attempt reconnection for server-side issues
    const alwaysReconnectReasons = [
      'server shutting down',
      'server error'
    ];

    // For network issues, attempt reconnection with backoff
    const networkReconnectReasons = [
      'ping timeout',
      'transport close',
      'client namespace disconnect'
    ];

    if (alwaysReconnectReasons.includes(reason)) {
      return true;
    }

    if (noReconnectReasons.includes(reason)) {
      return false;
    }

    // For network issues, use exponential backoff
    return networkReconnectReasons.includes(reason);
  }

  /**
   * Handle reconnection attempt
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} sessionId - Session ID from client
   * @returns {Object} Reconnection result
   */
  async handleReconnection(socket, sessionId) {
    const sessionData = this.sessionRecovery.get(sessionId);
    
    if (!sessionData) {
      logger.warn('Reconnection attempt with invalid session ID', {
        socketId: socket.id,
        sessionId
      });
      
      return {
        success: false,
        reason: 'Invalid session ID'
      };
    }

    // Check if session is still valid
    const sessionAge = Date.now() - new Date(sessionData.createdAt).getTime();
    if (sessionAge > this.config.sessionRecoveryTimeout) {
      logger.warn('Reconnection attempt with expired session', {
        socketId: socket.id,
        sessionId,
        sessionAge
      });
      
      // Remove expired session
      this.sessionRecovery.delete(sessionId);
      
      return {
        success: false,
        reason: 'Session expired'
      };
    }

    // Check device fingerprint match for security
    const authContext = this.extractSocketAuthContext(socket);
    if (sessionData.deviceFingerprint !== authContext.deviceFingerprint) {
      logger.warn('Reconnection attempt with different device fingerprint', {
        socketId: socket.id,
        sessionId,
        sessionDeviceFingerprint: sessionData.deviceFingerprint,
        currentDeviceFingerprint: authContext.deviceFingerprint
      });
      
      return {
        success: false,
        reason: 'Device mismatch'
      };
    }

    // Increment reconnection attempts
    let attempts = this.reconnectionAttempts.get(socket.id)?.attempts || 0;
    attempts++;
    this.reconnectionAttempts.set(socket.id, {
      attempts,
      timestamp: Date.now()
    });

    // Check max attempts
    if (attempts > this.config.maxReconnectionAttempts) {
      logger.warn('Max reconnection attempts exceeded', {
        socketId: socket.id,
        sessionId,
        attempts
      });
      
      return {
        success: false,
        reason: 'Max reconnection attempts exceeded'
      };
    }

    // Update session data
    sessionData.lastConnectedSocketId = socket.id;
    sessionData.lastReconnectedAt = new Date();
    this.sessionRecovery.set(sessionId, sessionData);

    // Store connection data
    this.activeConnections.set(socket.id, {
      sessionId,
      userId: sessionData.userId,
      username: sessionData.username,
      connectedAt: new Date(),
      lastActivity: new Date(),
      ipAddress: sessionData.ipAddress,
      deviceFingerprint: sessionData.deviceFingerprint,
      reconnected: true,
      reconnectionAttempts: attempts
    });

    logger.info('WebSocket reconnection successful', {
      socketId: socket.id,
      sessionId,
      userId: sessionData.userId,
      username: sessionData.username,
      attempts
    });

    return {
      success: true,
      sessionId,
      userId: sessionData.userId,
      username: sessionData.username,
      reconnectionAttempts: attempts
    };
  }

  /**
   * Generate a stable session ID for a socket connection
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} authData - Authentication data
   * @returns {string} Session ID
   */
  generateSessionId(socket, authData) {
    // Create a stable session ID based on user and device
    const components = [
      authData.userId,
      authData.deviceFingerprint,
      authData.ipAddress
    ];
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }

  /**
   * Extract authentication context from socket
   * @param {Object} socket - Socket.IO socket instance
   * @returns {Object} Authentication context
   */
  extractSocketAuthContext(socket) {
    return {
      ipAddress: socket.handshake.address || '127.0.0.1',
      userAgent: socket.handshake.headers['user-agent'] || 'unknown',
      deviceFingerprint: socket.authContext?.deviceFingerprint || this.generateDeviceFingerprint(socket)
    };
  }

  /**
   * Generate device fingerprint for socket
   * @param {Object} socket - Socket.IO socket instance
   * @returns {string} Device fingerprint
   */
  generateDeviceFingerprint(socket) {
    const components = [
      socket.handshake.headers['user-agent'] || '',
      socket.handshake.headers['accept-language'] || '',
      socket.handshake.headers['accept-encoding'] || '',
      socket.handshake.address || ''
    ];
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }

  /**
   * Calculate next reconnection delay with exponential backoff
   * @param {string} socketId - Socket ID
   * @returns {number} Delay in milliseconds
   */
  getNextReconnectionDelay(socketId) {
    let delayData = this.reconnectionDelays.get(socketId);
    let delay = delayData?.delay || this.config.minReconnectionDelay;
    
    // Apply exponential backoff
    delay = Math.min(
      delay * this.config.reconnectionDelayGrowth,
      this.config.maxReconnectionDelay
    );
    
    // Add some randomization to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    delay = delay + jitter;
    
    this.reconnectionDelays.set(socketId, {
      delay,
      timestamp: Date.now()
    });
    
    return delay;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Ensure sessionRecovery is iterable (it should be an LRUCache instance)
    if (!this.sessionRecovery || typeof this.sessionRecovery !== 'object') {
      logger.warn('sessionRecovery is not properly initialized');
      return;
    }
    
    // LRUCache doesn't have direct iterator, we need to use its internal cache
    const cacheEntries = [];
    if (typeof this.sessionRecovery.cache !== 'undefined' && this.sessionRecovery.cache instanceof Map) {
      // If it's an LRUCache with internal Map
      for (const [key, value] of this.sessionRecovery.cache.entries()) {
        cacheEntries.push([key, value]);
      }
    } else if (this.sessionRecovery instanceof Map) {
      // If it's directly a Map
      for (const [key, value] of this.sessionRecovery.entries()) {
        cacheEntries.push([key, value]);
      }
    } else {
      logger.warn('sessionRecovery is not a recognized iterable type');
      return;
    }
    
    for (const [sessionId, sessionData] of cacheEntries) {
      const age = now - new Date(sessionData.createdAt).getTime();
      
      if (age > this.config.sessionRecoveryTimeout) {
        this.sessionRecovery.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned ${cleanedCount} expired sessions`, {
        remaining: this.sessionRecovery.size
      });
    }
  }

  /**
   * Cleanup old reconnection attempts
   */
  cleanupOldReconnectionAttempts() {
    const now = Date.now();
    const cleanupThreshold = 300000; // 5 minutes
    
    let cleanedAttempts = 0;
    let cleanedDelays = 0;
    let cleanedReasons = 0;
    
    // Clean up old reconnection attempts
    // LRUCache doesn't support direct iteration, so we need to use its internal cache
    if (this.reconnectionAttempts && this.reconnectionAttempts.cache instanceof Map) {
      for (const [socketId, data] of this.reconnectionAttempts.cache.entries()) {
        if (data && now - data.timestamp > cleanupThreshold) {
          this.reconnectionAttempts.delete(socketId);
          cleanedAttempts++;
        }
      }
    }
    
    // Clean up old reconnection delays
    if (this.reconnectionDelays && this.reconnectionDelays.cache instanceof Map) {
      for (const [socketId, data] of this.reconnectionDelays.cache.entries()) {
        if (data && now - data.timestamp > cleanupThreshold) {
          this.reconnectionDelays.delete(socketId);
          cleanedDelays++;
        }
      }
    }
    
    // Clean up old disconnection reasons
    if (this.disconnectionReasons && this.disconnectionReasons.cache instanceof Map) {
      for (const [socketId, data] of this.disconnectionReasons.cache.entries()) {
        if (data && now - data.timestamp > cleanupThreshold) {
          this.disconnectionReasons.delete(socketId);
          cleanedReasons++;
        }
      }
    }
    
    if (cleanedAttempts + cleanedDelays + cleanedReasons > 0) {
      logger.info('Cleaned old reconnection data', {
        attempts: cleanedAttempts,
        delays: cleanedDelays,
        reasons: cleanedReasons
      });
    }
  }

  /**
   * Get reconnection statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      activeConnections: this.activeConnections.size,
      sessionRecovery: this.sessionRecovery.size,
      reconnectionAttempts: this.reconnectionAttempts.size,
      disconnectionReasons: this.disconnectionReasons.size
    };
  }

  /**
   * Graceful shutdown - clean up all resources
   */
  async gracefulShutdown() {
    logger.info('WebSocketReconnectionService shutdown initiated...');
    
    // Clear all caches
    this.sessionRecovery.clear();
    this.reconnectionAttempts.clear();
    this.reconnectionDelays.clear();
    this.activeConnections.clear();
    this.disconnectionReasons.clear();
    
    logger.info('WebSocketReconnectionService shutdown completed');
  }
}

export default new WebSocketReconnectionService();