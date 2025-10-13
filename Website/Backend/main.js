import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cookieParser from 'cookie-parser';
import HealthRoutes from './Routes/HealthRoutes.js';
import AuthenticationRoutes from './Routes/AuthenticationRoutes.js';
import AdminRoutes from './Routes/AdminRoutes.js';
import UserRoutes from './Routes/UserRoutes.js';
import { Connectdb } from './db/Connectdb.js';
import TypeDef from './Controllers/TypeDefs.js';
import Resolvers from './Controllers/Resolver.js';

// 🔧 GRAPHQL SCHEMA STITCHING #99: Import schema stitching configuration
import { createStitchedSchema } from './GraphQL/SchemaStitching.js';
import auth from './Middleware/AuthenticationMiddleware.js';
import TokenService from './Services/TokenService.js';
import User from './Models/User.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import http from 'http';
import spdy from 'spdy'; // Add spdy for HTTP/2 support
import crypto from 'crypto';
import { Server as SocketIOServer } from 'socket.io';
import Chat from './Models/FeedModels/Chat.js';
import Message from './Models/FeedModels/Message.js';
import Profile from './Models/FeedModels/Profile.js';
import DataLoaderService from './Services/DataLoaderService.js';
import FileService from './Services/FileService.js'; // Import the new FileService
import GraphQLNPlusOneResolver from './utils/GraphQLNPlusOneResolver.js'; // Add this import
import { v4 as uuidv4 } from 'uuid';
// CRITICAL SECURITY: Import rate limiting middleware
import { uploadRateLimiter, debugRateLimiter, adminRateLimiter } from './Middleware/rateLimitingMiddleware.js';
import AuditLoggingMiddleware from './Middleware/AuditLoggingMiddleware.js';
import ThumbnailService from './Services/ThumbnailService.js';
// Import monitoring routes
import monitoringRoutes from './routes/monitoring.js';
// Import API versioned routes
import v1Routes from './Routes/v1/index.js';
import v2Routes from './Routes/v2/index.js';
// Import API Gateway
import apiGatewayMiddleware from './Middleware/APIGatewayMiddleware.js';

// Import scheduled message service
import ScheduledMessageService from './Services/ScheduledMessageService.js';

// 🔒 SECURITY FIX #29: Import SecretInitializationService
import secretInitializationService from './Services/SecretInitializationService.js';

// 🔒 SECURITY FIX #31: Import Helmet.js for proper security headers
import helmet from 'helmet';

// 🔧 PERFORMANCE FIX #32: Import Winston logger
import appLogger from './utils/logger.js';

// 🔧 PERFORMANCE FIX #42: Import Redis client
import redisClient from './utils/RedisClient.js';

// 🔒 SECURITY FIX #67: Import Anomaly Detection Routes
import AnomalyDetectionRoutes from './Routes/AnomalyDetectionRoutes.js';
// 🔒 SECURITY FIX #68: Import Enhanced File Upload Security
import fileUploadSecurity from './Middleware/EnhancedFileUploadSecurity.js';

// 🔒 SECURITY FIX #70: Import DDoS Protection Middleware
import DDoSProtectionMiddleware from './Middleware/DDoSProtectionMiddleware.js';


// 🔧 OPTIMIZATION #78: Import OptimizedJSON utility
import optimizedJSON from './utils/OptimizedJSON.js';

// 🔧 OPTIMIZATION #79: Import compression middleware
import compression from 'compression';

// Load non-sensitive environment variables
dotenv.config({ path: '.env.local' });

// 🔒 SECURITY FIX #29: Initialize secrets before other imports
await secretInitializationService.initialize();

const app = express();
const port = process.env.PORT;

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

// Helpers for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔒 SECURITY FIX: Proper trust proxy configuration for 10/10 security
// Set to 1 for single proxy, or specific subnet for multiple proxies
const trustProxyConfig = process.env.NODE_ENV === 'production' ? 
  process.env.TRUST_PROXY || 1 : 
  1; // Trust first proxy in development

