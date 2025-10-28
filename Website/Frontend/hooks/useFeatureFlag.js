/**
 * @fileoverview Hook for using feature flags in components
 * @module hooks/useFeatureFlag
 */

import { useFeatureFlags } from '../context/FeatureFlagContext';

/**
 * Hook for checking if a feature flag is enabled
 * @param {string} feature - Feature flag to check
 * @returns {boolean} Whether the feature is enabled
 */
export function useFeatureFlag(feature) {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(feature);
}

/**
 * Hook for managing a feature flag
 * @param {string} feature - Feature flag to manage
 * @returns {Object} Feature flag management functions
 */
export function useFeatureFlagManager(feature) {
  const { isEnabled, enableFeature, disableFeature, toggleFeature } = useFeatureFlags();
  
  return {
    isEnabled: isEnabled(feature),
    enable: () => enableFeature(feature),
    disable: () => disableFeature(feature),
    toggle: () => toggleFeature(feature)
  };
}

export default useFeatureFlag;