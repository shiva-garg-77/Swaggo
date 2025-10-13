/**
 * Application Logger Utility
 * 
 * This utility provides a centralized logging system using Winston
 * to replace console.log statements throughout the application.
 */

import { initializeLogging } from '../Config/LoggingConfig.js';

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
const logLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
  http: 'http'
};

/**
 * Application logger with different log levels
 */
class AppLogger {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the logger
   */
  async init() {
    if (!this.initialized) {
      await initializeLogger();
      this.initialized = true;
    }
  }

  /**
   * Log error messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async error(message, meta = {}) {
    await this.init();
    const logger = await getLogger();
    logger.error(message, { ...meta, level: 'error' });
  }

  /**
   * Log warning messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async warn(message, meta = {}) {
    await this.init();
    const logger = await getLogger();
    logger.warn(message, { ...meta, level: 'warn' });
  }

  /**
   * Log info messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async info(message, meta = {}) {
    await this.init();
    const logger = await getLogger();
    logger.info(message, { ...meta, level: 'info' });
  }

  /**
   * Log debug messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async debug(message, meta = {}) {
    await this.init();
    const logger = await getLogger();
    logger.debug(message, { ...meta, level: 'debug' });
  }

  /**
   * Log HTTP requests
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async http(message, meta = {}) {
    await this.init();
    const logger = await getLogger();
    logger.http(message, { ...meta, level: 'http' });
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
   * Log user actions
   * @param {string} userId - User identifier
   * @param {string} action - Action performed
   * @param {Object} details - Additional details
   */
  async userAction(userId, action, details = {}) {
    await this.init();
    const { appLogger } = await getLoggers();
    appLogger.logUserAction(userId, action, details);
  }
}

// Create and export a singleton instance
const appLogger = new AppLogger();

// Export functions for direct use
export {
  appLogger,
  getLogger,
  getLoggers,
  logLevels,
  initializeLogger
};

// Export default logger for backward compatibility
export default appLogger;