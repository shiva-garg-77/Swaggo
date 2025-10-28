/**
 * Application Logger Utility
 * 
 * This utility provides a centralized logging system using Winston
 * to replace console.log statements throughout the application.
 * 
 * This is now a wrapper around the StandardizedLoggingService for backward compatibility
 */

import standardizedLoggingService from '../Services/Logging/StandardizedLoggingService.js';

/**
 * Application logger with different log levels
 * 
 * This is maintained for backward compatibility with existing code
 */
class AppLogger {
  /**
   * Initialize the logger
   */
  async init() {
    // Initialize the standardized logging service
    await standardizedLoggingService.init();
  }

  /**
   * Log error messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async error(message, meta = {}) {
    await standardizedLoggingService.error(message, null, meta);
  }

  /**
   * Log warning messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async warn(message, meta = {}) {
    await standardizedLoggingService.warn(message, meta);
  }

  /**
   * Log info messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async info(message, meta = {}) {
    await standardizedLoggingService.info(message, meta);
  }

  /**
   * Log debug messages
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async debug(message, meta = {}) {
    await standardizedLoggingService.debug(message, meta);
  }

  /**
   * Log HTTP requests
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async http(message, meta = {}) {
    await standardizedLoggingService.http(message, meta);
  }

  /**
   * Log security events
   * @param {string} eventType - Type of security event
   * @param {string} severity - Severity level (low, medium, high)
   * @param {Object} details - Event details
   */
  async security(eventType, severity, details = {}) {
    await standardizedLoggingService.security(eventType, severity, details);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {string} collection - Database collection (if applicable)
   * @param {number} executionTime - Execution time in milliseconds
   * @param {number} recordCount - Number of records processed (optional)
   */
  async performance(operation, collection, executionTime, recordCount = null) {
    await standardizedLoggingService.performance(operation, collection, executionTime, recordCount);
  }

  /**
   * Log application startup
   * @param {number} port - Server port
   * @param {string} environment - Environment (development, production, etc.)
   */
  async startup(port, environment) {
    await standardizedLoggingService.startup(port, environment);
  }

  /**
   * Log application shutdown
   * @param {string} signal - Shutdown signal
   */
  async shutdown(signal) {
    await standardizedLoggingService.shutdown(signal);
  }

  /**
   * Log user actions
   * @param {string} userId - User identifier
   * @param {string} action - Action performed
   * @param {Object} details - Additional details
   */
  async userAction(userId, action, details = {}) {
    await standardizedLoggingService.userAction(userId, action, details);
  }
}

// Create and export a singleton instance
const appLogger = new AppLogger();

// Export functions for direct use
export {
  appLogger,
  standardizedLoggingService as getLogger,
  standardizedLoggingService as getLoggers,
  standardizedLoggingService as initializeLogger
};

// Export default logger for backward compatibility
export default appLogger;