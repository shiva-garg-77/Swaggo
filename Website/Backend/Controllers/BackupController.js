/**
 * 📦 BACKUP CONTROLLER
 * 
 * REST API controller for backup management
 */

import express from 'express';
import backupService from '../Services/Backup/BackupService.js';
import auth from '../Middleware/Authentication/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/backups
 * @desc    List all backups
 * @access  Admin
 */
router.get('/', auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    res.status(200).json({
      success: true,
      backups: backups.map(backup => ({
        id: backup.metadata.id,
        type: backup.metadata.type,
        timestamp: backup.metadata.timestamp,
        size: backup.metadata.size,
        duration: backup.metadata.duration
      })),
      count: backups.length
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/backups/full
 * @desc    Create a full backup
 * @access  Admin
 */
router.post('/full', auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    const result = await backupService.createFullBackup(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Full backup created successfully',
      backupId: result.backupId,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error creating full backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create full backup',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/backups/incremental
 * @desc    Create an incremental backup
 * @access  Admin
 */
router.post('/incremental', auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    const result = await backupService.createIncrementalBackup(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Incremental backup created successfully',
      backupId: result.backupId,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error creating incremental backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create incremental backup',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/backups/:backupId/restore
 * @desc    Restore a backup
 * @access  Admin
 */
router.post('/:backupId/restore', auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    const { backupId } = req.params;
    
    const result = await backupService.restoreBackup(backupId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Backup restored successfully',
      backupId: result.backupId
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/backups/:backupId
 * @desc    Delete a backup
 * @access  Admin
 */
router.delete('/:backupId', auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    const { backupId } = req.params;
    const backupPath = `full-${backupId}`;
    
    // Check if backup exists
    const backups = await backupService.listBackups();
    const backup = backups.find(b => b.metadata.id === backupId);
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
    
    // Delete backup
    await backupService.deleteBackup(backupPath);
    
    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/backups/status
 * @desc    Get backup service status
 * @access  Admin
 */
router.get('/status', auth.authenticate, auth.requireRole(['admin']), async (req, res) => {
  try {
    const status = backupService.getStatus();
    
    res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup status',
      error: error.message
    });
  }
});

export default router;