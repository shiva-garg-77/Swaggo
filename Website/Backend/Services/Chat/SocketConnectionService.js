import BaseService from '../System/BaseService.js';
import Profile from '../../Models/FeedModels/Profile.js';
import LRUCache from '../../utils/LRUCache.js';
import { logger } from '../../utils/SanitizedLogger.js';
import { AuthorizationError, ValidationError } from '../../Helper/UnifiedErrorHandling.js';
import EventBus from '../CQRS/EventBus.js';

/**
 * @fileoverview Socket connection service handling user connections, heartbeat monitoring, and online status
 * @module SocketConnectionService
 * @version 1.0.0
 * @author Swaggo Development Team
 */

class SocketConnectionService extends BaseService {
  /**
   * @constructor
   * @description Initialize socket connection service with memory-optimized data structures
   */
  constructor() {
    super();
    // EventBus will be injected by the DI container
    this.eventBus = null;
    
    // Memory-optimized maps with size limits
    this.mapSizeLimits = {
      onlineUsers: 10000,
      userSockets: 10000,
      connectionHealth: 15000
    };
    
    // Initialize LRU caches for connection tracking
    this.onlineUsers = new LRUCache(this.mapSizeLimits.onlineUsers); // profileid -> socket.id
    this.userSockets = new LRUCache(this.mapSizeLimits.userSockets); // socket.id -> user data
    this.connectionHealth = new LRUCache(this.mapSizeLimits.connectionHealth); // socket.id -> health data
    
    // Heartbeat monitoring configuration
    this.heartbeatInterval = 30000; // 30 seconds
    
    // Resource limits for memory management
    this.resourceLimits = {
      maxConnectionHealth: 2000,
      healthCheckTtl: 5 * 60 * 60 * 1000, // 5 minutes
      cleanupInterval: {
        health: 60 * 1000 // 1 minute
      }
    };
    
    // Initialize cleanup systems
    this.cleanupIntervals = {
      health: null
    };
    
    // Initialize cleanup systems (will be called after injection)
    // this.initializeCleanupSystems();
  }

  /**
   * Initialize cleanup systems for connection health
   */
  initializeCleanupSystems() {
    this.logger.info('🧹 Initializing connection cleanup systems...');
    
    // Connection health cleanup
    this.cleanupIntervals.health = setInterval(() => {
      this.cleanupConnectionHealthEnhanced();
    }, this.resourceLimits.cleanupInterval.health);
    
    this.logger.info('✅ Connection cleanup systems initialized');
  }

  /**
   * Register a new socket connection
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} userInfo - User information from authentication
   * @returns {Promise<boolean>} Success status
   */
  async registerConnection(socket, userInfo) {
    console.log('🔗 SocketConnectionService: REGISTER CONNECTION CALLED');
    console.log('🔗 SocketConnectionService: Socket ID:', socket.id);
    console.log('🔗 SocketConnectionService: User info:', {
      userId: userInfo.userId,
      username: userInfo.username,
      role: userInfo.role,
      hasDeviceId: !!userInfo.deviceId
    });
    
    return this.handleOperation(async () => {
      const { userId, username, role, deviceId, sessionId, mfaVerified } = userInfo;
      
      // Validate required user information
      if (!userId || !username) {
        console.log('❌ SocketConnectionService: Missing required user info');
        throw new ValidationError('User ID and username are required for connection registration');
      }
      console.log('✅ SocketConnectionService: User info validation passed');
      
      // Store user session data on socket
      const userData = {
        profileid: userId,
        username,
        role: role || 'user',
        deviceId,
        sessionId,
        mfaVerified: mfaVerified || false,
        isAuthenticated: true,
        connectedAt: new Date()
      };
      console.log('📝 SocketConnectionService: Setting user data on socket:', userData);
      socket.user = userData;
      
      // Add user to online users map
      console.log('🗺️ SocketConnectionService: Adding to online users map');
      this.onlineUsers.set(userId, socket.id);
      this.userSockets.set(socket.id, socket.user);
      console.log('✅ SocketConnectionService: Added to connection tracking maps');
      
      this.logger.info(`👤 User ${userId} (${username}) connected`, {
        socketId: socket.id,
        deviceId,
        sessionId
      });
      console.log('👤 SocketConnectionService: User connection logged');
      
      // Connection health tracking
      this.connectionHealth.set(socket.id, {
        connectedAt: new Date(),
        lastPing: new Date(),
        latency: 0,
        status: 'connected',
        transport: socket.conn?.transport?.name || 'unknown',
        userId: userId,
        deviceId: deviceId,
        sessionId: sessionId
      });
      
      // Update online status in database
      try {
        await this.updateUserOnlineStatus(userId, true);
      } catch (error) {
        this.logger.warn('Failed to update online status in database:', { error: error.message, userId });
      }
      
      // Emit user connected event
      this.eventBus.emit('user.connected', {
        userId,
        username,
        socketId: socket.id,
        deviceId,
        sessionId,
        timestamp: new Date().toISOString()
      });
      
      return true;
    }, 'registerConnection', { userId: userInfo.userId, socketId: socket.id });
  }

