/**
 * Enhanced Offline Mode Service
 * Provides comprehensive offline capabilities with local storage and sync
 */

import { EventEmitter } from 'events';
import indexedDBStorage from '../utils/IndexedDBStorage';
import cacheService from './CacheService';
import notificationService from './UnifiedNotificationService';

// ✅ FIX: Socket service will be injected via constructor to avoid circular dependency
let socketService = null;

/**
 * Offline Mode States
 */
export const OFFLINE_MODE_STATES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  TRANSITIONING: 'transitioning',
  SYNCING: 'syncing'
};

/**
 * Data Sync Strategies
 */
export const SYNC_STRATEGIES = {
  IMMEDIATE: 'immediate',
  BATCH: 'batch',
  SCHEDULED: 'scheduled'
};

/**
 * Enhanced Offline Mode Service Class
 */
class OfflineModeService extends EventEmitter {
  constructor() {
    super();
    
    // Core state management
    this.state = OFFLINE_MODE_STATES.ONLINE;
    this.isOnline = navigator.onLine;
    this.lastOnlineTime = Date.now();
    this.offlineStartTime = null;
    
    // Data management
    this.localData = new Map();
    this.pendingSyncOperations = [];
    this.syncQueue = [];
    this.conflictResolver = new Map();
    
    // Configuration
    this.config = {
      // Storage settings
      enablePersistentStorage: true,
      maxOfflineDataSize: 10000,
      dataTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      
      // Sync settings
      autoSync: true,
      syncStrategy: SYNC_STRATEGIES.BATCH,
      syncInterval: 30000, // 30 seconds
      maxSyncBatchSize: 50,
      syncOnReconnect: true,
      syncOnOnline: true,
      
      // Performance settings
      enableCompression: true,
      enableBatching: true,
      enableConflictResolution: true,
      
      // User experience
      showOfflineNotifications: true,
      showSyncProgress: true,
      enableOfflineBanner: true
    };
    
    // Statistics and metrics
    this.stats = {
      offlineDuration: 0,
      syncOperations: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0,
      dataStoredLocally: 0,
      dataSynced: 0
    };
    
    // Timers and intervals
    this.syncTimer = null;
    this.offlineTimer = null;
    
    this.initializeService();
  }