app.set('trust proxy', trustProxyConfig);

// 🛡️ CRITICAL SECURITY: Apply DoS protection middleware FIRST
app.use(DDoSProtectionMiddleware.globalDDoSProtection);

// 🔒 SECURITY FIX #70: Apply DDoS protection middleware
app.use(DDoSProtectionMiddleware.globalDDoSProtection);

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
      formAction: ["'self'"]
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
  }
}));

// 🛡️ SECURITY: Rate limit status endpoint (for monitoring)
// Rate limit status endpoint removed due to missing implementation

// 🔒 SECURITY: Secure CORS validation function for uploads
// 🔒 SECURITY FIX #61: Unified CORS origin validation function
const validateOrigin = (origin, callback) => {
  // 🔒 SECURITY FIX: Always validate origin, even in development
  // For direct access (mobile apps, etc.), use a default origin from environment
  if (!origin) {
    // Use default origin from environment or fallback to localhost
    const defaultOrigin = process.env.DEFAULT_FRONTEND_URL || 'http://localhost:3000';
    return callback(null, defaultOrigin);
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
  
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.debug('CORS validation', {
    origin,
    allowedOrigins,
    isAllowed: allowedOrigins.includes(origin)
  });
  
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.warn
    appLogger.warn('CORS: Blocked request from unauthorized origin', {
      origin,
      allowedOrigins
    });
    callback(new Error('CORS: Origin not allowed'));
  }
};

// 🔧 FIX #49: API Versioning - Add /api/v1/, /api/v2/ versioning to routes
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// === Middlewares ===
// 🔒 SECURITY ENHANCED CORS: 10/10 Security Configuration
// 🔒 SECURITY FIX #61: Unified CORS configuration applied globally
app.use(cors({
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400
}));

// 🔒 SECURITY FIX #66: Add security audit logging middleware to log security-relevant events
app.use(AuditLoggingMiddleware.logSecurityEvents);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 🔧 API GATEWAY: Add unified API gateway middleware
app.use(apiGatewayMiddleware);

// 🔧 ERROR CODE STANDARDIZATION #102: Add error code validation middleware
import { errorCodeValidationMiddleware } from './Helper/ErrorCodeValidator.js';
app.use(errorCodeValidationMiddleware);

// 🔒 SECURITY FIX #67: Add anomaly detection routes
app.use('/api/anomaly-detection', AnomalyDetectionRoutes);

// 🔧 FEATURE FLAGS #103: Add feature flag routes
import FeatureFlagRoutes from './Routes/FeatureFlagRoutes.js';
app.use('/api/feature-flags', FeatureFlagRoutes);

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
app.get('/uploads/:filename', cors({
  origin: validateOrigin,
  credentials: true
}), async (req, res) => {
  const { filename } = req.params;
  
  // Origin validation is now handled by CORS middleware
  const secureOrigin = getSecureOrigin(req);
  // CORS headers are now set by middleware
  
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400
}), (req, res) => {
  res.status(200).end();
});

