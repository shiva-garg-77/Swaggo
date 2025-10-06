import TokenService from '../Services/TokenService.js';
import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';
import SecurityConfig from '../Config/SecurityConfig.js';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import socketRateLimiter from './RateLimiter.js';

/**
 * 🛡️ 10/10 SECURE SOCKET.IO AUTHENTICATION MIDDLEWARE
 * 
 * Features:
 * - Automatic authentication on socket connection
 * - Token refresh during socket operations
 * - Device fingerprinting and binding
 * - Rate limiting for socket events
 * - Real-time security monitoring
 * - Session management and cleanup
 */

class SocketAuthMiddleware {
  
  constructor() {
    // Authenticated sockets tracking
    this.authenticatedSockets = new Map(); // socketId -> authData
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.securityEvents = new Map();
    
    // Socket operation rate limiting
    this.operationLimits = new Map();
    
    // Heartbeat and health monitoring
    this.heartbeatInterval = 30000; // 30 seconds
    this.healthChecks = new Map();
    
    // Device fingerprint caching to reduce recalculation
    this.deviceFingerprintCache = new Map(); // key -> {fingerprint, timestamp}
    this.fingerprintCacheTTL = 60 * 60 * 1000; // 1 hour
    
    // Connection limits to prevent flooding
    this.maxSocketsPerUser = 10; // Maximum sockets per user
    this.maxTotalSockets = 500;  // Maximum total authenticated sockets
    
    // Initialize cleanup
    this.initializeCleanup();
  }
  
  /**
   * Socket authentication middleware - runs on connection
   */
  authenticate = async (socket, next) => {
    try {
      console.log(`🔌 SOCKET AUTH: New connection attempt: ${socket.id} from ${socket.handshake.address}`);
      
      // Extract authentication context
      const authContext = this.extractSocketAuthContext(socket);
      
      // Check rate limiting for socket connections
      const rateLimitResult = socketRateLimiter.isRateLimited(null, authContext.ipAddress, 'connect');
      if (rateLimitResult.limited) {
        this.logSecurityEvent('connection_rate_limited', {
          socketId: socket.id,
          ipAddress: authContext.ipAddress,
          retryAfter: rateLimitResult.retryAfter
        });
        
        return next(new Error(`Connection rate limited. Retry after ${rateLimitResult.retryAfter} seconds.`));
      }
      
      // Check connection limits before authenticating
      const connectionCheck = this.checkConnectionLimits(socket, authContext);
      if (!connectionCheck.allowed) {
        this.logSecurityEvent('connection_limit_exceeded', {
          socketId: socket.id,
          ipAddress: authContext.ipAddress,
          reason: connectionCheck.reason,
          currentConnections: connectionCheck.currentConnections
        });
        
        return next(new Error(`Connection limit exceeded: ${connectionCheck.reason}`));
      }
      
      // Try to authenticate
      const authResult = await this.authenticateSocket(socket, authContext);
      
      if (!authResult.valid) {
        // CRITICAL SECURITY FIX: Reject ALL unauthenticated connections
        // No anonymous connections allowed for security
        console.log(`❌ SECURITY: Rejecting unauthenticated socket connection: ${socket.id} - ${authResult.reason}`);
        
        // Enhanced security logging
        this.logSecurityEvent('socket_auth_rejected', {
          socketId: socket.id,
          reason: authResult.reason,
          ipAddress: authContext.ipAddress,
          timestamp: new Date().toISOString(),
          severity: 'HIGH'
        });
        
        // Implement progressive blocking for repeated failures
        const failureCount = this.trackAuthFailure(authContext.ipAddress);
        if (failureCount > 5) {
          this.logSecurityEvent('socket_auth_brute_force', {
            ipAddress: authContext.ipAddress,
            failureCount,
            severity: 'CRITICAL'
          });
          
          // Block IP temporarily
          socketRateLimiter.blockIP(authContext.ipAddress, 300); // 5 minutes
          return next(new Error('IP temporarily blocked due to repeated authentication failures'));
        }
        
        return next(new Error(`Authentication required: ${authResult.reason}`));
      }
      
      // Successful authentication
      console.log(`✅ Socket authenticated: ${socket.id} - User: ${authResult.user.username}`);
      
      // Attach authentication data to socket
      socket.isAuthenticated = true;
      socket.isAnonymous = false;
      
      // CRITICAL FIX: Merge user and profile data for SocketController compatibility
      // socket.user must have profileid for chat participant checks
      socket.user = {
        ...authResult.user.toObject ? authResult.user.toObject() : authResult.user,
        profileid: authResult.profile?.profileid || null, // Add profileid from Profile model
        username: authResult.user.username,
        id: authResult.user.id
      };
      socket.profile = authResult.profile;
      socket.authContext = authContext;
      socket.riskScore = authResult.riskScore || 0;
      socket.deviceTrusted = authResult.deviceTrusted || false;
      
      // CRITICAL FIX: Set expected properties for SocketController compatibility
      socket.userId = authResult.profile?.profileid || authResult.user.id;
      socket.username = authResult.user.username;
      socket.role = authResult.user.permissions?.role || 'user';
      socket.deviceId = authContext.deviceFingerprint;
      socket.sessionId = crypto.randomUUID();
      socket.mfaVerified = authResult.user.mfaEnabled || false;
      
      console.log('✅ Socket user data set:', {
        userId: socket.userId,
        profileid: socket.user.profileid,
        username: socket.username,
        hasProfile: !!authResult.profile
      });
      
      // Track authenticated socket
      this.authenticatedSockets.set(socket.id, {
        userId: authResult.user.id,
        profileId: authResult.profile?.profileid,
        username: authResult.user.username,
        connectedAt: new Date(),
        lastActivity: new Date(),
        riskScore: authResult.riskScore,
        deviceFingerprint: authContext.deviceFingerprint,
        ipAddress: authContext.ipAddress,
        location: authContext.location
      });
      
      // Track user sockets
      if (!this.userSockets.has(authResult.user.id)) {
        this.userSockets.set(authResult.user.id, new Set());
      }
      this.userSockets.get(authResult.user.id).add(socket.id);
      
      // Set up authenticated session
      this.setupAuthenticatedSession(socket, authResult);
      
      // Log successful authentication
      this.logSecurityEvent('socket_authenticated', {
        socketId: socket.id,
        userId: authResult.user.id,
        username: authResult.user.username,
        ipAddress: authContext.ipAddress,
        riskScore: authResult.riskScore,
        deviceTrusted: authResult.deviceTrusted
      });
      
      next();
      
    } catch (error) {
      console.error('Socket authentication error:', error);
      
      this.logSecurityEvent('socket_auth_error', {
        socketId: socket.id,
        error: error.message,
        ipAddress: socket.handshake.address
      });
      
      next(new Error('Authentication failed'));
    }
  };
  
