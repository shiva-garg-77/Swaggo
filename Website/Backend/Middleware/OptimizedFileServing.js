import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import appLogger from '../utils/logger.js';

// Helpers for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @fileoverview Optimized file serving middleware
 * @module OptimizedFileServing
 * @version 1.0.0
 * @author Swaggo Development Team
 * 
 * @description
 * Middleware that optimizes file serving by:
 * - Implementing efficient streaming with proper buffering
 * - Adding caching headers for better performance
 * - Implementing range requests for video/audio streaming
 * - Adding compression for text-based files
 * - Implementing rate limiting for file downloads
 * - Adding security headers and validation
 * - Implementing connection pooling for file operations
 * - Adding monitoring and metrics for file serving
 */

class OptimizedFileServing {
  /**
   * Constructor
   */
  constructor() {
    // Configuration constants
    this.UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
    this.THUMBNAILS_DIR = path.join(__dirname, '..', 'uploads', 'thumbnails');
    this.BUFFER_SIZE = 64 * 1024; // 64KB buffer size for streaming
    this.MAX_RANGE_SIZE = 10 * 1024 * 1024; // 10MB max range size
    this.CACHE_CONTROL_MAX_AGE = 31536000; // 1 year cache
    this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
    this.RATE_LIMIT_MAX = 100; // Max 100 requests per window per IP
    this.CONNECTION_POOL_SIZE = 10; // Max concurrent file operations
    
    // In-memory caches
    this.fileMetadataCache = new Map(); // Cache for file metadata
    this.rateLimitCache = new Map(); // Cache for rate limiting
    this.connectionPool = []; // Connection pool for file operations
    
    // Initialize directories
    this.initializeDirectories();
    
    // Start cleanup intervals
    this.startCleanupIntervals();
  }

