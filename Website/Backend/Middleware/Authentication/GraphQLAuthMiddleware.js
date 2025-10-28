import TokenService from '../Services/TokenService.js';
import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';
import SecurityConfig from '../Config/SecurityConfig.js';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

/**
 * 🛡️ 10/10 SECURE GRAPHQL AUTHENTICATION MIDDLEWARE
 * 
 * Features:
 * - Automatic token refresh for GraphQL operations
 * - Device fingerprinting and security validation
 * - Rate limiting for GraphQL operations
 * - Comprehensive audit logging
 * - Role-based access control for resolvers
 */

class GraphQLAuthMiddleware {
  
  constructor() {
    // Rate limiting for GraphQL operations
    this.operationLimits = new Map();
    this.securityEvents = new Map();
    
    // Introspection and dangerous operation detection
    this.dangerousOperations = [
      '__schema',
      '__type',
      'deleteUser',
      'deleteAllData',
      'adminOnly'
    ];
    
    // Operations that require authentication
    this.protectedOperations = [
      'createPost',
      'updatePost',
      'deletePost',
      'sendMessage',
      'updateProfile',
      'followUser',
      'unfollowUser',
      'likePost',
      'createComment',
      'uploadFile'
    ];
    
    // Admin-only operations
    this.adminOperations = [
      'deleteUserAdmin',
      'banUser',
      'getSystemStats',
      'manageUsers',
      'systemSettings'
    ];
  }
  
  /**
   * Main GraphQL authentication context builder
   */
  async createAuthContext(req, res) {
    try {
      // Extract authentication context
      const authContext = this.extractAuthContext(req);
      
      // Try to authenticate user
      const authResult = await this.authenticateRequest(req, authContext);
      
      // Build comprehensive context
      const context = {
        req,
        res,
        
        // Authentication state
        isAuthenticated: authResult.valid,
        user: authResult.user || null,
        
        // Security information
        security: {
          riskScore: authResult.riskScore || 0,
          deviceFingerprint: authContext.deviceFingerprint,
          deviceTrusted: authResult.deviceTrusted || false,
          ipAddress: authContext.ipAddress,
          location: authContext.location,
          userAgent: authContext.userAgent
        },
        
        // Token information
        tokens: {
          accessToken: authResult.accessToken || null,
          refreshToken: authResult.refreshToken || null,
          csrfToken: authResult.csrfToken || null,
          expiresAt: authResult.expiresAt || null
        },
        
        // Helper functions for resolvers
        requireAuth: this.requireAuth,
        requireRole: this.requireRole,
        requireScope: this.requireScope,
        checkRateLimit: this.checkRateLimit.bind(this),
        logSecurityEvent: this.logSecurityEvent.bind(this),
        
        // Session information
        sessionId: crypto.randomUUID(),
        requestId: req.requestId || crypto.randomUUID(),
        timestamp: new Date()
      };
      
      // If token was refreshed, set new cookies
      if (authResult.newTokens) {
        this.setAuthenticationCookies(res, authResult.newTokens);
      }
      
      return context;
      
    } catch (error) {
      console.error('GraphQL auth context creation failed:', error);
      
      return {
        req,
        res,
        isAuthenticated: false,
        user: null,
        security: {
          riskScore: 100, // High risk due to error
          ipAddress: req.ip || '127.0.0.1',
          error: error.message
        },
        error: error.message
      };
    }
  }
  