  /**
   * Authenticate socket using tokens from handshake
   */
  async authenticateSocket(socket, authContext) {
    try {
      // Extract tokens from handshake auth or cookies
      const tokens = this.extractSocketTokens(socket);
      
      console.log('🔐 SOCKET AUTH: Token extraction result:', {
        hasAccessToken: !!tokens.accessToken,
        accessTokenLength: tokens.accessToken?.length || 0,
        hasRefreshToken: !!tokens.refreshToken,
        socketId: socket.id,
        ipAddress: authContext.ipAddress
      });
      
      if (!tokens.accessToken && !tokens.refreshToken) {
        console.log('❌ No authentication tokens found in socket handshake');
        return { valid: false, reason: 'no_authentication_tokens' };
      }
      
      let authResult = null;
      
      // Try access token first
      if (tokens.accessToken) {
        const tokenContext = {
          ipAddress: authContext.ipAddress,
          userAgent: authContext.userAgent,
          deviceHash: authContext.deviceFingerprint
        };
        
        const accessResult = await TokenService.verifyAccessToken(tokens.accessToken, tokenContext);
        
        if (accessResult.valid) {
          // Get fresh user and profile data
          const user = await User.findOne({ id: accessResult.user.id });
          const profile = await Profile.findOne({ username: user.username.toLowerCase() });
          
          if (!user || user.isAccountLocked()) {
            return { valid: false, reason: 'user_inactive' };
          }
          
          return {
            valid: true,
            user,
            profile,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            riskScore: accessResult.security?.riskScore || 0,
            deviceTrusted: user.isDeviceTrusted(authContext.deviceFingerprint, authContext.deviceFingerprint),
            expiresAt: accessResult.expiresAt
          };
        }
        
        // If access token expired, try refresh
        if (accessResult.reason === 'token_expired' && tokens.refreshToken) {
          const refreshResult = await this.performSocketTokenRefresh(tokens.refreshToken, authContext);
          if (refreshResult.valid) {
            return refreshResult;
          }
        }
      }
      
      // If only refresh token, try to refresh
      if (tokens.refreshToken && !tokens.accessToken) {
        return await this.performSocketTokenRefresh(tokens.refreshToken, authContext);
      }
      
      return { valid: false, reason: 'authentication_failed' };
      
    } catch (error) {
      console.error('Socket authentication failed:', error);
      return { valid: false, reason: 'auth_error', error: error.message };
    }
  }
  
