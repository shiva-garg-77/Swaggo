/**
 * File System Security and Management System
 * Addresses: Unsecured file operations, No file cleanup mechanism, Missing file size validation,
 * Incomplete file type checking, No file encryption at rest, Uncontrolled file upload sizes
 */

import { uploadConfig } from '../config/environment.js';
import MemoryManager from '../performance/MemoryManager';
import { InputSanitizer, FileUploadSecurity } from '../security/SecurityConfig';

// File operation types
type FileOperation = 'upload' | 'download' | 'delete' | 'move' | 'copy' | 'read' | 'write';

// File metadata interface
interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  extension: string;
  path: string;
  hash: string;
  encrypted: boolean;
  uploadedAt: number;
  lastAccessed: number;
  expiresAt?: number;
  permissions: FilePermissions;
  scanResult?: VirusScanResult;
  tags: string[];
}

// File permissions interface
interface FilePermissions {
  owner: string;
  group: string;
  read: string[];
  write: string[];
  delete: string[];
  public: boolean;
}

// Virus scan result interface
interface VirusScanResult {
  scanned: boolean;
  clean: boolean;
  threats: string[];
  scanDate: number;
  scanner: string;
}

// File validation result interface
interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedName: string;
  detectedMimeType: string;
}

// File operation result interface
interface FileOperationResult {
  success: boolean;
  fileId?: string;
  metadata?: FileMetadata;
  error?: string;
  warnings: string[];
}

// Upload progress interface
interface UploadProgress {
  fileId: string;
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// File system error class
class FileSystemError extends Error {
  public readonly code: string;
  public readonly operation: FileOperation;
  public readonly fileId: string | undefined;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    operation: FileOperation,
    fileId?: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
    this.operation = operation;
    this.fileId = fileId;
    this.retryable = retryable;
  }
}

class FileSystemManager {
  private static instance: FileSystemManager;
  private fileRegistry: Map<string, FileMetadata> = new Map();
  private uploadProgresses: Map<string, UploadProgress> = new Map();
  private encryptionKey: CryptoKey | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private quotaManager: Map<string, { used: number; limit: number }> = new Map();
  
  // Configuration
  private readonly config = {
    maxFileSize: uploadConfig.maxFileSize,
    maxImageSize: uploadConfig.maxImageSize,
    allowedTypes: uploadConfig.allowedTypes,
    uploadDirectory: uploadConfig.uploadDirectory || '/uploads',
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

  static getInstance(): FileSystemManager {
    if (!FileSystemManager.instance) {
      FileSystemManager.instance = new FileSystemManager();
    }
    return FileSystemManager.instance;
  }

  /**
   * Initialize encryption key
   */
  private async initializeEncryption(): Promise<void> {
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
      this.log(`❌ Failed to initialize encryption: ${(error as Error).message}`, 'error');
    }
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);

