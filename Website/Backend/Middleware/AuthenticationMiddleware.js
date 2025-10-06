import TokenService from '../Services/TokenService.js';
import User from '../Models/User.js';
import SecurityConfig from '../Config/SecurityConfig.js';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import rateLimit from 'express-rate-limit';

/**
 * 🛡️ 10/10 SECURITY AUTHENTICATION MIDDLEWARE
 * 
 * Features:
 * - JWT token validation with auto-refresh
 * - Device fingerprinting and binding
 * - CSRF protection
 * - Rate limiting
 * - Risk-based authentication
 * - Comprehensive audit logging
 */

class AuthenticationMiddleware {
  
  constructor() {
    // Initialize rate limiters
    this.initializeRateLimiters();
    
    // Enhanced caching systems with TTL
    this.deviceCache = new Map();
    this.fingerprintCache = new Map();
    this.locationCache = new Map();
    this.requestTracker = new Map();
    this.tokenReplayCache = new Map();
    this.bruteForceTracker = new Map();
    
    // Security event counters
    this.securityCounters = new Map();
    
    // Initialize session tracking
    this.activeSessions = new Map();
    
    // Initialize cache cleanup intervals
    this.initializeCacheManagement();
  }
  
  /**
   * 📋 ENHANCED CACHE MANAGEMENT SYSTEM (MEMORY LEAK FIX)
   */
  initializeCacheManagement() {
    // Store interval IDs for proper cleanup
    this.intervalIds = [];
    
    // Clean up caches every 5 minutes
    const cacheCleanupInterval = setInterval(() => {
      this.cleanupCaches();
    }, 5 * 60 * 1000);
    this.intervalIds.push(cacheCleanupInterval);
    
    // Clean up security trackers every hour
    const securityCleanupInterval = setInterval(() => {
      this.cleanupSecurityTrackers();
    }, 60 * 60 * 1000);
    this.intervalIds.push(securityCleanupInterval);
    
    // Clean up audit logs every day
    const auditCleanupInterval = setInterval(() => {
      this.cleanupAuditLogs();
    }, 24 * 60 * 60 * 1000);
    this.intervalIds.push(auditCleanupInterval);
    
    // Set maximum cache sizes to prevent unlimited growth
    this.maxCacheSize = 10000; // Maximum items per cache
    this.maxAuditLogSize = 5000; // Maximum audit log entries
  }
  
  cleanupCaches() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    console.log(`🧹 Starting cache cleanup. Current sizes - Device: ${this.deviceCache.size}, Fingerprint: ${this.fingerprintCache.size}, Location: ${this.locationCache.size}, Replay: ${this.tokenReplayCache.size}`);
    
    let totalCleaned = 0;
    
    // Clean device cache with size limit
    let cleaned = this.cleanMapByAge(this.deviceCache, maxAge, now, 'firstSeen');
    totalCleaned += cleaned;
    
    // Enforce size limit on device cache
    if (this.deviceCache.size > this.maxCacheSize) {
      const excess = this.deviceCache.size - this.maxCacheSize;
      const oldestEntries = Array.from(this.deviceCache.entries())
        .sort((a, b) => a[1].firstSeen.getTime() - b[1].firstSeen.getTime())
        .slice(0, excess);
      
      oldestEntries.forEach(([key]) => this.deviceCache.delete(key));
      totalCleaned += excess;
    }
    
    // Clean fingerprint cache with size limit
    cleaned = this.cleanMapByAge(this.fingerprintCache, maxAge, now, 'timestamp');
    totalCleaned += cleaned;
    
    if (this.fingerprintCache.size > this.maxCacheSize) {
      const excess = this.fingerprintCache.size - this.maxCacheSize;
      const oldestEntries = Array.from(this.fingerprintCache.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, excess);
      
      oldestEntries.forEach(([key]) => this.fingerprintCache.delete(key));
      totalCleaned += excess;
    }
    
    // Clean location cache with size limit
    cleaned = this.cleanMapByAge(this.locationCache, maxAge, now, 'timestamp');
    totalCleaned += cleaned;
    
    if (this.locationCache.size > this.maxCacheSize) {
      const excess = this.locationCache.size - this.maxCacheSize;
      const oldestEntries = Array.from(this.locationCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, excess);
      
      oldestEntries.forEach(([key]) => this.locationCache.delete(key));
      totalCleaned += excess;
    }
    
    // Clean token replay cache (shorter TTL)
    const replayMaxAge = 5 * 60 * 1000; // 5 minutes
    cleaned = this.cleanMapByAge(this.tokenReplayCache, replayMaxAge, now, 'timestamp');
    totalCleaned += cleaned;
    
