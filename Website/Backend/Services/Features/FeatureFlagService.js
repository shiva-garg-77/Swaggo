import { logger } from '../../utils/SanitizedLogger.js';

/**
 * @fileoverview Feature flag service for controlled rollouts and A/B testing
 * @module FeatureFlagService
 */

class FeatureFlagService {
  /**
   * @constructor
   * @description Initialize feature flag service
   */
  constructor() {
    this.flags = new Map();
    this.userOverrides = new Map();
    this.segmentOverrides = new Map();
    this.experiments = new Map(); // For A/B testing
    this.userExperiments = new Map(); // Track user experiment assignments
    this.logger = logger;
    
    // Load default feature flags
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default feature flags
   */
  initializeDefaultFlags() {
    // Core feature flags
    this.setFlag('ENABLE_NEW_MESSAGING_UI', {
      enabled: process.env.FEATURE_ENABLE_NEW_MESSAGING_UI === 'true',
      description: 'Enable the new messaging user interface',
      rolloutPercentage: parseInt(process.env.FEATURE_NEW_MESSAGING_UI_ROLLOUT || '0'),
      segments: ['beta-users', 'internal-team']
    });
    
    this.setFlag('ENABLE_ENHANCED_SECURITY', {
      enabled: process.env.FEATURE_ENABLE_ENHANCED_SECURITY !== 'false', // Enabled by default
      description: 'Enable enhanced security features',
      rolloutPercentage: 100,
      segments: ['all']
    });
    
    this.setFlag('ENABLE_OFFLINE_MODE', {
      enabled: process.env.FEATURE_ENABLE_OFFLINE_MODE === 'true',
      description: 'Enable offline-first functionality',
      rolloutPercentage: parseInt(process.env.FEATURE_OFFLINE_MODE_ROLLOUT || '100'),
      segments: ['all']
    });
    
    this.setFlag('ENABLE_SMART_REPLIES', {
      enabled: process.env.FEATURE_ENABLE_SMART_REPLIES !== 'false', // Enabled by default
      description: 'Enable AI-powered smart replies',
      rolloutPercentage: parseInt(process.env.FEATURE_SMART_REPLIES_ROLLOUT || '50'),
      segments: ['beta-users', 'premium-users']
    });
    
    this.setFlag('ENABLE_COLLABORATIVE_EDITING', {
      enabled: process.env.FEATURE_ENABLE_COLLABORATIVE_EDITING === 'true',
      description: 'Enable real-time collaborative editing',
      rolloutPercentage: parseInt(process.env.FEATURE_COLLABORATIVE_EDITING_ROLLOUT || '10'),
      segments: ['beta-users', 'enterprise-users']
    });
    
    this.setFlag('ENABLE_VOICE_MESSAGES', {
      enabled: process.env.FEATURE_ENABLE_VOICE_MESSAGES === 'true',
      description: 'Enable voice message functionality',
      rolloutPercentage: parseInt(process.env.FEATURE_VOICE_MESSAGES_ROLLOUT || '25'),
      segments: ['beta-users', 'premium-users']
    });
    
    this.setFlag('ENABLE_VIDEO_CALLS', {
      enabled: process.env.FEATURE_ENABLE_VIDEO_CALLS === 'true',
      description: 'Enable video calling functionality',
      rolloutPercentage: parseInt(process.env.FEATURE_VIDEO_CALLS_ROLLOUT || '15'),
      segments: ['beta-users', 'premium-users']
    });
    
    this.setFlag('ENABLE_STORY_MODE', {
      enabled: process.env.FEATURE_ENABLE_STORY_MODE === 'true',
      description: 'Enable story mode functionality',
      rolloutPercentage: parseInt(process.env.FEATURE_STORY_MODE_ROLLOUT || '5'),
      segments: ['beta-users']
    });
    
    this.logger.info('Feature flags initialized', {
      flagCount: this.flags.size
    });
  }

  /**
   * Set a feature flag
   * @param {string} flagName - Name of the feature flag
   * @param {Object} config - Configuration for the feature flag
   * @param {boolean} config.enabled - Whether the feature is enabled
   * @param {string} config.description - Description of the feature
   * @param {number} config.rolloutPercentage - Percentage of users to rollout to (0-100)
   * @param {Array<string>} config.segments - User segments to enable for
   */
  setFlag(flagName, config) {
    this.flags.set(flagName, {
      ...config,
      createdAt: new Date(),
      lastModified: new Date()
    });
    
    this.logger.info('Feature flag set', {
      flagName,
      enabled: config.enabled,
      rolloutPercentage: config.rolloutPercentage
    });
  }

  /**
   * Get a feature flag configuration
   * @param {string} flagName - Name of the feature flag
   * @returns {Object|null} Feature flag configuration or null if not found
   */
  getFlag(flagName) {
    return this.flags.get(flagName) || null;
  }

  /**
   * Check if a feature is enabled for a user
   * @param {string} flagName - Name of the feature flag
   * @param {Object} user - User object (optional)
   * @param {string} userId - User ID (optional)
   * @param {Array<string>} userSegments - User segments (optional)
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(flagName, user = null, userId = null, userSegments = []) {
    const flag = this.getFlag(flagName);
    
    // If flag doesn't exist, return false
    if (!flag) {
      this.logger.warn('Feature flag not found', { flagName });
      return false;
    }
    
    // If flag is explicitly disabled, return false
    if (!flag.enabled) {
      return false;
    }
    
    // Check for user-specific override
    if (userId && this.userOverrides.has(`${flagName}:${userId}`)) {
      return this.userOverrides.get(`${flagName}:${userId}`);
    }
    
    // Check for segment overrides
    if (userSegments && userSegments.length > 0) {
      for (const segment of userSegments) {
        if (this.segmentOverrides.has(`${flagName}:${segment}`)) {
          return this.segmentOverrides.get(`${flagName}:${segment}`);
        }
        
        // Check if user belongs to a segment that has the feature enabled
        if (flag.segments && flag.segments.includes(segment)) {
          return true;
        }
      }
    }
    
    // If user is provided, use user-based rollout
    if (user || userId) {
      const id = userId || (user && (user.profileid || user.id));
      if (id) {
        // Simple hash-based rollout percentage
        const hash = this.simpleHash(id + flagName);
        const userRollout = hash % 100;
        return userRollout < flag.rolloutPercentage;
      }
    }
    
    // Default to global rollout percentage
    return flag.rolloutPercentage >= 100;
  }

  /**
   * Set user-specific override for a feature flag
   * @param {string} flagName - Name of the feature flag
   * @param {string} userId - User ID
   * @param {boolean} enabled - Whether to enable the feature for this user
   */
  setUserOverride(flagName, userId, enabled) {
    this.userOverrides.set(`${flagName}:${userId}`, enabled);
    
    this.logger.info('User feature flag override set', {
      flagName,
      userId,
      enabled
    });
  }

  /**
   * Set segment-specific override for a feature flag
   * @param {string} flagName - Name of the feature flag
   * @param {string} segment - User segment
   * @param {boolean} enabled - Whether to enable the feature for this segment
   */
  setSegmentOverride(flagName, segment, enabled) {
    this.segmentOverrides.set(`${flagName}:${segment}`, enabled);
    
    this.logger.info('Segment feature flag override set', {
      flagName,
      segment,
      enabled
    });
  }

  /**
   * Get all feature flags
   * @returns {Map} All feature flags
   */
  getAllFlags() {
    return this.flags;
  }

  /**
   * Update a feature flag
   * @param {string} flagName - Name of the feature flag
   * @param {Object} updates - Updates to apply
   */
  updateFlag(flagName, updates) {
    const flag = this.getFlag(flagName);
    if (!flag) {
      throw new Error(`Feature flag '${flagName}' not found`);
    }
    
    // Merge updates with existing flag
    const updatedFlag = {
      ...flag,
      ...updates,
      lastModified: new Date()
    };
    
    this.flags.set(flagName, updatedFlag);
    
    this.logger.info('Feature flag updated', {
      flagName,
      updates
    });
  }

  /**
   * Remove a feature flag
   * @param {string} flagName - Name of the feature flag
   */
  removeFlag(flagName) {
    const result = this.flags.delete(flagName);
    
    if (result) {
      this.logger.info('Feature flag removed', { flagName });
    } else {
      this.logger.warn('Attempted to remove non-existent feature flag', { flagName });
    }
    
    return result;
  }

  /**
   * Simple hash function for consistent user-based rollouts
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get feature flags status for a user
   * @param {Object} user - User object (optional)
   * @param {string} userId - User ID (optional)
   * @param {Array<string>} userSegments - User segments (optional)
   * @returns {Object} Object with feature flag statuses
   */
  getUserFeatureFlags(user = null, userId = null, userSegments = []) {
    const flags = {};
    
    for (const [flagName, flagConfig] of this.flags.entries()) {
      flags[flagName] = this.isFeatureEnabled(flagName, user, userId, userSegments);
    }
    
    return flags;
  }
}

// Export singleton instance
const featureFlagService = new FeatureFlagService();
export default featureFlagService;