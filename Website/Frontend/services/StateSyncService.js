/**
 * Real-time State Synchronization Service
 * Manages optimistic updates, conflict resolution, and real-time data synchronization
 */

import { EventEmitter } from 'events';
import socketService from '@services/UnifiedSocketService'; // 🔧 FIX: Use UnifiedSocketService instead
import errorHandlingService, { ERROR_TYPES } from '@services/ErrorHandlingService';
import notificationService from '@services/NotificationService';
import cacheService from '@services/CacheService';

/**
 * Sync Operation Types
 */
export const SYNC_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PATCH: 'patch',
  BULK_UPDATE: 'bulk_update',
  REORDER: 'reorder'
};

/**
 * Sync States
 */
export const SYNC_STATES = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back'
};

/**
 * Conflict Resolution Strategies
 */
export const CONFLICT_STRATEGIES = {
  CLIENT_WINS: 'client_wins',
  SERVER_WINS: 'server_wins',
  MERGE: 'merge',
  MANUAL: 'manual',
  LATEST_TIMESTAMP: 'latest_timestamp'
};

/**
 * Entity Types
 */
export const ENTITY_TYPES = {
  MESSAGE: 'message',
  USER: 'user',
  CHAT: 'chat',
  CALL: 'call',
  FILE: 'file',
  NOTIFICATION: 'notification',
  SETTINGS: 'settings',
  CONTACT: 'contact'
};

/**
 * Sync Events
 */
export const SYNC_EVENTS = {
  // Operations
  OPERATION_QUEUED: 'operation_queued',
  OPERATION_STARTED: 'operation_started',
  OPERATION_COMPLETED: 'operation_completed',
  OPERATION_FAILED: 'operation_failed',
  
  // State changes
  STATE_CHANGED: 'state_changed',
  ENTITY_UPDATED: 'entity_updated',
  ENTITY_SYNCED: 'entity_synced',
  
  // Conflicts
  CONFLICT_DETECTED: 'conflict_detected',
  CONFLICT_RESOLVED: 'conflict_resolved',
  
  // Sync status
  SYNC_STATUS_CHANGED: 'sync_status_changed',
  BATCH_SYNC_COMPLETED: 'batch_sync_completed',
  
  // Rollbacks
  ROLLBACK_STARTED: 'rollback_started',
  ROLLBACK_COMPLETED: 'rollback_completed'
};

/**
 * Real-time State Synchronization Service Class
 */
class StateSyncService extends EventEmitter {
  constructor() {
    super();
    
    // Core state management
    this.entities = new Map(); // entityType:entityId -> entity data
    this.pendingOperations = new Map(); // operationId -> operation
    this.conflictQueue = new Map(); // entityKey -> conflict data
    this.rollbackHistory = new Map(); // operationId -> rollback data
    
    // Sync tracking
    this.syncStates = new Map(); // entityKey -> sync state
    this.lastSyncTimes = new Map(); // entityType -> timestamp
    this.entityVersions = new Map(); // entityKey -> version number
    this.operationSequence = 0;
    
    // Configuration
    this.config = {
      maxPendingOperations: 1000,
      maxRollbackHistory: 100,
      syncBatchSize: 50,
      syncInterval: 5000, // 5 seconds
      conflictRetryDelay: 2000,
      maxConflictRetries: 3,
      optimisticUpdates: true,
      autoResolveConflicts: true,
      compressionEnabled: true,
      validateOperations: true,
      enableMetrics: true
    };
    
    // Conflict resolution
    this.conflictStrategies = new Map(); // entityType -> strategy
    this.conflictResolvers = new Map(); // strategy -> resolver function
    this.manualConflicts = new Set(); // entityKeys requiring manual resolution
    
    // Batch operations
    this.batchQueue = [];
    this.batchTimer = null;
    this.isBatchSyncing = false;
    
    // Connection state
    this.isOnline = navigator.onLine;
    this.lastConnectionTime = Date.now();
    this.syncBacklog = [];
    
    // Performance metrics
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      rollbacks: 0,
      averageLatency: 0,
      batchSyncs: 0,
      dataTransferred: 0
    };
    
