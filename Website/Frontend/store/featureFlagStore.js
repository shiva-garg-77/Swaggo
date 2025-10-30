import { create } from 'zustand';
import featureFlagService from '../services/featureFlagService';

/**
 * Feature Flag Store
 * Manages feature flag state across the application
 */
export const useFeatureFlagStore = create((set, get) => ({
  // State
  flags: [],
  userFlags: {}, // Flags enabled for current user
  isLoading: false,
  error: null,
  lastFetched: null,

  // Actions
  
  /**
   * Fetch all feature flags (Admin only)
   */
  fetchAllFlags: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await featureFlagService.getAllFlags();
      set({
        flags: response.data || [],
        isLoading: false,
        lastFetched: new Date()
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch a specific flag
   */
  fetchFlag: async (flagName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await featureFlagService.getFlag(flagName);
      
      // Update the flag in the list
      set((state) => ({
        flags: state.flags.map(f => 
          f.name === flagName ? response.data : f
        ),
        isLoading: false
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Create a new feature flag
   */
  createFlag: async (flagName, config) => {
    set({ isLoading: true, error: null });
    try {
      const response = await featureFlagService.createFlag(flagName, config);
      
      // Add the new flag to the list
      set((state) => ({
        flags: [...state.flags, response.data],
        isLoading: false
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Update a feature flag
   */
  updateFlag: async (flagName, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await featureFlagService.updateFlag(flagName, updates);
      
      // Update the flag in the list
      set((state) => ({
        flags: state.flags.map(f => 
          f.name === flagName ? response.data : f
        ),
        isLoading: false
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Toggle a feature flag on/off
   */
  toggleFlag: async (flagName, enabled) => {
    return get().updateFlag(flagName, { enabled });
  },

  /**
   * Update rollout percentage
   */
  updateRollout: async (flagName, rolloutPercentage) => {
    return get().updateFlag(flagName, { rolloutPercentage });
  },

  /**
   * Delete a feature flag
   */
  deleteFlag: async (flagName) => {
    set({ isLoading: true, error: null });
    try {
      await featureFlagService.deleteFlag(flagName);
      
      // Remove the flag from the list
      set((state) => ({
        flags: state.flags.filter(f => f.name !== flagName),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Set user override
   */
  setUserOverride: async (flagName, userId, enabled) => {
    set({ isLoading: true, error: null });
    try {
      await featureFlagService.setUserOverride(flagName, userId, enabled);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Set segment override
   */
  setSegmentOverride: async (flagName, segment, enabled) => {
    set({ isLoading: true, error: null });
    try {
      await featureFlagService.setSegmentOverride(flagName, segment, enabled);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Check if a feature is enabled for current user
   */
  checkFlag: async (flagName) => {
    try {
      const isEnabled = await featureFlagService.checkFeatureEnabled(flagName);
      
      // Update userFlags cache
      set((state) => ({
        userFlags: {
          ...state.userFlags,
          [flagName]: isEnabled
        }
      }));
      
      return isEnabled;
    } catch (error) {
      console.error(`Error checking flag ${flagName}:`, error);
      return false;
    }
  },

  /**
   * Get cached flag status (doesn't make API call)
   */
  isFlagEnabled: (flagName) => {
    return get().userFlags[flagName] || false;
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    flags: [],
    userFlags: {},
    isLoading: false,
    error: null,
    lastFetched: null
  })
}));

export default useFeatureFlagStore;
