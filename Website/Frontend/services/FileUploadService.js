/**
 * Centralized File Upload Service
 * Consolidates all file handling logic with standardized error handling and progress tracking
 */

import { EventEmitter } from 'events';
import apiService from './ApiService';
import validationService from './ValidationService';
import notificationService from './NotificationService';

/**
 * Upload Status Constants
 */
const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused'
};

/**
 * File Types Configuration
 */
const FILE_TYPES = {
  IMAGE: {
    name: 'image',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Image files'
  },
  VIDEO: {
    name: 'video',
    extensions: ['mp4', 'webm', 'ogg', 'avi', 'mov'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024, // 100MB
    description: 'Video files'
  },
  AUDIO: {
    name: 'audio',
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'],
    maxSize: 20 * 1024 * 1024, // 20MB
    description: 'Audio files'
  },
  DOCUMENT: {
    name: 'document',
    extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    description: 'Document files'
  },
  ARCHIVE: {
    name: 'archive',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
    maxSize: 200 * 1024 * 1024, // 200MB
    description: 'Archive files'
  },
  ANY: {
    name: 'any',
    extensions: ['*'],
    mimeTypes: ['*'],
    maxSize: 500 * 1024 * 1024, // 500MB
    description: 'Any file type'
  }
};

/**
 * Upload Configuration
 */
const DEFAULT_CONFIG = {
  chunkSize: 1024 * 1024, // 1MB chunks
  maxConcurrentUploads: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  autoRetry: true,
  validateOnUpload: true,
  generateThumbnails: true,
  compressImages: false,
  allowedTypes: [FILE_TYPES.ANY],
  endpoint: '/upload', // Fixed: Aligned with backend endpoint in main.js
  timeout: 30000
};

/**
 * File Upload Service Class
 */
class FileUploadService extends EventEmitter {
  constructor() {
    super();
    
    // Configuration
    this.config = { ...DEFAULT_CONFIG };
    
    // Active uploads tracking
    this.activeUploads = new Map(); // uploadId -> upload data
    this.uploadQueue = [];
    this.completedUploads = new Map();
    this.failedUploads = new Map();
    
    // Statistics
    this.stats = {
      totalUploads: 0,
      completedUploads: 0,
      failedUploads: 0,
      totalBytesUploaded: 0,
      totalUploadTime: 0
    };
    
    // Worker and utilities
    this.worker = null;
    this.isProcessing = false;
    
    // Initialize service
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  initializeService() {
    // Setup web worker for file processing if available
    if (typeof Worker !== 'undefined') {
      this.setupWorker();
    }
    
    // Setup drag and drop handlers
    this.setupDragAndDrop();
    
    // Start processing queue
    this.startQueueProcessor();
  }

  /**
   * Setup web worker for file processing
   */
  setupWorker() {
    try {
      const workerCode = `
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          switch (type) {
            case 'COMPRESS_IMAGE':
              compressImage(data);
              break;
            case 'GENERATE_THUMBNAIL':
              generateThumbnail(data);
              break;
            case 'CALCULATE_HASH':
              calculateHash(data);
              break;
          }
        };
        
        function compressImage({ file, quality, maxWidth, maxHeight }) {
          // Image compression logic would go here
          self.postMessage({ 
            type: 'IMAGE_COMPRESSED', 
            data: { success: true, file } 
          });
        }
        
        function generateThumbnail({ file, width, height }) {
          // Thumbnail generation logic would go here
          self.postMessage({ 
            type: 'THUMBNAIL_GENERATED', 
            data: { success: true, thumbnail: null } 
          });
        }
        
        function calculateHash({ file }) {
          // Hash calculation logic would go here
          self.postMessage({ 
            type: 'HASH_CALCULATED', 
            data: { success: true, hash: 'dummy-hash' } 
          });
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      this.worker.onmessage = (e) => {
        this.handleWorkerMessage(e.data);
      };
      
      this.worker.onerror = (error) => {
        console.warn('File processing worker error:', error);
      };
      
    } catch (error) {
      console.warn('Web Worker not available:', error);
    }
  }

  /**
   * Handle web worker messages
   */
  handleWorkerMessage({ type, data }) {
    switch (type) {
      case 'IMAGE_COMPRESSED':
        this.emit('imageCompressed', data);
        break;
      case 'THUMBNAIL_GENERATED':
        this.emit('thumbnailGenerated', data);
        break;
      case 'HASH_CALCULATED':
        this.emit('hashCalculated', data);
        break;
    }
  }

  /**
   * Setup global drag and drop handlers
   */
  setupDragAndDrop() {
    if (typeof window === 'undefined') return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, this.preventDefaults, false);
    });
    
    // Handle drop events
    document.addEventListener('drop', this.handleGlobalDrop.bind(this), false);
  }

  /**
   * Prevent default drag behaviors
   */
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Handle global drop events
   */
  handleGlobalDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      this.emit('filesDropped', { files, event: e });
    }
  }

  /**
   * Configure the service
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Upload single file
   */
  async uploadFile(file, options = {}) {
    return this.uploadFiles([file], options)[0];
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files, options = {}) {
    const uploadPromises = [];
    
    for (const file of files) {
      const uploadPromise = this.createUpload(file, options);
      uploadPromises.push(uploadPromise);
    }
    
    return Promise.all(uploadPromises);
  }

  /**
   * Create and queue a new upload
   */
  async createUpload(file, options = {}) {
    try {
      // Generate unique upload ID
      const uploadId = this.generateUploadId();
      
      // Merge options with defaults
      const uploadOptions = { ...this.config, ...options };
      
      // Validate file
      const validation = this.validateFile(file, uploadOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Create upload object
      const upload = {
        id: uploadId,
        file,
        originalName: file.name,
        size: file.size,
        type: file.type,
        status: UPLOAD_STATUS.PENDING,
        progress: 0,
        uploadedBytes: 0,
        speed: 0,
        timeRemaining: null,
        startTime: null,
        endTime: null,
        error: null,
        retryCount: 0,
        chunks: [],
        metadata: {},
        options: uploadOptions
      };
      
      // Add to queue
      this.uploadQueue.push(upload);
      this.activeUploads.set(uploadId, upload);
      
      // Update statistics
      this.stats.totalUploads++;
      
      // Emit events
      this.emit('uploadCreated', upload);
      notificationService.fileUploadProgress(file.name, 0);
      
      // Process additional file operations
      await this.processFileMetadata(upload);
      
      // Return upload promise
      return new Promise((resolve, reject) => {
        upload.resolve = resolve;
        upload.reject = reject;
      });
      
    } catch (error) {
      console.error('Error creating upload:', error);
      notificationService.fileUploadError(file.name, error.message);
      throw error;
    }
  }

  /**
   * Process file metadata and additional operations
   */
  async processFileMetadata(upload) {
    try {
      const { file, options } = upload;
      
      // Generate thumbnail for images
      if (this.isImage(file) && options.generateThumbnails) {
        upload.thumbnail = await this.generateThumbnail(file);
      }
      
      // Compress image if needed
      if (this.isImage(file) && options.compressImages) {
        upload.compressedFile = await this.compressImage(file, options.compressionOptions);
      }
      
      // Calculate file hash for deduplication
      if (options.calculateHash) {
        upload.hash = await this.calculateFileHash(file);
      }
      
      // Extract metadata
      upload.metadata = await this.extractFileMetadata(file);
      
      this.emit('metadataProcessed', upload);
      
    } catch (error) {
      console.warn('Error processing file metadata:', error);
    }
  }

  /**
   * Validate file against configured rules with visible size limits
   */
  validateFile(file, options) {
    try {
      // Basic file validation
      if (!file || !(file instanceof File)) {
        return { isValid: false, error: 'Invalid file object' };
      }
      
      // Size validation with visible limits
      const maxSize = options.maxSize || this.getMaxSizeForFile(file);
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileType = this.getFileTypeCategory(file);
        return { 
          isValid: false, 
          error: `File size exceeds limit of ${maxSizeMB}MB for ${fileType} files` 
        };
      }
      
      // Type validation
      if (options.allowedTypes && options.allowedTypes.length > 0) {
        const isTypeAllowed = options.allowedTypes.some(type => 
          this.isFileTypeAllowed(file, type)
        );
        
        if (!isTypeAllowed) {
          const allowedExtensions = options.allowedTypes
            .flatMap(type => type.extensions)
            .join(', ');
          return { 
            isValid: false, 
            error: `File type not allowed. Allowed types: ${allowedExtensions}` 
          };
        }
      }
      
      // Use validation service for additional checks
      const validationResult = validationService.validateFileUpload(file, {
        maxSize,
        allowedTypes: options.allowedTypes?.flatMap(type => type.mimeTypes) || []
      });
      
      if (!validationResult.isValid) {
        return { 
          isValid: false, 
          error: validationResult.error 
        };
      }
      
      return { isValid: true };
      
    } catch (error) {
      return { 
        isValid: false, 
        error: 'File validation failed: ' + error.message 
      };
    }
  }

  /**
   * Get file type category for user-friendly messages
   */
  getFileTypeCategory(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('application/') || file.type.startsWith('text/')) return 'document';
    return 'file';
  }

  /**
   * Get maximum size for file based on type
   */
  getMaxSizeForFile(file) {
    if (file.type.startsWith('image/')) return FILE_TYPES.IMAGE.maxSize;
    if (file.type.startsWith('video/')) return FILE_TYPES.VIDEO.maxSize;
    if (file.type.startsWith('audio/')) return FILE_TYPES.AUDIO.maxSize;
    if (file.type.startsWith('application/') || file.type.startsWith('text/')) return FILE_TYPES.DOCUMENT.maxSize;
    return FILE_TYPES.ANY.maxSize;
  }

  /**
   * Start processing upload queue
   */
  startQueueProcessor() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Process upload queue
   */
  async processQueue() {
    while (this.uploadQueue.length > 0) {
      // Get active uploads count
      const activeCount = Array.from(this.activeUploads.values())
        .filter(upload => upload.status === UPLOAD_STATUS.UPLOADING).length;
      
      // Check concurrent upload limit
      if (activeCount >= this.config.maxConcurrentUploads) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      // Get next upload from queue
      const upload = this.uploadQueue.shift();
      if (!upload) break;
      
      // Start upload
      this.startUpload(upload);
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.isProcessing = false;
  }

  /**
   * Start individual upload
   */
  async startUpload(upload) {
    try {
      upload.status = UPLOAD_STATUS.UPLOADING;
      upload.startTime = Date.now();
      
      this.emit('uploadStarted', upload);
      
      // Choose upload method based on file size
      if (upload.size > this.config.chunkSize) {
        await this.performChunkedUpload(upload);
      } else {
        await this.performDirectUpload(upload);
      }
      
    } catch (error) {
      this.handleUploadError(upload, error);
    }
  }

  /**
   * Perform direct upload for small files
   */
  async performDirectUpload(upload) {
    try {
      const { file, options } = upload;
      const fileToUpload = upload.compressedFile || file;
      
      const response = await apiService.uploadFile(
        options.endpoint,
        fileToUpload,
        {
          additionalData: {
            uploadId: upload.id,
            originalName: upload.originalName,
            metadata: JSON.stringify(upload.metadata)
          },
          onProgress: (progressData) => {
            this.updateUploadProgress(upload, progressData);
          },
          timeout: options.timeout
        }
      );
      
      if (response.success) {
        this.completeUpload(upload, response.data);
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
      
    } catch (error) {
      throw new Error(`Direct upload failed: ${error.message}`);
    }
  }

  /**
   * Perform chunked upload for large files
   */
  async performChunkedUpload(upload) {
    try {
      const { file, options } = upload;
      const fileToUpload = upload.compressedFile || file;
      const chunkSize = options.chunkSize;
      const totalChunks = Math.ceil(fileToUpload.size / chunkSize);
      
      upload.chunks = [];
      
      // Initialize chunked upload
      const initResponse = await apiService.post('/upload/init', {
        uploadId: upload.id,
        filename: upload.originalName,
        fileSize: fileToUpload.size,
        totalChunks,
        metadata: upload.metadata
      });
      
      if (!initResponse.success) {
        throw new Error('Failed to initialize chunked upload');
      }
      
      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        await this.uploadChunk(upload, fileToUpload, chunkIndex, chunkSize);
        
        // Check if upload was cancelled
        if (upload.status === UPLOAD_STATUS.CANCELLED) {
          return;
        }
      }
      
      // Complete chunked upload
      const completeResponse = await apiService.post('/upload/complete', {
        uploadId: upload.id
      });
      
      if (completeResponse.success) {
        this.completeUpload(upload, completeResponse.data);
      } else {
        throw new Error('Failed to complete chunked upload');
      }
      
    } catch (error) {
      throw new Error(`Chunked upload failed: ${error.message}`);
    }
  }

  /**
   * Upload individual chunk
   */
  async uploadChunk(upload, file, chunkIndex, chunkSize) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const chunkData = new FormData();
    chunkData.append('chunk', chunk);
    chunkData.append('uploadId', upload.id);
    chunkData.append('chunkIndex', chunkIndex.toString());
    chunkData.append('chunkSize', chunk.size.toString());
    
    let retryCount = 0;
    const maxRetries = upload.options.retryAttempts;
    
    while (retryCount <= maxRetries) {
      try {
        const response = await apiService.post('/upload/chunk', chunkData, {
          timeout: upload.options.timeout,
          onProgress: (progressData) => {
            const chunkProgress = (start + (progressData.loaded * progressData.total / 100)) / file.size * 100;
            this.updateUploadProgress(upload, {
              loaded: start + progressData.loaded,
              total: file.size,
              percentage: chunkProgress
            });
          }
        });
        
        if (response.success) {
          upload.chunks[chunkIndex] = {
            index: chunkIndex,
            size: chunk.size,
            uploaded: true,
            etag: response.data.etag
          };
          break;
        } else {
          throw new Error(response.error?.message || 'Chunk upload failed');
        }
        
      } catch (error) {
        retryCount++;
        if (retryCount > maxRetries) {
          throw new Error(`Chunk ${chunkIndex} upload failed after ${maxRetries} retries: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, upload.options.retryDelay * retryCount));
      }
    }
  }

  /**
   * Update upload progress
   */
  updateUploadProgress(upload, progressData) {
    const { loaded, total, percentage } = progressData;
    
    upload.progress = percentage;
    upload.uploadedBytes = loaded;
    
    // Calculate upload speed and time remaining
    if (upload.startTime) {
      const elapsed = (Date.now() - upload.startTime) / 1000; // seconds
      upload.speed = loaded / elapsed; // bytes per second
      
      if (upload.speed > 0) {
        const remaining = (total - loaded) / upload.speed;
        upload.timeRemaining = remaining;
      }
    }
    
    // Emit progress event
    this.emit('uploadProgress', {
      uploadId: upload.id,
      progress: percentage,
      loaded,
      total,
      speed: upload.speed,
      timeRemaining: upload.timeRemaining
    });
    
    // Update notification
    notificationService.fileUploadProgress(upload.originalName, percentage);
  }

  /**
   * Complete upload
   */
  completeUpload(upload, responseData) {
    upload.status = UPLOAD_STATUS.COMPLETED;
    upload.endTime = Date.now();
    upload.progress = 100;
    upload.result = responseData;
    
    // Update statistics
    this.stats.completedUploads++;
    this.stats.totalBytesUploaded += upload.size;
    this.stats.totalUploadTime += (upload.endTime - upload.startTime);
    
    // Move to completed uploads
    this.completedUploads.set(upload.id, upload);
    this.activeUploads.delete(upload.id);
    
    // Emit events
    this.emit('uploadCompleted', upload);
    notificationService.fileUploadProgress(upload.originalName, 100);
    
    // Resolve promise
    if (upload.resolve) {
      upload.resolve(upload);
    }
    
    // Continue processing queue
    if (!this.isProcessing && this.uploadQueue.length > 0) {
      this.startQueueProcessor();
    }
  }

  /**
   * Handle upload error
   */
  handleUploadError(upload, error) {
    upload.status = UPLOAD_STATUS.FAILED;
    upload.error = error;
    upload.endTime = Date.now();
    
    // Update statistics
    this.stats.failedUploads++;
    
    // Check if should retry
    if (upload.options.autoRetry && upload.retryCount < upload.options.retryAttempts) {
      upload.retryCount++;
      upload.status = UPLOAD_STATUS.PENDING;
      
      // Add back to queue after delay
      setTimeout(() => {
        this.uploadQueue.push(upload);
        if (!this.isProcessing) {
          this.startQueueProcessor();
        }
      }, upload.options.retryDelay * upload.retryCount);
      
      this.emit('uploadRetry', { upload, retryCount: upload.retryCount });
      return;
    }
    
    // Move to failed uploads
    this.failedUploads.set(upload.id, upload);
    this.activeUploads.delete(upload.id);
    
    // Emit events
    this.emit('uploadFailed', upload);
    notificationService.fileUploadError(upload.originalName, error.message);
    
    // Reject promise
    if (upload.reject) {
      upload.reject(error);
    }
  }

  /**
   * Cancel upload
   */
  cancelUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) return false;
    
    upload.status = UPLOAD_STATUS.CANCELLED;
    this.activeUploads.delete(uploadId);
    
    // Remove from queue if pending
    this.uploadQueue = this.uploadQueue.filter(u => u.id !== uploadId);
    
    this.emit('uploadCancelled', upload);
    
    if (upload.reject) {
      upload.reject(new Error('Upload cancelled'));
    }
    
    return true;
  }

  /**
   * Cancel all uploads
   */
  cancelAllUploads() {
    const activeIds = Array.from(this.activeUploads.keys());
    const cancelledCount = activeIds.reduce((count, id) => {
      return this.cancelUpload(id) ? count + 1 : count;
    }, 0);
    
    this.uploadQueue = [];
    
    this.emit('allUploadsCancelled', { cancelledCount });
    return cancelledCount;
  }

  /**
   * Pause upload
   */
  pauseUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload || upload.status !== UPLOAD_STATUS.UPLOADING) return false;
    
    upload.status = UPLOAD_STATUS.PAUSED;
    this.emit('uploadPaused', upload);
    return true;
  }

  /**
   * Resume upload
   */
  resumeUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (!upload || upload.status !== UPLOAD_STATUS.PAUSED) return false;
    
    upload.status = UPLOAD_STATUS.PENDING;
    this.uploadQueue.unshift(upload); // Add to front of queue
    
    if (!this.isProcessing) {
      this.startQueueProcessor();
    }
    
    this.emit('uploadResumed', upload);
    return true;
  }

  /**
   * Retry failed upload
   */
  retryUpload(uploadId) {
    const upload = this.failedUploads.get(uploadId);
    if (!upload) return false;
    
    // Reset upload state
    upload.status = UPLOAD_STATUS.PENDING;
    upload.error = null;
    upload.progress = 0;
    upload.uploadedBytes = 0;
    upload.retryCount = 0;
    upload.chunks = [];
    
    // Move back to active uploads
    this.failedUploads.delete(uploadId);
    this.activeUploads.set(uploadId, upload);
    this.uploadQueue.push(upload);
    
    if (!this.isProcessing) {
      this.startQueueProcessor();
    }
    
    this.emit('uploadRetried', upload);
    return true;
  }

  /**
   * Utility methods
   */
  
  generateUploadId() {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isImage(file) {
    return file.type.startsWith('image/');
  }

  isVideo(file) {
    return file.type.startsWith('video/');
  }

  isAudio(file) {
    return file.type.startsWith('audio/');
  }

  isFileTypeAllowed(file, typeConfig) {
    if (typeConfig.extensions.includes('*')) return true;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isExtensionAllowed = typeConfig.extensions.includes(fileExtension);
    const isMimeTypeAllowed = typeConfig.mimeTypes.includes(file.type) || typeConfig.mimeTypes.includes('*');
    
    return isExtensionAllowed || isMimeTypeAllowed;
  }

  async generateThumbnail(file) {
    return new Promise((resolve) => {
      if (!this.isImage(file)) {
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate thumbnail size
          const maxSize = 200;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // Draw thumbnail
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async compressImage(file, options = {}) {
    return new Promise((resolve) => {
      if (!this.isImage(file)) {
        resolve(file);
        return;
      }
      
      const {
        quality = 0.8,
        maxWidth = 1920,
        maxHeight = 1080
      } = options;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate compressed size
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw compressed image
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, file.type, quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async calculateFileHash(file) {
    if (!crypto.subtle) return null;
    
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Error calculating file hash:', error);
      return null;
    }
  }

  async extractFileMetadata(file) {
    const metadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension: file.name.split('.').pop()?.toLowerCase()
    };
    
    // Add image-specific metadata
    if (this.isImage(file)) {
      try {
        const imageMeta = await this.getImageMetadata(file);
        Object.assign(metadata, imageMeta);
      } catch (error) {
        console.warn('Error extracting image metadata:', error);
      }
    }
    
    return metadata;
  }

  async getImageMetadata(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
      };
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeUploads: this.activeUploads.size,
      queuedUploads: this.uploadQueue.length,
      averageUploadTime: this.stats.completedUploads > 0 
        ? this.stats.totalUploadTime / this.stats.completedUploads 
        : 0,
      averageSpeed: this.stats.totalUploadTime > 0 
        ? this.stats.totalBytesUploaded / (this.stats.totalUploadTime / 1000) 
        : 0
    };
  }

  /**
   * Get upload by ID
   */
  getUpload(uploadId) {
    return this.activeUploads.get(uploadId) || 
           this.completedUploads.get(uploadId) || 
           this.failedUploads.get(uploadId);
  }

  /**
   * Get all uploads
   */
  getAllUploads() {
    return {
      active: Array.from(this.activeUploads.values()),
      completed: Array.from(this.completedUploads.values()),
      failed: Array.from(this.failedUploads.values()),
      queued: [...this.uploadQueue]
    };
  }

  /**
   * Clear completed uploads
   */
  clearCompleted() {
    const count = this.completedUploads.size;
    this.completedUploads.clear();
    this.emit('completedUploadsCleared', { count });
    return count;
  }

  /**
   * Clear failed uploads
   */
  clearFailed() {
    const count = this.failedUploads.size;
    this.failedUploads.clear();
    this.emit('failedUploadsCleared', { count });
    return count;
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    // Cancel all active uploads
    this.cancelAllUploads();
    
    // Clear all data
    this.activeUploads.clear();
    this.completedUploads.clear();
    this.failedUploads.clear();
    this.uploadQueue = [];
    
    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.emit('serviceDestroyed');
  }
}

// Create singleton instance
const fileUploadService = new FileUploadService();

export default fileUploadService;
export { UPLOAD_STATUS, FILE_TYPES };