  /**
   * Start heartbeat monitoring for a socket
   * @param {Object} socket - Socket.IO socket instance
   * @returns {NodeJS.Timeout} Heartbeat interval
   */
  startHeartbeatMonitoring(socket) {
    console.log('💗 SocketConnectionService: START HEARTBEAT MONITORING');
    console.log('💗 SocketConnectionService: Socket ID:', socket.id);
    console.log('💗 SocketConnectionService: Heartbeat interval:', this.heartbeatInterval, 'ms');
    
    return this.handleOperation(() => {
      const interval = setInterval(() => {
        const timestamp = Date.now();
        console.log('💗 SocketConnectionService: Sending ping to socket:', socket.id, 'at timestamp:', timestamp);
        socket.emit('ping', timestamp);
        
        // Update connection health
        const health = this.connectionHealth.get(socket.id);
        if (health) {
          const timeSinceLastPing = timestamp - new Date(health.lastPing).getTime();
          
          // Mark as unhealthy if no response in 2 heartbeat intervals
          if (timeSinceLastPing > this.heartbeatInterval * 2) {
            health.status = 'unhealthy';
            console.log(`⚠️ SocketConnectionService: Socket ${socket.id} marked as unhealthy, time since last ping: ${timeSinceLastPing}ms`);
            this.logger.warn(`⚠️ Socket ${socket.id} marked as unhealthy`, {
              timeSinceLastPing,
              userId: socket.user?.profileid
            });
          }
        }
      }, this.heartbeatInterval);
      
      console.log('✅ SocketConnectionService: Heartbeat monitoring started for socket:', socket.id);
      return interval;
    }, 'startHeartbeatMonitoring', { socketId: socket.id });
  }

  /**
   * Handle pong response from client
   * @param {Object} socket - Socket.IO socket instance
   * @param {number} timestamp - Original ping timestamp
   */
  handlePong(socket, timestamp) {
    return this.handleOperation(() => {
      const health = this.connectionHealth.get(socket.id);
      if (health && timestamp) {
        health.lastPing = new Date();
        health.latency = Date.now() - timestamp;
        health.status = 'healthy';
        
        this.connectionHealth.set(socket.id, health);
      }
    }, 'handlePong', { socketId: socket.id });
  }

  /**
   * Handle client-initiated ping
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} data - Ping data
   * @param {Function} callback - Acknowledgment callback
   */
  handlePing(socket, data, callback) {
    return this.handleOperation(() => {
      // Immediately respond with pong acknowledgment
      if (callback && typeof callback === 'function') {
        callback({
          timestamp: Date.now(),
          serverTime: new Date().toISOString()
        });
      }
      
      // Update connection health
      const health = this.connectionHealth.get(socket.id);
      if (health) {
        health.lastPing = new Date();
        health.status = 'healthy';
        this.connectionHealth.set(socket.id, health);
      }
    }, 'handlePing', { socketId: socket.id });
  }

