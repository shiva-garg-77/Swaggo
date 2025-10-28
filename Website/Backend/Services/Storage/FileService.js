/**
 * 📁 File Service - Centralized File Management with Reference Storage
 * 
 * This service handles file operations with proper separation of concerns:
 * - Stores file metadata in dedicated File collection
 * - Stores only file references in messages
 * - Handles file cleanup and deduplication
 * - Manages file access permissions
 * 
 * @module FileService
 * @version 1.0.0
 */

import File from '../../Models/FeedModels/File.js';
import Message from '../../Models/FeedModels/Message.js'; // Import Message model for file reference checking
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// 🔧 PERFORMANCE FIX #32: Import Winston logger
import appLogger from '../../utils/logger.js';
// 🛠️ Standardized error handling
import { AppError, NotFoundError, ValidationError } from '../../utils/UnifiedErrorHandling.js';
import BaseService from '../System/BaseService.js';

class FileService extends BaseService {
  constructor() {
    super();
    this.config = {
      // File cleanup settings
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxFileAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      // Deduplication settings
      enableDeduplication: true,
      // Storage settings
      storagePath: path.join(process.cwd(), 'uploads'),
      thumbnailPath: path.join(process.cwd(), 'uploads', 'thumbnails')
    };
    
    // Initialize interval variable
    this.softDeleteInterval = null;
    
    // Initialize service
    this.initializeService();
  }
  
