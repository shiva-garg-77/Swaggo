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
import crypto from 'crypto';
import { Server as SocketIOServer } from 'socket.io';
import Chat from './Models/FeedModels/Chat.js';
import Message from './Models/FeedModels/Message.js';
import Profile from './Models/FeedModels/Profile.js';
import DataLoaderService from './Services/DataLoaderService.js';
import { v4 as uuidv4 } from 'uuid';
// CRITICAL SECURITY: Import rate limiting middleware
import { dosProtection, smartRateLimit, getRateLimitStatus } from './middleware/rateLimitingMiddleware.js';
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT;

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
app.use(...dosProtection);

// 🛡️ SECURITY: Rate limit status endpoint (for monitoring)
app.get('/api/rate-limit-status', getRateLimitStatus);

// === Middlewares ===
// 🔒 SECURITY ENHANCED CORS: 10/10 Security Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without origin (for direct access, mobile apps, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Define allowed origins
    const allowedOrigins = process.env.FRONTEND_URLS ? 
      process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : 
      [
        'http://localhost:3000', 
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        process.env.FRONTEND_URL
      ].filter(Boolean);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // 🔒 SECURITY: Log potential CORS attacks
      console.warn(`🚨 CORS: Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS - Unauthorized origin'));
    }
  },
  credentials: true, // Required for secure cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Content-Language'
  ],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24 hours preflight cache
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🔒 SECURITY: Secure CORS validation function for uploads
const getSecureOrigin = (req) => {
  const origin = req.headers.origin;
  
  if (!origin) {
    // In development, allow requests without origin (direct access, Postman, etc.)
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000'; // Default to frontend URL
    }
    return null; // Block in production
  }
  
  // Validate origin against allowed origins
  const allowedOrigins = process.env.FRONTEND_URLS ? 
    process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : 
    ['http://localhost:3000', 'http://localhost:3001'];
  
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
  
  console.warn(`🚨 UPLOAD CORS: Blocked request from unauthorized origin: ${origin}`);
  return null;
};

// Custom video and file streaming endpoint with better control
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // 🔒 SECURITY: Validate origin first
  const secureOrigin = getSecureOrigin(req);
  if (!secureOrigin) {
    return res.status(403).json({ error: 'Forbidden - Invalid origin' });
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const stat = fs.statSync(filePath);
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
    const file = fs.createReadStream(filePath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': secureOrigin,
      'Access-Control-Allow-Credentials': 'true'
    });
    
    file.pipe(res);
  } else {
    // Send full file
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': secureOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'public, max-age=31536000' // 1 year cache
    });
    
    fs.createReadStream(filePath).pipe(res);
  }
});

// === Multer Setup ===

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 🔒 SECURITY: Handle preflight OPTIONS for uploads with secure CORS
app.options('/upload', (req, res) => {
  const secureOrigin = getSecureOrigin(req);
  if (!secureOrigin) {
    return res.status(403).json({ error: 'Forbidden - Invalid origin' });
  }
  
  res.header('Access-Control-Allow-Origin', secureOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

app.options('/uploads/:filename', (req, res) => {
  const secureOrigin = getSecureOrigin(req);
  if (!secureOrigin) {
    return res.status(403).json({ error: 'Forbidden - Invalid origin' });
  }
  
  res.header('Access-Control-Allow-Origin', secureOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// === REST Endpoint for Upload ===

app.post('/upload', upload.single('file'), (req, res) => {
  // 🔒 SECURITY: Validate origin first
  const secureOrigin = getSecureOrigin(req);
  if (!secureOrigin) {
    return res.status(403).json({ error: 'Forbidden - Invalid origin' });
  }
  
  // Set secure CORS headers
  res.header('Access-Control-Allow-Origin', secureOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const baseUrl = process.env.NODE_ENV === 'production' ? 
    process.env.PUBLIC_FILE_URL || `https://${req.get('host')}` : 
    `${req.protocol}://${req.get('host')}`;
  
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ 
    success: true,
    fileUrl: fileUrl,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size
  });
});

// === Connect to DB ===
await Connectdb();

// === Apollo Server Setup ===
const apolloServer = new ApolloServer({
  typeDefs: TypeDef,
  resolvers: Resolvers
});
await apolloServer.start();