  /**
   * Extract authentication context from request
   */
  extractAuthContext(req) {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    
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
        timezone: geoInfo.timezone,
        coordinates: geoInfo.ll ? { lat: geoInfo.ll[0], lon: geoInfo.ll[1] } : null
      } : null,
      headers: {
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        acceptLanguage: req.get('Accept-Language')
      },
      timestamp: new Date()
    };
  }
  
  /**
   * Authenticate GraphQL request with auto-refresh
   */
  async authenticateRequest(req, authContext) {
    try {
      // Extract tokens
      const accessToken = this.extractAccessToken(req);
      const refreshToken = this.extractRefreshToken(req);
      
      if (!accessToken && !refreshToken) {
        return { valid: false, reason: 'no_token' };
      }
      
      let authResult = null;
      
      // Try access token first
      if (accessToken) {
        const tokenContext = {
          ipAddress: authContext.ipAddress,
          userAgent: authContext.userAgent,
          deviceHash: authContext.deviceFingerprint
        };
        
        const accessResult = await TokenService.verifyAccessToken(accessToken, tokenContext);
        
        if (accessResult.valid) {
          // Get fresh user data
          const user = await User.findOne({ id: accessResult.user.id });
          if (!user || user.isAccountLocked()) {
            return { valid: false, reason: 'user_inactive' };
          }
          
          // Also get the Profile data and merge it
          const profile = await Profile.findOne({ username: user.username });
          const enhancedUser = {
            ...user.toObject(),
            profileid: profile?.profileid || null // Add profileid for resolver compatibility
          };
          
          return {
            valid: true,
            user: enhancedUser,
            accessToken,
            riskScore: accessResult.security?.riskScore || 0,
            deviceTrusted: user.isDeviceTrusted(authContext.deviceFingerprint, authContext.deviceFingerprint)
          };
        }
        
        // If access token expired, try refresh
        if (accessResult.reason === 'token_expired' && refreshToken) {
          const refreshResult = await this.performAutoRefresh(refreshToken, authContext);
          if (refreshResult.valid) {
            return refreshResult;
          }
        }
      }
      
      // If only refresh token, try to refresh
      if (refreshToken && !accessToken) {
        return await this.performAutoRefresh(refreshToken, authContext);
      }
      
      return { valid: false, reason: 'authentication_failed' };
      
    } catch (error) {
      console.error('GraphQL authentication failed:', error);
      return { valid: false, reason: 'auth_error', error: error.message };
    }
  }
  
  /**
   * Perform automatic token refresh for GraphQL
   */
  async performAutoRefresh(refreshToken, authContext) {
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
        
        // Also get the Profile data and merge it
        const profile = await Profile.findOne({ username: user.username });
        const enhancedUser = {
          ...user.toObject(),
          profileid: profile?.profileid || null // Add profileid for resolver compatibility
        };
        
        // Handle both string and object formats for tokens - THIS IS THE FIX
        let accessTokenValue, refreshTokenValue, accessTokenExpiresAt;
        
        // Handle access token (could be string or object)
        if (typeof refreshResult.accessToken === 'string') {
          accessTokenValue = refreshResult.accessToken;
        } else if (refreshResult.accessToken && typeof refreshResult.accessToken === 'object') {
          accessTokenValue = refreshResult.accessToken.token || refreshResult.accessToken;
          accessTokenExpiresAt = refreshResult.accessToken.expiresAt;
        } else {
          // Direct access if it's already the token value
          accessTokenValue = refreshResult.accessToken;
        }
        
        // Handle refresh token (could be string or object)
        if (typeof refreshResult.refreshToken === 'string') {
          refreshTokenValue = refreshResult.refreshToken;
        } else if (refreshResult.refreshToken && typeof refreshResult.refreshToken === 'object') {
          refreshTokenValue = refreshResult.refreshToken.token || refreshResult.refreshToken;
        } else {
          // Direct access if it's already the token value
          refreshTokenValue = refreshResult.refreshToken;
        }
        
        // CRITICAL FIX: Validate that tokens are actually strings before returning
        if (accessTokenValue && typeof accessTokenValue === 'string' && accessTokenValue.length > 0 && 
            refreshTokenValue && typeof refreshTokenValue === 'string' && refreshTokenValue.length > 0) {
          return {
            valid: true,
            user: enhancedUser,
            accessToken: accessTokenValue,
            refreshToken: refreshTokenValue,
            csrfToken: refreshResult.csrfToken,
            expiresAt: accessTokenExpiresAt || (refreshResult.accessToken?.expiresAt),
            riskScore: refreshResult.metadata.riskScore,
            deviceTrusted: user?.isDeviceTrusted(authContext.deviceFingerprint, authContext.deviceFingerprint) || false,
            newTokens: {
              accessToken: accessTokenValue,
              refreshToken: refreshTokenValue,
              csrfToken: refreshResult.csrfToken
            }
          };
        } else {
          console.error('❌ GraphQL token refresh failed - tokens invalid', {
            accessTokenValue: accessTokenValue,
            accessTokenType: typeof accessTokenValue,
            refreshTokenValue: refreshTokenValue,
            refreshTokenType: typeof refreshTokenValue
          });
          return { valid: false, reason: 'token_generation_failed' };
        }
      }
      
      return { valid: false, reason: refreshResult.reason };
      
    } catch (error) {
      console.error('GraphQL token refresh failed:', error);
      return { valid: false, reason: 'refresh_error' };
    }
  }
  
  /**
   * GraphQL operation validation middleware
   */
  validateGraphQLOperation = (req, res, next) => {
    try {
      const query = req.body?.query || '';
      const operationName = req.body?.operationName;
      const variables = req.body?.variables || {};
      
      // Check for introspection in production
      if (process.env.NODE_ENV === 'production' && query.includes('__schema')) {
        this.logSecurityEvent('introspection_blocked', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          query: query.substring(0, 200)
        });
        
        return res.status(403).json({
          errors: [{
            message: 'Schema introspection is disabled in production',
            extensions: { code: 'INTROSPECTION_DISABLED' }
          }]
        });
      }
      
      // Check for dangerous operations
      const hasDangerousOperation = this.dangerousOperations.some(op => 
        query.includes(op)
      );
      
      if (hasDangerousOperation) {
        this.logSecurityEvent('dangerous_operation_attempted', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          operationName,
          query: query.substring(0, 200)
        });
      }
      
      // Rate limiting for GraphQL operations
      const rateLimitResult = this.checkRateLimit(req.ip, 'graphql_operations');
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          errors: [{
            message: 'Too many GraphQL operations',
            extensions: { 
              code: 'RATE_LIMITED',
              retryAfter: rateLimitResult.retryAfter
            }
          }]
        });
      }
      
      // Attach operation info to request
      req.graphqlOperation = {
        operationName,
        query: query.substring(0, 500), // Truncate for logging
        variables: Object.keys(variables),
        timestamp: new Date()
      };
      
      next();
      
    } catch (error) {
      console.error('GraphQL operation validation failed:', error);
      res.status(500).json({
        errors: [{
          message: 'Operation validation failed',
          extensions: { code: 'VALIDATION_ERROR' }
        }]
      });
    }
  };
  
  /**
   * Require authentication helper for resolvers
   */
  requireAuth(context) {
    if (!context.isAuthenticated) {
      throw new Error('Authentication required');
    }
    return context.user;
  }
  
  /**
   * Require specific role helper for resolvers
   */
  requireRole(context, roles) {
    const user = this.requireAuth(context);
    
    const userRole = user.permissions?.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      this.logSecurityEvent('unauthorized_role_access', {
        userId: user.id,
        userRole,
        requiredRoles: allowedRoles,
        ipAddress: context.security.ipAddress
      });
      
      throw new Error('Insufficient permissions');
    }
    
    return user;
  }
  
  /**
   * Require specific scope helper for resolvers
   */
  requireScope(context, scopes) {
    const user = this.requireAuth(context);
    
    const userScopes = user.permissions?.scopes || [];
    const requiredScopes = Array.isArray(scopes) ? scopes : [scopes];
    
    const hasRequiredScope = requiredScopes.some(scope => 
      userScopes.includes(scope) || userScopes.includes('*')
    );
    
    if (!hasRequiredScope) {
      this.logSecurityEvent('unauthorized_scope_access', {
        userId: user.id,
        userScopes,
        requiredScopes,
        ipAddress: context.security.ipAddress
      });
      
      throw new Error('Insufficient scope');
    }
    
    return user;
  }
  
  /**
   * Rate limiting check
   */
  checkRateLimit(identifier, operation) {
    const key = `${identifier}:${operation}`;
    const now = Date.now();
    
    if (!this.operationLimits.has(key)) {
      this.operationLimits.set(key, { count: 1, resetAt: now + 60000 });
      return { allowed: true };
    }
    
    const limit = this.operationLimits.get(key);
    
    if (now > limit.resetAt) {
      limit.count = 1;
      limit.resetAt = now + 60000;
      return { allowed: true };
    }
    
    limit.count++;
    
    const maxOperations = {
      graphql_operations: 100,
      dangerous_operations: 5,
      admin_operations: 10
    };
    
    const allowed = limit.count <= (maxOperations[operation] || 50);
    
    return {
      allowed,
      retryAfter: allowed ? null : Math.ceil((limit.resetAt - now) / 1000)
    };
  }
  
  /**
   * Utility functions
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  }
  
  generateDeviceFingerprint(req) {
    const components = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      req.ip || '',
      req.headers['x-forwarded-for'] || ''
    ];
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }
  
  extractAccessToken(req) {
    // Try Authorization header first
    const authHeader = req.get('Authorization');
    console.log('🔐 GRAPHQL: Checking Authorization header:', authHeader);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // SECURITY FIX: Validate token before returning
      if (token && token !== 'undefined' && token !== 'null' && token.length > 10) {
        console.log('🔐 GRAPHQL: Found valid Bearer token:', token.substring(0, 30) + '...');
        return token;
      } else {
        console.log('🔐 GRAPHQL: Invalid Bearer token detected:', token);
        return null;
      }
    }
    
    // Try cookies with prefixes (most secure first)
    const cookieToken = req.cookies?.__Host_accessToken || 
                       req.cookies?.__Secure_accessToken || 
                       req.cookies?.accessToken;
    
    console.log('🔐 GRAPHQL: Checking cookie token:', cookieToken);
    
    // SECURITY FIX: Validate cookie token before returning
    if (cookieToken && cookieToken !== 'undefined' && cookieToken !== 'null' && cookieToken.length > 10) {
      return cookieToken;
    } else {
      console.log('🔐 GRAPHQL: Invalid cookie token detected:', cookieToken);
      return null;
    }
  }
  
  extractRefreshToken(req) {
    // Refresh tokens should only come from secure cookies (try prefixed first)
    const refreshToken = req.cookies?.__Host_refreshToken || 
                         req.cookies?.__Secure_refreshToken || 
                         req.cookies?.refreshToken;
    
    // SECURITY FIX: Validate refresh token before returning
    if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null' && refreshToken.length > 10) {
      return refreshToken;
    } else {
      console.log('🔐 GRAPHQL: Invalid refresh token detected:', refreshToken);
      return null;
    }
  }

  setAuthenticationCookies(res, tokens) {
    const cookieOptions = {
      httpOnly: SecurityConfig.cookies.httpOnly,
      secure: SecurityConfig.cookies.secure,
      sameSite: SecurityConfig.cookies.sameSite,
      domain: SecurityConfig.cookies.domain,
      path: SecurityConfig.cookies.path
    };
    
    // SECURITY FIX: Validate token values before setting cookies
    if (!tokens.accessToken) {
      console.error('❌ SECURITY ERROR: Attempting to set undefined accessToken cookie in GraphQL middleware');
      // Don't set cookie with undefined value
    } else {
      // Access token cookie (shorter expiry)
      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 // 1 hour
      });
    }
    
    if (!tokens.refreshToken) {
      console.error('❌ SECURITY ERROR: Attempting to set undefined refreshToken cookie in GraphQL middleware');
      // Don't set cookie with undefined value
    } else {
      // Refresh token cookie (longer expiry)  
      res.cookie('refreshToken', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: SecurityConfig.cookies.maxAge
      });
    }
    
    // CSRF token cookie (readable by JavaScript)
    if (tokens.csrfToken) {
      res.cookie('csrfToken', tokens.csrfToken, {
        ...cookieOptions,
        httpOnly: false, // Allow JavaScript access
        maxAge: 1000 * 60 * 60 // 1 hour
      });
    } else {
      console.warn('⚠️ CSRF token not provided for cookie setting in GraphQL middleware');
    }
  }
  
  logSecurityEvent(event, data) {
    const logEntry = {
      timestamp: new Date(),
      event,
      source: 'graphql_auth_middleware',
      ...data
    };
    
    console.log(`🛡️ GraphQL Security Event: ${event}`, logEntry);
    
    // Store security events for analysis
    const key = `${event}:${data.ipAddress || 'unknown'}`;
    if (!this.securityEvents.has(key)) {
      this.securityEvents.set(key, []);
    }
    
    this.securityEvents.get(key).push(logEntry);
    
    // Clean up old events
    if (this.securityEvents.get(key).length > 10) {
      this.securityEvents.get(key).shift();
    }
  }
}

export default new GraphQLAuthMiddleware();