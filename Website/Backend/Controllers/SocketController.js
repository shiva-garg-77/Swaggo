// Refactored SocketController using service layer architecture
import SocketConnectionService from '../Services/SocketConnectionService.js';
import SocketMessagingService from '../Services/SocketMessagingService.js';
import SocketCallService from '../Services/SocketCallService.js';
import SocketRoomService from '../Services/SocketRoomService.js';
import socketRateLimiter from '../Middleware/RateLimiter.js';
import SocketAuthMiddleware from '../Middleware/SocketAuthMiddleware.js';
import { initializeLogging } from '../Config/LoggingConfig.js';
import { logger } from '../utils/SanitizedLogger.js';
import { asyncHandler, AppError, NotFoundError, AuthorizationError, ValidationError, logError } from '../Helper/UnifiedErrorHandling.js';
import { container, TYPES } from '../Config/DIContainer.js';
import EventBus from '../Services/EventBus.js';

/**
 * @fileoverview Refactored Socket.IO Controller using service layer architecture
 * @module SocketController
 * @version 3.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Enterprise-grade Socket.IO controller refactored with service layer architecture:
 * - Thin orchestration layer that delegates to specialized services
 * - Maintains 100% backward compatibility with existing API
 * - Preserves all security, performance, and memory management features
 * - Improved maintainability and testability through separation of concerns
 * 
 * Services:
 * - SocketConnectionService: Connection management, heartbeat monitoring, online status
 * - SocketMessagingService: Real-time messaging, typing indicators, offline messages
 * - SocketCallService: WebRTC call management, call state tracking
 * - SocketRoomService: Chat room management, joining/leaving rooms
 */

class SocketController {
  /**
   * @constructor
   * @description Initialize SocketController with service layer architecture
   * 
   * Features preserved:
   * - All security controls (rate limiting, auth, XSS sanitization)
   * - Memory management and cleanup systems
   * - Performance monitoring and health checks
   * - Graceful degradation and error recovery
   * - Exact same external API and behavior
   * 
   * @param {Object} io - Socket.IO server instance
   */
  constructor(io) {
    // Store Socket.IO instance
    this.io = io;
    
    // Initialize logging system
    this.initializeLoggingSystem();
    
    // Initialize service layer
    this.initializeServices();
    
    // Setup graceful shutdown handlers
    this.setupGracefulShutdown();
  }

  /**
   * Initialize centralized logging system
   */
  async initializeLoggingSystem() {
    try {
      const logging = await initializeLogging();
      this.logger = logging.logger;
      this.appLogger = logging.appLogger;
      this.performanceLogger = logging.performanceLogger;
      this.securityLogger = logging.securityLogger;
      
      // Log initialization
      this.appLogger.logStartup(process.env.PORT || 3001, process.env.NODE_ENV || 'development');
      
      this.logger.info('Centralized logging system initialized', {
        timestamp: new Date().toISOString(),
        component: 'SocketController'
      });
    } catch (error) {
      // Fallback to console logging if logging system fails to initialize
      console.error('Failed to initialize centralized logging system:', error);
    }
  }