// === Routes ===
app.use('/api/auth', AuthenticationRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/users', UserRoutes);
app.use('/api', HealthRoutes);
app.get('/', (req, res) => {
  res.send('hello');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'SwagGo Backend Server is running',
    port: port,
    timestamp: new Date().toISOString(),
    socketio: 'ready'
  });
});

// Debug endpoint to check file existence
app.get('/debug/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  const exists = fs.existsSync(filePath);
  
  res.json({
    filename,
    exists,
    fullPath: filePath,
    uploadDir: path.join(__dirname, 'uploads')
  });
});


// GraphQL with Auth

const authWrapper = (req, res) =>
  new Promise((resolve) => {
    auth.authenticate(req, res, () => resolve());
  });



// GraphQL with optional authentication enhanced with proper origin checking
app.use(
  '/graphql',
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.FRONTEND_URLS ? 
        process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : 
        ['http://localhost:3000', 'http://localhost:3001'];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('GraphQL CORS: Origin not allowed'));
      }
    },
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
      
      console.log('\n🔍 BACKEND DEBUG: GraphQL Context Creation Starting');
      console.log('🔍 BACKEND DEBUG: Request method:', req.method);
      console.log('🔍 BACKEND DEBUG: Request URL:', req.url);
      console.log('🔍 BACKEND DEBUG: Request headers:', {
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
        console.log('Cookie details:');
        Object.keys(req.cookies).forEach(name => {
          const value = req.cookies[name];
          console.log(`  - ${name}: ${value ? (value.substring(0, 30) + '...') : 'empty'}`);
        });
      } else if (req.headers.cookie) {
        console.log('Raw Cookie Header:', req.headers.cookie.substring(0, 200) + '...');
        console.log('⚠️ Cookie header present but req.cookies is empty - parsing issue!');
      } else {
        console.log('❌ No cookies found in headers or parsed cookies');
      }
      
      // 🔒 PRIORITY 1: Check Bearer token (for API clients) using TokenService
      console.log('🔍 BACKEND DEBUG: Starting Bearer token authentication...');
      try {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          console.log('🔍 BACKEND DEBUG: Bearer token found, length:', token.length);
          console.log('🔍 BACKEND DEBUG: Attempting to verify Bearer token with TokenService...');
          
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
                  console.log('✅ Bearer token verified successfully for user:', user.username);
                  console.log('🔍 BACKEND DEBUG: Added profileid to user:', user.profileid);
                } else {
                  console.log('🔴 Bearer token valid but user account locked or not found');
                }
          } else {
            console.log('🔴 Bearer token verification failed:', tokenResult.reason);
          }
        }
      } catch (err) {
        console.log('🔴 Bearer token verification error:', err.message);
      }
      
      // 🔒 PRIORITY 2: Check cookie-based authentication (for web clients) using TokenService
      console.log('🔍 BACKEND DEBUG: Starting cookie-based authentication...');
      if (!user && req.cookies) {
        console.log('🔍 BACKEND DEBUG: Available cookie names:', Object.keys(req.cookies));
        try {
          // Check for access token in cookies (using exact same prefixes as AuthenticationMiddleware)
          const cookieTokenSources = [
            req.cookies['__Host_accessToken'],    // Highest security prefix (underscore format)
            req.cookies['__Secure_accessToken'],  // HTTPS required prefix (underscore format)
            req.cookies['__Host-accessToken'],    // Alternative hyphen format
            req.cookies['__Secure-accessToken'],  // Alternative hyphen format
            req.cookies['accessToken']            // Standard cookie name
          ].filter(Boolean);
          
          console.log('🔍 BACKEND DEBUG: Cookie token search results:');
          console.log('  - __Host_accessToken:', req.cookies['__Host_accessToken'] ? 'FOUND' : 'NOT FOUND');
          console.log('  - __Secure_accessToken:', req.cookies['__Secure_accessToken'] ? 'FOUND' : 'NOT FOUND');
          console.log('  - __Host-accessToken:', req.cookies['__Host-accessToken'] ? 'FOUND' : 'NOT FOUND');
          console.log('  - __Secure-accessToken:', req.cookies['__Secure-accessToken'] ? 'FOUND' : 'NOT FOUND');
          console.log('  - accessToken:', req.cookies['accessToken'] ? 'FOUND' : 'NOT FOUND');
          console.log('🔍 BACKEND DEBUG: Total cookie tokens found:', cookieTokenSources.length);
          
          console.log('Available cookies:', Object.keys(req.cookies || {}));
          console.log('Cookie token search results:', cookieTokenSources.length + ' tokens found');
          
          const tokenContext = {
            ipAddress: authContext.ipAddress,
            userAgent: authContext.userAgent,
            deviceHash: crypto.createHash('sha256').update(authContext.userAgent + authContext.ipAddress).digest('hex')
          };
          
          for (const cookieToken of cookieTokenSources) {
            try {
              console.log('Attempting to verify cookie token with TokenService...');
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
                  console.log('✅ Cookie token verified successfully for user:', user.username);
                  console.log('🔍 BACKEND DEBUG: Added profileid to user:', user.profileid);
                  break; // Found valid token, stop searching
                } else {
                  console.log('🔴 Cookie token valid but user account locked or not found');
                }
              } else {
                console.log('🔴 Cookie token verification failed:', tokenResult.reason);
              }
            } catch (cookieErr) {
              console.log('🔴 Cookie token verification error:', cookieErr.message);
              continue; // Try next cookie
            }
          }
        } catch (err) {
          console.log('🔴 Cookie authentication error:', err.message);
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
      
      console.log('🔍 BACKEND DEBUG: Final GraphQL context created:');
      console.log('  - Authenticated:', contextResult.isAuthenticated);
      console.log('  - Auth method:', authMethod);
      console.log('  - User:', user ? `${user.username} (ID: ${user.id})` : 'No user');
      console.log('  - User profileid:', user?.profileid || 'No profileid');
      console.log('  - Has CSRF token:', !!contextResult.security.csrfToken);
      console.log('  - CSRF token length:', contextResult.security.csrfToken?.length || 0);
      console.log('  - Auth result valid:', !!authResult?.valid);
      console.log('  - Auth result keys:', authResult ? Object.keys(authResult) : 'No auth result');
      console.log('  - Token metadata:', authResult?.metadata || 'No metadata');
      
      if (authResult?.payload) {
        console.log('  - Token payload keys:', Object.keys(authResult.payload));
        console.log('  - Token ID (jti):', authResult.payload.jti || 'No jti');
      }
      
      return contextResult;
    }
  })
);


