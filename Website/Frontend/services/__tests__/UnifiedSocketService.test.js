/**
 * @fileoverview Unit tests for UnifiedSocketService
 * @version 1.1.0
 */

import UnifiedSocketService from '../UnifiedSocketService.js';
import { CONNECTION_STATES, CONNECTION_QUALITY } from '../UnifiedSocketService.js';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
    io: {
      opts: {}
    }
  };
  
  return {
    io: jest.fn(() => mockSocket),
    Manager: jest.fn()
  };
});

// Mock dependencies
const mockNotificationService = {
  error: jest.fn()
};

jest.mock('../../lib/ConnectionState.js', () => ({
  registerConnection: jest.fn(),
  updateConnection: jest.fn()
}));

jest.mock('../../config/SecureEnvironment.js', () => ({
  getUrlConfig: () => ({ socket: 'http://localhost:3001' }),
  getConnectionConfig: () => ({ timeout: 5000, retryAttempts: 5 })
}));

describe('UnifiedSocketService', () => {
  let socketService;
  let mockSocket;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance of the service with mocked notification service
    socketService = new UnifiedSocketService(mockNotificationService);
    
    // Get the mock socket instance
    mockSocket = require('socket.io-client').io.mock.results[0].value;
  });

  afterEach(() => {
    // Cleanup
    socketService.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(socketService.connectionState).toBe(CONNECTION_STATES.DISCONNECTED);
      expect(socketService.isConnecting).toBe(false);
      expect(socketService.isAuthenticated).toBe(false);
      expect(socketService.reconnectAttempts).toBe(0);
      expect(socketService.messageQueue).toEqual([]);
      expect(socketService.onlineUsers).toEqual(new Set());
      expect(socketService.connectionQuality).toBe(CONNECTION_QUALITY.UNKNOWN);
      expect(socketService.latency).toBe(0);
      expect(socketService.isNetworkStable).toBe(true);
    });

    test('should get correct socket configuration', () => {
      const config = socketService.getSocketConfig();
      expect(config.url).toBe('http://localhost:3001');
      expect(config.options.timeout).toBe(5000);
      expect(config.options.autoConnect).toBe(false);
    });
  });

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      mockSocket.connected = true;
      
      const connectPromise = socketService.connect();
      
      // Simulate connection event
      const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectCallback();
      
      const socket = await connectPromise;
      
      expect(socket).toBe(mockSocket);
      expect(socketService.connectionState).toBe(CONNECTION_STATES.CONNECTED);
      expect(socketService.isConnecting).toBe(false);
    });

    test('should handle connection error', async () => {
      const connectPromise = socketService.connect();
      
      // Simulate connection error
      const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorCallback(new Error('Connection failed'));
      
      await expect(connectPromise).rejects.toThrow('Connection failed');
      expect(socketService.connectionState).toBe(CONNECTION_STATES.FAILED);
    });

    test('should handle connection timeout', async () => {
      // Mock setTimeout to call immediately
      jest.useFakeTimers();
      
      const connectPromise = socketService.connect();
      
      // Fast-forward until all timers are executed
      jest.runAllTimers();
      
      await expect(connectPromise).rejects.toThrow('Connection timeout');
      
      jest.useRealTimers();
    });
  });

  describe('Message Handling', () => {
    test('should queue messages when not connected', () => {
      const result = socketService.emit('test_event', { data: 'test' });
      expect(result).toBe(false);
      expect(socketService.messageQueue.length).toBe(1);
      expect(socketService.messageQueue[0]).toEqual({
        event: 'test_event',
        data: { data: 'test' }
      });
    });

    test('should send messages when connected', () => {
      // Simulate connected state
      socketService.socket = mockSocket;
      mockSocket.connected = true;
      
      const result = socketService.emit('test_event', { data: 'test' });
      expect(result).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('test_event', { data: 'test' }, undefined);
    });

    test('should process message queue when connected', () => {
      // Add messages to queue
      socketService.messageQueue.push(
        { event: 'event1', data: { id: 1 } },
        { event: 'event2', data: { id: 2 } }
      );
      
      // Simulate connected state
      socketService.socket = mockSocket;
      mockSocket.connected = true;
      
      socketService.processMessageQueue();
      
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledWith('event1', { id: 1 }, undefined);
      expect(mockSocket.emit).toHaveBeenCalledWith('event2', { id: 2 }, undefined);
      expect(socketService.messageQueue.length).toBe(0);
    });

    test('should handle message deduplication', () => {
      const messageData = { clientMessageId: 'test-id', content: 'test' };
      
      // First emit should succeed
      const result1 = socketService.emitMessage('send_message', messageData);
      
      // Second emit with same data should be skipped
      const result2 = socketService.emitMessage('send_message', messageData);
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Room Management', () => {
    test('should join room when connected', () => {
      // Simulate connected state
      socketService.socket = mockSocket;
      mockSocket.connected = true;
      
      const result = socketService.joinRoom('test_room');
      expect(result).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('join_room', { roomId: 'test_room' });
      expect(socketService.activeRooms.has('test_room')).toBe(true);
    });

    test('should queue room join when not connected', () => {
      const result = socketService.joinRoom('test_room');
      expect(result).toBe(false);
      expect(socketService.messageQueue.length).toBe(1);
      expect(socketService.messageQueue[0]).toEqual({
        event: 'join_room',
        data: { roomId: 'test_room' }
      });
    });

    test('should leave room when connected', () => {
      // Simulate connected state and joined room
      socketService.socket = mockSocket;
      mockSocket.connected = true;
      socketService.activeRooms.add('test_room');
      
      const result = socketService.leaveRoom('test_room');
      expect(result).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('leave_room', { roomId: 'test_room' });
      expect(socketService.activeRooms.has('test_room')).toBe(false);
    });
  });

  describe('Authentication', () => {
    test('should get auth data from cookies', () => {
      // Mock document.cookie
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'accessToken=test_token; refreshToken=test_refresh'
      });
      
      const authData = socketService.getAuthData();
      expect(authData).toEqual({
        accessToken: 'test_token',
        refreshToken: 'test_refresh',
        timestamp: expect.any(Number),
        clientInfo: {
          userAgent: expect.any(String),
          platform: expect.any(String),
          language: expect.any(String)
        }
      });
    });

    test('should handle missing auth data', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: ''
      });
      
      const authData = socketService.getAuthData();
      expect(authData).toEqual({
        accessToken: null,
        refreshToken: null,
        timestamp: expect.any(Number),
        clientInfo: {
          userAgent: expect.any(String),
          platform: expect.any(String),
          language: expect.any(String)
        }
      });
    });
  });

  describe('Reconnection', () => {
    test('should schedule reconnection', () => {
      jest.useFakeTimers();
      
      socketService.handleConnectionError(new Error('Test error'));
      
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(socketService.reconnectAttempts).toBe(1);
      
      jest.useRealTimers();
    });

    test('should handle max reconnection attempts', () => {
      jest.useFakeTimers();
      
      // Set max attempts to 1 for testing
      socketService.maxReconnectAttempts = 1;
      
      // First attempt
      socketService.handleConnectionError(new Error('Test error'));
      expect(socketService.reconnectAttempts).toBe(1);
      
      // Second attempt should not schedule reconnection
      socketService.handleConnectionError(new Error('Test error'));
      expect(socketService.reconnectAttempts).toBe(1); // Should not increment
      
      jest.useRealTimers();
    });

    test('should calculate reconnect delay with advanced strategies', () => {
      // Test base calculation
      const delay1 = socketService.calculateReconnectDelay();
      expect(delay1).toBeGreaterThanOrEqual(1000);
      
      // Test with poor connection quality
      socketService.connectionQuality = CONNECTION_QUALITY.POOR;
      const delay2 = socketService.calculateReconnectDelay();
      expect(delay2).toBeGreaterThan(delay1);
      
      // Test with unstable network
      socketService.isNetworkStable = false;
      const delay3 = socketService.calculateReconnectDelay();
      expect(delay3).toBeGreaterThan(delay2);
    });
  });

  describe('Connection Quality Monitoring', () => {
    test('should update connection quality based on latency', () => {
      // Test excellent quality
      socketService.latency = 50;
      socketService.updateConnectionQuality();
      expect(socketService.connectionQuality).toBe(CONNECTION_QUALITY.EXCELLENT);
      
      // Test good quality
      socketService.latency = 200;
      socketService.updateConnectionQuality();
      expect(socketService.connectionQuality).toBe(CONNECTION_QUALITY.GOOD);
      
      // Test fair quality
      socketService.latency = 400;
      socketService.updateConnectionQuality();
      expect(socketService.connectionQuality).toBe(CONNECTION_QUALITY.FAIR);
      
      // Test poor quality
      socketService.latency = 600;
      socketService.updateConnectionQuality();
      expect(socketService.connectionQuality).toBe(CONNECTION_QUALITY.POOR);
    });

    test('should start and stop connection quality monitoring', () => {
      // Mock navigator.connection
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }
      });
      
      socketService.startConnectionQualityMonitoring();
      expect(navigator.connection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      socketService.stopConnectionQualityMonitoring();
      expect(navigator.connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Network Monitoring', () => {
    test('should handle network online/offline events', () => {
      // Mock window events
      const onlineCallback = jest.fn();
      const offlineCallback = jest.fn();
      
      window.addEventListener = jest.fn((event, callback) => {
        if (event === 'online') onlineCallback();
        if (event === 'offline') offlineCallback();
      });
      
      socketService.setupNetworkMonitoring();
      
      // Simulate online event
      const onlineHandler = window.addEventListener.mock.calls.find(call => call[0] === 'online')[1];
      onlineHandler();
      expect(socketService.isNetworkStable).toBe(true);
      
      // Simulate offline event
      const offlineHandler = window.addEventListener.mock.calls.find(call => call[0] === 'offline')[1];
      offlineHandler();
      expect(socketService.isNetworkStable).toBe(false);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup properly', () => {
      // Add some data to cleanup
      socketService.messageQueue.push({ event: 'test', data: {} });
      socketService.onlineUsers.add('user1');
      socketService.activeRooms.add('room1');
      socketService.connectionMetrics.set('test', 'value');
      
      socketService.cleanup();
      
      expect(socketService.messageQueue.length).toBe(0);
      expect(socketService.onlineUsers.size).toBe(0);
      expect(socketService.activeRooms.size).toBe(0);
      expect(socketService.connectionMetrics.size).toBe(0);
    });

    test('should disconnect socket', () => {
      socketService.socket = mockSocket;
      mockSocket.connected = true;
      
      socketService.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.connectionState).toBe(CONNECTION_STATES.DISCONNECTED);
    });
  });

  describe('Status', () => {
    test('should return correct status', () => {
      const status = socketService.getStatus();
      expect(status).toEqual({
        connectionState: CONNECTION_STATES.DISCONNECTED,
        isConnected: false,
        isAuthenticated: false,
        currentUser: null,
        onlineUsersCount: 0,
        messageQueueLength: 0,
        activeRoomsCount: 0,
        reconnectAttempts: 0,
        socketUrl: 'http://localhost:3001',
        connectionQuality: CONNECTION_QUALITY.UNKNOWN,
        latency: 0,
        isNetworkStable: true
      });
    });
  });

  describe('Utility Functions', () => {
    test('should generate hash code correctly', () => {
      const hash1 = socketService.hashCode('test');
      const hash2 = socketService.hashCode('test');
      const hash3 = socketService.hashCode('different');
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    test('should cleanup message cache', () => {
      // Add old entries to cache
      const now = Date.now();
      socketService.messageProcessingCache.set('old-key', now - 400000); // 400 seconds old
      socketService.messageProcessingCache.set('new-key', now - 1000); // 1 second old
      
      socketService.cleanupMessageCache();
      
      // Old entry should be removed, new entry should remain
      expect(socketService.messageProcessingCache.has('old-key')).toBe(false);
      expect(socketService.messageProcessingCache.has('new-key')).toBe(true);
    });
  });
});