  /**
   * Initialize the offline mode service
   */
  initializeService() {
    this.setupNetworkListeners();
    this.setupSocketListeners();
    this.setupAuthListeners();
    this.setupConflictResolvers();
    this.startSyncTimer();
    
    console.log('🔄 OfflineModeService initialized');
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.handleNetworkOnline();
    });

    window.addEventListener('offline', () => {
      this.handleNetworkOffline();
    });
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    // ✅ FIX: Check if socket service is available before setting up listeners
    if (!socketService || typeof socketService.on !== 'function') {
      console.warn('⚠️ OfflineModeService: Socket service not available, skipping socket listeners');
      return;
    }

    try {
      socketService.on('connected', () => {
        this.handleSocketConnected();
      });

      socketService.on('disconnected', () => {
        this.handleSocketDisconnected();
      });

      socketService.on('reconnected', () => {
        this.handleSocketReconnected();
      });
    } catch (error) {
      console.error('❌ OfflineModeService: Error setting up socket listeners:', error);
    }
  }

  /**
   * Setup authentication listeners
   */
  setupAuthListeners() {
    // ✅ FIX: Auth is handled by React Context, not a service
    // This method is kept for future extensibility
    console.log('🔒 OfflineModeService: Auth listeners handled by React Context');
  }

  /**
   * Setup conflict resolvers
   */
  setupConflictResolvers() {
    // Latest timestamp wins
    this.conflictResolver.set('latest_timestamp', (localData, serverData) => {
      const localTime = new Date(localData.updatedAt || localData.timestamp || 0).getTime();
      const serverTime = new Date(serverData.updatedAt || serverData.timestamp || 0).getTime();
      return localTime >= serverTime ? localData : serverData;
    });

    // Merge strategy
    this.conflictResolver.set('merge', (localData, serverData) => {
      return { ...serverData, ...localData };
    });

    // Server wins
    this.conflictResolver.set('server_wins', (localData, serverData) => {
      return serverData;
    });

    // Local wins
    this.conflictResolver.set('local_wins', (localData, serverData) => {
      return localData;
    });
  }

  /**
   * Handle network online event
   */
  handleNetworkOnline() {
    console.log('🌐 Network connection restored');
    
    this.isOnline = true;
    this.lastOnlineTime = Date.now();
    
    // Calculate offline duration
    if (this.offlineStartTime) {
      this.stats.offlineDuration += Date.now() - this.offlineStartTime;
      this.offlineStartTime = null;
    }
    
    this.updateState(OFFLINE_MODE_STATES.ONLINE);
    
    // Show notification
    if (this.config.showOfflineNotifications) {
      notificationService.success(
        'Connection Restored',
        'You are back online. Syncing your data...'
      );
    }
    
    // Trigger sync if configured
    if (this.config.syncOnOnline) {
      this.syncPendingData();
    }
    
    this.emit('network_online', {
      timestamp: Date.now(),
      offlineDuration: this.stats.offlineDuration
    });
  }

  /**
   * Handle network offline event
   */
  handleNetworkOffline() {
    console.log('📴 Network connection lost');
    
    this.isOnline = false;
    this.offlineStartTime = Date.now();
    
    this.updateState(OFFLINE_MODE_STATES.OFFLINE);
    
    // Show notification
    if (this.config.showOfflineNotifications) {
      notificationService.info(
        'Offline Mode',
        'You are currently offline. Your data will be saved locally and synced when you come back online.',
        { persistent: true }
      );
    }
    
    this.emit('network_offline', {
      timestamp: Date.now()
    });
  }

  /**
   * Handle socket connected
   */
  handleSocketConnected() {
    console.log('✅ Socket connection established');
    
    if (this.state === OFFLINE_MODE_STATES.OFFLINE) {
      this.updateState(OFFLINE_MODE_STATES.ONLINE);
    }
  }

  /**
   * Handle socket disconnected
   */
  handleSocketDisconnected() {
    console.log('❌ Socket connection lost');
    
    // Only transition to offline if network is also offline
    if (!this.isOnline) {
      this.updateState(OFFLINE_MODE_STATES.OFFLINE);
    }
  }

  /**
   * Handle socket reconnected
   */
  handleSocketReconnected() {
    console.log('🔄 Socket reconnection successful');
    
    this.updateState(OFFLINE_MODE_STATES.ONLINE);
    
    // Trigger sync if configured
    if (this.config.syncOnReconnect) {
      this.syncPendingData();
    }
    
    // Show notification
    if (this.config.showOfflineNotifications) {
      notificationService.success(
        'Reconnected',
        'Connection restored successfully. Syncing your data...'
      );
    }
  }

  /**
   * Handle authentication lost
   */
  handleAuthenticationLost() {
    console.log('🔒 Authentication lost, clearing sensitive offline data');
    
    // Clear sensitive data
    this.clearSensitiveData();
  }

  /**
   * Update offline mode state
   */
  updateState(newState) {
    if (this.state === newState) return;
    
    const previousState = this.state;
    this.state = newState;
    
    console.log(`🔄 Offline mode state changed: ${previousState} → ${newState}`);
    
    this.emit('state_changed', {
      previousState,
      currentState: newState,
      timestamp: Date.now()
    });
  }

  /**
   * Store data locally for offline access
   */
  async storeLocalData(key, data, options = {}) {
    try {
      const storageKey = `offline_${key}`;
      const timestamp = Date.now();
      const ttl = options.ttl || this.config.dataTTL;
      
      const storedData = {
        key,
        data,
        timestamp,
        expiresAt: timestamp + ttl,
        ...options
      };
      
      // Store in memory map
      this.localData.set(key, storedData);
      
      // Store in persistent storage if enabled
      if (this.config.enablePersistentStorage) {
        await indexedDBStorage.cacheMessage(storageKey, storedData, ttl);
      }
      
      // Update stats
      this.stats.dataStoredLocally++;
      
      this.emit('data_stored', {
        key,
        size: JSON.stringify(data).length,
        timestamp
      });
      
      return true;
    } catch (error) {
      console.error('Failed to store local data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from local storage
   */
  async getLocalData(key) {
    try {
      // Check memory first
      const memoryData = this.localData.get(key);
      if (memoryData && Date.now() < memoryData.expiresAt) {
        return memoryData.data;
      }
      
      // Check persistent storage if enabled
      if (this.config.enablePersistentStorage) {
        const storageKey = `offline_${key}`;
        const storedData = await indexedDBStorage.getCachedMessage(storageKey);
        
        if (storedData && Date.now() < storedData.expiresAt) {
          // Update memory cache
          this.localData.set(key, storedData);
          return storedData.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve local data:', error);
      return null;
    }
  }

  /**
   * Queue data for sync when online
   */
  async queueForSync(operation) {
    try {
      const syncOperation = {
        id: this.generateId(),
        timestamp: Date.now(),
        attempts: 0,
        maxAttempts: 3,
        ...operation
      };
      
      // Add to sync queue
      this.syncQueue.push(syncOperation);
      
      // Store in persistent storage if enabled
      if (this.config.enablePersistentStorage) {
        await indexedDBStorage.queueMessage(syncOperation);
      }
      
      this.emit('sync_queued', {
        operation: syncOperation
      });
      
      // Trigger immediate sync if configured
      if (this.config.syncStrategy === SYNC_STRATEGIES.IMMEDIATE && this.isOnline) {
        this.processSyncQueue();
      }
      
      return syncOperation.id;
    } catch (error) {
      console.error('Failed to queue for sync:', error);
      throw error;
      }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    if (this.state === OFFLINE_MODE_STATES.SYNCING) {
      return;
    }
    
    this.updateState(OFFLINE_MODE_STATES.SYNCING);
    
    try {
      console.log(`📤 Processing sync queue: ${this.syncQueue.length} operations`);
      
      // Show sync progress if configured
      if (this.config.showSyncProgress) {
        notificationService.info(
          'Syncing Data',
          `Syncing ${this.syncQueue.length} pending operations...`,
          { persistent: true, id: 'sync_progress' }
        );
      }
      
      // Process in batches
      const batchSize = this.config.maxSyncBatchSize;
      const totalOperations = this.syncQueue.length;
      
      while (this.syncQueue.length > 0) {
        const batch = this.syncQueue.splice(0, batchSize);
        const batchResults = [];
        
        // Process batch
        for (const operation of batch) {
          try {
            const result = await this.executeSyncOperation(operation);
            batchResults.push({ operation, success: true, result });
            
            // Remove from persistent storage
            if (this.config.enablePersistentStorage && operation.id) {
              await indexedDBStorage.removeQueueItem(operation.id);
            }
          } catch (error) {
            console.error('Sync operation failed:', error);
            batchResults.push({ operation, success: false, error });
            
            // Increment attempts and requeue if not maxed out
            operation.attempts++;
            if (operation.attempts < operation.maxAttempts) {
              this.syncQueue.push(operation);
            }
          }
        }
        
        // Update stats
        this.stats.syncOperations++;
        this.stats.successfulSyncs += batchResults.filter(r => r.success).length;
        this.stats.failedSyncs += batchResults.filter(r => !r.success).length;
        this.stats.dataSynced += batchResults.length;
        
        // Update progress notification
        if (this.config.showSyncProgress) {
          const remaining = this.syncQueue.length;
          if (remaining > 0) {
            notificationService.info(
              'Syncing Data',
              `Synced ${totalOperations - remaining}/${totalOperations} operations...`,
              { persistent: true, id: 'sync_progress' }
            );
          }
        }
      }
      
      // Clear progress notification
      if (this.config.showSyncProgress) {
        notificationService.remove('sync_progress');
        notificationService.success(
          'Sync Complete',
          `Successfully synced ${this.stats.dataSynced} operations`
        );
      }
      
      this.emit('sync_completed', {
        timestamp: Date.now(),
        operationsSynced: this.stats.dataSynced
      });
      
    } catch (error) {
      console.error('Failed to process sync queue:', error);
      
      if (this.config.showSyncProgress) {
        notificationService.remove('sync_progress');
        notificationService.error(
          'Sync Failed',
          'Failed to sync offline data. Will retry when connection is restored.'
        );
      }
      
      this.emit('sync_failed', {
        error,
        timestamp: Date.now()
      });
    } finally {
      this.updateState(OFFLINE_MODE_STATES.ONLINE);
    }
  }

  /**
   * Execute a sync operation
   */
  async executeSyncOperation(operation) {
    const { type, data, endpoint, method = 'POST' } = operation;
    
    switch (type) {
      case 'message':
        return this.syncMessage(data);
      
      case 'api_call':
        return this.syncApiCall(endpoint, method, data);
      
      case 'socket_emit':
        return this.syncSocketEmit(data);
      
      default:
        throw new Error(`Unknown sync operation type: ${type}`);
    }
  }

  /**
   * Sync a message
   */
  async syncMessage(messageData) {
    if (!socketService.isConnected()) {
      throw new Error('Socket not connected');
    }
    
    return new Promise((resolve, reject) => {
      socketService.socket.emit('send_message', messageData, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Message sync failed'));
        }
      });
    });
  }

  /**
   * Sync an API call
   */
  async syncApiCall(endpoint, method, data) {
    
    console.log('🔐 here i m AUTH: Adding Authorization header in fetchWithAuth and acessToken is -------------------------------',accessToken);
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getCurrentToken()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Sync a socket emit
   */
  async syncSocketEmit(data) {
    const { event, payload } = data;
    
    return new Promise((resolve, reject) => {
      socketService.socket.emit(event, payload, (response) => {
        if (response && !response.error) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Socket emit failed'));
        }
      });
    });
  }

  /**
   * Sync pending data
   */
  async syncPendingData() {
    if (!this.isOnline) return;
    
    try {
      // Get pending operations from IndexedDB
      if (this.config.enablePersistentStorage) {
        const queuedMessages = await indexedDBStorage.getQueuedMessages();
        this.syncQueue.push(...queuedMessages);
      }
      
      // Process queue
      await this.processSyncQueue();
      
      // Sync offline messages from the message service
      this.emit('pending_data_sync_requested');
      
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  }

  /**
   * Resolve data conflicts
   */
  resolveConflict(localData, serverData, strategy = 'latest_timestamp') {
    const resolver = this.conflictResolver.get(strategy);
    if (resolver) {
      this.stats.conflictsResolved++;
      return resolver(localData, serverData);
    }
    
    // Default to latest timestamp
    return this.conflictResolver.get('latest_timestamp')(localData, serverData);
  }

  /**
   * Start sync timer
   */
  startSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.state === OFFLINE_MODE_STATES.ONLINE) {
        this.processSyncQueue();
      }
    }, this.config.syncInterval);
  }

  /**
   * Clear sensitive data
   */
  async clearSensitiveData() {
    try {
      // Clear local data
      this.localData.clear();
      
      // Clear IndexedDB
      if (this.config.enablePersistentStorage) {
        await indexedDBStorage.clearAll();
      }
      
      // Clear sync queue
      this.syncQueue = [];
      
      console.log('🗑️ Sensitive offline data cleared');
    } catch (error) {
      console.error('Failed to clear sensitive data:', error);
    }
  }

  /**
   * Get offline mode statistics
   */
  getStats() {
    return {
      ...this.stats,
      state: this.state,
      isOnline: this.isOnline,
      queueSize: this.syncQueue.length,
      localDataSize: this.localData.size
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up service
   */
  cleanup() {
    // Clear timers
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (this.offlineTimer) {
      clearInterval(this.offlineTimer);
    }
    
    // Clear data
    this.localData.clear();
    this.syncQueue = [];
    this.conflictResolver.clear();
    
    // Remove listeners
    this.removeAllListeners();
    
    console.log('🧹 OfflineModeService cleaned up');
  }
}

// Create singleton instance
const offlineModeService = new OfflineModeService();

export default offlineModeService;