  /**
   * Initialize the file service
   */
  initializeService() {
    // Ensure upload directories exist
    this.ensureDirectories();
    
    // Start periodic cleanup
    this.startCleanup();
  }
  
  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const directories = [this.config.storagePath, this.config.thumbnailPath];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.info('Created directory', {
          directory: dir
        });
      }
    });
  }
  
  /**
   * Start periodic cleanup process
   */
  startCleanup() {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('FileService: Starting cleanup intervals');
    
    // Run expired files cleanup
    setInterval(() => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('FileService: Running expired files cleanup');
      this.cleanupExpiredFiles();
    }, this.config.cleanupInterval);
    
    // Run unused files cleanup less frequently (once per day)
    setInterval(() => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('FileService: Running unused files cleanup');
      this.cleanupUnusedFiles();
    }, this.config.cleanupInterval * 24); // 24 times less frequent
    
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('FileService: Cleanup intervals set up', {
      expiredFilesInterval: this.config.cleanupInterval + 'ms',
      unusedFilesInterval: (this.config.cleanupInterval * 24) + 'ms'
    });
    
    // Don't run message soft delete during initialization
    // This will be called after database connection is established
  }
  
  /**
   * Initialize periodic tasks after database connection is established
   */
  initializePeriodicTasks() {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('FileService: Initializing periodic tasks');
    
    // Only set up the interval once
    if (this.softDeleteInterval) {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('FileService: Soft delete interval already set up');
      return;
    }
    
    // Run message soft delete weekly (7 days)
    this.softDeleteInterval = setInterval(() => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('FileService: Running soft delete old messages');
      this.softDeleteOldMessages(365); // Soft delete messages older than 1 year
    }, this.config.cleanupInterval * 7); // Weekly
    
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('FileService: Soft delete interval set up', {
      interval: (this.config.cleanupInterval * 7) + 'ms'
    });
  }
  
  /**
   * Store uploaded file and return file reference
   * @param {Object} fileData - File data from multer
   * @param {Object} metadata - Additional metadata
   * @param {string} uploadedBy - User ID who uploaded the file
   * @returns {Object} File reference object
   */
  async storeFile(fileData, metadata = {}, uploadedBy) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ fileData, uploadedBy }, ['fileData', 'uploadedBy']);
      
      // Calculate file hash for deduplication
      let fileHash = null;
      if (this.config.enableDeduplication) {
        fileHash = await this.calculateFileHash(fileData.path);
      }
      
      // Check if file already exists (deduplication)
      if (fileHash) {
        const existingFile = await File.findOne({ 'metadata.hash': fileHash });
        if (existingFile) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          this.logger.info('File deduplication: Using existing file', {
            fileid: existingFile.fileid
          });
          return this.createFileReference(existingFile);
        }
      }
      
      // Determine file type
      const fileType = this.determineFileType(fileData.mimetype);
      
      // Create file document
      const fileDoc = new File({
        fileid: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: fileData.filename,
        originalname: fileData.originalname,
        mimetype: fileData.mimetype,
        size: fileData.size,
        path: fileData.path,
        uploadedBy,
        fileType,
        cloudProvider: 'local',
        metadata: {
          ...metadata,
          hash: fileHash
        }
      });
      
      // Save file document
      await fileDoc.save();
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      this.logger.info('Stored file', {
        fileid: fileDoc.fileid
      });
      
      // Return file reference
      return this.createFileReference(fileDoc);
    }, 'storeFile', { uploadedBy });
  }
  
  /**
   * Create file reference object for use in messages
   * @param {Object} fileDoc - File document from database
   * @returns {Object} File reference object
   */
  createFileReference(fileDoc) {
    return {
      fileid: fileDoc.fileid,
      url: `/uploads/${fileDoc.filename}`,
      filename: fileDoc.originalname,
      size: fileDoc.size,
      mimetype: fileDoc.mimetype,
      fileType: fileDoc.fileType
    };
  }
  
  /**
   * Get file by ID
   * @param {string} fileid - File ID
   * @returns {Object} File document
   */
  async getFile(fileid) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ fileid }, ['fileid']);
      
      const file = await File.findOne({ fileid });
      if (!file) {
        throw new NotFoundError(`File not found: ${fileid}`);
      }
      
      // Increment access count
      await file.incrementAccess();
      
      return this.formatEntity(file);
    }, 'getFile', { fileid });
  }
  
  /**
   * Get file reference for message
   * @param {string} fileid - File ID
   * @returns {Object} File reference object
   */
  async getFileReference(fileid) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ fileid }, ['fileid']);
      
      const file = await this.getFile(fileid);
      return this.createFileReference(file);
    }, 'getFileReference', { fileid });
  }
  
  /**
   * Delete file by ID
   * @param {string} fileid - File ID
   * @param {boolean} deletePhysical - Whether to delete physical file
   */
  async deleteFile(fileid, deletePhysical = true) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ fileid }, ['fileid']);
      
      const file = await File.findOne({ fileid });
      if (!file) {
        throw new NotFoundError(`File not found: ${fileid}`);
      }
      
      // Delete physical file if requested
      if (deletePhysical) {
        // Delete main file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          this.logger.info('Deleted physical file', {
            path: file.path
          });
        }
        
        // Delete thumbnail if exists
        const thumbnailPath = path.join(this.config.thumbnailPath, file.filename);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          this.logger.info('Deleted thumbnail', {
            path: thumbnailPath
          });
        }
      }
      
      // Delete from database
      await File.deleteOne({ fileid });
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      this.logger.info('Deleted file record', {
        fileid
      });
      
      return true;
    }, 'deleteFile', { fileid });
  }
  
  /**
   * Get file statistics
   * @returns {Object} File statistics
   */
  async getStats() {
    return this.handleOperation(async () => {
      const totalFiles = await File.countDocuments();
      const totalSize = await File.aggregate([
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$size' }
          }
        }
      ]);
      
      const stats = {
        totalFiles,
        totalSize: totalSize[0]?.totalSize || 0,
        averageFileSize: totalFiles > 0 ? (totalSize[0]?.totalSize || 0) / totalFiles : 0
      };
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      this.logger.info('File statistics retrieved', {
        stats
      });
      
      return stats;
    }, 'getStats');
  }

  /**
   * Cleanup expired files
   * @returns {Object} Cleanup results
   */
  async cleanupExpiredFiles() {
    return this.handleOperation(async () => {
      const cutoffDate = new Date(Date.now() - this.config.maxFileAge);
      
      // Find expired files that are not referenced by any messages
      const expiredFiles = await File.find({
        createdAt: { $lt: cutoffDate },
        referenceCount: 0
      });
      
      let deletedCount = 0;
      let deletedSize = 0;
      
      for (const file of expiredFiles) {
        try {
          // Delete file from filesystem
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            deletedSize += file.size;
          }
          
          // Delete file document
          await file.remove();
          deletedCount++;
        } catch (deleteError) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
          this.logger.error('Error deleting expired file', {
            fileid: file.fileid,
            error: deleteError.message,
            stack: deleteError.stack
          });
        }
      }
      
      const result = {
        deletedCount,
        deletedSize,
        totalChecked: expiredFiles.length
      };
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      this.logger.info('Expired files cleanup completed', {
        result
      });
      
      return result;
    }, 'cleanupExpiredFiles');
  }

  /**
   * Cleanup unused files (files with 0 reference count)
   * @returns {Object} Cleanup results
   */
  async cleanupUnusedFiles() {
    return this.handleOperation(async () => {
      // Find files with 0 reference count
      const unusedFiles = await File.find({
        referenceCount: 0
      });
      
      let deletedCount = 0;
      let deletedSize = 0;
      
      for (const file of unusedFiles) {
        try {
          // Delete file from filesystem
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            deletedSize += file.size;
          }
          
          // Delete file document
          await file.remove();
          deletedCount++;
        } catch (deleteError) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
          this.logger.error('Error deleting unused file', {
            fileid: file.fileid,
            error: deleteError.message,
            stack: deleteError.stack
          });
        }
      }
      
      const result = {
        deletedFilesCount: deletedCount,
        deletedSize,
        totalChecked: unusedFiles.length
      };
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      this.logger.info('Unused files cleanup completed', {
        result
      });
      
      return result;
    }, 'cleanupUnusedFiles');
  }

  /**
   * Soft delete old messages and their associated files
   * @param {number} days - Age of messages to delete (in days)
   * @returns {Object} Deletion results
   */
  async softDeleteOldMessages(days = 365) {
    return this.handleOperation(async () => {
      const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      
      // Find old messages
      const oldMessages = await Message.find({
        createdAt: { $lt: cutoffDate },
        deleted: { $ne: true }
      });
      
      let deletedCount = 0;
      
      for (const message of oldMessages) {
        try {
          // Soft delete the message
          message.deleted = true;
          message.deletedAt = new Date();
          await message.save();
          deletedCount++;
        } catch (deleteError) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
          this.logger.error('Error soft deleting message', {
            messageid: message.messageid,
            error: deleteError.message,
            stack: deleteError.stack
          });
        }
      }
      
      const result = {
        deletedCount,
        totalChecked: oldMessages.length,
        cutoffDate
      };
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      this.logger.info('Soft delete old messages completed', {
        result
      });
      
      return result;
    }, 'softDeleteOldMessages');
  }

  /**
   * Calculate file hash for deduplication
   * @param {string} filePath - Path to the file
   * @returns {string} File hash
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * Determine file type based on mimetype
   * @param {string} mimetype - File mimetype
   * @returns {string} File type
   */
  determineFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'document';
    return 'other';
  }
}

// Export singleton instance
const fileService = new FileService();

export default fileService;
