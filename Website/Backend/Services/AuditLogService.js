/**
 * Audit Log Service - Comprehensive audit logging for compliance and security
 * 
 * This service provides a centralized interface for logging all system activities
 * for compliance, security monitoring, and forensic analysis.
 * 
 * @module AuditLogService
 * @version 1.0.0
 */

import AuditLog from '../Models/FeedModels/AuditLog.js';
import crypto from 'crypto';

class AuditLogService {
  constructor() {
    this.logQueue = [];
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    this.isFlushing = false;
    
    // Start batch processing
    this.startBatchProcessing();
  }
  
  /**
   * Start batch processing of audit logs
   */
  startBatchProcessing() {
    setInterval(() => {
      if (this.logQueue.length > 0 && !this.isFlushing) {
        this.flushLogs();
      }
    }, this.flushInterval);
  }
  
  /**
   * Log an audit event
   * @param {Object} eventData - Audit event data
   * @returns {Object} Created audit log entry
   */
  async log(eventData) {
    try {
      // Generate log ID
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create audit log entry
      const logEntry = {
        logId,
        timestamp: new Date(),
        ...eventData
      };
      
      // Add to queue for batch processing
      this.logQueue.push(logEntry);
      
      // Flush immediately if queue is full
      if (this.logQueue.length >= this.batchSize) {
        await this.flushLogs();
      }
      
      return logEntry;
    } catch (error) {
      console.error('❌ Error creating audit log entry:', error);
      throw error;
    }
  }
  
  /**
   * Flush logs to database
   */
  async flushLogs() {
    if (this.logQueue.length === 0 || this.isFlushing) {
      return;
    }
    
    this.isFlushing = true;
    
    try {
      const logsToProcess = this.logQueue.splice(0, this.batchSize);
      
      // Add integrity hashes and signatures
      const processedLogs = await Promise.all(logsToProcess.map(async (log, index) => {
        // Get previous log hash for chaining
        const previousLog = await this.getLastLog();
        log.previousHash = previousLog ? previousLog.hash : null;
        
        // Calculate hash for this log
        log.hash = this.calculateLogHash(log);
        
        // Add digital signature (in a real implementation, this would use proper signing)
        log.signature = this.signLogEntry(log);
        
        return log;
      }));
      
      // Insert all logs in batch
      await AuditLog.insertMany(processedLogs);
      
      console.log(`✅ Flushed ${processedLogs.length} audit logs to database`);
    } catch (error) {
      console.error('❌ Error flushing audit logs:', error);
      
      // Re-add failed logs to queue
      this.logQueue.unshift(...logsToProcess);
    } finally {
      this.isFlushing = false;
    }
  }
  
  /**
   * Calculate log entry hash for integrity
   * @param {Object} logEntry - Log entry to hash
   * @returns {string} Hash of log entry
   */
  calculateLogHash(logEntry) {
    const hashData = {
      logId: logEntry.logId,
      eventType: logEntry.eventType,
      userId: logEntry.userId,
      timestamp: logEntry.timestamp,
      action: logEntry.action,
      resourceId: logEntry.resourceId,
      previousHash: logEntry.previousHash
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(hashData))
      .digest('hex');
  }
  
  /**
   * Sign log entry for authenticity
   * @param {Object} logEntry - Log entry to sign
   * @returns {string} Signature
   */
  signLogEntry(logEntry) {
    // In a real implementation, this would use proper cryptographic signing
    // For now, we'll create a simple signature
    const signatureData = `${logEntry.logId}:${logEntry.timestamp.getTime()}:${logEntry.userId}`;
    return crypto.createHash('sha1').update(signatureData).digest('hex');
  }
  
  /**
   * Get last log entry for hash chaining
   * @returns {Object} Last log entry
   */
  async getLastLog() {
    try {
      return await AuditLog.findOne().sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error getting last log entry:', error);
      return null;
    }
  }
  
  /**
   * Get audit logs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Array} Array of audit logs
   */
  async getAuditLogs(filters = {}, options = {}) {
    try {
      const query = {};
      
      // Apply filters
      if (filters.eventType) {
        query.eventType = filters.eventType;
      }
      
      if (filters.userId) {
        query.userId = filters.userId;
      }
      
      if (filters.resourceId) {
        query.resourceId = filters.resourceId;
      }
      
      if (filters.resourceType) {
        query.resourceType = filters.resourceType;
      }
      
      if (filters.severity) {
        query.severity = filters.severity;
      }
      
      if (filters.action) {
        query.action = filters.action;
      }
      
      if (filters.complianceTag) {
        query.complianceTags = filters.complianceTag;
      }
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.timestamp.$lte = new Date(filters.endDate);
        }
      }
      
      // Apply pagination and sorting
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const sort = options.sort || { timestamp: -1 };
      
