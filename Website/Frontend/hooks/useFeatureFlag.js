/**
 * @fileoverview Hook for using feature flags in components
 * @module hooks/useFeatureFlag
 */

import { useEffect, useState } from 'react';
import { useFeatureFlagStore } from '../store/featureFlagStore';

/**
 * Hook for checking if a feature flag is enabled
 * @param {string} flagName - Feature flag to check
 * @param {boolean} checkOnMount - Whether to check the flag on mount (default: true)
 * @returns {boolean} Whether the feature is enabled
 */
export function useFeatureFlag(flagName, checkOnMount = true) {
  const { userFlags, checkFlag, isFlagEnabled } = useFeatureFlagStore();
  const [isEnabled, setIsEnabled] = useState(isFlagEnabled(flagName));

  useEffect(() => {
    // Check if we already have the flag cached
    if (userFlags[flagName] !== undefined) {
      setIsEnabled(userFlags[flagName]);
      return;
    }

    // Check the flag on mount if requested
    if (checkOnMount) {
      checkFlag(flagName).then(enabled => {
        setIsEnabled(enabled);
      });
    }
  }, [flagName, checkOnMount, userFlags, checkFlag, isFlagEnabled]);

  return isEnabled;
}

/**
 * Hook for managing a feature flag (Admin only)
 * @param {string} flagName - Feature flag to manage
 * @returns {Object} Feature flag management functions
 */
export function useFeatureFlagManager(flagName) {
  const { 
    flags, 
    isLoading, 
    error,
    fetchFlag,
    updateFlag, 
    toggleFlag, 
    deleteFlag,
    updateRollout,
    setUserOverride,
    setSegmentOverride
  } = useFeatureFlagStore();

  const flag = flags.find(f => f.name === flagName);

  return {
    flag,
    isLoading,
    error,
    refresh: () => fetchFlag(flagName),
    update: (updates) => updateFlag(flagName, updates),
    toggle: (enabled) => toggleFlag(flagName, enabled),
    delete: () => deleteFlag(flagName),
    setRollout: (percentage) => updateRollout(flagName, percentage),
    setUserOverride: (userId, enabled) => setUserOverride(flagName, userId, enabled),
    setSegmentOverride: (segment, enabled) => setSegmentOverride(flagName, segment, enabled)
  };
}

/**
 * Hook for managing all feature flags (Admin only)
 * @returns {Object} All feature flags and management functions
 */
export function useFeatureFlags() {
  const store = useFeatureFlagStore();

  useEffect(() => {
    // Fetch all flags on mount if not already fetched
    if (store.flags.length === 0 && !store.isLoading && !store.lastFetched) {
      store.fetchAllFlags().catch(console.error);
    }
  }, [store]);

  return {
    flags: store.flags,
    isLoading: store.isLoading,
    error: store.error,
    lastFetched: store.lastFetched,
    refresh: store.fetchAllFlags,
    createFlag: store.createFlag,
    updateFlag: store.updateFlag,
    deleteFlag: store.deleteFlag,
    clearError: store.clearError
  };
}

export default useFeatureFlag;