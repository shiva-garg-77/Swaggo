/**
 * Security Headers and CORS Configuration
 * Implements comprehensive security headers and CORS policies
 */

import { getEnvValue, isDevelopment } from '../Config/EnvironmentValidator.js';

/**
 * Enhanced Security Headers Middleware with Development Support
 */
export const securityHeaders = (req, res, next) => {
  const developmentMode = isDevelopment();
  
  // Enhanced Content Security Policy (CSP) with development support
  const cspDirectives = [
    "default-src 'self'",
    // Enhanced script-src for development and production
    developmentMode 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* 127.0.0.1:* https://cdn.socket.io https://cdnjs.cloudflare.com"
      : "script-src 'self' 'unsafe-inline' https://cdn.socket.io https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: blob:",
    // SECURITY FIX: Enhanced connect-src with proper protocol support for sockets and service workers
    developmentMode
      ? "connect-src 'self' http://localhost:* http://127.0.0.1:* https://localhost:* https://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* data: blob: https: http:"
      : "connect-src 'self' wss: https: data: blob:",
    // CRITICAL FIX: Add worker-src for service workers
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  // Add upgrade-insecure-requests only in production
  if (!developmentMode) {
    cspDirectives.push("upgrade-insecure-requests");
  }
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // HTTP Strict Transport Security (HSTS) - production only
  if (!developmentMode) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  const permissionsPolicy = [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=(self)',
    'cross-origin-isolated=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=(self)',
    'geolocation=()',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=(self)',
    'midi=()',
    'navigation-override=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()'
  ];
  
  res.setHeader('Permissions-Policy', permissionsPolicy.join(', '));
  
  // Enhanced security headers with development compatibility
  res.setHeader('X-Powered-By', 'Swaggo-Secure-Backend');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // SECURITY FIX: Enhanced conditional security headers
  if (developmentMode) {
    // Development: Restricted cross-origin with specific endpoint allowance
    const isAuthEndpoint = req.originalUrl.includes('/auth/');
    
    if (isAuthEndpoint) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      console.log('🔧 Development: Cross-origin allowed for auth endpoint');
    } else {
      res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    }
    
    // Skip COEP and COOP in development to prevent blocking
    console.log('🔧 Development mode: Controlled CORS headers for security');
  } else {
    // Production: Strict security headers
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  }
  
  // SECURITY FIX: Add explicit CORS headers for credentials with Vary header
  const origin = req.headers.origin;
  
  // SECURITY FIX: Enhanced Vary header to prevent authentication and CORS caching issues
  // Cookie is critical for authentication state caching prevention
  const varyHeaders = [
    'Origin',                              // CORS origin dependency
    'Access-Control-Request-Method',       // CORS preflight method dependency
    'Access-Control-Request-Headers',      // CORS preflight headers dependency
    'Cookie',                              // SECURITY: Authentication state dependency
    'Authorization',                       // Bearer token authentication dependency
    'User-Agent'                          // Device/browser specific responses
  ];
  
  res.setHeader('Vary', varyHeaders.join(', '));
  
  // SECURITY FIX: Additional Vary headers for authentication endpoints
  const isAuthEndpoint = req.originalUrl.includes('/auth/');
  if (isAuthEndpoint) {
    // Authentication endpoints may vary based on these additional headers
    const authVaryHeaders = [
      'X-CSRF-Token',        // CSRF protection state
      'X-Device-Fingerprint', // Device identification
      'X-Request-ID',        // Request tracking
      'X-Forwarded-For',     // Proxy detection
      'X-Real-IP'            // Real IP detection
    ];
    
    const combinedVaryHeaders = [...varyHeaders, ...authVaryHeaders];
    res.setHeader('Vary', combinedVaryHeaders.join(', '));
    
    console.log('🔒 Enhanced Vary headers set for authentication endpoint');
    
    // SECURITY FIX: Strict cache control for authentication endpoints
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('🚫 Authentication endpoint caching disabled for security');
  }
  
  if (origin) {
    // Validate origin before setting CORS headers
    const isValidOrigin = developmentMode ? 
      (origin.includes('localhost') || origin.includes('127.0.0.1')) &&
      ['3000', '3001', '8000'].some(port => origin.includes(`:${port}`)) :
      corsOptions.origin(origin, () => {});
    
    if (isValidOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', [
        'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization',
        'X-CSRF-Token', 'X-Request-ID', 'Cookie', 'X-Browser-Strategy', 'X-Private-Mode'
      ].join(', '));
      
      console.log(`✅ CORS headers set for validated origin: ${origin}`);
    } else {
      console.warn(`🚨 CORS headers NOT set for invalid origin: ${origin}`);
    }
  }
  
  next();
};