      return await AuditLog.find(query)
        .sort(sort)
        .limit(limit)
        .skip(offset);
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }
  
  /**
   * Get audit logs by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Array of audit logs
   */
  async getAuditLogsByUser(userId, options = {}) {
    try {
      return await this.getAuditLogs({ userId }, options);
    } catch (error) {
      console.error(`Error getting audit logs for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get audit logs by resource
   * @param {string} resourceId - Resource ID
   * @param {Object} options - Query options
   * @returns {Array} Array of audit logs
   */
  async getAuditLogsByResource(resourceId, options = {}) {
    try {
      return await this.getAuditLogs({ resourceId }, options);
    } catch (error) {
      console.error(`Error getting audit logs for resource ${resourceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get audit logs by compliance tag
   * @param {string} complianceTag - Compliance tag
   * @param {Object} options - Query options
   * @returns {Array} Array of audit logs
   */
  async getAuditLogsByComplianceTag(complianceTag, options = {}) {
    try {
      return await this.getAuditLogs({ complianceTag }, options);
    } catch (error) {
      console.error(`Error getting audit logs for compliance tag ${complianceTag}:`, error);
      throw error;
    }
  }
  
  /**
   * Get audit log statistics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Statistics
   */
  async getStatistics(filters = {}) {
    try {
      const match = {};
      
      // Apply filters
      if (filters.startDate || filters.endDate) {
        match.timestamp = {};
        if (filters.startDate) {
          match.timestamp.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          match.timestamp.$lte = new Date(filters.endDate);
        }
      }
      
      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            byEventType: {
              $push: '$eventType'
            },
            bySeverity: {
              $push: '$severity'
            },
            byResourceType: {
              $push: '$resourceType'
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalLogs: 1,
            eventTypeDistribution: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ['$byEventType'] },
                  as: 'type',
                  in: {
                    k: '$$type',
                    v: {
                      $size: {
                        $filter: {
                          input: '$byEventType',
                          as: 'et',
                          cond: { $eq: ['$$et', '$$type'] }
                        }
                      }
                    }
                  }
                }
              }
            },
            severityDistribution: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ['$bySeverity'] },
                  as: 'severity',
                  in: {
                    k: '$$severity',
                    v: {
                      $size: {
                        $filter: {
                          input: '$bySeverity',
                          as: 's',
                          cond: { $eq: ['$$s', '$$severity'] }
                        }
                      }
                    }
                  }
                }
              }
            },
            resourceTypeDistribution: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ['$byResourceType'] },
                  as: 'type',
                  in: {
                    k: '$$type',
                    v: {
                      $size: {
                        $filter: {
                          input: '$byResourceType',
                          as: 'rt',
                          cond: { $eq: ['$$rt', '$$type'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ];
      
      const result = await AuditLog.aggregate(pipeline);
      return result[0] || {
        totalLogs: 0,
        eventTypeDistribution: {},
        severityDistribution: {},
        resourceTypeDistribution: {}
      };
    } catch (error) {
      console.error('Error getting audit log statistics:', error);
      throw error;
    }
  }
  
  /**
   * Export audit logs
   * @param {Object} filters - Filter criteria
   * @param {string} format - Export format (json, csv)
   * @returns {string} Exported data
   */
  async exportLogs(filters = {}, format = 'json') {
    try {
      const logs = await this.getAuditLogs(filters);
      
      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else if (format === 'csv') {
        // Convert to CSV format
        if (logs.length === 0) return '';
        
        const headers = Object.keys(logs[0].toObject());
        const csvRows = [headers.join(',')];
        
        for (const log of logs) {
          const values = headers.map(header => {
            const value = log[header];
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
          });
          csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }
  
  /**
   * Clean up old audit logs based on retention policy
   * @param {number} days - Days to retain logs (default from model)
   * @returns {Object} Cleanup result
   */
  async cleanupOldLogs(days = null) {
    try {
      const cutoffDate = new Date();
      if (days) {
        cutoffDate.setDate(cutoffDate.getDate() - days);
      } else {
        // Use default retention from model (90 days)
        cutoffDate.setDate(cutoffDate.getDate() - 90);
      }
      
      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old audit logs`);
      return {
        success: true,
        deletedCount: result.deletedCount,
        cutoffDate
      };
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }
  
  /**
   * Verify log integrity
   * @param {string} logId - Log ID to verify
   * @returns {Object} Verification result
   */
  async verifyLogIntegrity(logId) {
    try {
      const log = await AuditLog.findOne({ logId });
      if (!log) {
        return { valid: false, error: 'Log not found' };
      }
      
      // Verify hash
      const calculatedHash = this.calculateLogHash(log);
      const hashValid = log.hash === calculatedHash;
      
      // Verify signature
      const calculatedSignature = this.signLogEntry(log);
      const signatureValid = log.signature === calculatedSignature;
      
      // Verify chain integrity
      let chainValid = true;
      if (log.previousHash) {
        const previousLog = await AuditLog.findOne({ hash: log.previousHash });
        chainValid = !!previousLog;
      }
      
      return {
        valid: hashValid && signatureValid && chainValid,
        hashValid,
        signatureValid,
        chainValid,
        log
      };
    } catch (error) {
      console.error(`Error verifying log integrity for ${logId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AuditLogService();