/**
 * Audit Logging Middleware - Automatically logs important system events
 * 
 * This middleware automatically captures and logs security-relevant events
 * such as authentication attempts, data access, and system changes.
 * 
 * @module AuditLoggingMiddleware
 * @version 1.0.0
 */

import AuditLogService from '../../Services/Security/AuditLogService.js';

class AuditLoggingMiddleware {
  /**
   * Log authentication events
   */
  logAuthentication(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      const eventType = req.body.refreshToken ? 'TOKEN_REFRESH' : 'USER_LOGIN';
      const success = res.statusCode < 400;
      const severity = success ? 'LOW' : 'MEDIUM';
      
      AuditLogService.log({
        eventType,
        severity,
        userId: req.user?.userId || 'anonymous',
        username: req.user?.username || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        action: 'LOGIN',
        resourceType: 'USER',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode
        },
        sessionId: req.sessionID || null,
        requestId: req.id || null
      });
    });
    
    next();
  }
  
  /**
   * Log file upload events
   */
  logFileUpload(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      const success = res.statusCode < 400;
      const severity = success ? 'LOW' : 'MEDIUM';
      
      AuditLogService.log({
        eventType: 'FILE_UPLOADED',
        severity,
        userId: req.user?.userId || 'anonymous',
        username: req.user?.username || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        action: 'CREATE',
        resourceType: 'FILE',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          fileName: req.file?.originalname,
          fileSize: req.file?.size,
          fileType: req.file?.mimetype
        },
        resourceId: req.file?.filename || null,
        sessionId: req.sessionID || null,
        requestId: req.id || null
      });
    });
    
    next();
  }
  
  /**
   * Log message events
   */
  logMessageEvents(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      const success = res.statusCode < 400;
      let eventType = 'MESSAGE_SENT';
      let action = 'CREATE';
      let severity = 'LOW';
      
      // Determine event type based on endpoint
      if (req.originalUrl.includes('/edit')) {
        eventType = 'MESSAGE_EDITED';
        action = 'UPDATE';
      } else if (req.originalUrl.includes('/delete')) {
        eventType = 'MESSAGE_DELETED';
        action = 'DELETE';
        severity = 'MEDIUM';
      }
      
      AuditLogService.log({
        eventType,
        severity,
        userId: req.user?.userId || 'anonymous',
        username: req.user?.username || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        action,
        resourceType: 'MESSAGE',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode
        },
        resourceId: req.body.messageId || req.params.messageId || null,
        sessionId: req.sessionID || null,
        requestId: req.id || null
      });
    });
    
    next();
  }
  
  /**
   * Log chat events
   */
  logChatEvents(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      const success = res.statusCode < 400;
      let eventType = 'CHAT_CREATED';
      let action = 'CREATE';
      let severity = 'LOW';
      
      // Determine event type based on endpoint
      if (req.originalUrl.includes('/delete')) {
        eventType = 'CHAT_DELETED';
        action = 'DELETE';
        severity = 'MEDIUM';
      } else if (req.originalUrl.includes('/add-user')) {
        eventType = 'USER_ADDED_TO_CHAT';
        action = 'UPDATE';
      } else if (req.originalUrl.includes('/remove-user')) {
        eventType = 'USER_REMOVED_FROM_CHAT';
        action = 'UPDATE';
        severity = 'MEDIUM';
      }
      
      AuditLogService.log({
        eventType,
        severity,
        userId: req.user?.userId || 'anonymous',
        username: req.user?.username || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        action,
        resourceType: 'CHAT',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode
        },
        resourceId: req.body.chatId || req.params.chatId || null,
        sessionId: req.sessionID || null,
        requestId: req.id || null
      });
    });
    
    next();
  }
  
  /**
   * Log user management events
   */
  logUserManagement(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      const success = res.statusCode < 400;
      let eventType = 'USER_REGISTER';
      let action = 'CREATE';
      let severity = 'LOW';
      
      // Determine event type based on endpoint
      if (req.originalUrl.includes('/password')) {
        eventType = 'PASSWORD_CHANGE';
        action = 'UPDATE';
        severity = 'HIGH';
      } else if (req.originalUrl.includes('/role')) {
        eventType = 'ROLE_ASSIGNED';
        action = 'UPDATE';
        severity = 'HIGH';
      }
      
      AuditLogService.log({
        eventType,
        severity,
        userId: req.user?.userId || 'anonymous',
        username: req.user?.username || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        action,
        resourceType: 'USER',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode
        },
        resourceId: req.body.userId || req.params.userId || null,
        sessionId: req.sessionID || null,
        requestId: req.id || null
      });
    });
    
    next();
  }
  
  /**
   * Log system administration events
   */
  logAdminEvents(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      const success = res.statusCode < 400;
      const severity = success ? 'LOW' : 'HIGH';
      
      AuditLogService.log({
        eventType: 'SYSTEM_ADMIN',
        severity,
        userId: req.user?.userId || 'anonymous',
        username: req.user?.username || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        action: 'OTHER',
        resourceType: 'SYSTEM',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          description: 'Administrative action performed'
        },
        sessionId: req.sessionID || null,
        requestId: req.id || null,
        complianceTags: ['SOX', 'ISO_27001']
      });
    });
    
    next();
  }
  
  /**
   * Log data access events for compliance
   */
  logDataAccess(req, res, next) {
    // Only log sensitive data access
    const sensitiveEndpoints = [
      '/api/users',
      '/api/admin',
      '/api/settings'
    ];
    
    const isSensitive = sensitiveEndpoints.some(endpoint => 
      req.originalUrl.startsWith(endpoint)
    );
    
    if (isSensitive) {
      // Capture response finish to log the result
      res.on('finish', () => {
        const success = res.statusCode < 400;
        const severity = success ? 'LOW' : 'MEDIUM';
        
        AuditLogService.log({
          eventType: 'DATA_ACCESS',
          severity,
          userId: req.user?.userId || 'anonymous',
          username: req.user?.username || 'anonymous',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || '',
          action: 'READ',
          resourceType: 'SYSTEM',
          status: success ? 'SUCCESS' : 'FAILURE',
          details: {
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode
          },
          sessionId: req.sessionID || null,
          requestId: req.id || null,
          complianceTags: ['GDPR', 'HIPAA', 'ISO_27001']
        });
      });
    }
    
    next();
  }
  
  /**
   * Log API access for rate limiting and monitoring
   */
  logAPIAccess(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      const success = res.statusCode < 400;
      const severity = success ? 'LOW' : 'MEDIUM';
      
      // Don't log health check endpoints
      if (req.originalUrl.includes('/health') || req.originalUrl.includes('/ready')) {
        return;
      }
      
      AuditLogService.log({
        eventType: 'API_ACCESS',
        severity,
        userId: req.user?.userId || 'anonymous',
        username: req.user?.username || 'anonymous',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || '',
        action: 'READ',
        resourceType: 'SYSTEM',
        status: success ? 'SUCCESS' : 'FAILURE',
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode
        },
        sessionId: req.sessionID || null,
        requestId: req.id || null
      });
    });
    
    next();
  }
  
  /**
   * Log security events
   */
  logSecurityEvents(req, res, next) {
    // Capture response finish to log the result
    res.on('finish', () => {
      // Check for security-related status codes
      if (res.statusCode === 401 || res.statusCode === 403) {
        AuditLogService.log({
          eventType: 'SECURITY_ALERT',
          severity: 'HIGH',
          userId: req.user?.userId || 'anonymous',
          username: req.user?.username || 'anonymous',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || '',
          action: 'OTHER',
          resourceType: 'SYSTEM',
          status: 'FAILURE',
          details: {
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            description: 'Unauthorized access attempt'
          },
          sessionId: req.sessionID || null,
          requestId: req.id || null,
          complianceTags: ['ISO_27001']
        });
      } else if (res.statusCode >= 500) {
        AuditLogService.log({
          eventType: 'SYSTEM_ERROR',
          severity: 'HIGH',
          userId: req.user?.userId || 'anonymous',
          username: req.user?.username || 'anonymous',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || '',
          action: 'OTHER',
          resourceType: 'SYSTEM',
          status: 'FAILURE',
          details: {
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            description: 'Server error occurred'
          },
          sessionId: req.sessionID || null,
          requestId: req.id || null,
          complianceTags: ['ISO_27001']
        });
      }
    });
    
    next();
  }
}

// Export singleton instance
export default new AuditLoggingMiddleware();