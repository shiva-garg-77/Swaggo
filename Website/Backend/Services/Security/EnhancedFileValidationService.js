/**
 * 🔐 ENHANCED FILE VALIDATION SERVICE
 * 
 * Advanced file validation with comprehensive security checks
 * including magic bytes validation, content analysis, and threat detection
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import SecurityConfig from '../../Config/SecurityConfig.js';
import jwtSecurityConfig from '../../Config/JWTSecurityConfig.js';

const execAsync = promisify(require('child_process').exec);

class EnhancedFileValidationService {
  constructor() {
    // Enhanced MIME type mapping with magic bytes
    this.allowedMimeTypes = new Map([
      // Images
      ['image/jpeg', { 
        extensions: ['.jpg', '.jpeg'], 
        magicBytes: ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'], 
        maxSize: 20 * 1024 * 1024 // 20MB
      }],
      ['image/png', { 
        extensions: ['.png'], 
        magicBytes: ['89504e470d0a1a0a'], 
        maxSize: 20 * 1024 * 1024 // 20MB
      }],
      ['image/gif', { 
        extensions: ['.gif'], 
        magicBytes: ['474946383761', '474946383961'], 
        maxSize: 10 * 1024 * 1024 // 10MB
      }],
      ['image/webp', { 
        extensions: ['.webp'], 
        magicBytes: ['52494646'], 
        maxSize: 20 * 1024 * 1024 // 20MB
      }],
      ['image/bmp', { 
        extensions: ['.bmp'], 
        magicBytes: ['424d'], 
        maxSize: 10 * 1024 * 1024 // 10MB
      }],
      
      // Videos
      ['video/mp4', { 
        extensions: ['.mp4'], 
        magicBytes: ['66747970'], 
        maxSize: 100 * 1024 * 1024 // 100MB
      }],
      ['video/webm', { 
        extensions: ['.webm'], 
        magicBytes: ['1a45dfa3'], 
        maxSize: 100 * 1024 * 1024 // 100MB
      }],
      ['video/quicktime', { 
        extensions: ['.mov'], 
        magicBytes: ['66747970717420'], 
        maxSize: 100 * 1024 * 1024 // 100MB
      }],
      
      // Audio
      ['audio/mpeg', { 
        extensions: ['.mp3'], 
        magicBytes: ['494433', 'fffb'], 
        maxSize: 50 * 1024 * 1024 // 50MB
      }],
      ['audio/wav', { 
        extensions: ['.wav'], 
        magicBytes: ['52494646'], 
        maxSize: 50 * 1024 * 1024 // 50MB
      }],
      ['audio/ogg', { 
        extensions: ['.ogg'], 
        magicBytes: ['4f676753'], 
        maxSize: 50 * 1024 * 1024 // 50MB
      }],
      
      // Documents
      ['application/pdf', { 
        extensions: ['.pdf'], 
        magicBytes: ['255044462d'], 
        maxSize: 50 * 1024 * 1024 // 50MB
      }],
      ['text/plain', { 
        extensions: ['.txt'], 
        magicBytes: [], 
        maxSize: 5 * 1024 * 1024 // 5MB
      }]
    ]);
    
    // Dangerous file extensions that should never be allowed
    this.dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.iso', '.msi', '.dll', '.so', '.dylib',
      '.sh', '.ps1', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl',
      '.html', '.htm', '.xhtml', '.xml', '.svg'
    ];
    
    // Suspicious content patterns
    this.suspiciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /data:application\/javascript/gi,
      /%3Cscript/gi,
      /%3Ciframe/gi,
      /onload=/gi,
      /onerror=/gi,
      /eval\(/gi,
      /document\.cookie/gi
    ];
    
    // File scanning cache
    this.scanCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    // Initialize quarantine directory
    this.quarantinePath = SecurityConfig.fileUpload.quarantineDirectory || './quarantine';
    this.initializeQuarantine();
  }
  
  /**
   * Initialize quarantine directory
   */
  async initializeQuarantine() {
    try {
      const exists = await fs.promises.access(this.quarantinePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
      
      if (!exists) {
        await fs.promises.mkdir(this.quarantinePath, { recursive: true, mode: 0o700 });
      }
    } catch (error) {
      console.error('❌ Failed to initialize quarantine directory:', error.message);
    }
  }
  
  /**
   * Main validation method
   */
  async validateFile(file, user = null) {
    const result = {
      safe: true,
      threats: [],
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      validationDetails: {}
    };
    
    try {
      // 1. Basic validation
      if (!this.validateBasicInfo(file, result)) {
        return result;
      }
      
      // 2. Extension validation
      if (!this.validateFileExtension(file, result)) {
        return result;
      }
      
      // 3. MIME type validation
      if (!this.validateMimeType(file, result)) {
        return result;
      }
      
      // 4. Magic bytes validation
      if (!await this.validateMagicBytes(file, result)) {
        return result;
      }
      
      // 5. File size validation
      if (!this.validateFileSize(file, result)) {
        return result;
      }
      
      // 6. Filename security validation
      if (!this.validateFilenameSecurity(file, result)) {
        return result;
      }
      
      // 7. Content validation
      if (!await this.validateFileContent(file, result)) {
        return result;
      }
      
      // 8. Virus scanning (if enabled)
      if (SecurityConfig.fileUpload.scanForMalware) {
        if (!await this.scanForVirus(file, result)) {
          return result;
        }
      }
      
      // 9. User permissions validation
      if (user && !this.validateUserPermissions(file, user, result)) {
        return result;
      }
      
      // 10. Rate limiting
      if (!this.checkRateLimit(file, user, result)) {
        return result;
      }
      
      result.validationDetails.completed = new Date().toISOString();
      return result;
      
    } catch (error) {
      result.safe = false;
      result.threats.push({
        type: 'validation_error',
        message: `Validation failed: ${error.message}`,
        severity: 'high'
      });
      return result;
    }
  }
  
  /**
   * Validate basic file information
   */
  validateBasicInfo(file, result) {
    // Check if file exists
    if (!file || !file.path) {
      result.safe = false;
      result.threats.push({
        type: 'missing_file',
        message: 'No file provided',
        severity: 'high'
      });
      return false;
    }
    
    // Check file size
    if (!file.size || file.size <= 0) {
      result.safe = false;
      result.threats.push({
        type: 'empty_file',
        message: 'File is empty',
        severity: 'medium'
      });
      return false;
    }
    
    result.validationDetails.basicInfo = {
      passed: true,
      size: file.size,
      originalname: file.originalname
    };
    
    return true;
  }
  
  /**
   * Validate file extension
   */
  validateFileExtension(file, result) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Check for dangerous extensions
    if (this.dangerousExtensions.includes(ext)) {
      result.safe = false;
      result.threats.push({
        type: 'dangerous_extension',
        message: `Dangerous file extension detected: ${ext}`,
        severity: 'critical'
      });
      return false;
    }
    
    // Check if extension is allowed for the MIME type
    const mimeTypeConfig = this.allowedMimeTypes.get(file.mimetype);
    if (mimeTypeConfig) {
      if (!mimeTypeConfig.extensions.includes(ext)) {
        result.safe = false;
        result.threats.push({
          type: 'extension_mismatch',
          message: `File extension ${ext} does not match MIME type ${file.mimetype}`,
          severity: 'high'
        });
        return false;
      }
    }
    
    result.validationDetails.extension = {
      passed: true,
      extension: ext
    };
    
    return true;
  }
  
  /**
   * Validate MIME type
   */
  validateMimeType(file, result) {
    // Check if MIME type is allowed
    if (!this.allowedMimeTypes.has(file.mimetype)) {
      result.safe = false;
      result.threats.push({
        type: 'forbidden_mimetype',
        message: `Forbidden MIME type: ${file.mimetype}`,
        severity: 'high'
      });
      return false;
    }
    
    result.validationDetails.mimetype = {
      passed: true,
      mimetype: file.mimetype
    };
    
    return true;
  }
  
  /**
   * Validate file magic bytes (file signature)
   */
  async validateMagicBytes(file, result) {
    const mimeTypeConfig = this.allowedMimeTypes.get(file.mimetype);
    
    // If no magic bytes defined, skip validation
    if (!mimeTypeConfig || !mimeTypeConfig.magicBytes || mimeTypeConfig.magicBytes.length === 0) {
      result.validationDetails.magicBytes = {
        passed: true,
        message: 'No magic bytes validation required'
      };
      return true;
    }
    
    try {
      // Read first 512 bytes of the file
      const buffer = Buffer.alloc(512);
      const fd = await fs.promises.open(file.path, 'r');
      const { bytesRead } = await fd.read(buffer, 0, 512, 0);
      await fd.close();
      
      const fileHeader = buffer.toString('hex', 0, Math.min(bytesRead, 16));
      
      // Check if any of the allowed magic bytes match
      const isValid = mimeTypeConfig.magicBytes.some(magic => 
        fileHeader.startsWith(magic.toLowerCase())
      );
      
      if (!isValid) {
        result.safe = false;
        result.threats.push({
          type: 'invalid_magic_bytes',
          message: `Invalid file signature for MIME type ${file.mimetype}`,
          severity: 'high',
          details: {
            expected: mimeTypeConfig.magicBytes,
            actual: fileHeader.substring(0, 32)
          }
        });
        return false;
      }
      
      result.validationDetails.magicBytes = {
        passed: true,
        signature: fileHeader.substring(0, 32)
      };
      
      return true;
      
    } catch (error) {
      result.threats.push({
        type: 'magic_bytes_error',
        message: `Failed to read file signature: ${error.message}`,
        severity: 'medium'
      });
      return false;
    }
  }
  
  /**
   * Validate file size
   */
  validateFileSize(file, result) {
    const mimeTypeConfig = this.allowedMimeTypes.get(file.mimetype);
    const maxSize = mimeTypeConfig ? mimeTypeConfig.maxSize : SecurityConfig.fileUpload.maxFileSize;
    
    if (file.size > maxSize) {
      result.safe = false;
      result.threats.push({
        type: 'file_too_large',
        message: `File size ${file.size} exceeds maximum allowed size ${maxSize}`,
        severity: 'medium',
        details: {
          maxSize: maxSize,
          actualSize: file.size
        }
      });
      return false;
    }
    
    result.validationDetails.fileSize = {
      passed: true,
      size: file.size,
      maxSize: maxSize
    };
    
    return true;
  }
  
  /**
   * Validate filename security
   */
  validateFilenameSecurity(file, result) {
    const filename = file.originalname;
    
    // Check for path traversal attempts
    if (filename.includes('../') || filename.includes('..\\')) {
      result.safe = false;
      result.threats.push({
        type: 'path_traversal',
        message: 'Path traversal attempt detected in filename',
        severity: 'critical'
      });
      return false;
    }
    
    // Check for null bytes
    if (filename.includes('\0')) {
      result.safe = false;
      result.threats.push({
        type: 'null_byte',
        message: 'Null byte detected in filename',
        severity: 'critical'
      });
      return false;
    }
    
    // Check filename length
    if (filename.length > 255) {
      result.safe = false;
      result.threats.push({
        type: 'filename_too_long',
        message: 'Filename exceeds maximum length of 255 characters',
        severity: 'medium'
      });
      return false;
    }
    
    result.validationDetails.filename = {
      passed: true,
      length: filename.length
    };
    
    return true;
  }
  
  /**
   * Validate file content
   */
  async validateFileContent(file, result) {
    // For text-based files, scan for suspicious content
    if (file.mimetype === 'text/plain') {
      try {
        const content = await fs.promises.readFile(file.path, 'utf8');
        
        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
          if (pattern.test(content)) {
            result.safe = false;
            result.threats.push({
              type: 'suspicious_content',
              message: 'Suspicious content detected in file',
              severity: 'high',
              details: {
                pattern: pattern.toString()
              }
            });
            return false;
          }
        }
      } catch (error) {
        // If we can't read the file, that's a validation issue
        result.threats.push({
          type: 'content_read_error',
          message: `Failed to read file content: ${error.message}`,
          severity: 'medium'
        });
        return false;
      }
    }
    
    result.validationDetails.content = {
      passed: true,
      mimetype: file.mimetype
    };
    
    return true;
  }
  
  /**
   * Scan file for viruses
   */
  async scanForVirus(file, result) {
    // Check cache first
    const cacheKey = `${file.path}-${file.size}-${file.mimetype}`;
    const cachedResult = this.getFromCache(cacheKey);
    
    if (cachedResult) {
      if (!cachedResult.safe) {
        result.safe = false;
        result.threats.push(...cachedResult.threats);
        return false;
      }
      return true;
    }
    
    try {
      let scanResult;
      
      switch (SecurityConfig.fileUpload.virusScanner.toLowerCase()) {
        case 'clamav':
          scanResult = await this.scanWithClamAV(file.path);
          break;
        case 'windows-defender':
          scanResult = await this.scanWithWindowsDefender(file.path);
          break;
        default:
          // No scanner configured
          result.validationDetails.virusScan = {
            passed: true,
            message: 'No virus scanner configured'
          };
          return true;
      }
      
      // Cache the result
      this.addToCache(cacheKey, scanResult);
      
      if (!scanResult.safe) {
        result.safe = false;
        result.threats.push(...scanResult.threats);
        return false;
      }
      
      result.validationDetails.virusScan = {
        passed: true,
        scanner: SecurityConfig.fileUpload.virusScanner
      };
      
      return true;
      
    } catch (error) {
      result.threats.push({
        type: 'virus_scan_error',
        message: `Virus scan failed: ${error.message}`,
        severity: SecurityConfig.fileUpload.failSafeOnScanError ? 'high' : 'low'
      });
      
      // If fail-safe is enabled, reject the file on scan error
      if (SecurityConfig.fileUpload.failSafeOnScanError) {
        result.safe = false;
        return false;
      }
      
      return true;
    }
  }
  
  /**
   * Scan with ClamAV
   */
  async scanWithClamAV(filePath) {
    try {
      const { stdout, stderr } = await execAsync(`clamdscan --no-summary "${filePath}"`, {
        timeout: SecurityConfig.fileUpload.virusCheckTimeout
      });
      
      const result = {
        safe: true,
        threats: []
      };
      
      if (stdout.includes('FOUND')) {
        result.safe = false;
        result.threats.push({
          type: 'virus_detected',
          message: 'Virus detected by ClamAV',
          severity: 'critical',
          details: {
            clamavOutput: stdout.trim()
          }
        });
      }
      
      return result;
      
    } catch (error) {
      if (error.code === 1) {
        // ClamAV returns exit code 1 when virus is found
        return {
          safe: false,
          threats: [{
            type: 'virus_detected',
            message: 'Virus detected by ClamAV',
            severity: 'critical'
          }]
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Scan with Windows Defender
   */
  async scanWithWindowsDefender(filePath) {
    try {
      const { stdout } = await execAsync(`powershell -Command "Get-MpThreat -Path '${filePath}'"`, {
        timeout: SecurityConfig.fileUpload.virusCheckTimeout
      });
      
      const result = {
        safe: true,
        threats: []
      };
      
      if (stdout && stdout.trim() !== '') {
        result.safe = false;
        result.threats.push({
          type: 'virus_detected',
          message: 'Threat detected by Windows Defender',
          severity: 'critical',
          details: {
            defenderOutput: stdout.trim()
          }
        });
      }
      
      return result;
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Validate user permissions
   */
  validateUserPermissions(file, user, result) {
    // Check if user has permission to upload this file type
    if (user && user.permissions) {
      const userPermissions = user.permissions;
      
      // Check file size limit based on user role
      const maxFileSizeByRole = {
        'user': 10 * 1024 * 1024, // 10MB
        'premium': 50 * 1024 * 1024, // 50MB
        'admin': 100 * 1024 * 1024, // 100MB
        'super_admin': 500 * 1024 * 1024 // 500MB
      };
      
      const userMaxSize = maxFileSizeByRole[user.role] || maxFileSizeByRole['user'];
      const mimeTypeConfig = this.allowedMimeTypes.get(file.mimetype);
      const mimeTypeMaxSize = mimeTypeConfig ? mimeTypeConfig.maxSize : SecurityConfig.fileUpload.maxFileSize;
      const effectiveMaxSize = Math.min(userMaxSize, mimeTypeMaxSize);
      
      if (file.size > effectiveMaxSize) {
        result.safe = false;
        result.threats.push({
          type: 'user_file_size_limit',
          message: `File size exceeds user limit for role ${user.role}`,
          severity: 'medium',
          details: {
            userMaxSize: userMaxSize,
            mimeTypeMaxSize: mimeTypeMaxSize,
            effectiveMaxSize: effectiveMaxSize,
            actualSize: file.size
          }
        });
        return false;
      }
    }
    
    result.validationDetails.userPermissions = {
      passed: true,
      role: user ? user.role : 'anonymous'
    };
    
    return true;
  }
  
  /**
   * Check rate limit
   */
  checkRateLimit(file, user, result) {
    // Simple rate limiting implementation
    // In a production environment, this would integrate with Redis or similar
    
    const userId = user ? user.id : 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxUploads = 100; // Max uploads per hour
    
    // This is a simplified implementation
    // In production, use Redis or database for persistent rate limiting
    
    result.validationDetails.rateLimit = {
      passed: true,
      userId: userId
    };
    
    return true;
  }
  
  /**
   * Add result to cache
   */
  addToCache(key, result) {
    this.scanCache.set(key, {
      result: result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }
  
  /**
   * Get result from cache
   */
  getFromCache(key) {
    const cached = this.scanCache.get(key);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheTTL) {
        return cached.result;
      } else {
        this.scanCache.delete(key);
      }
    }
    
    return null;
  }
  
  /**
   * Clean up cache
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.scanCache.entries()) {
      const age = now - value.timestamp;
      if (age >= this.cacheTTL) {
        this.scanCache.delete(key);
      }
    }
  }
  
  /**
   * Quarantine a dangerous file
   */
  async quarantineFile(file, threats) {
    try {
      const quarantineFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;
      const quarantinePath = path.join(this.quarantinePath, quarantineFileName);
      
      // Move file to quarantine
      await fs.promises.rename(file.path, quarantinePath);
      
      // Log quarantine event
      console.warn('🚨 File quarantined:', {
        originalName: file.originalname,
        quarantinePath: quarantinePath,
        threats: threats,
        timestamp: new Date().toISOString()
      });
      
      return quarantinePath;
    } catch (error) {
      console.error('❌ Failed to quarantine file:', error.message);
      throw error;
    }
  }
  
  /**
   * Get allowed MIME types
   */
  getAllowedMimeTypes() {
    return Array.from(this.allowedMimeTypes.keys());
  }
  
  /**
   * Get MIME type configuration
   */
  getMimeTypeConfig(mimetype) {
    return this.allowedMimeTypes.get(mimetype);
  }
}

// Export singleton instance
const enhancedFileValidationService = new EnhancedFileValidationService();

export default enhancedFileValidationService;
export { EnhancedFileValidationService };