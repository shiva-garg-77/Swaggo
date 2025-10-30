/**
 * @fileoverview API v1 Routes Index
 * @module Routes/v1
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * This file serves as the entry point for all API v1 routes.
 * It imports and mounts all individual route modules.
 */

import express from 'express';
import HealthRoutes from './HealthRoutes.js';
import AuthenticationRoutes from './AuthenticationRoutes.js';
import AdminRoutes from './AdminRoutes.js';
import UserRoutes from './UserRoutes.js';
import RBACRoutes from './RBACRoutes.js';
import SubscriptionRoutes from './SubscriptionRoutes.js';
import CloudStorageRoutes from './CloudStorageRoutes.js';
import AnomalyDetectionRoutes from './AnomalyDetectionRoutes.js';
import AuditLogRoutes from './AuditLogRoutes.js';
import KeywordAlertRoutes from './KeywordAlertRoutes.js';
import MessageTemplateRoutes from './MessageTemplateRoutes.js';
import PollRoutes from './PollRoutes.js';
import TranslationRoutes from './TranslationRoutes.js';
import FeatureFlagRoutes from './FeatureFlagRoutes.js';
import monitoring from './monitoring.js';
import { router as pushNotifications } from './pushNotifications.js';
import backup from './backup.js';

const router = express.Router();

// Mount all version 1 routes
router.use('/health', HealthRoutes);
router.use('/auth', AuthenticationRoutes);
router.use('/admin', AdminRoutes);
router.use('/user', UserRoutes);
router.use('/rbac', RBACRoutes);
router.use('/subscription', SubscriptionRoutes);
router.use('/storage', CloudStorageRoutes);
router.use('/anomaly', AnomalyDetectionRoutes);
router.use('/audit', AuditLogRoutes);
router.use('/keyword', KeywordAlertRoutes);
router.use('/template', MessageTemplateRoutes);
router.use('/poll', PollRoutes);
router.use('/translate', TranslationRoutes);
router.use('/feature', FeatureFlagRoutes);
router.use('/monitoring', monitoring);
router.use('/notifications', pushNotifications);
router.use('/backup', backup);

export default router;