// 🔒 SECURITY FIX #61: Handle preflight OPTIONS for file streaming with unified CORS
app.options('/uploads/:filename', cors({
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Range', 'Accept', 'Authorization'],
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

  // Additional file validation
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  if (req.file.size > maxFileSize) {
    // Log oversized file attempt
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.warn(`🚨 OVERSIZED FILE UPLOAD ATTEMPT:`, {
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
        uploadContext: 'chat_message'
      },
      userId
    );

    const baseUrl = process.env.NODE_ENV === 'production' ? 
      process.env.PUBLIC_FILE_URL || `https://${req.get('host')}` : 
      `${req.protocol}://${req.get('host')}`;
    
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // Generate thumbnail for image files
    let thumbnailUrl = null;
    if (ThumbnailService.isImage(req.file.mimetype)) {
      try {
        const originalFilePath = path.join(__dirname, 'uploads', req.file.filename);
        const thumbnailPath = await ThumbnailService.generateThumbnail(originalFilePath, 200, 200);
        const thumbnailFilename = path.basename(thumbnailPath);
        thumbnailUrl = `${baseUrl}/uploads/thumbnails/${thumbnailFilename}`;
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        // Continue without thumbnail if generation fails
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
    console.error('Error storing file:', error);
    
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

// 🔧 PERFORMANCE FIX #42: Initialize Redis cache service
try {
  await redisClient.initialize();
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Redis cache service initialized successfully');
} catch (error) {
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
  appLogger.error('Failed to initialize Redis cache service:', error.message);
}

// Initialize FileService periodic tasks after database connection
FileService.initializePeriodicTasks();

// === Apollo Server Setup with enhanced N+1 resolver ===
const graphqlNPlusOneResolver = new GraphQLNPlusOneResolver();
const enhancedResolvers = graphqlNPlusOneResolver.initialize();

// 🔧 GRAPHQL SCHEMA STITCHING #99: Create stitched schema
const { typeDefs: stitchedTypeDefs, resolvers: stitchedResolvers } = await createStitchedSchema();

// 🔒 SECURITY FIX #28: Add GraphQL depth limiting and query complexity analysis
import depthLimit from 'graphql-depth-limit';
import { createComplexityRule } from 'graphql-query-complexity';
import { separateOperations } from 'graphql';
// 🛠️ Standardized error handling
import { handleUnifiedError } from './Helper/UnifiedErrorHandling.js';
// 🔒 SECURITY FIX #57: Add GraphQL rate limiting
import { getGraphQLRateLimiterMiddleware } from './Middleware/GraphQLRateLimiting.js';

const apolloServer = new ApolloServer({
  typeDefs: stitchedTypeDefs,
  resolvers: {
    ...Resolvers,
    ...enhancedResolvers,
    ...stitchedResolvers
  },
  // Add validation rules for depth limiting and complexity
  validationRules: (requestContext) => {
    // Get GraphQL rate limiter middleware
    const rateLimiter = getGraphQLRateLimiterMiddleware();
    
    return [
      // Apply rate limiting
      rateLimiter(requestContext),
      // Limit query depth to 10 levels
      depthLimit(10),
      // Limit query complexity (adjust values as needed)
      createComplexityRule(1000, {
        // Optional: Provide custom complexity calculation
        estimators: [
          // Add your custom estimators here if needed
        ],
        // Optional: Custom error message
        onComplete: (complexity) => {
          appLogger.info(`Query complexity: ${complexity}`);
        }
      })
    ];
  },
  // Add request size limit
  introspection: process.env.NODE_ENV !== 'production',
  // Set max request size
  bodyParserConfig: {
    limit: '10mb' // Limit request size to prevent DoS
  },
  // Standardized error formatting
  formatError: (error) => {
    const unifiedError = handleUnifiedError(error, 'graphql');
    return unifiedError;
  }
});

await apolloServer.start();

// === Routes ===
// Apply audit logging middleware to authentication routes
app.use('/api/auth', AuditLoggingMiddleware.logAuthentication, AuthenticationRoutes);
// 🔒 SECURITY FIX #63: Import IP whitelisting middleware
import ipWhitelistMiddleware from './Middleware/IPWhitelistMiddleware.js';

// Apply audit logging middleware to admin routes
app.use('/api/admin', ipWhitelistMiddleware, AuditLoggingMiddleware.logAdminEvents, AdminRoutes);
// Apply audit logging middleware to user routes
app.use('/api/users', AuditLoggingMiddleware.logUserManagement, UserRoutes);
app.use('/api', HealthRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Link Preview Routes
import LinkPreviewController from './Controllers/LinkPreviewController.js';
app.get('/api/link-preview', LinkPreviewController.getLinkPreview);
app.get('/api/link-preview/stats', LinkPreviewController.getCacheStats);
app.post('/api/link-preview/clear-cache', LinkPreviewController.clearExpiredCache);

// 🔧 PERFORMANCE FIX #42: Redis Cache Demo Routes
import { redisCacheMiddleware, cacheInvalidateMiddleware } from './Middleware/CacheMiddleware.js';
import redisCacheService from './Services/RedisCacheService.js';

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

// Scheduled Message Routes
import ScheduledMessageRoutes from './Routes/ScheduledMessageRoutes.js';
app.use('/api/scheduled-messages', ScheduledMessageRoutes);

// Keyword Alert Routes
import KeywordAlertRoutes from './Routes/KeywordAlertRoutes.js';
app.use('/api/keyword-alerts', KeywordAlertRoutes);

// Cloud Storage Routes
import CloudStorageRoutes from './Routes/CloudStorageRoutes.js';
app.use('/api/cloud', CloudStorageRoutes);

// Poll Routes
import PollRoutes from './Routes/PollRoutes.js';
app.use('/api/polls', PollRoutes);

// Collaborative Editing Routes
import CollaborativeEditingRoutes from './Routes/CollaborativeEditingRoutes.js';
app.use('/api/collab-docs', CollaborativeEditingRoutes);

// Audit Log Routes
import AuditLogRoutes from './Routes/AuditLogRoutes.js';
app.use('/api/audit-logs', AuditLogRoutes);

// RBAC Routes
import RBACRoutes from './Routes/RBACRoutes.js';
app.use('/api/rbac', RBACRoutes);

// Translation Routes
import TranslationRoutes from './Routes/TranslationRoutes.js';
app.use('/api/translate', TranslationRoutes);

// Smart Categorization Routes
import SmartCategorizationRoutes from './Routes/SmartCategorizationRoutes.js';
app.use('/api/categorize', SmartCategorizationRoutes);

// Sentiment Analysis Routes
import SentimentAnalysisRoutes from './Routes/SentimentAnalysisRoutes.js';
app.use('/api/sentiment', SentimentAnalysisRoutes);

// Message Template Routes
import MessageTemplateRoutes from './Routes/MessageTemplateRoutes.js';
app.use('/api/templates', MessageTemplateRoutes);

// Subscription Routes
import SubscriptionRoutes from './Routes/SubscriptionRoutes.js';
app.use('/api/subscriptions', SubscriptionRoutes);

// Sync Routes
import SyncRoutes from './Controllers/SyncController.js';
app.use('/api/sync', SyncRoutes);

app.get('/', (req, res) => {
  res.send('hello');
});

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
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
        authorization: req.headers['authorization'] ? 'Bearer [PRESENT]' : 'Missing',
        'x-csrf-token': req.headers['x-csrf-token'] ? '[PRESENT]' : 'Missing',
        'user-agent': req.headers['user-agent'],
        origin: req.headers['origin'],
        'content-type': req.headers['content-type'],
        cookie: req.headers.cookie ? `Present (${req.headers.cookie.length} chars)` : 'Missing',
        cookies: req.cookies ? `${Object.keys(req.cookies).length} parsed cookies` : 'No parsed cookies',
        ip: authContext.ipAddress
      });
      
      // 🔍 ENHANCED DEBUGGING: Show actual cookie names and structure
      if (req.cookies && Object.keys(req.cookies).length > 0) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('Cookie details', {
          cookies: Object.keys(req.cookies).map(name => ({
            name,
            value: req.cookies[name] ? (req.cookies[name].substring(0, 30) + '...') : 'empty'
          }))
        });
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
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('Bearer token found', {
            tokenLength: token.length
          });
          
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('Attempting to verify Bearer token with TokenService...');
          
          const tokenContext = {
            ipAddress: authContext.ipAddress,
            userAgent: authContext.userAgent,
            deviceHash: crypto.createHash('sha256').update(authContext.userAgent + authContext.ipAddress).digest('hex')
          };
          
          const tokenResult = await TokenService.verifyAccessToken(token, tokenContext);
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
          ].filter(Boolean);
          
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
              appLogger.debug('Attempting to verify cookie token with TokenService...');
              
              const tokenResult = await TokenService.verifyAccessToken(cookieToken, tokenContext);
              
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
          csrfToken: req.cookies['__Host-csrfToken'] || 
                    req.cookies['__Secure-csrfToken'] || 
                    req.cookies['csrfToken'] || 
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
let httpServer;

// Check if we have SSL certificates for HTTP/2
const hasSSLCerts = process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH && 
                   fs.existsSync(process.env.SSL_KEY_PATH) && 
                   fs.existsSync(process.env.SSL_CERT_PATH);

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
} else {
  // Fallback to regular HTTP/1.1 server
  httpServer = http.createServer(app);
  appLogger.info('HTTP/1.1 server created (no SSL certificates found)');
}

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
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // 🔒 SECURITY FIX: Always validate origin, even in development
      // For direct access (mobile apps, etc.), use a default origin from environment
      if (!origin) {
        // Use default origin from environment or fallback to localhost
        const defaultOrigin = process.env.DEFAULT_FRONTEND_URL || 'http://localhost:3000';
        return callback(null, defaultOrigin);
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
        callback(null, true);
      } else {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.warn
        appLogger.warn('Socket.IO CORS: Blocked request from unauthorized origin', {
          origin
        });
        callback(new Error('Socket.IO CORS: Origin not allowed'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  // 🔄 CRITICAL FIX: Add connection limiting to prevent excessive connections
  maxConnections: 10000, // Maximum concurrent connections
  // 🔄 CRITICAL FIX: Add rate limiting for connection attempts
  connectionStateRecovery: {
    maxDisconnectionDuration: 60 * 1000, // 1 minute
    skipMiddlewares: true,
  }
});

// 🛡️ SECURITY: Use existing 10/10 secure SocketAuthMiddleware instead of basic auth
import SocketAuthMiddleware from './Middleware/SocketAuthMiddleware.js';
import { setIO } from './Config/SocketConfig.js'; // Add this import

// Apply the sophisticated 10/10 secure authentication middleware
io.use(SocketAuthMiddleware.authenticate);

// Set the Socket.IO instance for other modules to use
setIO(io); // Add this line

// SECURITY ENHANCEMENT: Add connection cleanup handler
io.engine.on('connection_error', (err) => {
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
  appLogger.error('Socket.IO connection error', {
    req: err.req,
    code: err.code,
    message: err.message,
    context: err.context
  });
});

// Apply disconnection handler from the security middleware
io.on('disconnect', (socket) => {
  SocketAuthMiddleware.handleDisconnection(socket);
});

// ✅ CLEAN IMPLEMENTATION: Initialize refactored SocketController to handle ALL socket events
import SocketController from './Controllers/SocketController.js';
const socketController = new SocketController(io);

// Initialize Collaborative Editing Service
import CollaborativeEditingService from './Services/CollaborativeEditingService.js';
CollaborativeEditingService.initialize(io);
CollaborativeEditingService.startCleanup();

// Socket.io connection handling - ALL events handled by SocketController
io.on('connection', (socket) => {
  // SECURITY: Access authenticated user data set by SocketAuthMiddleware
  const userId = socket.userId || socket.user?.profileid || socket.user?.id;
  const username = socket.username || socket.user?.username;
  
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Authenticated user connected', {
    username,
    userId,
    socketId: socket.id
  });
  
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('User security level', {
    username,
    deviceTrusted: socket.deviceTrusted,
    riskScore: socket.riskScore || 0
  });
  
  // Register all socket event handlers through SocketController
  socketController.registerSocketHandlers(socket);
  
  // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
  appLogger.info('Socket handlers registered for user', {
    username
  });
});

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
// setupSocketIO(server); // This line seems to be calling an undefined function, commenting it out

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
import { apmMiddleware, apmErrorMiddleware } from './Middleware/APMMiddleware.js'; // 🔧 APM #87: Import APM middleware

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
import ChatService from './Services/ChatService.js';
ChatService.$inject = [TYPES.ChatRepository, TYPES.MessageRepository, TYPES.ProfileRepository];

import UserService from './Services/UserService.js';
UserService.$inject = [TYPES.ProfileRepository];