  /**
   * Initialize service layer
   */
  initializeServices() {
    this.logger.info('🔧 Initializing service layer...');
    
    // Initialize services using DI container
    this.connectionService = container.get(TYPES.SocketConnectionService);
    this.messagingService = container.get(TYPES.SocketMessagingService);
    this.callService = container.get(TYPES.SocketCallService);
    this.roomService = container.get(TYPES.SocketRoomService);
    
    // Initialize EventBus
    this.eventBus = container.get(TYPES.EventBus);
    
    // Initialize SystemMonitoringService
    this.systemMonitoringService = container.get(TYPES.SystemMonitoringService);
    
    this.logger.info('✅ Service layer initialized', {
      services: [
        'SocketConnectionService',
        'SocketMessagingService', 
        'SocketCallService',
        'SocketRoomService',
        'EventBus',
        'SystemMonitoringService'
      ]
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    // CRITICAL: Add graceful shutdown handler
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('uncaughtException', (error) => {
      this.log('error', '❌ Uncaught Exception in SocketController:', { error: error.message, stack: error.stack });
      this.gracefulShutdown();
    });
  }

  /**
   * Centralized logging method with log levels and filtering
   */
  log(level, message, meta = {}) {
    // In production, filter out debug logs
    if (process.env.NODE_ENV === 'production' && level === 'debug') {
      return;
    }
    
    // Use centralized logger if available, fallback to console
    if (this.logger) {
      this.logger[level](message, {
        component: 'SocketController',
        timestamp: new Date().toISOString(),
        ...meta
      });
    } else {
      // Fallback to console with filtering
      const shouldLog = process.env.NODE_ENV !== 'production' || 
                       (level !== 'debug' && level !== 'verbose');
      
      if (shouldLog) {
        console[level](`[SocketController] ${message}`, meta);
      }
    }
  }

  /**
   * Initialize Socket.IO server - BACKWARD COMPATIBLE API
   */
  initialize(io) {
    this.io = io;
    this.setupSocketAuthentication();
    this.setupConnectionHandling();
    return io;
  }

  /**
   * Setup Socket.IO authentication middleware - PRESERVED SECURITY
   */
  setupSocketAuthentication() {
    // NOTE: Authentication is handled by AuthMiddleware.socketAuth in main.js
    // This method is kept for backward compatibility but auth logic is centralized
    console.log('🔐 Socket authentication delegated to AuthMiddleware.socketAuth');
  }

  /**
   * Handle new socket connections - REFACTORED TO USE SERVICES
   */
  setupConnectionHandling() {
    this.io.on('connection', async (socket) => {
      try {
        // Extract user info from authenticated socket
        const userInfo = this.extractUserInfoFromSocket(socket);
        
        // Validate authentication
        if (!userInfo.userId || !userInfo.username) {
          this.handleAuthenticationFailure(socket, userInfo);
          return;
        }

        // Register connection using ConnectionService
        await this.connectionService.registerConnection(socket, userInfo);
        
        // Start heartbeat monitoring using ConnectionService
        const heartbeat = this.connectionService.startHeartbeatMonitoring(socket);
        socket.heartbeatInterval = heartbeat;
        
        // Join user's personal room for notifications
        socket.join(`user_${userInfo.userId}`);
        
        // Deliver offline messages using MessagingService
        await this.messagingService.deliverOfflineMessages(userInfo.userId, socket);
        
        // Set up all event handlers
        this.setupEventHandlers(socket);
        
        // Emit connection success with session info - PRESERVED API
        socket.emit('auth_success', {
          success: true,
          user: {
            id: userInfo.userId,
            username: userInfo.username,
            role: userInfo.role
          },
          session: {
            deviceId: userInfo.deviceId,
            sessionId: userInfo.sessionId,
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
    
    // Handle token expiry and auto-refresh - PRESERVED FUNCTIONALITY
    this.io.engine.on('connection_error', (err) => {
      if (err.code === 'TOKEN_EXPIRED') {
        console.log('🔄 Socket token expired, client should refresh');
      }
    });
  }

  /**
   * Extract user information from authenticated socket
   */
  extractUserInfoFromSocket(socket) {
    const userId = socket.userId || socket.user?.id || socket.user?.profileid || socket.user?.userId;
    const username = socket.username || socket.user?.username;
    const role = socket.role || socket.user?.permissions?.role || socket.user?.role || 'user';
    const deviceId = socket.deviceId || socket.authContext?.deviceFingerprint;
    const sessionId = socket.sessionId || crypto.randomUUID();
    const mfaVerified = socket.mfaVerified || socket.user?.mfaEnabled || false;

    return {
      userId,
      username,
      role,
      deviceId,
      sessionId,
      mfaVerified
    };
  }

  /**
   * Handle authentication failure
   */
  handleAuthenticationFailure(socket, userInfo) {
    console.error('❌ Socket connection rejected: User not properly authenticated', {
      hasUserId: !!userInfo.userId,
      hasUsername: !!userInfo.username,
      socketId: socket.id
    });
    
    socket.emit('auth_error', {
      code: 'AUTH_REQUIRED',
      message: 'Authentication required - connection rejected'
    });
    
    socket.disconnect(true);
  }

  /**
   * Register all socket event handlers - REFACTORED TO USE SERVICES
   */
  setupEventHandlers(socket) {
    // Connection health handlers - DELEGATED TO CONNECTION SERVICE
    socket.on('pong', (timestamp) => {
      this.connectionService.handlePong(socket, timestamp);
    });
    
    socket.on('ping', (data, callback) => {
      this.connectionService.handlePing(socket, data, callback);
    });

    // Chat room management - DELEGATED TO ROOM SERVICE WITH RATE LIMITING
    socket.on('join_chat', (data) => {
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
      
      // Delegate to RoomService
      this.roomService.handleJoinChat(socket, this.io, chatid).catch(error => {
        socket.emit('chat_error', { error: error.message });
      });
    });

    socket.on('leave_chat', (data) => {
      const chatid = typeof data === 'string' ? data : data.chatid;
      if (!chatid || typeof chatid !== 'string') {
        console.error('❌ Invalid chatid in leave_chat:', data);
        socket.emit('chat_error', { error: 'Invalid chatid', data });
        return;
      }
      
      // Delegate to RoomService
      this.roomService.handleLeaveChat(socket, this.io, chatid).catch(error => {
        socket.emit('chat_error', { error: error.message });
      });
    });

    // Messaging handlers - DELEGATED TO MESSAGING SERVICE WITH RATE LIMITING
    socket.on('send_message', (data, callback) => {
      this.messagingService.handleSendMessage(socket, this.io, data, callback).catch(error => {
        if (callback) callback({ success: false, error: error.message });
      });
    });

    socket.on('send_message_batch', (data, callback) => {
      this.messagingService.handleSendBatchedMessages(socket, this.io, data, callback).catch(error => {
        if (callback) callback({ success: false, error: error.message });
      });
    });

    // Typing indicators - DELEGATED TO MESSAGING SERVICE WITH RATE LIMITING
    socket.on('typing_start', (data) => {
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'typing'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited typing_start from ${socket.user?.username}: ${rateLimitCheck.type}`);
        return;
      }
      
      this.messagingService.handleTypingStart(socket, this.io, data.chatid || data).catch(error => {
        console.error('Error handling typing_start:', error);
      });
    });

    socket.on('typing_stop', (data) => {
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'typing'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited typing_stop from ${socket.user?.username}: ${rateLimitCheck.type}`);
        return;
      }
      
      this.messagingService.handleTypingStop(socket, this.io, data.chatid || data).catch(error => {
        console.error('Error handling typing_stop:', error);
      });
    });

    // Message reactions - DELEGATED TO MESSAGING SERVICE WITH RATE LIMITING
    socket.on('react_to_message', (data) => {
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
      
      this.messagingService.handleReactToMessage(socket, this.io, data).catch(error => {
        socket.emit('message_error', { error: error.message });
      });
    });

    socket.on('mark_message_read', (data) => {
      this.messagingService.handleMarkMessageRead(socket, this.io, data).catch(error => {
        console.error('Error marking message as read:', error);
      });
    });

    // Call management - DELEGATED TO CALL SERVICE WITH RATE LIMITING
    socket.on('initiate_call', (data) => {
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'general'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited initiate_call from ${socket.user?.username}: ${rateLimitCheck.type}`);
        socket.emit('rate_limited', {
          message: 'Call initiation rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter,
          action: 'initiate_call'
        });
        return;
      }
      
      this.callService.initiateCall(socket, this.io, this.connectionService, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('accept_call', (data) => {
      this.callService.acceptCall(socket, this.io, this.connectionService, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('reject_call', (data) => {
      this.callService.rejectCall(socket, this.io, this.connectionService, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('end_call', (data) => {
      const { callId } = data;
      this.callService.endCall(callId, this.io, this.connectionService, 'ended', socket.user.profileid).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('ice_candidate', (data) => {
      this.callService.handleIceCandidate(socket, this.io, this.connectionService, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    // Disconnect handler - ORCHESTRATES ALL SERVICE CLEANUPS
    socket.on('disconnect', async (reason) => {
      const userId = socket.user?.profileid;
      const username = socket.user?.username;
      
      console.log(`🚪 User disconnected: ${username} (${userId}) - Reason: ${reason}`);
      
      try {
        // Cleanup in proper order
        await this.messagingService.cleanupTypingTimeouts(userId);
        await this.callService.cleanupUserCallsByUserId(userId, this.io, this.connectionService);
        await this.roomService.cleanupOnDisconnect(socket, this.io);
        await this.connectionService.unregisterConnection(socket, reason);
      } catch (error) {
        console.error('Error during disconnect cleanup:', error);
      }
    });
  }

  // BACKWARD COMPATIBLE METHODS - DELEGATED TO SERVICES

  /**
   * Get online users count - DELEGATED TO CONNECTION SERVICE
   */
  getOnlineUsersCount() {
    return this.connectionService.getOnlineUsersCount();
  }

  /**
   * Check if user is online - DELEGATED TO CONNECTION SERVICE
   */
  isUserOnline(userId) {
    return this.connectionService.isUserOnline(userId);
  }

  /**
   * Get connection statistics - AGGREGATED FROM ALL SERVICES
   */
  getConnectionStats() {
    return {
      ...this.connectionService.getConnectionStats(),
      ...this.messagingService.getMessagingStats(),
      ...this.callService.getCallStats(),
      ...this.roomService.getRoomStats()
    };
  }

  /**
   * Graceful shutdown - ORCHESTRATES ALL SERVICE SHUTDOWNS
   */
  async gracefulShutdown() {
    this.log('info', '🛑 SocketController graceful shutdown initiated...');
    
    try {
      // Emit system shutdown event
      this.eventBus.emit('system.shutdown', {
        reason: 'Application shutdown',
        timestamp: new Date().toISOString()
      });
      
      // Shutdown all services in proper order
      await this.messagingService.gracefulShutdown();
      await this.callService.gracefulShutdown();
      await this.roomService.gracefulShutdown();
      await this.connectionService.gracefulShutdown();
      await this.systemMonitoringService.gracefulShutdown();
      
      // Close Socket.IO server
      if (this.io) {
        this.io.close();
      }
      
      this.log('info', '✅ SocketController shutdown completed');
    } catch (error) {
      this.log('error', '❌ Error during SocketController shutdown:', { error: error.message, stack: error.stack });
    }
  }

  // LEGACY METHOD COMPATIBILITY - PRESERVED FOR BACKWARD COMPATIBILITY
  
  /**
   * Register socket handlers - BACKWARD COMPATIBLE API
   */
  registerSocketHandlers(socket) {
    // This method is preserved for backward compatibility
    // The new architecture handles this through setupEventHandlers
    this.setupEventHandlers(socket);
  }
}

export default SocketController;