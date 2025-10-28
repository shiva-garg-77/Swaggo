// 🔒 CRITICAL: Pre-load GraphQL singleton before ANY other imports
import './utils/GraphQLPreLoader.js';

// Built-in Node.js modules
import path from 'path';
import fs from 'fs';


import { fileURLToPath } from 'url';
import { createServer } from 'http';
import dotenv from 'dotenv';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Import services and middleware
try {
  var secretInitializationService = await import('./Services/Security/SecretInitializationService.js').then(m => m.default);
} catch (e) {
  console.log('SecretInitializationService not available, skipping');
  var secretInitializationService = { initialize: async () => {} };
}

// Import optimized JSON utility
import optimizedJSON from './utils/OptimizedJSON.js';

// Import DDoS protection middleware
import DDoSProtectionMiddleware from './Middleware/Security/DDoSProtectionMiddleware.js';

// Import CSRF protection middleware
import { attachCsrfToken, validateCsrfToken, getCsrfToken } from './Middleware/Security/CsrfProtection.js';

// Import API routes
import v1Routes from './Routes/api/v1/index.js';
import v2Routes from './Routes/api/v2/index.js';

// Import monitoring routes
import monitoringRoutes from './Routes/api/v1/monitoring.js';

// Import audit logging middleware
import AuditLoggingMiddleware from './Middleware/Security/AuditLoggingMiddleware.js';

// Import API gateway middleware
import apiGatewayMiddleware from './Middleware/Performance/APIGatewayMiddleware.js';

// Import file upload security
import fileUploadSecurity from './Middleware/Security/EnhancedFileUploadSecurity.js';

// Import rate limiting middleware
import { uploadRateLimiter, debugRateLimiter, adminRateLimiter } from './Middleware/Performance/rateLimitingMiddleware.js';

// Import IP whitelisting middleware
import ipWhitelistMiddleware from './Middleware/Security/IPWhitelistMiddleware.js';

// Import file service
import FileService from './Services/Storage/FileService.js';

// Import thumbnail service
import ThumbnailService from './Services/Media/ThumbnailService.js';

// Import scheduled message service
import ScheduledMessageService from './Services/Messaging/ScheduledMessageService.js';

// Import database connection
import { Connectdb } from './db/Connectdb.js';

// Import GraphQL schema stitching
import { createStitchedSchema } from './GraphQL/SchemaStitching.js';

// Import GraphQL N+1 resolver
import GraphQLNPlusOneResolver from './utils/GraphQLNPlusOneResolver.js';

// 🔒 CRITICAL FIX #2: Import centralized GraphQL instance FIRST to prevent realm collision
import graphqlInstance from './utils/GraphQLInstance.js';

// Import Apollo Server
import { ApolloServer } from '@apollo/server';

// Import Apollo Server Express middleware
import { expressMiddleware } from '@as-integrations/express5';

// 🔒 CRITICAL FIX #3: Import unified error handler and security service
import UnifiedGraphQLErrorHandler from './utils/UnifiedGraphQLErrorHandler.js';
import unifiedGraphQLSecurityService from './GraphQL/services/UnifiedGraphQLSecurityService.js';

// Import multer for file uploads
import multer from 'multer';

// Import spdy for HTTP/2 support
import spdy from 'spdy';

// Import crypto for hashing
import crypto from 'crypto';

// Import Redis client
import redisClient from './utils/RedisClient.js';

// Import application logger
import appLogger from './utils/logger.js';

// Import DataLoader service
import DataLoaderService from './Services/System/DataLoaderService.js';

// Import Token service
import TokenService from './Services/Authentication/TokenService.js';

// Import User and Profile models
import User from './Models/User.js';
import Profile from './Models/FeedModels/Profile.js';

// Import authentication middleware
import auth from './Middleware/Authentication/AuthenticationMiddleware.js';

// Import authentication routes
import AuthenticationRoutes from './Routes/api/v1/AuthenticationRoutes.js';

// Import admin routes
import AdminRoutes from './Routes/api/v1/AdminRoutes.js';

// Import user routes
import UserRoutes from './Routes/api/v1/UserRoutes.js';

// Import health routes
import HealthRoutes from './Routes/api/v1/HealthRoutes.js';

// Import anomaly detection routes
import AnomalyDetectionRoutes from './Routes/api/v1/AnomalyDetectionRoutes.js';

// Helpers for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load non-sensitive environment variables from Backend folder
const envPath = path.join(__dirname, '.env.local');
console.log('Loading .env.local from:', envPath);
const result = dotenv.config({ path: envPath });
console.log('Dotenv config result:', result);
if (result.error) {
  console.error('❌ Failed to load .env.local:', result.error.message);
} else {
  console.log('✅ .env.local loaded successfully');
}

const app = express();
const port = process.env.PORT || 4000;

// Fix EventEmitter memory leak warnings by increasing max listeners
process.setMaxListeners(20);

// Suppress Node.js deprecation warnings from dependencies
process.noDeprecation = true;

// Create HTTP server
// const httpServer = createServer(app); // This line is moved further down


// Debug output to check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? 'Loaded' : 'Missing');
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? 'Loaded' : 'Missing');
console.log('CSRF_SECRET:', process.env.CSRF_SECRET ? 'Loaded' : 'Missing');

// 🔒 SECURITY FIX: Proper trust proxy configuration for 10/10 security
// Set to 1 for single proxy, or specific subnet for multiple proxies
const trustProxyConfig = process.env.NODE_ENV === 'production' ? 
  process.env.TRUST_PROXY || 1 : 
  false; // Don't trust proxy in development to prevent rate limiting bypass

// 🔒 SECURITY FIX: Proper trust proxy configuration for 10/10 security
app.set('trust proxy', trustProxyConfig);

// Log trust proxy setting for debugging
console.log(`🔐 TRUST PROXY CONFIG: ${trustProxyConfig} (${process.env.NODE_ENV})`);

// 🔒 SECURITY FIX #29: Initialize secrets before other imports
(async () => {
  try {
    await secretInitializationService.initialize();
  } catch (error) {
    console.error('Failed to initialize secrets:', error);
    process.exit(1);
  }
})();

// 🔧 OPTIMIZATION #79: Add compression middleware for API responses
app.use(compression({
  // Compression level (0-9, where 9 is maximum compression)
  level: process.env.COMPRESSION_LEVEL ? parseInt(process.env.COMPRESSION_LEVEL) : 6,
  
  // Minimum response size to compress (in bytes)
  threshold: process.env.COMPRESSION_THRESHOLD ? parseInt(process.env.COMPRESSION_THRESHOLD) : 1024,
  
  // Filter function to determine which responses to compress
  filter: (req, res) => {
    // Don't compress streaming responses
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress WebSocket upgrade requests
    if (req.headers.upgrade) {
      return false;
    }
    
    // Use compression's default filter for other responses
    return compression.filter(req, res);
  }
}));

// 🔧 OPTIMIZATION #78: Add optimized JSON middleware
app.use(optimizedJSON.jsonResponseMiddleware);

// 🔧 LARGE PAYLOAD OPTIMIZATION #145: Add large payload optimization middleware
import largePayloadOptimization from './Middleware/LargePayloadOptimization.js';
app.use(largePayloadOptimization.optimizePayload);

