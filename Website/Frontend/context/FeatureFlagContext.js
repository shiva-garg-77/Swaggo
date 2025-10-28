/**
 * @fileoverview Feature Flag Context for A/B testing and feature toggles
 * @module context/FeatureFlagContext
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { config, isFeatureEnabled } from '../config/config';

// Define all available features
export const FEATURES = {
  // Core features
  VOICE_MESSAGES: 'voiceMessages',
  VIDEO_CALLS: 'videoCalls',
  PUSH_NOTIFICATIONS: 'pushNotifications',
  SCREEN_SHARING: 'screenSharing',
  OFFLINE_MODE: 'offlineMode',
  MESSAGE_REACTIONS: 'messageReactions',
  
  // Advanced features
  AI_ASSISTANT: 'aiAssistant',
  SMART_REPLIES: 'smartReplies',
  MESSAGE_TRANSLATION: 'messageTranslation',
  POLLING: 'polling',
  SCHEDULED_MESSAGES: 'scheduledMessages',
  
  // UI/UX features
  DARK_MODE: 'darkMode',
  CUSTOM_THEMES: 'customThemes',
  ANIMATIONS: 'animations',
  RICH_TEXT_EDITOR: 'richTextEditor',
  
  // Security features
  BIOMETRIC_AUTH: 'biometricAuth',
  ADVANCED_ENCRYPTION: 'advancedEncryption',
  MESSAGE_SELF_DESTRUCT: 'messageSelfDestruct',
  
  // Performance features
  LAZY_LOADING: 'lazyLoading',
  CODE_SPLITTING: 'codeSplitting',
  PREFETCHING: 'prefetching',
  
  // Experimental features
  WEBRTC_DATA_CHANNEL: 'webrtcDataChannel',
  P2P_MESSAGING: 'p2pMessaging',
  BLOCKCHAIN_INTEGRATION: 'blockchainIntegration'
};

// Default feature flags
const DEFAULT_FEATURE_FLAGS = {
  // Core features (from existing config)
  [FEATURES.VOICE_MESSAGES]: isFeatureEnabled('voiceMessages'),
  [FEATURES.VIDEO_CALLS]: isFeatureEnabled('videoCalls'),
  [FEATURES.PUSH_NOTIFICATIONS]: isFeatureEnabled('pushNotifications'),
  [FEATURES.SCREEN_SHARING]: isFeatureEnabled('screenSharing'),
  [FEATURES.OFFLINE_MODE]: isFeatureEnabled('offlineMode'),
  [FEATURES.MESSAGE_REACTIONS]: isFeatureEnabled('messageReactions'),
  
  // Advanced features
  [FEATURES.AI_ASSISTANT]: false,
  [FEATURES.SMART_REPLIES]: true,
  [FEATURES.MESSAGE_TRANSLATION]: false,
  [FEATURES.POLLING]: true,
  [FEATURES.SCHEDULED_MESSAGES]: false,
  
  // UI/UX features
  [FEATURES.DARK_MODE]: isFeatureEnabled('enableDarkMode'),
  [FEATURES.CUSTOM_THEMES]: true,
  [FEATURES.ANIMATIONS]: true,
  [FEATURES.RICH_TEXT_EDITOR]: false,
  
  // Security features
  [FEATURES.BIOMETRIC_AUTH]: false,
  [FEATURES.ADVANCED_ENCRYPTION]: true,
  [FEATURES.MESSAGE_SELF_DESTRUCT]: false,
  
  // Performance features
  [FEATURES.LAZY_LOADING]: true,
  [FEATURES.CODE_SPLITTING]: true,
  [FEATURES.PREFETCHING]: true,
  
  // Experimental features
  [FEATURES.WEBRTC_DATA_CHANNEL]: false,
  [FEATURES.P2P_MESSAGING]: false,
  [FEATURES.BLOCKCHAIN_INTEGRATION]: false
};

// Feature flag context
const FeatureFlagContext = createContext();

/**
 * Feature flag provider that manages feature flags
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function FeatureFlagProvider({ children }) {
  const [featureFlags, setFeatureFlags] = useState({});
  const [remoteFlags, setRemoteFlags] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize feature flags
  useEffect(() => {
    try {
      // Load feature flags from localStorage
      const savedFlags = localStorage.getItem('swaggo-feature-flags');
      const initialFlags = savedFlags ? JSON.parse(savedFlags) : {};
      
      // Merge with default flags
      const mergedFlags = { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
      
      setFeatureFlags(mergedFlags);
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing feature flags:', err);
      setFeatureFlags(DEFAULT_FEATURE_FLAGS);
      setIsLoading(false);
      setError('Failed to initialize feature flags');
    }
  }, []);

  // Save feature flags to localStorage
  useEffect(() => {
    if (Object.keys(featureFlags).length > 0) {
      try {
        localStorage.setItem('swaggo-feature-flags', JSON.stringify(featureFlags));
      } catch (err) {
        console.error('Error saving feature flags:', err);
      }
    }
  }, [featureFlags]);

  // Fetch remote feature flags (if applicable)
  useEffect(() => {
    const fetchRemoteFlags = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we'll just use the default flags
        setRemoteFlags(DEFAULT_FEATURE_FLAGS);
      } catch (err) {
        console.error('Error fetching remote feature flags:', err);
        setError('Failed to fetch remote feature flags');
      }
    };

    if (config.features.debug) {
      fetchRemoteFlags();
    }
  }, []);

  // Check if a feature is enabled
  const isEnabled = (feature) => {
    // Check remote flags first, then local flags
    if (remoteFlags.hasOwnProperty(feature)) {
      return remoteFlags[feature];
    }
    
    if (featureFlags.hasOwnProperty(feature)) {
      return featureFlags[feature];
    }
    
    // Default to false if feature not found
    return false;
  };

  // Enable a feature
  const enableFeature = (feature) => {
    setFeatureFlags(prev => ({
      ...prev,
      [feature]: true
    }));
  };

  // Disable a feature
  const disableFeature = (feature) => {
    setFeatureFlags(prev => ({
      ...prev,
      [feature]: false
    }));
  };

  // Toggle a feature
  const toggleFeature = (feature) => {
    setFeatureFlags(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  // Reset all features to defaults
  const resetToDefaults = () => {
    setFeatureFlags(DEFAULT_FEATURE_FLAGS);
  };

  // Bulk update features
  const updateFeatures = (updates) => {
    setFeatureFlags(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Get all enabled features
  const getEnabledFeatures = useMemo(() => {
    return Object.keys(featureFlags).filter(feature => isEnabled(feature));
  }, [featureFlags]);

  // Get all available features
  const getAllFeatures = useMemo(() => {
    return Object.keys(FEATURES);
  }, []);

  // Context value
  const value = {
    // State
    featureFlags,
    remoteFlags,
    isLoading,
    error,
    
    // Methods
    isEnabled,
    enableFeature,
    disableFeature,
    toggleFeature,
    resetToDefaults,
    updateFeatures,
    
    // Utilities
    getEnabledFeatures,
    getAllFeatures,
    FEATURES
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Custom hook to use feature flags
 * @returns {Object} Feature flag context values
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

/**
 * Higher-order component for conditional rendering based on feature flags
 * @param {string} feature - Feature flag to check
 * @param {React.Component} Component - Component to render if feature is enabled
 * @param {React.Component} FallbackComponent - Component to render if feature is disabled
 * @returns {React.Component} Wrapped component
 */
export function withFeatureFlag(feature, Component, FallbackComponent = null) {
  return function FeatureFlaggedComponent(props) {
    const { isEnabled } = useFeatureFlags();
    
    if (isEnabled(feature)) {
      return <Component {...props} />;
    }
    
    return FallbackComponent ? <FallbackComponent {...props} /> : null;
  };
}

/**
 * Component for conditional rendering based on feature flags
 * @param {Object} props - Component props
 * @param {string} props.feature - Feature flag to check
 * @param {React.ReactNode} props.children - Children to render if feature is enabled
 * @param {React.ReactNode} props.fallback - Fallback to render if feature is disabled
 * @returns {React.ReactNode} Rendered component
 */
export function FeatureFlag({ feature, children, fallback = null }) {
  const { isEnabled } = useFeatureFlags();
  
  return isEnabled(feature) ? children : fallback;
}

export default FeatureFlagContext;