    if (totalCleaned > 0) {
      console.log(`🧹 Cache cleanup completed. Removed ${totalCleaned} expired/excess entries`);
    }
  }
  
  /**
   * Helper method to clean map entries by age
   */
  cleanMapByAge(map, maxAge, now, timestampProperty) {
    let cleaned = 0;
    
    for (const [key, value] of map.entries()) {
      let timestamp;
      
      if (timestampProperty === 'timestamp') {
        timestamp = typeof value === 'object' && value.timestamp ? value.timestamp : value;
      } else if (timestampProperty === 'firstSeen') {
        timestamp = value.firstSeen ? value.firstSeen.getTime() : now;
      } else {
        timestamp = value;
      }
      
      if (now - timestamp > maxAge) {
        map.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  /**
   * Clean up audit logs to prevent memory bloat
   */
  cleanupAuditLogs() {
    if (!this.auditLog || this.auditLog.length === 0) return;
    
    const originalSize = this.auditLog.length;
    
    // Keep only the most recent entries up to the max size
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
      console.log(`🧹 Trimmed audit log from ${originalSize} to ${this.auditLog.length} entries`);
    }
    
    // Also clean old entries (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const initialLength = this.auditLog.length;
    
    this.auditLog = this.auditLog.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime > sevenDaysAgo;
    });
    
    if (this.auditLog.length < initialLength) {
      console.log(`🧹 Removed ${initialLength - this.auditLog.length} old audit log entries`);
    }
  }
  
  cleanupSecurityTrackers() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean request tracker
    for (const [key, requests] of this.requestTracker.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
      if (validRequests.length === 0) {
        this.requestTracker.delete(key);
      } else {
        this.requestTracker.set(key, validRequests);
      }
    }
    
    // Clean brute force tracker
    for (const [key, attempts] of this.bruteForceTracker.entries()) {
      const validAttempts = attempts.filter(attempt => now - attempt.timestamp < maxAge);
      if (validAttempts.length === 0) {
        this.bruteForceTracker.delete(key);
      } else {
        this.bruteForceTracker.set(key, validAttempts);
      }
    }
  }
  
  
  getEventSeverity(eventType) {
    const severityMap = {
      'authentication_failure': 'medium',
      'brute_force_detected': 'critical',
      'token_replay_detected': 'critical',
      'impossible_travel': 'high',
      'device_binding_failed': 'high',
      'geographic_anomaly': 'medium',
      'suspicious_user_agent': 'medium',
      'rapid_requests': 'medium',
      'authentication_success': 'low',
      'auto_refresh_success': 'low',
      'rate_limit_exceeded': 'medium'
    };
    
    return severityMap[eventType] || 'info';
  }
  
  storeAuditLog(logEntry) {
    // In a real implementation, this would store to database
    // For now, we'll keep a simple in-memory store
    if (!this.auditLogs) {
      this.auditLogs = [];
    }
    
    this.auditLogs.push(logEntry);
    
    // Keep only last 1000 entries in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }
  
  
  
  
  
  /**
   * Track failed authentication attempts
   */
  trackFailedAttempt(authContext) {
    const ipAddress = authContext.ipAddress;
    const bruteForceKey = `brute_force:${ipAddress}`;
    const requestKey = `requests:${ipAddress}`;
    
    // Track for brute force detection
    const attempts = this.bruteForceTracker.get(bruteForceKey) || [];
    attempts.push({
      timestamp: Date.now(),
      success: false,
      userAgent: authContext.userAgent,
      deviceFingerprint: authContext.deviceFingerprint
    });
    this.bruteForceTracker.set(bruteForceKey, attempts);
    
    // Track for rate limiting
    const requests = this.requestTracker.get(requestKey) || [];
    requests.push(Date.now());
    this.requestTracker.set(requestKey, requests);
  }
  
  
  
  /**
   * Initialize rate limiters for different authentication operations
   */
  initializeRateLimiters() {
    // Login rate limiter
    this.loginLimiter = rateLimit({
      windowMs: SecurityConfig.rateLimiting.auth.windowMs,
      max: SecurityConfig.rateLimiting.auth.max,
      message: {
        error: 'too_many_login_attempts',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil(SecurityConfig.rateLimiting.auth.windowMs / 1000 / 60)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: SecurityConfig.rateLimiting.auth.skipSuccessfulRequests,
      // Remove custom keyGenerator to use default IPv6-compatible one
      // keyGenerator will default to req.ip with proper IPv6 handling
      handler: (req, res, next, options) => {
        this.logSecurityEvent('rate_limit_exceeded', {
          type: 'login',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          identifier: req.body?.email || req.body?.username
        });
        return res.status(options.statusCode).json(options.message);
      }
    });
    
    // Token refresh rate limiter
    this.refreshLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 20, // Max 20 refresh attempts per 5 minutes
      message: {
        error: 'too_many_refresh_attempts',
        message: 'Too many token refresh attempts.',
        retryAfter: 5
      },
      // Use default keyGenerator for IPv6 compatibility
      handler: (req, res, next, options) => {
        this.logSecurityEvent('token_refresh_limit_exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(options.statusCode).json(options.message);
      }
    });
    
    // General API rate limiter
    this.apiLimiter = rateLimit({
      windowMs: SecurityConfig.rateLimiting.global.windowMs,
      max: SecurityConfig.rateLimiting.global.max,
      message: {
        error: 'rate_limit_exceeded',
        message: 'Too many requests from this IP.',
        retryAfter: Math.ceil(SecurityConfig.rateLimiting.global.windowMs / 1000 / 60)
      },
      standardHeaders: SecurityConfig.rateLimiting.global.standardHeaders,
      legacyHeaders: SecurityConfig.rateLimiting.global.legacyHeaders
    });
  }
  
  /**
   * Extract and validate authentication context from request
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
        acceptLanguage: req.get('Accept-Language'),
        acceptEncoding: req.get('Accept-Encoding')
      },
      // SECURITY FIX: Internal session tracking (not exposed to client)
      internalSessionId: req.sessionID || crypto.randomUUID(),
      timestamp: new Date()
    };
  }
  
  /**
   * Generate comprehensive device fingerprint
   */
  generateDeviceFingerprint(req) {
    // Check cache first
    const cacheKey = `${req.ip}:${req.get('User-Agent')}`;
    if (this.fingerprintCache.has(cacheKey)) {
      return this.fingerprintCache.get(cacheKey);
    }
    
    const components = [
      req.get('User-Agent') || '',
      req.get('Accept-Language') || '',
      req.get('Accept-Encoding') || '',
      req.get('Accept') || '',
      req.connection?.remoteAddress || '',
      req.headers['x-forwarded-for'] || ''
    ];
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
    
    // Cache for 1 hour
    this.fingerprintCache.set(cacheKey, fingerprint);
    setTimeout(() => this.fingerprintCache.delete(cacheKey), 3600000);
    
    return fingerprint;
  }
  
  /**
   * Get real client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  }
  
  /**
   * Main authentication middleware
   */
  authenticate = async (req, res, next) => {
    try {
      console.log('🔍 Authenticating request... cookies:', req.cookies);
      // Extract authentication context
      const authContext = this.extractAuthContext(req);
      req.authContext = authContext;
      
      // Extract tokens
      const accessToken = this.extractAccessToken(req);
      const refreshToken = this.extractRefreshToken(req);
      
      if (!accessToken && !refreshToken) {
        return this.respondUnauthorized(res, 'no_token', 'No authentication token provided');
      }
      
      let authResult = null;
      
      // Try to validate access token first
      if (accessToken) {
        authResult = await this.validateAccessToken(accessToken, authContext);
        
        // If access token is expired but we have a refresh token, try to refresh
        if (!authResult.valid && authResult.reason === 'token_expired' && refreshToken) {
          authResult = await this.performAutoRefresh(refreshToken, authContext, res);
        }
      } else if (refreshToken) {
        // Only refresh token provided, perform refresh
        authResult = await this.performAutoRefresh(refreshToken, authContext, res);
      }
      
      if (!authResult || !authResult.valid) {
        return this.handleAuthenticationFailure(res, authResult, authContext);
      }
      
      // Attach user and security info to request
      req.user = authResult.user;
      req.security = authResult.security;
      req.tokenMetadata = authResult.metadata;
      
      // Perform additional security checks
      const securityCheck = await this.performSecurityChecks(req, authResult);
      if (!securityCheck.passed) {
        return this.handleSecurityViolation(res, securityCheck, authContext);
      }
      
      // Update user's last activity
      await this.updateUserActivity(req.user, authContext);
      
      // Log successful authentication
      this.logSecurityEvent('authentication_success', {
        userId: req.user.id,
        username: req.user.username,
        ipAddress: authContext.ipAddress,
        deviceFingerprint: authContext.deviceFingerprint,
        riskScore: authResult.security?.riskScore || 0
      });
      
      next();
      
    } catch (error) {
      console.error('Authentication middleware error:', error);
      this.logSecurityEvent('authentication_error', {
        error: error.message,
        stack: error.stack,
        ipAddress: req.authContext?.ipAddress
      });
      
      return res.status(500).json({
        error: 'authentication_error',
        message: 'Internal authentication error'
      });
    }
  };
  
  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  optionalAuthenticate = async (req, res, next) => {
    try {
      const authContext = this.extractAuthContext(req);
      req.authContext = authContext;
      
      const accessToken = this.extractAccessToken(req);
      if (accessToken) {
        const authResult = await this.validateAccessToken(accessToken, authContext);
        if (authResult.valid) {
          req.user = authResult.user;
          req.security = authResult.security;
          req.tokenMetadata = authResult.metadata;
        }
      }
      
      next();
    } catch (error) {
      // Don't fail for optional authentication
      next();
    }
  };
  
  /**
   * Validate access token
   */
  async validateAccessToken(token, authContext) {
    const context = {
      ipAddress: authContext.ipAddress,
      userAgent: authContext.userAgent,
      deviceHash: authContext.deviceFingerprint
    };
    
    const result = await TokenService.verifyAccessToken(token, context);
    
    if (result.valid) {
      // Get fresh user data
      const user = await User.findOne({ id: result.user.id });
      if (!user) {
        return { valid: false, reason: 'user_not_found' };
      }
      
      // Check if user account is still active
      if (user.isAccountLocked()) {
        return { valid: false, reason: 'account_locked' };
      }
      
      return {
        valid: true,
        user,
        security: result.security,
        metadata: result.metadata
      };
    }
    
    return result;
  }
  
  /**
   * 🔄 ENHANCED AUTOMATIC TOKEN REFRESH WITH SECURITY VALIDATION
   */
  async performAutoRefresh(refreshToken, authContext, res) {
    const context = {
      ipAddress: authContext.ipAddress,
      userAgent: authContext.userAgent,
      deviceHash: authContext.deviceFingerprint,
      internalSessionId: authContext.internalSessionId,
      // SECURITY ENHANCEMENT: Comprehensive device validation context
      deviceValidation: {
        acceptLanguage: authContext.headers?.acceptLanguage,
        acceptEncoding: authContext.headers?.acceptEncoding,
        origin: authContext.headers?.origin,
        referer: authContext.headers?.referer,
        timestamp: authContext.timestamp
      },
      // Risk assessment context
      riskFactors: {
        locationChange: await this.detectLocationChange(authContext),
        deviceChange: await this.detectDeviceChange(authContext),
        suspiciousPatterns: await this.detectSuspiciousPatterns(authContext)
      }
    };
    
    // SECURITY FIX: Enhanced token refresh with device binding validation
    const refreshResult = await TokenService.refreshTokens(refreshToken, context);
    
    if (refreshResult.valid) {
      // Set new tokens in cookies
      this.setAuthenticationCookies(res, {
        accessToken: refreshResult.accessToken.token,
        refreshToken: refreshResult.refreshToken.token,
        csrfToken: refreshResult.csrfToken
      });
      
      // Log auto-refresh
      this.logSecurityEvent('auto_refresh_success', {
        userId: refreshResult.user.id,
        ipAddress: authContext.ipAddress,
        generation: refreshResult.metadata.generation,
        rotated: refreshResult.metadata.rotated
      });
      
      return {
        valid: true,
        user: await User.findOne({ id: refreshResult.user.id }),
        security: { riskScore: refreshResult.metadata.riskScore },
        metadata: refreshResult.metadata
      };
    }
    
    return refreshResult;
  }
  
  /**
   * SECURITY FIX: Extract access token from request with prefix support
   */
  extractAccessToken(req) {
    // Try Authorization header first
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Try cookies with prefixes (most secure first)
    return req.cookies?.__Host_accessToken || 
           req.cookies?.__Secure_accessToken || 
           req.cookies?.accessToken;
  }
  
  /**
   * SECURITY FIX: Extract refresh token from request with prefix support
   */
  extractRefreshToken(req) {
    // Refresh tokens should only come from secure cookies (try prefixed first)
    return req.cookies?.__Host_refreshToken || 
           req.cookies?.__Secure_refreshToken || 
           req.cookies?.refreshToken;
  }
  
  /**
   * 🔍 COMPREHENSIVE SECURITY VALIDATION METHODS
   */
  
  /**
   * Detect location changes for risk assessment
   */
  async detectLocationChange(authContext) {
    try {
      // Get cached location for comparison
      const cacheKey = `location:${authContext.ipAddress}`;
      const cachedLocation = this.locationCache?.get(cacheKey);
      
      if (cachedLocation && authContext.location) {
        const distanceKm = this.calculateDistance(
          cachedLocation.coordinates,
          authContext.location.coordinates
        );
        
        // Flag if location changed by more than 100km
        return {
          changed: distanceKm > 100,
          distance: distanceKm,
          previousLocation: cachedLocation,
          currentLocation: authContext.location
        };
      }
      
      return { changed: false, distance: 0 };
    } catch (error) {
      console.warn('Location change detection failed:', error.message);
      return { changed: false, error: true };
    }
  }
  
  /**
   * Detect device changes using comprehensive fingerprinting
   */
  async detectDeviceChange(authContext) {
    try {
      const deviceKey = `device:${authContext.deviceFingerprint}`;
      const cachedDevice = this.deviceCache.get(deviceKey);
      
      if (cachedDevice) {
        const changes = [];
        
        if (cachedDevice.userAgent !== authContext.userAgent) {
          changes.push('userAgent');
        }
        
        if (cachedDevice.acceptLanguage !== authContext.headers?.acceptLanguage) {
          changes.push('acceptLanguage');
        }
        
        if (cachedDevice.acceptEncoding !== authContext.headers?.acceptEncoding) {
          changes.push('acceptEncoding');
        }
        
        return {
          changed: changes.length > 0,
          changes,
          riskLevel: changes.length > 1 ? 'high' : changes.length > 0 ? 'medium' : 'low'
        };
      }
      
      // Cache current device info
      this.deviceCache.set(deviceKey, {
        userAgent: authContext.userAgent,
        acceptLanguage: authContext.headers?.acceptLanguage,
        acceptEncoding: authContext.headers?.acceptEncoding,
        firstSeen: new Date()
      });
      
      return { changed: false, newDevice: true };
    } catch (error) {
      console.warn('Device change detection failed:', error.message);
      return { changed: false, error: true };
    }
  }
  
  /**
   * Detect suspicious patterns in authentication requests
   */
  async detectSuspiciousPatterns(authContext) {
    const suspiciousFactors = [];
    const riskScore = 0;
    
    try {
      // Check for rapid requests from same IP
      const ipKey = `requests:${authContext.ipAddress}`;
      const recentRequests = this.requestTracker?.get(ipKey) || [];
      const now = Date.now();
      const recentCount = recentRequests.filter(time => now - time < 60000).length;
      
      if (recentCount > 30) {
        suspiciousFactors.push('rapid_requests');
      }
      
      // Check for unusual hours (if user has established patterns)
      const hour = new Date().getHours();
      if (hour < 6 || hour > 23) {
        suspiciousFactors.push('unusual_hours');
      }
      
      // Check for suspicious user agent patterns
      const userAgent = authContext.userAgent.toLowerCase();
      const suspiciousUAPatterns = [
        /bot|crawler|spider|scraper/,
        /python|curl|wget|postman/,
        /automation|selenium|headless/
      ];
      
      if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
        suspiciousFactors.push('suspicious_user_agent');
      }
      
      // Check for missing or suspicious headers
      if (!authContext.headers?.acceptLanguage) {
        suspiciousFactors.push('missing_accept_language');
      }
      
      if (!authContext.headers?.acceptEncoding) {
        suspiciousFactors.push('missing_accept_encoding');
      }
      
      return {
        factors: suspiciousFactors,
        riskScore: suspiciousFactors.length * 10,
        level: suspiciousFactors.length > 2 ? 'high' : 
               suspiciousFactors.length > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      console.warn('Suspicious pattern detection failed:', error.message);
      return { factors: [], riskScore: 0, level: 'low', error: true };
    }
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return 0;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lon - coord1.lon);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  
  /**
   * Validate device binding with enhanced security
   */
  async validateDeviceBinding(req, user) {
    try {
      const deviceFingerprint = req.authContext.deviceFingerprint;
      const trustedDevices = user.security?.trustedDevices || [];
      
      // Check if device is in trusted list
      const trustedDevice = trustedDevices.find(device => 
        device.deviceHash === deviceFingerprint
      );
      
      if (!trustedDevice) {
        // New device - require additional verification
        return {
          passed: false,
          reason: 'new_device_requires_verification',
          requiresVerification: true
        };
      }
      
      // Check if device was used recently
      const daysSinceLastUse = (Date.now() - new Date(trustedDevice.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUse > 90) {
        return {
          passed: false,
          reason: 'device_inactive_too_long',
          requiresReVerification: true
        };
      }
      
      // Update device last used
      trustedDevice.lastUsed = new Date();
      await user.save();
      
      return { passed: true };
    } catch (error) {
      console.error('Device binding validation failed:', error);
      return { passed: false, reason: 'validation_error' };
    }
  }
  
  /**
   * Check for concurrent sessions
   */
  async checkConcurrentSessions(user) {
    try {
      const maxSessions = SecurityConfig.auth.session.maxConcurrentSessions;
      const activeSessions = user.activeSessions || [];
      
      // Clean up expired sessions
      const now = new Date();
      const validSessions = activeSessions.filter(session => {
        const sessionAge = now.getTime() - new Date(session.createdAt).getTime();
        return sessionAge < SecurityConfig.auth.session.sessionTimeout * 60 * 1000;
      });
      
      if (validSessions.length >= maxSessions) {
        return {
          passed: false,
          reason: 'max_concurrent_sessions_exceeded',
          currentSessions: validSessions.length,
          maxAllowed: maxSessions
        };
      }
      
      return { passed: true };
    } catch (error) {
      console.error('Concurrent session check failed:', error);
      return { passed: true }; // Fail open for availability
    }
  }
  
  /**
   * Check for token replay attacks
   */
  async checkTokenReplay(req, tokenMetadata) {
    try {
      const tokenId = tokenMetadata?.jti;
      if (!tokenId) return { passed: true };
      
      const replayKey = `token_replay:${tokenId}`;
      const lastUsed = this.tokenReplayCache?.get(replayKey);
      const now = Date.now();
      
      if (lastUsed && (now - lastUsed) < 1000) { // Same token used within 1 second
        return {
          passed: false,
          reason: 'token_replay_detected',
          timeDiff: now - lastUsed
        };
      }
      
      // Cache token usage
      this.tokenReplayCache?.set(replayKey, now);
      
      return { passed: true };
    } catch (error) {
      console.error('Token replay check failed:', error);
      return { passed: true }; // Fail open for availability
    }
  }
  
  /**
   * Check for geographic anomalies
   */
  async checkGeographicAnomalies(authContext, user) {
    try {
      if (!authContext.location) {
        return { riskScore: 0, reason: 'no_location_data' };
      }
      
      const lastKnownLocation = user.audit?.lastLoginLocation;
      if (!lastKnownLocation) {
        // First time login location - store it
        user.audit = user.audit || {};
        user.audit.lastLoginLocation = authContext.location;
        await user.save();
        return { riskScore: 10, reason: 'first_time_location' };
      }
      
      // Calculate distance from last known location
      const distance = this.calculateDistance(
        lastKnownLocation.coordinates,
        authContext.location.coordinates
      );
      
      // Calculate time since last login
      const timeSinceLastLogin = Date.now() - new Date(user.audit.lastLogin).getTime();
      const hoursSinceLastLogin = timeSinceLastLogin / (1000 * 60 * 60);
      
      // Impossible travel detection
      const maxPossibleSpeed = 1000; // km/h (commercial flight speed)
      const requiredSpeed = distance / hoursSinceLastLogin;
      
      let riskScore = 0;
      const reasons = [];
      
      if (requiredSpeed > maxPossibleSpeed) {
        riskScore += 100;
        reasons.push('impossible_travel');
      } else if (distance > 1000 && hoursSinceLastLogin < 6) {
        riskScore += 50;
        reasons.push('rapid_location_change');
      } else if (distance > 500) {
        riskScore += 20;
        reasons.push('significant_location_change');
      }
      
      // Country change detection
      if (lastKnownLocation.country !== authContext.location.country) {
        riskScore += 30;
        reasons.push('country_change');
      }
      
      return {
        riskScore,
        reasons,
        distance,
        requiredSpeed,
        locationChange: {
          from: lastKnownLocation,
          to: authContext.location
        }
      };
    } catch (error) {
      console.error('Geographic anomaly check failed:', error);
      return { riskScore: 0, error: true };
    }
  }
  
  /**
   * Check for brute force attack patterns
   */
  async checkBruteForcePatterns(authContext) {
    try {
      const ipAddress = authContext.ipAddress;
      const bruteForceKey = `brute_force:${ipAddress}`;
      
      // Get recent failed attempts from this IP
      const recentAttempts = this.bruteForceTracker?.get(bruteForceKey) || [];
      const now = Date.now();
      const recentFailures = recentAttempts.filter(attempt => 
        now - attempt.timestamp < 3600000 && !attempt.success // Last hour, failed attempts
      );
      
      if (recentFailures.length > 20) {
        return {
          passed: false,
          reason: 'brute_force_detected',
          failedAttempts: recentFailures.length,
          timeWindow: '1 hour'
        };
      }
      
      return { passed: true };
    } catch (error) {
      console.error('Brute force check failed:', error);
      return { passed: true }; // Fail open for availability
    }
  }
  
  /**
   * SECURITY FIX: Extract CSRF token from request with prefix support
   */
  extractCSRFToken(req) {
    // Try header first
    const headerToken = req.get('X-CSRF-Token');
    if (headerToken) return headerToken;
    
    // Try cookies with prefixes (most secure first) - SECURITY FIX: Use correct hyphen names
    return req.cookies['__Host-csrfToken'] || 
           req.cookies['__Secure-csrfToken'] || 
           req.cookies?.csrfToken;
  }
  
  /**
   * SECURITY FIX: Comprehensive authentication cookie setting with all modern security features
   */
  setAuthenticationCookies(res, tokens, additionalOptions = {}) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const req = res.req; // Get request object from response
    
    // SECURITY FIX: Enhanced protocol detection for HTTP/HTTPS handling
    const isHttpsRequest = req?.secure || 
                          req?.headers?.['x-forwarded-proto'] === 'https' ||
                          req?.headers?.['x-forwarded-ssl'] === 'on' ||
                          req?.connection?.encrypted ||
                          req?.protocol === 'https' ||
                          req?.headers?.['cf-visitor']?.includes('https') || // Cloudflare
                          req?.headers?.['x-forwarded-scheme'] === 'https'; // Other proxies
                          
    // SECURITY FIX: Detect if frontend is likely using HTTPS based on origin
    const frontendOrigin = req?.get('Origin') || req?.get('Referer');
    const frontendIsHttps = frontendOrigin?.startsWith('https://');
    
    console.log('🔄 Protocol detection:', {
      backendHttps: isHttpsRequest,
      frontendHttps: frontendIsHttps,
      origin: frontendOrigin,
      protocol: req?.protocol,
      secure: req?.secure
    });
                          
    const forceSecure = process.env.FORCE_SECURE_COOKIES === 'true';
    
    // SECURITY FIX: Adaptive secure flag based on protocol consistency
    let secureFlag;
    if (isDevelopment && !forceSecure) {
      // In development, only set secure if both frontend and backend are HTTPS
      secureFlag = isHttpsRequest && frontendIsHttps;
      
      // Warn about protocol mismatches that might cause cookie issues
      if (isHttpsRequest !== frontendIsHttps) {
        console.warn('⚠️  Protocol mismatch detected:', {
          backend: isHttpsRequest ? 'HTTPS' : 'HTTP',
          frontend: frontendIsHttps ? 'HTTPS' : 'HTTP',
          adjustingSecureFlag: secureFlag,
          recommendation: 'Use consistent HTTP/HTTPS for both frontend and backend'
        });
      }
      
      console.log(`🔒 Development cookie secure flag: ${secureFlag} (Backend HTTPS: ${isHttpsRequest}, Frontend HTTPS: ${frontendIsHttps})`);
    } else {
      secureFlag = true; // SECURITY FIX: Always secure in production
      console.log('🔒 Production cookie secure flag: true (forced secure)');
    }
    
    // SECURITY FIX: Enhanced sameSite with proper cross-origin handling
    let sameSitePolicy;
    if (isDevelopment) {
      if (secureFlag) {
        sameSitePolicy = 'none'; // Required for cross-origin HTTPS
      } else {
        sameSitePolicy = 'lax'; // Safe for HTTP development
      }
    } else {
      sameSitePolicy = SecurityConfig.cookies.sameSite || 'strict'; // Production default strict
    }
    
    // SECURITY FIX: Enhanced domain handling for subdomains
    let domainSetting;
    if (isDevelopment) {
      domainSetting = undefined; // No domain restriction in development
    } else {
      // Extract root domain for subdomain support (e.g., .swaggo.app)
      const host = req?.get('Host') || SecurityConfig.cookies.domain;
      if (host && host.includes('.')) {
        const parts = host.split('.');
        if (parts.length > 2) {
          domainSetting = `.${parts.slice(-2).join('.')}`; // e.g., .swaggo.app
        } else {
          domainSetting = `.${host}`; // e.g., .localhost
        }
      } else {
        domainSetting = SecurityConfig.cookies.domain;
      }
    }
    
    // SECURITY FIX: Base cookie options with all security features
    const baseCookieOptions = {
      httpOnly: true, // Always httpOnly for auth cookies
      secure: secureFlag,
      sameSite: sameSitePolicy,
      domain: domainSetting,
      path: '/', // SECURITY FIX: Always root path for auth cookies
      ...additionalOptions // Allow selective overrides
    };
    
    // SECURITY FIX: Add CHIPS Partitioned attribute for third-party contexts
    if (secureFlag && sameSitePolicy === 'none') {
      baseCookieOptions.partitioned = true;
    }
    
    // SECURITY FIX: Consistent expiration handling
    const accessTokenMaxAge = additionalOptions.rememberMe ? 
      (30 * 24 * 60 * 60 * 1000) : // 30 days for remember me
      (1000 * 60 * 60); // 1 hour default
      
    const refreshTokenMaxAge = additionalOptions.rememberMe ?
      (90 * 24 * 60 * 60 * 1000) : // 90 days for remember me
      SecurityConfig.cookies.maxAge; // 7 days default
      
    const csrfTokenMaxAge = accessTokenMaxAge; // CSRF expires with access token
    
    // SECURITY FIX: Determine cookie prefix based on security level
    // __Host- requires: HTTPS + no domain setting + root path
    // __Secure- requires: HTTPS only
    const cookiePrefix = secureFlag && !domainSetting && baseCookieOptions.path === '/' ? 
      '__Host-' : // Strictest security: HTTPS + no domain + root path
      (secureFlag ? '__Secure-' : ''); // HTTPS required
    
    // Access token cookie with secure prefix (shorter expiry)
    res.cookie(`${cookiePrefix}accessToken`, tokens.accessToken, {
      ...baseCookieOptions,
      maxAge: accessTokenMaxAge
    });
    
    // Refresh token cookie with secure prefix (longer expiry)
    res.cookie(`${cookiePrefix}refreshToken`, tokens.refreshToken, {
      ...baseCookieOptions,
      maxAge: refreshTokenMaxAge
    });
    
    // SECURITY FIX: CSRF token cookie (readable by JavaScript but still prefixed)
    if (tokens.csrfToken) {
      res.cookie(`${cookiePrefix}csrfToken`, tokens.csrfToken, {
        ...baseCookieOptions,
        httpOnly: false, // JavaScript needs access for header inclusion
        maxAge: csrfTokenMaxAge
      });
    }
    
    // SECURITY FIX: Enhanced cookie logging with protocol detection details
    console.log(`🍪 Setting authentication cookies:`, {
      cookieNames: Object.keys(tokens),
      prefix: cookiePrefix,
      options: {
        httpOnly: baseCookieOptions.httpOnly,
        secure: baseCookieOptions.secure,
        sameSite: baseCookieOptions.sameSite,
        domain: baseCookieOptions.domain,
        path: baseCookieOptions.path,
        partitioned: baseCookieOptions.partitioned
      },
      maxAges: {
        accessToken: accessTokenMaxAge,
        refreshToken: refreshTokenMaxAge,
        csrfToken: csrfTokenMaxAge
      },
      context: {
        backendHttps: isHttpsRequest,
        frontendHttps: frontendIsHttps,
        protocolMismatch: isHttpsRequest !== frontendIsHttps,
        isDevelopment,
        origin: req?.get('Origin'),
        host: req?.get('Host'),
        isProxied: req?.get('X-Forwarded-Host') ? true : false
      }
    });
    
    // Additional debugging for cookie issues  
    console.log(`🔍 Cookie debug - Access Token MaxAge: ${accessTokenMaxAge}ms (${Math.round(accessTokenMaxAge / (1000 * 60 * 60))}h)`);
    console.log(`🔍 Cookie debug - Refresh Token MaxAge: ${refreshTokenMaxAge}ms (${Math.round(refreshTokenMaxAge / (1000 * 60 * 60 * 24))}d)`);
    console.log(`🔍 Cookie debug - CSRF Token MaxAge: ${csrfTokenMaxAge}ms (${Math.round(csrfTokenMaxAge / (1000 * 60 * 60))}h)`);
  }
  
  /**
   * Perform additional security checks
   */
  async performSecurityChecks(req, authResult) {
    const checks = [];
    
    // Check for suspicious activity patterns
    const activityCheck = this.checkSuspiciousActivity(req, authResult.user);
    checks.push(activityCheck);
    
    // Check device trust level
    const deviceCheck = this.checkDeviceTrust(req, authResult.user);
    checks.push(deviceCheck);
    
    // Check geographic anomalies
    const locationCheck = this.checkLocationAnomaly(req, authResult.user);
    checks.push(locationCheck);
    
    // Check time-based patterns
    const timeCheck = this.checkTimeAnomaly(req, authResult.user);
    checks.push(timeCheck);
    
    // Evaluate overall risk
    const failedChecks = checks.filter(check => !check.passed);
    const riskScore = failedChecks.reduce((sum, check) => sum + (check.riskIncrease || 0), 0);
    
    // High-risk threshold
    if (riskScore > 70) {
      return {
        passed: false,
        reason: 'high_risk_score',
        riskScore,
        failedChecks: failedChecks.map(check => check.reason)
      };
    }
    
    return {
      passed: true,
      riskScore,
      checks: checks.map(check => ({ reason: check.reason, passed: check.passed }))
    };
  }
  
  /**
   * Check for suspicious activity patterns
   */
  checkSuspiciousActivity(req, user) {
    const ipAddress = req.authContext.ipAddress;
    const now = Date.now();
    
    // Track requests per IP
    const ipKey = `activity:${ipAddress}`;
    const ipActivity = this.securityCounters.get(ipKey) || { count: 0, firstSeen: now };
    
    // Check for rapid requests from same IP
    if (ipActivity.count > 100 && (now - ipActivity.firstSeen) < 300000) { // 100 requests in 5 minutes
      return {
        passed: false,
        reason: 'rapid_requests_from_ip',
        riskIncrease: 30
      };
    }
    
    // Update counter
    ipActivity.count++;
    this.securityCounters.set(ipKey, ipActivity);
    
    // Clean up old counters
    setTimeout(() => {
      if (this.securityCounters.has(ipKey)) {
        const activity = this.securityCounters.get(ipKey);
        if (now - activity.firstSeen > 3600000) { // 1 hour
          this.securityCounters.delete(ipKey);
        }
      }
    }, 3600000);
    
    return { passed: true, reason: 'activity_normal' };
  }
  
  /**
   * Check device trust level
   */
  checkDeviceTrust(req, user) {
    const deviceFingerprint = req.authContext.deviceFingerprint;
    
    // Check if device is in user's trusted devices
    const trustedDevice = user.security.trustedDevices.find(
      device => device.deviceHash === deviceFingerprint
    );
    
    if (!trustedDevice) {
      return {
        passed: false,
        reason: 'unknown_device',
        riskIncrease: 25
      };
    }
    
    if (trustedDevice.trustLevel < 3) {
      return {
        passed: false,
        reason: 'low_trust_device',
        riskIncrease: 15
      };
    }
    
    return { passed: true, reason: 'trusted_device' };
  }
  
  /**
   * Check for geographic anomalies
   */
  checkLocationAnomaly(req, user) {
    const currentLocation = req.authContext.location;
    
    if (!currentLocation) {
      return {
        passed: false,
        reason: 'unknown_location',
        riskIncrease: 10
      };
    }
    
    // Check against user's last known location
    const lastKnownLocation = user.audit.lastLoginIP;
    if (lastKnownLocation) {
      const lastGeo = geoip.lookup(lastKnownLocation);
      
      // Different country = higher risk
      if (lastGeo && lastGeo.country !== currentLocation.country) {
        return {
          passed: false,
          reason: 'location_change',
          riskIncrease: 20
        };
      }
    }
    
    // Check for high-risk locations
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
    if (highRiskCountries.includes(currentLocation.country)) {
      return {
        passed: false,
        reason: 'high_risk_location',
        riskIncrease: 35
      };
    }
    
    return { passed: true, reason: 'location_normal' };
  }
  
  /**
   * Check for time-based anomalies
   */
  checkTimeAnomaly(req, user) {
    const now = new Date();
    const hour = now.getHours();
    
    // Check for unusual access times (late night/early morning)
    if (hour < 6 || hour > 23) {
      return {
        passed: false,
        reason: 'unusual_time',
        riskIncrease: 10
      };
    }
    
    // Check for weekend access for business accounts
    if (user.permissions?.role === 'admin' && (now.getDay() === 0 || now.getDay() === 6)) {
      return {
        passed: false,
        reason: 'weekend_admin_access',
        riskIncrease: 5
      };
    }
    
    return { passed: true, reason: 'time_normal' };
  }
  
  /**
   * Update user's last activity
   */
  async updateUserActivity(user, authContext) {
    try {
      user.updateLastLogin(authContext.ipAddress, `${authContext.deviceInfo.browser} ${authContext.deviceInfo.os}`);
      
      // Update or add trusted device
      user.addTrustedDevice(
        authContext.deviceFingerprint,
        authContext.deviceFingerprint,
        `${authContext.deviceInfo.browser} on ${authContext.deviceInfo.os}`
      );
      
      await user.save();
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  }
  
  /**
   * Handle authentication failure
   */
  handleAuthenticationFailure(res, authResult, authContext) {
    const reason = authResult?.reason || 'unknown_error';
    const details = authResult?.details || 'Authentication failed';
    
    this.logSecurityEvent('authentication_failed', {
      reason,
      details,
      ipAddress: authContext.ipAddress,
      userAgent: authContext.userAgent,
      deviceFingerprint: authContext.deviceFingerprint
    });
    
    // Clear authentication cookies
    this.clearAuthenticationCookies(res);
    
    const statusCode = reason === 'token_expired' ? 401 : 403;
    
    return res.status(statusCode).json({
      error: 'authentication_failed',
      reason,
      message: details,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Handle security violations
   */
  handleSecurityViolation(res, securityCheck, authContext) {
    this.logSecurityEvent('security_violation', {
      reason: securityCheck.reason,
      riskScore: securityCheck.riskScore,
      failedChecks: securityCheck.failedChecks,
      ipAddress: authContext.ipAddress,
      userAgent: authContext.userAgent
    });
    
    // Clear authentication cookies for security
    this.clearAuthenticationCookies(res);
    
    return res.status(403).json({
      error: 'security_violation',
      reason: securityCheck.reason,
      message: 'Security check failed',
      riskScore: securityCheck.riskScore,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * SECURITY FIX: Clear authentication cookies including prefixed variants
   */
  clearAuthenticationCookies(res) {
    const req = res.req;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // SECURITY FIX: Match cookie clearing options with setting options
    const isHttpsRequest = req?.secure || 
                          req?.headers?.['x-forwarded-proto'] === 'https' ||
                          req?.headers?.['x-forwarded-ssl'] === 'on' ||
                          req?.connection?.encrypted ||
                          req?.protocol === 'https';
                          
    const secureFlag = isDevelopment ? isHttpsRequest : (SecurityConfig.cookies.secure || !isDevelopment);
    const sameSitePolicy = isDevelopment ? 
      (secureFlag ? 'none' : 'lax') : 
      (SecurityConfig.cookies.sameSite || 'strict');
      
    let domainSetting;
    if (isDevelopment) {
      domainSetting = undefined;
    } else {
      const host = req?.get('Host') || SecurityConfig.cookies.domain;
      if (host && host.includes('.')) {
        const parts = host.split('.');
        if (parts.length > 2) {
          domainSetting = `.${parts.slice(-2).join('.')}`;
        } else {
          domainSetting = `.${host}`;
        }
      } else {
        domainSetting = SecurityConfig.cookies.domain;
      }
    }
    
    const cookieOptions = {
      httpOnly: true,
      secure: secureFlag,
      sameSite: sameSitePolicy,
      domain: domainSetting,
      path: '/'
    };
    
    // Clear all possible cookie variants (prefixed and non-prefixed)
    const cookieNames = ['accessToken', 'refreshToken', 'csrfToken'];
    const prefixes = ['', '__Secure-', '__Host-'];
    
    cookieNames.forEach(cookieName => {
      prefixes.forEach(prefix => {
        const fullName = `${prefix}${cookieName}`;
        const options = cookieName === 'csrfToken' ? 
          { ...cookieOptions, httpOnly: false } : cookieOptions;
        res.clearCookie(fullName, options);
      });
    });
    
    console.log('🗑️ Cleared all authentication cookies with prefixes');
  }
  
  /**
   * Respond with unauthorized status
   */
  respondUnauthorized(res, reason, message) {
    return res.status(401).json({
      error: 'unauthorized',
      reason,
      message,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * CSRF Protection Middleware
   */
  csrfProtection = async (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const csrfToken = req.get('X-CSRF-Token') || req.body?._csrf;
    const csrfCookie = this.extractCSRFToken(req); // SECURITY FIX: Use consistent CSRF token extraction
    
    if (!csrfToken || !csrfCookie) {
      return res.status(403).json({
        error: 'csrf_token_missing',
        message: 'CSRF token is required'
      });
    }
    
    if (!req.user) {
      return res.status(401).json({
        error: 'authentication_required',
        message: 'Authentication required for CSRF validation'
      });
    }
    
    const accessTokenId = req.tokenMetadata?.tokenId;
    const isValid = await TokenService.verifyCSRFToken(csrfToken, accessTokenId, req.user.id);
    
    if (!isValid) {
      this.logSecurityEvent('csrf_validation_failed', {
        userId: req.user.id,
        ipAddress: req.authContext.ipAddress,
        userAgent: req.authContext.userAgent
      });
      
      return res.status(403).json({
        error: 'invalid_csrf_token',
        message: 'Invalid CSRF token'
      });
    }
    
    next();
  };
  
  /**
   * Role-based authorization middleware
   */
  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'authentication_required',
          message: 'Authentication required'
        });
      }
      
      const userRole = req.user.permissions?.role || 'user';
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        this.logSecurityEvent('authorization_failed', {
          userId: req.user.id,
          userRole,
          requiredRoles: allowedRoles,
          ipAddress: req.authContext.ipAddress
        });
        
        return res.status(403).json({
          error: 'insufficient_permissions',
          message: 'Insufficient permissions for this operation'
        });
      }
      
      next();
    };
  };
  
  /**
   * Scope-based authorization middleware
   */
  requireScope = (scopes) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'authentication_required',
          message: 'Authentication required'
        });
      }
      
      const userScopes = req.user.permissions?.scopes || [];
      const requiredScopes = Array.isArray(scopes) ? scopes : [scopes];
      
      const hasRequiredScope = requiredScopes.some(scope => 
        userScopes.includes(scope) || userScopes.includes('*')
      );
      
      if (!hasRequiredScope) {
        this.logSecurityEvent('scope_authorization_failed', {
          userId: req.user.id,
          userScopes,
          requiredScopes,
          ipAddress: req.authContext.ipAddress
        });
        
        return res.status(403).json({
          error: 'insufficient_scope',
          message: 'Insufficient scope for this operation',
          requiredScopes
        });
      }
      
      next();
    };
  };
  
  /**
   * Log security events
   */
  logSecurityEvent(event, data) {
    const logEntry = {
      timestamp: new Date(),
      event,
      source: 'authentication_middleware',
      ...data
    };
    
    console.log(`🛡️ Security Event: ${event}`, logEntry);
    
    // In production, send to security monitoring system
    // await SecurityMonitor.logEvent(logEntry);
  }
  
  /**
   * SECURITY FIX: Add CSRF protection method that can be called without instantiation
   */
  csrfProtectionMiddleware = (req, res, next) => {
    // SECURITY FIX: Check for autologin exemption
    const purpose = req.body?.purpose;
    const csrfToken = req.get('X-CSRF-Token');
    
    // SECURITY EXEMPTION: Allow autologin checks without CSRF (no prior session to get token)
    if (purpose === 'autologin_check' && !csrfToken) {
      console.log('🔓 CSRF exemption: Allowing autologin session check without CSRF token');
      return next();
    }
    
    const sessionCsrfToken = this.extractCSRFToken(req);
    
    console.log('🛡️ CSRF validation:', {
      purpose,
      hasHeaderToken: !!csrfToken,
      hasSessionToken: !!sessionCsrfToken,
      tokensMatch: csrfToken === sessionCsrfToken,
      userAgent: req.get('User-Agent')?.substring(0, 50) + '...'
    });
    
    // Check for missing CSRF tokens
    if (!csrfToken) {
      console.log('❌ CSRF validation failed: Missing X-CSRF-Token header');
      return res.status(403).json({
        error: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token required in X-CSRF-Token header',
        needsCsrfToken: true
      });
    }
    
    if (!sessionCsrfToken) {
      console.log('❌ CSRF validation failed: Missing session CSRF token');
      return res.status(403).json({
        error: 'CSRF_SESSION_TOKEN_MISSING',
        message: 'CSRF session token not found',
        needsCsrfToken: true
      });
    }
    
    // Validate CSRF token match
    if (csrfToken !== sessionCsrfToken) {
      console.log('❌ CSRF validation failed: Token mismatch');
      return res.status(403).json({
        error: 'CSRF_TOKEN_INVALID',
        message: 'CSRF token mismatch - possible CSRF attack',
        needsCsrfToken: true
      });
    }
    
    console.log('✅ CSRF validation passed');
    next();
  };
  
  /**
   * Get rate limiters for export
   */
  getRateLimiters() {
    return {
      login: this.loginLimiter,
      refresh: this.refreshLimiter,
      api: this.apiLimiter
    };
  }
}

const authMiddleware = new AuthenticationMiddleware();

export default authMiddleware;
