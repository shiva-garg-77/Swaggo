/**
 * @fileoverview Integration tests for Socket Services
 * @version 1.0.0
 */

import SocketController from '../SocketController.js';

describe('Socket Services Integration', () => {
  let socketController;
  let mockIo;
  let mockSocket;

  beforeEach(() => {
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
  });

  afterEach(() => {
    // Cleanup intervals if they exist
    if (socketController && socketController.cleanupIntervals) {
      Object.values(socketController.cleanupIntervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
    }
  });

  test('should instantiate refactored SocketController successfully', () => {
    socketController = new SocketController(mockIo);
    
    expect(socketController.io).toBe(mockIo);
    expect(socketController.connectionService).toBeDefined();
    expect(socketController.messagingService).toBeDefined();
    expect(socketController.callService).toBeDefined();
    expect(socketController.roomService).toBeDefined();
  });

  test('should register socket handlers successfully', () => {
    socketController = new SocketController(mockIo);
    socketController.registerSocketHandlers(mockSocket);
    
    // Check that event handlers are registered
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('pong', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('ping', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('join_chat', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('leave_chat', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('send_message', expect.any(Function));
  });
});