/**
 * @fileoverview Unit tests for SimplifiedSocketAuth middleware
 * @version 1.0.0
 */

import simplifiedSocketAuth from '../SimplifiedSocketAuth.js';
import TokenService from '../../Services/TokenService.js';
import User from '../../Models/User.js';
import Profile from '../../Models/FeedModels/Profile.js';

// Mock dependencies
jest.mock('../../Services/TokenService.js');
jest.mock('../../Models/User.js');
jest.mock('../../Models/FeedModels/Profile.js');
jest.mock('../../Middleware/RateLimiter.js', () => ({
  isRateLimited: jest.fn(() => ({ limited: false }))
}));

describe('SimplifiedSocketAuth', () => {
  let mockSocket;
  let mockNext;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock socket
    mockSocket = {
      id: 'test-socket-id',
      on: jest.fn(),
      handshake: {
        auth: {
          accessToken: 'test-access-token'
        },
        query: {},
        headers: {
          'user-agent': 'test-user-agent'
        },
        address: '127.0.0.1'
      }
    };
    
    // Create mock next function
    mockNext = jest.fn();
  });

  afterEach(() => {
    // Cleanup
    simplifiedSocketAuth.authenticatedSockets.clear();
    simplifiedSocketAuth.userSockets.clear();
    simplifiedSocketAuth.socketRooms.clear();
    simplifiedSocketAuth.offlineMessages.clear();
    
    // Clear intervals
    simplifiedSocketAuth.heartbeats.forEach(interval => {
      clearInterval(interval);
    });
    simplifiedSocketAuth.heartbeats.clear();
  });

  describe('Authentication', () => {
    test('should authenticate socket successfully', async () => {
      // Mock token verification
      TokenService.verifyAccessToken.mockResolvedValue({
        valid: true,
        user: { id: 'test-user-id' }
      });
      
      // Mock user and profile lookup
      User.findOne.mockResolvedValue({ id: 'test-user-id', username: 'testuser' });
      Profile.findOne.mockResolvedValue({ profileid: 'test-profile-id', username: 'testuser' });
      
      await simplifiedSocketAuth.authenticate(mockSocket, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockSocket.user).toEqual({
        id: 'test-user-id',
        profileid: 'test-profile-id',
        username: 'testuser'
      });
      expect(mockSocket.isAuthenticated).toBe(true);
      expect(simplifiedSocketAuth.authenticatedSockets.has(mockSocket.id)).toBe(true);
    });

    test('should reject socket without access token', async () => {
      mockSocket.handshake.auth = {};
      
      await simplifiedSocketAuth.authenticate(mockSocket, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(new Error('Authentication required'));
    });

    test('should reject socket with invalid access token', async () => {
      TokenService.verifyAccessToken.mockResolvedValue({
        valid: false
      });
      
      await simplifiedSocketAuth.authenticate(mockSocket, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(new Error('Invalid authentication token'));
    });

    test('should reject socket when user or profile not found', async () => {
      TokenService.verifyAccessToken.mockResolvedValue({
        valid: true,
        user: { id: 'test-user-id' }
      });
      
      User.findOne.mockResolvedValue(null);
      
      await simplifiedSocketAuth.authenticate(mockSocket, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(new Error('User data not found'));
    });
  });

  describe('Token Extraction', () => {
    test('should extract token from auth object', () => {
      const tokens = simplifiedSocketAuth.extractTokens(mockSocket);
      expect(tokens.accessToken).toBe('test-access-token');
    });

    test('should extract token from query parameters', () => {
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = { accessToken: 'query-token' };
      
      const tokens = simplifiedSocketAuth.extractTokens(mockSocket);
      expect(tokens.accessToken).toBe('query-token');
    });

    test('should extract token from authorization header', () => {
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      mockSocket.handshake.headers.authorization = 'Bearer header-token';
      
      const tokens = simplifiedSocketAuth.extractTokens(mockSocket);
      expect(tokens.accessToken).toBe('header-token');
    });

    test('should return null when no token found', () => {
      mockSocket.handshake.auth = {};
      mockSocket.handshake.query = {};
      mockSocket.handshake.headers.authorization = 'Invalid header';
      
      const tokens = simplifiedSocketAuth.extractTokens(mockSocket);
      expect(tokens.accessToken).toBeNull();
    });
  });

  describe('Socket Tracking', () => {
    test('should track socket correctly', () => {
      mockSocket.user = { username: 'testuser' };
      
      simplifiedSocketAuth.trackSocket(mockSocket, 'test-user-id', 'test-profile-id');
      
      expect(simplifiedSocketAuth.authenticatedSockets.has(mockSocket.id)).toBe(true);
      expect(simplifiedSocketAuth.userSockets.has('test-user-id')).toBe(true);
      expect(simplifiedSocketAuth.userSockets.get('test-user-id').has(mockSocket.id)).toBe(true);
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('Room Management', () => {
    test('should join room and track membership', () => {
      simplifiedSocketAuth.joinRoom(mockSocket, 'test-room');
      
      expect(mockSocket.join).toHaveBeenCalledWith('test-room');
      expect(simplifiedSocketAuth.socketRooms.has(mockSocket.id)).toBe(true);
      expect(simplifiedSocketAuth.socketRooms.get(mockSocket.id).has('test-room')).toBe(true);
    });

    test('should leave room and update tracking', () => {
      // First join a room
      simplifiedSocketAuth.joinRoom(mockSocket, 'test-room');
      
      // Then leave it
      simplifiedSocketAuth.leaveRoom(mockSocket, 'test-room');
      
      expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
      expect(simplifiedSocketAuth.socketRooms.get(mockSocket.id).has('test-room')).toBe(false);
    });
  });

  describe('Offline Messages', () => {
    test('should queue offline message', () => {
      const testMessage = { content: 'test message' };
      
      simplifiedSocketAuth.queueOfflineMessage('test-user-id', testMessage);
      
      expect(simplifiedSocketAuth.offlineMessages.has('test-user-id')).toBe(true);
      expect(simplifiedSocketAuth.offlineMessages.get('test-user-id').length).toBe(1);
    });

    test('should get and clear offline messages', () => {
      const testMessage = { content: 'test message' };
      simplifiedSocketAuth.queueOfflineMessage('test-user-id', testMessage);
      
      const messages = simplifiedSocketAuth.getOfflineMessages('test-user-id');
      
      expect(messages.length).toBe(1);
      expect(messages[0].message).toEqual(testMessage);
      expect(simplifiedSocketAuth.offlineMessages.has('test-user-id')).toBe(false);
    });
  });

  describe('Connection Limits', () => {
    test('should check connection limits', () => {
      // Add a socket to simulate existing connections
      simplifiedSocketAuth.authenticatedSockets.set('existing-socket', {
        userId: 'test-user-id',
        ipAddress: '127.0.0.1'
      });
      
      simplifiedSocketAuth.userSockets.set('test-user-id', new Set(['existing-socket']));
      
      const result = simplifiedSocketAuth.checkConnectionLimits(mockSocket, 'test-user-id');
      
      expect(result.allowed).toBe(true);
    });

    test('should reject when IP connection limit exceeded', () => {
      // Add multiple sockets from same IP
      for (let i = 0; i < 15; i++) {
        simplifiedSocketAuth.authenticatedSockets.set(`socket-${i}`, {
          ipAddress: '127.0.0.1'
        });
      }
      
      const result = simplifiedSocketAuth.checkConnectionLimits(mockSocket, 'test-user-id');
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP');
    });
  });

  describe('Heartbeat Management', () => {
    test('should setup heartbeat', () => {
      jest.useFakeTimers();
      
      simplifiedSocketAuth.setupHeartbeat(mockSocket);
      
      expect(setInterval).toHaveBeenCalled();
      expect(simplifiedSocketAuth.heartbeats.has(mockSocket.id)).toBe(true);
      
      jest.useRealTimers();
    });

    test('should clear heartbeat', () => {
      // Setup a heartbeat
      const intervalId = setInterval(() => {}, 1000);
      simplifiedSocketAuth.heartbeats.set(mockSocket.id, intervalId);
      
      // Clear it
      simplifiedSocketAuth.clearHeartbeat(mockSocket.id);
      
      expect(simplifiedSocketAuth.heartbeats.has(mockSocket.id)).toBe(false);
      // Note: We can't easily test that clearInterval was called with the correct ID
    });
  });

  describe('Disconnect Handling', () => {
    test('should handle disconnect properly', () => {
      // Setup socket tracking
      mockSocket.user = { username: 'testuser' };
      simplifiedSocketAuth.trackSocket(mockSocket, 'test-user-id', 'test-profile-id');
      
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls[0][1];
      disconnectHandler();
      
      expect(simplifiedSocketAuth.authenticatedSockets.has(mockSocket.id)).toBe(false);
      expect(simplifiedSocketAuth.userSockets.has('test-user-id')).toBe(false);
    });
  });

  describe('Statistics', () => {
    test('should return correct statistics', () => {
      // Add some data
      simplifiedSocketAuth.authenticatedSockets.set('test-socket', { userId: 'test-user' });
      simplifiedSocketAuth.userSockets.set('test-user', new Set(['test-socket']));
      simplifiedSocketAuth.socketRooms.set('test-socket', new Set(['test-room']));
      simplifiedSocketAuth.offlineMessages.set('test-user', [{ message: 'test' }]);
      
      const stats = simplifiedSocketAuth.getStats();
      
      expect(stats.authenticatedSockets).toBe(1);
      expect(stats.usersOnline).toBe(1);
      expect(stats.roomsTracked).toBe(1);
      expect(stats.offlineMessages).toBe(1);
    });
  });
});