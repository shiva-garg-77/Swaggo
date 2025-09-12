'use client';

import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token = 'demo_token') {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:45799';
    
    console.log('🔌 Connecting to Socket.io server:', serverUrl);
    console.log('🔑 Using token:', token ? 'Token provided' : 'No token');

    this.socket = io(serverUrl, {
      auth: {
        token: token || 'demo_token_for_testing'
      },
      transports: ['polling', 'websocket'], // Try polling first
      timeout: 20000,
      forceNew: false, // Allow reconnection
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected successfully!');
      console.log('Socket ID:', this.socket.id);
      console.log('Server URL:', serverUrl);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket.io connection error:');
      console.error('Error details:', error);
      console.error('Attempted server URL:', serverUrl);
      console.error('Auth token provided:', !!token);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🔥 Socket.io general error:', error);
    });
    
    // Add connection attempt logging
    console.log('🔌 Attempting Socket.io connection...');
    console.log('Server URL:', serverUrl);
    console.log('Auth token:', token ? 'Provided' : 'Missing');

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.io');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.socket && this.socket.connected && this.isConnected;
  }
}

// Export singleton instance
const socketClient = new SocketClient();
export default socketClient;