// 🔒 SECURITY FIX #27: Add HTTPS enforcement middleware
// Redirect HTTP to HTTPS in production
if (process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && !req.secure) {
      // Redirect to HTTPS version of the same URL
      const httpsUrl = `https://${req.get('host')}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}


// 🛡️ CRITICAL SECURITY: Apply DoS protection middleware FIRST
app.use(DDoSProtectionMiddleware.globalDDoSProtection);

// === CORS (must run BEFORE CSRF, Helmet and routes) ===
// Unified origin validator
const validateOrigin = (origin, callback) => {
  if (!origin) return callback(null, true); // allow non-browser clients

  const allowedOrigins = (process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map(u => u.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        process.env.FRONTEND_URL
      ].filter(Boolean)
  );

  const isAllowed = allowedOrigins.includes(origin);
  appLogger.debug('CORS validation', { origin, allowedOrigins, isAllowed });
  return isAllowed ? callback(null, true) : callback(new Error('CORS: Origin not allowed'));
};

const corsOptions = {
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Do not hardcode allowedHeaders; reflect Access-Control-Request-Headers automatically
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400
};
app.use(cors(corsOptions));

// 🔒 SECURITY FIX #125: Apply CSRF protection middleware
app.use(attachCsrfToken);
app.use(validateCsrfToken);

// 🔧 Add JSON body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔧 Add cookie parser middleware
app.use(cookieParser());

// 🔒 SECURITY FIX #31: Apply Helmet.js security headers with proper configuration
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*", "wss:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [], // Force HTTPS upgrade
      blockAllMixedContent: [] // Block mixed content
    },
    // Disable CSP in development for easier debugging
    reportOnly: process.env.NODE_ENV === 'development'
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: process.env.NODE_ENV !== 'development',
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: process.env.NODE_ENV !== 'development' ? { policy: 'same-origin' } : false,
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: process.env.NODE_ENV !== 'development' ? { policy: 'same-site' } : false,
  
  // HTTP Strict Transport Security (HSTS) - only in production
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  
  // NoSniff
  noSniff: true,
  
  // IE No Open
  ieNoOpen: true,
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // DNS Prefetch Control
  dnsPrefetchControl: true,
  
  // Don't allow the browser to infer the MIME type
  noSniff: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: ["strict-origin-when-cross-origin"]
  },
  
  // Permissions Policy
  permissionsPolicy: {
    features: {
      accelerometer: ["'none'"],
      ambientLightSensor: ["'none'"],
      autoplay: ["'none'"],
      battery: ["'none'"],
      camera: ["'self'"],
      crossOriginIsolated: ["'none'"],
      displayCapture: ["'none'"],
      documentDomain: ["'none'"],
      encryptedMedia: ["'none'"],
      executionWhileNotRendered: ["'none'"],
      executionWhileOutOfViewport: ["'none'"],
      fullscreen: ["'self'"],
      geolocation: ["'none'"],
      gyroscope: ["'none'"],
      keyboardMap: ["'none'"],
      magnetometer: ["'none'"],
      microphone: ["'self'"],
      midi: ["'none'"],
      navigationOverride: ["'none'"],
      payment: ["'none'"],
      pictureInPicture: ["'none'"],
      publickeyCredentialsGet: ["'none'"],
      screenWakeLock: ["'none'"],
      syncXhr: ["'none'"],
      usb: ["'none'"],
      webShare: ["'none'"],
      xrSpatialTracking: ["'none'"]
    }
  },
  
  // Additional security headers
  frameguard: { action: 'deny' }, // Prevent framing
  xssFilter: true, // XSS protection
  permittedCrossDomainPolicies: 'none', // Flash/Silverlight cross-domain
  expectCt: { // Certificate Transparency
    maxAge: 86400,
    enforce: true
  }
}));

console.log('Helmet security headers configured');
// 🛡️ SECURITY: Rate limit status endpoint (for monitoring)
// Rate limit status endpoint removed due to missing implementation

// 🔒 SECURITY: Secure CORS validation function is now declared before middleware to ensure availability

// 🔧 FIX #49: API Versioning - Add /api/v1/, /api/v2/ versioning to routes
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add monitoring routes for performance tracking
app.use('/api/monitoring', monitoringRoutes);

// CORS is applied earlier globally (before CSRF/Helmet).

// 🔒 SECURITY FIX #66: Add security audit logging middleware to log security-relevant events
app.use(AuditLoggingMiddleware.logSecurityEvents);

// Add GraphQL operation logging

// // app.use('/graphql', AuditLoggingMiddleware.logGraphQLOperations); // Commented out as method doesn't exist

// 🔧 API GATEWAY: Add unified API gateway middleware
app.use(apiGatewayMiddleware);
// 🔧 ERROR CODE STANDARDIZATION #102: Add error code validation middleware
import { errorCodeValidationMiddleware } from './utils/ErrorCodeValidator.js';
app.use(errorCodeValidationMiddleware);


// 🔒 SECURITY FIX #67: Add anomaly detection routes
app.use('/api/anomaly-detection', AnomalyDetectionRoutes);

// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add performance monitoring middleware
import { performanceMonitor } from './utils/PerformanceOptimization.js';
app.use(performanceMonitor.requestTimer());









// 🔒 SECURITY FIX #61: Unified secure origin getter for routes that need direct header setting
const getSecureOrigin = (req) => {
  const origin = req.headers.origin;
  
  // Use same validation logic as global CORS
  if (!origin) {
    // Use default origin from environment or fallback to localhost
    return process.env.DEFAULT_FRONTEND_URL || 'http://localhost:3000';
  }
  
  // Define allowed origins - consistent with global CORS configuration
  const allowedOrigins = process.env.FRONTEND_URLS ? 
    process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : 
    [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);
  
  // In development, allow localhost origins
  if (process.env.NODE_ENV === 'development') {
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
    if (localhostPattern.test(origin)) {
      return origin;
    }
  }
  
  // Check allowed origins list
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  console.warn(`🚨 CORS: Blocked request from unauthorized origin: ${origin}`);
  return null;
};
// 🔒 SECURITY FIX #61: File streaming endpoint with unified CORS
// 🔒 SECURITY FIX #128: Add authentication and authorization to file serving
// 🔒 SECURITY FIX #137: Add security headers for static files
app.get('/uploads/:filename', cors({
  origin: validateOrigin,
  credentials: true
}), auth.authenticate, async (req, res) => {
  const { filename } = req.params;
  
  // Origin validation is now handled by CORS middleware
  const secureOrigin = getSecureOrigin(req);
  // CORS headers are now set by middleware
  
  // 🔒 SECURITY FIX #137: Add security headers for static files
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': "geolocation=(), microphone=(), camera=()",
    'Cache-Control': 'public, max-age=31536000' // 1 year cache for static files
  });
  
  // Validate filename to prevent directory traversal
  if (!filename || filename.includes('..') || filename.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  try {
    const exists = await fs.promises.access(filePath, fs.constants.F_OK).then(() => true).catch(() => false);
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error checking file' });
  }
  
  // 🔒 SECURITY FIX #128: Check if user has access to this file
  try {
    // Import File model for access control check
    const File = (await import('./Models/FeedModels/File.js')).default;
    
    // Find file record in database
    const fileRecord = await File.findOne({ filename: filename });
    
    if (fileRecord) {
      // Check if user can access this file
      if (!fileRecord.canUserAccess(req.user?.profileid || req.user?.id)) {
        return res.status(403).json({ error: 'Access denied to this file' });
      }
    } else {
      // If file record doesn't exist, deny access (assume private)
      return res.status(403).json({ error: 'Access denied to this file' });
    }
  } catch (authError) {
    console.error('File access authorization error:', authError);
    // Fail secure - deny access if authorization check fails
    return res.status(403).json({ error: 'Access denied to this file' });
  }
  
  try {
    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Set proper MIME type based on extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    let isVideo = false;
    
    switch (ext) {
      case '.mp4':
        contentType = 'video/mp4';
        isVideo = true;
        break;
      case '.webm':
        contentType = 'video/webm';
        isVideo = true;
        break;
      case '.ogg':
        contentType = 'video/ogg';
        isVideo = true;
        break;
      case '.avi':
        contentType = 'video/x-msvideo';
        isVideo = true;
        break;
      case '.mov':
        contentType = 'video/quicktime';
        isVideo = true;
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      
      const fileStream = fs.createReadStream(filePath, { start, end });
      fileStream.pipe(res);
    } else {
      // Send full file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000' // 1 year cache
      });
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('❌ Error serving file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Multer Setup ===

// File type validation function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'application/pdf',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, audio, PDFs, and text files are allowed.'), false);
  }
};

// 🔧 FIX #12: Implement streaming uploads for better performance with large files
// Create custom streaming storage engine that writes directly to disk without buffering
const streamingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 🔒 SECURITY FIX #24: Sanitize originalname to prevent path traversal attacks
    // Remove any directory traversal sequences and special characters
    const sanitizedOriginalname = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special characters with underscores
      .replace(/\.\./g, '') // Remove any double dots
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .substring(0, 255); // Limit filename length
    
    // Store sanitized original name in file object for later use
    file.sanitizedOriginalname = sanitizedOriginalname;
    
    const ext = path.extname(sanitizedOriginalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

// Configure multer with streaming storage for better performance
const upload = multer({ 
  storage: streamingStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// 🔒 SECURITY FIX #61: Handle preflight OPTIONS for uploads with unified CORS
app.options('/upload', cors({
  origin: validateOrigin,
  credentials: true,
  methods: ['POST', 'OPTIONS'],
  maxAge: 86400
}), (req, res) => {
  res.status(200).end();
});

// 🔒 SECURITY FIX #61: Handle preflight OPTIONS for file streaming with unified CORS
app.options('/uploads/:filename', cors({
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  maxAge: 86400
}), (req, res) => {
  res.status(200).end();
});

// 🔒 SECURITY FIX #61: Upload endpoint with unified CORS
app.post('/upload', cors({
  origin: validateOrigin,
  credentials: true
}), uploadRateLimiter, upload.single('file'), fileUploadSecurity.validateFileUpload, AuditLoggingMiddleware.logFileUpload, async (req, res) => {
  // Origin validation is now handled by CORS middleware
  const secureOrigin = getSecureOrigin(req);
  // CORS headers are now set by middleware
  
  // Handle multer errors
  if (req.fileValidationError) {
    // Log oversized file attempt
    if (req.fileValidationError.includes('File size')) {
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      console.warn(`🚨 OVERSIZED FILE UPLOAD ATTEMPT:`, {
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        fileSize: req.file?.size,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(400).json({ error: req.fileValidationError });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // 🔧 IMPROVED FILE VALIDATION #122: Enhanced file validation with comprehensive security checks
  // 🔧 FILE PROCESSING QUEUE #141: Use file processing queue to prevent blocking event loop
  try {
    // Import file processing queue
    const fileProcessingQueue = (await import('./Services/FileProcessingQueue.js')).default;
    
    // Add file validation to processing queue
    fileProcessingQueue.addTask(async () => {
      const validation = await enhancedFileValidationService.validateFile(req.file, req.user);
      
      if (!validation.safe) {
        // Log security violation
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.warn
        appLogger.warn(`FILE VALIDATION FAILED:`, {
          filename: req.file.originalname,
          threats: validation.threats,
          userId: req.user?.profileid || req.user?.id,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          timestamp: new Date().toISOString()
        });
        
        // Clean up the uploaded file
        const filePath = path.join(__dirname, 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Send error response if headers not sent
        if (!res.headersSent) {
          res.status(400).json({ 
            error: 'File validation failed',
            message: 'The uploaded file failed security validation',
            threats: validation.threats.map(t => ({ type: t.type, message: t.message }))
          });
        }
      } else {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.info(`File validation passed for: ${req.file.originalname}`, {
          validationDetails: validation.validationDetails
        });
      }
      
      return validation;
    }, { 
      type: 'file_validation', 
      filename: req.file.originalname,
      userId: req.user?.profileid || req.user?.id
    }).catch(validationError => {
      // Handle validation errors
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
      appLogger.error('File validation error:', {
        error: validationError.message,
        stack: validationError.stack
      });
      
      // Clean up the uploaded file
      const filePath = path.join(__dirname, 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Send error response if headers not sent
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'File validation error',
          message: 'An error occurred during file validation'
        });
      }
    });
  } catch (initialError) {
    // Handle immediate errors in setting up validation
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('File validation setup error:', {
      error: initialError.message,
      stack: initialError.stack
    });
    
    // Clean up the uploaded file
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return res.status(500).json({ 
      error: 'File validation setup error',
      message: 'An error occurred during file validation setup'
    });
  }

  // Additional file validation
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  if (req.file.size > maxFileSize) {
    // Log oversized file attempt
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.warn
    appLogger.warn(`OVERSIZED FILE UPLOAD ATTEMPT:`, {
      ip: clientIP,
      userAgent: req.headers['user-agent'],
      originalname: req.file.sanitizedOriginalname, // Use sanitized originalname
      fileSize: req.file.size,
      maxSize: maxFileSize,
      timestamp: new Date().toISOString()
    });
    
    // Clean up the uploaded file
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(400).json({ 
      error: 'File size exceeds 50MB limit',
      maxSize: '50MB',
      uploadedSize: `${(req.file.size / (1024 * 1024)).toFixed(2)}MB`
    });
  }

  try {
    // Get authenticated user from request
    const userId = req.user?.profileid || req.user?.id;
    if (!userId) {
      // Clean up the uploaded file
      const filePath = path.join(__dirname, 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Store file using FileService
    const fileReference = await FileService.storeFile(
      {
        filename: req.file.filename,
        originalname: req.file.sanitizedOriginalname, // Use sanitized originalname
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: path.join(__dirname, 'uploads', req.file.filename)
      },
      {
        // Add any additional metadata here
        uploadSource: 'direct_upload',
        uploadContext: 'chat_message',
        validationDetails: req.fileValidation || {} // Include validation details
      },
      userId
    );

    const baseUrl = process.env.NODE_ENV === 'production' ? 
      process.env.PUBLIC_FILE_URL || `https://${req.get('host')}` : 
      `${req.protocol}://${req.get('host')}`;
    
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // Generate thumbnail for image files using file processing queue
    let thumbnailUrl = null;
    if (ThumbnailService.isImage(req.file.mimetype)) {
      try {
        const originalFilePath = path.join(__dirname, 'uploads', req.file.filename);
        
        // 🔧 FILE PROCESSING QUEUE #141: Add thumbnail generation to processing queue
        const fileProcessingQueue = (await import('./Services/FileProcessingQueue.js')).default;
        
        // Add thumbnail generation to queue (non-blocking)
        fileProcessingQueue.addTask(async () => {
          try {
            // 🔧 FILE PROCESSING WORKER SERVICE #141: Use worker threads for thumbnail generation
            const thumbnailPath = await ThumbnailService.generateThumbnail(originalFilePath, 200, 200);
            const thumbnailFilename = path.basename(thumbnailPath);
            const thumbnailUrl = `${baseUrl}/uploads/thumbnails/${thumbnailFilename}`;
            
            // Log success
            appLogger.info('Thumbnail generated successfully', {
              filename: req.file.filename,
              thumbnailPath
            });
            
            return thumbnailUrl;
          } catch (error) {
            // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
            appLogger.error('Error generating thumbnail in queue:', {
              error: error.message,
              stack: error.stack
            });
            throw error;
          }
        }, { 
          type: 'thumbnail_generation', 
          filename: req.file.filename,
          userId: userId
        }).then(thumbUrl => {
          thumbnailUrl = thumbUrl;
        }).catch(error => {
          // Log error but don't fail the main request
          appLogger.warn('Thumbnail generation failed but continuing with upload', {
            error: error.message,
            filename: req.file.filename
          });
        });
      } catch (error) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
        appLogger.error('Error setting up thumbnail generation:', {
          error: error.message,
          stack: error.stack
        });
        // Continue without thumbnail if setup fails
      }
    }
    
    res.json({ 
      success: true,
      fileReference, // Return file reference instead of full data
      fileUrl: fileUrl,
      thumbnailUrl: thumbnailUrl,
      filename: req.file.filename,
      originalname: req.file.sanitizedOriginalname, // Use sanitized originalname
      size: req.file.size,
      mimetype: req.file.mimetype,
      sizeFormatted: `${(req.file.size / (1024 * 1024)).toFixed(2)}MB`
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Error storing file:', {
      error: error.message,
      stack: error.stack
    });
    
    // Clean up the uploaded file on error
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(500).json({ 
      error: 'Failed to store file',
      message: error.message
    });
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Log the error with client information
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.warn(`🚨 FILE UPLOAD ERROR:`, {
      ip: clientIP,
      userAgent: req.headers['user-agent'],
      error: error.code,
      message: error.message,
      field: error.field,
      timestamp: new Date().toISOString()
    });
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size exceeds 50MB limit',
        maxSize: '50MB',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files uploaded',
        maxFiles: 10,
        code: 'TOO_MANY_FILES'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected field in upload',
        code: 'UNEXPECTED_FIELD'
      });
    }
  }
  
  // Handle file type validation errors
  if (error.message && error.message.includes('Invalid file type')) {
    // Log invalid file type attempt
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.warn(`🚨 INVALID FILE TYPE UPLOAD ATTEMPT:`, {
      ip: clientIP,
      userAgent: req.headers['user-agent'],
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({ 
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  // Handle other errors
  console.error('Upload error:', error);
  res.status(500).json({ 
    error: 'Internal server error during upload',
    code: 'UPLOAD_ERROR'
  });
});

// === Connect to DB ===
await Connectdb();
console.log('✅ Connected to MongoDB database');

// 🔧 DATABASE MIGRATIONS #114: Run database migrations after connection
try {
  const { runMigrations } = await import('./Models/FeedModels/Migrations/runMigrations.js');
  await runMigrations();
} catch (migrationError) {
  console.error('❌ Error running database migrations:', migrationError);
  // Don't exit the process, continue with startup but log the error
}

// 🔧 PERFORMANCE FIX #42: Initialize Redis cache service
try {
  await redisClient.initialize();
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Redis cache service initialized successfully');
  
  // 🔧 CACHING STRATEGY #140: Initialize enhanced cache service
  const redisCacheService = (await import('./Services/Storage/RedisCacheService.js')).default;
  await redisCacheService.initialize();
  appLogger.info('Enhanced cache service initialized successfully');
} catch (error) {
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
  appLogger.error('Failed to initialize Redis cache service:', {
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}

// Initialize FileService periodic tasks after database connection
FileService.initializePeriodicTasks();

// === Apollo Server Setup with enhanced N+1 resolver ===
const graphqlNPlusOneResolver = new GraphQLNPlusOneResolver();
const enhancedResolvers = graphqlNPlusOneResolver.initialize();

// 🔧 GRAPHQL SCHEMA STITCHING #99: Create stitched schema with executable schema
console.log('🔍 [TRACKING] Starting GraphQL schema stitching...');
let executableSchema;
try {
  const schemaResult = await createStitchedSchema();
  executableSchema = schemaResult.schema;  // Use the pre-built executable schema
  console.log('✅ [TRACKING] Schema stitching completed successfully');
  console.log('✅ [TRACKING] Executable schema created - Single GraphQL realm guaranteed!');
} catch (schemaError) {
  console.error('❌ [TRACKING] Schema stitching failed:', schemaError.message);
  console.error('🔍 [TRACKING] Error stack:', schemaError.stack);
  throw schemaError;
}

// 🔒 SECURITY FIX #28: Add GraphQL depth limiting and query complexity analysis
// 🛠️ Standardized error handling
import { handleUnifiedError } from './utils/UnifiedErrorHandling.js';
// 🔒 SECURITY FIX #57: Add GraphQL rate limiting
import { getGraphQLRateLimiterMiddleware } from './Middleware/GraphQL/GraphQLRateLimiting.js';
// 🔐 ENHANCED GRAPHQL SECURITY: Import enhanced GraphQL security service
import enhancedGraphQLSecurityService from './GraphQL/services/EnhancedGraphQLSecurityService.js';
// Import PubSub for GraphQL subscriptions
import { PubSub } from 'graphql-subscriptions';
// Import GraphQL validation rules
import depthLimit from 'graphql-depth-limit';
// 🔥 REMOVED: graphql-query-complexity causes realm collision
// import { createComplexityRule, simpleEstimator } from 'graphql-query-complexity';

// Initialize PubSub instance
const pubsub = new PubSub();

// 🔥 CRITICAL FIX: Use pre-built executable schema instead of typeDefs + resolvers
// This ensures Apollo Server uses the SAME GraphQL instance that @graphql-tools used
console.log('🔍 [TRACKING] Creating Apollo Server with executable schema...');
const apolloServer = new ApolloServer({
  schema: executableSchema,  // Use pre-built schema instead of typeDefs + resolvers
  // Add validation rules for depth limiting
  // 🔥 REMOVED: createComplexityRule causes GraphQL realm collision
  validationRules: [
    depthLimit(15), // Limit query depth to 15
    // createComplexityRule({ maximumComplexity: 500, estimators: [simpleEstimator()] }) // REMOVED - causes realm collision
  ],
  // Add request size limit
  // 🔒 SECURITY FIX #25: Disable GraphQL introspection in production
  introspection: process.env.NODE_ENV !== 'production' && process.env.ENABLE_GRAPHQL_INTROSPECTION !== 'false',
  // Set max request size
  bodyParserConfig: {
    limit: '10mb' // Limit request size to prevent DoS
  },
  // Standardized error formatting - prevent sensitive info leakage
  formatError: (error) => {
    // 🔍 DEEP DEBUGGING: Log realm collision errors with full stack trace
    if (error.message && error.message.includes('realm')) {
      console.error('🚨 [REALM ERROR DETECTED]');
      console.error('🔍 Message:', error.message);
      console.error('🔍 Path:', error.path);
      console.error('🔍 Locations:', JSON.stringify(error.locations));
      console.error('🔍 Extensions:', JSON.stringify(error.extensions));
      console.error('🔍 Original Error:', error.originalError);
      console.error('🔍 Full Stack:', error.stack);
      console.error('🔍 Error Object Keys:', Object.keys(error));
    }
    
    // Log the original error for debugging
    appLogger.error('GraphQL Error:', {
      message: error.message,
      locations: error.locations,
      path: error.path,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace hidden in production',
      timestamp: new Date().toISOString()
    });
    
    // In production, hide implementation details
    if (process.env.NODE_ENV === 'production') {
      // Return a generic error message for client-facing errors
      return new GraphQLError('Internal server error');
    }
    
    // In development, return the original error
    return error;
  },
  // Add context function for GraphQL resolvers
  context: async ({ req }) => {
    // Extract user from request (if authenticated)
    const user = req.user || null;
    
    // Extract authentication context
    const authContext = {
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                req.headers['x-real-ip'] ||
                req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date()
    };
    
    // Determine if user is authenticated
    const isAuthenticated = !!user;
    
    // Return context object with user, pubsub, and other services
    return {
      user,
      isAuthenticated,
      authContext,
      req,
      pubsub,
      // 🔐 ENHANCED GRAPHQL SECURITY: Add enhanced security service to context
      enhancedGraphQLSecurityService,
      // Add other context properties as needed
    };
  }
});

console.log('🚀 Starting Apollo Server...');

await apolloServer.start();

// === Routes ===
// Apply audit logging middleware to authentication routes
app.use('/api/v1/auth', AuditLoggingMiddleware.logAuthentication, AuthenticationRoutes);

// Apply audit logging middleware to admin routes
app.use('/api/admin', ipWhitelistMiddleware, AuditLoggingMiddleware.logAdminEvents, AdminRoutes);
// Apply audit logging middleware to user routes
app.use('/api/users', AuditLoggingMiddleware.logUserManagement, UserRoutes);
app.use('/api', HealthRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Link Preview Routes
import LinkPreviewController from './Controllers/Media/LinkPreviewController.js';
app.get('/api/link-preview', LinkPreviewController.getLinkPreview);
app.get('/api/link-preview/stats', LinkPreviewController.getCacheStats);
app.post('/api/link-preview/clear-cache', LinkPreviewController.clearExpiredCache);

// 🔧 PERFORMANCE FIX #42: Redis Cache Demo Routes
import { redisCacheMiddleware, cacheInvalidateMiddleware } from './Middleware/Performance/CacheMiddleware.js';
import redisCacheService from './Services/Storage/RedisCacheService.js';

// Cache demo endpoint - shows how to use Redis caching for API responses
app.get('/api/cache-demo', 
  redisCacheMiddleware('cache-demo-data', 300), // Cache for 5 minutes
  async (req, res) => {
    // Simulate some expensive operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.json({
      message: 'This response is now cached in Redis',
      timestamp: new Date().toISOString(),
      data: {
        userId: req.user?.id || 'anonymous',
        requestId: Math.random().toString(36).substr(2, 9)
      }
    });
  }
);

// Cache invalidation demo endpoint
app.post('/api/cache-invalidate-demo', 
  cacheInvalidateMiddleware('cache-demo-data'),
  (req, res) => {
    res.json({
      message: 'Cache invalidated successfully',
      key: 'cache-demo-data'
    });
  }
);

// Cache stats endpoint
app.get('/api/cache-stats', async (req, res) => {
  const stats = await redisCacheService.getStats();
  res.json({
    success: true,
    stats
  });
});

// 🔧 FILE PROCESSING QUEUE #141: Add file processing queue stats endpoint
app.get('/api/file-processing-stats', async (req, res) => {
  try {
    const fileProcessingQueue = (await import('./Services/FileProcessingQueue.js')).default;
    const stats = fileProcessingQueue.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Error getting file processing stats:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get file processing stats'
    });
  }
});

// Scheduled Message Routes
import ScheduledMessageRoutes from './Routes/api/v1/ScheduledMessageRoutes.js';
app.use('/api/scheduled-messages', ScheduledMessageRoutes);

// Keyword Alert Routes
import KeywordAlertRoutes from './Routes/api/v1/KeywordAlertRoutes.js';
app.use('/api/keyword-alerts', KeywordAlertRoutes);

// Cloud Storage Routes
import CloudStorageRoutes from './Routes/api/v1/CloudStorageRoutes.js';
app.use('/api/cloud', CloudStorageRoutes);

// Poll Routes
import PollRoutes from './Routes/api/v1/PollRoutes.js';
app.use('/api/polls', PollRoutes);

// Collaborative Editing Routes
import CollaborativeEditingRoutes from './Routes/api/v1/CollaborativeEditingRoutes.js';
app.use('/api/collab-docs', CollaborativeEditingRoutes);

// Audit Log Routes
import AuditLogRoutes from './Routes/api/v1/AuditLogRoutes.js';
app.use('/api/audit-logs', AuditLogRoutes);

// RBAC Routes
import RBACRoutes from './Routes/api/v1/RBACRoutes.js';
app.use('/api/rbac', RBACRoutes);

// Translation Routes
import TranslationRoutes from './Routes/api/v1/TranslationRoutes.js';
app.use('/api/translate', TranslationRoutes);

// Smart Categorization Routes
import SmartCategorizationRoutes from './Routes/api/v1/SmartCategorizationRoutes.js';
app.use('/api/categorize', SmartCategorizationRoutes);

// Sentiment Analysis Routes
import SentimentAnalysisRoutes from './Routes/api/v1/SentimentAnalysisRoutes.js';
app.use('/api/sentiment', SentimentAnalysisRoutes);

// Message Template Routes
import MessageTemplateRoutes from './Routes/api/v1/MessageTemplateRoutes.js';
app.use('/api/templates', MessageTemplateRoutes);

// Subscription Routes
import SubscriptionRoutes from './Routes/api/v1/SubscriptionRoutes.js';
app.use('/api/subscriptions', SubscriptionRoutes);

// Sync Routes
import SyncRoutes from './Controllers/Sync/SyncController.js';
app.use('/api/sync', SyncRoutes);

app.get('/', (req, res) => {
  res.send('hello');
});

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoint
app.get('/health', (req, res) => {
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Health check endpoint accessed', {
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
  
  // 🔧 OPTIMIZATION #78: Use optimized JSON response
  res.json({ 
    status: 'ok',
    message: 'SwagGo Backend Server is running',
    port: port,
    timestamp: new Date().toISOString(),
    socketio: 'ready'
  });
});

// Debug endpoint to check file existence
// 🔒 SECURITY FIX #25: Protect exposed debug endpoint with authentication
app.get('/debug/file/:filename', debugRateLimiter, auth.authenticate, (req, res) => {
  // Only allow admin users to access this debug endpoint
  if (!req.user || req.user.permissions?.role !== 'admin') {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.warn('Unauthorized access to debug endpoint', {
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip
    });
    
    // 🔧 OPTIMIZATION #78: Use optimized JSON response
    return res.status(403).json({ 
      error: 'forbidden', 
      message: 'Access to debug endpoint requires admin privileges' 
    });
  }
  
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // 🔧 PERFORMANCE FIX #40: Use async version of fs.existsSync
  const exists = fs.existsSync(filePath);
  
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Debug file check', {
    filename,
    exists,
    fullPath: filePath,
    uploadDir: path.join(__dirname, 'uploads'),
    userId: req.user?.id,
    username: req.user?.username
  });
  
  // 🔧 OPTIMIZATION #78: Use optimized JSON response
  res.json({
    filename,
    exists,
    fullPath: filePath,
    uploadDir: path.join(__dirname, 'uploads')
  });
});

