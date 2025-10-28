/**
 * Standardized Logging Service for Frontend
 * 
 * Unified logging service that provides consistent logging across frontend and backend
 * with support for different log levels, structured logging, and monitoring integration
 * 
 * @module StandardizedLoggingService
 * @version 1.0.0
 */

// Use dynamic import to avoid circular dependency
let frontendLogger = null;
let createFrontendLogger = null;

// Lazy initialization function
const initializeLogger = async () => {
  if (!frontendLogger) {
    const loggerModule = await import('../utils/logger.js');
    frontendLogger = loggerModule.logger;
    createFrontendLogger = loggerModule.createLogger;
  }
  return { frontendLogger, createFrontendLogger };
};

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
 * Standardized Logging Service for Frontend
 */
class StandardizedLoggingService {
  constructor() {
    // Initialize with a placeholder
    this.logger = {
      debug: (...args) => {
        console.debug('[Logger not initialized]', ...args);
      },
      info: (...args) => {
        console.info('[Logger not initialized]', ...args);
      },
      warn: (...args) => {
        console.warn('[Logger not initialized]', ...args);
      },
      error: (...args) => {
        console.error('[Logger not initialized]', ...args);
      },
      fatal: (...args) => {
        console.error('[Logger not initialized - FATAL]', ...args);
      },
      trace: () => {},
      group: () => {},
      table: () => {}
    };
    
    // Initialize the actual logger
    this.initializeLogger();
  }

  /**
   * Initialize the logger asynchronously to avoid circular dependencies
   */
  async initializeLogger() {
    try {
      const { frontendLogger: logger, createFrontendLogger: createLogger } = await initializeLogger();
      this.logger = logger;
      this.createFrontendLogger = createLogger;
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  /**
   * Log debug messages
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  debug(message, context = {}, options = {}) {
    this.logger.debug(message, context, options);
  }

  /**
   * Log info messages
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  info(message, context = {}, options = {}) {
    this.logger.info(message, context, options);
  }

  /**
   * Log warning messages
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  warn(message, context = {}, options = {}) {
    this.logger.warn(message, context, options);
  }

  /**
   * Log error messages
   * @param {string} message - Log message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  error(message, error = null, context = {}, options = {}) {
    this.logger.error(message, error, context, options);
  }

  /**
   * Log fatal messages
   * @param {string} message - Log message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @param {Object} options - Logging options
   */
  fatal(message, error = null, context = {}, options = {}) {
    this.logger.fatal(message, error, context, options);
  }

  /**
   * Trace execution time of a function
   * @param {string} label - Label for the trace
   * @param {Function} fn - Function to trace
   * @returns {*} Result of the function
   */
  trace(label, fn) {
    return this.logger.trace(label, fn);
  }

  /**
   * Group related log messages
   * @param {string} label - Label for the group
   * @param {Function} fn - Function to group
   * @returns {*} Result of the function
   */
  group(label, fn) {
    return this.logger.group(label, fn);
  }

  /**
   * Log table data (development only)
   * @param {Array|Object} data - Data to log as table
   * @param {Array} columns - Columns to display (optional)
   */
  table(data, columns) {
    this.logger.table(data, columns);
  }

  /**
   * Create a namespaced logger
   * @param {string} namespace - Namespace for the logger
   * @returns {Object} Namespaced logger
   */
  createLogger(namespace) {
    if (this.createFrontendLogger) {
      return this.createFrontendLogger(namespace);
    } else {
      // Fallback if createFrontendLogger is not available
      return {
        debug: (...args) => this.debug(`[${namespace}]`, ...args),
        info: (...args) => this.info(`[${namespace}]`, ...args),
        warn: (...args) => this.warn(`[${namespace}]`, ...args),
        error: (...args) => this.error(`[${namespace}]`, ...args),
        fatal: (...args) => this.fatal(`[${namespace}]`, ...args),
        trace: this.trace,
        group: this.group,
        table: this.table
      };
    }
  }
}

// Create and export a singleton instance
const standardizedLoggingService = new StandardizedLoggingService();

// Export the service
export default standardizedLoggingService;