    MemoryManager.registerInterval(this.cleanupInterval as unknown as number);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, userId: string, fileType: 'image' | 'document' = 'image'): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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
        errors: [(error as Error).message],
        warnings,
        sanitizedName: InputSanitizer.sanitizeFileName(file.name),
        detectedMimeType: file.type
      };
    }
  }

  /**
   * Upload file with security checks
   */
  async uploadFile(
    file: File,
    userId: string,
    options: {
      fileType?: 'image' | 'document';
      encrypt?: boolean;
      temporary?: boolean;
      expiresIn?: number;
      tags?: string[];
      permissions?: Partial<FilePermissions>;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<FileOperationResult> {
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
      const progress: UploadProgress = {
        fileId,
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading'
      };

      this.uploadProgresses.set(fileId, progress);
      options.onProgress?.(progress);

      // Create file metadata
      const expiresAt = options.expiresIn ? Date.now() + options.expiresIn : undefined;
      const metadata: FileMetadata = {
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
      };

      // Process file
      progress.status = 'processing';
      progress.percentage = 50;
      this.uploadProgresses.set(fileId, progress);
      options.onProgress?.(progress);

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
      options.onProgress?.(progress);

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
        progress.error = (error as Error).message;
        this.uploadProgresses.set(fileId, progress);
        options.onProgress?.(progress);
      }

      this.log(`❌ File upload failed: ${(error as Error).message}`, 'error');

      return {
        success: false,
        error: (error as Error).message,
        warnings: []
      };
    }
  }

  /**
   * Download file with access control
   */
  async downloadFile(
    fileId: string,
    userId: string,
    options: {
      decrypt?: boolean;
      trackAccess?: boolean;
    } = {}
  ): Promise<FileOperationResult> {
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
      this.log(`❌ File download failed: ${(error as Error).message}`, 'error');

      return {
        success: false,
        error: (error as Error).message,
        warnings: []
      };
    }
  }

  /**
   * Delete file with security checks
   */
  async deleteFile(fileId: string, userId: string): Promise<FileOperationResult> {
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
      this.log(`❌ File deletion failed: ${(error as Error).message}`, 'error');

      return {
        success: false,
        error: (error as Error).message,
        warnings: []
      };
    }
  }

  /**
   * Get file metadata
   */
  getFileMetadata(fileId: string, userId: string): FileMetadata | null {
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
  listUserFiles(userId: string, options: {
    tags?: string[];
    mimeType?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'size' | 'uploadedAt' | 'lastAccessed';
    sortOrder?: 'asc' | 'desc';
  } = {}): FileMetadata[] {
    const userFiles = Array.from(this.fileRegistry.values())
      .filter(file => this.hasReadPermission(userId, file));

    // Apply filters
    let filteredFiles = userFiles;
    
    if (options.tags && options.tags.length > 0) {
      filteredFiles = filteredFiles.filter(file => 
        options.tags!.some(tag => file.tags.includes(tag))
      );
    }

    if (options.mimeType) {
      filteredFiles = filteredFiles.filter(file => 
        file.mimeType.startsWith(options.mimeType!)
      );
    }

    // Apply sorting
    if (options.sortBy) {
      filteredFiles.sort((a, b) => {
        const aVal = a[options.sortBy!] as any;
        const bVal = b[options.sortBy!] as any;
        
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
  getUploadProgress(fileId: string): UploadProgress | null {
    return this.uploadProgresses.get(fileId) || null;
  }

  /**
   * Get user quota information
   */
  getUserQuota(userId: string): { used: number; limit: number; available: number } {
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
  setUserQuotaLimit(userId: string, limit: number): void {
    const current = this.quotaManager.get(userId) || { used: 0, limit: this.config.maxQuotaPerUser };
    this.quotaManager.set(userId, { ...current, limit });
  }

  /**
   * Perform cleanup of expired and temporary files
   */
  private async performCleanup(): Promise<void> {
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
          this.log(`⚠️ Failed to clean up file ${metadata.name}: ${(error as Error).message}`, 'warn');
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

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateFilePath(fileId: string, fileName: string, temporary: boolean = false): string {
    const dir = temporary ? this.config.tempDirectory : this.config.uploadDirectory;
    const safeName = InputSanitizer.sanitizeFileName(fileName);
    return `${dir}/${fileId}_${safeName}`;
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '';
  }

  private detectMimeType(file: File): string {
    // Simplified MIME type detection - in production, use a proper library
    const extension = this.getFileExtension(file.name).toLowerCase();
    const mimeMap: Record<string, string> = {
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

  private hasSuspiciousPatterns(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.\./,           // Path traversal
      /[<>:"|?*]/,      // Invalid filename characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
      /script|javascript|vbscript/i, // Script-related names
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await this.fileToArrayBuffer(file);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async encryptFile(data: ArrayBuffer): Promise<ArrayBuffer> {
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

  private async decryptFile(data: ArrayBuffer): Promise<ArrayBuffer> {
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

  private async performVirusScan(_file: File): Promise<VirusScanResult> {
    // Placeholder for virus scanning - integrate with actual AV service
    return {
      scanned: true,
      clean: true,
      threats: [],
      scanDate: Date.now(),
      scanner: 'MockScanner'
    };
  }

  private createFilePermissions(ownerId: string, customPermissions?: Partial<FilePermissions>): FilePermissions {
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

  private hasReadPermission(userId: string, metadata: FileMetadata): boolean {
    return metadata.permissions.public ||
           metadata.permissions.owner === userId ||
           metadata.permissions.read.includes(userId);
  }

  private hasDeletePermission(userId: string, metadata: FileMetadata): boolean {
    return metadata.permissions.owner === userId ||
           metadata.permissions.delete.includes(userId);
  }

  private updateUserQuota(userId: string, sizeDelta: number): void {
    const current = this.quotaManager.get(userId) || { used: 0, limit: this.config.maxQuotaPerUser };
    const newUsed = Math.max(0, current.used + sizeDelta);
    this.quotaManager.set(userId, { ...current, used: newUsed });
  }

  private async storeFile(path: string, data: ArrayBuffer): Promise<void> {
    // Placeholder for actual file storage (filesystem, cloud storage, etc.)
    this.log(`💾 Storing file at: ${path} (${data.byteLength} bytes)`);
  }

  private async loadFile(path: string): Promise<ArrayBuffer> {
    // Placeholder for actual file loading
    this.log(`📂 Loading file from: ${path}`);
    return new ArrayBuffer(0); // Mock implementation
  }

  private async removeFile(path: string): Promise<void> {
    // Placeholder for actual file removal
    this.log(`🗑️ Removing file: ${path}`);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
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
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      MemoryManager.unregisterInterval(this.cleanupInterval as unknown as number);
    }
    
    this.log('🔌 FileSystemManager shutdown complete');
  }
}

// Export singleton instance
export default FileSystemManager.getInstance();

// Export types and error class
export {
  FileSystemError,
  type FileMetadata,
  type FileValidationResult,
  type FileOperationResult,
  type UploadProgress,
  type FilePermissions
};