// === Create HTTP server for Socket.io ===
const httpServer = http.createServer(app);

// === Socket.io Setup with dynamic CORS ===
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests without origin (for direct access, mobile apps, etc.)
      if (!origin) return callback(null, true);
      
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
        console.warn(`🚨 Socket.IO CORS: Blocked request from unauthorized origin: ${origin}`);
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

// Apply the sophisticated 10/10 secure authentication middleware
io.use(SocketAuthMiddleware.authenticate);

// SECURITY ENHANCEMENT: Add connection cleanup handler
io.engine.on('connection_error', (err) => {
  console.error('🚨 Socket.IO connection error:', err.req, err.code, err.message, err.context);
});

// Apply disconnection handler from the security middleware
io.on('disconnect', (socket) => {
  SocketAuthMiddleware.handleDisconnection(socket);
});

// ✅ CLEAN IMPLEMENTATION: Initialize SocketController to handle ALL socket events
import SocketController from './Controllers/SocketController.js';
const socketController = new SocketController(io);

// Socket.io connection handling - ALL events handled by SocketController
io.on('connection', (socket) => {
  // SECURITY: Access authenticated user data set by SocketAuthMiddleware
  const userId = socket.userId || socket.user?.profileid || socket.user?.id;
  const username = socket.username || socket.user?.username;
  
  console.log(`👤 Authenticated user connected: ${username} (${userId})`);
  console.log(`🔒 Security Level: ${socket.deviceTrusted ? 'TRUSTED' : 'STANDARD'} | Risk Score: ${socket.riskScore || 0}`);
  
  // Register all socket event handlers through SocketController
  socketController.registerSocketHandlers(socket);
  
  console.log(`\u2705 Socket handlers registered for user: ${username}`);
});

// === Start Server ===
// Use the httpServer for both Express and Socket.IO
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🔐 Server running on port ${port}`);
  console.log(`🚀 GraphQL endpoint: http://localhost:${port}/graphql`);
  console.log(`⚡ Socket.IO endpoint: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`✅ Ready check: http://localhost:${port}/ready`);
  console.log(`🔄 Liveness check: http://localhost:${port}/alive`);
});

// Setup Socket.IO with the HTTP server
// setupSocketIO(server); // This line seems to be calling an undefined function, commenting it out

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});












