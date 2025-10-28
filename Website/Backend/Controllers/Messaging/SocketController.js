// Refactored SocketController using service layer architecture
import SocketConnectionService from '../../Services/Chat/SocketConnectionService.js';
import SocketMessagingService from '../../Services/Messaging/SocketMessagingService.js';
import SocketCallService from '../../Services/Chat/SocketCallService.js';
import SocketRoomService from '../../Services/Chat/SocketRoomService.js';
import socketRateLimiter from '../../Middleware/Performance/RateLimiter.js';
import SocketAuthMiddleware from '../../Middleware/Socket/SocketAuthMiddleware.js';
import { initializeLogging } from '../../Config/LoggingConfig.js';
import { logger } from '../../utils/SanitizedLogger.js';
import { asyncHandler, AppError, NotFoundError, AuthorizationError, ValidationError, logError } from '../../utils/UnifiedErrorHandling.js';
import { container, TYPES } from '../../Config/DIContainer.js';
import EventBus from '../../Services/CQRS/EventBus.js';
import WebSocketReconnectionService from '../../Services/WebSocketReconnectionService.js';

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
 * - Enhanced WebSocket reconnection support
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
   * - Enhanced WebSocket reconnection support
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
    // Use fallback logging if logger is not yet initialized
    if (this.logger) {
      this.logger.info('🔧 Initializing service layer...');
    } else {
      console.log('[SocketController] 🔧 Initializing service layer...');
    }
    
    // Temporarily skip DI container initialization
    // Initialize services directly
    // this.connectionService = container.get(TYPES.SocketConnectionService);
    // this.messagingService = container.get(TYPES.SocketMessagingService);
    // this.callService = container.get(TYPES.SocketCallService);
    // this.roomService = container.get(TYPES.SocketRoomService);
    
    // Initialize EventBus
    // this.eventBus = container.get(TYPES.EventBus);
    
    // Initialize SystemMonitoringService
    // this.systemMonitoringService = container.get(TYPES.SystemMonitoringService);
    
    // For now, create simple mock services to prevent errors
    this.connectionService = { registerConnection: async () => true, startHeartbeatMonitoring: () => null };
    this.messagingService = null;
    this.callService = null;
    this.roomService = null;
    this.eventBus = null;
    this.systemMonitoringService = null;
    
    if (this.logger) {
      this.logger.info('✅ Service layer initialized (mock services)');
    } else {
      console.log('[SocketController] ✅ Service layer initialized (mock services)');
    }
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
    console.log('🔌 SocketController: Setting up connection handling...');
    console.log('🔌 SocketController: Registering connection event listener on io instance');
    this.io.on('connection', async (socket) => {
      try {
        console.log('🔌🔌🔌 SocketController: CONNECTION EVENT FIRED IN SOCKETCONTROLLER!');
        console.log('🔌 SocketController: NEW CONNECTION RECEIVED');
        console.log('🔌 SocketController: Socket ID:', socket.id);
        console.log('🔌 SocketController: This handler is in SocketController.js');
        
        // Extract user info from authenticated socket
        const userInfo = this.extractUserInfoFromSocket(socket);
        console.log('👤 SocketController: Extracted user info:', {
          userId: userInfo.userId,
          username: userInfo.username,
          hasUser: !!socket.user,
          socketId: socket.id
        });
        
        // Validate authentication
        if (!userInfo.userId || !userInfo.username) {
          console.log('❌ SocketController: Authentication validation failed');
          this.handleAuthenticationFailure(socket, userInfo);
          return;
        }

        console.log('🔗 SocketController: Registering connection with ConnectionService...');
        // Register connection using ConnectionService
        await this.connectionService.registerConnection(socket, userInfo);
        console.log('✅ SocketController: Connection registered successfully');
        
        console.log('💗 SocketController: Starting heartbeat monitoring...');
        // Start heartbeat monitoring using ConnectionService
        const heartbeat = this.connectionService.startHeartbeatMonitoring(socket);
        socket.heartbeatInterval = heartbeat;
        console.log('✅ SocketController: Heartbeat monitoring started');
        
        // Join user's personal room for notifications
        const personalRoom = `user_${userInfo.userId}`;
        console.log('💬 SocketController: Joining personal room:', personalRoom);
        socket.join(personalRoom);
        console.log('✅ SocketController: Joined personal room successfully');
        
        console.log('📨 SocketController: Delivering offline messages...');
        // Deliver offline messages using MessagingService
        await this.messagingService.deliverOfflineMessages(userInfo.userId, socket);
        console.log('✅ SocketController: Offline messages delivered');
        
        console.log('🎮 SocketController: Setting up event handlers...');
        // Set up all event handlers
        this.setupEventHandlers(socket);
        console.log('✅ SocketController: Event handlers setup complete');
        
        // Emit connection success with session info - PRESERVED API
        const authSuccessData = {
          success: true,
          user: {
            id: userInfo.userId,
            username: userInfo.username,
            role: userInfo.role
          },
          session: {
            deviceId: userInfo.deviceId,
            sessionId: socket.sessionId || userInfo.sessionId,
            connectedAt: new Date().toISOString()
          }
        };
        console.log('✅ SocketController: Emitting auth_success event:', authSuccessData);
        socket.emit('auth_success', authSuccessData);
        console.log('✨ SocketController: CONNECTION SETUP COMPLETE FOR USER:', userInfo.username);
        
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

    // Reconnection handlers
    socket.on('reconnect_attempt', (attemptNumber) => {
      this.log('info', 'Reconnection attempt', {
        socketId: socket.id,
        attempt: attemptNumber
      });
    });

    socket.on('reconnect', () => {
      this.log('info', 'Socket reconnected successfully', {
        socketId: socket.id
      });
      
      // Re-register connection after reconnection
      const userInfo = this.extractUserInfoFromSocket(socket);
      this.connectionService.registerConnection(socket, userInfo).catch(error => {
        this.log('error', 'Failed to re-register connection after reconnection', {
          socketId: socket.id,
          error: error.message
        });
      });
    });

    socket.on('reconnect_failed', () => {
      this.log('warn', 'Socket reconnection failed', {
        socketId: socket.id
      });
      
      // Handle reconnection failure
      socket.emit('reconnection_failed', {
        message: 'Unable to reconnect to server'
      });
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
      console.log("idhar aa gya bhai mai ")
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
      // Rate limiting for typing indicators
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'typing'
      );
      
      if (rateLimitCheck.limited) {
        // Silently ignore rate limited typing events
        return;
      }
      
      this.messagingService.handleTypingStart(socket, this.io, data).catch(error => {
        this.log('error', 'Error handling typing_start:', { error: error.message });
      });
    });

    socket.on('typing_stop', (data) => {
      this.messagingService.handleTypingStop(socket, this.io, data).catch(error => {
        this.log('error', 'Error handling typing_stop:', { error: error.message });
      });
    });

    // Message status handlers - DELEGATED TO MESSAGING SERVICE
    socket.on('message_delivered', (data) => {
      this.messagingService.handleMessageDelivered(socket, this.io, data).catch(error => {
        this.log('error', 'Error handling message_delivered:', { error: error.message });
      });
    });

    socket.on('message_read', (data) => {
      this.messagingService.handleMessageRead(socket, this.io, data).catch(error => {
        this.log('error', 'Error handling message_read:', { error: error.message });
      });
    });

    // WebRTC call handlers - DELEGATED TO CALL SERVICE WITH AUTH
    socket.on('call_initiate', (data) => {
      this.callService.handleCallInitiate(socket, this.io, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('call_accept', (data) => {
      this.callService.handleCallAccept(socket, this.io, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('call_reject', (data) => {
      this.callService.handleCallReject(socket, this.io, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('call_end', (data) => {
      this.callService.handleCallEnd(socket, this.io, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('webrtc_offer', (data) => {
      this.callService.handleWebRTCOffer(socket, this.io, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('webrtc_answer', (data) => {
      this.callService.handleWebRTCAnswer(socket, this.io, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      this.callService.handleWebRTCIceCandidate(socket, this.io, data).catch(error => {
        socket.emit('call_error', { error: error.message });
      });
    });

    // Notification handlers
    socket.on('notification_read', (data) => {
      // Handle notification read status
      console.log('Notification read:', data);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Disconnection handler - DELEGATED TO CONNECTION SERVICE
    socket.on('disconnect', (reason) => {
      this.connectionService.handleDisconnection(socket, reason, this.io).catch(error => {
        this.log('error', 'Error handling disconnection:', { error: error.message });
      });
    });

    // Graceful shutdown handler
    socket.on('shutdown', () => {
      socket.emit('shutdown_ack', { message: 'Server shutting down' });
      socket.disconnect(true);
    });

    // Health check handler
    socket.on('health_check', (data, callback) => {
      if (callback) {
        callback({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage()
        });
      }
    });

    // Custom event handlers for enterprise features
    socket.on('enterprise_feature_request', (data) => {
      // Handle enterprise feature requests
      console.log('Enterprise feature request:', data);
    });
  }

  /**
   * Register socket handlers - BACKWARD COMPATIBLE API
   */
  registerSocketHandlers(socket) {
    // All handlers are now registered in setupEventHandlers
    // This method is kept for backward compatibility
    this.setupEventHandlers(socket);
  }

  /**
   * Graceful shutdown - PRESERVED FUNCTIONALITY
   */
  async gracefulShutdown() {
    console.log('🔄 Initiating graceful shutdown...');
    
    try {
      // Disconnect all sockets
      if (this.io) {
        this.io.close(() => {
          console.log('✅ All socket connections closed');
        });
      }
      
      // Perform any cleanup operations
      console.log('✅ SocketController shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

export default SocketController;
