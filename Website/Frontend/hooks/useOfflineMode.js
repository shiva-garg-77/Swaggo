import { useState, useEffect, useCallback } from 'react';
import offlineModeService, { OFFLINE_MODE_STATES } from '../services/OfflineModeService';

/**
 * React hook for offline mode functionality
 * Provides access to offline state, sync queue, and offline data management
 */
export const useOfflineMode = () => {
  const [offlineState, setOfflineState] = useState(offlineModeService.state);
  const [isOnline, setIsOnline] = useState(offlineModeService.isOnline);
  const [syncQueueSize, setSyncQueueSize] = useState(offlineModeService.syncQueue.length);
  const [stats, setStats] = useState(offlineModeService.getStats());

  // Update state when offline mode service emits events
  useEffect(() => {
    const handleStateChange = ({ currentState }) => {
      setOfflineState(currentState);
      setIsOnline(currentState === OFFLINE_MODE_STATES.ONLINE);
    };

    const handleSyncQueued = () => {
      setSyncQueueSize(offlineModeService.syncQueue.length);
      setStats(offlineModeService.getStats());
    };

    const handleSyncCompleted = () => {
      setSyncQueueSize(0);
      setStats(offlineModeService.getStats());
    };

    // Register event listeners
    offlineModeService.on('state_changed', handleStateChange);
    offlineModeService.on('sync_queued', handleSyncQueued);
    offlineModeService.on('sync_completed', handleSyncCompleted);

    // Cleanup
    return () => {
      offlineModeService.off('state_changed', handleStateChange);
      offlineModeService.off('sync_queued', handleSyncQueued);
      offlineModeService.off('sync_completed', handleSyncCompleted);
    };
  }, []);

  /**
   * Store data locally for offline access
   */
  const storeLocalData = useCallback(async (key, data, options = {}) => {
    return await offlineModeService.storeLocalData(key, data, options);
  }, []);

  /**
   * Retrieve data from local storage
   */
  const getLocalData = useCallback(async (key) => {
    return await offlineModeService.getLocalData(key);
  }, []);

  /**
   * Queue data for sync when online
   */
  const queueForSync = useCallback(async (operation) => {
    return await offlineModeService.queueForSync(operation);
  }, []);

  /**
   * Sync pending data
   */
  const syncPendingData = useCallback(async () => {
    return await offlineModeService.syncPendingData();
  }, []);

  /**
   * Get offline mode statistics
   */
  const getStats = useCallback(() => {
    return offlineModeService.getStats();
  }, []);

  /**
   * Clear sensitive data
   */
  const clearSensitiveData = useCallback(async () => {
    return await offlineModeService.clearSensitiveData();
  }, []);

  return {
    // State
    offlineState,
    isOnline,
    syncQueueSize,
    stats,
    
    // Actions
    storeLocalData,
    getLocalData,
    queueForSync,
    syncPendingData,
    getStats,
    clearSensitiveData,
    
    // Constants
    OFFLINE_MODE_STATES
  };
};

export default useOfflineMode;