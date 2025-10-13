'use client';

import React, { useState, useEffect, useCallback } from 'react';
import offlineModeService, { OFFLINE_MODE_STATES } from '../../services/OfflineModeService';
import { useSocket } from '../../Components/Helper/PerfectSocketProvider';
import notificationService from '../../services/NotificationService';

const OfflineModeManager = () => {
  const [offlineState, setOfflineState] = useState(offlineModeService.state);
  const [isOnline, setIsOnline] = useState(offlineModeService.isOnline);
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  
  const socketData = useSocket();
  const messageQueue = socketData?.messageQueue || [];

  // Update state when offline mode service emits events
  useEffect(() => {
    const handleStateChange = ({ currentState }) => {
      setOfflineState(currentState);
      setIsOnline(currentState === OFFLINE_MODE_STATES.ONLINE);
      
      // Show banner when going offline
      if (currentState === OFFLINE_MODE_STATES.OFFLINE) {
        setShowBanner(true);
      }
    };

    const handleSyncQueued = () => {
      setSyncQueueSize(offlineModeService.syncQueue.length);
    };

    const handleSyncCompleted = () => {
      setSyncQueueSize(0);
      setSyncProgress(null);
      setShowBanner(false);
    };

    const handleSyncProgress = (data) => {
      setSyncProgress(data);
    };

    // Register event listeners
    offlineModeService.on('state_changed', handleStateChange);
    offlineModeService.on('sync_queued', handleSyncQueued);
    offlineModeService.on('sync_completed', handleSyncCompleted);
    offlineModeService.on('sync_progress', handleSyncProgress);

    // Cleanup
    return () => {
      offlineModeService.off('state_changed', handleStateChange);
      offlineModeService.off('sync_queued', handleSyncQueued);
      offlineModeService.off('sync_completed', handleSyncCompleted);
      offlineModeService.off('sync_progress', handleSyncProgress);
    };
  }, []);

  // Update queue size when socket message queue changes
  useEffect(() => {
    setSyncQueueSize(messageQueue.length);
  }, [messageQueue]);

  const getStatusConfig = useCallback(() => {
    switch (offlineState) {
      case OFFLINE_MODE_STATES.ONLINE:
        return {
          color: 'bg-green-500',
          text: 'Online',
          icon: '🟢',
          description: 'Connected to server'
        };
      case OFFLINE_MODE_STATES.OFFLINE:
        return {
          color: 'bg-red-500',
          text: 'Offline',
          icon: '🔴',
          description: 'Working offline'
        };
      case OFFLINE_MODE_STATES.SYNCING:
        return {
          color: 'bg-blue-500',
          text: 'Syncing',
          icon: '🔄',
          description: 'Syncing offline data'
        };
      case OFFLINE_MODE_STATES.TRANSITIONING:
        return {
          color: 'bg-yellow-500',
          text: 'Transitioning',
          icon: '🟡',
          description: 'Changing connection state'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Unknown',
          icon: '❓',
          description: 'Unknown status'
        };
    }
  }, [offlineState]);

  const handleRetryConnection = useCallback(() => {
    // Trigger reconnection through socket service
    if (socketData && socketData.reconnect) {
      socketData.reconnect();
    }
    
    // Also try to sync pending data
    offlineModeService.syncPendingData();
  }, [socketData]);

  const handleDismissBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  const handleViewOfflineData = useCallback(() => {
    // Show offline data management modal
    notificationService.info(
      'Offline Data',
      `You have ${syncQueueSize} items queued for sync. These will be sent when you come back online.`
    );
  }, [syncQueueSize]);

  const statusConfig = getStatusConfig();
  const hasQueuedData = syncQueueSize > 0;

  return (
    <>
      {/* Connection Status Indicator */}
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
        <div className={`w-2 h-2 rounded-full ${statusConfig.color} ${offlineState !== OFFLINE_MODE_STATES.ONLINE ? 'animate-pulse' : ''}`}></div>
        <span className="text-xs text-white/80 font-medium">{statusConfig.text}</span>
        
        {hasQueuedData && (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-yellow-200">•</span>
            <span className="text-xs text-yellow-200">{syncQueueSize} queued</span>
          </div>
        )}
        
        {offlineState === OFFLINE_MODE_STATES.OFFLINE && (
          <button
            onClick={handleRetryConnection}
            className="text-xs text-white/80 hover:text-white underline ml-1 bg-white/20 px-2 py-0.5 rounded"
            title="Click to retry connection"
          >
            Retry
          </button>
        )}
      </div>

      {/* Offline Mode Banner */}
      {showBanner && offlineState === OFFLINE_MODE_STATES.OFFLINE && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg shadow-lg mx-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-lg mr-2">📶</span>
                  <h3 className="font-bold">Offline Mode</h3>
                </div>
                <p className="text-sm mb-3">
                  You are currently offline. Your messages will be saved locally and sent when you come back online.
                </p>
                {hasQueuedData && (
                  <button
                    onClick={handleViewOfflineData}
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded mr-2"
                  >
                    View {syncQueueSize} queued items
                  </button>
                )}
              </div>
              <button
                onClick={handleDismissBanner}
                className="text-white/80 hover:text-white text-xl"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress Banner */}
      {syncProgress && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-lg shadow-lg mx-4">
            <div className="flex items-center">
              <span className="text-lg mr-2">🔄</span>
              <div className="flex-1">
                <h3 className="font-bold">Syncing Data</h3>
                <p className="text-sm">
                  {syncProgress.message || 'Syncing your offline data...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Data Management Modal */}
      {false && ( // This would be controlled by state in a real implementation
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Offline Data Management</h3>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-sm">
                <p>You have {syncQueueSize} items queued for sync.</p>
                <p>These will be automatically sent when you come back online.</p>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                  Sync Now
                </button>
                <button className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 py-2 px-4 rounded">
                  Clear Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineModeManager;