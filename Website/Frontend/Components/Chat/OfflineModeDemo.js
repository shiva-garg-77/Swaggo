'use client';

import React, { useState, useEffect } from 'react';
import useOfflineMode from '../../hooks/useOfflineMode';
import OfflineModeManager from './OfflineModeManager';

const OfflineModeDemo = () => {
  const {
    offlineState,
    isOnline,
    syncQueueSize,
    stats,
    storeLocalData,
    getLocalData,
    queueForSync,
    syncPendingData,
    getStats
  } = useOfflineMode();

  const [demoData, setDemoData] = useState({
    message: '',
    key: ''
  });
  const [retrievedData, setRetrievedData] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [localStats, setLocalStats] = useState(stats);

  // Update local stats when stats change
  useEffect(() => {
    setLocalStats(stats);
  }, [stats]);

  const handleStoreData = async () => {
    if (!demoData.key || !demoData.message) {
      alert('Please enter both key and message');
      return;
    }

    try {
      const result = await storeLocalData(demoData.key, {
        message: demoData.message,
        timestamp: Date.now()
      });
      
      if (result) {
        alert('Data stored successfully!');
        setDemoData({ message: '', key: '' });
      } else {
        alert('Failed to store data');
      }
    } catch (error) {
      console.error('Error storing data:', error);
      alert('Error storing data: ' + error.message);
    }
  };

  const handleRetrieveData = async () => {
    if (!demoData.key) {
      alert('Please enter a key');
      return;
    }

    try {
      const data = await getLocalData(demoData.key);
      setRetrievedData(data);
    } catch (error) {
      console.error('Error retrieving data:', error);
      alert('Error retrieving data: ' + error.message);
    }
  };

  const handleQueueSync = async () => {
    if (!demoData.message) {
      alert('Please enter a message to sync');
      return;
    }

    try {
      const operation = {
        type: 'message',
        data: {
          content: demoData.message,
          timestamp: Date.now(),
          tempId: 'temp_' + Date.now()
        }
      };

      const result = await queueForSync(operation);
      setSyncResult(`Operation queued with ID: ${result}`);
      setDemoData({ ...demoData, message: '' });
    } catch (error) {
      console.error('Error queuing sync:', error);
      setSyncResult('Error queuing sync: ' + error.message);
    }
  };

  const handleSyncPending = async () => {
    try {
      await syncPendingData();
      setSyncResult('Sync initiated');
    } catch (error) {
      console.error('Error syncing pending data:', error);
      setSyncResult('Error syncing pending data: ' + error.message);
    }
  };

  const handleRefreshStats = () => {
    const updatedStats = getStats();
    setLocalStats(updatedStats);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Offline Mode Demo</h1>
          <OfflineModeManager />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Current Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">State:</span>
                <span className="font-medium">{offlineState}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Online:</span>
                <span className="font-medium">{isOnline ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Sync Queue:</span>
                <span className="font-medium">{syncQueueSize} items</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Statistics</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Offline Duration:</span>
                <span className="font-medium">{Math.round(localStats.offlineDuration / 1000)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Sync Operations:</span>
                <span className="font-medium">{localStats.syncOperations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Data Stored:</span>
                <span className="font-medium">{localStats.dataStoredLocally}</span>
              </div>
            </div>
            <button
              onClick={handleRefreshStats}
              className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
            >
              Refresh Stats
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Data Section */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Store Local Data</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={demoData.key}
                  onChange={(e) => setDemoData({ ...demoData, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  placeholder="Enter key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={demoData.message}
                  onChange={(e) => setDemoData({ ...demoData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  placeholder="Enter message to store"
                  rows={3}
                />
              </div>
              <button
                onClick={handleStoreData}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200"
              >
                Store Data
              </button>
            </div>
          </div>

          {/* Retrieve Data Section */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Retrieve Local Data</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={demoData.key}
                  onChange={(e) => setDemoData({ ...demoData, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  placeholder="Enter key to retrieve"
                />
              </div>
              <button
                onClick={handleRetrieveData}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition duration-200"
              >
                Retrieve Data
              </button>
              {retrievedData && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-600 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retrieved Data:</h3>
                  <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto">
                    {JSON.stringify(retrievedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Sync Data Section */}
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sync Data</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message to Sync
                </label>
                <textarea
                  value={demoData.message}
                  onChange={(e) => setDemoData({ ...demoData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  placeholder="Enter message to sync"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleQueueSync}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition duration-200"
                >
                  Queue for Sync
                </button>
                <button
                  onClick={handleSyncPending}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-200"
                  disabled={syncQueueSize === 0}
                >
                  Sync Now
                </button>
              </div>
              {syncResult && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-600 rounded-md">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{syncResult}</p>
                </div>
              )}
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>Note: Sync operations will only execute when online.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">How Offline Mode Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <h3 className="font-medium mb-2">Local Storage</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Data is stored in browser's IndexedDB</li>
                <li>Persists even after browser restart</li>
                <li>Automatically expires after 7 days</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Sync Process</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Queued operations sync when online</li>
                <li>Automatic retry on failure</li>
                <li>Conflict resolution strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineModeDemo;