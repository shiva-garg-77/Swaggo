/**
 * Standardized Error Handling Service
 * Unified error handling across frontend with consistent error types, codes, and recovery strategies
 */

import { EventEmitter } from 'events';
import notificationService from './NotificationService.js';

/**
 * Unified Error Types and Codes (matching backend)
 */
export const ERROR_TYPES = {
  // Authentication & Authorization
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_USER_INPUT: 'BAD_USER_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_VALUE: 'INVALID_VALUE',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Operations
  OPERATION_FAILED: 'OPERATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Network and API
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Client-side
  JAVASCRIPT_ERROR: 'JAVASCRIPT_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  BROWSER_COMPATIBILITY_ERROR: 'BROWSER_COMPATIBILITY_ERROR',
  FEATURE_NOT_SUPPORTED: 'FEATURE_NOT_SUPPORTED',

  // File and Upload
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_SIZE_ERROR: 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR: 'FILE_TYPE_ERROR',
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',

  // WebRTC and Media
  WEBRTC_CONNECTION_FAILED: 'WEBRTC_CONNECTION_FAILED',
  WEBRTC_MEDIA_ACCESS_DENIED: 'WEBRTC_MEDIA_ACCESS_DENIED',
  WEBRTC_PEER_CONNECTION_ERROR: 'WEBRTC_PEER_CONNECTION_ERROR',
  WEBRTC_SIGNALING_ERROR: 'WEBRTC_SIGNALING_ERROR',

  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',

  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR'
};

export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const RECOVERY_ACTIONS = {
  RETRY: 'retry',
  REFRESH_TOKEN: 'refresh_token',
  REDIRECT_LOGIN: 'redirect_login',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  USER_ACTION_REQUIRED: 'user_action_required',
  RESTART_SERVICE: 'restart_service',
  RELOAD_PAGE: 'reload_page',
  NONE: 'none'
};

/**
 * Standardized Error Class (matching backend)
 */
