/**
 * File System Security and Management System
 * Addresses: Unsecured file operations, No file cleanup mechanism, Missing file size validation,
 * Incomplete file type checking, No file encryption at rest, Uncontrolled file upload sizes
 */

import uploadConfig from '../config/uploadConfig.js';
import MemoryManager from '../performance/MemoryManager.js';
import { InputSanitizer, FileUploadSecurity } from '../security/ClientSecurityHelpers.js';

// File system error class
class FileSystemError extends Error {
  constructor(message, code, operation, fileId, retryable = false) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
    this.operation = operation;
    this.fileId = fileId;
    this.retryable = retryable;
  }
}

class FileSystemManager {
  static instance = null;
  fileRegistry = new Map();
  uploadProgresses = new Map();
  encryptionKey = null;
  cleanupInterval = null;
  quotaManager = new Map();
  
  // Configuration
  config = {
    maxFileSize: uploadConfig.maxFileSize,
    maxImageSize: uploadConfig.maxImageSize,
    uploadDirectory: '/uploads',
    tempDirectory: '/tmp/uploads',
    encryptionEnabled: true,
    virusScanEnabled: false,
    cleanupInterval: 3600000, // 1 hour
    defaultFileExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxQuotaPerUser: 1024 * 1024 * 1024, // 1GB per user
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
      '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx',
      '.ppt', '.pptx', '.mp4', '.avi', '.mov', '.zip'
    ],
    dangerousExtensions: [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
      '.jar', '.js', '.vbs', '.ps1', '.sh', '.php'
    ]
  };

  constructor() {
    this.initializeEncryption();
    this.startCleanupProcess();
  }

  static getInstance() {
    if (!FileSystemManager.instance) {
      FileSystemManager.instance = new FileSystemManager();
    }
    return FileSystemManager.instance;
  }

  /**
   * Initialize encryption key
   */
  async initializeEncryption() {
    if (!this.config.encryptionEnabled || typeof crypto === 'undefined') {
      this.log('⚠️ File encryption disabled or crypto not available', 'warn');
      return;
    }

    try {
      // Generate or retrieve encryption key
      this.encryptionKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      this.log('🔐 File encryption initialized');
    } catch (error) {
      this.log(`❌ Failed to initialize encryption: ${error.message}`, 'error');
    }
  }

  /**
   * Start cleanup process
   */
  startCleanupProcess() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);

    MemoryManager.registerInterval(this.cleanupInterval);
  }

  /**
   * Validate file before upload
   */
  validateFile(file, userId, fileType = 'image') {
    const errors = [];
    const warnings = [];

    try {
      // Basic file validation using existing security config
      FileUploadSecurity.validateFile(file, fileType);
      
      // Additional validations
      const sanitizedName = InputSanitizer.sanitizeFileName(file.name);
      
      // Check file extension
      const extension = this.getFileExtension(file.name).toLowerCase();
      if (this.config.dangerousExtensions.includes(extension)) {
        errors.push(`File extension ${extension} is not allowed for security reasons`);
      }
      
      if (!this.config.allowedExtensions.includes(extension)) {
        warnings.push(`File extension ${extension} is uncommon, please verify file integrity`);
      }

      // Check user quota
      const userQuota = this.quotaManager.get(userId);
      if (userQuota && (userQuota.used + file.size) > userQuota.limit) {
        errors.push(`File would exceed user quota limit (${this.formatBytes(userQuota.limit)})`);
      }

      // Detect actual MIME type (simplified detection)
      const detectedMimeType = this.detectMimeType(file);
      if (detectedMimeType !== file.type) {
        warnings.push(`File MIME type mismatch: declared ${file.type}, detected ${detectedMimeType}`);
      }

      // Check for suspicious patterns in file name
      if (this.hasSuspiciousPatterns(file.name)) {
        warnings.push('File name contains suspicious patterns');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        sanitizedName,
        detectedMimeType
      };

    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings,
        sanitizedName: InputSanitizer.sanitizeFileName(file.name),
        detectedMimeType: file.type
      };
    }
  }

  /**
   * Upload file with security checks
   */
  async uploadFile(file, userId, options = {}) {
    const fileId = this.generateFileId();
    
    try {
      // Validate file
      const validation = this.validateFile(file, userId, options.fileType);
      if (!validation.valid) {
        throw new FileSystemError(
          `File validation failed: ${validation.errors.join(', ')}`,
          'VALIDATION_ERROR',
          'upload',
          fileId
        );
      }

      // Initialize upload progress
      const progress = {
        fileId,
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading'
      };

      this.uploadProgresses.set(fileId, progress);
      if (options.onProgress) options.onProgress(progress);

      // Create file metadata
      const expiresAt = options.expiresIn ? Date.now() + options.expiresIn : undefined;
      const metadata = {
        id: fileId,
        name: validation.sanitizedName,
        originalName: file.name,
        size: file.size,
        mimeType: validation.detectedMimeType,
        extension: this.getFileExtension(file.name),
        path: this.generateFilePath(fileId, validation.sanitizedName, options.temporary),
        hash: await this.calculateFileHash(file),
        encrypted: options.encrypt ?? this.config.encryptionEnabled,
        uploadedAt: Date.now(),
        lastAccessed: Date.now(),
        ...(expiresAt && { expiresAt }),
        permissions: this.createFilePermissions(userId, options.permissions),
        tags: options.tags || [],
        cloudProvider: 'local',
      };

      // Process file
      progress.status = 'processing';
      progress.percentage = 50;
      this.uploadProgresses.set(fileId, progress);
      if (options.onProgress) options.onProgress(progress);

      // Encrypt file if required
      let fileData = await this.fileToArrayBuffer(file);
      if (metadata.encrypted && this.encryptionKey) {
        fileData = await this.encryptFile(fileData);
      }

      // Virus scan (if enabled)
      if (this.config.virusScanEnabled) {
        metadata.scanResult = await this.performVirusScan(file);
        if (!metadata.scanResult.clean) {
          throw new FileSystemError(
            `File failed virus scan: ${metadata.scanResult.threats.join(', ')}`,
            'VIRUS_DETECTED',
            'upload',
            fileId
          );
        }
      }

      // Store file (in a real implementation, this would save to disk/cloud)
      await this.storeFile(metadata.path, fileData);

      // Update user quota
      this.updateUserQuota(userId, file.size);

      // Register file in registry
      this.fileRegistry.set(fileId, metadata);

      // Complete upload progress
      progress.status = 'completed';
      progress.percentage = 100;
      progress.loaded = file.size;
      this.uploadProgresses.set(fileId, progress);
      if (options.onProgress) options.onProgress(progress);

      // Register with memory manager
      MemoryManager.registerComponent(`FileUpload-${fileId}`);

      this.log(`✅ File uploaded successfully: ${metadata.name} (${fileId})`);

      return {
        success: true,
        fileId,
        metadata,
        warnings: validation.warnings
      };

    } catch (error) {
      // Update progress with error
      const progress = this.uploadProgresses.get(fileId);
      if (progress) {
        progress.status = 'error';
        progress.error = error.message;
        this.uploadProgresses.set(fileId, progress);
        if (options.onProgress) options.onProgress(progress);
      }

      this.log(`❌ File upload failed: ${error.message}`, 'error');

      return {
        success: false,
        error: error.message,
        warnings: []
      };
    }
  }

  /**
   * Download file with access control
   */
  async downloadFile(fileId, userId, options = {}) {
    try {
      const metadata = this.fileRegistry.get(fileId);
      if (!metadata) {
        throw new FileSystemError(
          'File not found',
          'FILE_NOT_FOUND',
          'download',
          fileId
        );
      }

      // Check permissions
      if (!this.hasReadPermission(userId, metadata)) {
        throw new FileSystemError(
          'Access denied',
          'ACCESS_DENIED',
          'download',
          fileId
        );
      }

      // Check if file has expired
      if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
        throw new FileSystemError(
          'File has expired',
          'FILE_EXPIRED',
          'download',
          fileId
        );
      }

      // Load file data
      let fileData = await this.loadFile(metadata.path);

      // Decrypt if required
      if (metadata.encrypted && options.decrypt !== false && this.encryptionKey) {
        fileData = await this.decryptFile(fileData);
      }

      // Update access tracking
      if (options.trackAccess !== false) {
        metadata.lastAccessed = Date.now();
        this.fileRegistry.set(fileId, metadata);
      }

      this.log(`📤 File downloaded: ${metadata.name} (${fileId})`);

      return {
        success: true,
        fileId,
        metadata,
        warnings: []
      };

    } catch (error) {
      this.log(`❌ File download failed: ${error.message}`, 'error');

      return {
        success: false,
        error: error.message,
        warnings: []
      };
    }
  }

  /**
   * Delete file with security checks
   */
  async deleteFile(fileId, userId) {
    try {
      const metadata = this.fileRegistry.get(fileId);
      if (!metadata) {
        throw new FileSystemError(
          'File not found',
          'FILE_NOT_FOUND',
          'delete',
          fileId
        );
      }

      // Check permissions
      if (!this.hasDeletePermission(userId, metadata)) {
        throw new FileSystemError(
          'Access denied',
          'ACCESS_DENIED',
          'delete',
          fileId
        );
      }

      // Remove physical file
      await this.removeFile(metadata.path);

      // Update user quota
      this.updateUserQuota(userId, -metadata.size);

      // Remove from registry
      this.fileRegistry.delete(fileId);

      // Clean up upload progress if exists
      this.uploadProgresses.delete(fileId);

      // Unregister from memory manager
      MemoryManager.unregisterComponent(`FileUpload-${fileId}`);

      this.log(`🗑️ File deleted: ${metadata.name} (${fileId})`);

      return {
        success: true,
        fileId,
        warnings: []
      };

    } catch (error) {
      this.log(`❌ File deletion failed: ${error.message}`, 'error');

      return {
        success: false,
        error: error.message,
        warnings: []
      };
    }
  }

  /**
   * Get file metadata
   */
  getFileMetadata(fileId, userId) {
    const metadata = this.fileRegistry.get(fileId);
    if (!metadata) return null;

    // Check read permissions
    if (!this.hasReadPermission(userId, metadata)) {
      return null;
    }

    return { ...metadata }; // Return copy to prevent external modification
  }

  /**
   * List user files
   */
  listUserFiles(userId, options = {}) {
    const userFiles = Array.from(this.fileRegistry.values())
      .filter(file => this.hasReadPermission(userId, file));

    // Apply filters
    let filteredFiles = userFiles;
    
    if (options.tags && options.tags.length > 0) {
      filteredFiles = filteredFiles.filter(file => 
        options.tags.some(tag => file.tags.includes(tag))
      );
    }

    if (options.mimeType) {
      filteredFiles = filteredFiles.filter(file => 
        file.mimeType.startsWith(options.mimeType)
      );
    }

    // Apply sorting
    if (options.sortBy) {
      filteredFiles.sort((a, b) => {
        const aVal = a[options.sortBy];
        const bVal = b[options.sortBy];
        
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : undefined;
    
    return filteredFiles.slice(start, end);
  }

  /**
   * Get upload progress
   */
  getUploadProgress(fileId) {
    return this.uploadProgresses.get(fileId) || null;
  }

  /**
   * Get user quota information
   */
  getUserQuota(userId) {
    const quota = this.quotaManager.get(userId) || { used: 0, limit: this.config.maxQuotaPerUser };
    return {
      used: quota.used,
      limit: quota.limit,
      available: quota.limit - quota.used
    };
  }

  /**
   * Set user quota limit
   */
  setUserQuotaLimit(userId, limit) {
    const current = this.quotaManager.get(userId) || { used: 0, limit: this.config.maxQuotaPerUser };
    this.quotaManager.set(userId, { ...current, limit });
  }

  /**
   * Perform cleanup of expired and temporary files
   */
  async performCleanup() {
    this.log('🧹 Starting file system cleanup...');
    
    const now = Date.now();
    let cleanedCount = 0;
    let reclaimedBytes = 0;

    for (const [fileId, metadata] of this.fileRegistry.entries()) {
      let shouldDelete = false;
      let reason = '';

      // Check expiration
      if (metadata.expiresAt && now > metadata.expiresAt) {
        shouldDelete = true;
        reason = 'expired';
      }

      // Check if temporary file is old
      if (metadata.path.includes('/tmp/') && (now - metadata.uploadedAt) > (24 * 60 * 60 * 1000)) {
        shouldDelete = true;
        reason = 'temporary file timeout';
      }

      // Check if file hasn't been accessed for a long time
      if ((now - metadata.lastAccessed) > (30 * 24 * 60 * 60 * 1000)) { // 30 days
        shouldDelete = true;
        reason = 'unused for 30 days';
      }

      if (shouldDelete) {
        try {
          await this.removeFile(metadata.path);
          this.fileRegistry.delete(fileId);
          this.updateUserQuota(metadata.permissions.owner, -metadata.size);
          
          cleanedCount++;
          reclaimedBytes += metadata.size;
          
          this.log(`🗑️ Cleaned up file: ${metadata.name} (${reason})`);
        } catch (error) {
          this.log(`⚠️ Failed to clean up file ${metadata.name}: ${error.message}`, 'warn');
        }
      }
    }

    // Clean up old upload progress records
    for (const [fileId, progress] of this.uploadProgresses.entries()) {
      if (progress.status === 'completed' || progress.status === 'error') {
        // Remove completed/errored progress after 1 hour
        this.uploadProgresses.delete(fileId);
      }
    }

    if (cleanedCount > 0) {
      this.log(`🧹 Cleanup completed: ${cleanedCount} files removed, ${this.formatBytes(reclaimedBytes)} reclaimed`);
    }
  }

  /**
   * Helper methods
   */

  generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  generateFilePath(fileId, fileName, temporary = false) {
    const dir = temporary ? this.config.tempDirectory : this.config.uploadDirectory;
    const safeName = InputSanitizer.sanitizeFileName(fileName);
    return `${dir}/${fileId}_${safeName}`;
  }

  getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '';
  }

  detectMimeType(file) {
    // Simplified MIME type detection - in production, use a proper library
    const extension = this.getFileExtension(file.name).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeMap[extension] || file.type || 'application/octet-stream';
  }

  hasSuspiciousPatterns(fileName) {
    const suspiciousPatterns = [
      /\.\./,           // Path traversal
      /[<>:"|?*]/,      // Invalid filename characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
      /script|javascript|vbscript/i, // Script-related names
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  async calculateFileHash(file) {
    const buffer = await this.fileToArrayBuffer(file);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async encryptFile(data) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      data
    );

    // Prepend IV to encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    return result.buffer;
  }

  async decryptFile(data) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    const dataView = new Uint8Array(data);
    const iv = dataView.slice(0, 12); // Extract 96-bit IV
    const encryptedContent = dataView.slice(12);

    return await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      encryptedContent
    );
  }

  async performVirusScan(file) {
    // Placeholder for virus scanning - integrate with actual AV service
    return {
      scanned: true,
      clean: true,
      threats: [],
      scanDate: Date.now(),
      scanner: 'MockScanner'
    };
  }

  createFilePermissions(ownerId, customPermissions) {
    return {
      owner: ownerId,
      group: 'default',
      read: [ownerId],
      write: [ownerId],
      delete: [ownerId],
      public: false,
      ...customPermissions
    };
  }

  hasReadPermission(userId, metadata) {
    return metadata.permissions.public ||
           metadata.permissions.owner === userId ||
           metadata.permissions.read.includes(userId);
  }

  hasDeletePermission(userId, metadata) {
    return metadata.permissions.owner === userId ||
           metadata.permissions.delete.includes(userId);
  }

  updateUserQuota(userId, sizeDelta) {
    const current = this.quotaManager.get(userId) || { used: 0, limit: this.config.maxQuotaPerUser };
    const newUsed = Math.max(0, current.used + sizeDelta);
    this.quotaManager.set(userId, { ...current, used: newUsed });
  }

  async storeFile(path, data) {
    // Placeholder for actual file storage (filesystem, cloud storage, etc.)
    this.log(`💾 Storing file at: ${path} (${data.byteLength} bytes)`);
  }

  async loadFile(path) {
    // Placeholder for actual file loading
    this.log(`📂 Loading file from: ${path}`);
    return new ArrayBuffer(0); // Mock implementation
  }

  async removeFile(path) {
    // Placeholder for actual file removal
    this.log(`🗑️ Removing file: ${path}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[FileSystemManager ${timestamp}]`;
    
    switch (level) {
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * Shutdown cleanup
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      MemoryManager.unregisterInterval(this.cleanupInterval);
    }
    
    this.log('🔌 FileSystemManager shutdown complete');
  }
}

// Export singleton instance
const fileSystemManager = FileSystemManager.getInstance();

export default fileSystemManager;

// Export error class
export {
  FileSystemError
};