  /**
   * Unregister a socket connection
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} reason - Disconnect reason
   * @returns {Promise<void>}
   */
  async unregisterConnection(socket, reason) {
    return this.handleOperation(async () => {
      const userId = socket.user?.profileid;
      const username = socket.user?.username;
      
      this.logger.info(`🚪 User disconnected: ${username} (${userId}) - Reason: ${reason}`, {
        socketId: socket.id
      });
      
      // Clean up user tracking
      if (userId) {
        const existingSocketId = this.onlineUsers.get(userId);
        if (existingSocketId === socket.id) {
          this.onlineUsers.delete(userId);
          
          // Update online status in database
          try {
            await this.updateUserOnlineStatus(userId, false);
          } catch (error) {
            this.logger.warn('Failed to update offline status in database:', { 
              error: error.message, 
              userId 
            });
          }
        }
      }
      
      // Clean up socket tracking
      this.userSockets.delete(socket.id);
      this.connectionHealth.delete(socket.id);
      
      // Clear heartbeat interval
      this.cleanupHeartbeatInterval(socket);
      
      this.logger.info(`✅ Connection cleanup completed for socket: ${socket.id}`);
    }, 'unregisterConnection', { socketId: socket.id, userId: socket.user?.profileid });
  }

  /**
   * Clean up heartbeat interval for a socket
   * @param {Object} socket - Socket.IO socket instance
   */
  cleanupHeartbeatInterval(socket) {
    return this.handleOperation(() => {
      if (!socket) {
        this.logger.warn('⚠️ Heartbeat cleanup called with no socket');
        return;
      }
      
      // Try multiple properties where interval might be stored
      const intervals = [
        socket.heartbeatInterval,
        socket._heartbeatInterval,
        socket.intervals?.heartbeat
      ].filter(Boolean);
      
      let clearedCount = 0;
      
      intervals.forEach(interval => {
        try {
          // Validate interval is actually a number or object (NodeJS Timeout)
          if (typeof interval === 'number' || typeof interval === 'object') {
            clearInterval(interval);
            clearedCount++;
          }
        } catch (err) {
          this.logger.error(`❌ Failed to clear heartbeat interval:`, { error: err.message });
        }
      });
      
      // Clear all possible references
      if (socket.heartbeatInterval) {
        socket.heartbeatInterval = null;
      }
      if (socket._heartbeatInterval) {
        delete socket._heartbeatInterval;
      }
      if (socket.intervals?.heartbeat) {
        delete socket.intervals.heartbeat;
      }
      
      if (clearedCount > 0) {
        this.logger.debug(`💓 Heartbeat interval cleaned for socket: ${socket.id}`, {
          clearedCount
        });
      }
    }, 'cleanupHeartbeatInterval', { socketId: socket?.id });
  }

  /**
   * Get online users count
   * @returns {number} Number of online users
   */
  getOnlineUsersCount() {
    return this.onlineUsers.size;
  }

  /**
   * Check if user is online
   * @param {string} userId - User profile ID
   * @returns {boolean} Online status
   */
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  /**
   * Get socket ID for a user
   * @param {string} userId - User profile ID
   * @returns {string|null} Socket ID or null if not online
   */
  getUserSocketId(userId) {
    return this.onlineUsers.get(userId) || null;
  }

  /**
   * Get user data for a socket
   * @param {string} socketId - Socket ID
   * @returns {Object|null} User data or null if not found
   */
  getSocketUserData(socketId) {
    return this.userSockets.get(socketId) || null;
  }

  /**
   * Get connection health data
   * @param {string} socketId - Socket ID
   * @returns {Object|null} Connection health data or null if not found
   */
  getConnectionHealth(socketId) {
    return this.connectionHealth.get(socketId) || null;
  }

  /**
   * Get all connection health data
   * @returns {Array} Array of connection health objects
   */
  getAllConnectionHealth() {
    const healthData = [];
    for (const [socketId, health] of this.connectionHealth) {
      healthData.push({ socketId, ...health });
    }
    return healthData;
  }

  /**
   * Update user online status in database
   * @param {string} userId - User profile ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<void>}
   */
  async updateUserOnlineStatus(userId, isOnline) {
    return this.handleOperation(async () => {
      try {
        await Profile.findOneAndUpdate(
          { profileid: userId },
          { 
            isOnline,
            lastSeen: isOnline ? null : new Date()
          }
        );
      } catch (error) {
        this.logger.error('Failed to update user online status:', {
          userId,
          isOnline,
          error: error.message
        });
        throw error;
      }
    }, 'updateUserOnlineStatus', { userId, isOnline });
  }

