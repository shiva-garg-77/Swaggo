/**
 * @fileoverview Automated tests for SocketController with enhanced features
 * @version 1.0.0
 */

import SocketController from '../SocketController.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import Profile from '../../Models/FeedModels/Profile.js';
import CallLog from '../../Models/FeedModels/CallLog.js';
import { initializeLogging } from '../../Config/LoggingConfig.js';

// Mock dependencies
jest.mock('../../Models/FeedModels/Chat.js');
jest.mock('../../Models/FeedModels/Message.js');
jest.mock('../../Models/FeedModels/Profile.js');
jest.mock('../../Models/FeedModels/CallLog.js');
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));
jest.mock('web-push');
jest.mock('dayjs');
jest.mock('../../Middleware/RateLimiter.js');
jest.mock('../../Utils/WebRTCValidator.js');
jest.mock('../../Config/LoggingConfig.js');

describe('SocketController - Automated Tests', () => {
  let socketController;
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock the logging system initialization
    initializeLogging.mockResolvedValue({
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      },
      appLogger: {
        logStartup: jest.fn(),
        logShutdown: jest.fn(),
        logError: jest.fn(),
        logUserAction: jest.fn()
      },
      performanceLogger: {
        logRequestPerformance: jest.fn(),
        logDatabasePerformance: jest.fn(),
        logSlowQuery: jest.fn()
      },
      securityLogger: {
        logAuthenticationAttempt: jest.fn(),
        logSecurityEvent: jest.fn(),
        logRateLimitExceeded: jest.fn(),
        logSuspiciousActivity: jest.fn()
      }
    });
    
    // Create mock io and socket
    mockIo = {
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn(() => mockIo),
      sockets: {
        adapter: {
          rooms: {
            get: jest.fn()
          }
        },
        sockets: {
          get: jest.fn()
        }
      }
    };
    
    mockSocket = {
      id: 'test-socket-id',
      on: jest.fn(),
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn(() => mockSocket),
      user: {
        profileid: 'test-user-id',
        username: 'testuser'
      },
      handshake: {
        address: '127.0.0.1'
      },
      conn: {
        transport: {
          name: 'websocket'
        }
      }
    };
    
    // Create a new instance of the controller
    socketController = new SocketController(mockIo);
  });

  afterEach(() => {
    // Cleanup intervals
    Object.values(socketController.cleanupIntervals).forEach(interval => {
      if (interval) {
        clearInterval(interval);
      }
    });
  });

  describe('Logging System Integration', () => {
    test('should initialize logging system correctly', async () => {
      // Create a new instance to test initialization
      const newSocketController = new SocketController(mockIo);
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(initializeLogging).toHaveBeenCalled();
    });

    test('should use centralized logging method', () => {
      // Mock the logger
      socketController.logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      // Test info logging
      socketController.log('info', 'Test message', { test: 'data' });
      expect(socketController.logger.info).toHaveBeenCalledWith('Test message', {
        component: 'SocketController',
        timestamp: expect.any(String),
        test: 'data'
      });
      
      // Test warn logging
      socketController.log('warn', 'Warning message');
      expect(socketController.logger.warn).toHaveBeenCalledWith('Warning message', {
        component: 'SocketController',
        timestamp: expect.any(String)
      });
      
      // Test error logging
      socketController.log('error', 'Error message', { error: 'details' });
      expect(socketController.logger.error).toHaveBeenCalledWith('Error message', {
        component: 'SocketController',
        timestamp: expect.any(String),
        error: 'details'
      });
    });

    test('should fallback to console logging when logger is not available', () => {
      // Remove the logger to test fallback
      const originalLogger = socketController.logger;
      socketController.logger = null;
      
      // Mock console methods
      const originalConsoleLog = console.log;
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;
      
      console.log = jest.fn();
      console.warn = jest.fn();
      console.error = jest.fn();
      
      // Test info logging fallback
      socketController.log('info', 'Test message', { test: 'data' });
      expect(console.log).toHaveBeenCalledWith('[SocketController] Test message', { test: 'data' });
      
      // Test warn logging fallback
      socketController.log('warn', 'Warning message');
      expect(console.warn).toHaveBeenCalledWith('[SocketController] Warning message', {});
      
      // Test error logging fallback
      socketController.log('error', 'Error message', { error: 'details' });
      expect(console.error).toHaveBeenCalledWith('[SocketController] Error message', { error: 'details' });
      
      // Restore console methods
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      
      // Restore logger
      socketController.logger = originalLogger;
    });
  });

  describe('Room Membership Tracking', () => {
    test('should track room membership manually', async () => {
      const mockChat = {
        chatid: 'test-chat-id',
        isActive: true,
        isParticipant: jest.fn(() => true),
        getParticipant: jest.fn(() => ({ role: 'member', permissions: {} }))
      };
      
      Chat.findOne.mockResolvedValue(mockChat);
      
      // Initially no rooms tracked
      expect(socketController.joinedRooms.has(mockSocket.id)).toBe(false);
      
      // Join a chat
      await socketController.handleJoinChat(mockSocket, 'test-chat-id');
      
      // Should track the room
      expect(socketController.joinedRooms.has(mockSocket.id)).toBe(true);
      expect(socketController.joinedRooms.get(mockSocket.id)).toContain('test-chat-id');
      expect(mockSocket.join).toHaveBeenCalledWith('test-chat-id');
    });

    test('should remove room membership on leave', () => {
      // Set up initial room membership
      socketController.joinedRooms.set(mockSocket.id, new Set(['test-chat-id']));
      
      // Leave the chat
      socketController.handleLeaveChat(mockSocket, 'test-chat-id');
      
      // Should remove from tracking
      expect(socketController.joinedRooms.get(mockSocket.id)).not.toContain('test-chat-id');
      expect(mockSocket.leave).toHaveBeenCalledWith('test-chat-id');
    });

    test('should clean up room tracking on disconnect', async () => {
      // Set up room membership
      socketController.joinedRooms.set(mockSocket.id, new Set(['test-chat-id', 'test-chat-id-2']));
      socketController.userSockets.set(mockSocket.id, mockSocket.user);
      socketController.onlineUsers.set(mockSocket.user.profileid, mockSocket.id);
      
      // Mock the disconnect callback
      const disconnectCallback = jest.fn();
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'disconnect') {
          disconnectCallback.mockImplementation(callback);
        }
      });
      
      // Register socket handlers
      socketController.registerSocketHandlers(mockSocket);
      
      // Simulate disconnect
      await disconnectCallback('test-reason');
      
      // Should clean up room tracking
      expect(socketController.joinedRooms.has(mockSocket.id)).toBe(false);
    });
  });

  describe('Heartbeat Monitoring', () => {
    test('should start heartbeat monitoring with manual implementation', () => {
      // Mock the startHeartbeatMonitoring method
      socketController.startHeartbeatMonitoring = jest.fn().mockReturnValue('test-interval');
      
      // Register socket handlers
      socketController.registerSocketHandlers(mockSocket);
      
      // Should call the manual heartbeat monitoring
      expect(socketController.startHeartbeatMonitoring).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.heartbeatInterval).toBe('test-interval');
    });

    test('should send heartbeat messages', () => {
      // Test the actual heartbeat monitoring implementation
      const interval = socketController.startHeartbeatMonitoring(mockSocket);
      
      // Fast-forward the timer
      jest.advanceTimersByTime(30000);
      
      // Should emit heartbeat
      expect(mockSocket.emit).toHaveBeenCalledWith('heartbeat', {
        timestamp: expect.any(Object)
      });
      
      // Clean up
      clearInterval(interval);
    });
  });

  describe('Performance and Resource Management', () => {
    test('should handle high volume room memberships', () => {
      // Add many room memberships
      for (let i = 0; i < 100; i++) {
        const socketId = `socket-${i}`;
        const roomId = `room-${i}`;
        
        if (!socketController.joinedRooms.has(socketId)) {
          socketController.joinedRooms.set(socketId, new Set());
        }
        socketController.joinedRooms.get(socketId).add(roomId);
      }
      
      // Should handle without errors
      expect(socketController.joinedRooms.size).toBe(100);
      
      // Test cleanup function
      socketController.cleanupJoinedRooms();
      
      // Should still have valid entries (since our mock sockets don't exist)
      expect(socketController.joinedRooms.size).toBe(100);
    });

    test('should enforce map size limits for room tracking', () => {
      // Fill joinedRooms beyond limits
      for (let i = 0; i < 15001; i++) {
        socketController.joinedRooms.set(`socket${i}`, new Set([`room${i}`]));
      }
      
      // Should have exceeded limit
      expect(socketController.joinedRooms.size).toBe(15001);
      
      // Enforce limits
      socketController.enforceMapSizeLimits();
      
      // Should have removed excess entries (though exact number depends on implementation)
      expect(socketController.joinedRooms.size).toBeLessThanOrEqual(socketController.mapSizeLimits.joinedRooms);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete user session lifecycle', async () => {
      // 1. User connects
      socketController.registerSocketHandlers(mockSocket);
      expect(socketController.userSockets.has(mockSocket.id)).toBe(true);
      expect(socketController.onlineUsers.has(mockSocket.user.profileid)).toBe(true);
      
      // 2. User joins chat
      const mockChat = {
        chatid: 'integration-test-chat',
        isActive: true,
        isParticipant: jest.fn(() => true),
        getParticipant: jest.fn(() => ({ role: 'member', permissions: {} }))
      };
      Chat.findOne.mockResolvedValue(mockChat);
      
      await socketController.handleJoinChat(mockSocket, 'integration-test-chat');
      expect(socketController.joinedRooms.get(mockSocket.id)).toContain('integration-test-chat');
      
      // 3. User sends message (setup event handlers)
      socketController.setupEventHandlers(mockSocket);
      expect(mockSocket.on).toHaveBeenCalledWith('send_message', expect.any(Function));
      
      // 4. User leaves chat
      socketController.handleLeaveChat(mockSocket, 'integration-test-chat');
      expect(socketController.joinedRooms.get(mockSocket.id)).not.toContain('integration-test-chat');
      
      // 5. User disconnects
      // Mock the disconnect callback
      const disconnectHandlers = [];
      mockSocket.on.mockImplementation((event, callback) => {
        if (event === 'disconnect') {
          disconnectHandlers.push(callback);
        }
      });
      
      // Re-register to capture disconnect handler
      socketController.registerSocketHandlers(mockSocket);
      
      // Simulate disconnect for each handler
      for (const handler of disconnectHandlers) {
        await handler('test-disconnect');
      }
      
      // Should clean up all tracking
      expect(socketController.userSockets.has(mockSocket.id)).toBe(false);
      expect(socketController.onlineUsers.has(mockSocket.user.profileid)).toBe(false);
    });

    test('should maintain logging throughout session', async () => {
      // Mock logger
      socketController.logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      // Perform operations that should log
      socketController.registerSocketHandlers(mockSocket);
      expect(socketController.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('user connected'),
        expect.any(Object)
      );
      
      // Join chat
      const mockChat = {
        chatid: 'logging-test-chat',
        isActive: true,
        isParticipant: jest.fn(() => true),
        getParticipant: jest.fn(() => ({ role: 'member', permissions: {} }))
      };
      Chat.findOne.mockResolvedValue(mockChat);
      
      await socketController.handleJoinChat(mockSocket, 'logging-test-chat');
      expect(socketController.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('joined chat'),
        expect.any(Object)
      );
    });
  });
});