    // Timers
    this.syncTimer = null;
    this.conflictRetryTimer = null;
    
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  initializeService() {
    this.setupSocketListeners();
    this.setupAuthListeners();
    this.setupConflictResolvers();
    this.setupNetworkListeners();
    this.startSyncTimer();
    this.loadPersistedState();
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    // State synchronization events
    socketService.on('state_update', (data) => {
      this.handleRemoteStateUpdate(data);
    });

    socketService.on('operation_result', (data) => {
      this.handleOperationResult(data);
    });

    socketService.on('conflict_detected', (data) => {
      this.handleConflictDetected(data);
    });

    socketService.on('batch_sync_response', (data) => {
      this.handleBatchSyncResponse(data);
    });

    // Connection events
    socketService.on('connected', () => {
      this.handleConnectionEstablished();
    });

    socketService.on('disconnected', () => {
      this.handleConnectionLost();
    });

    socketService.on('reconnected', () => {
      this.handleReconnection();
    });
  }

  /**
   * Setup authentication listeners
   */
  setupAuthListeners() {
    authService.on('authStateChanged', (state) => {
      if (state.isAuthenticated) {
        this.handleUserAuthenticated(state.user);
      } else {
        this.handleUserLoggedOut();
      }
    });
  }

  /**
   * Setup conflict resolvers
   */
  setupConflictResolvers() {
    // Client wins strategy
    this.conflictResolvers.set(CONFLICT_STRATEGIES.CLIENT_WINS, (clientData, serverData) => {
      return { resolved: clientData, strategy: CONFLICT_STRATEGIES.CLIENT_WINS };
    });

    // Server wins strategy
    this.conflictResolvers.set(CONFLICT_STRATEGIES.SERVER_WINS, (clientData, serverData) => {
      return { resolved: serverData, strategy: CONFLICT_STRATEGIES.SERVER_WINS };
    });

    // Latest timestamp strategy
    this.conflictResolvers.set(CONFLICT_STRATEGIES.LATEST_TIMESTAMP, (clientData, serverData) => {
      const clientTime = new Date(clientData.updatedAt || clientData.timestamp || 0).getTime();
      const serverTime = new Date(serverData.updatedAt || serverData.timestamp || 0).getTime();
      
      return {
        resolved: clientTime >= serverTime ? clientData : serverData,
        strategy: CONFLICT_STRATEGIES.LATEST_TIMESTAMP
      };
    });

    // Merge strategy
    this.conflictResolvers.set(CONFLICT_STRATEGIES.MERGE, (clientData, serverData) => {
      const merged = this.mergeObjects(serverData, clientData);
      return { resolved: merged, strategy: CONFLICT_STRATEGIES.MERGE };
    });

    // Manual strategy
    this.conflictResolvers.set(CONFLICT_STRATEGIES.MANUAL, (clientData, serverData) => {
      return { resolved: null, strategy: CONFLICT_STRATEGIES.MANUAL, requiresManualResolution: true };
    });
  }

