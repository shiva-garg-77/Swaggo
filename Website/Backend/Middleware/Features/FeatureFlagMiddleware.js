import featureFlagService from '../../Services/Features/FeatureFlagService.js';

/**
 * @fileoverview Middleware for feature flag integration
 * @module FeatureFlagMiddleware
 */

/**
 * Middleware to add feature flags to request context
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const featureFlagMiddleware = (req, res, next) => {
  // Add feature flag service to request object
  req.featureFlags = featureFlagService;
  
  // Add helper method to check if a feature is enabled for the current user
  req.isFeatureEnabled = (flagName) => {
    // Get user from request (if authenticated)
    const user = req.user;
    const userId = user ? (user.profileid || user.id) : null;
    
    // Get user segments (if available)
    const userSegments = user ? getUserSegments(user) : [];
    
    // Check if feature is enabled for this user
    return featureFlagService.isFeatureEnabled(flagName, user, userId, userSegments);
  };
  
  next();
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

/**
 * Middleware to require a feature flag for a route
 * @param {string} flagName - Name of the feature flag
 * @returns {Function} Express middleware
 */
export const requireFeatureFlag = (flagName) => {
  return (req, res, next) => {
    // Check if feature is enabled for this user
    if (req.isFeatureEnabled && req.isFeatureEnabled(flagName)) {
      return next();
    }
    
    // Feature not enabled - return 404 or 403 depending on whether we want to hide the feature
    // Using 404 to hide the feature from users who don't have access
    return res.status(404).json({
      error: 'Feature not found',
      message: 'The requested feature is not available'
    });
  };
};

/**
 * Middleware to conditionally apply middleware based on feature flag
 * @param {string} flagName - Name of the feature flag
 * @param {Function} middleware - Middleware to apply if feature is enabled
 * @returns {Function} Express middleware
 */
export const conditionalMiddleware = (flagName, middleware) => {
  return (req, res, next) => {
    // If feature is enabled, apply the middleware
    if (req.isFeatureEnabled && req.isFeatureEnabled(flagName)) {
      return middleware(req, res, next);
    }
    
    // Otherwise, continue without applying the middleware
    next();
  };
};

export default {
  featureFlagMiddleware,
  requireFeatureFlag,
  conditionalMiddleware
};