  /**
   * Perform token refresh for socket connection
   */
  async performSocketTokenRefresh(refreshToken, authContext) {
    try {
      const context = {
        ipAddress: authContext.ipAddress,
        userAgent: authContext.userAgent,
        deviceHash: authContext.deviceFingerprint,
        sessionId: crypto.randomUUID()
      };
      
      const refreshResult = await TokenService.refreshTokens(refreshToken, context);
      
      if (refreshResult.valid) {
        const user = await User.findOne({ id: refreshResult.user.id });
        const profile = await Profile.findOne({ username: user.username.toLowerCase() });
        
        return {
          valid: true,
          user,
          profile,
          accessToken: refreshResult.accessToken.token,
          refreshToken: refreshResult.refreshToken.token,
          riskScore: refreshResult.metadata.riskScore,
          deviceTrusted: user?.isDeviceTrusted(authContext.deviceFingerprint, authContext.deviceFingerprint) || false,
          expiresAt: refreshResult.accessToken.expiresAt,
          refreshed: true
        };
      }
      
      return { valid: false, reason: refreshResult.reason };
      
    } catch (error) {
      console.error('Socket token refresh failed:', error);
      return { valid: false, reason: 'refresh_error' };
    }
  }
  
  /**
   * Socket event authentication middleware
   */
  requireAuth = (eventHandler) => {
    return async (socket, data, callback) => {
      try {
        if (!socket.isAuthenticated) {
          const error = { 
            error: 'authentication_required',
            message: 'Authentication required for this operation'
          };
          
          if (callback) {
            callback(error);
          } else {
            setImmediate(() => {
              try {
                if (socket && socket.connected) {
                  socket.emit('error', error);
                }
              } catch (emitError) {
                console.error('Failed to emit auth error:', emitError.message);
              }
            });
          }
          return;
        }
        
        // Check if token needs refresh
        const now = Date.now();
        const expiresAt = socket.tokens?.expiresAt ? new Date(socket.tokens.expiresAt).getTime() : 0;
        
        // Refresh if token expires in next 5 minutes
        if (expiresAt && (expiresAt - now) < 5 * 60 * 1000) {
          const refreshResult = await this.refreshSocketTokens(socket);
          if (!refreshResult.success) {
            const error = { 
              error: 'token_refresh_failed',
              message: 'Session expired. Please log in again.'
            };
            
            if (callback) {
              callback(error);
            } else {
              setImmediate(() => {
                try {
                  if (socket && socket.connected) {
                    socket.emit('auth_required', error);
                  }
                } catch (emitError) {
                  console.error('Failed to emit auth_required:', emitError.message);
                }
              });
            }
            return;
          }
        }
        
        // Update last activity
        this.updateSocketActivity(socket);
        
        // Execute the actual event handler
        await eventHandler(socket, data, callback);
        
      } catch (error) {
        console.error('Socket event auth middleware error:', error);
        
        const errorResponse = { 
          error: 'operation_failed',
          message: 'Operation failed due to authentication error'
        };
        
        // Use setImmediate to avoid recursion issues with socket.emit
        if (callback) {
          callback(errorResponse);
        } else {
          setImmediate(() => {
            try {
              if (socket && socket.connected) {
                socket.emit('error', errorResponse);
              }
            } catch (emitError) {
              console.error('Failed to emit error:', emitError.message);
            }
          });
        }
      }
    };
  };
  
  /**
   * Rate limiting middleware for socket events
   */
  requireRateLimit = (action) => {
    return (eventHandler) => {
      return async (socket, data, callback) => {
        try {
          const userId = socket.user?.id;
          const ipAddress = socket.authContext?.ipAddress;
          
          // Check rate limit
          const rateLimitResult = socketRateLimiter.isRateLimited(userId, ipAddress, action);
          
          if (rateLimitResult.limited) {
            this.logSecurityEvent('socket_rate_limited', {
              socketId: socket.id,
              userId,
              action,
              ipAddress,
              retryAfter: rateLimitResult.retryAfter
            });
            
            const error = { 
              error: 'rate_limited',
              message: `Too many ${action} operations. Try again in ${rateLimitResult.retryAfter} seconds.`,
              retryAfter: rateLimitResult.retryAfter
            };
            
            if (callback) {
              callback(error);
            } else {
              setImmediate(() => {
                try {
                  if (socket && socket.connected) {
                    socket.emit('rate_limited', error);
                  }
                } catch (emitError) {
                  console.error('Failed to emit rate_limited:', emitError.message);
                }
              });
            }
            return;
          }
          
          // Execute the event handler
          await eventHandler(socket, data, callback);
          
        } catch (error) {
          console.error('Socket rate limit middleware error:', error);
          
          const errorResponse = { 
            error: 'operation_failed',
            message: 'Operation failed due to rate limiting error'
          };
          
          if (callback) {
            callback(errorResponse);
          } else {
            setImmediate(() => {
              try {
                if (socket && socket.connected) {
                  socket.emit('error', errorResponse);
                }
              } catch (emitError) {
                console.error('Failed to emit rate limit error:', emitError.message);
              }
            });
          }
        }
      };
    };
  };
  