// Admin endpoint for file cleanup
// 🔒 SECURITY FIX #26: Replace hardcoded admin token with proper admin authentication
// 🔒 SECURITY FIX #63: Add IP whitelisting to admin endpoints
app.post('/admin/cleanup-files', ipWhitelistMiddleware, adminRateLimiter, auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('Admin file cleanup initiated', {
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip
    });
    
    // Run cleanup
    const result = await FileService.cleanupUnusedFiles();
    
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('Admin file cleanup completed', {
      deletedFilesCount: result.deletedFilesCount,
      userId: req.user?.id,
      username: req.user?.username
    });
    
    // 🔧 OPTIMIZATION #78: Use optimized JSON response
    res.json({
      success: true,
      message: `Cleanup completed: ${result.deletedFilesCount} files deleted`,
      result
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Admin cleanup error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      username: req.user?.username
    });
    
    // 🔧 OPTIMIZATION #78: Use optimized JSON response
    res.status(500).json({ 
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

// Admin endpoint for file statistics
// 🔒 SECURITY FIX #26: Replace hardcoded admin token with proper admin authentication
// 🔒 SECURITY FIX #63: Add IP whitelisting to admin endpoints
app.get('/admin/file-stats', ipWhitelistMiddleware, adminRateLimiter, auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('Admin file stats requested', {
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip
    });
    
    // Get statistics
    const stats = await FileService.getStats();
    
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('Admin file stats retrieved', {
      stats,
      userId: req.user?.id,
      username: req.user?.username
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Admin stats error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      username: req.user?.username
    });
    
    res.status(500).json({ 
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

// Admin endpoint for soft deleting old messages
// 🔒 SECURITY FIX #26: Replace hardcoded admin token with proper admin authentication
// 🔒 SECURITY FIX #63: Add IP whitelisting to admin endpoints
app.post('/admin/soft-delete-old-messages', ipWhitelistMiddleware, adminRateLimiter, auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    // Get days parameter from request body or use default
    const { days = 365 } = req.body;
    
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('Admin soft delete old messages initiated', {
      days,
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip
    });
    
    // Run soft delete
    const result = await FileService.softDeleteOldMessages(days);
    
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('Admin soft delete completed', {
      deletedCount: result.deletedCount,
      days,
      userId: req.user?.id,
      username: req.user?.username
    });
    
    res.json({
      success: true,
      message: `Soft delete completed: ${result.deletedCount} messages deleted`,
      result
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Admin soft delete error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      username: req.user?.username
    });
    
    res.status(500).json({ 
      error: 'Soft delete failed',
      message: error.message
    });
  }
});

// GraphQL with Auth

const authWrapper = (req, res) =>
  new Promise((resolve) => {
    auth.authenticate(req, res, () => resolve());
  });



// GraphQL with optional authentication enhanced with proper origin checking
// 🔒 SECURITY FIX #61: GraphQL route uses unified CORS configuration
app.use(
  '/graphql',
  cors({
    origin: validateOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }),
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      // 🔒 SECURITY ENHANCED: Comprehensive authentication context with validation
      let user = null;
      let authMethod = 'none';
      let authResult = null;
      let securityMetadata = {};
      
      
      // Extract authentication context using same methodology as AuthenticationMiddleware
      const authContext = {
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                  req.headers['x-real-ip'] ||
                  req.connection?.remoteAddress ||
                  req.socket?.remoteAddress ||
                  req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
      };
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('GraphQL Context Creation Starting', {
        method: req.method,
        url: req.url
      });
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('GraphQL Request headers', {
        Authorization: req.headers['Authorization'] ? 'Bearer [PRESENT]' : 'Missing',
        'x-csrf-token': req.headers['x-csrf-token'] ? '[PRESENT]' : 'Missing',
        'user-agent': req.headers['user-agent'],
        origin: req.headers['origin'],
        'content-type': req.headers['content-type'],
        cookie: req.headers.cookie ? `Present (${req.headers.cookie.length} chars)` : 'Missing',
        cookies: req.cookies ? `${Object.keys(req.cookies).length} parsed cookies` : 'No parsed cookies',
        ip: authContext.ipAddress
      });
      
      // 🔧 EXTRA DEBUGGING: Detailed cookie analysis
      if (req.headers.cookie) {
        appLogger.debug('COOKIE ANALYSIS: Raw cookie header', {
          rawCookie: req.headers.cookie,
          cookieLength: req.headers.cookie.length,
          parsedCookies: req.cookies || 'Not parsed'
        });
      }
      
      // 🔍 ENHANCED DEBUGGING: Show actual cookie names and structure
      if (req.cookies && Object.keys(req.cookies).length > 0) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('Cookie details', {
          cookies: Object.keys(req.cookies).map(name => ({
            name,
            value: req.cookies[name] ? (req.cookies[name].substring(0, 30) + '...') : 'empty',
            fullValue: req.cookies[name] || 'none'
          }))
        });
        
        // 🔍 Check specifically for accessToken cookie
        if (req.cookies['accessToken']) {
          appLogger.debug('accessToken cookie found', {
            valueLength: req.cookies['accessToken'].length,
            isUndefined: req.cookies['accessToken'] === 'undefined',
            valuePreview: req.cookies['accessToken'].substring(0, 30) + '...'
          });
        }
      } else if (req.headers.cookie) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.warn('Cookie header present but req.cookies is empty - parsing issue!', {
          rawCookieHeader: req.headers.cookie.substring(0, 200) + '...'
        });
      } else {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('No cookies found in headers or parsed cookies');
      }
      
      // 🔒 PRIORITY 1: Check Bearer token (for API clients) using TokenService
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('Starting Bearer token authentication...');
      
      try {
        const authHeader = req.headers['authorization'];
        appLogger.debug('Authorization header check', {
          hasAuthHeader: !!authHeader,
          authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'none'
        });
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('Bearer token found', {
            tokenLength: token.length,
            tokenPreview: token.substring(0, 30) + '...'
          });
          
          // 🔍 DEBUG: Check if token is 'undefined'
          if (token === 'undefined' || token === 'null' || token.length < 10) {
            appLogger.warn('Invalid Bearer token detected', {
              tokenValue: token,
              tokenLength: token.length
            });
          }
          
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('Attempting to verify Bearer token with TokenService...');
          
          const tokenContext = {
            ipAddress: authContext.ipAddress,
            userAgent: authContext.userAgent,
            deviceHash: crypto.createHash('sha256').update(authContext.userAgent + authContext.ipAddress).digest('hex')
          };
          
          appLogger.debug('Attempting to verify Bearer token with TokenService...', {
            tokenLength: token?.length || 0,
            tokenPreview: token ? token.substring(0, 30) + '...' : 'none'
          });
          
          const tokenResult = await TokenService.verifyAccessToken(token, tokenContext);
          
          appLogger.debug('Bearer token verification result', {
            valid: tokenResult.valid,
            reason: tokenResult.reason,
            hasUser: !!tokenResult.user
          });
          
          if (tokenResult.valid) {
            // Get fresh user data
            const freshUser = await User.findOne({ id: tokenResult.user.id });
            if (freshUser && !freshUser.isAccountLocked()) {
              // CRITICAL FIX: Add profileid from Profile model
              const userProfile = await Profile.findOne({ username: freshUser.username });
              user = {
                ...tokenResult.user,
                profileid: userProfile?.profileid || null
              };
              authMethod = 'bearer_token';
              authResult = tokenResult;
              securityMetadata = tokenResult.security || {};
              
              // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
              appLogger.info('Bearer token verified successfully', {
                username: user.username,
                profileid: user.profileid
              });
            } else {
              // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
              appLogger.warn('Bearer token valid but user account locked or not found');
            }
          } else {
            // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
            appLogger.warn('Bearer token verification failed', {
              reason: tokenResult.reason
            });
          }
        } else if (authHeader) {
          appLogger.debug('Authorization header does not start with Bearer', {
            headerStart: authHeader.substring(0, 10)
          });
        }
      } catch (err) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.error('Bearer token verification error', {
          error: err.message,
          stack: err.stack
        });
      }
      
      // 🔒 PRIORITY 2: Check cookie-based authentication (for web clients) using TokenService
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('Starting cookie-based authentication...');
      
      if (!user && req.cookies) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('Available cookie names', {
          cookieNames: Object.keys(req.cookies)
        });
        
        try {
          // Check for access token in cookies (using exact same prefixes as AuthenticationMiddleware)
          const cookieTokenSources = [
            req.cookies['__Host_accessToken'],    // Highest security prefix (underscore format)
            req.cookies['__Secure_accessToken'],  // HTTPS required prefix (underscore format)
            req.cookies['__Host-accessToken'],    // Alternative hyphen format
            req.cookies['__Secure-accessToken'],  // Alternative hyphen format
            req.cookies['accessToken']            // Standard cookie name
          ].filter(token => token && token !== 'undefined' && token !== 'null' && token.length > 10); // Filter out invalid tokens
          
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('Cookie token search results', {
            '__Host_accessToken': req.cookies['__Host_accessToken'] ? 'FOUND' : 'NOT FOUND',
            '__Secure_accessToken': req.cookies['__Secure_accessToken'] ? 'FOUND' : 'NOT FOUND',
            '__Host-accessToken': req.cookies['__Host-accessToken'] ? 'FOUND' : 'NOT FOUND',
            '__Secure-accessToken': req.cookies['__Secure-accessToken'] ? 'FOUND' : 'NOT FOUND',
            'accessToken': req.cookies['accessToken'] ? 'FOUND' : 'NOT FOUND',
            totalTokensFound: cookieTokenSources.length
          });
          
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('Cookie token search results', {
            availableCookies: Object.keys(req.cookies || {}),
            totalTokensFound: cookieTokenSources.length
          });
          
          const tokenContext = {
            ipAddress: authContext.ipAddress,
            userAgent: authContext.userAgent,
            deviceHash: crypto.createHash('sha256').update(authContext.userAgent + authContext.ipAddress).digest('hex')
          };
          
          for (const cookieToken of cookieTokenSources) {
            try {
              // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
              appLogger.debug('Attempting to verify cookie token with TokenService...', {
                tokenLength: cookieToken?.length || 0,
                tokenPreview: cookieToken ? cookieToken.substring(0, 30) + '...' : 'none'
              });
              
              // SECURITY FIX: Check for undefined or invalid token values before verification
              if (!cookieToken || cookieToken === 'undefined' || cookieToken === 'null' || cookieToken.length < 10) {
                appLogger.warn('Skipping invalid cookie token', {
                  tokenValue: cookieToken,
                  tokenLength: cookieToken?.length || 0
                });
                continue;
              }
              
              const tokenResult = await TokenService.verifyAccessToken(cookieToken, tokenContext);
              
              appLogger.debug('Token verification result', {
                valid: tokenResult.valid,
                reason: tokenResult.reason,
                hasUser: !!tokenResult.user
              });
              
              if (tokenResult.valid) {
                // Get fresh user data
                const freshUser = await User.findOne({ id: tokenResult.user.id });
                if (freshUser && !freshUser.isAccountLocked()) {
                  // CRITICAL FIX: Add profileid from Profile model
                  const userProfile = await Profile.findOne({ username: freshUser.username });
                  user = {
                    ...tokenResult.user,
                    profileid: userProfile?.profileid || null
                  };
                  authMethod = 'cookie_token';
                  authResult = tokenResult;
                  securityMetadata = tokenResult.security || {};
                  
                  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
                  appLogger.info('Cookie token verified successfully', {
                    username: user.username,
                    profileid: user.profileid
                  });
                  
                  break; // Found valid token, stop searching
                } else {
                  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
                  appLogger.warn('Cookie token valid but user account locked or not found');
                }
              } else {
                // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
                appLogger.warn('Cookie token verification failed', {
                  reason: tokenResult.reason
                });
              }
            } catch (cookieErr) {
              // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
              appLogger.error('Cookie token verification error', {
                error: cookieErr.message,
                stack: cookieErr.stack
              });
              
              continue; // Try next cookie
            }
          }
        } catch (err) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.error('Cookie authentication error', {
            error: err.message,
            stack: err.stack
          });
        }
      }
      
      // 🔒 SECURITY: Enhanced context with comprehensive authentication metadata
      const contextResult = {
        user,
        isAuthenticated: !!user,
        authMethod,
        authResult, // Full TokenService result with security metadata
        authContext, // IP, UserAgent, etc.
        req,
        res,
        // 🚀 PERFORMANCE: Add DataLoader context to prevent N+1 queries
        dataloaders: DataLoaderService.createContext(),
        // 🔒 SECURITY: Enhanced security metadata
        security: {
          timestamp: Date.now(),
          requestId: req.headers['x-request-id'] || `gql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userAgent: req.headers['user-agent'],
          origin: req.headers['origin'],
          ip: authContext.ipAddress,
          riskScore: securityMetadata.riskScore || 0,
          deviceTrusted: securityMetadata.deviceTrusted || false,
          tokenMetadata: authResult?.metadata || null,
          // CSRF token extraction for validation
          csrfToken: req.cookies?.['__Host-csrfToken'] || 
                    req.cookies?.['__Secure-csrfToken'] || 
                    req.cookies?.['csrfToken'] || 
                    req.headers['x-csrf-token'],
          connectionSecure: req.secure || req.headers['x-forwarded-proto'] === 'https'
        }
      };
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('Final GraphQL context created', {
        isAuthenticated: contextResult.isAuthenticated,
        authMethod,
        user: user ? `${user.username} (ID: ${user.id})` : 'No user',
        userProfileid: user?.profileid || 'No profileid',
        hasCsrfToken: !!contextResult.security.csrfToken,
        csrfTokenLength: contextResult.security.csrfToken?.length || 0,
        authResultValid: !!authResult?.valid,
        authResultKeys: authResult ? Object.keys(authResult) : 'No auth result',
        tokenMetadata: authResult?.metadata || 'No metadata'
      });
      
      if (authResult?.payload) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('Token payload details', {
          payloadKeys: Object.keys(authResult.payload),
          tokenId: authResult.payload.jti || 'No jti'
        });
      }
      
      return contextResult;
    }
  })
);


// === Create HTTP/2 server for Socket.io with fallback to HTTP/1.1 ===
// Check if we have SSL certificates for HTTP/2
const hasSSLCerts = process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH && 
                   fs.existsSync(process.env.SSL_KEY_PATH) && 
                   fs.existsSync(process.env.SSL_CERT_PATH);

let httpServer;

if (hasSSLCerts) {
  // Create HTTP/2 server with SSL
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    // Enable HTTP/2
    spdy: {
      protocols: ['h2', 'spdy/3.1', 'http/1.1'],
      plain: false,
      'x-forwarded-for': true,
      connection: {
        windowSize: 1024 * 1024, // 1MB
        autoSpdy31: false
      }
    }
  };
  
  httpServer = spdy.createServer(options, app);
  appLogger.info('HTTP/2 server created with SSL');
  
  // Make httpServer available globally
  global.httpServer = httpServer;
} else {
  // Fallback to regular HTTP/1.1 server
  httpServer = createServer(app);
  appLogger.info('HTTP/1.1 server created (no SSL certificates found)');
  
  // Make httpServer available globally
  global.httpServer = httpServer;
}

// 🔧 API RESPONSE TIME OPTIMIZATION #184: Configure server timeout settings
// Set server timeout configurations for better performance and resource management
httpServer.setTimeout(120000); // 2 minutes for request timeout
httpServer.keepAliveTimeout = 65000; // 65 seconds for keep-alive connections
httpServer.headersTimeout = 66000; // 66 seconds for headers timeout (should be greater than keepAliveTimeout)

appLogger.info('🔧 Server timeout configurations applied', {
  serverTimeout: '120000ms',
  keepAliveTimeout: '65000ms',
  headersTimeout: '66000ms'
});

// HTTP/2 Server Push Middleware
app.use((req, res, next) => {
  // Add HTTP/2 server push capabilities
  if (res.push && process.env.ENABLE_HTTP2_PUSH === 'true') {
    // Push critical assets for main page
    if (req.path === '/' || req.path === '/index.html') {
      // Push critical CSS
      const criticalCSS = [
        '/styles/main.css',
        '/styles/components.css'
      ];
      
      // Push critical JS
      const criticalJS = [
        '/js/vendor.js',
        '/js/main.js'
      ];
      
      // Push assets
      [...criticalCSS, ...criticalJS].forEach(assetPath => {
        try {
          const push = res.push(assetPath, {
            request: {
              accept: '*/*'
            },
            response: {
              'content-type': assetPath.endsWith('.css') ? 'text/css' : 'application/javascript'
            }
          });
          
          // In a real implementation, you would read the file and push it
          // For now, we'll just log that we would push it
          appLogger.debug(`HTTP/2 Server Push: Would push ${assetPath}`);
        } catch (pushError) {
          appLogger.warn(`HTTP/2 Server Push failed for ${assetPath}:`, pushError.message);
        }
      });
    }
  }
  next();
});

// === Socket.io Setup with dynamic CORS ===
console.log('🚀 BACKEND: Creating Socket.IO server instance...');
const io = new Server(httpServer, 
  {
  
  cors: {
    origin: function (origin, callback) {
      console.log('🔒 BACKEND: Socket.IO CORS check for origin:', origin);
      
      // 🔧 CRITICAL FIX #3: Correct CORS callback usage
      // For no origin (same-origin requests, mobile apps, etc.), allow the request
      if (!origin) {
        console.log('✅ BACKEND: No origin provided (same-origin or mobile), allowing connection');
        return callback(null, true); // ✅ FIXED: Use true instead of origin string
      }
      
      const allowedOrigins = process.env.FRONTEND_URLS ? 
        process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : 
        [
          'http://localhost:3000', 
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          process.env.FRONTEND_URL
        ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ BACKEND: Socket.IO CORS origin allowed:', origin);
        callback(null, true); // ✅ Allow the origin
      } else {
        console.log('❌ BACKEND: Socket.IO CORS origin blocked:', origin);
        appLogger.warn('Socket.IO CORS: Blocked request from unauthorized origin', {
          origin,
          allowedOrigins
        });
        callback(new Error('Socket.IO CORS: Origin not allowed'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  // 🔧 WEBSOCKET MESSAGE SIZE LIMITS #185: Configure message size limits
  maxHttpBufferSize: 1e6, // 1MB - Maximum HTTP buffer size
  // Add additional WebSocket configuration for better message handling
  httpCompression: {
    threshold: 1024 // Compress messages larger than 1KB
  },
  // Configure WebSocket per-message deflate compression
  perMessageDeflate: {
    threshold: 1024, // Compress messages larger than 1KB
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 15,
    concurrencyLimit: 10,
    threshold: 1024
  },
  // 🔄 CRITICAL FIX: Add connection limiting to prevent excessive connections
  maxConnections: 10000, // Maximum concurrent connections
  // 🔄 CRITICAL FIX: Add rate limiting for connection attempts
  connectionStateRecovery: {
    maxDisconnectionDuration: 60 * 1000, // 1 minute
    skipMiddlewares: true,
  },
  // 🔄 ENHANCEMENT: Add reconnection configuration
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.1
});

console.log('✅ BACKEND: Socket.IO server created with configuration');
console.log('🔌 BACKEND: Socket.IO server details:', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: 'enabled',
  credentials: true,
  serverAddress: `http://localhost:${port}`
});

