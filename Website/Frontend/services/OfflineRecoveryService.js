/**
 * Enhanced Error Recovery and Offline Handling Service
 * Comprehensive error recovery, offline mode handling, and automatic retry mechanisms
 */

import { EventEmitter } from 'events';
import socketService from './SocketService';
import authService from './AuthService';
import errorHandlingService, { ERROR_TYPES } from './ErrorHandlingService';
import notificationService from './NotificationService';
import cacheService from './CacheService';
import offlineModeService from './OfflineModeService';

/**
 * Connection States
 */
export const CONNECTION_STATES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RECONNECTING: 'reconnecting',
  DEGRADED: 'degraded',
  FAILED: 'failed'
};

/**
 * Recovery Strategies
 */
export const RECOVERY_STRATEGIES = {
  IMMEDIATE_RETRY: 'immediate_retry',
  EXPONENTIAL_BACKOFF: 'exponential_backoff',
  LINEAR_BACKOFF: 'linear_backoff',
  MANUAL: 'manual',
  DISABLE: 'disable'
};

/**
 * Error Categories
 */
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTH: 'auth',
  SERVER: 'server',
  CLIENT: 'client',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  VALIDATION: 'validation'
};

/**
 * Offline Actions
 */
export const OFFLINE_ACTIONS = {
  QUEUE: 'queue',
  CACHE: 'cache',
  DISCARD: 'discard',
  NOTIFY: 'notify'
};

/**
 * Recovery Events
 */
export const RECOVERY_EVENTS = {
  // Connection events
  CONNECTION_STATE_CHANGED: 'connection_state_changed',
  OFFLINE_MODE_ENABLED: 'offline_mode_enabled',
  ONLINE_MODE_RESTORED: 'online_mode_restored',
  
  // Recovery events
  RECOVERY_STARTED: 'recovery_started',
  RECOVERY_COMPLETED: 'recovery_completed',
  RECOVERY_FAILED: 'recovery_failed',
  
  // Retry events
  RETRY_STARTED: 'retry_started',
  RETRY_SUCCEEDED: 'retry_succeeded',
  RETRY_FAILED: 'retry_failed',
  RETRY_EXHAUSTED: 'retry_exhausted',
  
  // Queue events
  QUEUE_UPDATED: 'queue_updated',
  QUEUE_PROCESSED: 'queue_processed',
  QUEUE_CLEARED: 'queue_cleared',
  
  // Error events
  ERROR_RECOVERED: 'error_recovered',
  CRITICAL_ERROR: 'critical_error'
};

/**
 * Enhanced Error Recovery and Offline Handling Service Class
 */