  /**
   * Role-based authorization middleware for socket events
   */
  requireRole = (roles) => {
    return (eventHandler) => {
      return async (socket, data, callback) => {
        try {
          if (!socket.isAuthenticated || !socket.user) {
            const error = { 
              error: 'authentication_required',
              message: 'Authentication required for this operation'
            };
            
            if (callback) {
              callback(error);
            } else {
              setImmediate(() => {
                try {
                  if (socket && socket.connected) {
                    socket.emit('error', error);
                  }
                } catch (emitError) {
                  console.error('Failed to emit role auth error:', emitError.message);
                }
              });
            }
            return;
          }
          
          const userRole = socket.user.permissions?.role || 'user';
          const allowedRoles = Array.isArray(roles) ? roles : [roles];
          
          if (!allowedRoles.includes(userRole)) {
            this.logSecurityEvent('socket_unauthorized_role', {
              socketId: socket.id,
              userId: socket.user.id,
              userRole,
              requiredRoles: allowedRoles,
              ipAddress: socket.authContext.ipAddress
            });
            
            const error = { 
              error: 'insufficient_permissions',
              message: 'Insufficient permissions for this operation'
            };
            
            if (callback) {
              callback(error);
            } else {
              setImmediate(() => {
                try {
                  if (socket && socket.connected) {
                    socket.emit('error', error);
                  }
                } catch (emitError) {
                  console.error('Failed to emit insufficient permissions error:', emitError.message);
                }
              });
            }
            return;
          }
          
          // Execute the event handler
          await eventHandler(socket, data, callback);
          
        } catch (error) {
          console.error('Socket role middleware error:', error);
          
          const errorResponse = { 
            error: 'authorization_failed',
            message: 'Authorization failed'
          };
          
          if (callback) {
            callback(errorResponse);
          } else {
            setImmediate(() => {
              try {
                if (socket && socket.connected) {
                  socket.emit('error', errorResponse);
                }
              } catch (emitError) {
                console.error('Failed to emit authorization error:', emitError.message);
              }
            });
          }
        }
      };
    };
  };
  
  /**
   * Setup authenticated session with heartbeat and monitoring
   */
  setupAuthenticatedSession(socket, authResult) {
    // Emit successful authentication
    socket.emit('authenticated', {
      user: authResult.user.toSafeObject(),
      profile: authResult.profile ? {
        profileid: authResult.profile.profileid,
        username: authResult.profile.username,
        displayname: authResult.profile.displayname,
        avatar: authResult.profile.avatar
      } : null,
      security: {
        riskScore: authResult.riskScore,
        deviceTrusted: authResult.deviceTrusted,
        deviceFingerprint: socket.authContext.deviceFingerprint
      },
      session: {
        connectedAt: new Date(),
        expiresAt: authResult.expiresAt
      }
    });
    
    // Set up heartbeat
    this.setupSocketHeartbeat(socket);
    
    // Update user online status
    this.updateUserOnlineStatus(authResult.user.id, true, socket.id);
  }
  
  /**
   * Setup anonymous session with limited functionality
   */
  setupAnonymousSession(socket, authContext) {
    socket.emit('anonymous_session', {
      sessionId: crypto.randomUUID(),
      security: {
        riskScore: 50,
        ipAddress: authContext.ipAddress,
        location: authContext.location
      },
      limitations: [
        'Cannot send messages',
        'Cannot make calls', 
        'Limited to read-only operations',
        'Session expires in 1 hour'
      ]
    });
    
    // Set up limited heartbeat
    this.setupSocketHeartbeat(socket, true);
  }
  
  /**
   * Setup socket heartbeat for connection health monitoring
   */
  setupSocketHeartbeat(socket, anonymous = false) {
    const interval = anonymous ? 60000 : this.heartbeatInterval; // 1 minute for anonymous, 30s for authenticated
    
    socket.heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { timestamp: new Date() });
      