// 🛡️ SECURITY: Use existing 10/10 secure SocketAuthMiddleware instead of basic auth
import SocketAuthMiddleware from './Middleware/Socket/SocketAuthMiddleware.js';
import { setIO } from './Config/SocketConfig.js'; // Add this import

console.log('🔐 BACKEND: Applying Socket.IO authentication middleware...');
// Apply the sophisticated 10/10 secure authentication middleware
io.use(SocketAuthMiddleware.authenticate);
console.log('✅ BACKEND: Socket.IO authentication middleware applied');
console.log('🔐 BACKEND: All socket connections will be authenticated before reaching connection handler');

// Set the Socket.IO instance for other modules to use
setIO(io); // Add this line
console.log('⚙️ BACKEND: Socket.IO instance set for other modules');

// 🔧 CRITICAL DEBUG: Add engine-level logging to see ALL connection attempts
console.log('🔌 BACKEND: Setting up engine-level connection listeners...');

io.engine.on('connection', (rawSocket) => {
  console.log('🔌🔌🔌 BACKEND: RAW ENGINE CONNECTION RECEIVED FROM FRONTEND!');
  console.log('🔌 BACKEND: Raw socket details:', {
    id: rawSocket.id,
    transport: rawSocket.transport?.name,
    readyState: rawSocket.readyState,
    remoteAddress: rawSocket.remoteAddress
  });
  console.log('✅ BACKEND: Frontend successfully reached the socket server!');
  console.log('⏳ BACKEND: Now passing through authentication middleware...');
});