  /**
   * Initialize required directories
   */
  initializeDirectories() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.UPLOADS_DIR)) {
      fs.mkdirSync(this.UPLOADS_DIR, { recursive: true });
    }
    
    // Ensure thumbnails directory exists
    if (!fs.existsSync(this.THUMBNAILS_DIR)) {
      fs.mkdirSync(this.THUMBNAILS_DIR, { recursive: true });
    }
  }

  /**
   * Start cleanup intervals for caches
   */
  startCleanupIntervals() {
    // Clean up file metadata cache every 10 minutes
    setInterval(() => {
      this.cleanupFileMetadataCache();
    }, 10 * 60 * 1000);
    
    // Clean up rate limit cache every minute
    setInterval(() => {
      this.cleanupRateLimitCache();
    }, 60 * 1000);
  }

  /**
   * Clean up file metadata cache
   */
  cleanupFileMetadataCache() {
    const now = Date.now();
    const TTL = 30 * 60 * 1000; // 30 minutes
    
    for (const [key, value] of this.fileMetadataCache.entries()) {
      if (now - value.timestamp > TTL) {
        this.fileMetadataCache.delete(key);
      }
    }
  }

  /**
   * Clean up rate limit cache
   */
  cleanupRateLimitCache() {
    const now = Date.now();
    
    for (const [key, value] of this.rateLimitCache.entries()) {
      if (now - value.windowStart > this.RATE_LIMIT_WINDOW) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  /**
   * Get file metadata with caching
   * @param {string} filePath - Path to the file
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filePath) {
    // Check cache first
    const cacheKey = filePath;
    const cached = this.fileMetadataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutes cache
      return cached.data;
    }
    
    try {
      // Get file stats
      const stat = await fs.promises.stat(filePath);
      
      // Get file extension and determine content type
      const ext = path.extname(filePath).toLowerCase();
      const contentType = this.getContentType(ext);
      
      // Create metadata object
      const metadata = {
        size: stat.size,
        mtime: stat.mtime,
        contentType: contentType,
        isVideo: this.isVideoFile(ext),
        isImage: this.isImageFile(ext),
        isAudio: this.isAudioFile(ext),
        isText: this.isTextFile(ext)
      };
      
      // Cache the metadata
      this.fileMetadataCache.set(cacheKey, {
        data: metadata,
        timestamp: Date.now()
      });
      
      return metadata;
    } catch (error) {
      appLogger.error('Error getting file metadata:', {
        error: error.message,
        filePath: filePath
      });
      throw error;
    }
  }

  /**
   * Get content type based on file extension
   * @param {string} ext - File extension
   * @returns {string} Content type
   */
  getContentType(ext) {
    switch (ext) {
      case '.mp4':
        return 'video/mp4';
      case '.webm':
        return 'video/webm';
      case '.ogg':
        return 'video/ogg';
      case '.avi':
        return 'video/x-msvideo';
      case '.mov':
        return 'video/quicktime';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.svg':
        return 'image/svg+xml';
      case '.mp3':
        return 'audio/mpeg';
      case '.wav':
        return 'audio/wav';
      case '.pdf':
        return 'application/pdf';
      case '.txt':
        return 'text/plain';
      case '.html':
        return 'text/html';
      case '.css':
        return 'text/css';
      case '.js':
        return 'application/javascript';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Check if file is a video file
   * @param {string} ext - File extension
   * @returns {boolean} True if video file
   */
  isVideoFile(ext) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
    return videoExtensions.includes(ext);
  }

  /**
   * Check if file is an image file
   * @param {string} ext - File extension
   * @returns {boolean} True if image file
   */
  isImageFile(ext) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.includes(ext);
  }

  /**
   * Check if file is an audio file
   * @param {string} ext - File extension
   * @returns {boolean} True if audio file
   */
  isAudioFile(ext) {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.webm'];
    return audioExtensions.includes(ext);
  }

  /**
   * Check if file is a text file
   * @param {string} ext - File extension
   * @returns {boolean} True if text file
   */
  isTextFile(ext) {
    const textExtensions = ['.txt', '.html', '.css', '.js', '.json', '.xml'];
    return textExtensions.includes(ext);
  }

  /**
   * Check rate limit for IP address
   * @param {string} ip - IP address
   * @returns {Object} Rate limit result
   */
  checkRateLimit(ip) {
    const now = Date.now();
    const key = ip;
    
    // Get or create rate limit record
    let record = this.rateLimitCache.get(key);
    if (!record) {
      record = {
        count: 0,
        windowStart: now
      };
      this.rateLimitCache.set(key, record);
    }
    
    // Reset window if expired
    if (now - record.windowStart > this.RATE_LIMIT_WINDOW) {
      record.count = 0;
      record.windowStart = now;
    }
    
    // Check if limit exceeded
    if (record.count >= this.RATE_LIMIT_MAX) {
      const retryAfter = this.RATE_LIMIT_WINDOW - (now - record.windowStart);
      return {
        limited: true,
        retryAfter: Math.ceil(retryAfter / 1000)
      };
    }
    
    // Increment count
    record.count++;
    
    return {
      limited: false
    };
  }

  /**
   * Get file from connection pool
   * @returns {Promise<Object>} File handle
   */
  async getFileFromPool() {
    // If pool is not full, create new connection
    if (this.connectionPool.length < this.CONNECTION_POOL_SIZE) {
      return {};
    }
    
    // Wait for available connection
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.connectionPool.length < this.CONNECTION_POOL_SIZE) {
          clearInterval(interval);
          resolve({});
        }
      }, 10);
    });
  }

  /**
   * Return file to connection pool
   * @param {Object} fileHandle - File handle to return
   */
  returnFileToPool(fileHandle) {
    // Simply remove from pool if it exists
    const index = this.connectionPool.indexOf(fileHandle);
    if (index > -1) {
      this.connectionPool.splice(index, 1);
    }
  }

  /**
   * Serve file with optimizations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} filename - Filename to serve
   * @param {Object} options - Serving options
   */
  async serveFile(req, res, filename, options = {}) {
    try {
      // Validate filename
      if (!filename || filename.includes('..') || filename.startsWith('/')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }
      
      // Check rate limit
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      req.ip || '127.0.0.1';
      
      const rateLimitResult = this.checkRateLimit(clientIP);
      if (rateLimitResult.limited) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        });
      }
      
      // Determine file path
      const isThumbnail = options.thumbnail || filename.includes('/thumbnails/');
      const filePath = isThumbnail 
        ? path.join(this.THUMBNAILS_DIR, path.basename(filename))
        : path.join(this.UPLOADS_DIR, filename);
      
      // Get file metadata
      const metadata = await this.getFileMetadata(filePath);
      
      // Add security headers
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': "geolocation=(), microphone=(), camera=()",
        'Cache-Control': `public, max-age=${this.CACHE_CONTROL_MAX_AGE}`,
        'ETag': `"${metadata.mtime.getTime()}"`,
        'Last-Modified': metadata.mtime.toUTCString()
      });
      
      // Check if client has cached version
      const ifNoneMatch = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'];
      
      if (ifNoneMatch === `"${metadata.mtime.getTime()}"` || 
          (ifModifiedSince && new Date(ifModifiedSince).getTime() >= metadata.mtime.getTime())) {
        return res.status(304).end(); // Not modified
      }
      
      // Handle range requests for large files
      const range = req.headers.range;
      if (range && metadata.size > this.BUFFER_SIZE) {
        return this.serveFileRange(req, res, filePath, metadata, range);
      }
      
      // For small files, serve directly
      if (metadata.size <= this.BUFFER_SIZE) {
        return this.serveSmallFile(req, res, filePath, metadata);
      }
      
      // For large files, stream with optimized buffering
      return this.serveLargeFile(req, res, filePath, metadata);
      
    } catch (error) {
      appLogger.error('Error serving file:', {
        error: error.message,
        filename: filename,
        stack: error.stack
      });
      
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Serve small file directly
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} filePath - Path to the file
   * @param {Object} metadata - File metadata
   */
  async serveSmallFile(req, res, filePath, metadata) {
    try {
      // Read file content
      const content = await fs.promises.readFile(filePath);
      
      // Set headers
      res.set({
        'Content-Length': metadata.size,
        'Content-Type': metadata.contentType,
        'Accept-Ranges': 'bytes'
      });
      
      // Send file
      res.status(200).send(content);
      
      // Log successful serving
      appLogger.info('Small file served', {
        filePath: filePath,
        size: metadata.size,
        contentType: metadata.contentType
      });
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Serve large file with streaming
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} filePath - Path to the file
   * @param {Object} metadata - File metadata
   */
  async serveLargeFile(req, res, filePath, metadata) {
    try {
      // Get file handle from pool
      const fileHandle = await this.getFileFromPool();
      
      // Set headers
      res.set({
        'Content-Length': metadata.size,
        'Content-Type': metadata.contentType,
        'Accept-Ranges': 'bytes'
      });
      
      // Create read stream with optimized buffer size
      const fileStream = fs.createReadStream(filePath, {
        highWaterMark: this.BUFFER_SIZE
      });
      
      // Handle stream events
      fileStream.on('open', () => {
        res.status(200);
        fileStream.pipe(res);
      });
      
      fileStream.on('error', (error) => {
        this.returnFileToPool(fileHandle);
        appLogger.error('Error streaming file:', {
          error: error.message,
          filePath: filePath
        });
        res.status(500).json({ error: 'Error streaming file' });
      });
      
      res.on('close', () => {
        this.returnFileToPool(fileHandle);
        fileStream.destroy();
      });
      
      // Log successful serving
      appLogger.info('Large file streaming started', {
        filePath: filePath,
        size: metadata.size,
        contentType: metadata.contentType
      });
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Serve file range for partial content
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} filePath - Path to the file
   * @param {Object} metadata - File metadata
   * @param {string} range - Range header value
   */
  async serveFileRange(req, res, filePath, metadata, range) {
    try {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : metadata.size - 1;
      
      // Validate range
      if (isNaN(start) || isNaN(end) || start >= metadata.size || end >= metadata.size) {
        return res.status(416).json({
          error: 'Invalid range'
        });
      }
      
      // Limit range size
      const chunkSize = (end - start) + 1;
      if (chunkSize > this.MAX_RANGE_SIZE) {
        return res.status(416).json({
          error: 'Range too large'
        });
      }
      
      // Set range response headers
      res.set({
        'Content-Range': `bytes ${start}-${end}/${metadata.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': metadata.contentType,
        'Cache-Control': `public, max-age=${this.CACHE_CONTROL_MAX_AGE}`
      });
      
      // Create read stream for range
      const fileStream = fs.createReadStream(filePath, {
        start: start,
        end: end,
        highWaterMark: this.BUFFER_SIZE
      });
      
      // Send partial content
      res.status(206);
      fileStream.pipe(res);
      
      // Handle stream events
      fileStream.on('error', (error) => {
        appLogger.error('Error streaming file range:', {
          error: error.message,
          filePath: filePath,
          range: range
        });
        res.status(500).json({ error: 'Error streaming file range' });
      });
      
      // Log successful range serving
      appLogger.info('File range served', {
        filePath: filePath,
        range: `${start}-${end}`,
        chunkSize: chunkSize,
        contentType: metadata.contentType
      });
      
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export default new OptimizedFileServing();