      // Track health
      this.healthChecks.set(socket.id, {
        lastHeartbeat: new Date(),
        responseTime: null,
        missedBeats: 0
      });
    }, interval);
    
    // Handle heartbeat response
    socket.on('heartbeat_response', (data) => {
      const health = this.healthChecks.get(socket.id);
      if (health) {
        health.responseTime = Date.now() - new Date(data.timestamp).getTime();
        health.missedBeats = 0;
        health.lastResponse = new Date();
      }
    });
  }
  
  /**
   * Refresh socket tokens
   */
  async refreshSocketTokens(socket) {
    try {
      if (!socket.tokens?.refreshToken) {
        return { success: false, reason: 'no_refresh_token' };
      }
      
      const refreshResult = await this.performSocketTokenRefresh(
        socket.tokens.refreshToken,
        socket.authContext
      );
      
      if (refreshResult.valid) {
        // Update socket tokens
        socket.tokens = {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
          expiresAt: refreshResult.expiresAt
        };
        
        // Emit token refresh notification
        socket.emit('tokens_refreshed', {
          expiresAt: refreshResult.expiresAt,
          refreshed: true
        });
        
        console.log(`🔄 Socket tokens refreshed: ${socket.id} - User: ${socket.user.username}`);
        
        return { success: true };
      }
      
      return { success: false, reason: refreshResult.reason };
      
    } catch (error) {
      console.error('Socket token refresh error:', error);
      return { success: false, reason: 'refresh_error' };
    }
  }
  
  /**
   * Update socket activity timestamp
   */
  updateSocketActivity(socket) {
    const authData = this.authenticatedSockets.get(socket.id);
    if (authData) {
      authData.lastActivity = new Date();
    }
  }
  
  /**
   * Update user online status
   */
  async updateUserOnlineStatus(userId, online, socketId = null) {
    try {
      const profile = await Profile.findOne({ userid: userId });
      if (profile) {
        profile.isonline = online;
        profile.lastseen = new Date();
        if (socketId) {
          profile.lastActiveSocket = socketId;
        }
        await profile.save();
      }
    } catch (error) {
      console.error('Failed to update user online status:', error);
    }
  }
  
  /**
   * Handle socket disconnection cleanup
   */
  handleDisconnection = (socket) => {
    console.log(`🔌 Socket disconnecting: ${socket.id}`);
    
    try {
      // Clean up authenticated sockets tracking
      const authData = this.authenticatedSockets.get(socket.id);
      if (authData) {
        // Remove from user sockets
        const userSocketSet = this.userSockets.get(authData.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            // User has no more active sockets, mark offline
            this.updateUserOnlineStatus(authData.userId, false);
            this.userSockets.delete(authData.userId);
          }
        }
        
        this.authenticatedSockets.delete(socket.id);
      }
      
      // Clean up health checks
      this.healthChecks.delete(socket.id);
      
      // Clear heartbeat interval
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
      }
      
      // Log disconnection
      this.logSecurityEvent('socket_disconnected', {
        socketId: socket.id,
        userId: authData?.userId,
        username: authData?.username,
        connectedDuration: authData ? Date.now() - authData.connectedAt.getTime() : 0
      });
      
    } catch (error) {
      console.error('Socket disconnection cleanup error:', error);
    }
  };
  
  /**
   * Extract socket authentication context
   */
  extractSocketAuthContext(socket) {
    const ipAddress = socket.handshake.address || socket.conn.remoteAddress || '127.0.0.1';
    const userAgent = socket.handshake.headers['user-agent'] || 'unknown';
    const deviceFingerprint = this.generateSocketDeviceFingerprint(socket);
    
    // Parse User-Agent
    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();
    
    // Get geolocation
    const geoInfo = geoip.lookup(ipAddress);
    
    return {
      ipAddress,
      userAgent,
      deviceFingerprint,
      deviceInfo: {
        browser: uaResult.browser.name || 'unknown',
        browserVersion: uaResult.browser.version || 'unknown',
        os: uaResult.os.name || 'unknown',
        osVersion: uaResult.os.version || 'unknown',
        device: uaResult.device.type || 'desktop'
      },
      location: geoInfo ? {
        country: geoInfo.country,
        region: geoInfo.region,
        city: geoInfo.city,
        timezone: geoInfo.timezone
      } : null,
      headers: socket.handshake.headers,
      timestamp: new Date()
    };
  }
  
  /**
   * FIXED: Extract tokens from socket handshake with comprehensive fallback strategy
   * Addresses Issue #2: Cookie Parsing Failure in Socket Handshake
   */
  extractSocketTokens(socket) {
    // Only log occasionally to reduce spam
    if (Math.random() < 0.1) { // Log only 10% of requests
      console.log('🔍 Extracting tokens from socket handshake...', {
        hasAuth: !!socket.handshake.auth,
        hasCookieHeader: !!socket.handshake.headers.cookie,
        authKeys: socket.handshake.auth ? Object.keys(socket.handshake.auth) : [],
        cookieHeaderLength: socket.handshake.headers.cookie ? socket.handshake.headers.cookie.length : 0,
        hasQuery: !!socket.handshake.query,
        queryKeys: socket.handshake.query ? Object.keys(socket.handshake.query) : []
      });
    }
    
    let accessToken = null;
    let refreshToken = null;
    
    // Strategy 1: Try auth object first (from client auth data)
    if (socket.handshake.auth) {
      console.log('🔐 Checking auth object for tokens...');
      
      // Support multiple auth object formats
      accessToken = socket.handshake.auth.accessToken || 
                   socket.handshake.auth.access_token ||
                   socket.handshake.auth.token;
      
      refreshToken = socket.handshake.auth.refreshToken || 
                    socket.handshake.auth.refresh_token;
      
      console.log('🔐 Auth object tokens:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenPrefix: accessToken ? accessToken.substring(0, 15) + '...' : null,
        refreshTokenPrefix: refreshToken ? refreshToken.substring(0, 15) + '...' : null
      });
    }
    
    // Strategy 2: Try query parameters if no tokens from auth object
    if ((!accessToken || !refreshToken) && socket.handshake.query) {
      console.log('🔗 Checking query parameters for tokens...');
      
      if (!accessToken) {
        accessToken = socket.handshake.query.accessToken || 
                     socket.handshake.query.access_token ||
                     socket.handshake.query.token;
        if (accessToken) console.log('✅ Found access token in query parameters');
      }
      
      if (!refreshToken) {
        refreshToken = socket.handshake.query.refreshToken || 
                      socket.handshake.query.refresh_token;
        if (refreshToken) console.log('✅ Found refresh token in query parameters');
      }
    }
    
    // Strategy 3: Try cookies from headers with enhanced parsing
    if ((!accessToken || !refreshToken) && socket.handshake.headers.cookie) {
      console.log('🍪 Checking cookies for tokens...');
      
      const cookieString = socket.handshake.headers.cookie;
      const parsedCookies = this.parseCookies(cookieString);
      
      // Try different cookie names in order of preference
      const accessTokenNames = ['__Host-accessToken', '__Secure-accessToken', 'accessToken', 'access_token', 'jwt', 'authToken'];
      const refreshTokenNames = ['__Host-refreshToken', '__Secure-refreshToken', 'refreshToken', 'refresh_token', 'refreshJWT'];
      
      if (!accessToken) {
        for (const tokenName of accessTokenNames) {
          if (parsedCookies[tokenName]) {
            accessToken = parsedCookies[tokenName];
            console.log(`✅ Found access token in cookie: ${tokenName}`);
            break;
          }
        }
      }
      
      if (!refreshToken) {
        for (const tokenName of refreshTokenNames) {
          if (parsedCookies[tokenName]) {
            refreshToken = parsedCookies[tokenName];
            console.log(`✅ Found refresh token in cookie: ${tokenName}`);
            break;
          }
        }
      }
    }
    
    // Strategy 4: Try Authorization header as fallback
    if (!accessToken && socket.handshake.headers.authorization) {
      console.log('🔑 Checking Authorization header...');
      const authHeader = socket.handshake.headers.authorization;
      
      if (authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
        console.log('✅ Found access token in Authorization header');
      } else if (authHeader.startsWith('JWT ')) {
        accessToken = authHeader.substring(4);
        console.log('✅ Found JWT token in Authorization header');
      }
    }
    
    // Validation and sanitization
    if (accessToken) {
      accessToken = accessToken.trim();
      if (accessToken === 'null' || accessToken === 'undefined' || accessToken === '') {
        accessToken = null;
        console.warn('⚠️ Invalid access token value detected, setting to null');
      }
    }
    
    if (refreshToken) {
      refreshToken = refreshToken.trim();
      if (refreshToken === 'null' || refreshToken === 'undefined' || refreshToken === '') {
        refreshToken = null;
        console.warn('⚠️ Invalid refresh token value detected, setting to null');
      }
    }
    
    const result = { accessToken, refreshToken };
    
    console.log('🏁 Token extraction result:', {
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken,
      accessTokenSource: this.getTokenSource(result.accessToken, socket, 'accessToken'),
      refreshTokenSource: this.getTokenSource(result.refreshToken, socket, 'refreshToken'),
      tokenLengths: {
        accessToken: result.accessToken ? result.accessToken.length : 0,
        refreshToken: result.refreshToken ? result.refreshToken.length : 0
      }
    });
    
    return result;
  }
  
  /**
   * Get token source for debugging
   */
  getTokenSource(token, socket, tokenType) {
    if (!token) return 'none';
    
    // Check auth object
    if (socket.handshake.auth) {
      const authTokens = {
        accessToken: socket.handshake.auth.accessToken || socket.handshake.auth.access_token || socket.handshake.auth.token,
        refreshToken: socket.handshake.auth.refreshToken || socket.handshake.auth.refresh_token
      };
      
      if (tokenType === 'accessToken' && authTokens.accessToken === token) return 'auth-object';
      if (tokenType === 'refreshToken' && authTokens.refreshToken === token) return 'auth-object';
    }
    
    // Check query parameters
    if (socket.handshake.query) {
      const queryTokens = {
        accessToken: socket.handshake.query.accessToken || socket.handshake.query.access_token || socket.handshake.query.token,
        refreshToken: socket.handshake.query.refreshToken || socket.handshake.query.refresh_token
      };
      
      if (tokenType === 'accessToken' && queryTokens.accessToken === token) return 'query-params';
      if (tokenType === 'refreshToken' && queryTokens.refreshToken === token) return 'query-params';
    }
    
    // Check authorization header
    if (socket.handshake.headers.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if ((authHeader.startsWith('Bearer ') && authHeader.substring(7) === token) ||
          (authHeader.startsWith('JWT ') && authHeader.substring(4) === token)) {
        return 'auth-header';
      }
    }
    
    return 'cookie';
  }
  
  /**
   * IMPROVED: Enhanced cookie parsing with better error handling and multiple formats
   * Replaces old parseCookies method - addresses Issue #2: Cookie Parsing Failure
   */
  parseCookies(cookieString) {
    const cookies = {};
    
    if (!cookieString || typeof cookieString !== 'string') {
      console.log('🍪 No valid cookie string provided');
      return cookies;
    }
    
    console.log(`🍪 Parsing cookie string (${cookieString.length} chars): ${cookieString.substring(0, 100)}${cookieString.length > 100 ? '...' : ''}`);
    
    try {
      // Split by semicolon and process each cookie
      const cookiePairs = cookieString.split(';');
      
      cookiePairs.forEach((cookie, index) => {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie) {
          // Handle cookies that might have '=' in the value
          const equalIndex = trimmedCookie.indexOf('=');
          
          if (equalIndex > 0) {
            const name = trimmedCookie.substring(0, equalIndex).trim();
            const value = trimmedCookie.substring(equalIndex + 1).trim();
            
            if (name && value) {
              try {
                // Try to decode the value, but don't fail if it's not encoded
                let decodedValue = value;
                try {
                  decodedValue = decodeURIComponent(value);
                } catch (decodeError) {
                  // Value is not URI encoded, use as-is
                  console.log(`🍪 Cookie '${name}' value not URI encoded, using raw value`);
                }
                
                cookies[name] = decodedValue;
                console.log(`🍪 Parsed cookie: ${name} = ${decodedValue.substring(0, 20)}${decodedValue.length > 20 ? '...' : ''}`);
              } catch (error) {
                console.warn(`⚠️ Failed to parse cookie '${name}':`, error.message);
              }
            }
          } else if (trimmedCookie && !trimmedCookie.includes('=')) {
            // Handle boolean cookies (cookies without values)
            cookies[trimmedCookie] = true;
            console.log(`🍪 Parsed boolean cookie: ${trimmedCookie}`);
          }
        }
      });
      
      console.log(`🍪 Successfully parsed ${Object.keys(cookies).length} cookies`);
      return cookies;
      
    } catch (error) {
      console.error('❌ Cookie parsing failed:', error);
      return {};
    }
  }
  
  /**
   * Generate stable device fingerprint for socket (cached to reduce recalculation)
   */
  generateSocketDeviceFingerprint(socket) {
    // Create cache key without socket.id for stability
    const components = [
      socket.handshake.headers['user-agent'] || '',
      socket.handshake.headers['accept-language'] || '',
      socket.handshake.headers['accept-encoding'] || '',
      socket.handshake.address || '',
      // Removed socket.id to make fingerprint stable across connections
    ];
    
    const cacheKey = components.join('|');
    const now = Date.now();
    
    // Check cache first
    const cached = this.deviceFingerprintCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.fingerprintCacheTTL) {
      return cached.fingerprint;
    }
    
    // Generate new fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(cacheKey)
      .digest('hex');
    
    // Cache the result
    this.deviceFingerprintCache.set(cacheKey, {
      fingerprint,
      timestamp: now
    });
    
    // Clean old cache entries occasionally
    if (this.deviceFingerprintCache.size > 1000) {
      this.cleanupFingerprintCache();
    }
    
    return fingerprint;
  }
  
  /**
   * Initialize cleanup intervals
   */
  initializeCleanup() {
    // Clean up inactive sockets every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSockets();
    }, 5 * 60 * 1000);
    
    // Clean up security events every hour
    setInterval(() => {
      this.cleanupSecurityEvents();
    }, 60 * 60 * 1000);
  }
  
  /**
   * Clean up inactive sockets
   */
  cleanupInactiveSockets() {
    const now = Date.now();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes
    
    for (const [socketId, authData] of this.authenticatedSockets) {
      if (now - authData.lastActivity.getTime() > inactivityThreshold) {
        console.log(`🧹 Cleaning up inactive socket: ${socketId} - User: ${authData.username}`);
        this.authenticatedSockets.delete(socketId);
        
        // Clean up user socket tracking
        const userSocketSet = this.userSockets.get(authData.userId);
        if (userSocketSet) {
          userSocketSet.delete(socketId);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(authData.userId);
            this.updateUserOnlineStatus(authData.userId, false);
          }
        }
      }
    }
  }
  
  /**
   * Clean up old security events
   */
  cleanupSecurityEvents() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    for (const [key, events] of this.securityEvents) {
      const filteredEvents = events.filter(event => 
        now - event.timestamp.getTime() < maxAge
      );
      
      if (filteredEvents.length === 0) {
        this.securityEvents.delete(key);
      } else {
        this.securityEvents.set(key, filteredEvents);
      }
    }
  }
  
  /**
   * Clean up old device fingerprint cache entries
   */
  cleanupFingerprintCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.deviceFingerprintCache) {
      if (now - entry.timestamp > this.fingerprintCacheTTL) {
        this.deviceFingerprintCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired device fingerprint cache entries`);
    }
  }
  
  /**
   * Check connection limits to prevent socket flooding
   */
  checkConnectionLimits(socket, authContext) {
    // Check total socket limit
    if (this.authenticatedSockets.size >= this.maxTotalSockets) {
      return {
        allowed: false,
        reason: 'Total socket limit exceeded',
        currentConnections: this.authenticatedSockets.size
      };
    }
    
    // 🔄 CRITICAL FIX: Add per-IP connection limits to prevent flooding
    let ipConnections = 0;
    for (const [socketId, authData] of this.authenticatedSockets) {
      if (authData.ipAddress === authContext.ipAddress) {
        ipConnections++;
      }
    }
    
    // Limit connections per IP to prevent abuse
    const maxConnectionsPerIP = 10;
    if (ipConnections >= maxConnectionsPerIP) {
      return {
        allowed: false,
        reason: `Too many connections from IP address (${ipConnections}/${maxConnectionsPerIP})`,
        currentConnections: ipConnections
      };
    }
    
    // 🔄 CRITICAL FIX: Add per-user connection limits
    if (authContext.userId) {
      let userConnections = 0;
      for (const [socketId, authData] of this.authenticatedSockets) {
        if (authData.userId === authContext.userId) {
          userConnections++;
        }
      }
      
      // Limit connections per user
      const maxConnectionsPerUser = 5;
      if (userConnections >= maxConnectionsPerUser) {
        return {
          allowed: false,
          reason: `Too many connections for user (${userConnections}/${maxConnectionsPerUser})`,
          currentConnections: userConnections
        };
      }
    }
    
    // For now, allow connection since we haven't authenticated yet
    // Per-user limits will be checked after authentication
    return {
      allowed: true,
      currentConnections: this.authenticatedSockets.size
    };
  }
  
  /**
   * Track authentication failures for progressive blocking
   */
  trackAuthFailure(ipAddress) {
    if (!this.authFailures) {
      this.authFailures = new Map();
    }
    
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    // Get or create failure record
    let failures = this.authFailures.get(ipAddress) || [];
    
    // Clean old failures outside the window
    failures = failures.filter(timestamp => now - timestamp < windowMs);
    
    // Add current failure
    failures.push(now);
    this.authFailures.set(ipAddress, failures);
    
    // Clean up old IPs periodically
    if (this.authFailures.size > 1000) {
      this.cleanupAuthFailures();
    }
    
    return failures.length;
  }
  
  /**
   * Clean up old authentication failure records
   */
  cleanupAuthFailures() {
    if (!this.authFailures) return;
    
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    for (const [ipAddress, failures] of this.authFailures) {
      const validFailures = failures.filter(timestamp => now - timestamp < windowMs);
      
      if (validFailures.length === 0) {
        this.authFailures.delete(ipAddress);
      } else {
        this.authFailures.set(ipAddress, validFailures);
      }
    }
  }
  
  /**
   * Log security events
   */
  logSecurityEvent(event, data) {
    const logEntry = {
      timestamp: new Date(),
      event,
      source: 'socket_auth_middleware',
      ...data
    };
    
    console.log(`🛡️ Socket Security Event: ${event}`, logEntry);
    
    // Store for analysis
    const key = `${event}:${data.ipAddress || 'unknown'}`;
    if (!this.securityEvents.has(key)) {
      this.securityEvents.set(key, []);
    }
    
    this.securityEvents.get(key).push(logEntry);
    
    // Limit stored events per key
    if (this.securityEvents.get(key).length > 20) {
      this.securityEvents.get(key).shift();
    }
  }
  
  /**
   * Get authentication statistics
   */
  getAuthStats() {
    return {
      authenticatedSockets: this.authenticatedSockets.size,
      uniqueUsers: this.userSockets.size,
      activeHealthChecks: this.healthChecks.size,
      securityEvents: Array.from(this.securityEvents.values()).reduce((sum, events) => sum + events.length, 0)
    };
  }
}

export default new SocketAuthMiddleware();