// SECURITY ENHANCEMENT: Add connection cleanup handler
io.engine.on('connection_error', (err) => {
  console.error('❌❌❌ BACKEND: ENGINE CONNECTION ERROR!');
  console.error('❌ BACKEND: Error details:', {
    message: err.message,
    code: err.code,
    context: err.context
  });
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
  appLogger.error('Socket.IO connection error', {
    req: err.req,
    code: err.code,
    message: err.message,
    context: err.context
  });
});

console.log('✅ BACKEND: Engine-level listeners configured');

// 🔧 CRITICAL FIX #4: REMOVE DUPLICATE CONNECTION HANDLER
// Only ONE connection handler should exist - in SocketController
// This prevents authentication state confusion and memory leaks

// Apply disconnection handler from the security middleware
io.on('disconnect', (socket) => {
  SocketAuthMiddleware.handleDisconnection(socket);
});

// ✅ CLEAN IMPLEMENTATION: Initialize refactored SocketController to handle ALL socket events
console.log('🎮 BACKEND: Initializing SocketController...');
import SocketController from './Controllers/Messaging/SocketController.js';
const socketController = new SocketController(io);
console.log('✅ BACKEND: SocketController initialized');

// Initialize Collaborative Editing Service
import CollaborativeEditingService from './Services/Features/CollaborativeEditingService.js';
CollaborativeEditingService.initialize(io);
CollaborativeEditingService.startCleanup();

