import Chat from '../Models/FeedModels/Chat.js';
import Message from '../Models/FeedModels/Message.js';
import Profile from '../Models/FeedModels/Profile.js';
import CallLog from '../Models/FeedModels/CallLog.js';
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';
import dayjs from 'dayjs';
import crypto from 'crypto';
import socketRateLimiter from '../Middleware/RateLimiter.js';
import webrtcValidator from '../Utils/WebRTCValidator.js';
import SocketAuthMiddleware from '../Middleware/SocketAuthMiddleware.js';

// Configure web-push for notifications (optional - only if keys are properly configured)
let webpushConfigured = false;
try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    // Validate key lengths before setting
    const publicKeyBuffer = Buffer.from(process.env.VAPID_PUBLIC_KEY, 'base64');
    const privateKeyBuffer = Buffer.from(process.env.VAPID_PRIVATE_KEY, 'base64');
    
    if (publicKeyBuffer.length === 65 && privateKeyBuffer.length === 32) {
      webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:your-email@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      webpushConfigured = true;
      console.log('✅ Web push notifications configured successfully');
    } else {
      console.warn('⚠️ VAPID keys have incorrect length - web push notifications disabled');
      console.warn(`  Public key: ${publicKeyBuffer.length} bytes (expected 65)`);
      console.warn(`  Private key: ${privateKeyBuffer.length} bytes (expected 32)`);
    }
  } else {
    console.log('ℹ️ VAPID keys not configured - web push notifications disabled');
  }
} catch (error) {
  console.warn('⚠️ Failed to configure web push notifications:', error.message);
  console.log('ℹ️ Push notifications will be disabled, but the app will continue to work');
}

/**
 * @fileoverview Real-time Socket.IO Controller with comprehensive messaging, call management, and resource optimization
 * @module SocketController
 * @version 2.1.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Enterprise-grade Socket.IO controller providing:
 * - Real-time messaging with delivery guarantees
 * - WebRTC call management with quality monitoring
 * - Comprehensive resource management and memory leak prevention
 * - Advanced security with authentication and rate limiting
 * - Offline message queuing with TTL management
 * - Performance monitoring and health checks
 * - Graceful degradation and error recovery
 * 
 * @example
 * ```javascript
 * // Initialize socket controller
 * const socketController = new SocketController();
 * 
 * // Setup with Express server and Socket.IO
 * socketController.setupSocketIO(server, io);
 * 
 * // Handle messaging
 * socketController.handleMessage(socket, messageData);
 * 
 * // Manage WebRTC calls
 * socketController.initiateCall(callerId, targetId, callType);
 * ```
 * 
 * @requires socket.io
 * @requires ../Models/FeedModels/Chat
 * @requires ../Models/FeedModels/Message
 * @requires ../Models/FeedModels/Profile
 * @requires ../Models/FeedModels/CallLog
 * @requires uuid
 * @requires web-push
 * @requires dayjs
 * @requires crypto
 * @requires ../Middleware/RateLimiter
 * @requires ../Utils/WebRTCValidator
 * @requires ../Middleware/SocketAuthMiddleware
 */

/**
 * @class SocketController
 * @classdesc Enterprise Socket.IO controller with advanced resource management
 * 
 * @property {Map<string, string>} onlineUsers - Maps profileId to socket.id for active users
 * @property {Map<string, Object>} userSockets - Maps socket.id to comprehensive user data
 * @property {Map<string, Array>} offlineMessageQueue - Queued messages for offline users with TTL
 * @property {Map<string, Object>} activeCalls - Active WebRTC calls with quality metrics
 * @property {Map<string, Object>} connectionHealth - Socket connection health monitoring data
 * @property {Map<string, Set>} joinedRooms - Maps socket.id to joined chat rooms
 * @property {Map<string, Object>} pushSubscriptions - Web push notification subscriptions
 * @property {number} heartbeatInterval - Health check interval in milliseconds (default: 30000)
 * 
 * @since 1.0.0
 */
