/**
 * Backup Routes
 * 
 * API routes for backup management
 */

import express from 'express';
import backupController from '../../../Controllers/BackupController.js';

const router = express.Router();

// Mount backup controller routes
router.use('/', backupController);

export default router;