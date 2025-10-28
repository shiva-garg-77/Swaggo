import TokenService from '../Services/TokenService.js';
import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';
import socketRateLimiter from './RateLimiter.js';
import crypto from 'crypto';

/**
 * 🚀 SIMPLIFIED SOCKET.IO AUTHENTICATION MIDDLEWARE
 * 
 * Addresses Issue #42: Socket Connection Improvements
 * 
 * Features:
 * - Simplified authentication with single token source
 * - Clean heartbeat management
 * - Efficient room membership tracking
 * - Offline message persistence
 */

class SimplifiedSocketAuth {
  
  constructor() {
    // Authenticated sockets tracking
    this.authenticatedSockets = new Map(); // socketId -> authData
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.socketRooms = new Map(); // socketId -> Set of roomIds
    this.offlineMessages = new Map(); // userId -> [messages]
    
    // Heartbeat management
    this.heartbeats = new Map(); // socketId -> intervalId
    this.heartbeatInterval = 25000; // 25 seconds
    
    // Connection limits
    this.maxSocketsPerUser = 5;
    this.maxSocketsPerIP = 10;
    
    // Initialize cleanup
    this.initializeCleanup();
  }
  
  /**
   * Simplified socket authentication
   */
  authenticate = async (socket, next) => {
    try {
      console.log(`🔌 Simplified Auth: New connection attempt: ${socket.id}`);
      console.log('📋 Handshake details:', {
        hasCookies: !!socket.handshake.headers.cookie,
        cookieLength: socket.handshake.headers.cookie?.length,
        hasAuth: !!socket.handshake.auth,
        authKeys: Object.keys(socket.handshake.auth || {}),
        origin: socket.handshake.headers.origin,
        referer: socket.handshake.headers.referer
      });
      
      // Log cookie string (truncated for security)
      if (socket.handshake.headers.cookie) {
        const cookiePreview = socket.handshake.headers.cookie.substring(0, 200);
        console.log('🍪 Cookies received (preview):', cookiePreview + '...');
      } else {
        console.log('⚠️ No cookies in handshake headers');
      }
      
      // Extract tokens - simplified approach
      const tokens = this.extractTokens(socket);
      
      if (!tokens.accessToken) {
        console.log('❌ No access token found - authentication failed');
        console.log('🔍 Debug: Check if cookies are being sent from frontend');
        return next(new Error('Authentication required'));
      }
      
      console.log('✅ Access token extracted successfully (length: ' + tokens.accessToken.length + ')');
      
      
      // Verify token
      const tokenContext = {
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      };
      
      const tokenResult = await TokenService.verifyAccessToken(tokens.accessToken, tokenContext);
      
      if (!tokenResult.valid) {
        console.log('❌ Invalid access token');
        return next(new Error('Invalid authentication token'));
      }
      
      // Get user and profile
      const user = await User.findOne({ id: tokenResult.user.id });
      const profile = await Profile.findOne({ username: user.username.toLowerCase() });
      
      if (!user || !profile) {
        console.log('❌ User or profile not found');
        return next(new Error('User data not found'));
      }
      
      // Check connection limits
      const connectionCheck = this.checkConnectionLimits(socket, user.id);
      if (!connectionCheck.allowed) {
        console.log(`❌ Connection limit exceeded: ${connectionCheck.reason}`);
        return next(new Error(connectionCheck.reason));
      }
      
      // Attach user data to socket
      socket.user = {
        id: user.id,
        profileid: profile.profileid,
        username: user.username
      };
      
      socket.isAuthenticated = true;
      
      // Track authenticated socket
      this.trackSocket(socket, user.id, profile.profileid);
      
      console.log(`✅ Socket authenticated: ${socket.id} - User: ${user.username}`);
      next();
      
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  };
  
  /**
   * Extract tokens from socket handshake - simplified approach
   */
  extractTokens(socket) {
    // PRIORITY 1: Try cookies (most secure for browser clients)
    if (socket.handshake.headers.cookie) {
      const accessToken = this.extractTokenFromCookies(socket.handshake.headers.cookie);
      if (accessToken) {
        console.log('✅ Access token found in cookies');
        return { accessToken };
      }
    }
    
    // PRIORITY 2: Try auth object
    if (socket.handshake.auth && socket.handshake.auth.accessToken) {
      console.log('✅ Access token found in auth object');
      return { accessToken: socket.handshake.auth.accessToken };
    }
    
    // PRIORITY 3: Try query parameters
    if (socket.handshake.query && socket.handshake.query.accessToken) {
      console.log('✅ Access token found in query');
      return { accessToken: socket.handshake.query.accessToken };
    }
    
    // PRIORITY 4: Try Authorization header
    if (socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        console.log('✅ Access token found in Authorization header');
        return { accessToken: authHeader.substring(7) };
      }
    }
    
    console.log('❌ No access token found in any source');
    return { accessToken: null };
  }
  
