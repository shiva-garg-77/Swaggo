import featureFlagService from '../Services/FeatureFlagService.js';
import authMiddleware from '../Middleware/AuthenticationMiddleware.js';
import { logger } from '../utils/SanitizedLogger.js';

const requireRole = authMiddleware.requireRole;

/**
 * @fileoverview Controller for managing feature flags via API
 * @module FeatureFlagController
 */

/**
 * Get all feature flags
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllFlags = async (req, res) => {
  try {
    const flags = featureFlagService.getAllFlags();
    const flagsArray = Array.from(flags.entries()).map(([name, config]) => ({
      name,
      ...config
    }));
    
    res.json({
      success: true,
      data: flagsArray
    });
  } catch (error) {
    logger.error('Error fetching feature flags', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags'
    });
  }
};

/**
 * Get a specific feature flag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFlag = async (req, res) => {
  try {
    const { flagName } = req.params;
    const flag = featureFlagService.getFlag(flagName);
    
    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        name: flagName,
        ...flag
      }
    });
  } catch (error) {
    logger.error('Error fetching feature flag', {
      flagName: req.params.flagName,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flag'
    });
  }
};

/**
 * Create or update a feature flag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const setFlag = async (req, res) => {
  try {
    const { flagName } = req.params;
    const { enabled, description, rolloutPercentage, segments } = req.body;
    
    // Validate input
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled must be a boolean value'
      });
    }
    
    if (rolloutPercentage !== undefined && (typeof rolloutPercentage !== 'number' || rolloutPercentage < 0 || rolloutPercentage > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Rollout percentage must be a number between 0 and 100'
      });
    }
    
    if (segments !== undefined && !Array.isArray(segments)) {
      return res.status(400).json({
        success: false,
        error: 'Segments must be an array'
      });
    }
    
    // Create or update the flag
    featureFlagService.setFlag(flagName, {
      enabled,
      description: description || '',
      rolloutPercentage: rolloutPercentage !== undefined ? rolloutPercentage : 0,
      segments: segments || []
    });
    
    const updatedFlag = featureFlagService.getFlag(flagName);
    
    res.json({
      success: true,
      message: 'Feature flag updated successfully',
      data: {
        name: flagName,
        ...updatedFlag
      }
    });
  } catch (error) {
    logger.error('Error updating feature flag', {
      flagName: req.params.flagName,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flag'
    });
  }
};

/**
 * Update a feature flag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateFlag = async (req, res) => {
  try {
    const { flagName } = req.params;
    const updates = req.body;
    
    // Check if flag exists
    const existingFlag = featureFlagService.getFlag(flagName);
    if (!existingFlag) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    // Validate updates
    if (updates.rolloutPercentage !== undefined && (typeof updates.rolloutPercentage !== 'number' || updates.rolloutPercentage < 0 || updates.rolloutPercentage > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Rollout percentage must be a number between 0 and 100'
      });
    }
    
    if (updates.segments !== undefined && !Array.isArray(updates.segments)) {
      return res.status(400).json({
        success: false,
        error: 'Segments must be an array'
      });
    }
    
    // Update the flag
    featureFlagService.updateFlag(flagName, updates);
    
    const updatedFlag = featureFlagService.getFlag(flagName);
    
    res.json({
      success: true,
      message: 'Feature flag updated successfully',
      data: {
        name: flagName,
        ...updatedFlag
      }
    });
  } catch (error) {
    logger.error('Error updating feature flag', {
      flagName: req.params.flagName,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update feature flag'
    });
  }
};

/**
 * Delete a feature flag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteFlag = async (req, res) => {
  try {
    const { flagName } = req.params;
    
    const result = featureFlagService.removeFlag(flagName);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Feature flag deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting feature flag', {
      flagName: req.params.flagName,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete feature flag'
    });
  }
};

/**
 * Set user override for a feature flag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const setUserOverride = async (req, res) => {
  try {
    const { flagName } = req.params;
    const { userId, enabled } = req.body;
    
    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled must be a boolean value'
      });
    }
    
    // Check if flag exists
    const existingFlag = featureFlagService.getFlag(flagName);
    if (!existingFlag) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    // Set user override
    featureFlagService.setUserOverride(flagName, userId, enabled);
    
    res.json({
      success: true,
      message: 'User override set successfully'
    });
  } catch (error) {
    logger.error('Error setting user override', {
      flagName: req.params.flagName,
      userId: req.body.userId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to set user override'
    });
  }
};

/**
 * Set segment override for a feature flag
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const setSegmentOverride = async (req, res) => {
  try {
    const { flagName } = req.params;
    const { segment, enabled } = req.body;
    
    // Validate input
    if (!segment) {
      return res.status(400).json({
        success: false,
        error: 'Segment is required'
      });
    }
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled must be a boolean value'
      });
    }
    
    // Check if flag exists
    const existingFlag = featureFlagService.getFlag(flagName);
    if (!existingFlag) {
      return res.status(404).json({
        success: false,
        error: 'Feature flag not found'
      });
    }
    
    // Set segment override
    featureFlagService.setSegmentOverride(flagName, segment, enabled);
    
    res.json({
      success: true,
      message: 'Segment override set successfully'
    });
  } catch (error) {
    logger.error('Error setting segment override', {
      flagName: req.params.flagName,
      segment: req.body.segment,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to set segment override'
    });
  }
};

/**
 * Check if a feature is enabled for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkFeatureEnabled = async (req, res) => {
  try {
    const { flagName } = req.params;
    const user = req.user;
    const userId = user ? (user.profileid || user.id) : null;
    
    // Get user segments
    const userSegments = user ? getUserSegments(user) : [];
    
    // Check if feature is enabled
    const isEnabled = featureFlagService.isFeatureEnabled(flagName, user, userId, userSegments);
    
    res.json({
      success: true,
      data: {
        flagName,
        enabled: isEnabled,
        userId,
        userSegments
      }
    });
  } catch (error) {
    logger.error('Error checking feature flag', {
      flagName: req.params.flagName,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to check feature flag'
    });
  }
};

/**
 * Get user segments for feature flag targeting
 * @param {Object} user - User object
 * @returns {Array<string>} User segments
 */
const getUserSegments = (user) => {
  const segments = ['all']; // All users belong to 'all' segment
  
  if (!user) return segments;
  
  // Add user role segments
  if (user.role) {
    segments.push(user.role);
  }
  
  // Add premium user segment
  if (user.isPremium || user.subscriptionType === 'premium') {
    segments.push('premium-users');
  }
  
  // Add beta user segment
  if (user.isBetaUser || user.betaAccess) {
    segments.push('beta-users');
  }
  
  // Add enterprise user segment
  if (user.accountType === 'enterprise') {
    segments.push('enterprise-users');
  }
  
  // Add internal team segment
  if (user.email && (
    user.email.endsWith('@company.com') || 
    user.email.endsWith('@swaggo.com') ||
    user.email.includes('admin')
  )) {
    segments.push('internal-team');
  }
  
  // Add VIP user segment
  if (user.isVIP || user.tier === 'vip') {
    segments.push('vip-users');
  }
  
  return segments;
};

export default {
  getAllFlags,
  getFlag,
  setFlag,
  updateFlag,
  deleteFlag,
  setUserOverride,
  setSegmentOverride,
  checkFeatureEnabled
};