class OfflineRecoveryService extends EventEmitter {
  constructor() {
    super();
    
    // Connection state management
    this.connectionState = CONNECTION_STATES.ONLINE;
    this.isOnline = navigator.onLine;
    this.lastOnlineTime = Date.now();
    this.connectionQuality = 'excellent';
    
    // Error tracking
    this.errorHistory = [];
    this.criticalErrors = new Set();
    this.recoveryAttempts = new Map(); // errorId -> attempt count
    this.maxErrorHistory = 1000;
    
    // Retry management
    this.retryQueues = new Map(); // strategy -> queue
    this.activeRetries = new Map(); // retryId -> retry info
    this.retryTimers = new Map(); // retryId -> timer
    
    // Offline queue management
    this.offlineQueue = [];
    this.queuedOperations = new Map(); // operationId -> operation
    this.queueProcessingTimer = null;
    this.maxOfflineQueueSize = 10000;
    
    // Recovery strategies
    this.recoveryStrategies = new Map(); // errorType -> strategy
    this.customRecoveryHandlers = new Map(); // errorType -> handler function
    
    // Configuration
    this.config = {
      // Retry settings
      maxRetryAttempts: 5,
      initialRetryDelay: 1000, // 1 second
      maxRetryDelay: 60000, // 1 minute
      retryMultiplier: 2,
      
      // Connection monitoring
      connectionCheckInterval: 5000, // 5 seconds
      connectionTimeout: 30000, // 30 seconds
      qualityCheckInterval: 10000, // 10 seconds
      
      // Offline handling
      offlineQueueProcessInterval: 2000, // 2 seconds
      offlineDataPersistence: true,
      offlineNotifications: true,
      
      // Error handling
      errorThrottleWindow: 5000, // 5 seconds
      criticalErrorThreshold: 10,
      autoRecovery: true,
      
      // Performance
      enableCompression: true,
      enableBatching: true,
      batchSize: 50,
      batchDelay: 500 // 500ms
    };
    
    // Performance metrics
    this.metrics = {
      totalErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      totalRetries: 0,
      successfulRetries: 0,
      offlineTime: 0,
      queuedOperations: 0,
      processedOperations: 0,
      averageRecoveryTime: 0
    };
    
    // State persistence
    this.persistentState = {
      offlineQueue: [],
      errorHistory: [],
      lastSyncTime: 0
    };
    
    // Timers
    this.connectionMonitorTimer = null;
    this.qualityMonitorTimer = null;
    this.errorThrottleTimer = null;
    
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  initializeService() {
    this.setupNetworkListeners();
    this.setupSocketListeners();
    this.setupAuthListeners();
    this.setupDefaultRecoveryStrategies();
    this.startConnectionMonitoring();
    this.loadPersistedState();
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

    // Monitor connection quality
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.updateConnectionQuality();
      });
    }
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    socketService.on('connected', () => {
      this.handleSocketConnected();
    });

    socketService.on('disconnected', () => {
      this.handleSocketDisconnected();
    });

    socketService.on('reconnected', () => {
      this.handleSocketReconnected();
    });

    socketService.on('error', (error) => {
      this.handleSocketError(error);
    });

    socketService.on('connection_error', (error) => {
      this.handleConnectionError(error);
    });
  }

  /**
   * Setup authentication listeners
   */
  setupAuthListeners() {
    authService.on('authStateChanged', (state) => {
      if (!state.isAuthenticated) {
        this.handleAuthenticationLost();
      } else {
        this.handleAuthenticationRestored(state.user);
      }
    });

    authService.on('tokenExpired', () => {
      this.handleTokenExpired();
    });

    authService.on('sessionExpired', () => {
      this.handleSessionExpired();
    });
  }

  /**
   * Setup default recovery strategies
   */
  setupDefaultRecoveryStrategies() {
    // Network errors - exponential backoff
    this.setRecoveryStrategy(ERROR_CATEGORIES.NETWORK, RECOVERY_STRATEGIES.EXPONENTIAL_BACKOFF);
    
    // Server errors - linear backoff
    this.setRecoveryStrategy(ERROR_CATEGORIES.SERVER, RECOVERY_STRATEGIES.LINEAR_BACKOFF);
    
    // Timeout errors - immediate retry
    this.setRecoveryStrategy(ERROR_CATEGORIES.TIMEOUT, RECOVERY_STRATEGIES.IMMEDIATE_RETRY);
    
    // Rate limit errors - exponential backoff with longer delays
    this.setRecoveryStrategy(ERROR_CATEGORIES.RATE_LIMIT, RECOVERY_STRATEGIES.EXPONENTIAL_BACKOFF);
    
    // Auth errors - manual intervention required
    this.setRecoveryStrategy(ERROR_CATEGORIES.AUTH, RECOVERY_STRATEGIES.MANUAL);
    
    // Client errors - disable retry (usually code bugs)
    this.setRecoveryStrategy(ERROR_CATEGORIES.CLIENT, RECOVERY_STRATEGIES.DISABLE);
    
    // Validation errors - disable retry
    this.setRecoveryStrategy(ERROR_CATEGORIES.VALIDATION, RECOVERY_STRATEGIES.DISABLE);
  }

  /**
   * Handle network online event
   */
  handleNetworkOnline() {
    console.log('🌐 Network connection restored');
    
    this.isOnline = true;
    this.lastOnlineTime = Date.now();
    
    // Calculate offline duration
    const offlineDuration = Date.now() - this.lastOnlineTime;
    this.metrics.offlineTime += offlineDuration;
    
    this.updateConnectionState(CONNECTION_STATES.ONLINE);
    
    // Process offline queue
    this.processOfflineQueue();
    
    // Retry failed operations
    this.retryFailedOperations();
    
    // Show recovery notification
    if (this.config.offlineNotifications) {
      notificationService.success(
        'Connection Restored',
        'Your internet connection has been restored. Syncing pending changes...'
      );
    }
    
    this.emit(RECOVERY_EVENTS.ONLINE_MODE_RESTORED, {
      offlineDuration,
      queuedOperations: this.offlineQueue.length
    });
  }

  /**
   * Handle network offline event
   */
  handleNetworkOffline() {
    console.log('📴 Network connection lost');
    
    this.isOnline = false;
    this.updateConnectionState(CONNECTION_STATES.OFFLINE);
    
    // Show offline notification
    if (this.config.offlineNotifications) {
      notificationService.info(
        'Offline Mode',
        'You are currently offline. Your actions will be saved and synced when connection is restored.',
        { persistent: true }
      );
    }
    
    this.emit(RECOVERY_EVENTS.OFFLINE_MODE_ENABLED, {
      timestamp: Date.now()
    });
  }

  /**
   * Handle socket connected
   */
  handleSocketConnected() {
    console.log('✅ Socket connection established');
    
    if (this.connectionState === CONNECTION_STATES.OFFLINE) {
      this.updateConnectionState(CONNECTION_STATES.ONLINE);
    }
    
    // Start processing queued operations
    this.processOfflineQueue();
  }

  /**
   * Handle socket disconnected
   */
  handleSocketDisconnected() {
    console.log('❌ Socket connection lost');
    
    this.updateConnectionState(CONNECTION_STATES.OFFLINE);
    
    // Start reconnection attempts
    this.startReconnectionProcess();
  }

  /**
   * Handle socket reconnected
   */
  handleSocketReconnected() {
    console.log('🔄 Socket reconnection successful');
    
    this.updateConnectionState(CONNECTION_STATES.ONLINE);
    
    // Process pending operations
    this.processOfflineQueue();
    
    // Show reconnection notification
    notificationService.success(
      'Reconnected',
      'Connection restored successfully.'
    );
  }

  /**
   * Handle socket error
   */
  handleSocketError(error) {
    console.error('🚨 Socket error:', error);
    
    const errorInfo = this.categorizeError(error);
    this.trackError(errorInfo);
    
    // Attempt recovery based on error type
    this.attemptErrorRecovery(errorInfo);
  }

  /**
   * Handle connection error
   */
  handleConnectionError(error) {
    console.error('🚨 Connection error:', error);
    
    this.updateConnectionState(CONNECTION_STATES.FAILED);
    
    const errorInfo = {
      type: ERROR_CATEGORIES.NETWORK,
      message: error.message || 'Connection failed',
      timestamp: Date.now(),
      category: ERROR_CATEGORIES.NETWORK,
      severity: 'high'
    };
    
    this.trackError(errorInfo);
    this.attemptErrorRecovery(errorInfo);
  }

  /**
   * Handle authentication lost
   */
  handleAuthenticationLost() {
    console.warn('🔒 Authentication lost');
    
    // Clear sensitive queued operations
    this.clearSensitiveOperations();
    
    // Show authentication required notification
    notificationService.warning(
      'Authentication Required',
      'Please log in again to continue using the application.',
      { persistent: true }
    );
  }

  /**
   * Handle authentication restored
   */
  handleAuthenticationRestored(user) {
    console.log('🔓 Authentication restored for user:', user.id);
    
    // Resume normal operations
    this.processOfflineQueue();
  }

  /**
   * Handle token expired
   */
  handleTokenExpired() {
    console.warn('🔑 Token expired');
    
    // Queue token refresh
    this.queueOperation({
      type: 'token_refresh',
      priority: 'high',
      timestamp: Date.now(),
      handler: () => authService.refreshAuth()
    });
  }

  /**
   * Handle session expired
   */
  handleSessionExpired() {
    console.warn('⏰ Session expired');
    
    // Clear all queued operations
    this.clearOfflineQueue();
    
    // Show session expired notification
    notificationService.error(
      'Session Expired',
      'Your session has expired. Please log in again.',
      { persistent: true }
    );
  }

  /**
   * Queue operation for offline processing
   */
  queueOperation(operation) {
    try {
      // Check queue size limit
      if (this.offlineQueue.length >= this.maxOfflineQueueSize) {
        console.warn('Offline queue is full, removing oldest operations');
        this.offlineQueue.shift();
      }
      
      // Add timestamp and ID if not present
      const queuedOperation = {
        id: operation.id || this.generateOperationId(),
        timestamp: operation.timestamp || Date.now(),
        retryCount: 0,
        ...operation
      };
      
      // Add to queue
      this.offlineQueue.push(queuedOperation);
      this.queuedOperations.set(queuedOperation.id, queuedOperation);
      
      // Persist queue if enabled
      if (this.config.offlineDataPersistence) {
        this.persistOfflineQueue();
      }
      
      this.metrics.queuedOperations++;
      
      this.emit(RECOVERY_EVENTS.QUEUE_UPDATED, {
        operation: queuedOperation,
        queueSize: this.offlineQueue.length
      });
      
      console.log(`📥 Operation queued: ${queuedOperation.type || queuedOperation.id}`);
      
      return queuedOperation.id;

    } catch (error) {
      console.error('Failed to queue operation:', error);
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.OFFLINE_QUEUE_FAILED,
          'Failed to queue operation for offline processing',
          { operation, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue() {
    if (!this.isOnline || !socketService.isConnected() || this.offlineQueue.length === 0) {
      return;
    }
    
    if (this.queueProcessingTimer) {
      clearTimeout(this.queueProcessingTimer);
    }
    
    console.log(`📤 Processing offline queue: ${this.offlineQueue.length} operations`);
    
    this.emit(RECOVERY_EVENTS.QUEUE_PROCESSED, {
      queueSize: this.offlineQueue.length
    });
    
    // Notify offline mode service about queue processing
    offlineModeService.emit('pending_data_sync_requested');
    
    const operations = [...this.offlineQueue];
    this.offlineQueue = [];
    
    // Process operations in batches
    const batchSize = this.config.enableBatching ? this.config.batchSize : 1;
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error('Failed to process operation batch:', error);
        
        // Re-queue failed operations
        batch.forEach(op => {
          op.retryCount = (op.retryCount || 0) + 1;
          if (op.retryCount < this.config.maxRetryAttempts) {
            this.queueOperation(op);
          } else {
            console.error('Operation exceeded retry limit:', op);
            this.trackFailedOperation(op, error);
          }
        });
      }
      
      // Small delay between batches to prevent overwhelming the server
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
      }
    }
    
    this.metrics.processedOperations += operations.length;
    
    // Persist updated queue
    if (this.config.offlineDataPersistence) {
      this.persistOfflineQueue();
    }
    
    // Notify offline mode service about completion
    offlineModeService.emit('sync_completed', {
      operationsSynced: operations.length
    });
  }

  /**
   * Process a batch of operations
   */
  async processBatch(operations) {
    const promises = operations.map(async (operation) => {
      try {
        if (operation.handler && typeof operation.handler === 'function') {
          await operation.handler();
        } else {
          // Default operation processing
          await this.processOperation(operation);
        }
        
        // Remove from queued operations map
        this.queuedOperations.delete(operation.id);
        
        console.log(`✅ Operation processed successfully: ${operation.type || operation.id}`);
        
      } catch (error) {
        console.error(`❌ Operation failed: ${operation.type || operation.id}`, error);
        throw error;
      }
    });
    
    return Promise.all(promises);
  }

  /**
   * Process individual operation
   */
  async processOperation(operation) {
    // This is a default implementation - specific services would override this
    switch (operation.type) {
      case 'token_refresh':
        return authService.refreshAuth();
      
      case 'api_call':
        return this.executeApiCall(operation);
      
      case 'socket_emit':
        return socketService.socket.emit(operation.event, operation.data);
      
      default:
        console.warn('Unknown operation type:', operation.type);
    }
  }

  /**
   * Execute API call operation
   */
  async executeApiCall(operation) {
    const { url, method, data, headers } = operation;
    
    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getCurrentToken()}`,
        ...headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Attempt error recovery
   */
  async attemptErrorRecovery(errorInfo) {
    const { category, id } = errorInfo;
    const strategy = this.getRecoveryStrategy(category);
    
    if (strategy === RECOVERY_STRATEGIES.DISABLE) {
      console.log('Recovery disabled for error category:', category);
      return false;
    }
    
    if (strategy === RECOVERY_STRATEGIES.MANUAL) {
      this.handleManualRecoveryRequired(errorInfo);
      return false;
    }
    
    const recoveryId = this.generateRecoveryId();
    
    this.emit(RECOVERY_EVENTS.RECOVERY_STARTED, {
      recoveryId,
      errorInfo,
      strategy
    });
    
    try {
      const success = await this.executeRecoveryStrategy(strategy, errorInfo, recoveryId);
      
      if (success) {
        this.metrics.recoveredErrors++;
        this.emit(RECOVERY_EVENTS.RECOVERY_COMPLETED, {
          recoveryId,
          errorInfo,
          strategy
        });
      } else {
        this.metrics.failedRecoveries++;
        this.emit(RECOVERY_EVENTS.RECOVERY_FAILED, {
          recoveryId,
          errorInfo,
          strategy
        });
      }
      
      return success;
      
    } catch (error) {
      console.error('Recovery attempt failed:', error);
      
      this.metrics.failedRecoveries++;
      this.emit(RECOVERY_EVENTS.RECOVERY_FAILED, {
        recoveryId,
        errorInfo,
        strategy,
        recoveryError: error
      });
      
      return false;
    }
  }

  /**
   * Execute recovery strategy
   */
  async executeRecoveryStrategy(strategy, errorInfo, recoveryId) {
    switch (strategy) {
      case RECOVERY_STRATEGIES.IMMEDIATE_RETRY:
        return this.immediateRetry(errorInfo, recoveryId);
      
      case RECOVERY_STRATEGIES.EXPONENTIAL_BACKOFF:
        return this.exponentialBackoffRetry(errorInfo, recoveryId);
      
      case RECOVERY_STRATEGIES.LINEAR_BACKOFF:
        return this.linearBackoffRetry(errorInfo, recoveryId);
      
      default:
        console.error('Unknown recovery strategy:', strategy);
        return false;
    }
  }

  /**
   * Immediate retry strategy
   */
  async immediateRetry(errorInfo, recoveryId) {
    const maxAttempts = this.config.maxRetryAttempts;
    const attemptCount = this.getRetryAttemptCount(errorInfo.id);
    
    if (attemptCount >= maxAttempts) {
      console.log('Max retry attempts reached for error:', errorInfo.id);
      this.emit(RECOVERY_EVENTS.RETRY_EXHAUSTED, { errorInfo, attemptCount });
      return false;
    }
    
    return this.executeRetry(errorInfo, recoveryId, 0); // No delay
  }

  /**
   * Exponential backoff retry strategy
   */
  async exponentialBackoffRetry(errorInfo, recoveryId) {
    const maxAttempts = this.config.maxRetryAttempts;
    const attemptCount = this.getRetryAttemptCount(errorInfo.id);
    
    if (attemptCount >= maxAttempts) {
      console.log('Max retry attempts reached for error:', errorInfo.id);
      this.emit(RECOVERY_EVENTS.RETRY_EXHAUSTED, { errorInfo, attemptCount });
      return false;
    }
    
    const delay = Math.min(
      this.config.initialRetryDelay * Math.pow(this.config.retryMultiplier, attemptCount),
      this.config.maxRetryDelay
    );
    
    return this.executeRetry(errorInfo, recoveryId, delay);
  }

  /**
   * Linear backoff retry strategy
   */
  async linearBackoffRetry(errorInfo, recoveryId) {
    const maxAttempts = this.config.maxRetryAttempts;
    const attemptCount = this.getRetryAttemptCount(errorInfo.id);
    
    if (attemptCount >= maxAttempts) {
      console.log('Max retry attempts reached for error:', errorInfo.id);
      this.emit(RECOVERY_EVENTS.RETRY_EXHAUSTED, { errorInfo, attemptCount });
      return false;
    }
    
    const delay = Math.min(
      this.config.initialRetryDelay + (this.config.initialRetryDelay * attemptCount),
      this.config.maxRetryDelay
    );
    
    return this.executeRetry(errorInfo, recoveryId, delay);
  }

  /**
   * Execute retry with delay
   */
  async executeRetry(errorInfo, recoveryId, delay) {
    return new Promise((resolve) => {
      const retryInfo = {
        errorInfo,
        recoveryId,
        delay,
        timestamp: Date.now(),
        attempt: this.incrementRetryAttempt(errorInfo.id)
      };
      
      this.activeRetries.set(recoveryId, retryInfo);
      
      this.emit(RECOVERY_EVENTS.RETRY_STARTED, retryInfo);
      
      const timer = setTimeout(async () => {
        try {
          // Execute the retry logic here
          // This would typically involve re-executing the failed operation
          const success = await this.performRetryOperation(errorInfo);
          
          if (success) {
            this.metrics.successfulRetries++;
            this.emit(RECOVERY_EVENTS.RETRY_SUCCEEDED, retryInfo);
          } else {
            this.emit(RECOVERY_EVENTS.RETRY_FAILED, retryInfo);
          }
          
          this.activeRetries.delete(recoveryId);
          this.retryTimers.delete(recoveryId);
          
          resolve(success);
          
        } catch (error) {
          console.error('Retry execution failed:', error);
          
          this.emit(RECOVERY_EVENTS.RETRY_FAILED, { ...retryInfo, error });
          this.activeRetries.delete(recoveryId);
          this.retryTimers.delete(recoveryId);
          
          resolve(false);
        }
      }, delay);
      
      this.retryTimers.set(recoveryId, timer);
      
      console.log(`⏳ Retry scheduled in ${delay}ms for error:`, errorInfo.id);
    });
  }

  /**
   * Perform retry operation
   */
  async performRetryOperation(errorInfo) {
    // This is a placeholder - specific implementations would handle actual retry logic
    // For example, re-establishing socket connection, retrying API calls, etc.
    
    switch (errorInfo.category) {
      case ERROR_CATEGORIES.NETWORK:
        return this.retryNetworkOperation(errorInfo);
      
      case ERROR_CATEGORIES.SERVER:
        return this.retryServerOperation(errorInfo);
      
      case ERROR_CATEGORIES.TIMEOUT:
        return this.retryTimeoutOperation(errorInfo);
      
      default:
        return false;
    }
  }

  /**
   * Retry network operation
   */
  async retryNetworkOperation(errorInfo) {
    // Check if connection is restored
    if (!this.isOnline) {
      return false;
    }
    
    // Try to reconnect socket if needed
    if (!socketService.isConnected()) {
      try {
        await socketService.connect();
        return true;
      } catch (error) {
        console.error('Socket reconnection failed:', error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Retry server operation
   */
  async retryServerOperation(errorInfo) {
    // For server errors, we might want to check server health first
    try {
      const healthCheck = await this.performHealthCheck();
      return healthCheck.healthy;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retry timeout operation
   */
  async retryTimeoutOperation(errorInfo) {
    // For timeout errors, we can usually retry immediately
    return this.isOnline && socketService.isConnected();
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    try {
      const response = await fetch('/api/health', {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${authService.getCurrentToken()}`
        }
      });
      
      return {
        healthy: response.ok,
        status: response.status,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Categorize error
   */
  categorizeError(error) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      category: ERROR_CATEGORIES.CLIENT,
      severity: 'medium'
    };
    
    // Categorize based on error type and message
    if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
      errorInfo.category = ERROR_CATEGORIES.NETWORK;
      errorInfo.severity = 'high';
    } else if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
      errorInfo.category = ERROR_CATEGORIES.TIMEOUT;
      errorInfo.severity = 'medium';
    } else if (error.status >= 500) {
      errorInfo.category = ERROR_CATEGORIES.SERVER;
      errorInfo.severity = 'high';
    } else if (error.status === 429) {
      errorInfo.category = ERROR_CATEGORIES.RATE_LIMIT;
      errorInfo.severity = 'medium';
    } else if (error.status === 401 || error.status === 403) {
      errorInfo.category = ERROR_CATEGORIES.AUTH;
      errorInfo.severity = 'high';
    } else if (error.status >= 400 && error.status < 500) {
      errorInfo.category = ERROR_CATEGORIES.VALIDATION;
      errorInfo.severity = 'low';
    }
    
    return errorInfo;
  }

  /**
   * Track error in history
   */
  trackError(errorInfo) {
    this.errorHistory.push(errorInfo);
    
    // Limit error history size
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
    
    this.metrics.totalErrors++;
    
    // Check for critical errors
    if (this.isCriticalError(errorInfo)) {
      this.criticalErrors.add(errorInfo.id);
      this.handleCriticalError(errorInfo);
    }
    
    // Persist error history
    this.persistErrorHistory();
  }

  /**
   * Check if error is critical
   */
  isCriticalError(errorInfo) {
    // Define criteria for critical errors
    return (
      errorInfo.severity === 'high' ||
      errorInfo.category === ERROR_CATEGORIES.AUTH ||
      this.getRecentErrorCount() > this.config.criticalErrorThreshold
    );
  }

  /**
   * Handle critical error
   */
  handleCriticalError(errorInfo) {
    console.error('🚨 Critical error detected:', errorInfo);
    
    this.emit(RECOVERY_EVENTS.CRITICAL_ERROR, { errorInfo });
    
    // Show critical error notification
    notificationService.error(
      'Critical Error',
      'A critical error has occurred. The application may not function properly.',
      { persistent: true }
    );
  }

  /**
   * Get recent error count
   */
  getRecentErrorCount() {
    const recentThreshold = Date.now() - this.config.errorThrottleWindow;
    return this.errorHistory.filter(error => error.timestamp > recentThreshold).length;
  }

  /**
   * Start connection monitoring
   */
  startConnectionMonitoring() {
    // Monitor connection state
    this.connectionMonitorTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, this.config.connectionCheckInterval);
    
    // Monitor connection quality
    this.qualityMonitorTimer = setInterval(() => {
      this.updateConnectionQuality();
    }, this.config.qualityCheckInterval);
  }

  /**
   * Check connection health
   */
  checkConnectionHealth() {
    if (!this.isOnline) {
      return;
    }
    
    // Ping test
    const startTime = Date.now();
    
    fetch('/ping', { 
      method: 'HEAD',
      timeout: this.config.connectionTimeout 
    })
    .then(response => {
      const latency = Date.now() - startTime;
      
      if (response.ok && latency < this.config.connectionTimeout) {
        if (this.connectionState === CONNECTION_STATES.DEGRADED) {
          this.updateConnectionState(CONNECTION_STATES.ONLINE);
        }
      } else {
        this.updateConnectionState(CONNECTION_STATES.DEGRADED);
      }
    })
    .catch(() => {
      this.updateConnectionState(CONNECTION_STATES.FAILED);
    });
  }

  /**
   * Update connection quality
   */
  updateConnectionQuality() {
    if ('connection' in navigator && navigator.connection) {
      const connection = navigator.connection;
      
      // Determine quality based on effective type
      switch (connection.effectiveType) {
        case '4g':
          this.connectionQuality = 'excellent';
          break;
        case '3g':
          this.connectionQuality = 'good';
          break;
        case '2g':
          this.connectionQuality = 'poor';
          break;
        default:
          this.connectionQuality = 'unknown';
      }
      
      console.log(`📶 Connection quality: ${this.connectionQuality}`);
    }
  }

  /**
   * Update connection state
   */
  updateConnectionState(newState) {
    if (this.connectionState === newState) {
      return;
    }
    
    const previousState = this.connectionState;
    this.connectionState = newState;
    
    console.log(`🔄 Connection state changed: ${previousState} → ${newState}`);
    
    this.emit(RECOVERY_EVENTS.CONNECTION_STATE_CHANGED, {
      previousState,
      currentState: newState,
      timestamp: Date.now()
    });
  }

  /**
   * Start reconnection process
   */
  startReconnectionProcess() {
    if (this.connectionState === CONNECTION_STATES.RECONNECTING) {
      return;
    }
    
    this.updateConnectionState(CONNECTION_STATES.RECONNECTING);
    
    // Use exponential backoff for reconnection attempts
    this.attemptErrorRecovery({
      id: 'socket_disconnection',
      category: ERROR_CATEGORIES.NETWORK,
      message: 'Socket connection lost',
      timestamp: Date.now()
    });
  }

  /**
   * Retry failed operations
   */
  retryFailedOperations() {
    // Get failed operations from error history
    const failedOperations = this.errorHistory
      .filter(error => error.category === ERROR_CATEGORIES.NETWORK)
      .slice(-10); // Only retry recent operations
    
    failedOperations.forEach(error => {
      this.attemptErrorRecovery(error);
    });
  }

  /**
   * Handle manual recovery required
   */
  handleManualRecoveryRequired(errorInfo) {
    console.warn('Manual recovery required for error:', errorInfo);
    
    // Show manual intervention notification
    notificationService.warning(
      'Manual Intervention Required',
      `An error occurred that requires manual intervention: ${errorInfo.message}`,
      { 
        persistent: true,
        actions: [
          {
            label: 'Retry',
            action: () => this.attemptErrorRecovery(errorInfo)
          },
          {
            label: 'Ignore',
            action: () => this.ignoreError(errorInfo.id)
          }
        ]
      }
    );
  }

  /**
   * Utility methods
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRecoveryId() {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRecoveryStrategy(category) {
    return this.recoveryStrategies.get(category) || RECOVERY_STRATEGIES.EXPONENTIAL_BACKOFF;
  }

  setRecoveryStrategy(category, strategy) {
    this.recoveryStrategies.set(category, strategy);
  }

  getRetryAttemptCount(errorId) {
    return this.recoveryAttempts.get(errorId) || 0;
  }

  incrementRetryAttempt(errorId) {
    const count = this.getRetryAttemptCount(errorId) + 1;
    this.recoveryAttempts.set(errorId, count);
    this.metrics.totalRetries++;
    return count;
  }

  ignoreError(errorId) {
    this.criticalErrors.delete(errorId);
    this.recoveryAttempts.delete(errorId);
  }

  clearSensitiveOperations() {
    // Remove operations that contain sensitive data when authentication is lost
    this.offlineQueue = this.offlineQueue.filter(op => !op.sensitive);
  }

  clearOfflineQueue() {
    this.offlineQueue = [];
    this.queuedOperations.clear();
    
    if (this.config.offlineDataPersistence) {
      this.persistOfflineQueue();
    }
    
    this.emit(RECOVERY_EVENTS.QUEUE_CLEARED);
  }

  trackFailedOperation(operation, error) {
    console.error('Operation failed permanently:', operation, error);
    
    // You could implement additional tracking here
    // such as sending to analytics or error reporting service
  }

  /**
   * Persistence methods
   */
  async persistOfflineQueue() {
    try {
      await cacheService.set('offline_queue', this.offlineQueue, {
        ttl: 24 * 60 * 60, // 24 hours
        tags: ['offline', 'recovery']
      });
    } catch (error) {
      console.warn('Failed to persist offline queue:', error);
    }
  }

  async persistErrorHistory() {
    try {
      // Only persist recent errors
      const recentErrors = this.errorHistory.slice(-100);
      
      await cacheService.set('error_history', recentErrors, {
        ttl: 7 * 24 * 60 * 60, // 7 days
        tags: ['errors', 'recovery']
      });
    } catch (error) {
      console.warn('Failed to persist error history:', error);
    }
  }

  async loadPersistedState() {
    try {
      // Load offline queue
      const offlineQueue = await cacheService.get('offline_queue');
      if (offlineQueue && Array.isArray(offlineQueue)) {
        this.offlineQueue = offlineQueue;
        offlineQueue.forEach(op => {
          this.queuedOperations.set(op.id, op);
        });
      }
      
      // Load error history
      const errorHistory = await cacheService.get('error_history');
      if (errorHistory && Array.isArray(errorHistory)) {
        this.errorHistory = errorHistory;
      }
      
      console.log(`📋 Loaded persisted state: ${this.offlineQueue.length} queued operations, ${this.errorHistory.length} error records`);
      
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  /**
   * Public API methods
   */
  getConnectionState() {
    return this.connectionState;
  }

  getConnectionQuality() {
    return this.connectionQuality;
  }

  getOfflineQueue() {
    return [...this.offlineQueue];
  }

  getErrorHistory() {
    return [...this.errorHistory];
  }

  getCriticalErrors() {
    return Array.from(this.criticalErrors);
  }

  getActiveRetries() {
    return Array.from(this.activeRetries.values());
  }

  isOffline() {
    return !this.isOnline || this.connectionState === CONNECTION_STATES.OFFLINE;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.metrics,
      connectionState: this.connectionState,
      connectionQuality: this.connectionQuality,
      queueSize: this.offlineQueue.length,
      errorHistorySize: this.errorHistory.length,
      criticalErrorCount: this.criticalErrors.size,
      activeRetryCount: this.activeRetries.size,
      isOnline: this.isOnline
    };
  }

  /**
   * Clean up service
   */
  cleanup() {
    // Clear timers
    if (this.connectionMonitorTimer) {
      clearInterval(this.connectionMonitorTimer);
    }
    if (this.qualityMonitorTimer) {
      clearInterval(this.qualityMonitorTimer);
    }
    if (this.queueProcessingTimer) {
      clearTimeout(this.queueProcessingTimer);
    }
    
    // Clear retry timers
    this.retryTimers.forEach(timer => clearTimeout(timer));
    this.retryTimers.clear();
    
    // Clear state
    this.offlineQueue = [];
    this.queuedOperations.clear();
    this.activeRetries.clear();
    this.criticalErrors.clear();
    
    // Remove listeners
    this.removeAllListeners();
    
    console.log('🧹 OfflineRecoveryService cleaned up');
  }
}

// Create singleton instance
const offlineRecoveryService = new OfflineRecoveryService();

export default offlineRecoveryService;