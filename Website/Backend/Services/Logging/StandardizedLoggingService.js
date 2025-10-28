/**
 * Standardized Logging Service
 * 
 * Unified logging service that provides consistent logging across frontend and backend
 * with support for different log levels, structured logging, and monitoring integration
 * 
 * @module StandardizedLoggingService
 * @version 1.0.0
 */

import { initializeLogging } from '../../Config/LoggingConfig.js';
import AuditLogService from '../Security/AuditLogService.js';

// Initialize logging system
let loggingSystem = null;

/**
 * Initialize the logging system
 */
async function initializeLogger() {
  if (!loggingSystem) {
    loggingSystem = await initializeLogging();
  }
  return loggingSystem;
}

/**
 * Get the logger instance
 */
async function getLogger() {
  if (!loggingSystem) {
    await initializeLogger();
  }
  return loggingSystem.logger;
}

/**
 * Get specialized loggers
 */
async function getLoggers() {
  if (!loggingSystem) {
    await initializeLogger();
  }
  return {
    logger: loggingSystem.logger,
    securityLogger: loggingSystem.securityLogger,
    performanceLogger: loggingSystem.performanceLogger,
    appLogger: loggingSystem.appLogger,
    healthMonitor: loggingSystem.healthMonitor
  };
}

/**
 * Log levels mapping
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * Standardized Logging Service
 */
class StandardizedLoggingService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the logging service
   */
  async init() {
    if (!this.initialized) {
      await initializeLogger();
      this.initialized = true;
    }
  }

  /**
   * Log debug messages
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  async debug(message, context = {}, options = {}) {
    await this.init();
    const logger = await getLogger();
    logger.debug(message, { ...context, level: 'debug', ...options });
  }

  /**
   * Log info messages
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  async info(message, context = {}, options = {}) {
    await this.init();
    const logger = await getLogger();
    logger.info(message, { ...context, level: 'info', ...options });
  }

  /**
   * Log warning messages
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  async warn(message, context = {}, options = {}) {
    await this.init();
    const logger = await getLogger();
    logger.warn(message, { ...context, level: 'warn', ...options });
  }

  /**
   * Log error messages
   * @param {string} message - Log message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  async error(message, error = null, context = {}, options = {}) {
    await this.init();
    const logger = await getLogger();
    
    const errorContext = {
      ...context,
      level: 'error',
      ...options
    };
    
    if (error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    logger.error(message, errorContext);
  }

  /**
   * Log fatal messages
   * @param {string} message - Log message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  async fatal(message, error = null, context = {}, options = {}) {
    await this.init();
    const logger = await getLogger();
    
    const errorContext = {
      ...context,
      level: 'fatal',
      ...options
    };
    
    if (error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    logger.error(message, errorContext);
  }

  /**
   * Log HTTP requests
   * @param {string} message - Log message
   * @param {Object} context - Request context
   * @param {Object} options - Logging options
   */
  async http(message, context = {}, options = {}) {
    await this.init();
    const logger = await getLogger();
    logger.http(message, { ...context, level: 'http', ...options });
  }

  /**
   * Log security events
   * @param {string} eventType - Type of security event
   * @param {string} severity - Severity level (low, medium, high)
   * @param {Object} details - Event details
   */
  async security(eventType, severity, details = {}) {
    await this.init();
    const { securityLogger } = await getLoggers();
    securityLogger.logSecurityEvent(eventType, severity, details);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {string} collection - Database collection (if applicable)
   * @param {number} executionTime - Execution time in milliseconds
   * @param {number} recordCount - Number of records processed (optional)
   */
  async performance(operation, collection, executionTime, recordCount = null) {
    await this.init();
    const { performanceLogger } = await getLoggers();
    performanceLogger.logDatabasePerformance(operation, collection, executionTime, recordCount);
  }

  /**
   * Log application startup
   * @param {number} port - Server port
   * @param {string} environment - Environment (development, production, etc.)
   */
  async startup(port, environment) {
    await this.init();
    const { appLogger } = await getLoggers();
    appLogger.logStartup(port, environment);
  }

  /**
   * Log application shutdown
   * @param {string} signal - Shutdown signal
   */
  async shutdown(signal) {
    await this.init();
    const { appLogger } = await getLoggers();
    appLogger.logShutdown(signal);
  }

  /**
   * Log user actions for audit trail
   * @param {string} userId - User identifier
   * @param {string} action - Action performed
   * @param {Object} details - Additional details
   */
  async userAction(userId, action, details = {}) {
    await this.init();
    const { appLogger } = await getLoggers();
    appLogger.logUserAction(userId, action, details);
  }

  /**
   * Log audit events
   * @param {Object} eventData - Audit event data
   */
  async audit(eventData) {
    await this.init();
    return await AuditLogService.log(eventData);
  }

  /**
   * Get audit logs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Array} Array of audit logs
   */
  async getAuditLogs(filters = {}, options = {}) {
    await this.init();
    return await AuditLogService.getAuditLogs(filters, options);
  }

  /**
   * Get health metrics
   * @returns {Object} Health metrics
   */
  async getHealthMetrics() {
    await this.init();
    const { healthMonitor } = await getLoggers();
    return healthMonitor.getMetrics();
  }

  /**
   * Record health check
   * @param {string} status - Health status
   * @param {Object} details - Additional details
   */
  async healthCheck(status, details = {}) {
    await this.init();
    const { healthMonitor } = await getLoggers();
    healthMonitor.recordHealthCheck(status, details);
  }
}

// Create and export a singleton instance
const standardizedLoggingService = new StandardizedLoggingService();

export default standardizedLoggingService;