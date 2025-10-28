import express from 'express';
import AnomalyDetectionService from '../../../Services/Security/AnomalyDetectionService.js';
import AuthenticationMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * Anomaly Detection Routes
 * 
 * These routes provide API endpoints for anomaly detection functionality,
 * including real-time behavior analysis, anomaly reporting, and statistics.
 */

// Apply authentication middleware to all routes
router.use(AuthenticationMiddleware.authenticate);

/**
 * POST /api/anomaly-detection/analyze
 * Analyze user behavior for anomalies
 * 
 * @param {Object} req.body.userData - User data to analyze
 * @param {string} req.body.userId - User ID (optional, defaults to current user)
 */
router.post('/analyze', [
  body('userData').isObject().withMessage('User data must be an object'),
  body('userId').optional().isString().withMessage('User ID must be a string')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { userData, userId } = req.body;
    const targetUserId = userId || req.user.id;
    
    // Check if user has permission to analyze this user's behavior
    if (userId && userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to analyze other users'
      });
    }
    
    // Analyze user behavior
    const analysisResult = await AnomalyDetectionService.analyzeUserBehavior(userData, targetUserId);
    
    res.status(200).json({
      success: true,
      message: 'User behavior analysis completed',
      result: analysisResult
    });
    
  } catch (error) {
    console.error('Anomaly detection analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze user behavior',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/anomaly-detection/statistics
 * Get anomaly detection statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access statistics'
      });
    }
    
    const statistics = await AnomalyDetectionService.getStatistics();
    
    res.status(200).json({
      success: true,
      statistics
    });
    
  } catch (error) {
    console.error('Anomaly detection statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/anomaly-detection/update-baseline
 * Update behavioral baseline for a user
 * 
 * @param {string} req.body.userId - User ID (optional, defaults to current user)
 */
router.post('/update-baseline', [
  body('userId').optional().isString().withMessage('User ID must be a string')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { userId } = req.body;
    const targetUserId = userId || req.user.id;
    
    // Check if user has permission to update this user's baseline
    if (userId && userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update other users baselines'
      });
    }
    
    // Update behavioral baseline
    const updatedBaseline = await AnomalyDetectionService.updateUserBaseline(targetUserId);
    
    res.status(200).json({
      success: true,
      message: 'Behavioral baseline updated successfully',
      baseline: updatedBaseline
    });
    
  } catch (error) {
    console.error('Anomaly detection baseline update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update behavioral baseline',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/anomaly-detection/detectors
 * Get list of available anomaly detectors
 */
router.get('/detectors', async (req, res) => {
  try {
    const detectors = [];
    for (const [name, detector] of AnomalyDetectionService.anomalyDetectors.entries()) {
      detectors.push({
        name,
        displayName: detector.name,
        description: detector.description
      });
    }
    
    res.status(200).json({
      success: true,
      detectors
    });
    
  } catch (error) {
    console.error('Anomaly detection detectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve detectors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/anomaly-detection/check
 * Check specific anomaly detector
 * 
 * @param {string} req.body.detector - Detector name to check
 * @param {Object} req.body.userData - User data to analyze
 * @param {string} req.body.userId - User ID (optional, defaults to current user)
 */
router.post('/check', [
  body('detector').isString().withMessage('Detector name is required'),
  body('userData').isObject().withMessage('User data must be an object'),
  body('userId').optional().isString().withMessage('User ID must be a string')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { detector, userData, userId } = req.body;
    const targetUserId = userId || req.user.id;
    
    // Check if user has permission to check this user's behavior
    if (userId && userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to check other users'
      });
    }
    
    // Check if detector exists
    if (!AnomalyDetectionService.anomalyDetectors.has(detector)) {
      return res.status(400).json({
        success: false,
        message: `Detector '${detector}' not found`
      });
    }
    
    // Run specific detector
    const detectorInstance = AnomalyDetectionService.anomalyDetectors.get(detector);
    const result = await detectorInstance.check(userData, targetUserId);
    
    res.status(200).json({
      success: true,
      message: `Anomaly check completed for detector '${detector}'`,
      result
    });
    
  } catch (error) {
    console.error('Anomaly detection check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run anomaly check',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/anomaly-detection/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Anomaly detection service is running',
    timestamp: new Date().toISOString(),
    service: 'anomaly-detection'
  });
});

export default router;