  /**
   * Setup network listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleNetworkOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleNetworkOffline();
    });
  }

  /**
   * Create or update an entity with optimistic updates
   */
  async syncEntity(entityType, entityId, data, options = {}) {
    try {
      const {
        operation = SYNC_OPERATIONS.UPDATE,
        optimistic = this.config.optimisticUpdates,
        conflictStrategy = this.getDefaultConflictStrategy(entityType),
        metadata = {}
      } = options;

      const operationId = this.generateOperationId();
      const entityKey = `${entityType}:${entityId}`;
      const timestamp = Date.now();

      // Create operation object
      const syncOperation = {
        id: operationId,
        type: operation,
        entityType,
        entityId,
        entityKey,
        data,
        originalData: this.getEntity(entityType, entityId),
        timestamp,
        state: SYNC_STATES.PENDING,
        conflictStrategy,
        metadata,
        retryCount: 0,
        version: this.getEntityVersion(entityKey) + 1
      };

      // Apply optimistic update
      if (optimistic) {
        this.applyOptimisticUpdate(syncOperation);
      }

      // Queue operation
      this.queueOperation(syncOperation);

      // Attempt immediate sync if online
      if (this.isOnline && socketService.isConnected()) {
        await this.executeOperation(syncOperation);
      }

      this.emit(SYNC_EVENTS.OPERATION_QUEUED, { operation: syncOperation });
      
      return operationId;

    } catch (error) {
      this.metrics.failedOperations++;
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_OPERATION_FAILED,
          'Failed to sync entity',
          { entityType, entityId, data, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Bulk sync multiple entities
   */
  async syncEntities(entities, options = {}) {
    try {
      const {
        batchSize = this.config.syncBatchSize,
        optimistic = this.config.optimisticUpdates
      } = options;

      const operationIds = [];
      const operations = [];

      // Create operations for all entities
      for (const entityData of entities) {
        const { entityType, entityId, data, operation = SYNC_OPERATIONS.UPDATE } = entityData;
        
        const operationId = await this.syncEntity(entityType, entityId, data, {
          operation,
          optimistic
        });
        
        operationIds.push(operationId);
        operations.push(this.pendingOperations.get(operationId));
      }

      // Process in batches if needed
      if (operations.length > batchSize) {
        for (let i = 0; i < operations.length; i += batchSize) {
          const batch = operations.slice(i, i + batchSize);
          this.queueBatch(batch);
        }
      } else {
        this.queueBatch(operations);
      }

      return operationIds;

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_BATCH_FAILED,
          'Failed to sync entities',
          { entities, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(entityType, entityId, options = {}) {
    return this.syncEntity(entityType, entityId, null, {
      ...options,
      operation: SYNC_OPERATIONS.DELETE
    });
  }

  /**
   * Apply optimistic update
   */
  applyOptimisticUpdate(operation) {
    const { entityType, entityId, data, type } = operation;
    const entityKey = `${entityType}:${entityId}`;
    
    try {
      switch (type) {
        case SYNC_OPERATIONS.CREATE:
        case SYNC_OPERATIONS.UPDATE:
          this.setEntity(entityType, entityId, data);
          break;
          
        case SYNC_OPERATIONS.PATCH:
          const existing = this.getEntity(entityType, entityId) || {};
          this.setEntity(entityType, entityId, { ...existing, ...data });
          break;
          
        case SYNC_OPERATIONS.DELETE:
          this.removeEntity(entityType, entityId);
          break;
      }

      // Update sync state
      this.syncStates.set(entityKey, SYNC_STATES.SYNCING);
      this.updateEntityVersion(entityKey);
      
      // Emit state change
      this.emit(SYNC_EVENTS.STATE_CHANGED, {
        entityType,
        entityId,
        data: this.getEntity(entityType, entityId),
        operation
      });

    } catch (error) {
      console.error('Failed to apply optimistic update:', error);
      throw error;
    }
  }

  /**
   * Queue an operation
   */
  queueOperation(operation) {
    // Check queue size limit
    if (this.pendingOperations.size >= this.config.maxPendingOperations) {
      const oldestOperations = Array.from(this.pendingOperations.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, Math.floor(this.config.maxPendingOperations * 0.1)); // Remove oldest 10%
      
      oldestOperations.forEach(op => {
        this.pendingOperations.delete(op.id);
      });
    }

    this.pendingOperations.set(operation.id, operation);
    this.metrics.totalOperations++;
  }

  /**
   * Queue batch operation
   */
  queueBatch(operations) {
    this.batchQueue.push(...operations);
    
    // Start batch processing if not already running
    if (!this.batchTimer && !this.isBatchSyncing) {
      this.batchTimer = setTimeout(() => {
        this.processBatchQueue();
      }, 100); // Small delay to accumulate more operations
    }
  }

  /**
   * Execute a sync operation
   */
  async executeOperation(operation) {
    try {
      const startTime = Date.now();
      operation.state = SYNC_STATES.SYNCING;
      
      this.emit(SYNC_EVENTS.OPERATION_STARTED, { operation });

      // Validate operation if enabled
      if (this.config.validateOperations) {
        this.validateOperation(operation);
      }

      // Prepare sync data
      const syncData = {
        operationId: operation.id,
        type: operation.type,
        entityType: operation.entityType,
        entityId: operation.entityId,
        data: operation.data,
        version: operation.version,
        timestamp: operation.timestamp,
        metadata: operation.metadata
      };

      // Send to server
      const result = await socketService.socket.emit('sync_operation', syncData);
      
      // Calculate latency
      const latency = Date.now() - startTime;
      this.updateLatencyMetrics(latency);

      return result;

    } catch (error) {
      operation.state = SYNC_STATES.FAILED;
      operation.error = error.message;
      
      this.emit(SYNC_EVENTS.OPERATION_FAILED, { operation, error });
      
      throw error;
    }
  }

  /**
   * Process batch queue
   */
  async processBatchQueue() {
    if (this.isBatchSyncing || this.batchQueue.length === 0) {
      return;
    }

    this.isBatchSyncing = true;
    this.batchTimer = null;

    try {
      const batch = this.batchQueue.splice(0, this.config.syncBatchSize);
      
      if (!this.isOnline || !socketService.isConnected()) {
        // Add back to queue if offline
        this.batchQueue.unshift(...batch);
        return;
      }

      console.log(`📦 Processing batch of ${batch.length} operations`);

      const batchData = {
        id: this.generateOperationId(),
        operations: batch.map(op => ({
          operationId: op.id,
          type: op.type,
          entityType: op.entityType,
          entityId: op.entityId,
          data: op.data,
          version: op.version,
          timestamp: op.timestamp
        })),
        compression: this.config.compressionEnabled
      };

      // Update operation states
      batch.forEach(op => {
        op.state = SYNC_STATES.SYNCING;
      });

      // Send batch to server
      socketService.socket.emit('batch_sync', batchData);
      
      this.metrics.batchSyncs++;

    } catch (error) {
      console.error('Batch processing failed:', error);
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_BATCH_FAILED,
          'Failed to process batch queue',
          { error }
        )
      );
      
    } finally {
      this.isBatchSyncing = false;
      
      // Continue processing if there are more items
      if (this.batchQueue.length > 0) {
        this.processBatchQueue();
      }
    }
  }

  /**
   * Handle remote state update
   */
  handleRemoteStateUpdate(data) {
    try {
      const { entityType, entityId, data: entityData, version, timestamp, source } = data;
      const entityKey = `${entityType}:${entityId}`;
      
      console.log(`🔄 Remote state update: ${entityKey}`);

      // Check if we have a newer local version (conflict detection)
      const localVersion = this.getEntityVersion(entityKey);
      const hasLocalChanges = this.hasUnsyncedChanges(entityKey);
      
      if (hasLocalChanges && version <= localVersion) {
        // Potential conflict
        this.handlePotentialConflict(entityType, entityId, entityData, version);
        return;
      }

      // Apply remote update
      this.setEntity(entityType, entityId, entityData);
      this.setEntityVersion(entityKey, version);
      this.syncStates.set(entityKey, SYNC_STATES.SYNCED);

      // Cache the update
      this.cacheEntity(entityType, entityId, entityData);

      this.emit(SYNC_EVENTS.ENTITY_UPDATED, {
        entityType,
        entityId,
        data: entityData,
        source: 'remote'
      });

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_UPDATE_FAILED,
          'Failed to handle remote state update',
          { data, error }
        )
      );
    }
  }

  /**
   * Handle operation result
   */
  handleOperationResult(data) {
    try {
      const { operationId, success, error, entityData, version, conflicts } = data;
      const operation = this.pendingOperations.get(operationId);
      
      if (!operation) {
        console.warn('Received result for unknown operation:', operationId);
        return;
      }

      if (success) {
        // Operation successful
        operation.state = SYNC_STATES.SYNCED;
        const entityKey = `${operation.entityType}:${operation.entityId}`;
        
        // Update entity with server data
        if (entityData) {
          this.setEntity(operation.entityType, operation.entityId, entityData);
        }
        
        // Update version and sync state
        if (version) {
          this.setEntityVersion(entityKey, version);
        }
        this.syncStates.set(entityKey, SYNC_STATES.SYNCED);
        
        // Remove from pending operations
        this.pendingOperations.delete(operationId);
        this.metrics.successfulOperations++;
        
        this.emit(SYNC_EVENTS.OPERATION_COMPLETED, { operation, result: entityData });
        this.emit(SYNC_EVENTS.ENTITY_SYNCED, {
          entityType: operation.entityType,
          entityId: operation.entityId,
          data: entityData
        });

      } else {
        // Operation failed
        operation.state = SYNC_STATES.FAILED;
        operation.error = error;
        this.metrics.failedOperations++;
        
        if (conflicts && conflicts.length > 0) {
          // Handle conflicts
          this.handleConflicts(operation, conflicts);
        } else {
          // Regular failure - attempt rollback
          await this.rollbackOperation(operation);
        }
        
        this.emit(SYNC_EVENTS.OPERATION_FAILED, { operation, error });
      }

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_RESULT_HANDLING_FAILED,
          'Failed to handle operation result',
          { data, error }
        )
      );
    }
  }