  /**
   * Extract access token from cookie string
   */
  extractTokenFromCookies(cookieString) {
    const tokenCookieNames = [
      '__Host-accessToken',
      '__Secure-accessToken',
      'accessToken'
    ];
    
    for (const cookieName of tokenCookieNames) {
      // Escape special regex characters in cookie name
      const escapedName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|; )${escapedName}=([^;]*)`);
      const match = cookieString.match(regex);
      
      if (match && match[1]) {
        try {
          const token = decodeURIComponent(match[1]);
          if (token && token !== 'undefined' && token.length >= 16) {
            console.log(`✅ Found valid access token in cookie: ${cookieName}`);
            return token;
          }
        } catch (e) {
          console.warn(`Failed to decode token from cookie ${cookieName}:`, e);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Track authenticated socket
   */
  trackSocket(socket, userId, profileId) {
    // Track socket
    this.authenticatedSockets.set(socket.id, {
      userId,
      profileId,
      username: socket.user.username,
      connectedAt: new Date(),
      lastActivity: new Date()
    });
    
    // Track user sockets
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);
    
    // Setup heartbeat
    this.setupHeartbeat(socket);
    
    // Setup disconnect handler
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }
  
  /**
   * Setup simplified heartbeat
   */
  setupHeartbeat(socket) {
    // Clear existing heartbeat if any
    this.clearHeartbeat(socket.id);
    
    // Setup new heartbeat
    const intervalId = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', Date.now());
      }
    }, this.heartbeatInterval);
    
    this.heartbeats.set(socket.id, intervalId);
  }
  
  /**
   * Clear heartbeat for socket
   */
  clearHeartbeat(socketId) {
    const intervalId = this.heartbeats.get(socketId);
    if (intervalId) {
      clearInterval(intervalId);
      this.heartbeats.delete(socketId);
    }
  }
  
  /**
   * Handle socket disconnect
   */
  handleDisconnect(socket) {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    
    // Clear heartbeat
    this.clearHeartbeat(socket.id);
    
    // Remove from authenticated sockets
    const authData = this.authenticatedSockets.get(socket.id);
    if (authData) {
      // Remove from user sockets
      const userSockets = this.userSockets.get(authData.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(authData.userId);
        }
      }
      
      this.authenticatedSockets.delete(socket.id);
    }
    
    // Remove from rooms
    this.socketRooms.delete(socket.id);
  }
  
  /**
   * Check connection limits
   */
  checkConnectionLimits(socket, userId) {
    const ipAddress = socket.handshake.address;
    
    // Check IP limit
    let ipConnections = 0;
    for (const [socketId, authData] of this.authenticatedSockets) {
      if (authData.ipAddress === ipAddress) {
        ipConnections++;
      }
    }
    
    if (ipConnections >= this.maxSocketsPerIP) {
      return {
        allowed: false,
        reason: `Too many connections from IP (${ipConnections}/${this.maxSocketsPerIP})`
      };
    }
    
    // Check user limit
    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size >= this.maxSocketsPerUser) {
      return {
        allowed: false,
        reason: `Too many connections for user (${userSockets.size}/${this.maxSocketsPerUser})`
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Join room with simplified tracking
   */
  joinRoom(socket, roomId) {
    socket.join(roomId);
    
    // Track room membership
    if (!this.socketRooms.has(socket.id)) {
      this.socketRooms.set(socket.id, new Set());
    }
    this.socketRooms.get(socket.id).add(roomId);
  }
  
  /**
   * Leave room with simplified tracking
   */
  leaveRoom(socket, roomId) {
    socket.leave(roomId);
    
    // Update room tracking
    const rooms = this.socketRooms.get(socket.id);
    if (rooms) {
      rooms.delete(roomId);
      if (rooms.size === 0) {
        this.socketRooms.delete(socket.id);
      }
    }
  }
  
  /**
   * Get user's active sockets
   */
  getUserSockets(userId) {
    const socketIds = this.userSockets.get(userId) || new Set();
    return Array.from(socketIds);
  }
  
  /**
   * Queue offline message
   */
  queueOfflineMessage(userId, message) {
    if (!this.offlineMessages.has(userId)) {
      this.offlineMessages.set(userId, []);
    }
    
    this.offlineMessages.get(userId).push({
      message,
      queuedAt: new Date()
    });
    
    // Limit offline messages per user
    if (this.offlineMessages.get(userId).length > 50) {
      this.offlineMessages.get(userId).shift();
    }
  }
  
  /**
   * Get and clear offline messages for user
   */
  getOfflineMessages(userId) {
    const messages = this.offlineMessages.get(userId) || [];
    this.offlineMessages.delete(userId);
    return messages;
  }
  
  /**
   * Initialize cleanup intervals
   */
  initializeCleanup() {
    // Clean up every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }
  
  /**
   * Cleanup old data
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean old offline messages
    for (const [userId, messages] of this.offlineMessages) {
      const filtered = messages.filter(msg => 
        now - new Date(msg.queuedAt).getTime() < maxAge
      );
      
      if (filtered.length === 0) {
        this.offlineMessages.delete(userId);
      } else {
        this.offlineMessages.set(userId, filtered);
      }
    }
  }
  
  /**
   * Shutdown and cleanup all intervals
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear all heartbeats
    for (const [socketId, intervalId] of this.heartbeats) {
      clearInterval(intervalId);
    }
    this.heartbeats.clear();
  }
  
  /**
   * Get authentication statistics
   */
  getStats() {
    return {
      authenticatedSockets: this.authenticatedSockets.size,
      usersOnline: this.userSockets.size,
      roomsTracked: this.socketRooms.size,
      offlineMessages: Array.from(this.offlineMessages.values()).reduce((sum, msgs) => sum + msgs.length, 0)
    };
  }
}

export default new SimplifiedSocketAuth();