class SocketController {
  /**
   * @constructor
   * @description Initialize SocketController with comprehensive resource management and security features
   * 
   * Features initialized:
   * - Memory-optimized data structures with size limits
   * - Automated cleanup systems with configurable intervals
   * - Resource monitoring and health checks
   * - Graceful shutdown handlers for production stability
   * - Emergency memory management triggers
   * 
   * @example
   * ```javascript
   * const socketController = new SocketController();
   * console.log('Maps initialized:', {
   *   onlineUsers: socketController.onlineUsers.size,
   *   resourceLimits: socketController.resourceLimits
   * });
   * ```
   * 
   * @throws {Error} If critical system resources are unavailable
   * @since 1.0.0
   */
  constructor(io) {
    // Store Socket.IO instance
    this.io = io;
    
    // Online users tracking with size limits
    this.onlineUsers = new Map(); // profileid -> socket.id
    this.userSockets = new Map(); // socket.id -> user data  
    this.offlineMessageQueue = new Map(); // profileid -> [messages]
    this.activeCalls = new Map(); // callId -> call data
    this.connectionHealth = new Map(); // socket.id -> health data
    this.heartbeatInterval = 30000; // 30 seconds
    this.pushSubscriptions = new Map(); // In production, use a proper database
    this.joinedRooms = new Map(); // socket.id -> Set of chatids
    this.messageProcessingCache = new Map(); // idempotency key -> timestamp
    
    // 🔄 CRITICAL FIX: Add robust message ID tracking for Issue #3 (Message Duplication)
    this.recentMessageIds = new Map(); // clientMessageId -> timestamp (5-second window)
    this.recentMessageIdsMaxSize = 10000;
    this.recentMessageIdsWindowMs = 5000; // 5 seconds
    
    // CRITICAL: Add size monitoring and limits
    this.mapSizeLimits = {
      onlineUsers: 10000,
      userSockets: 10000, 
      offlineMessageQueue: 5000,
      activeCalls: 1000,
      connectionHealth: 15000,
      pushSubscriptions: 10000,
      joinedRooms: 15000,
      messageProcessingCache: 10000
    };
    
    // ENHANCED MEMORY MANAGEMENT: Comprehensive resource limits and cleanup
    this.resourceLimits = {
      maxActiveCalls: 500, // Reduced for better memory management
      maxOfflineMessagesPerUser: 25, // Reduced to prevent memory bloat
      maxOfflineUsers: 1000,
      maxConnectionHealth: 2000,
      callTimeoutMs: 3 * 60 * 1000, // 3 minutes for faster cleanup
      offlineMessageTtl: 12 * 60 * 60 * 1000, // 12 hours
      healthCheckTtl: 5 * 60 * 60 * 1000, // 5 minutes for faster cleanup
      maxMessageQueueAge: 2 * 60 * 60 * 1000, // 2 hours max age for queued messages
      cleanupInterval: {
        calls: 30 * 1000, // 30 seconds
        messages: 2 * 60 * 1000, // 2 minutes
        health: 60 * 1000, // 1 minute
        general: 5 * 60 * 1000 // 5 minutes
      }
    };
    
    // Cleanup intervals for different resources
    this.cleanupIntervals = {
      calls: null,
      messages: null,
      health: null,
      general: null
    };
    
    this.initializeCleanupSystems();
    
    // CRITICAL: Add graceful shutdown handler
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception in SocketController:', error);
      this.gracefulShutdown();
    });
  }
  
  /**
   * @async
   * @method gracefulShutdown
   * @description Performs graceful shutdown with comprehensive resource cleanup and connection termination
   * 
   * Shutdown sequence:
   * 1. Clear all active cleanup intervals
   * 2. Close Socket.IO server gracefully
   * 3. Terminate all active WebRTC calls
   * 4. Clear offline message queues
   * 5. Release all memory maps
   * 6. Log shutdown completion
   * 
   * @returns {Promise<void>} Promise that resolves when shutdown is complete
   * 
   * @example
   * ```javascript
   * // Graceful shutdown on SIGTERM
   * process.on('SIGTERM', async () => {
   *   await socketController.gracefulShutdown();
   *   process.exit(0);
   * });
   * ```
   * 
   * @throws {Error} If shutdown encounters critical errors
   * @since 1.0.0
   * @see {@link initializeCleanupSystems} - For cleanup system initialization
   */
  async gracefulShutdown() {
    console.log('🛑 SocketController graceful shutdown initiated...');
    
    try {
      // Clear all cleanup intervals
      Object.values(this.cleanupIntervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
      
      // Close all socket connections gracefully
      if (this.io) {
        this.io.close();
      }
      
      // Clear all maps
      this.onlineUsers.clear();
      this.userSockets.clear();
      this.offlineMessageQueue.clear();
      this.activeCalls.clear();
      this.connectionHealth.clear();
      this.pushSubscriptions.clear();
      this.joinedRooms.clear();
      this.messageProcessingCache.clear();
      
      console.log('✅ SocketController shutdown completed');
    } catch (error) {
      console.error('❌ Error during SocketController shutdown:', error);
    }
  }
  
  /**
   * Initialize comprehensive cleanup systems with enhanced monitoring
   */
  initializeCleanupSystems() {
    console.log('🧹 Initializing enhanced cleanup systems...');
    
    // Enhanced stale calls cleanup with memory monitoring
    this.cleanupIntervals.calls = setInterval(() => {
      this.periodicCleanupStaleCalls();
    }, this.resourceLimits.cleanupInterval.calls);
    
    // 🔄 CRITICAL FIX Issue #4: Add proactive stale call cleanup
    this.cleanupIntervals.staleCallsProactive = setInterval(() => {
      this.cleanupStaleCallsProactive();
    }, 30000); // Every 30 seconds
    
    // Enhanced offline message cleanup with TTL enforcement
    this.cleanupIntervals.messages = setInterval(() => {
      this.cleanupOfflineMessagesEnhanced();
    }, this.resourceLimits.cleanupInterval.messages);
    
    // Enhanced connection health cleanup with memory management
    this.cleanupIntervals.health = setInterval(() => {
      this.cleanupConnectionHealthEnhanced();
    }, this.resourceLimits.cleanupInterval.health);
    
    // Comprehensive resource cleanup with memory reporting
    this.cleanupIntervals.general = setInterval(() => {
      this.performComprehensiveCleanup();
    }, this.resourceLimits.cleanupInterval.general);
    
    // Emergency cleanup trigger for high memory usage
    this.cleanupIntervals.emergency = setInterval(() => {
      this.checkMemoryAndCleanup();
    }, 30 * 1000); // Every 30 seconds
    
    console.log('✅ Enhanced cleanup systems initialized:', {
      intervals: this.resourceLimits.cleanupInterval,
      limits: this.resourceLimits
    });
  }
  
  /**
   * Enforce map size limits to prevent memory leaks
   */
  enforceMapSizeLimits() {
    // Check and enforce onlineUsers limit
    if (this.onlineUsers.size > this.mapSizeLimits.onlineUsers) {
      console.warn(`⚠️ onlineUsers map size exceeded: ${this.onlineUsers.size}`);
      // Remove oldest entries (basic LRU)
      const excess = this.onlineUsers.size - this.mapSizeLimits.onlineUsers;
      const keysToDelete = Array.from(this.onlineUsers.keys()).slice(0, excess);
      keysToDelete.forEach(key => this.onlineUsers.delete(key));
    }
    
    // Check and enforce userSockets limit
    if (this.userSockets.size > this.mapSizeLimits.userSockets) {
      console.warn(`⚠️ userSockets map size exceeded: ${this.userSockets.size}`);
      const excess = this.userSockets.size - this.mapSizeLimits.userSockets;
      const keysToDelete = Array.from(this.userSockets.keys()).slice(0, excess);
      keysToDelete.forEach(key => this.userSockets.delete(key));
    }
    
    // Check and enforce connectionHealth limit
    if (this.connectionHealth.size > this.mapSizeLimits.connectionHealth) {
      console.warn(`⚠️ connectionHealth map size exceeded: ${this.connectionHealth.size}`);
      const excess = this.connectionHealth.size - this.mapSizeLimits.connectionHealth;
      const keysToDelete = Array.from(this.connectionHealth.keys()).slice(0, excess);
      keysToDelete.forEach(key => this.connectionHealth.delete(key));
    }
    
    // Check and enforce joinedRooms limit
    if (this.joinedRooms.size > this.mapSizeLimits.joinedRooms) {
      console.warn(`⚠️ joinedRooms map size exceeded: ${this.joinedRooms.size}`);
      const excess = this.joinedRooms.size - this.mapSizeLimits.joinedRooms;
      const keysToDelete = Array.from(this.joinedRooms.keys()).slice(0, excess);
      keysToDelete.forEach(key => this.joinedRooms.delete(key));
    }
    
    // Check and enforce activeCalls limit
    if (this.activeCalls.size > this.mapSizeLimits.activeCalls) {
      console.warn(`⚠️ activeCalls map size exceeded: ${this.activeCalls.size}`);
      // Remove oldest calls
      const callsArray = Array.from(this.activeCalls.entries())
        .sort((a, b) => new Date(a[1].startTime) - new Date(b[1].startTime));
      const excess = this.activeCalls.size - this.mapSizeLimits.activeCalls;
      
      for (let i = 0; i < excess; i++) {
        const [callId] = callsArray[i];
        this.activeCalls.delete(callId);
      }
    }
  }

  /**
   * Enhanced offline messages cleanup with TTL enforcement
   */
  cleanupOfflineMessagesEnhanced() {
    const now = Date.now();
    let totalCleaned = 0;
    let totalMessages = 0;
    
    for (const [profileId, messages] of this.offlineMessageQueue) {
      const originalCount = messages.length;
      totalMessages += originalCount;
      
      // Remove messages older than TTL
      const filteredMessages = messages.filter(msg => {
        const age = now - new Date(msg.queuedAt).getTime();
        return age < this.resourceLimits.offlineMessageTtl;
      });
      
      // Enforce per-user limit
      if (filteredMessages.length > this.resourceLimits.maxOfflineMessagesPerUser) {
        // Keep only the most recent messages
        filteredMessages.splice(0, filteredMessages.length - this.resourceLimits.maxOfflineMessagesPerUser);
      }
      
      const cleanedCount = originalCount - filteredMessages.length;
      totalCleaned += cleanedCount;
      
      if (filteredMessages.length === 0) {
        this.offlineMessageQueue.delete(profileId);
      } else {
        this.offlineMessageQueue.set(profileId, filteredMessages);
      }
    }
    
    // Enforce global offline user limit
    if (this.offlineMessageQueue.size > this.resourceLimits.maxOfflineUsers) {
      const excess = this.offlineMessageQueue.size - this.resourceLimits.maxOfflineUsers;
      const oldestUsers = Array.from(this.offlineMessageQueue.keys()).slice(0, excess);
      oldestUsers.forEach(userId => this.offlineMessageQueue.delete(userId));
      totalCleaned += excess;
    }
    
    if (totalCleaned > 0) {
      console.log(`🧹 Cleaned ${totalCleaned} offline messages (${totalMessages} total, ${this.offlineMessageQueue.size} users)`);
    }
  }

  /**
   * Enhanced connection health cleanup with memory management
   */
  cleanupConnectionHealthEnhanced() {
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
      console.log(`🧹 Cleaned ${cleanedCount} stale connection health entries (${this.connectionHealth.size} remaining)`);
    }
  }

  /**
   * Comprehensive cleanup with memory monitoring
   */
  performComprehensiveCleanup() {
    const memBefore = process.memoryUsage();
    const startTime = Date.now();
    
    console.log('🧹 Starting comprehensive cleanup...');
    
    // Clean up stale calls
    this.periodicCleanupStaleCalls();
    
    // Clean up offline messages
    this.cleanupOfflineMessagesEnhanced();
    
    // Clean up connection health
    this.cleanupConnectionHealthEnhanced();
    
    // Clean up joined rooms tracking
    this.cleanupJoinedRooms();
    
    // Clean up message processing cache
    this.cleanupMessageProcessingCache();
    
    // CRITICAL: Enforce map size limits
    this.enforceMapSizeLimits();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const memAfter = process.memoryUsage();
    const duration = Date.now() - startTime;
    const memSaved = memBefore.heapUsed - memAfter.heapUsed;
    
    console.log(`✅ Comprehensive cleanup completed in ${duration}ms:`, {
      memorySaved: `${Math.round(memSaved / 1024 / 1024 * 100) / 100}MB`,
      heapUsed: `${Math.round(memAfter.heapUsed / 1024 / 1024 * 100) / 100}MB`,
      activeCalls: this.activeCalls.size,
      offlineUsers: this.offlineMessageQueue.size,
      healthTracked: this.connectionHealth.size
    });
  }

  /**
   * Emergency memory cleanup when usage is high
   */
  checkMemoryAndCleanup() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    // Trigger emergency cleanup if memory usage > 80%
    if (memoryUsagePercent > 80) {
      console.warn(`⚠️ HIGH MEMORY USAGE: ${Math.round(memoryUsagePercent)}% (${Math.round(heapUsedMB)}MB/${Math.round(heapTotalMB)}MB)`);
      
      // Emergency cleanup - more aggressive
      this.emergencyCleanup();
    }
  }

  /**
   * Emergency cleanup - more aggressive resource management
   */
  emergencyCleanup() {
    console.log('🆘 EMERGENCY CLEANUP TRIGGERED');
    
    // More aggressive call cleanup (reduce timeout)
    const now = Date.now();
    let cleanedCalls = 0;
    
    for (const [callId, callData] of this.activeCalls) {
      const age = now - new Date(callData.startTime).getTime();
      // Emergency threshold: 30 seconds for unanswered, 5 minutes for answered
      const emergencyThreshold = callData.status === 'answered' ? 5 * 60 * 1000 : 30 * 1000;
      
      if (age > emergencyThreshold) {
        this.activeCalls.delete(callId);
        cleanedCalls++;
      }
    }
    
    // Reduce offline message limits by 50%
    const reducedLimit = Math.floor(this.resourceLimits.maxOfflineMessagesPerUser / 2);
    for (const [profileId, messages] of this.offlineMessageQueue) {
      if (messages.length > reducedLimit) {
        this.offlineMessageQueue.set(profileId, messages.slice(-reducedLimit));
      }
    }
    
    // Clear connection health for non-active sockets
    for (const [socketId] of this.connectionHealth) {
      if (!this.userSockets.has(socketId)) {
        this.connectionHealth.delete(socketId);
      }
    }
    
    console.log(`✅ Emergency cleanup completed: ${cleanedCalls} calls cleaned, limits reduced`);
  }
  
  /**
   * 🔄 CRITICAL FIX Issue #4: Proactive stale call cleanup
   * Aggressively cleans up stale calls every 30 seconds
   */
  cleanupStaleCallsProactive() {
    const now = Date.now();
    let cleanedCount = 0;
    const cleanedCalls = [];
    
    for (const [callId, callData] of this.activeCalls) {
      const age = now - new Date(callData.startTime).getTime();
      
      // 🔄 CRITICAL FIX: Aggressive timeouts to prevent stale call buildup
      // Unanswered calls: 15 seconds (reduced from 30s)
      // Answered calls: 60 seconds (reduced from 2 minutes)
      const timeout = callData.status === 'answered' ? 60000 : 15000;
      
      if (age > timeout) {
        console.log(`🧹 Cleaning stale call: ${callId} (age: ${Math.round(age/1000)}s, status: ${callData.status}, timeout: ${timeout/1000}s)`);
        
        // Notify all participants that call timed out
        const participants = [callData.callerId, callData.receiverId].filter(Boolean);
        
        for (const participantId of participants) {
          const participantSocketId = this.onlineUsers.get(participantId);
          if (participantSocketId) {
            const participantSocket = this.io.sockets.sockets.get(participantSocketId);
            if (participantSocket) {
              participantSocket.emit('call_timeout', {
                callId,
                reason: 'stale_cleanup',
                age: Math.round(age/1000),
                status: callData.status,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
        
        // Remove call
        this.activeCalls.delete(callId);
        cleanedCalls.push({ callId, age: Math.round(age/1000), status: callData.status });
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Proactive cleanup: Removed ${cleanedCount} stale calls`, {
        remaining: this.activeCalls.size,
        cleaned: cleanedCalls
      });
    }
  }

  /**
   * Cleanup joined rooms tracking
   */
  cleanupJoinedRooms() {
    let cleanedCount = 0;
    
    for (const [socketId, rooms] of this.joinedRooms) {
      // Check if socket still exists
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) {
        // Socket no longer exists, clean up room tracking
        this.joinedRooms.delete(socketId);
        cleanedCount++;
        continue;
      }
      
      // Validate each room membership
      for (const chatid of rooms) {
        try {
          // Check if socket is actually in the room
          const socketRooms = this.io.sockets.adapter.rooms.get(chatid);
          const isInRoom = socketRooms && socketRooms.has(socketId);
          
          if (!isInRoom) {
            // Socket thinks it's in the room but isn't actually there
            rooms.delete(chatid);
            cleanedCount++;
            
            console.log(`🧹 Cleaned up stale room membership: socket ${socketId} in chat ${chatid}`);
          }
        } catch (error) {
          console.error(`❌ Error validating room membership for socket ${socketId} in chat ${chatid}:`, error);
          // Remove problematic room entry
          rooms.delete(chatid);
          cleanedCount++;
        }
      }
      
      // Clean up empty room sets
      if (rooms.size === 0) {
        this.joinedRooms.delete(socketId);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} stale room memberships`);
    }
  }

  /**
   * Clean up message processing cache
   */
  cleanupMessageProcessingCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean up old entries (older than 5 minutes)
    for (const [key, timestamp] of this.messageProcessingCache.entries()) {
      if (now - timestamp > 300000) { // 5 minutes
        this.messageProcessingCache.delete(key);
        cleanedCount++;
      }
    }
    
    console.log(`✅ Cleaned up ${cleanedCount} old message processing cache entries`);
  }

  /**
   * Cleanup on socket disconnect
   */
  async cleanupOnDisconnect(socket) {
    try {
      const startTime = Date.now();
      console.log(`🧹 Cleaning up for ${socket.user?.username || 'Unknown'}`);
      
      // Remove user from active calls
      for (const [callId, callData] of this.activeCalls) {
        if (callData.participants.has(socket.id)) {
          callData.participants.delete(socket.id);
          console.log(`🧹 Removed ${socket.user?.username || 'Unknown'} from call ${callId}`);
          
          // If no participants left, delete the call
          if (callData.participants.size === 0) {
            this.activeCalls.delete(callId);
            console.log(`🧹 Deleted call ${callId}`);
          }
        }
      }
      
      // Remove user from joined rooms
      if (this.joinedRooms.has(socket.id)) {
        const rooms = this.joinedRooms.get(socket.id);
        for (const chatid of rooms) {
          this.io.sockets.adapter.socketsLeave(socket.id, chatid);
          console.log(`🧹 Removed ${socket.user?.username || 'Unknown'} from room ${chatid}`);
        }
        this.joinedRooms.delete(socket.id);
      }
      
      // Remove user from user sockets
      this.userSockets.delete(socket.id);
      console.log(`🧹 Removed ${socket.user?.username || 'Unknown'} from user sockets`);
      
      // Remove user from connection health
      this.connectionHealth.delete(socket.id);
      console.log(`🧹 Removed ${socket.user?.username || 'Unknown'} from connection health`);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Disconnect cleanup completed in ${duration}ms for ${socket.user?.username || 'Unknown'}`);
      
    } catch (error) {
      console.error('❌ Error in disconnect cleanup:', error);
    }
  }

  /**
   * Cleanup joined rooms tracking
   */
  cleanupJoinedRooms() {
    let cleanedCount = 0;
    
    for (const [socketId, rooms] of this.joinedRooms) {
      // Check if socket still exists
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) {
        // Socket no longer exists, clean up room tracking
        this.joinedRooms.delete(socketId);
        cleanedCount++;
        continue;
      }
      
      // Validate each room membership
      for (const chatid of rooms) {
        try {
          // Check if socket is actually in the room
          const socketRooms = this.io.sockets.adapter.rooms.get(chatid);
          const isInRoom = socketRooms && socketRooms.has(socketId);
          
          if (!isInRoom) {
            // Socket thinks it's in the room but isn't actually there
            rooms.delete(chatid);
            cleanedCount++;
            
            console.log(`🧹 Cleaned up stale room membership: socket ${socketId} in chat ${chatid}`);
          }
        } catch (error) {
          console.error(`❌ Error validating room membership for socket ${socketId} in chat ${chatid}:`, error);
          // Remove problematic room entry
          rooms.delete(chatid);
          cleanedCount++;
        }
      }
      
      // Clean up empty room sets
      if (rooms.size === 0) {
        this.joinedRooms.delete(socketId);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} stale room memberships`);
    }
  }
  
  /**
   * Handle enhanced disconnect with comprehensive cleanup
   */
  // Enhanced disconnect handling with comprehensive cleanup
  handleDisconnectEnhanced(socket, reason) {
    console.log(`🔌 Enhanced disconnect handler called for socket: ${socket.id}, reason: ${reason}`);
    
    try {
      // Clean up heartbeat interval FIRST to prevent memory leaks
      this.cleanupHeartbeatInterval(socket);
      
      // Clean up user calls
      this.cleanupUserCalls(socket);
      
      // Clean up connection health data
      this.connectionHealth.delete(socket.id);
      
      // Clean up room memberships
      if (this.joinedRooms.has(socket.id)) {
        const rooms = this.joinedRooms.get(socket.id);
        for (const room of rooms) {
          socket.leave(room);
          console.log(`🚪 Socket ${socket.id} left room: ${room}`);
        }
        this.joinedRooms.delete(socket.id);
      }
      
      // Remove from online users
      if (socket.user && socket.user.profileid) {
        const existingSocketId = this.onlineUsers.get(socket.user.profileid);
        if (existingSocketId === socket.id) {
          this.onlineUsers.delete(socket.user.profileid);
          console.log(`👤 User ${socket.user.profileid} (${socket.user.username}) went offline`);
          
          // Update database status
          this.updateUserOnlineStatus(socket.user.profileid, false);
        }
      }
      
      // Remove from user sockets tracking
      this.userSockets.delete(socket.id);
      
      console.log(`✅ Enhanced disconnect cleanup completed for socket: ${socket.id}`);
      
    } catch (error) {
      console.error(`❌ Error in enhanced disconnect handler for socket ${socket.id}:`, error);
    }
  }
  
  // 🔄 CRITICAL FIX Issue #7: Enhanced heartbeat interval cleanup to prevent memory leaks
  cleanupHeartbeatInterval(socket) {
    try {
      if (!socket) {
        console.warn('⚠️ Heartbeat cleanup called with no socket');
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
          console.error(`❌ Failed to clear heartbeat interval:`, err.message);
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
        console.log(`💓 Heartbeat interval cleaned for socket: ${socket.id} (cleared ${clearedCount} intervals)`);
      } else {
        console.log(`🔍 No heartbeat interval found for socket: ${socket.id}`);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up heartbeat interval for socket ${socket?.id}:`, error);
    }
  }
  
  // Clean up user calls with proper validation
  cleanupUserCalls(socket) {
    try {
      if (!socket || !socket.id) {
        console.log('⚠️ Cannot cleanup calls for invalid socket');
        return;
      }
      
      // Find all calls associated with this socket
      const userCalls = Array.from(this.activeCalls.entries())
        .filter(([callId, callData]) => 
          callData.participants.has(socket.id)
        );
      
      for (const [callId, callData] of userCalls) {
        console.log(`📞 Cleaning up call ${callId} due to user disconnect`);
        
        // Notify other participants
        callData.participants.forEach(participantId => {
          if (participantId !== socket.id) {
            const participantSocket = this.userSockets.get(participantId);
            if (participantSocket) {
              this.io.to(participantSocket).emit('call_ended', {
                callId,
                reason: 'participant_disconnected',
              });
            }
          }
        });
        
        // Remove call from active calls
        this.activeCalls.delete(callId);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up user calls for socket ${socket.id}:`, error);
    }
  }
  
  // Set up disconnect handlers
  setupDisconnectHandlers() {
    this.io.on('disconnect', (socket) => {
      this.cleanupUserCalls(socket);
      this.cleanupConnectionHealth();
      this.cleanupSocketRooms(socket); // Add room cleanup
    });
  }
  
  // Clean up socket room memberships
  cleanupSocketRooms(socket) {
    try {
      if (!socket || !socket.id) {
        console.log('⚠️ Cannot cleanup rooms for invalid socket');
        return;
      }
      
      // Clean up room memberships for this socket
      if (this.joinedRooms.has(socket.id)) {
        const rooms = this.joinedRooms.get(socket.id);
        console.log(`🧹 Cleaning up ${rooms.size} room memberships for socket ${socket.id}`);
        
        for (const room of rooms) {
          try {
            // Leave the room
            socket.leave(room);
            
            // Notify other participants that user left
            if (socket.user && socket.user.profileid) {
              this.io.to(room).emit('user_left_chat', {
                profileid: socket.user.profileid,
                username: socket.user.username,
                leftAt: new Date().toISOString()
              });
            }
            
            console.log(`🚪 Socket ${socket.id} left room: ${room}`);
          } catch (error) {
            console.error(`❌ Error leaving room ${room}:`, error);
          }
        }
        
        // Remove from tracking
        this.joinedRooms.delete(socket.id);
        console.log(`✅ Room memberships cleaned up for socket ${socket.id}`);
      }
    } catch (error) {
      console.error(`❌ Error in socket room cleanup for ${socket?.id}:`, error);
    }
  }

  // Initialize Socket.IO server
  initialize(io) {
    this.io = io;
    this.setupSocketAuthentication();
    this.setupConnectionHandling();
    return io;
  }

  // SECURE Socket.IO authentication middleware - Uses new 10/10 security AuthMiddleware
  setupSocketAuthentication() {
    // NOTE: Authentication is now handled by AuthMiddleware.socketAuth in main.js
    // This method is kept for backward compatibility but auth logic is centralized
    console.log('🔐 Socket authentication delegated to AuthMiddleware.socketAuth');
  }

  // Main connection handling with new secure auth system
  setupConnectionHandling() {
    this.io.on('connection', async (socket) => {
      try {
        // FIXED: SocketAuthMiddleware has already authenticated and set these properties
        // Get properties set by SocketAuthMiddleware with proper fallbacks
        const userId = socket.userId || socket.user?.id || socket.user?.profileid || socket.user?.userId;
        const username = socket.username || socket.user?.username;
        const role = socket.role || socket.user?.permissions?.role || socket.user?.role || 'user';
        const deviceId = socket.deviceId || socket.authContext?.deviceFingerprint;
        const sessionId = socket.sessionId || crypto.randomUUID();
        const mfaVerified = socket.mfaVerified || socket.user?.mfaEnabled || false;
        
        // Socket authentication middleware properties
        console.log('🔍 Socket properties from SocketAuthMiddleware:', {
          hasSocketUserId: !!socket.userId,
          hasSocketUsername: !!socket.username,
          hasSocketRole: !!socket.role,
          hasSocketDeviceId: !!socket.deviceId,
          hasSocketSessionId: !!socket.sessionId,
          hasSocketIsAuthenticated: !!socket.isAuthenticated,
          hasSocketUser: !!socket.user,
          socketUserKeys: socket.user ? Object.keys(socket.user) : [],
          calculatedUserId: userId,
          calculatedUsername: username,
          calculatedRole: role
        });
        
        // CRITICAL: Check if user is actually authenticated
        // Enhanced check with multiple fallbacks for different property names
        const isSocketAuthenticated = socket.isAuthenticated === true;
        const hasUserId = !!userId;
        const hasUsername = !!username;
        
        console.log('🔍 AUTH CHECK: Detailed authentication verification', {
          socketIsAuthenticated: isSocketAuthenticated,
          socketHasIsAuthenticated: typeof socket.isAuthenticated !== 'undefined',
          socketIsAuthenticatedValue: socket.isAuthenticated,
          hasUserId,
          hasUsername,
          userIdValue: userId,
          usernameValue: username,
          socketUserExists: !!socket.user,
          socketUserKeys: socket.user ? Object.keys(socket.user) : [],
          socketUserIdFromUser: socket.user?.id,
          socketUserProfileIdFromUser: socket.user?.profileid,
          socketUsernameFromUser: socket.user?.username
        });
        
        if (!isSocketAuthenticated || !hasUserId || !hasUsername) {
          console.error('❌ Socket connection rejected: User not properly authenticated', {
            socketIsAuthenticated: isSocketAuthenticated,
            hasUserId,
            hasUsername,
            userIdValue: userId,
            usernameValue: username,
            socketId: socket.id,
            socketProperties: Object.keys(socket)
          });
          
          socket.emit('auth_error', {
            code: 'AUTHENTICATION_FAILED',
            message: 'Authentication required for socket connection',
            details: {
              socketIsAuthenticated: isSocketAuthenticated,
              hasUserId,
              hasUsername,
              userIdValue: userId,
              usernameValue: username
            }
          });
          
          // Give client a moment to handle the error before disconnecting
          setTimeout(() => {
            socket.disconnect(true);
          }, 1000);
          
          return;
        }
        
        console.log(`👤 User connected: ${username} (${userId})`);
        console.log(`🔌 Connection details: Transport=${socket.conn.transport.name}, IP=${socket.handshake.address}`);
        console.log(`🔐 Auth details: Role=${role}, MFA=${mfaVerified}, Device=${deviceId}`);
        
        // Create user object for backward compatibility with existing code
        socket.user = {
          profileid: userId, // Keep old field name for compatibility
          userId: userId,
          username: username,
          role: role,
          deviceId: deviceId,
          sessionId: sessionId,
          mfaVerified: mfaVerified,
          isAuthenticated: true,
          connectedAt: new Date()
        };
        
        // Track online user
        this.onlineUsers.set(userId, socket.id);
        this.userSockets.set(socket.id, socket.user);
        
        // Start heartbeat monitoring
        const heartbeat = this.startHeartbeatMonitoring(socket);
        socket.heartbeatInterval = heartbeat;
        
        // Connection health tracking
        this.connectionHealth.set(socket.id, {
          connectedAt: new Date(),
          lastPing: new Date(),
          latency: 0,
          status: 'connected',
          transport: socket.conn.transport.name,
          userId: userId,
          deviceId: deviceId,
          sessionId: sessionId
        });
        
        // Update online status in database (if Profile model exists)
        try {
          await this.updateUserOnlineStatus(userId, true);
        } catch (error) {
          console.warn('Failed to update online status:', error.message);
        }
        
        // Join user to their personal room for notifications
        socket.join(`user_${userId}`);
        
        // Deliver any offline messages
        await this.deliverOfflineMessages(userId, socket);
        
        // Set up all event handlers
        this.setupEventHandlers(socket);
        
        // Emit connection success with session info
        socket.emit('auth_success', {
          success: true,
          user: {
            id: userId,
            username: username,
            role: role
          },
          session: {
            deviceId: deviceId,
            sessionId: sessionId,
            connectedAt: new Date().toISOString()
          }
        });
        
      } catch (error) {
        console.error('Error in connection setup:', error);
        socket.emit('connection_error', {
          success: false,
          error: 'Connection setup failed'
        });
      }
    });
    
    // Handle token expiry and auto-refresh for sockets
    this.io.engine.on('connection_error', (err) => {
      if (err.code === 'TOKEN_EXPIRED') {
        console.log('🔄 Socket token expired, client should refresh');
        // Client will receive this and should refresh token, then reconnect
      }
    });
    
    // Set up disconnect handlers
    this.setupDisconnectHandlers();
  }
  
  /**
   * Handle socket disconnections and cleanup
   */
  setupDisconnectHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('disconnect', async (reason) => {
        try {
          const userId = socket.userId;
          const username = socket.username;
          
          console.log(`🚪 User disconnected: ${username} (${userId}) - Reason: ${reason}`);
          
          // Emit disconnect reason to client for better reconnection strategy
          // Classify disconnect reasons for appropriate reconnection strategy
          let disconnectType = 'network';
          
          if (reason === 'io server disconnect') {
            disconnectType = 'server';
          } else if (reason === 'io client disconnect') {
            disconnectType = 'client';
          } else if (reason.includes('unauthorized') || reason.includes('auth')) {
            disconnectType = 'auth_failed';
          } else if (reason.includes('timeout') || reason.includes('network') || reason.includes('transport')) {
            disconnectType = 'network';
          } else {
            disconnectType = 'unknown';
          }
          
          // Notify client about disconnect reason
          socket.emit('disconnect_reason', {
            reason: disconnectType,
            originalReason: reason,
            timestamp: new Date().toISOString()
          });
          
          // Clean up user tracking
          if (userId) {
            this.onlineUsers.delete(userId);
            
            // Update online status in database
            try {
              await this.updateUserOnlineStatus(userId, false);
            } catch (error) {
              console.warn('Failed to update offline status:', error.message);
            }
          }
          
          // Clean up socket tracking
          this.userSockets.delete(socket.id);
          this.connectionHealth.delete(socket.id);
          this.joinedRooms.delete(socket.id);
          
          // Clear heartbeat interval with enhanced cleanup
          if (socket.heartbeatInterval) {
            clearInterval(socket.heartbeatInterval);
            socket.heartbeatInterval = null; // Clear reference
          }
          
          // Clean up any active calls
          this.cleanupUserCallsByUserId(userId);
          
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
      
      // Handle token expiry during active connection
      socket.on('token_expired', async () => {
        console.log(`🔄 Token expired for user: ${socket.username}`);
        
        // Emit token refresh requirement
        socket.emit('auth_error', {
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired - please refresh',
          requiresRefresh: true
        });
      });
      
      // Handle token refresh on socket
      socket.on('refresh_token', async (data) => {
        try {
          const { newToken } = data;
          
          if (!newToken) {
            socket.emit('auth_error', {
              code: 'INVALID_TOKEN',
              message: 'New token required for refresh'
            });
            return;
          }
          
          // Verify new token (reuse AuthMiddleware logic)
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(newToken, process.env.ACCESS_TOKEN_SECRET, {
            algorithms: ['HS256'],
            issuer: process.env.JWT_ISSUER || 'swaggo-auth',
            audience: process.env.JWT_AUDIENCE || 'swaggo-app'
          });
          
          // Update socket properties with new token data
          socket.userId = decoded.userId;
          socket.username = decoded.username;
          socket.role = decoded.role;
          socket.deviceId = decoded.deviceId;
          socket.sessionId = decoded.sessionId;
          socket.mfaVerified = decoded.mfaVerified;
          
          // Update user object
          socket.user.sessionId = decoded.sessionId;
          socket.user.deviceId = decoded.deviceId;
          
          console.log(`✅ Token refreshed for user: ${socket.username}`);
          
          socket.emit('token_refreshed', {
            success: true,
            sessionId: decoded.sessionId
          });
          
        } catch (error) {
          console.error('Token refresh error:', error);
          
          socket.emit('auth_error', {
            code: 'TOKEN_REFRESH_FAILED',
            message: 'Failed to refresh token',
            disconnect: true
          });
          
          socket.disconnect(true);
        }
      });
    });
  }
  
  /**
   * Clean up any active calls for a disconnected user by userId
   */
  cleanupUserCallsByUserId(userId) {
    if (!userId) return;
    
    try {
      // Find and clean up any active calls involving this user
      for (const [callId, callData] of this.activeCalls.entries()) {
        if (callData.callerId === userId || callData.receiverId === userId) {
          console.log(`📞 Cleaning up call ${callId} for disconnected user ${userId}`);
          
          // Notify the other participant
          const otherUserId = callData.callerId === userId ? callData.receiverId : callData.callerId;
          const otherSocketId = this.onlineUsers.get(otherUserId);
          
          if (otherSocketId && this.io.sockets.sockets.get(otherSocketId)) {
            this.io.sockets.sockets.get(otherSocketId).emit('call_ended', {
              callId: callId,
              reason: 'participant_disconnected',
              endedBy: userId
            });
          }
          
          // Remove the call
          this.activeCalls.delete(callId);
        }
      }
    } catch (error) {
      console.error('Error cleaning up user calls:', error);
    }
  }
  
  /**
   * Register all socket event handlers for a connected socket
   * This method is called from main.js for each new connection
   */
  registerSocketHandlers(socket) {
    // Start heartbeat monitoring
    const heartbeat = this.startHeartbeatMonitoring(socket);
    socket.heartbeatInterval = heartbeat;
    
    // Track online user
    const userId = socket.user?.profileid || socket.user?.id;
    const username = socket.user?.username;
    
    if (userId) {
      this.onlineUsers.set(userId, socket.id);
      this.userSockets.set(socket.id, socket.user);
      
      // Connection health tracking
      this.connectionHealth.set(socket.id, {
        connectedAt: new Date(),
        lastPing: new Date(),
        latency: 0,
        status: 'connected',
        transport: socket.conn?.transport?.name || 'unknown',
        userId: userId
      });
      
      // Update online status
      this.updateUserOnlineStatus(userId, true).catch(err => {
        console.warn('Failed to update online status:', err.message);
      });
      
      // Join user's personal room
      socket.join(`user_${userId}`);
      
      // Deliver offline messages
      this.deliverOfflineMessages(userId, socket).catch(err => {
        console.warn('Failed to deliver offline messages:', err.message);
      });
    }
    
    // Set up all event handlers
    this.setupEventHandlers(socket);
    
    // Set up disconnect handler
    socket.on('disconnect', async (reason) => {
      console.log(`🚪 User disconnected: ${username} (${userId}) - Reason: ${reason}`);
      
      // Clean up tracking
      if (userId) {
        this.onlineUsers.delete(userId);
        this.updateUserOnlineStatus(userId, false).catch(err => {
          console.warn('Failed to update offline status:', err.message);
        });
      }
      
      this.userSockets.delete(socket.id);
      this.connectionHealth.delete(socket.id);
      this.joinedRooms.delete(socket.id);
      
      // Clear heartbeat
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
        socket.heartbeatInterval = null;
      }
      
      // Clean up calls
      this.cleanupUserCallsByUserId(userId);
    });
  }
  
  // Set up all socket event handlers with UNIFIED EVENT CONTRACT
  setupEventHandlers(socket) {
    // Handle ping-pong for connection health
    socket.on('pong', (timestamp) => {
      const health = this.connectionHealth.get(socket.id);
      if (health && timestamp) {
        health.lastPing = new Date();
        health.latency = Date.now() - timestamp;
        health.status = 'healthy';
      }
    });

    // ==============================================
    // UNIFIED EVENT CONTRACT IMPLEMENTATION
    // ==============================================

    // Chat room management
    socket.on('join_chat', (data) => {
      // RATE LIMITING: Add rate limiting for join_chat events
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'joinChat'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited join_chat from ${socket.user?.username}: ${rateLimitCheck.type}`);
        socket.emit('rate_limited', {
          message: 'Join chat rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter,
          action: 'join_chat'
        });
        return;
      }
      
      const chatid = typeof data === 'string' ? data : data.chatid;
      if (!chatid || typeof chatid !== 'string') {
        console.error('❌ Invalid chatid in join_chat:', data);
        socket.emit('chat_error', { error: 'Invalid chatid', data });
        return;
      }
      this.handleJoinChat(socket, chatid);
    });
    socket.on('leave_chat', (data) => {
      const chatid = typeof data === 'string' ? data : data.chatid;
      if (!chatid || typeof chatid !== 'string') {
        console.error('❌ Invalid chatid in leave_chat:', data);
        socket.emit('chat_error', { error: 'Invalid chatid', data });
        return;
      }
      this.handleLeaveChat(socket, chatid);
    });

    // Messaging (UNIFIED CONTRACT)
    socket.on('send_message', (data, callback) => this.handleSendMessage(socket, data, callback));
    socket.on('typing_start', (data) => {
      // RATE LIMITING: Add rate limiting for typing events
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'typing'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited typing_start from ${socket.user?.username}: ${rateLimitCheck.type}`);
        // Don't send rate limit error for typing to avoid spamming the client
        return;
      }
      
      this.handleTypingStart(socket, data.chatid || data)
    });
    socket.on('typing_stop', (data) => {
      // RATE LIMITING: Add rate limiting for typing events
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'typing'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited typing_stop from ${socket.user?.username}: ${rateLimitCheck.type}`);
        // Don't send rate limit error for typing to avoid spamming the client
        return;
      }
      
      this.handleTypingStop(socket, data.chatid || data)
    });
    socket.on('mark_message_read', (data) => this.handleMarkMessageRead(socket, data));
    socket.on('react_to_message', (data) => {
      // RATE LIMITING: Add rate limiting for reaction events
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'general'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited react_to_message from ${socket.user?.username}: ${rateLimitCheck.type}`);
        socket.emit('rate_limited', {
          message: 'Reaction rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter,
          action: 'react_to_message'
        });
        return;
      }
      
      this.handleReactToMessage(socket, data)
    });

    // Call handling (UNIFIED CONTRACT)
    socket.on('initiate_call', (data, callback) => {
      // RATE LIMITING: Add rate limiting for call initiation
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'initiateCall'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited initiate_call from ${socket.user?.username}: ${rateLimitCheck.type}`);
        if (callback) {
          callback({
            success: false,
            error: 'Call initiation rate limit exceeded',
            retryAfter: rateLimitCheck.retryAfter
          });
        }
        return;
      }
      
      this.handleInitiateCall(socket, data, callback)
    });
    socket.on('answer_call', (data) => this.handleAnswerCall(socket, data));
    socket.on('end_call', (data) => this.handleEndCall(socket, data));
    socket.on('call_cancelled', (data) => this.handleCallCancelled(socket, data));

    // WebRTC signaling (UNIFIED CONTRACT)
    socket.on('webrtc_offer', (data) => this.handleWebRTCOffer(socket, data));
    socket.on('webrtc_answer', (data) => this.handleWebRTCAnswer(socket, data));
    socket.on('webrtc_ice_candidate', (data) => this.handleWebRTCIceCandidate(socket, data));

    // ==============================================
    // LEGACY COMPATIBILITY LAYER
    // ==============================================

    // Legacy call events (emit parallel events for compatibility)
    socket.on('call_offer', (data, callback) => this.handleInitiateCall(socket, data, callback));
    socket.on('call_answer', (data) => this.handleAnswerCall(socket, data));
    socket.on('decline_call', (data) => this.handleDeclineCall(socket, data));
    socket.on('call_reject', (data) => this.handleDeclineCall(socket, data));
    socket.on('call_end', (data) => this.handleEndCall(socket, data));
    socket.on('cancel_call', (data) => this.handleCallCancelled(socket, data));

    // Legacy WebRTC events
    socket.on('ice_candidate', (data) => this.handleWebRTCIceCandidate(socket, data));

    // Call controls
    socket.on('toggle_mute', (data) => this.handleToggleMute(socket, data));
    socket.on('toggle_video', (data) => this.handleToggleVideo(socket, data));
    socket.on('toggle_screen_share', (data) => this.handleToggleScreenShare(socket, data));
    
    // Call duration synchronization
    socket.on('call_duration_sync', (data) => this.handleCallDurationSync(socket, data));
    
    // Call conversion events
    socket.on('call_converted_to_voice', (data) => this.handleCallConvertedToVoice(socket, data));
    socket.on('call_converted_to_video', (data) => this.handleCallConvertedToVideo(socket, data));
    socket.on('call_answered_audio_only', (data) => this.handleCallAnsweredAudioOnly(socket, data));

    // Enhanced disconnect handling with comprehensive cleanup
    socket.on('disconnect', (reason) => this.handleDisconnectEnhanced(socket, reason));
  }

  // Heartbeat monitoring
  startHeartbeatMonitoring(socket) {
    // Validate socket is connected before starting heartbeat
    if (!socket || !socket.connected) {
      console.warn('⚠️ Cannot start heartbeat for disconnected socket');
      return null;
    }
    
    const heartbeat = setInterval(() => {
      // Check if socket is still connected before sending ping
      if (socket.connected) {
        const startTime = Date.now();
        socket.emit('ping', startTime, (responseTime) => {
          if (responseTime) {
            const latency = Date.now() - responseTime;
            this.connectionHealth.set(socket.id, {
              lastPing: new Date(),
              latency,
              status: 'healthy'
            });
          }
        });
      } else {
        // Socket is disconnected, clear the interval
        clearInterval(heartbeat);
        this.connectionHealth.delete(socket.id);
        
        // Remove reference from socket if it exists
        if (socket.heartbeatInterval === heartbeat) {
          socket.heartbeatInterval = null;
        }
      }
    }, this.heartbeatInterval);
    
    // Store reference to heartbeat on socket
    socket.heartbeatInterval = heartbeat;
    
    console.log(`💓 Heartbeat monitoring started for socket: ${socket.id}`);
    return heartbeat;
  }

  // Utility functions
  async updateUserOnlineStatus(profileId, isOnline, lastSeen = new Date()) {
    try {
      await Profile.findOneAndUpdate(
        { profileid: profileId },
        {
          isOnline: isOnline,
          lastSeen: lastSeen
        }
      );
      
      // Broadcast status to all user's chat participants
      const userChats = await Chat.find({ 'participants.profileid': profileId, isActive: true });
      for (const chat of userChats) {
        this.io.to(chat.chatid).emit('user_status_changed', {
          profileid: profileId,
          isOnline: isOnline,
          lastSeen: lastSeen
        });
      }
    } catch (error) {
      console.error('❌ Error updating user online status:', error);
    }
  }

  async deliverOfflineMessages(profileId, socket) {
    try {
      const queuedMessages = this.offlineMessageQueue.get(profileId);
      if (queuedMessages && queuedMessages.length > 0) {
        console.log(`📬 Delivering ${queuedMessages.length} offline messages to ${profileId}`);
        
        const deliveryResults = [];
        
        for (const messageData of queuedMessages) {
          try {
            // Validate message data before delivery
            if (!messageData.message || !messageData.message.messageid) {
              console.warn('⚠️ Invalid message data in queue:', messageData);
              deliveryResults.push({ success: false, messageid: 'unknown', error: 'Invalid message data' });
              continue;
            }
            
            // Update message status to delivered in database
            const updateResult = await Message.findOneAndUpdate(
              { messageid: messageData.messageid },
              {
                messageStatus: 'delivered',
                $push: {
                  deliveredTo: {
                    profileid: profileId,
                    deliveredAt: new Date()
                  }
                }
              }
            );
            
            if (updateResult) {
              // Emit message to client
              socket.emit('message_received', messageData.message);
              deliveryResults.push({ success: true, messageid: messageData.message.messageid });
            } else {
              console.warn('⚠️ Message not found in database:', messageData.message.messageid);
              deliveryResults.push({ success: false, messageid: messageData.message.messageid, error: 'Message not found' });
            }
          } catch (error) {
            console.error('❌ Error delivering message:', error);
            deliveryResults.push({ success: false, messageid: messageData.message.messageid, error: error.message });
          }
        }
        
        // Clear delivered messages from queue
        this.offlineMessageQueue.delete(profileId);
        
        // Emit delivery results to client
        socket.emit('offline_messages_delivered', deliveryResults);
      }
    } catch (error) {
      console.error('❌ Error delivering offline messages:', error);
    }
  }

  async sendPushNotification(profileId, notification) {
    try {
      // Check if webpush is configured before attempting to send
      if (!webpushConfigured) {
        // Silently skip push notifications if not configured
        return;
      }
      
      const subscription = this.pushSubscriptions.get(profileId);
      if (subscription && process.env.VAPID_PUBLIC_KEY) {
        await webpush.sendNotification(subscription, JSON.stringify(notification));
        console.log(`📤 Push notification sent to user ${profileId}`);
      }
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
    }
  }

  // Event handlers (simplified versions - implement full logic as needed)
  async handleJoinChat(socket, chatid) {
    try {
      console.log(`📥 join_chat event received - chatid: ${chatid}, user: ${socket.user?.username} (${socket.user?.profileid})`);
      
      if (!chatid) {
        const error = 'Missing chatid for join_chat';
        console.error(`❌ ${error}`);
        socket.emit('chat_error', { error, chatid });
        throw new Error(error);
      }
      
      const chat = await Chat.findOne({ chatid, isActive: true });
      
      if (!chat) {
        const error = 'Chat not found or inactive';
        console.error(`❌ ${error}: ${chatid}`);
        socket.emit('chat_error', { error, chatid });
        throw new Error(error);
      }
      
      console.log(`🔍 Chat found: ${chatid}, checking participant status...`);
      console.log(`🔍 Chat participants:`, chat.participants.map(p => ({ profileid: p.profileid, role: p.role })));
      
      if (!chat.isParticipant(socket.user.profileid)) {
        const error = 'Unauthorized to join this chat - not a participant';
        console.error(`❌ ${error}: user ${socket.user.profileid} not in chat ${chatid}`);
        socket.emit('chat_error', { error, chatid });
        throw new Error(error);
      }
      
      // Join the socket room
      socket.join(chatid);
      console.log(`✅ Socket joined room: ${chatid}`);
      
      // Track joined rooms for this socket with validation
      if (!this.joinedRooms.has(socket.id)) {
        this.joinedRooms.set(socket.id, new Set());
      }
      this.joinedRooms.get(socket.id).add(chatid);
      
      // Validate that the socket is actually in the room
      const socketRooms = this.io.sockets.adapter.rooms.get(chatid);
      const isInRoom = socketRooms && socketRooms.has(socket.id);
      
      if (!isInRoom) {
        console.error(`❌ Failed to verify socket room membership: ${chatid}`);
        // Clean up tracking if join failed
        if (this.joinedRooms.has(socket.id)) {
          this.joinedRooms.get(socket.id).delete(chatid);
          if (this.joinedRooms.get(socket.id).size === 0) {
            this.joinedRooms.delete(socket.id);
          }
        }
        socket.leave(chatid); // Ensure socket leaves if join failed
        
        const error = 'Failed to join chat room - verification failed';
        socket.emit('chat_error', { error, chatid });
        throw new Error(error);
      }
      
      console.log(`📨 ${socket.user.username} successfully joined chat: ${chatid}`);
      
      // Get user's role and permissions
      const participant = chat.getParticipant(socket.user.profileid);
      console.log(`🔍 Participant info:`, { role: participant?.role, permissions: Object.keys(participant?.permissions || {}) });
      
      // Notify other participants
      socket.to(chatid).emit('user_joined_chat', {
        profileid: socket.user.profileid,
        username: socket.user.username,
        role: participant?.role || 'member',
        isOnline: true,
        joinedAt: new Date().toISOString()
      });
      
      // Send confirmation to user with their permissions
      socket.emit('chat_joined', {
        chatid,
        role: participant?.role || 'member',
        permissions: participant?.permissions || {},
        chatInfo: {
          chatName: chat.chatName,
          chatType: chat.chatType,
          participantCount: chat.participants.length,
          settings: chat.chatSettings
        },
        // Include verification that join was successful
        verified: true,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Join chat completed successfully for ${socket.user.username} in ${chatid}`);
      
    } catch (error) {
      console.error(`❌ Error joining chat ${chatid}:`, {
        error: error.message,
        stack: error.stack,
        user: socket.user.profileid,
        username: socket.user.username
      });
      socket.emit('chat_error', { 
        error: 'Failed to join chat: ' + error.message, 
        chatid,
        debug: 'Check server logs for details'
      });
      throw error; // Re-throw for auto-join error handling
    }
  }

  handleLeaveChat(socket, chatid) {
    socket.leave(chatid);
    
    // Remove from tracked joined rooms
    if (this.joinedRooms.has(socket.id)) {
      this.joinedRooms.get(socket.id).delete(chatid);
    }
    
    socket.to(chatid).emit('user_left', {
      profileid: socket.user.profileid,
      username: socket.user.username
    });
    console.log(`📤 ${socket.user.username} left chat: ${chatid}`);
  }

  async handleSendMessage(socket, data, callback) {
    try {
      console.log('📨 send_message event received:.................................................................................................................................................................................', data);
      const { chatid, messageType, content, clientMessageId, attachments, replyTo, mentions, receiverId } = data;
      
      console.log(`📤 Processing send_message:`, { chatid, messageType, clientMessageId, hasContent: !!content, hasAttachments: attachments?.length > 0 });
      
      // IMPROVED: Enhanced idempotency validation to prevent duplicate message processing
      // Check if we're already processing a message with the same clientMessageId
      const idempotencyKeyUpsert = `${socket.user.profileid}-${clientMessageId}`;
      if (this.messageProcessingCache.has(idempotencyKeyUpsert)) {
        console.log(`⚠️ Idempotency check: Message already being processed: ${clientMessageId}`);
        // Return early to prevent duplicate processing
        return;
      }
      
      // Add to processing cache with timestamp
      this.messageProcessingCache.set(idempotencyKeyUpsert, Date.now());
      
      // Clean up old entries periodically
      if (this.messageProcessingCache.size > 1000) {
        const now = Date.now();
        for (const [key, timestamp] of this.messageProcessingCache.entries()) {
          if (now - timestamp > 300000) { // 5 minutes
            this.messageProcessingCache.delete(key);
          }
        }
      }
      
      // SECURITY: Rate limiting check
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'sendMessage'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited message from ${socket.user?.username}: ${rateLimitCheck.type}`);
        const ackResponse = {
          success: false,
          clientMessageId,
          error: `Rate limit exceeded. Please wait ${rateLimitCheck.retryAfter} seconds.`,
          code: 'RATE_LIMITED',
          retryAfter: rateLimitCheck.retryAfter,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        // Clean up idempotency key
        this.messageProcessingCache.delete(idempotencyKeyUpsert);
        return;
      }
      
      // Validate required fields per UNIFIED CONTRACT
      if (!chatid || !clientMessageId) {
        const error = 'Missing required fields: chatid and clientMessageId';
        const ackResponse = {
          success: false,
          clientMessageId: clientMessageId || null,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // ENFORCE: if socket has not joined chat room, auto-retry join then reject if still fails
      if (!this.joinedRooms.has(socket.id) || !this.joinedRooms.get(socket.id).has(chatid)) {
        console.log(`⚠️ User not in chat room, attempting auto-join for chatid: ${chatid}`);
        
        try {
          // Attempt automatic join before sending message
          await this.handleJoinChat(socket, chatid);
          
          // Check if join was successful with enhanced validation
          const joinSuccess = this.joinedRooms.has(socket.id) && this.joinedRooms.get(socket.id).has(chatid);
          
          // Additional verification: check if socket is actually in the room
          if (joinSuccess) {
            const socketRooms = this.io.sockets.adapter.rooms.get(chatid);
            const isInRoom = socketRooms && socketRooms.has(socket.id);
            
            if (!isInRoom) {
              console.error(`❌ Socket room verification failed after auto-join: ${chatid}`);
              joinSuccess = false;
            }
          }
          
          if (!joinSuccess) {
            const error = 'Failed to join chat room - cannot send message';
            const ackResponse = {
              success: false,
              clientMessageId,
              error,
              debug: 'Auto-join failed',
              timestamp: new Date().toISOString()
            };
            console.error(`❌ Auto-join failed for chatid: ${chatid}, user: ${socket.user.profileid}`);
            if (callback) callback(ackResponse);
            return;
          }
          
          console.log(`✅ Auto-join successful for chatid: ${chatid}`);
          
        } catch (joinError) {
          const error = `Auto-join failed: ${joinError.message}`;
          const ackResponse = {
            success: false,
            clientMessageId,
            error,
            debug: 'Auto-join exception',
            timestamp: new Date().toISOString()
          };
          console.error(`❌ Auto-join exception for chatid: ${chatid}:`, joinError);
          if (callback) callback(ackResponse);
          return;
        }
      }
      
      // Validate message content per message type
      if (messageType === 'text' || messageType === 'system') {
        if (!content) {
          const error = 'Missing required field: content for text/system message';
          const ackResponse = {
            success: false,
            clientMessageId,
            error,
            timestamp: new Date().toISOString()
          };
          if (callback) callback(ackResponse);
          return;
        }
      }
      
      // Validate media message types
      if (messageType === 'sticker' && !data.stickerData) {
        const error = 'Missing required field: stickerData for sticker message';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if (messageType === 'gif' && !data.gifData) {
        const error = 'Missing required field: gifData for gif message';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if (messageType === 'voice' && !data.voiceData) {
        const error = 'Missing required field: voiceData for voice message';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if ((messageType === 'image' || messageType === 'video' || messageType === 'audio' || messageType === 'document') && !data.fileData) {
        const error = `Missing required field: fileData for ${messageType} message`;
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // Validate that message has content or media data
      const hasTextContent = content && content.trim();
      const hasMediaData = data.stickerData || data.gifData || data.voiceData || data.fileData;
      const hasAttachments = attachments && attachments.length > 0;
      
      if (!hasTextContent && !hasMediaData && !hasAttachments) {
        const error = 'Message must have content, media data, or attachments';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // Verify user has access to this chat and can send messages
      const chat = await Chat.findOne({ chatid, isActive: true });
      
      if (!chat || !chat.isParticipant(socket.user.profileid)) {
        const errorMsg = 'Chat not found or user is not a participant';
        const ackResponse = {
          success: false,
          clientMessageId,
          error: errorMsg,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if (!chat.canSendMessage(socket.user.profileid)) {
        const errorMsg = 'Insufficient permissions to send messages in this chat';
        const ackResponse = {
          success: false,
          clientMessageId,
          error: errorMsg,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      console.log('🔧 Creating message with validated parameters:', {
        chatid: typeof chatid,
        senderid: typeof socket.user.profileid,
        messageType,
        hasContent: !!content,
        attachmentsCount: Array.isArray(attachments) ? attachments.length : 0
      });
      
      console.log('🔧 [BACKEND] Creating message with media data:', {
        messageType,
        hasStickerData: !!data.stickerData,
        hasGifData: !!data.gifData,
        hasVoiceData: !!data.voiceData,
        hasFileData: !!data.fileData,
        hasContent: !!content,
        hasAttachments: !!(attachments && attachments.length > 0)
      });
      
      // Prepare message data for atomic creation
      const messageData = {
        messageid: uuidv4(),
        clientMessageId: String(clientMessageId), // Ensure string
        chatid: String(chatid), // Ensure string, not object
        senderid: String(socket.user.profileid), // Ensure string
        receiverId: receiverId ? String(receiverId) : null, // Add receiverId support
        messageType: String(messageType || 'text'),
        content: String(content || ''),
        attachments: Array.isArray(attachments) ? attachments : [],
        replyTo: replyTo ? String(replyTo) : null,
        mentions: Array.isArray(mentions) ? mentions : [],
        messageStatus: 'sent',
        deliveredTo: [], // Track delivery status
        readBy: [],
        reactions: [],
        isEdited: false,
        isPinned: false,
        // Add support for all message types with enhanced media data handling
        ...(messageType === 'sticker' && data.stickerData && { 
          stickerData: {
            id: data.stickerData.id,
            name: data.stickerData.name,
            preview: data.stickerData.preview,
            url: data.stickerData.url,
            category: data.stickerData.category
          }
        }),
        ...(messageType === 'gif' && data.gifData && { 
          gifData: {
            id: data.gifData.id,
            title: data.gifData.title,
            url: data.gifData.url,
            thumbnail: data.gifData.thumbnail,
            category: data.gifData.category,
            dimensions: data.gifData.dimensions
          }
        }),
        ...(messageType === 'voice' && data.voiceData && { 
          voiceData: {
            duration: data.voiceData.duration,
            size: data.voiceData.size,
            mimeType: data.voiceData.mimeType,
            // Store audio data as base64 or file path
            audioData: data.voiceData.audioBase64 ? {
              base64: data.voiceData.audioBase64,
              stored: false
            } : null,
            // Create data URL for immediate access
            url: data.voiceData.audioBase64 ? 
              `data:${data.voiceData.mimeType || 'audio/webm'};base64,${data.voiceData.audioBase64}` 
              : null
          }
        }),
        ...(data.fileData && ['image', 'video', 'audio', 'document'].includes(messageType) && { 
          fileData: {
            name: data.fileData.name,
            size: data.fileData.size,
            mimeType: data.fileData.mimeType,
            // Store file data as base64 or file path
            fileContent: data.fileData.fileBase64 ? {
              base64: data.fileData.fileBase64,
              stored: false
            } : null,
            // Create data URL for immediate access
            url: data.fileData.fileBase64 ? 
              `data:${data.fileData.mimeType};base64,${data.fileData.fileBase64}` 
              : null
          }
        }),
        // Legacy support
        ...(messageType === 'poll' && data.pollData && { pollData: data.pollData }),
        ...(messageType === 'location' && data.locationData && { locationData: data.locationData }),
        ...(messageType === 'contact' && data.contactData && { contactData: data.contactData })
      };
      
      // Note: Idempotency check already performed earlier, this is duplicate code that was causing issues
      
      // Clean up old entries from messageProcessingCache periodically
      if (this.messageProcessingCache.size > 1000) {
        const now = Date.now();
        for (const [key, timestamp] of this.messageProcessingCache.entries()) {
          // Remove entries older than 5 minutes
          if (now - timestamp > 5 * 60 * 1000) {
            this.messageProcessingCache.delete(key);
          }
        }
      }
      
      // Use atomic upsert to prevent race conditions and duplicate messages
      let newMessage;
      try {
        if (clientMessageId) {
          // Atomic upsert with clientMessageId to prevent duplicates
          newMessage = await Message.findOneAndUpdate(
            { 
              clientMessageId: String(clientMessageId),
              chatid: String(chatid)
            },
            { $setOnInsert: messageData },
            { 
              upsert: true, 
              new: true, 
              runValidators: true,
              setDefaultsOnInsert: true
            }
          );
          
          // 🔄 CRITICAL FIX Issue #3: Enhanced duplicate detection with 5-second window
          // Check if message was processed recently using recentMessageIds Map
          if (this.recentMessageIds.has(clientMessageId)) {
            const lastProcessed = this.recentMessageIds.get(clientMessageId);
            const timeSinceLastProcess = Date.now() - lastProcessed;
            
            if (timeSinceLastProcess < this.recentMessageIdsWindowMs) {
              console.log(`⚠️ DUPLICATE DETECTED: Message ${clientMessageId} was processed ${timeSinceLastProcess}ms ago (within ${this.recentMessageIdsWindowMs}ms window)`);
              
              // Remove from processing cache
              this.messageProcessingCache.delete(idempotencyKeyUpsert);
              
              const ackResponse = {
                success: true, 
                clientMessageId,
                messageid: newMessage.messageid,
                duplicate: true,
                preventedBy: 'idempotency_check',
                timestamp: newMessage.createdAt.toISOString()
              };
              if (callback) callback(ackResponse);
              return;
            }
          }
          
          // Store this message ID with current timestamp
          this.recentMessageIds.set(clientMessageId, Date.now());
          
          // Clean up old entries from recentMessageIds periodically
          if (this.recentMessageIds.size > this.recentMessageIdsMaxSize) {
            const now = Date.now();
            let cleanedCount = 0;
            
            for (const [msgId, timestamp] of this.recentMessageIds.entries()) {
              // Remove entries older than 5 minutes
              if (now - timestamp > 300000) {
                this.recentMessageIds.delete(msgId);
                cleanedCount++;
              }
            }
            
            console.log(`🧹 Cleaned ${cleanedCount} old message IDs from deduplication cache (size: ${this.recentMessageIds.size})`);
          }
        } else {
          // If no clientMessageId, create directly (less safe but backward compatible)
          newMessage = new Message(messageData);
          await newMessage.save();
        }
      } catch (error) {
        // Remove from processing cache on error
        this.messageProcessingCache.delete(idempotencyKeyUpsert);
        
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
          console.log(`⚠️ Duplicate message prevented by database constraint: ${clientMessageId}`);
          // Try to find the existing message
          const existingMessage = await Message.findOne({
            clientMessageId: String(clientMessageId),
            chatid: String(chatid)
          });
          
          if (existingMessage) {
            const ackResponse = {
              success: true, 
              clientMessageId,
              messageid: existingMessage.messageid,
              duplicate: true,
              timestamp: existingMessage.createdAt.toISOString()
            };
            if (callback) callback(ackResponse);
            return;
          }
        }
        throw error; // Re-throw if not a duplicate key error
      }
      
      // Update chat's last message
      chat.lastMessage = newMessage.messageid;
      chat.lastMessageAt = new Date();
      await chat.save();
      
      const messagePayload = {
        message: newMessage,
        chat: {
          chatid: chat.chatid,
          lastMessageAt: chat.lastMessageAt
        },
        timestamp: dayjs().toISOString()
      };
      
      // Track delivery status for each participant
      const deliveryPromises = [];
      const offlineUsers = [];
      
      // CRITICAL FIX: Get all chat participants except sender (handle object participants)
      console.log('🔍 Message delivery debug:');
      console.log('  - Chat ID:', chatid);
      console.log('  - Sender:', socket.user.profileid);
      console.log('  - Chat participants:', chat.participants);
      console.log('  - Online users map:', Array.from(this.onlineUsers.entries()));
      
      const recipients = chat.participants
        .filter(p => p.profileid !== socket.user.profileid)
        .map(p => p.profileid);
      
      console.log('  - Filtered recipients:', recipients);
      
      for (const recipientId of recipients) {
        console.log('🔍 Looking up socket for recipient:', recipientId);
        const recipientSocket = this.onlineUsers.get(recipientId);
        console.log('🔍 Found socket:', recipientSocket);
        
        if (recipientSocket) {
          // User is online - send message and track delivery
          console.log('📤 Sending message to socket:', recipientSocket);
          this.io.to(recipientSocket).emit('new_message', messagePayload);
          console.log('✅ Message sent to recipient:', recipientId);
          
          // Also emit using the frontend expected event name for backward compatibility
          this.io.to(recipientSocket).emit('message', messagePayload);
          
          // Mark as delivered
          deliveryPromises.push(
            Message.findOneAndUpdate(
              { messageid: newMessage.messageid },
              {
                messageStatus: 'delivered',
                $push: {
                  deliveredTo: {
                    profileid: recipientId,
                    deliveredAt: new Date()
                  }
                }
              }
            )
          );
          
          // Send delivery confirmation to sender using UNIFIED CONTRACT
          socket.emit('message_delivered', {
            messageid: newMessage.messageid,
            deliveredTo: recipientId,
            deliveredAt: new Date().toISOString()
          });
          
          // Also emit the event using the frontend expected name for backward compatibility
          socket.emit('message_status_update', {
            messageid: newMessage.messageid,
            status: 'delivered',
            deliveredTo: recipientId,
            deliveredAt: new Date().toISOString()
          });
          
        } else {
          // User is offline - queue message
          console.log(`📱 User offline, queuing message for: ${recipientId}`);
          offlineUsers.push(recipientId);
          
          if (!this.offlineMessageQueue.has(recipientId)) {
            this.offlineMessageQueue.set(recipientId, []);
          }
          
          this.offlineMessageQueue.get(recipientId).push({
            messageid: newMessage.messageid,
            message: newMessage,
            chat: {
              chatid: chat.chatid,
              lastMessageAt: chat.lastMessageAt
            },
            timestamp: dayjs().toISOString(),
            queuedAt: new Date()
          });
          
          // Send push notification for offline users
          await this.sendPushNotification(recipientId, {
            title: `New message from ${socket.user.username}`,
            body: content.length > 50 ? content.substring(0, 47) + '...' : content,
            data: {
              type: 'message',
              chatid: chatid,
              messageid: newMessage.messageid,
              senderId: socket.user.profileid
            }
          });
        }
      }
      
      // Wait for all delivery updates to complete
      await Promise.all(deliveryPromises);
      
      console.log(`💬 Message sent in ${chatid} by ${socket.user.username} - Delivered: ${recipients.length - offlineUsers.length}, Queued: ${offlineUsers.length}`);
      
      // Send acknowledgment with UNIFIED CONTRACT format (message_ack)
      if (callback) {
        const ackResponse = {
          success: true,
          clientMessageId: clientMessageId,
          messageid: newMessage.messageid,
          timestamp: newMessage.createdAt.toISOString(),
          duplicate: false
        };
        callback(ackResponse);
      }
      
      // Clean up idempotency key on success
      if (clientMessageId) {
        const idempotencyKeyCleanup = `${socket.user.profileid}-${clientMessageId}`;
        this.messageProcessingCache.delete(idempotencyKeyCleanup);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Clean up idempotency key on error
      if (clientMessageId) {
        const idempotencyKeyError = `${socket.user.profileid}-${clientMessageId}`;
        this.messageProcessingCache.delete(idempotencyKeyError);
      }
      
      if (callback) {
        const ackResponse = {
          success: false,
          clientMessageId: data.clientMessageId || null,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        callback(ackResponse);
      }
    }
  }

  handleTypingStart(socket, chatid) {
    socket.to(chatid).emit('user_typing', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: true
    });
    
    // Also emit using the frontend expected event name for backward compatibility
    socket.to(chatid).emit('typing_start', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: true
    });
  }

  handleTypingStop(socket, chatid) {
    socket.to(chatid).emit('user_typing', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: false
    });
    
    // Also emit using the frontend expected event name for backward compatibility
    socket.to(chatid).emit('typing_stop', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: false
    });
  }

  async handleMarkMessageRead(socket, data) {
    try {
      const { messageid, chatid } = data;
      
      const message = await Message.findOne({ messageid, isDeleted: false });
      if (!message) {
        socket.emit('error', 'Message not found');
        return;
      }
      
      // Check if already marked as read
      const existingRead = message.readBy.find(
        read => read.profileid === socket.user.profileid
      );
      
      if (!existingRead) {
        message.readBy.push({
          profileid: socket.user.profileid,
          readAt: new Date()
        });
        await message.save();
        
        // Broadcast read status to other participants using UNIFIED CONTRACT
        socket.to(chatid).emit('message_read', {
          messageid,
          readBy: {
            profileid: socket.user.profileid,
            username: socket.user.username,
            readAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('error', 'Failed to mark message as read');
    }
  }

  async handleReactToMessage(socket, data) {
    try {


      console.log('🎭 [BACKEND] Processing message reaction:', {
        socketUser: socket.user?.profileid,
        data,
        timestamp: new Date().toISOString()
      });
      
      const { messageid, emoji, chatid } = data;
      
      // Validate required fields
      if (!messageid || !emoji || !chatid) {
        const error = 'Missing required fields: messageid, emoji, or chatid';
        console.error('❌ [BACKEND] Reaction validation failed:', { messageid, emoji, chatid });
        socket.emit('error', error);
        return;
      }
      
      // Verify user is authenticated
      if (!socket.user?.profileid) {
        const error = 'User not authenticated';
        console.error('❌ [BACKEND] Reaction failed - user not authenticated');
        socket.emit('error', error);
        return;
      }
      
      const message = await Message.findOne({ messageid, isDeleted: false });
      if (!message) {
        const error = 'Message not found or deleted';
        console.error('❌ [BACKEND] Message not found for reaction:', messageid);
        socket.emit('error', error);
        return;
      }
      
      console.log('📝 [BACKEND] Found message for reaction:', {
        messageId: message.messageid,
        currentReactions: message.reactions?.length || 0,
        chatId: message.chatid
      });
      
      // Verify the message belongs to the specified chat
      if (message.chatid !== chatid) {
        const error = 'Message does not belong to specified chat';
        console.error('❌ [BACKEND] Chat ID mismatch:', {
          messageChat: message.chatid,
          providedChat: chatid
        });
        socket.emit('error', error);
        return;
      }
      
      // Check if user already reacted with this emoji
      const existingReactionIndex = message.reactions.findIndex(
        reaction => reaction.profileid === socket.user.profileid && reaction.emoji === emoji
      );
      
      let actionType = '';
      if (existingReactionIndex > -1) {
        // Remove existing reaction (toggle off)
        message.reactions.splice(existingReactionIndex, 1);
        actionType = 'removed';
        console.log('🔄 [BACKEND] Removing existing reaction:', { emoji, userId: socket.user.profileid });
      } else {
        // Remove any other reactions from this user (users can only have one reaction per message)
        message.reactions = message.reactions.filter(
          reaction => reaction.profileid !== socket.user.profileid
        );
        
        // Add new reaction
        message.reactions.push({
          profileid: socket.user.profileid,
          emoji,
          createdAt: new Date()
        });
        actionType = 'added';
        console.log('➕ [BACKEND] Adding new reaction:', { emoji, userId: socket.user.profileid });
      }
      
      // Save the updated message
      await message.save();
      console.log('💾 [BACKEND] Message reactions updated and saved:', {
        messageId: messageid,
        totalReactions: message.reactions.length,
        actionType
      });
      
      // Prepare reaction data for broadcast
      const reactionData = {
        messageid,
        chatid,
        action: actionType, // 'added' or 'removed'
        reaction: {
          profileid: socket.user.profileid,
          username: socket.user.username || 'Unknown User',
          emoji,
          createdAt: new Date().toISOString()
        },
        allReactions: message.reactions // Include all current reactions for sync
      };
      
      // Broadcast reaction to all participants in the chat (including sender for confirmation)
      console.log('📡 [BACKEND] Broadcasting message reaction to chat:', chatid);
      this.io.to(chatid).emit('message_reaction', reactionData);
      
      // Also send confirmation back to the sender
      socket.emit('reaction_confirmation', {
        success: true,
        messageid,
        emoji,
        action: actionType,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ [BACKEND] Message reaction processed successfully:', {
        messageId: messageid,
        userId: socket.user.profileid,
        emoji,
        action: actionType,
        broadcastedTo: chatid
      });
      
    } catch (error) {
      console.error('❌ [BACKEND] Error processing message reaction:', {
        error: error.message,
        stack: error.stack,
        data,
        userId: socket.user?.profileid
      });
      socket.emit('error', 'Failed to react to message: ' + error.message);
    }
  }

  // Call handling methods
  async handleInitiateCall(socket, data, callback) {
    console.log('📞 === CALL INITIATION DEBUG ===');
    console.log('Raw call data received:', JSON.stringify(data, null, 2));
    console.log('Socket user:', socket.user);
    
    try {
      const { chatid, callType = 'voice', type = 'voice', receiverId, callId, participants, initiator } = data;
      console.log('🔍 Parsed call parameters:', {
        chatid,
        callType,
        type,
        receiverId,
        callId,
        participants,
        initiator
      });
      
      // Handle different call initiation formats and determine actual receiverId
      let actualReceiverId = receiverId;
      let actualCallType = callType || type;
      
      // If no direct receiverId but we have chatid, get from chat participants
      if (!actualReceiverId && chatid) {
        console.log('🔍 Looking up chat for receiverId extraction:', chatid);
        const chat = await Chat.findOne({ chatid, isActive: true });
        console.log('🔍 Chat lookup result:', {
          found: !!chat,
          chatType: chat?.chatType,
          participantCount: chat?.participants?.length,
          participants: chat?.participants?.map(p => p.profileid)
        });
        
        if (chat && chat.isParticipant(socket.user.profileid)) {
          console.log('🔍 User is participant in chat, extracting receiverId...');
          // For direct chats, find the other participant
          if (chat.chatType === 'direct') {
            const otherParticipant = chat.participants.find(p => p.profileid !== socket.user.profileid);
            actualReceiverId = otherParticipant?.profileid;
          } else {
            // For group chats, this is more complex - for now, reject group calls
            const errorMsg = 'Group calls not yet supported';
            socket.emit('call_error', { error: errorMsg, chatid });
            if (callback) callback({ success: false, error: errorMsg });
            return;
          }
        }
      }
      
      // If participants array is provided (legacy frontend format), extract receiverId
      if (!actualReceiverId && participants && Array.isArray(participants)) {
        // Find the participant that's not the caller
        actualReceiverId = participants.find(p => p !== socket.user.profileid && p !== initiator);
      }
      
      console.log(`📞 Call initiated by ${socket.user.username} to ${actualReceiverId}, type: ${actualCallType}`);
      
      // Validate required parameters
      if (!chatid) {
        const errorMsg = 'Missing required parameter: chatid';
        socket.emit('call_error', { error: errorMsg });
        if (callback) callback({ success: false, error: errorMsg });
        return;
      }
      
      if (!actualReceiverId) {
        const errorMsg = 'Could not determine receiver for the call';
        socket.emit('call_error', { error: errorMsg, chatid });
        if (callback) callback({ success: false, error: errorMsg });
        return;
      }
      
      // Verify user has access to this chat (fix participants query for object-based schema)
      const chat = await Chat.findOne({ 
        chatid, 
        'participants.profileid': { $all: [socket.user.profileid, actualReceiverId] },
        isActive: true 
      });
      
      console.log('🔍 Call verification debug:');
      console.log('  - Call from:', socket.user.profileid);
      console.log('  - Call to:', actualReceiverId);
      console.log('  - Chat found:', !!chat);
      if (chat) {
        console.log('  - Chat participants:', chat.participants.map(p => p.profileid));
      }
      
      if (!chat) {
        const errorMsg = 'Unauthorized or invalid chat';
        socket.emit('call_error', { error: errorMsg });
        if (callback) callback({ success: false, error: errorMsg });
        return;
      }
      
      // Debug: List all active calls before cleanup
      console.log('🔍 Active calls before cleanup:');
      for (const [callId, callData] of this.activeCalls) {
        const age = Date.now() - new Date(callData.startTime).getTime();
        console.log(`  - CallID: ${callId}`);
        console.log(`    Caller: ${callData.callerId}`);
        console.log(`    Receiver: ${callData.receiverId}`);
        console.log(`    Status: ${callData.status}`);
        console.log(`    Age: ${Math.round(age / 60000)} minutes`);
        console.log(`    Caller Socket: ${callData.callerSocket}`);
        console.log(`    ---`);
      }
      console.log(`Total active calls: ${this.activeCalls.size}`);
      
      // Clean up any stale calls for this user before checking
      await this.cleanupStaleCallsForUser(socket.user.profileid);
      
      // Debug: List active calls after cleanup
      console.log('🔍 Active calls after cleanup:');
      console.log(`Total active calls: ${this.activeCalls.size}`);
      for (const [callId, callData] of this.activeCalls) {
        console.log(`  - CallID: ${callId}, Caller: ${callData.callerId}, Receiver: ${callData.receiverId}`);
      }
      
      // Check if caller is already in a call
      const existingCall = Array.from(this.activeCalls.values())
        .find(call => call.callerId === socket.user.profileid || call.receiverId === socket.user.profileid);
      
      if (existingCall) {
        console.log('🔍 Found existing call for user:', {
          callId: existingCall.callId,
          status: existingCall.status,
          startTime: existingCall.startTime,
          age: Date.now() - new Date(existingCall.startTime).getTime()
        });
        
        // If the call is old (more than 30 seconds for unanswered, 2 minutes for answered), consider it stale
        // IMPROVED: Make cleanup more aggressive with reduced thresholds
        const callAge = Date.now() - new Date(existingCall.startTime).getTime();
        const isAnsweredCall = existingCall.status === 'answered';
        // REDUCED THRESHOLDS: 30 seconds → 10 seconds for unanswered, 2 minutes → 30 seconds for answered
        const staleThreshold = isAnsweredCall ? 30 * 1000 : 10 * 1000; // 30s for answered, 10s for unanswered
        
        if (callAge > staleThreshold) {
          console.log('🧹 Removing stale call:', {
            callId: existingCall.callId,
            status: existingCall.status,
            ageSeconds: Math.round(callAge / 1000),
            threshold: isAnsweredCall ? '30 seconds' : '10 seconds'
          });
          this.activeCalls.delete(existingCall.callId);
          
          // Update call log to reflect the cleanup
          try {
            const callLog = await CallLog.findOne({ callId: existingCall.callId });
            if (callLog && ['initiated', 'ringing'].includes(callLog.status)) {
              await callLog.updateStatus('missed', {
                endReason: 'stale_cleanup',
                endedBy: 'system'
              });
            }
          } catch (error) {
            console.error('❌ Error updating stale call log:', error);
          }
        } else {
          const errorMsg = 'You are already in a call';
          socket.emit('call_error', { error: errorMsg });
          if (callback) callback({ success: false, error: errorMsg });
          return;
        }
      }
      
      // Create call log entry
      const newCall = new CallLog({
        callId: callId || uuidv4(),
        chatid,
        callerId: socket.user.profileid,
        receiverId: actualReceiverId,
        callType: actualCallType,
        status: 'initiated',
        participants: [socket.user.profileid, actualReceiverId]
      });
      
      await newCall.save();
      
      // Store active call
      this.activeCalls.set(newCall.callId, {
        ...newCall.toObject(),
        callerSocket: socket.id,
        startTime: new Date()
      });
      
      // Check if receiver is online
      const receiverSocketId = this.onlineUsers.get(actualReceiverId);
      
      if (receiverSocketId) {
        // Check if receiver is already in a call
        const receiverInCall = Array.from(this.activeCalls.values())
          .find(call => (call.callerId === actualReceiverId || call.receiverId === actualReceiverId) && call.callId !== newCall.callId);
        
        if (receiverInCall) {
          // Receiver is busy
          await newCall.updateStatus('declined', {
            endReason: 'busy'
          });
          
          socket.emit('call_failed', {
            callId: newCall.callId,
            reason: 'busy',
            message: 'User is currently busy'
          });
          
          this.activeCalls.delete(newCall.callId);
          
          if (callback) {
            callback({ 
              success: false, 
              error: 'User is currently busy',
              reason: 'busy'
            });
          }
          return;
        }
        
        // Send call invitation using UNIFIED CONTRACT
        console.log('📤 Sending call invitation to recipient');
        console.log('  - Recipient Socket ID:', receiverSocketId);
        console.log('  - Call ID:', newCall.callId);
        console.log('  - Call Type:', actualCallType);
        console.log('  - Caller:', socket.user.username);
        
        const callInvitation = {
          callId: newCall.callId,
          callType: actualCallType,
          caller: {
            profileid: socket.user.profileid,
            username: socket.user.username,
            profilePic: socket.user.profilePic || null
          },
          chatid
        };
        
        this.io.to(receiverSocketId).emit('incoming_call', callInvitation);
        console.log('✅ Call invitation sent successfully');
        
        // Also emit LEGACY EVENTS for backward compatibility
        this.io.to(receiverSocketId).emit('call_offer', {
          callId: newCall.callId,
          type: actualCallType,
          participants: [actualReceiverId],
          initiator: socket.user.profileid,
          mediaConstraints: {
            audio: true,
            video: actualCallType === 'video',
            screenShare: false
          },
          caller: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          chatid
        });
        
        // Update call status to ringing
        await newCall.updateStatus('ringing');
        
        // Notify caller that call is ringing using the correct event name
        socket.emit('call_ringing', {
          callId: newCall.callId,
          receiverId: actualReceiverId
        });
        
        // Send success acknowledgment
        if (callback) {
          callback({ 
            success: true, 
            callId: newCall.callId,
            status: 'ringing',
            message: 'Call initiated successfully'
          });
        }
        
        // Set timeout for no answer
        setTimeout(async () => {
          const activeCall = this.activeCalls.get(newCall.callId);
          if (activeCall && activeCall.status !== 'answered') {
            await this.handleCallTimeout(newCall.callId, 'no_answer');
          }
        }, 30000); // 30 seconds timeout
        
      } else {
        // Receiver is offline
        await newCall.updateStatus('missed', {
          endReason: 'user_offline',
          isOfflineAttempt: true
        });
        
        socket.emit('call_failed', {
          callId: newCall.callId,
          reason: 'receiver_offline',
          message: 'User is currently offline'
        });
        
        this.activeCalls.delete(newCall.callId);
        
        // Send failure acknowledgment
        if (callback) {
          callback({ 
            success: false, 
            error: 'User is currently offline',
            reason: 'receiver_offline'
          });
        }
        
        // Send push notification if available
        await this.sendPushNotification(actualReceiverId, {
          title: `Missed call from ${socket.user.username}`,
          body: `${actualCallType === 'video' ? 'Video' : 'Voice'} call`,
          data: {
            type: 'missed_call',
            callId: newCall.callId,
            callerId: socket.user.profileid,
            chatid
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error initiating call:', {
        error: error.message,
        stack: error.stack,
        data: data,
        user: socket.user?.profileid,
        username: socket.user?.username
      });
      
      const errorMsg = `Failed to initiate call: ${error.message}`;
      const errorDetails = {
        originalError: error.message,
        errorType: error.name || 'Unknown',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      
      socket.emit('call_error', {
        error: errorMsg,
        details: errorDetails
      });
      
      if (callback) {
        callback({ 
          success: false, 
          error: errorMsg,
          details: errorDetails
        });
      }
    }
  }

  async handleAnswerCall(socket, data) {
    try {
      const { callId } = data;
      console.log(`📞 Call answered by ${socket.user.username}, callId: ${callId}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('answered');
      }
      
      // Update active call
      activeCall.status = 'answered';
      activeCall.answeredAt = new Date();
      activeCall.receiverSocket = socket.id;
      this.activeCalls.set(callId, activeCall);
      
      // Notify caller using UNIFIED CONTRACT
      if (activeCall.callerSocket) {
        this.io.to(activeCall.callerSocket).emit('call_answer', {
          callId,
          accepted: true,
          answerer: {
            profileid: socket.user.profileid,
            username: socket.user.username
          }
        });
        
        // Also emit LEGACY EVENT for backward compatibility
        this.io.to(activeCall.callerSocket).emit('call_answered', {
          callId,
          answeredBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          }
        });
      }
      
      // Confirm to receiver
      socket.emit('call_connected', {
        callId,
        caller: activeCall.caller
      });
      
    } catch (error) {
      console.error('❌ Error answering call:', error);
      socket.emit('call_error', {
        error: 'Failed to answer call',
        details: error.message
      });
    }
  }

  async handleEndCall(socket, data) {
    try {
      const { callId, reason = 'normal' } = data;
      console.log(`📞 Call ended by ${socket.user.username}, callId: ${callId}, reason: ${reason}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Calculate duration if call was answered
      let duration = 0;
      if (activeCall.answeredAt) {
        duration = Math.floor((Date.now() - new Date(activeCall.answeredAt).getTime()) / 1000);
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        let status;
        if (reason === 'cancelled') {
          status = 'cancelled';
        } else if (activeCall.answeredAt) {
          status = 'completed';
        } else {
          status = 'missed';
        }
        
        await callLog.updateStatus(status, {
          endedBy: socket.user.profileid,
          endReason: reason,
          duration
        });
        
        console.log(`📋 Call log updated: ${callId} -> ${status} (reason: ${reason})`);
      }
      
      // Notify other participant using UNIFIED CONTRACT
      const otherSocket = socket.id === activeCall.callerSocket 
        ? activeCall.receiverSocket 
        : activeCall.callerSocket;
        
      if (otherSocket) {
        this.io.to(otherSocket).emit('end_call', {
          callId,
          reason
        });
        
        // Also emit LEGACY EVENTS for backward compatibility
        this.io.to(otherSocket).emit('call_end', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason,
          duration
        });
        
        this.io.to(otherSocket).emit('call_ended', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason,
          duration
        });
      }
      
      // Confirm to caller
      socket.emit('call_end', {
        callId,
        duration,
        reason
      });
      
      // Also emit legacy event
      socket.emit('call_ended', {
        callId,
        duration,
        reason
      });
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`✅ Call ${callId} ended successfully, duration: ${duration}s`);
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      socket.emit('call_error', {
        error: 'Failed to end call',
        details: error.message
      });
    }
  }
  
  async handleDeclineCall(socket, data) {
    try {
      const { callId } = data;
      console.log(`📞 Call declined by ${socket.user.username}, callId: ${callId}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('declined', {
          endReason: 'declined'
        });
      }
      
      // CRITICAL: Notify caller that call was declined with multiple events
      if (activeCall.callerSocket) {
        // Primary decline event
        this.io.to(activeCall.callerSocket).emit('call_declined', {
          callId,
          declinedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason: 'declined'
        });
        
        // Reject event for compatibility
        this.io.to(activeCall.callerSocket).emit('call_reject', {
          callId,
          accepted: false,
          reason: 'declined'
        });
        
        // CRITICAL: Emit call_ended to properly cancel User A's call
        this.io.to(activeCall.callerSocket).emit('call_ended', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason: 'declined',
          duration: 0
        });
      }
      
      // Confirm to receiver
      socket.emit('call_declined_confirmed', {
        callId
      });
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`❌ Call ${callId} declined successfully`);
      
    } catch (error) {
      console.error('❌ Error declining call:', error);
      socket.emit('call_error', {
        error: 'Failed to decline call',
        details: error.message
      });
    }
  }
  
  async handleCallCancelled(socket, data) {
    try {
      const { callId, reason = 'cancelled_by_caller', chatid } = data;
      console.log(`📞 Call cancelled by ${socket.user.username}, callId: ${callId}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        console.warn(`⚠️ Call not found for cancellation: ${callId}`);
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Only allow the caller to cancel the call
      if (activeCall.callerId !== socket.user.profileid) {
        console.warn(`⚠️ Unauthorized cancellation attempt by ${socket.user.profileid} for call ${callId}`);
        socket.emit('call_error', { error: 'Only the caller can cancel the call' });
        return;
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('cancelled', {
          endReason: reason,
          cancelledBy: socket.user.profileid
        });
      }
      
      // CRITICAL: Notify the receiver (callee) that call was cancelled
      const receiverSocketId = this.onlineUsers.get(activeCall.receiverId);
      if (receiverSocketId && receiverSocketId !== socket.id) {
        console.log(`📤 Notifying receiver ${activeCall.receiverId} about call cancellation`);
        
        // Primary cancellation event
        this.io.to(receiverSocketId).emit('call_cancelled', {
          callId,
          cancelledBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason,
          timestamp: new Date().toISOString()
        });
        
        // Legacy events for compatibility
        this.io.to(receiverSocketId).emit('call_ended', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason: 'cancelled',
          duration: 0
        });
      }
      
      // Also notify via chat room if chatid is provided
      if (chatid) {
        socket.to(chatid).emit('call_cancelled', {
          callId,
          cancelledBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason,
          timestamp: new Date().toISOString()
        });
      }
      
      // Confirm to caller
      socket.emit('call_cancelled_confirmed', {
        callId,
        reason
      });
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`✅ Call ${callId} cancelled successfully by ${socket.user.username}`);
      
    } catch (error) {
      console.error('❌ Error cancelling call:', error);
      socket.emit('call_error', {
        error: 'Failed to cancel call',
        details: error.message
      });
    }
  }
  
  // Handle call timeout
  async handleCallTimeout(callId, reason = 'no_answer') {
    try {
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) return;
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('missed', {
          endReason: reason
        });
      }
      
      // Notify participants
      if (activeCall.callerSocket) {
        this.io.to(activeCall.callerSocket).emit('call_timeout', {
          callId,
          reason
        });
      }
      
      if (activeCall.receiverSocket) {
        this.io.to(activeCall.receiverSocket).emit('call_timeout', {
          callId,
          reason
        });
      }
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`⏰ Call ${callId} timed out: ${reason}`);
    } catch (error) {
      console.error('❌ Error handling call timeout:', error);
    }
  }

  // ENHANCED WebRTC signaling with security validation
  async handleWebRTCOffer(socket, data) {
    try {
      console.log(`📞 WebRTC offer from ${socket.user.username}`);
      
      // SECURITY: Validate WebRTC offer
      const validation = webrtcValidator.validateOffer(data);
      if (!validation.valid) {
        console.error(`❌ Invalid WebRTC offer from ${socket.user.username}:`, validation.errors);
        socket.emit('webrtc_error', {
          error: 'Invalid offer data',
          details: validation.errors.join(', ')
        });
        return;
      }
      
      // SECURITY: Check rate limiting for signaling
      const rateLimit = webrtcValidator.checkSignalingRateLimit(socket.user.profileid, 'offer');
      if (!rateLimit.allowed) {
        socket.emit('webrtc_error', {
          error: 'Rate limit exceeded for WebRTC signaling',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        });
        return;
      }
      
      // Log security event
      console.log(`🔒 WebRTC offer validated successfully:`, {
        user: socket.user.username,
        chatid: data.chatid,
        warnings: validation.warnings
      });
      
      // Use sanitized data for relay
      const sanitizedData = validation.sanitized || data;
      
      socket.to(sanitizedData.chatid).emit('webrtc_offer', {
        ...sanitizedData,
        from: socket.user.profileid,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error handling WebRTC offer:', error);
      socket.emit('webrtc_error', {
        error: 'Failed to process WebRTC offer',
        details: error.message
      });
    }
  }

  async handleWebRTCAnswer(socket, data) {
    try {
      console.log(`📞 WebRTC answer from ${socket.user.username}`);
      
      // SECURITY: Validate WebRTC answer
      const validation = webrtcValidator.validateAnswer(data);
      if (!validation.valid) {
        console.error(`❌ Invalid WebRTC answer from ${socket.user.username}:`, validation.errors);
        socket.emit('webrtc_error', {
          error: 'Invalid answer data',
          details: validation.errors.join(', ')
        });
        return;
      }
      
      // SECURITY: Check rate limiting for signaling
      const rateLimit = webrtcValidator.checkSignalingRateLimit(socket.user.profileid, 'answer');
      if (!rateLimit.allowed) {
        socket.emit('webrtc_error', {
          error: 'Rate limit exceeded for WebRTC signaling',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        });
        return;
      }
      
      // Log security event
      console.log(`🔒 WebRTC answer validated successfully:`, {
        user: socket.user.username,
        chatid: data.chatid,
        warnings: validation.warnings
      });
      
      // Use sanitized data for relay
      const sanitizedData = validation.sanitized || data;
      
      socket.to(sanitizedData.chatid).emit('webrtc_answer', {
        ...sanitizedData,
        from: socket.user.profileid,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error handling WebRTC answer:', error);
      socket.emit('webrtc_error', {
        error: 'Failed to process WebRTC answer',
        details: error.message
      });
    }
  }

  async handleWebRTCIceCandidate(socket, data) {
    try {
      console.log(`📡 WebRTC ICE candidate from ${socket.user.username}`);
      
      // SECURITY: Validate ICE candidate
      const validation = webrtcValidator.validateIceCandidate(data);
      if (!validation.valid) {
        console.error(`❌ Invalid ICE candidate from ${socket.user.username}:`, validation.errors);
        socket.emit('webrtc_error', {
          error: 'Invalid ICE candidate',
          details: validation.errors.join(', ')
        });
        return;
      }
      
      // SECURITY: Check rate limiting for ICE candidates (more permissive)
      const rateLimit = webrtcValidator.checkSignalingRateLimit(socket.user.profileid, 'ice_candidate');
      if (!rateLimit.allowed) {
        socket.emit('webrtc_error', {
          error: 'Rate limit exceeded for ICE candidates',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        });
        return;
      }
      
      // Log security warnings (but allow candidate through)
      if (validation.warnings.length > 0) {
        console.warn(`⚠️ ICE candidate security warnings:`, {
          user: socket.user.username,
          warnings: validation.warnings
        });
      }
      
      // Use sanitized data for relay
      const sanitizedData = validation.sanitized || data;
      
      // Emit UNIFIED CONTRACT event
      socket.to(sanitizedData.chatid).emit('webrtc_ice_candidate', {
        ...sanitizedData,
        from: socket.user.profileid,
        timestamp: new Date().toISOString()
      });
      
      // Also emit LEGACY EVENT for backward compatibility
      socket.to(sanitizedData.chatid).emit('ice_candidate', {
        ...sanitizedData,
        from: socket.user.profileid,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error handling WebRTC ICE candidate:', error);
      socket.emit('webrtc_error', {
        error: 'Failed to process ICE candidate',
        details: error.message
      });
    }
  }

  // Call controls
  handleToggleMute(socket, data) {
    socket.to(data.chatid).emit('participant_muted', {
      profileid: socket.user.profileid,
      muted: data.muted
    });
  }

  handleToggleVideo(socket, data) {
    socket.to(data.chatid).emit('participant_video_toggled', {
      profileid: socket.user.profileid,
      videoOn: data.videoOn
    });
  }

  handleToggleScreenShare(socket, data) {
    socket.to(data.chatid).emit('participant_screen_share', {
      profileid: socket.user.profileid,
      sharing: data.sharing
    });
  }

  // Call duration synchronization handler
  handleCallDurationSync(socket, data) {
    try {
      console.log(`⏱️ Call duration sync from ${socket.user.username}:`, {
        callId: data.callId,
        duration: data.duration,
        reason: data.reason
      });
      
      // Validate data
      if (!data.callId || !data.chatId) {
        console.warn('⚠️ Invalid call duration sync data:', data);
        return;
      }
      
      // Relay duration sync to other participants in the chat
      socket.to(data.chatId).emit('call_duration_sync', {
        ...data,
        from: socket.user.profileid,
        relayedAt: new Date().toISOString()
      });
      
      console.log(`✅ Call duration sync relayed for call ${data.callId}`);
      
    } catch (error) {
      console.error('❌ Error handling call duration sync:', error);
    }
  }

  // Call conversion event handlers
  handleCallConvertedToVoice(socket, data) {
    try {
      console.log(`🔄 Call converted to voice by ${socket.user.username}:`, data.callId);
      
      // Update active call if exists
      const activeCall = this.activeCalls.get(data.callId);
      if (activeCall) {
        activeCall.callType = 'voice';
        activeCall.convertedFromVideo = true;
        activeCall.conversionReason = data.reason;
        this.activeCalls.set(data.callId, activeCall);
      }
      
      // Relay to other participants
      socket.to(data.chatId).emit('call_converted_to_voice', {
        ...data,
        from: socket.user.profileid
      });
      
    } catch (error) {
      console.error('❌ Error handling call converted to voice:', error);
    }
  }

  handleCallConvertedToVideo(socket, data) {
    try {
      console.log(`🔄 Call converted to video by ${socket.user.username}:`, data.callId);
      
      // Update active call if exists
      const activeCall = this.activeCalls.get(data.callId);
      if (activeCall) {
        activeCall.callType = 'video';
        activeCall.convertedFromVoice = true;
        activeCall.conversionReason = data.reason;
        this.activeCalls.set(data.callId, activeCall);
      }
      
      // Relay to other participants
      socket.to(data.chatId).emit('call_converted_to_video', {
        ...data,
        from: socket.user.profileid
      });
      
    } catch (error) {
      console.error('❌ Error handling call converted to video:', error);
    }
  }

  handleCallAnsweredAudioOnly(socket, data) {
    try {
      console.log(`🎤 Call answered audio-only by ${socket.user.username}:`, data.callId);
      
      // Update active call if exists
      const activeCall = this.activeCalls.get(data.callId);
      if (activeCall) {
        activeCall.callType = 'voice';
        activeCall.answeredAsAudioOnly = true;
        activeCall.audioOnlyReason = data.reason;
        this.activeCalls.set(data.callId, activeCall);
      }
      
      // Relay to caller
      socket.to(data.chatId).emit('call_answered_audio_only', {
        ...data,
        from: socket.user.profileid
      });
      
    } catch (error) {
      console.error('❌ Error handling call answered audio only:', error);
    }
  }

  // Enhanced disconnect handling with call cleanup
  async handleDisconnect(socket, reason) {
    console.log(`👋 User disconnected: ${socket.user.username} - Reason: ${reason}`);
    
    const disconnectionStart = Date.now();
    
    try {
      // Clean up any active calls this user was part of
      await this.cleanupUserCalls(socket);
      
      // Clean up heartbeat monitoring
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
      }
      
      // Remove from tracking
      this.connectionHealth.delete(socket.id);
      this.onlineUsers.delete(socket.user.profileid);
      this.userSockets.delete(socket.id);
      this.joinedRooms.delete(socket.id);
      
      // Update offline status
      await this.updateUserOnlineStatus(socket.user.profileid, false, new Date());
      
      // Clean up typing indicators
      const userChats = await Chat.find({ 'participants.profileid': socket.user.profileid, isActive: true });
      for (const chat of userChats) {
        socket.to(chat.chatid).emit('user_typing', {
          profileid: socket.user.profileid,
          username: socket.user.username,
          isTyping: false,
          timestamp: new Date().toISOString()
        });
      }
      
      const disconnectionDuration = Date.now() - disconnectionStart;
      console.log(`✅ Disconnect cleanup completed in ${disconnectionDuration}ms for ${socket.user.username}`);
      
    } catch (error) {
      console.error(`❌ Critical error handling disconnect for ${socket.user.username}:`, error);
      // Ensure cleanup even if there's an error
      this.onlineUsers.delete(socket.user.profileid);
      this.userSockets.delete(socket.id);
      this.connectionHealth.delete(socket.id);
      this.joinedRooms.delete(socket.id);
      
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
      }
    }
  }
  
  // Setup device monitoring
  setupDeviceMonitoring(socket) {
    // Monitor for device changes during calls
    socket.on('device_changed', (data) => {
      const callRoom = this.getCallRoomForSocket(socket.id);
      if (callRoom) {
        socket.to(callRoom).emit('participant_device_changed', {
          profileid: socket.user.profileid,
          username: socket.user.username,
          deviceType: data.deviceType,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
  
  // Get call room for a socket
  getCallRoomForSocket(socketId) {
    for (const [callId, callData] of this.activeCalls) {
      if (callData.callerSocket === socketId || callData.receiverSocket === socketId) {
        return callData.callRoomId || `call_${callId}`;
      }
    }
    return null;
  }
  
  // Clean up call room
  async cleanupCallRoom(callRoomId, callId) {
    try {
      console.log(`🧹 Cleaning up call room: ${callRoomId}`);
      
      // Get all sockets in the room
      const room = this.io.sockets.adapter.rooms.get(callRoomId);
      
      if (room) {
        // Make all sockets leave the room
        for (const socketId of room) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(callRoomId);
          }
        }
        
        console.log(`✅ Call room ${callRoomId} cleaned up, ${room.size} participants removed`);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up call room ${callRoomId}:`, error);
    }
  }
  
  // Periodic cleanup of all stale calls
  async periodicCleanupStaleCalls() {
    try {
      const staleCalls = [];
      const now = Date.now();
      
      console.log('🧹 Running periodic stale call cleanup...');
      
      // Find all stale calls (older than 2 minutes for unanswered, 10 minutes for answered, or with invalid status)
      for (const [callId, callData] of this.activeCalls) {
        const callAge = now - new Date(callData.startTime).getTime();
        
        // More aggressive thresholds
        const isUnansweredStale = ['initiated', 'ringing'].includes(callData.status) && callAge > 30 * 1000; // 30 seconds for unanswered
        const isAnsweredStale = callData.status === 'answered' && callAge > 5 * 60 * 1000; // 5 minutes for answered
        const isVeryOld = callAge > 10 * 60 * 1000; // 10 minutes max
        const hasInvalidStatus = !['initiated', 'ringing', 'answered'].includes(callData.status);
        
        if (isUnansweredStale || isAnsweredStale || isVeryOld || hasInvalidStatus) {
          const reason = isUnansweredStale ? 'unanswered_timeout' : 
                        isAnsweredStale ? 'answered_timeout' : 
                        isVeryOld ? 'very_old' : 'invalid_status';
          
          staleCalls.push({ 
            callId, 
            callData, 
            reason,
            age: callAge 
          });
        }
      }
      
      // Clean up stale calls
      for (const { callId, callData, reason, age } of staleCalls) {
        console.log(`🧹 Periodic cleanup removing stale call:`, {
          callId,
          caller: callData.callerId,
          receiver: callData.receiverId,
          status: callData.status,
          reason,
          ageSeconds: Math.round(age / 1000)
        });
        
        // Update call log
        try {
          const callLog = await CallLog.findOne({ callId });
          if (callLog && ['initiated', 'ringing'].includes(callLog.status)) {
            await callLog.updateStatus('missed', {
              endReason: 'periodic_cleanup',
              endedBy: 'system'
            });
          }
        } catch (error) {
          console.error('❌ Error updating call log in periodic cleanup:', error);
        }
        
        // Remove from active calls
        this.activeCalls.delete(callId);
      }
      
      if (staleCalls.length > 0) {
        console.log(`✨ Periodic cleanup removed ${staleCalls.length} stale calls`);
      } else {
        console.log('✅ No stale calls found in periodic cleanup');
      }
      
    } catch (error) {
      console.error('❌ Error in periodic stale call cleanup:', error);
    }
  }
  
  // Clean up stale calls for a specific user
  async cleanupStaleCallsForUser(profileId) {
    try {
      const staleCalls = [];
      const now = Date.now();
      
      // Find stale calls for this user (more aggressive thresholds)
      for (const [callId, callData] of this.activeCalls) {
        const isUserInCall = callData.callerId === profileId || callData.receiverId === profileId;
        if (!isUserInCall) continue;
        
        const callAge = now - new Date(callData.startTime).getTime();
        
        // IMPROVED: Make cleanup more aggressive with reduced thresholds
        // REDUCED THRESHOLDS: 30s → 10s for unanswered, 5min → 30s for answered, 10min → 1min max
        const isUnansweredStale = ['initiated', 'ringing'].includes(callData.status) && callAge > 10 * 1000; // 10 seconds for unanswered
        const isAnsweredStale = callData.status === 'answered' && callAge > 30 * 1000; // 30 seconds for answered
        const isVeryOld = callAge > 1 * 60 * 1000; // 1 minute max
        const hasInvalidStatus = !['initiated', 'ringing', 'answered'].includes(callData.status);
        
        if (isUnansweredStale || isAnsweredStale || isVeryOld || hasInvalidStatus) {
          const reason = isUnansweredStale ? 'unanswered_timeout' : 
                        isAnsweredStale ? 'answered_timeout' : 
                        isVeryOld ? 'very_old' : 'invalid_status';
          staleCalls.push({ callId, callData, reason });
        }
      }
      
      // Clean up stale calls
      for (const { callId, callData, reason } of staleCalls) {
        console.log(`🧹 Cleaning up stale call for ${profileId}:`, {
          callId,
          status: callData.status,
          reason,
          ageSeconds: Math.round((now - new Date(callData.startTime).getTime()) / 1000)
        });
        
        // Update call log if it exists
        try {
          const callLog = await CallLog.findOne({ callId });
          if (callLog && ['initiated', 'ringing'].includes(callLog.status)) {
            await callLog.updateStatus('missed', {
              endReason: 'cleanup_stale',
              endedBy: 'system'
            });
          }
        } catch (error) {
          console.error('❌ Error updating stale call log:', error);
        }
        
        // Remove from active calls
        this.activeCalls.delete(callId);
      }
      
      if (staleCalls.length > 0) {
        console.log(`✨ Cleaned up ${staleCalls.length} stale calls for user ${profileId}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up stale calls for user:', error);
    }
  }
  
  // Clean up calls when user disconnects
  async cleanupUserCalls(socket) {
    const userCalls = [];
    
    // Find all active calls involving this user
    for (const [callId, callData] of this.activeCalls) {
      if (callData.callerSocket === socket.id || callData.receiverSocket === socket.id) {
        userCalls.push({ callId, callData });
      }
    }
    
    // End all user's active calls
    for (const { callId, callData } of userCalls) {
      try {
        console.log(`📞 Ending call ${callId} due to user disconnect`);
        
        // Calculate duration if call was answered
        let duration = 0;
        if (callData.answeredAt) {
          duration = Math.floor((Date.now() - new Date(callData.answeredAt).getTime()) / 1000);
        }
        
        // Update call log
        const callLog = await CallLog.findOne({ callId });
        if (callLog) {
          const status = callData.answeredAt ? 'completed' : 'missed';
          await callLog.updateStatus(status, {
            endedBy: socket.user.profileid,
            endReason: 'disconnect',
            duration
          });
        }
        
        const callRoomId = callData.callRoomId || `call_${callId}`;
        
        // Notify other participants
        this.io.to(callRoomId).emit('call_ended', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason: 'disconnect',
          duration,
          timestamp: new Date().toISOString()
        });
        
        // Clean up call room
        await this.cleanupCallRoom(callRoomId, callId);
        
        // Remove from active calls
        this.activeCalls.delete(callId);
        
        console.log(`✅ Call ${callId} cleaned up due to disconnect`);
        
      } catch (error) {
        console.error(`❌ Error cleaning up call ${callId}:`, error);
      }
    }
    
    if (userCalls.length > 0) {
      console.log(`🧹 Cleaned up ${userCalls.length} calls for disconnected user: ${socket.user.username}`);
    }
  }
  
  /**
   * Cleanup connection health data
   */
  cleanupConnectionHealth() {
    try {
      console.log('🧹 Running connection health cleanup...');
      const now = Date.now();
      let cleanedCount = 0;
      
      // Clean up stale connection health entries
      for (const [socketId, healthData] of this.connectionHealth) {
        const age = now - healthData.lastSeen;
        if (age > this.resourceLimits.healthCheckTtl) {
          this.connectionHealth.delete(socketId);
          cleanedCount++;
        }
      }
      
      // Enforce maximum connection health entries
      if (this.connectionHealth.size > this.resourceLimits.maxConnectionHealth) {
        const entries = Array.from(this.connectionHealth.entries());
        entries.sort(([, a], [, b]) => a.lastSeen - b.lastSeen);
        const toRemove = entries.slice(0, this.connectionHealth.size - this.resourceLimits.maxConnectionHealth);
        
        for (const [socketId] of toRemove) {
          this.connectionHealth.delete(socketId);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`✅ Connection health cleanup: removed ${cleanedCount} stale entries`);
      } else {
        console.log('✅ Connection health cleanup: no cleanup needed');
      }
    } catch (error) {
      console.error('❌ Error during connection health cleanup:', error);
    }
  }
  
  /**
   * Set up disconnect handlers
   */
  setupDisconnectHandlers() {
    this.io.on('disconnect', (socket) => {
      this.cleanupUserCalls(socket);
      this.cleanupConnectionHealth();
    });
  }
  
  /**
   * Set up periodic cleanup for orphaned heartbeat intervals and stale data
   */
  setupPeriodicCleanup() {
    // Clean up orphaned heartbeat intervals every 5 minutes
    setInterval(() => {
      try {
        const now = Date.now();
        let cleanedCount = 0;
        
        // Clean up stale connection health data
        for (const [socketId, healthData] of this.connectionHealth.entries()) {
          // Remove health data for sockets that haven't pinged in over 10 minutes
          if (healthData.lastPing && (now - healthData.lastPing.getTime()) > 600000) {
            this.connectionHealth.delete(socketId);
            cleanedCount++;
          }
        }
        
        if (cleanedCount > 0) {
          console.log(`🧹 Cleaned up ${cleanedCount} stale connection health entries`);
        }
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, 300000); // 5 minutes
  }
  
  /**
   * Cleanup offline messages
   */
  cleanupOfflineMessages() {
    try {
      console.log('🧹 Running offline messages cleanup...');
      const now = Date.now();
      let cleanedUsers = 0;
      let cleanedMessages = 0;
      
      // Clean up old offline messages
      for (const [profileId, messages] of this.offlineMessageQueue) {
        const validMessages = messages.filter(msg => {
          const age = now - new Date(msg.queuedAt).getTime();
          return age <= this.resourceLimits.offlineMessageTtl;
        });
        
        const removedCount = messages.length - validMessages.length;
        cleanedMessages += removedCount;
        
        if (validMessages.length === 0) {
          this.offlineMessageQueue.delete(profileId);
          cleanedUsers++;
        } else if (validMessages.length < messages.length) {
          // Limit messages per user
          const limitedMessages = validMessages.slice(-this.resourceLimits.maxOfflineMessagesPerUser);
          this.offlineMessageQueue.set(profileId, limitedMessages);
          cleanedMessages += validMessages.length - limitedMessages.length;
        }
      }
      
      // Enforce maximum offline users
      if (this.offlineMessageQueue.size > this.resourceLimits.maxOfflineUsers) {
        const entries = Array.from(this.offlineMessageQueue.entries());
        entries.sort(([, a], [, b]) => {
          const aLatest = Math.max(...a.map(m => new Date(m.queuedAt).getTime()));
          const bLatest = Math.max(...b.map(m => new Date(m.queuedAt).getTime()));
          return aLatest - bLatest;
        });
        
        const toRemove = entries.slice(0, this.offlineMessageQueue.size - this.resourceLimits.maxOfflineUsers);
        for (const [profileId] of toRemove) {
          this.offlineMessageQueue.delete(profileId);
          cleanedUsers++;
        }
      }
      
      if (cleanedUsers > 0 || cleanedMessages > 0) {
        console.log(`✅ Offline messages cleanup: removed ${cleanedMessages} messages from ${cleanedUsers} users`);
      } else {
        console.log('✅ Offline messages cleanup: no cleanup needed');
      }
    } catch (error) {
      console.error('❌ Error in offline messages cleanup:', error);
    }
  }
  
  /**
   * Perform general resource cleanup
   */
  performGeneralCleanup() {
    try {
      console.log('🧹 Running general resource cleanup...');
      
      // Log resource usage stats
      const stats = {
        onlineUsers: this.onlineUsers.size,
        userSockets: this.userSockets.size,
        offlineMessageQueue: this.offlineMessageQueue.size,
        activeCalls: this.activeCalls.size,
        connectionHealth: this.connectionHealth.size,
        joinedRooms: this.joinedRooms.size,
        offlineMessagesTotal: Array.from(this.offlineMessageQueue.values()).reduce((sum, msgs) => sum + msgs.length, 0)
      };
      
      console.log('📊 Resource usage stats:', stats);
      
      // Clean up orphaned entries in userSockets
      let cleanedUserSockets = 0;
      for (const [socketId, userData] of this.userSockets) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket) {
          this.userSockets.delete(socketId);
          cleanedUserSockets++;
        }
      }
      
      // Clean up orphaned entries in onlineUsers
      let cleanedOnlineUsers = 0;
      for (const [profileId, socketId] of this.onlineUsers) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket) {
          this.onlineUsers.delete(profileId);
          cleanedOnlineUsers++;
        }
      }
      
      // Clean up orphaned room memberships
      let cleanedRoomMemberships = 0;
      for (const [socketId, rooms] of this.joinedRooms) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket) {
          this.joinedRooms.delete(socketId);
          cleanedRoomMemberships++;
        }
      }
      
      const totalCleaned = cleanedUserSockets + cleanedOnlineUsers + cleanedRoomMemberships;
      if (totalCleaned > 0) {
        console.log(`✅ General cleanup: removed ${totalCleaned} orphaned entries`);
      } else {
        console.log('✅ General cleanup: no orphaned entries found');
      }
      
      // Memory usage warning
      if (stats.offlineMessagesTotal > 1000) {
        console.warn('⚠️ High offline message count detected:', stats.offlineMessagesTotal);
      }
      
    } catch (error) {
      console.error('❌ Error in general cleanup:', error);
    }
  }
}

export default SocketController;