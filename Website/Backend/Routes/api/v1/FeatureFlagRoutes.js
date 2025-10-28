import express from 'express';
import authMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';
import { featureFlagMiddleware } from '../../../Middleware/Features/FeatureFlagMiddleware.js';
import * as FeatureFlagController from '../../../Controllers/Features/FeatureFlagController.js';

const authenticate = authMiddleware.authenticate;
const requireRole = authMiddleware.requireRole;

const router = express.Router();

// Apply authentication and feature flag middleware to all routes
router.use(authenticate);
router.use(featureFlagMiddleware);

// Public routes (accessible to authenticated users)
router.get('/check/:flagName', FeatureFlagController.checkFeatureEnabled);

// Admin routes (restricted to admin users)
router.use(requireRole(['admin']));

router.get('/', FeatureFlagController.getAllFlags);
router.get('/:flagName', FeatureFlagController.getFlag);
router.post('/:flagName', FeatureFlagController.setFlag);
router.put('/:flagName', FeatureFlagController.updateFlag);
router.delete('/:flagName', FeatureFlagController.deleteFlag);
router.post('/:flagName/user-override', FeatureFlagController.setUserOverride);
router.post('/:flagName/segment-override', FeatureFlagController.setSegmentOverride);

export default router;