  /**
   * Enhanced connection health cleanup
   */
  cleanupConnectionHealthEnhanced() {
    return this.handleOperation(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [socketId, healthData] of this.connectionHealth) {
        const age = now - new Date(healthData.lastPing || healthData.connectedAt).getTime();
        
        if (age > this.resourceLimits.healthCheckTtl || healthData.status === 'disconnected') {
          this.connectionHealth.delete(socketId);
          cleanedCount++;
        }
      }
      
      // Enforce max connection health entries
      if (this.connectionHealth.size > this.resourceLimits.maxConnectionHealth) {
        const excess = this.connectionHealth.size - this.resourceLimits.maxConnectionHealth;
        const oldestConnections = Array.from(this.connectionHealth.entries())
          .sort((a, b) => new Date(a[1].lastPing || a[1].connectedAt) - new Date(b[1].lastPing || b[1].connectedAt))
          .slice(0, excess);
        
        oldestConnections.forEach(([socketId]) => this.connectionHealth.delete(socketId));
        cleanedCount += excess;
      }
      
      if (cleanedCount > 0) {
        this.logger.info(`🧹 Cleaned ${cleanedCount} stale connection health entries`, {
          remaining: this.connectionHealth.size
        });
      }
    }, 'cleanupConnectionHealthEnhanced');
  }

  /**
   * Enforce map size limits to prevent memory leaks
   */
  enforceMapSizeLimits() {
    return this.handleOperation(() => {
      // Check and enforce onlineUsers limit
      if (this.onlineUsers.size > this.mapSizeLimits.onlineUsers) {
        this.logger.warn(`⚠️ onlineUsers map size exceeded: ${this.onlineUsers.size}`);
        // LRU cache will handle this automatically
      }
      
      // Check and enforce userSockets limit
      if (this.userSockets.size > this.mapSizeLimits.userSockets) {
        this.logger.warn(`⚠️ userSockets map size exceeded: ${this.userSockets.size}`);
        // LRU cache will handle this automatically
      }
      
      // Check and enforce connectionHealth limit
      if (this.connectionHealth.size > this.mapSizeLimits.connectionHealth) {
        this.logger.warn(`⚠️ connectionHealth map size exceeded: ${this.connectionHealth.size}`);
        // LRU cache will handle this automatically
      }
    }, 'enforceMapSizeLimits');
  }

  /**
   * Unregister a socket connection
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} reason - Disconnection reason
   * @returns {Promise<boolean>} Success status
   */
  async unregisterConnection(socket, reason) {
    return this.handleOperation(async () => {
      const userId = socket.user?.profileid;
      const username = socket.user?.username;
      
      this.logger.info(`🚪 User disconnected: ${username} (${userId}) - Reason: ${reason}`, {
        socketId: socket.id,
        reason
      });
      
      // Remove from online users map
      if (userId) {
        this.onlineUsers.delete(userId);
        
        // Update online status in database
        try {
          await this.updateUserOnlineStatus(userId, false);
        } catch (error) {
          this.logger.warn('Failed to update offline status in database:', { error: error.message, userId });
        }
        
        // Emit user disconnected event
        this.eventBus.emit('user.disconnected', {
          userId,
          username,
          socketId: socket.id,
          reason,
          timestamp: new Date().toISOString()
        });
      }
      
      // Remove from user sockets map
      this.userSockets.delete(socket.id);
      
      // Remove from connection health tracking
      this.connectionHealth.delete(socket.id);
      
      return true;
    }, 'unregisterConnection', { userId: socket.user?.profileid, socketId: socket.id, reason });
  }
  
  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getConnectionStats() {
    return {
      onlineUsers: this.onlineUsers.size,
      connectedSockets: this.userSockets.size,
      healthyConnections: Array.from(this.connectionHealth.values())
        .filter(health => health.status === 'healthy').length,
      unhealthyConnections: Array.from(this.connectionHealth.values())
        .filter(health => health.status === 'unhealthy').length,
      totalHealthTracked: this.connectionHealth.size
    };
  }

  /**
   * Graceful shutdown - clean up all resources
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    return this.handleOperation(async () => {
      this.logger.info('🛑 SocketConnectionService graceful shutdown initiated...');
      
      // Clear cleanup intervals
      Object.values(this.cleanupIntervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
      
      // Clear all maps
      this.onlineUsers.clear();
      this.userSockets.clear();
      this.connectionHealth.clear();
      
      this.logger.info('✅ SocketConnectionService shutdown completed');
    }, 'gracefulShutdown');
  }
}

export default SocketConnectionService;