/**
 * FIXED Issues #6-7: Enhanced CORS Configuration with consistent port handling
 * Addresses: Port Configuration Inconsistency & CORS Origin Mismatch
 */
export const corsOptions = {
  // Allowed origins with comprehensive port support
  origin: function (origin, callback) {
    // Get environment-specific configuration
    const isDev = isDevelopment();
    const backendPort = getEnvValue('PORT', 45799);
    
    // Enhanced list of allowed origins with consistent port configuration
    const allowedOrigins = [
      // FIXED: Use consistent backend port (45799) and common frontend ports
      'http://localhost:3000',    // Next.js frontend
      'http://127.0.0.1:3000',    // IPv4 localhost alias
      'http://localhost:45799',   // Backend self-reference
      'http://127.0.0.1:45799',   // Backend IPv4 self-reference
      // FIXED: Add HTTPS versions for secure context and production
      'https://localhost:3000',   // Next.js HTTPS development
      'https://127.0.0.1:3000',   // IPv4 HTTPS alias
      
      // Production domains
      'https://swaggo.com',
      'https://www.swaggo.com',
      'https://api.swaggo.com'
    ];
    
    // Add production origins from environment variables
    const allowedOriginsEnv = getEnvValue('ALLOWED_ORIGINS', '');
    if (allowedOriginsEnv) {
      const envOrigins = allowedOriginsEnv.split(',').map(origin => origin.trim());
      allowedOrigins.push(...envOrigins);
    }
    
    // SECURITY FIX: Enhanced development mode with proper validation
    if (isDevelopment()) {
      // Allow requests with no origin for development tools and server-to-server calls
      if (!origin) {
        console.log('✅ CORS: Allowing no-origin request (development mode)');
        return callback(null, true);
      }
      
      // SECURITY FIX: Flexible localhost port validation for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        // Enhanced port validation: allow common development ports
        const defaultPorts = ['3000', '3001', '3002', '8000', '8080', '8081', '5173', '4200', '5000', '5001', '45799'];
        
        // Allow custom dev ports from environment variable
        const devPortsEnv = getEnvValue('DEV_ALLOWED_PORTS', '');
        const envDevPorts = devPortsEnv ? devPortsEnv.split(',').map(p => p.trim()) : [];
        const allowedDevPorts = [...defaultPorts, ...envDevPorts];
        
        // Extract port from origin URL
        const portMatch = origin.match(/:([0-9]+)$/);
        const port = portMatch ? portMatch[1] : '80';
        
        // Validate port range and whitelist
        const portNum = parseInt(port);
        const isCommonDevPort = allowedDevPorts.includes(port);
        const isValidDevPortRange = portNum >= 3000 && portNum <= 9999; // Common dev range
        
        if (isCommonDevPort || isValidDevPortRange) {
          console.log(`✅ CORS: Allowing localhost development origin: ${origin} (port: ${port})`);
          return callback(null, true);
        } else {
          console.warn(`🚨 CORS: Blocking localhost origin with suspicious port: ${origin} (port: ${port})`);
          console.warn('Allowed dev ports:', allowedDevPorts.slice(0, 5) + '... or range 3000-9999');
          return callback(new Error(`CORS blocked: Port ${port} not in development whitelist`));
        }
      }
    }
    
    // Production mode: strict origin checking
    if (!origin) {
      console.warn('🚨 CORS: Blocking request with no origin (production mode)');
      return callback(new Error('Not allowed by CORS - no origin'));
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowing whitelisted origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked origin: ${origin}`);
      console.warn('Allowed origins:', allowedOrigins);
      callback(new Error(`Not allowed by CORS - origin ${origin} not in whitelist`));
    }
  },
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allowed headers including socket.io specific headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID',
    'X-Session-ID',
    'X-Device-ID',
    'X-Tab-ID',
    'X-Service-Count',
    'X-Refresh-Token',
    'X-CSRF-Token',
    'X-Client-Fingerprint',
    'X-Request-Signature',
    'X-Timestamp',
    'X-Device-Fingerprint',
    'X-Nonce',
    'Cache-Control',
    'Pragma',
    'Expires',
    // CRITICAL FIX: Socket.io specific headers
    'X-Socket-ID',
    'X-Socket-Transport',
    'Cookie',
    'Set-Cookie',
    // Service worker headers
    'X-Service-Worker',
    'X-Notification-Permission'
  ],
  
  // SECURITY FIX: Exposed headers that client can access (removed sensitive token headers)
  exposedHeaders: [
    'X-Total-Count',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'X-CSRF-Token'
  ],
  
  // Allow credentials (cookies, authorization headers) - CRITICAL for httpOnly cookies
  credentials: true,
  
  // Preflight cache duration
  maxAge: 86400, // 24 hours
  
  // Handle preflight requests properly
  preflightContinue: false,
  
  // Provide success status for legacy browsers
  optionsSuccessStatus: 204
};

/**
 * Enhanced CORS middleware with logging
 */
export const enhancedCors = (req, res, next) => {
  const origin = req.headers.origin;
  const method = req.method;
  
  // Log CORS requests in development
  if (isDevelopment()) {
    console.log(`🔗 CORS ${method} request from origin: ${origin || 'null'}`);
  }
  
  // Security: Log suspicious CORS requests
  if (origin && !corsOptions.origin(origin, () => {})) {
    console.warn(`🚨 Blocked CORS request from suspicious origin: ${origin}`);
    // Log additional details for security monitoring
    console.warn('Request details:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Request Security Logger
 */
export const requestSecurityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log security-relevant request information
  const securityInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Attach request ID to request object
  req.requestId = securityInfo.requestId;
  
  // Log request in development or for security events
  if (isDevelopment() || req.originalUrl.includes('/auth/')) {
    console.log(`📥 ${securityInfo.method} ${securityInfo.url} from ${securityInfo.ip} [${securityInfo.requestId}]`);
  }
  
  // Enhanced logging for authentication endpoints
  if (req.originalUrl.includes('/auth/')) {
    console.log('🔐 Auth request details:', {
      ...securityInfo,
      hasAuthHeader: !!req.headers.authorization,
      hasCookies: !!req.headers.cookie
    });
  }
  
  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      console.warn(`🐌 Slow request: ${securityInfo.method} ${securityInfo.url} took ${duration}ms [${securityInfo.requestId}]`);
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      console.warn(`❌ Error response: ${res.statusCode} for ${securityInfo.method} ${securityInfo.url} [${securityInfo.requestId}]`);
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * IP Whitelist Middleware (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Development mode - allow all
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Check if IP is in whitelist
    if (allowedIPs.length === 0) {
      console.warn('⚠️ IP whitelist is empty - allowing all IPs');
      return next();
    }
    
    if (allowedIPs.includes(clientIP)) {
      console.log(`✅ IP ${clientIP} allowed by whitelist`);
      return next();
    }
    
    console.warn(`🚨 IP ${clientIP} blocked by whitelist`);
    res.status(403).json({
      success: false,
      message: 'Access denied - IP not in whitelist',
      code: 'IP_NOT_WHITELISTED'
    });
  };
};

/**
 * Authentication Cache Control Middleware
 * Prevents caching of sensitive authentication data
 */
export const authCacheControl = (req, res, next) => {
  // CRITICAL FIX: Prevent caching of authentication responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Additional security for sensitive endpoints
  if (req.originalUrl.includes('/auth/')) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    console.log(`🛡️ Applied auth cache control to: ${req.originalUrl}`);
  }
  
  next();
};

/**
 * API Key Validation Middleware
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required',
      code: 'API_KEY_MISSING'
    });
  }
  
  // Validate API key format
  if (!/^[a-zA-Z0-9_-]{32,}$/.test(apiKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key format',
      code: 'API_KEY_INVALID_FORMAT'
    });
  }
  
  // In production, validate against database or environment variable
  const validApiKeys = process.env.VALID_API_KEYS ? 
    process.env.VALID_API_KEYS.split(',').map(key => key.trim()) : 
    ['dev-api-key-12345678901234567890'];
  
  if (!validApiKeys.includes(apiKey)) {
    console.warn(`🚨 Invalid API key attempt: ${apiKey.substr(0, 8)}...`);
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      code: 'API_KEY_INVALID'
    });
  }
  
  // Attach API key info to request
  req.apiKey = {
    key: apiKey,
    validated: true,
    timestamp: new Date()
  };
  
  next();
};

export default {
  securityHeaders,
  corsOptions,
  enhancedCors,
  requestSecurityLogger,
  authCacheControl,
  ipWhitelist,
  validateApiKey
};
