/**
 * @fileoverview Unit tests for SocketController
 * @version 1.0.0
 */

import SocketController from '../SocketController.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import Profile from '../../Models/FeedModels/Profile.js';
import CallLog from '../../Models/FeedModels/CallLog.js';

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
jest.mock('../../Middleware/SimplifiedSocketAuth.js', () => ({
  trackSocket: jest.fn(),
  getOfflineMessages: jest.fn(() => []),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn()
}));

describe('SocketController', () => {
  let socketController;
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
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

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(socketController.io).toBe(mockIo);
      expect(socketController.onlineUsers).toBeInstanceOf(Map);
      expect(socketController.userSockets).toBeInstanceOf(Map);
      expect(socketController.offlineMessageQueue).toBeInstanceOf(Map);
      expect(socketController.activeCalls).toBeInstanceOf(Map);
      expect(socketController.connectionHealth).toBeInstanceOf(Map);
    });
  });

  describe('Graceful Shutdown', () => {
    test('should shutdown gracefully', async () => {
      // Add some data to cleanup
      socketController.onlineUsers.set('test-user', 'test-socket');
      socketController.userSockets.set('test-socket', { userId: 'test-user' });
      
      await socketController.gracefulShutdown();
      
      expect(socketController.onlineUsers.size).toBe(0);
      expect(socketController.userSockets.size).toBe(0);
    });
  });

  describe('Connection Management', () => {
    test('should register socket handlers', () => {
      socketController.registerSocketHandlers(mockSocket);
      
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(socketController.connectionHealth.has(mockSocket.id)).toBe(true);
    });

    test('should setup event handlers', () => {
      socketController.setupEventHandlers(mockSocket);
      
      // Check that core events are registered
      expect(mockSocket.on).toHaveBeenCalledWith('pong', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('join_chat', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('leave_chat', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('send_message', expect.any(Function));
    });
  });

  describe('Message Handling', () => {
    test('should handle join chat', async () => {
      const mockChat = {
        chatid: 'test-chat-id',
        isActive: true,
        isParticipant: jest.fn(() => true),
        getParticipant: jest.fn(() => ({ role: 'member', permissions: {} }))
      };
      
      Chat.findOne.mockResolvedValue(mockChat);
      
      await socketController.handleJoinChat(mockSocket, 'test-chat-id');
      
      expect(mockSocket.join).toHaveBeenCalledWith('test-chat-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('chat_joined', expect.any(Object));
    });

    test('should handle leave chat', () => {
      socketController.handleLeaveChat(mockSocket, 'test-chat-id');
      
      expect(mockSocket.leave).toHaveBeenCalledWith('test-chat-id');
      expect(mockSocket.to).toHaveBeenCalledWith('test-chat-id');
    });
  });

  describe('User Status Management', () => {
    test('should update user online status', async () => {
      const mockProfile = { save: jest.fn() };
      Profile.findOneAndUpdate.mockResolvedValue(mockProfile);
      
      const mockChat = { chatid: 'test-chat-id', isActive: true };
      Chat.find.mockResolvedValue([mockChat]);
      
      await socketController.updateUserOnlineStatus('test-user-id', true);
      
      expect(Profile.findOneAndUpdate).toHaveBeenCalledWith(
        { profileid: 'test-user-id' },
        { isOnline: true, lastSeen: expect.any(Date) }
      );
      expect(mockIo.to).toHaveBeenCalledWith('test-chat-id');
    });
  });

  describe('Resource Management', () => {
    test('should enforce map size limits', () => {
      // Fill maps beyond limits
      for (let i = 0; i < 10001; i++) {
        socketController.onlineUsers.set(`user${i}`, `socket${i}`);
      }
      
      socketController.enforceMapSizeLimits();
      
      // Should have removed excess entries
      expect(socketController.onlineUsers.size).toBeLessThan(10001);
    });

    test('should cleanup offline messages', () => {
      const now = Date.now();
      socketController.offlineMessageQueue.set('test-user', [
        { message: {}, queuedAt: new Date(now - 10000) }, // Recent
        { message: {}, queuedAt: new Date(now - 100000000) } // Old
      ]);
      
      socketController.cleanupOfflineMessagesEnhanced();
      
      // Should have removed old message
      const messages = socketController.offlineMessageQueue.get('test-user');
      expect(messages.length).toBe(1);
    });
  });

  describe('Call Management', () => {
    test('should cleanup user calls by user ID', () => {
      // Add a call to cleanup
      socketController.activeCalls.set('test-call-id', {
        callerId: 'test-user-id',
        receiverId: 'other-user-id',
        participants: new Set(['test-socket-id'])
      });
      
      socketController.cleanupUserCallsByUserId('test-user-id');
      
      expect(socketController.activeCalls.size).toBe(0);
    });
  });

  describe('Memory Management', () => {
    test('should perform comprehensive cleanup', () => {
      // Add some data
      socketController.onlineUsers.set('test-user', 'test-socket');
      socketController.userSockets.set('test-socket', { userId: 'test-user' });
      
      socketController.performComprehensiveCleanup();
      
      // Data should still be there (this is just a monitoring function)
      expect(socketController.onlineUsers.has('test-user')).toBe(true);
    });

    test('should check memory and cleanup', () => {
      // Mock memory usage
      const originalGc = global.gc;
      global.gc = jest.fn();
      
      socketController.checkMemoryAndCleanup();
      
      // Should not throw
      expect(true).toBe(true);
      
      global.gc = originalGc;
    });
  });
});