/**
 * Audit Log Routes - API endpoints for audit log management
 * 
 * These routes provide endpoints for querying, exporting, and managing audit logs.
 * 
 * @module AuditLogRoutes
 * @version 1.0.0
 */

import express from 'express';
import AuditLogService from '../Services/AuditLogService.js';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const { userId, resourceId, resourceType, eventType, severity, action, complianceTag, startDate, endDate, limit, offset, sort } = req.query;
    
    // Check if user is admin (in a real implementation, you would check roles/permissions)
    // For now, we'll allow all authenticated users to query their own logs
    const filters = {};
    
    // Allow users to query their own logs or admins to query all logs
    if (req.user.role === 'admin') {
      // Admin can query all logs
      if (userId) filters.userId = userId;
    } else {
      // Regular users can only query their own logs
      filters.userId = req.user.userId;
    }
    
    if (resourceId) filters.resourceId = resourceId;
    if (resourceType) filters.resourceType = resourceType;
    if (eventType) filters.eventType = eventType;
    if (severity) filters.severity = severity;
    if (action) filters.action = action;
    if (complianceTag) filters.complianceTag = complianceTag;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sort: sort ? JSON.parse(sort) : undefined
    };
    
    const logs = await AuditLogService.getAuditLogs(filters, options);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Private (Admin only or user's own logs)
 */
router.get('/user/:userId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset, sort } = req.query;
    
    // Check permissions
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sort: sort ? JSON.parse(sort) : undefined
    };
    
    const logs = await AuditLogService.getAuditLogsByUser(userId, options);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting user audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/resource/:resourceId
 * @desc    Get audit logs for a specific resource
 * @access  Private (Resource owner or admin)
 */
router.get('/resource/:resourceId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { limit, offset, sort } = req.query;
    
    // In a real implementation, you would check if the user has access to this resource
    // For now, we'll allow access to all authenticated users
    
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sort: sort ? JSON.parse(sort) : undefined
    };
    
    const logs = await AuditLogService.getAuditLogsByResource(resourceId, options);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting resource audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/compliance/:complianceTag
 * @desc    Get audit logs for a specific compliance tag
 * @access  Private (Compliance officer or admin)
 */
router.get('/compliance/:complianceTag', authMiddleware.authenticate, async (req, res) => {
  try {
    const { complianceTag } = req.params;
    const { limit, offset, sort } = req.query;
    
    // Check if user has compliance access (in a real implementation)
    // For now, we'll allow access to all authenticated users
    
    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sort: sort ? JSON.parse(sort) : undefined
    };
    
    const logs = await AuditLogService.getAuditLogsByComplianceTag(complianceTag, options);
    
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error getting compliance audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/statistics
 * @desc    Get audit log statistics
 * @access  Private (Admin only)
 */
router.get('/statistics', authMiddleware.authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const statistics = await AuditLogService.getStatistics(filters);
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error getting audit log statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/export
 * @desc    Export audit logs
 * @access  Private (Admin only)
 */
router.get('/export', authMiddleware.authenticate, async (req, res) => {
  try {
    const { format, userId, resourceId, resourceType, eventType, severity, action, complianceTag, startDate, endDate } = req.query;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const filters = {};
    if (userId) filters.userId = userId;
    if (resourceId) filters.resourceId = resourceId;
    if (resourceType) filters.resourceType = resourceType;
    if (eventType) filters.eventType = eventType;
    if (severity) filters.severity = severity;
    if (action) filters.action = action;
    if (complianceTag) filters.complianceTag = complianceTag;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const exportedData = await AuditLogService.exportLogs(filters, format || 'json');
    
    // Set appropriate headers for download
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format || 'json'}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    
    res.send(exportedData);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/audit-logs/verify/:logId
 * @desc    Verify log integrity
 * @access  Private (Admin only)
 */
router.post('/verify/:logId', authMiddleware.authenticate, async (req, res) => {
  try {
    const { logId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const verification = await AuditLogService.verifyLogIntegrity(logId);
    
    res.json({
      success: true,
      verification
    });
  } catch (error) {
    console.error('Error verifying log integrity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;