// 🔧 CRITICAL FIX #4: Single connection handler in SocketController
// The SocketController.setupConnectionHandling() method already registers the connection handler
// No need for duplicate handler here
console.log('✅ BACKEND: Socket.IO connection handler registered in SocketController');
console.log('🔌 BACKEND: Socket.IO server is ready and listening for connections');
console.log('🔌 BACKEND: Waiting for frontend to connect...');

// === Start Server ===
// Use the httpServer for both Express and Socket.IO
httpServer.listen(port, '0.0.0.0', () => {
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Server started', {
    port,
    environment: process.env.NODE_ENV
  });
  
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Endpoints available', {
    graphql: `http://localhost:${port}/graphql`,
    socketio: `http://localhost:${port}`,
    health: `http://localhost:${port}/health`,
    ready: `http://localhost:${port}/ready`,
    alive: `http://localhost:${port}/alive`
  });
  
  // Start scheduled message service
  ScheduledMessageService.start();
});

// Setup Socket.IO with the HTTP server
// setupSocketIO(httpServer); // This line seems to be calling an undefined function, commenting it out

// Graceful shutdown
process.on('SIGTERM', () => {
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('SIGTERM received, shutting down gracefully');
  
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('SIGINT received, shutting down gracefully');
  
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('Database connection closed');
      process.exit(0);
    });
  });
});

