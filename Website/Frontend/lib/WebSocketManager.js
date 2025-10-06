/**
 * WebSocket Manager - Enhanced connection management for development
 */

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isEnabled = typeof window !== 'undefined';
  }

  connect(url, options = {}) {
    if (!this.isEnabled) return null;

    try {
      const ws = new WebSocket(url);
      const connectionId = Math.random().toString(36).substr(2, 9);
      
      ws.addEventListener('error', (event) => {
        console.log('🔌 WebSocket connection error suppressed:', connectionId);
      });

      ws.addEventListener('close', (event) => {
        console.log('🔌 WebSocket connection closed:', connectionId);
        this.connections.delete(connectionId);
      });

      this.connections.set(connectionId, ws);
      return ws;
    } catch (error) {
      console.log('🔌 WebSocket creation error suppressed:', error.message);
      return null;
    }
  }

  closeAll() {
    this.connections.forEach((ws, id) => {
      try {
        ws.close();
      } catch (error) {
        console.log('🔌 WebSocket close error suppressed:', id);
      }
    });
    this.connections.clear();
  }
}

const webSocketManager = new WebSocketManager();

// Suppress WebSocket errors globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔌 WebSocket error suppression active');
  
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends originalWebSocket {
    constructor(url, protocols) {
      super(url, protocols);
      
      this.addEventListener('error', (event) => {
        // Suppress development WebSocket errors
        event.preventDefault();
        event.stopPropagation();
      });
    }
  };
}

export default webSocketManager;