  /**
   * Handle conflict detected
   */
  handleConflictDetected(data) {
    try {
      const { entityType, entityId, clientData, serverData, version } = data;
      const entityKey = `${entityType}:${entityId}`;
      
      console.warn(`⚠️ Conflict detected for ${entityKey}`);
      
      this.metrics.conflictsDetected++;
      
      // Create conflict data
      const conflict = {
        entityType,
        entityId,
        entityKey,
        clientData,
        serverData,
        serverVersion: version,
        timestamp: Date.now(),
        resolved: false
      };

      // Add to conflict queue
      this.conflictQueue.set(entityKey, conflict);
      
      // Update sync state
      this.syncStates.set(entityKey, SYNC_STATES.CONFLICT);
      
      // Emit conflict event
      this.emit(SYNC_EVENTS.CONFLICT_DETECTED, { conflict });
      
      // Attempt automatic resolution
      if (this.config.autoResolveConflicts) {
        this.resolveConflict(entityKey);
      }

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CONFLICT_HANDLING_FAILED,
          'Failed to handle conflict detection',
          { data, error }
        )
      );
    }
  }

  /**
   * Handle batch sync response
   */
  handleBatchSyncResponse(data) {
    try {
      const { batchId, results, errors } = data;
      
      console.log(`📦 Batch sync response: ${results.length} results, ${errors.length} errors`);
      
      // Process successful results
      results.forEach(result => {
        this.handleOperationResult(result);
      });
      
      // Process errors
      errors.forEach(error => {
        console.error('Batch operation error:', error);
        this.handleOperationResult(error);
      });
      
      this.emit(SYNC_EVENTS.BATCH_SYNC_COMPLETED, {
        batchId,
        successCount: results.length,
        errorCount: errors.length
      });

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_BATCH_RESPONSE_FAILED,
          'Failed to handle batch sync response',
          { data, error }
        )
      );
    }
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(entityKey, manualResolution = null) {
    try {
      const conflict = this.conflictQueue.get(entityKey);
      if (!conflict || conflict.resolved) {
        return;
      }

      const { entityType, clientData, serverData } = conflict;
      const strategy = manualResolution?.strategy || this.getConflictStrategy(entityType);
      const resolver = this.conflictResolvers.get(strategy);
      
      if (!resolver) {
        throw new Error(`Unknown conflict strategy: ${strategy}`);
      }

      // Resolve conflict
      const resolution = manualResolution || resolver(clientData, serverData);
      
      if (resolution.requiresManualResolution) {
        // Add to manual conflicts queue
        this.manualConflicts.add(entityKey);
        this.emit(SYNC_EVENTS.CONFLICT_DETECTED, { 
          conflict: { ...conflict, requiresManual: true } 
        });
        return;
      }

      // Apply resolution
      if (resolution.resolved) {
        this.setEntity(entityType, conflict.entityId, resolution.resolved);
        
        // Re-sync with server
        await this.syncEntity(entityType, conflict.entityId, resolution.resolved, {
          operation: SYNC_OPERATIONS.UPDATE,
          optimistic: false // Don't apply optimistically since we're resolving a conflict
        });
      }

      // Mark conflict as resolved
      conflict.resolved = true;
      conflict.resolution = resolution;
      conflict.resolvedAt = Date.now();
      
      // Update sync state
      this.syncStates.set(entityKey, SYNC_STATES.SYNCED);
      
      // Remove from conflict queue
      this.conflictQueue.delete(entityKey);
      this.manualConflicts.delete(entityKey);
      
      this.metrics.conflictsResolved++;
      
      this.emit(SYNC_EVENTS.CONFLICT_RESOLVED, { 
        entityKey, 
        conflict, 
        resolution 
      });
      
      console.log(`✅ Conflict resolved for ${entityKey} using ${resolution.strategy}`);

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CONFLICT_RESOLUTION_FAILED,
          'Failed to resolve conflict',
          { entityKey, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Rollback operation
   */
  async rollbackOperation(operation) {
    try {
      const { entityType, entityId, originalData } = operation;
      const entityKey = `${entityType}:${entityId}`;
      
      console.log(`🔄 Rolling back operation: ${operation.id}`);
      
      this.emit(SYNC_EVENTS.ROLLBACK_STARTED, { operation });

      // Restore original data
      if (originalData !== undefined) {
        if (originalData === null) {
          this.removeEntity(entityType, entityId);
        } else {
          this.setEntity(entityType, entityId, originalData);
        }
      }

      // Update sync state
      this.syncStates.set(entityKey, SYNC_STATES.ROLLED_BACK);
      
      // Store rollback data for history
      const rollbackData = {
        operationId: operation.id,
        entityKey,
        rollbackTime: Date.now(),
        originalData,
        failedData: operation.data
      };
      
      this.rollbackHistory.set(operation.id, rollbackData);
      
      // Limit rollback history size
      if (this.rollbackHistory.size > this.config.maxRollbackHistory) {
        const oldestKey = this.rollbackHistory.keys().next().value;
        this.rollbackHistory.delete(oldestKey);
      }
      
      // Remove from pending operations
      this.pendingOperations.delete(operation.id);
      
      this.metrics.rollbacks++;
      
      this.emit(SYNC_EVENTS.ROLLBACK_COMPLETED, { operation, rollbackData });
      this.emit(SYNC_EVENTS.STATE_CHANGED, {
        entityType,
        entityId,
        data: originalData,
        operation: { ...operation, type: 'rollback' }
      });
      
      // Show user notification
      notificationService.warning(
        'Sync Failed',
        `Changes to ${entityType} could not be saved and have been reverted.`
      );

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.ROLLBACK_FAILED,
          'Failed to rollback operation',
          { operation, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Connection event handlers
   */
  handleConnectionEstablished() {
    this.lastConnectionTime = Date.now();
    console.log('✅ Connection established, starting sync...');
    
    // Process pending operations
    this.processPendingOperations();
    
    // Sync backlog
    this.processSyncBacklog();
  }

  handleConnectionLost() {
    console.log('❌ Connection lost, queuing operations...');
    
    // All pending operations will be queued until reconnection
  }

  handleReconnection() {
    console.log('🔄 Reconnected, syncing state...');
    
    // Sync missed updates
    this.syncMissedUpdates();
    
    // Process pending operations
    this.processPendingOperations();
  }

  handleNetworkOnline() {
    console.log('🌐 Network online');
    
    if (socketService.isConnected()) {
      this.processPendingOperations();
    }
  }

  handleNetworkOffline() {
    console.log('📴 Network offline');
    
    // Show offline notification
    notificationService.info(
      'Offline Mode',
      'You are currently offline. Changes will be synced when connection is restored.'
    );
  }

  handleUserAuthenticated(user) {
    console.log('👤 User authenticated, loading sync state...');
    
    // Load user-specific sync state
    this.loadUserSyncState(user.id);
  }

  handleUserLoggedOut() {
    console.log('👤 User logged out, clearing sync state...');
    
    // Clear all sync state
    this.clearSyncState();
  }

  /**
   * Process pending operations
   */
  async processPendingOperations() {
    try {
      if (!this.isOnline || !socketService.isConnected()) {
        return;
      }

      const pendingOps = Array.from(this.pendingOperations.values())
        .filter(op => op.state === SYNC_STATES.PENDING)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (pendingOps.length === 0) {
        return;
      }

      console.log(`📤 Processing ${pendingOps.length} pending operations`);

      // Process in batches
      for (let i = 0; i < pendingOps.length; i += this.config.syncBatchSize) {
        const batch = pendingOps.slice(i, i + this.config.syncBatchSize);
        
        try {
          await Promise.all(batch.map(op => this.executeOperation(op)));
        } catch (error) {
          console.error('Failed to process operation batch:', error);
        }
      }

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_PROCESSING_FAILED,
          'Failed to process pending operations',
          { error }
        )
      );
    }
  }

  /**
   * Sync missed updates since last connection
   */
  async syncMissedUpdates() {
    try {
      if (!authService.isAuthenticated() || !socketService.isConnected()) {
        return;
      }

      const lastSyncTime = Math.max(...Array.from(this.lastSyncTimes.values()), 0);
      
      if (lastSyncTime === 0) {
        return; // First time sync
      }

      console.log(`🔄 Syncing missed updates since ${new Date(lastSyncTime).toISOString()}`);

      // Request missed updates from server
      socketService.socket.emit('sync_missed_updates', {
        userId: authService.getCurrentUser().id,
        since: lastSyncTime,
        entityTypes: Array.from(this.lastSyncTimes.keys())
      });

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SYNC_MISSED_UPDATES_FAILED,
          'Failed to sync missed updates',
          { error }
        )
      );
    }
  }

  /**
   * Entity management methods
   */
  getEntity(entityType, entityId) {
    const entityKey = `${entityType}:${entityId}`;
    return this.entities.get(entityKey);
  }

  setEntity(entityType, entityId, data) {
    const entityKey = `${entityType}:${entityId}`;
    this.entities.set(entityKey, data);
    
    // Cache the entity
    this.cacheEntity(entityType, entityId, data);
  }

  removeEntity(entityType, entityId) {
    const entityKey = `${entityType}:${entityId}`;
    this.entities.delete(entityKey);
    this.syncStates.delete(entityKey);
    this.entityVersions.delete(entityKey);
    
    // Clear from cache
    cacheService.delete(`entity:${entityKey}`);
  }

  hasUnsyncedChanges(entityKey) {
    const state = this.syncStates.get(entityKey);
    return state === SYNC_STATES.PENDING || state === SYNC_STATES.SYNCING;
  }

  getEntityVersion(entityKey) {
    return this.entityVersions.get(entityKey) || 0;
  }

  setEntityVersion(entityKey, version) {
    this.entityVersions.set(entityKey, version);
  }

  updateEntityVersion(entityKey) {
    const currentVersion = this.getEntityVersion(entityKey);
    this.setEntityVersion(entityKey, currentVersion + 1);
  }

  /**
   * Utility methods
   */
  generateOperationId() {
    return `op_${Date.now()}_${++this.operationSequence}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDefaultConflictStrategy(entityType) {
    return this.conflictStrategies.get(entityType) || CONFLICT_STRATEGIES.LATEST_TIMESTAMP;
  }

  getConflictStrategy(entityType) {
    return this.conflictStrategies.get(entityType) || CONFLICT_STRATEGIES.LATEST_TIMESTAMP;
  }

  setConflictStrategy(entityType, strategy) {
    this.conflictStrategies.set(entityType, strategy);
  }

  validateOperation(operation) {
    if (!operation.entityType || !operation.entityId) {
      throw new Error('Invalid operation: missing entity type or ID');
    }
    
    if (!Object.values(SYNC_OPERATIONS).includes(operation.type)) {
      throw new Error(`Invalid operation type: ${operation.type}`);
    }
    
    return true;
  }

  mergeObjects(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.mergeObjects(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  updateLatencyMetrics(latency) {
    const currentAvg = this.metrics.averageLatency;
    const totalOps = this.metrics.totalOperations;
    
    this.metrics.averageLatency = ((currentAvg * (totalOps - 1)) + latency) / totalOps;
  }

  handlePotentialConflict(entityType, entityId, serverData, serverVersion) {
    const clientData = this.getEntity(entityType, entityId);
    
    this.handleConflictDetected({
      entityType,
      entityId,
      clientData,
      serverData,
      version: serverVersion
    });
  }

  processSyncBacklog() {
    if (this.syncBacklog.length === 0) return;
    
    console.log(`📋 Processing sync backlog: ${this.syncBacklog.length} items`);
    
    this.syncBacklog.forEach(item => {
      this.handleRemoteStateUpdate(item);
    });
    
    this.syncBacklog = [];
  }

  /**
   * Cache operations
   */
  async cacheEntity(entityType, entityId, data) {
    try {
      const entityKey = `${entityType}:${entityId}`;
      
      await cacheService.set(`entity:${entityKey}`, {
        type: entityType,
        id: entityId,
        data,
        version: this.getEntityVersion(entityKey),
        syncState: this.syncStates.get(entityKey),
        cachedAt: Date.now()
      }, {
        ttl: 24 * 60 * 60, // 24 hours
        tags: ['entity', entityType, `user:${authService.getCurrentUser()?.id}`]
      });
      
    } catch (error) {
      console.warn('Failed to cache entity:', error);
    }
  }

  async loadPersistedState() {
    try {
      console.log('📋 Loading persisted sync state...');
      
      // Load from cache if user is authenticated
      const userId = authService.getCurrentUser()?.id;
      if (!userId) return;
      
      // This would load cached entities and sync state
      // Implementation depends on cache service capabilities
      
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  async loadUserSyncState(userId) {
    try {
      // Load user-specific sync state from cache
      const syncState = await cacheService.get(`sync_state:${userId}`);
      
      if (syncState) {
        // Restore sync state
        this.lastSyncTimes = new Map(syncState.lastSyncTimes || []);
        this.conflictStrategies = new Map(syncState.conflictStrategies || []);
      }
      
    } catch (error) {
      console.warn('Failed to load user sync state:', error);
    }
  }

  clearSyncState() {
    this.entities.clear();
    this.pendingOperations.clear();
    this.conflictQueue.clear();
    this.rollbackHistory.clear();
    this.syncStates.clear();
    this.lastSyncTimes.clear();
    this.entityVersions.clear();
    this.manualConflicts.clear();
    this.syncBacklog = [];
    this.batchQueue = [];
  }

  startSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      if (this.isOnline && socketService.isConnected()) {
        this.processPendingOperations();
      }
    }, this.config.syncInterval);
  }

  /**
   * Public API methods
   */
  getEntitySyncState(entityType, entityId) {
    const entityKey = `${entityType}:${entityId}`;
    return this.syncStates.get(entityKey) || SYNC_STATES.SYNCED;
  }

  getPendingOperations() {
    return Array.from(this.pendingOperations.values());
  }

  getConflicts() {
    return Array.from(this.conflictQueue.values());
  }

  getManualConflicts() {
    return Array.from(this.manualConflicts).map(entityKey => 
      this.conflictQueue.get(entityKey)
    ).filter(Boolean);
  }

  getRollbackHistory() {
    return Array.from(this.rollbackHistory.values());
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.metrics,
      entitiesInMemory: this.entities.size,
      pendingOperations: this.pendingOperations.size,
      conflicts: this.conflictQueue.size,
      manualConflicts: this.manualConflicts.size,
      batchQueueSize: this.batchQueue.length,
      rollbackHistorySize: this.rollbackHistory.size,
      isOnline: this.isOnline,
      isBatchSyncing: this.isBatchSyncing
    };
  }

  /**
   * Clean up service
   */
  cleanup() {
    // Clear timers
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    if (this.conflictRetryTimer) {
      clearTimeout(this.conflictRetryTimer);
    }
    
    // Clear state
    this.clearSyncState();
    
    // Remove listeners
    this.removeAllListeners();
    
    console.log('🧹 StateSyncService cleaned up');
  }
}

// Create singleton instance
const stateSyncService = new StateSyncService();

export default stateSyncService;