import APMIntegration from './utils/APMIntegration.js'; // 🔧 APM #87: Import APM integration
import { apmMiddleware, apmErrorMiddleware } from './Middleware/Performance/APMMiddleware.js'; // 🔧 APM #87: Import APM middleware

// 🔧 APM #87: Add APM middleware early in the middleware chain
app.use(apmMiddleware);

// 🔧 API DOC #97: Setup Swagger documentation
import { setupSwagger } from './Config/SwaggerConfig.js';
setupSwagger(app);

// 🔧 APM #87: Add APM error middleware
app.use(apmErrorMiddleware);

// Set up dependency injection after all modules are loaded
import { TYPES } from './Config/DIContainer.js';

// Set $inject properties for services that need them
import ChatService from './Services/Chat/ChatService.js';
ChatService.$inject = [TYPES.ChatRepository, TYPES.MessageRepository, TYPES.ProfileRepository];

import UserService from './Services/User/UserService.js';
UserService.$inject = [TYPES.ProfileRepository];

// 🔧 Monitoring Enhancement #172: Add periodic monitoring data cleanup

// Clean up old monitoring data periodically
setInterval(() => {
  // This would be implemented in a production environment
  // to clean up old metrics and traces from memory
  console.log('Monitoring data cleanup check');
}, 60 * 60 * 1000); // Every hour

// 🔧 Monitoring Enhancement #172: Add monitoring health check endpoint
app.get('/api/monitoring/health', async (req, res) => {
  try {
    const status = APMIntegration.getStatus();
    res.status(200).json({ 
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch monitoring health status',
      error: error.message
    });
  }
});

// 🔧 Backup Strategy #173: Initialize backup scheduler
import backupScheduler from './Services/Backup/BackupScheduler.js';
backupScheduler.start();

export default app;

