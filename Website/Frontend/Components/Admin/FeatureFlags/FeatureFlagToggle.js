'use client';

import { useState } from 'react';
import { useFeatureFlagStore } from '../../../store/featureFlagStore';
import toast from 'react-hot-toast';

/**
 * Feature Flag Toggle Component
 * iOS-style toggle switch for enabling/disabling feature flags
 */
export default function FeatureFlagToggle({ flagName, enabled: initialEnabled }) {
  const { toggleFlag } = useFeatureFlagStore();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    const newState = !enabled;
    
    // Optimistic update
    setEnabled(newState);
    setIsToggling(true);

    try {
      await toggleFlag(flagName, newState);
      toast.success(`Feature flag "${flagName}" ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Rollback on error
      setEnabled(!newState);
      toast.error(`Failed to toggle feature flag: ${error.message}`);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
      `}
      aria-label={`Toggle ${flagName}`}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
          ${isToggling ? 'animate-pulse' : ''}
        `}
      />
    </button>
  );
}