export class AppError extends Error {
  constructor(type, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.id = this.generateErrorId();
    this.severity = this.determineSeverity(type);
    this.recoveryActions = this.getRecoveryActions(type);
    this.userMessage = this.generateUserMessage(type, message, details);
    this.technicalMessage = message;
    this.stack = (new Error()).stack;
    this.context = this.captureContext();
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  determineSeverity(type) {
    const severityMap = {
      [ERROR_TYPES.UNAUTHENTICATED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.UNAUTHORIZED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.TOKEN_EXPIRED]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.INVALID_CREDENTIALS]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.VALIDATION_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.BAD_USER_INPUT]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.MISSING_REQUIRED_FIELD]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.INVALID_FORMAT]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.INVALID_VALUE]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.NOT_FOUND]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.ALREADY_EXISTS]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.RESOURCE_CONFLICT]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.OPERATION_FAILED]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.PERMISSION_DENIED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.QUOTA_EXCEEDED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.RATE_LIMITED]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.TOO_MANY_REQUESTS]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.NETWORK_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.API_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.TIMEOUT_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.SERVER_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.INTERNAL_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.SERVICE_UNAVAILABLE]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.DATABASE_ERROR]: ERROR_SEVERITY.CRITICAL,
      [ERROR_TYPES.CACHE_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.STORAGE_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.JAVASCRIPT_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.MEMORY_ERROR]: ERROR_SEVERITY.CRITICAL,
      [ERROR_TYPES.BROWSER_COMPATIBILITY_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.FEATURE_NOT_SUPPORTED]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.FILE_SIZE_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.FILE_TYPE_ERROR]: ERROR_SEVERITY.LOW,
      [ERROR_TYPES.FILE_PROCESSING_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.WEBRTC_CONNECTION_FAILED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.WEBRTC_MEDIA_ACCESS_DENIED]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.WEBRTC_PEER_CONNECTION_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.WEBRTC_SIGNALING_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.BUSINESS_RULE_VIOLATION]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.CONCURRENT_MODIFICATION]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.UNKNOWN_ERROR]: ERROR_SEVERITY.MEDIUM,
      [ERROR_TYPES.CONFIGURATION_ERROR]: ERROR_SEVERITY.HIGH,
      [ERROR_TYPES.DEPENDENCY_ERROR]: ERROR_SEVERITY.HIGH
    };
    
    return severityMap[type] || ERROR_SEVERITY.MEDIUM;
  }

  getRecoveryActions(type) {
    const recoveryMap = {
      [ERROR_TYPES.UNAUTHENTICATED]: [RECOVERY_ACTIONS.REDIRECT_LOGIN],
      [ERROR_TYPES.UNAUTHORIZED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.TOKEN_EXPIRED]: [RECOVERY_ACTIONS.REFRESH_TOKEN],
      [ERROR_TYPES.INVALID_CREDENTIALS]: [RECOVERY_ACTIONS.REDIRECT_LOGIN],
      [ERROR_TYPES.VALIDATION_ERROR]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.BAD_USER_INPUT]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.MISSING_REQUIRED_FIELD]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.INVALID_FORMAT]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.INVALID_VALUE]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.NOT_FOUND]: [RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.ALREADY_EXISTS]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.RESOURCE_CONFLICT]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.OPERATION_FAILED]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.PERMISSION_DENIED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.QUOTA_EXCEEDED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.RATE_LIMITED]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.TOO_MANY_REQUESTS]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.NETWORK_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.API_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.TIMEOUT_ERROR]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.SERVER_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.INTERNAL_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.SERVICE_UNAVAILABLE]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.DATABASE_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.CACHE_ERROR]: [RECOVERY_ACTIONS.IGNORE, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.STORAGE_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.JAVASCRIPT_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.MEMORY_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE],
      [ERROR_TYPES.BROWSER_COMPATIBILITY_ERROR]: [RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.FEATURE_NOT_SUPPORTED]: [RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.FILE_SIZE_ERROR]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.FILE_TYPE_ERROR]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.FILE_PROCESSING_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.WEBRTC_CONNECTION_FAILED]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.RESTART_SERVICE],
      [ERROR_TYPES.WEBRTC_MEDIA_ACCESS_DENIED]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.WEBRTC_PEER_CONNECTION_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.RESTART_SERVICE],
      [ERROR_TYPES.WEBRTC_SIGNALING_ERROR]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.BUSINESS_RULE_VIOLATION]: [RECOVERY_ACTIONS.USER_ACTION_REQUIRED],
      [ERROR_TYPES.CONCURRENT_MODIFICATION]: [RECOVERY_ACTIONS.RETRY],
      [ERROR_TYPES.UNKNOWN_ERROR]: [RECOVERY_ACTIONS.RETRY, RECOVERY_ACTIONS.FALLBACK],
      [ERROR_TYPES.CONFIGURATION_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE],
      [ERROR_TYPES.DEPENDENCY_ERROR]: [RECOVERY_ACTIONS.RELOAD_PAGE, RECOVERY_ACTIONS.FALLBACK]
    };
    
    return recoveryMap[type] || [RECOVERY_ACTIONS.NONE];
  }

  generateUserMessage(type, technicalMessage, details) {
    const userMessages = {
      [ERROR_TYPES.UNAUTHENTICATED]: 'Please log in to continue.',
      [ERROR_TYPES.UNAUTHORIZED]: 'You don\'t have permission to perform this action.',
      [ERROR_TYPES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
      [ERROR_TYPES.INVALID_CREDENTIALS]: 'Invalid username or password.',
      [ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ERROR_TYPES.BAD_USER_INPUT]: 'Invalid input. Please check your entry.',
      [ERROR_TYPES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
      [ERROR_TYPES.INVALID_FORMAT]: 'Invalid format. Please check your entry.',
      [ERROR_TYPES.INVALID_VALUE]: 'Invalid value. Please check your entry.',
      [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
      [ERROR_TYPES.ALREADY_EXISTS]: 'This item already exists.',
      [ERROR_TYPES.RESOURCE_CONFLICT]: 'Resource conflict. Please resolve and try again.',
      [ERROR_TYPES.OPERATION_FAILED]: 'Operation failed. Please try again.',
      [ERROR_TYPES.PERMISSION_DENIED]: 'You don\'t have permission to access this resource.',
      [ERROR_TYPES.QUOTA_EXCEEDED]: 'Usage limit exceeded. Please upgrade or try later.',
      [ERROR_TYPES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
      [ERROR_TYPES.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',
      [ERROR_TYPES.NETWORK_ERROR]: 'Connection problem. Please check your internet connection.',
      [ERROR_TYPES.API_ERROR]: 'Service temporarily unavailable. Please try again.',
      [ERROR_TYPES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [ERROR_TYPES.SERVER_ERROR]: 'Server error. Please try again later.',
      [ERROR_TYPES.INTERNAL_ERROR]: 'Internal server error. Please try again later.',
      [ERROR_TYPES.SERVICE_UNAVAILABLE]: 'Service unavailable. Please try again later.',
      [ERROR_TYPES.DATABASE_ERROR]: 'Data access error. Please try again later.',
      [ERROR_TYPES.CACHE_ERROR]: 'Cache error. The system will continue to work normally.',
      [ERROR_TYPES.STORAGE_ERROR]: 'Storage error. Please try again or contact support.',
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: 'External service unavailable. Please try again later.',
      [ERROR_TYPES.JAVASCRIPT_ERROR]: 'Application error. Please refresh the page.',
      [ERROR_TYPES.MEMORY_ERROR]: 'Memory error. Please refresh the page.',
      [ERROR_TYPES.BROWSER_COMPATIBILITY_ERROR]: 'Your browser doesn\'t support this feature.',
      [ERROR_TYPES.FEATURE_NOT_SUPPORTED]: 'Feature not available in your current environment.',
      [ERROR_TYPES.FILE_UPLOAD_ERROR]: 'File upload failed. Please try again.',
      [ERROR_TYPES.FILE_SIZE_ERROR]: 'File is too large. Please choose a smaller file.',
      [ERROR_TYPES.FILE_TYPE_ERROR]: 'File type not supported. Please choose a different file.',
      [ERROR_TYPES.FILE_PROCESSING_ERROR]: 'Error processing file. Please try again.',
      [ERROR_TYPES.WEBRTC_CONNECTION_FAILED]: 'Failed to establish connection. Please try again.',
      [ERROR_TYPES.WEBRTC_MEDIA_ACCESS_DENIED]: 'Camera/microphone access denied. Please allow permissions.',
      [ERROR_TYPES.WEBRTC_PEER_CONNECTION_ERROR]: 'Connection to peer failed. Please try again.',
      [ERROR_TYPES.WEBRTC_SIGNALING_ERROR]: 'Communication error. Please refresh and try again.',
      [ERROR_TYPES.BUSINESS_RULE_VIOLATION]: 'Operation not allowed. Please check the requirements.',
      [ERROR_TYPES.CONCURRENT_MODIFICATION]: 'Resource was modified by another user. Please refresh and try again.',
      [ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [ERROR_TYPES.CONFIGURATION_ERROR]: 'Configuration error. Please refresh the page.',
      [ERROR_TYPES.DEPENDENCY_ERROR]: 'Service dependency error. Please refresh the page.'
    };
    
    return userMessages[type] || technicalMessage || 'An error occurred. Please try again.';
  }

  captureContext() {
    try {
      return {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: this.timestamp,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null,
        memory: typeof performance !== 'undefined' && performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        } : null
      };
    } catch (error) {
      return {};
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      message: this.message,
      technicalMessage: this.technicalMessage,
      userMessage: this.userMessage,
      details: this.details,
      severity: this.severity,
      recoveryActions: this.recoveryActions,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Standardized Error Handling Service Class
 */
class StandardizedErrorHandlingService extends EventEmitter {
  constructor() {
    super();
    
    // Error storage and tracking
    this.errors = new Map(); // errorId -> error
    this.errorQueue = [];
    this.maxErrors = 1000;
    
    // Recovery mechanisms
    this.retryAttempts = new Map(); // errorId -> attempts
    this.maxRetryAttempts = 3;
    this.retryDelays = [1000, 2000, 5000]; // Progressive delays
    
    // Statistics
    this.stats = {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      recoveredErrors: 0,
      unrecoveredErrors: 0
    };
    
    // Configuration
    this.config = {
      enableNotifications: true,
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      enableAutoRecovery: true,
      notificationTimeout: 5000,
      reportingEndpoint: '/api/errors/report',
      maxReportBatchSize: 10
    };
    
    // Reporting queue
    this.reportQueue = [];
    this.reportBatchTimer = null;
    
    // Initialize service
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  initializeService() {
    // Setup global error handlers
    this.setupGlobalErrorHandlers();
    
    // Start error reporting batch processor
    this.startReportingBatchProcessor();
    
    // Setup periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;
    
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(new AppError(
        ERROR_TYPES.JAVASCRIPT_ERROR,
        event.message || 'Unhandled JavaScript error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      ));
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new AppError(
        ERROR_TYPES.JAVASCRIPT_ERROR,
        'Unhandled promise rejection',
        {
          reason: event.reason,
          promise: event.promise
        }
      ));
      event.preventDefault();
    });
    
    // Handle network errors
    window.addEventListener('offline', () => {
      this.handleError(new AppError(
        ERROR_TYPES.NETWORK_ERROR,
        'Network connection lost',
        { networkStatus: 'offline' }
      ));
    });
    
    window.addEventListener('online', () => {
      this.emit('networkRestored');
    });
  }

  /**
   * Create standardized error
   */
  createError(type, message, details = {}) {
    return new AppError(type, message, details);
  }

  /**
   * Handle error with full processing
   */
  async handleError(error, context = {}) {
    try {
      // Convert to AppError if needed
      if (!(error instanceof AppError)) {
        error = this.convertToAppError(error);
      }
      
      // Add context
      error.details = { ...error.details, ...context };
      
      // Store error
      this.storeError(error);
      
      // Update statistics
      this.updateStats(error);
      
      // Log error
      this.logError(error);
      
      // Show notification
      if (this.config.enableNotifications) {
        this.showNotification(error);
      }
      
      // Attempt recovery
      if (this.config.enableAutoRecovery) {
        await this.attemptRecovery(error);
      }
      
      // Queue for reporting
      this.queueForReporting(error);
      
      // Emit error event
      this.emit('error', error);
      
      return error;
      
    } catch (processingError) {
      console.error('Error in error handling:', processingError);
      return error;
    }
  }

  /**
   * Convert generic error to AppError
   */
  convertToAppError(error) {
    if (error instanceof AppError) return error;
    
    // Try to determine error type from error properties
    let type = ERROR_TYPES.UNKNOWN_ERROR;
    let details = {};
    
    if (error.name === 'TypeError') {
      type = ERROR_TYPES.JAVASCRIPT_ERROR;
    } else if (error.name === 'NetworkError' || error.message.includes('network')) {
      type = ERROR_TYPES.NETWORK_ERROR;
    } else if (error.name === 'ValidationError') {
      type = ERROR_TYPES.VALIDATION_ERROR;
    } else if (error.status) {
      // HTTP errors
      if (error.status === 401) type = ERROR_TYPES.UNAUTHENTICATED;
      else if (error.status === 403) type = ERROR_TYPES.UNAUTHORIZED;
      else if (error.status === 404) type = ERROR_TYPES.NOT_FOUND;
      else if (error.status >= 400 && error.status < 500) type = ERROR_TYPES.API_ERROR;
      else if (error.status >= 500) type = ERROR_TYPES.SERVER_ERROR;
      
      details.status = error.status;
      details.statusText = error.statusText;
    }
    
    return new AppError(type, error.message || 'Unknown error', {
      ...details,
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }

  /**
   * Store error in memory
   */
  storeError(error) {
    this.errors.set(error.id, error);
    this.errorQueue.push(error.id);
    
    // Maintain max errors limit
    if (this.errors.size > this.maxErrors) {
      const oldestId = this.errorQueue.shift();
      this.errors.delete(oldestId);
      this.retryAttempts.delete(oldestId);
    }
  }

  /**
   * Update statistics
   */
  updateStats(error) {
    this.stats.totalErrors++;
    
    // Count by type
    if (!this.stats.errorsByType[error.type]) {
      this.stats.errorsByType[error.type] = 0;
    }
    this.stats.errorsByType[error.type]++;
    
    // Count by severity
    if (!this.stats.errorsBySeverity[error.severity]) {
      this.stats.errorsBySeverity[error.severity] = 0;
    }
    this.stats.errorsBySeverity[error.severity]++;
  }

  /**
   * Log error to console
   */
  logError(error) {
    if (!this.config.enableConsoleLogging) return;
    
    const logMethod = error.severity === ERROR_SEVERITY.CRITICAL ? 'error' :
                     error.severity === ERROR_SEVERITY.HIGH ? 'error' :
                     error.severity === ERROR_SEVERITY.MEDIUM ? 'warn' : 'info';
    
    console[logMethod](`[${error.severity.toUpperCase()}] ${error.type}:`, {
      message: error.technicalMessage,
      details: error.details,
      id: error.id,
      timestamp: error.timestamp,
      context: error.context
    });
  }

  /**
   * Show user notification
   */
  showNotification(error) {
    // Don't show notifications for low severity errors
    if (error.severity === ERROR_SEVERITY.LOW) return;
    
    const notificationType = error.severity === ERROR_SEVERITY.CRITICAL ? 'error' :
                           error.severity === ERROR_SEVERITY.HIGH ? 'error' :
                           error.severity === ERROR_SEVERITY.MEDIUM ? 'warning' : 'info';
    
    notificationService.show({
      type: notificationType,
      title: 'Error',
      message: error.userMessage,
      timeout: this.config.notificationTimeout,
      actions: this.getNotificationActions(error)
    });
  }

  /**
   * Get notification actions based on recovery options
   */
  getNotificationActions(error) {
    const actions = [];
    
    if (error.recoveryActions.includes(RECOVERY_ACTIONS.RETRY)) {
      actions.push({
        label: 'Retry',
        action: () => this.retryError(error.id)
      });
    }
    
    if (error.recoveryActions.includes(RECOVERY_ACTIONS.RELOAD_PAGE)) {
      actions.push({
        label: 'Reload Page',
        action: () => window.location.reload()
      });
    }
    
    if (error.recoveryActions.includes(RECOVERY_ACTIONS.REDIRECT_LOGIN)) {
      actions.push({
        label: 'Login',
        action: () => this.redirectToLogin()
      });
    }
    
    return actions;
  }

  /**
   * Attempt automatic error recovery
   */
  async attemptRecovery(error) {
    try {
      const primaryAction = error.recoveryActions[0];
      if (!primaryAction || primaryAction === RECOVERY_ACTIONS.NONE) return false;
      
      switch (primaryAction) {
        case RECOVERY_ACTIONS.RETRY:
          return await this.retryError(error.id);
          
        case RECOVERY_ACTIONS.REFRESH_TOKEN:
          return await this.refreshAuthToken();
          
        case RECOVERY_ACTIONS.FALLBACK:
          return await this.executeFallback(error);
          
        case RECOVERY_ACTIONS.IGNORE:
          return true;
          
        case RECOVERY_ACTIONS.RESTART_SERVICE:
          return await this.restartService(error);
          
        default:
          return false;
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      return false;
    }
  }

  /**
   * Retry error with exponential backoff
   */
  async retryError(errorId) {
    const error = this.errors.get(errorId);
    if (!error) return false;
    
    const attempts = this.retryAttempts.get(errorId) || 0;
    if (attempts >= this.maxRetryAttempts) {
      this.stats.unrecoveredErrors++;
      return false;
    }
    
    const delay = this.retryDelays[attempts] || this.retryDelays[this.retryDelays.length - 1];
    
    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Increment retry count
    this.retryAttempts.set(errorId, attempts + 1);
    
    try {
      // Emit retry event so components can handle the retry
      this.emit('retry', { error, attempt: attempts + 1 });
      
      // If no specific retry handler, assume success
      this.stats.recoveredErrors++;
      this.emit('recovered', error);
      return true;
      
    } catch (retryError) {
      // Retry failed, try again
      return await this.retryError(errorId);
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken() {
    try {
      this.emit('refreshToken');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute fallback mechanism
   */
  async executeFallback(error) {
    try {
      this.emit('fallback', error);
      return true;
    } catch (fallbackError) {
      return false;
    }
  }

  /**
   * Restart service
   */
  async restartService(error) {
    try {
      this.emit('restartService', error);
      return true;
    } catch (restartError) {
      return false;
    }
  }

  /**
   * Redirect to login
   */
  redirectToLogin() {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Queue error for reporting
   */
  queueForReporting(error) {
    if (!this.config.enableRemoteLogging) return;
    
    this.reportQueue.push(error.toJSON());
    
    // Trigger immediate reporting for critical errors
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      this.flushReportQueue();
    }
  }

  /**
   * Start reporting batch processor
   */
  startReportingBatchProcessor() {
    this.reportBatchTimer = setInterval(() => {
      if (this.reportQueue.length > 0) {
        this.flushReportQueue();
      }
    }, 30000); // Report every 30 seconds
  }

  /**
   * Flush report queue
   */
  async flushReportQueue() {
    if (this.reportQueue.length === 0) return;
    
    const batch = this.reportQueue.splice(0, this.config.maxReportBatchSize);
    
    try {
      // Send to reporting endpoint
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errors: batch,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (reportingError) {
      console.warn('Failed to report errors:', reportingError);
      // Put errors back in queue for retry
      this.reportQueue.unshift(...batch);
    }
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupOldErrors();
    }, 300000); // Cleanup every 5 minutes
  }

  /**
   * Cleanup old errors
   */
  cleanupOldErrors() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [errorId, error] of this.errors.entries()) {
      const errorAge = now - new Date(error.timestamp);
      if (errorAge > maxAge) {
        this.errors.delete(errorId);
        this.retryAttempts.delete(errorId);
        
        // Remove from queue
        const queueIndex = this.errorQueue.indexOf(errorId);
        if (queueIndex !== -1) {
          this.errorQueue.splice(queueIndex, 1);
        }
      }
    }
  }

  /**
   * Configure service
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get error by ID
   */
  getError(errorId) {
    return this.errors.get(errorId);
  }

  /**
   * Get all errors
   */
  getAllErrors() {
    return Array.from(this.errors.values());
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type) {
    return Array.from(this.errors.values()).filter(error => error.type === type);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity) {
    return Array.from(this.errors.values()).filter(error => error.severity === severity);
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalActiveErrors: this.errors.size,
      pendingReports: this.reportQueue.length,
      retryAttempts: this.retryAttempts.size
    };
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    const count = this.errors.size;
    this.errors.clear();
    this.errorQueue = [];
    this.retryAttempts.clear();
    this.emit('errorsCleared', { count });
    return count;
  }

  /**
   * Clear errors by type
   */
  clearErrorsByType(type) {
    const clearedIds = [];
    for (const [errorId, error] of this.errors.entries()) {
      if (error.type === type) {
        this.errors.delete(errorId);
        this.retryAttempts.delete(errorId);
        clearedIds.push(errorId);
      }
    }
    
    // Remove from queue
    this.errorQueue = this.errorQueue.filter(id => !clearedIds.includes(id));
    
    this.emit('errorsCleared', { type, count: clearedIds.length });
    return clearedIds.length;
  }

  /**
   * Destroy service
   */
  destroy() {
    // Clear timers
    if (this.reportBatchTimer) {
      clearInterval(this.reportBatchTimer);
    }
    
    // Clear all data
    this.clearErrors();
    this.reportQueue = [];
    
    // Remove global error handlers
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleError);
      window.removeEventListener('unhandledrejection', this.handleError);
    }
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.emit('serviceDestroyed');
  }
}

// Create singleton instance
const standardizedErrorHandlingService = new StandardizedErrorHandlingService();

export default standardizedErrorHandlingService;
