/**
 * Production-Ready Logger Utility
 * 
 * Provides environment-aware logging with multiple log levels
 * and optional integration with monitoring services
 * 
 * Usage:
 * ```javascript
 * import { logger } from '@/utils/logger';
 * 
 * logger.debug('Debug info', { data });
 * logger.info('User logged in', { userId });
 * logger.warn('API slow response', { duration });
 * logger.error('Failed to load', error);
 * ```
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Log levels (higher number = more severe)
const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// Current minimum log level (configurable via environment)
const MIN_LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL 
  ? LogLevels[process.env.NEXT_PUBLIC_LOG_LEVEL.toUpperCase()]
  : (isProduction ? LogLevels.INFO : LogLevels.DEBUG);

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  return { prefix, message, args };
};

/**
 * Send error to monitoring service (e.g., Sentry)
 */
const sendToMonitoring = (level, message, error, context) => {
  if (!isProduction) return;
  
  // TODO: Integrate with your monitoring service
  // Example for Sentry:
  // if (window.Sentry && level >= LogLevels.ERROR) {
  //   window.Sentry.captureException(error || new Error(message), {
  //     level: level === LogLevels.FATAL ? 'fatal' : 'error',
  //     extra: context
  //   });
  // }
  
  // Example for LogRocket:
  // if (window.LogRocket) {
  //   window.LogRocket.log(level, message, context);
  // }
};

/**
 * Main logger object
 */
export const logger = {
  /**
   * Debug level logging - only in development
   * Use for detailed troubleshooting information
   */
  debug: (message, ...args) => {
    if (LogLevels.DEBUG >= MIN_LOG_LEVEL && !isProduction) {
      const { prefix, message: msg, args: logArgs } = formatMessage('DEBUG', message, ...args);
      console.log(`${prefix} ${msg}`, ...logArgs);
    }
  },

  /**
   * Info level logging
   * Use for general informational messages
   */
  info: (message, ...args) => {
    if (LogLevels.INFO >= MIN_LOG_LEVEL) {
      const { prefix, message: msg, args: logArgs } = formatMessage('INFO', message, ...args);
      console.log(`${prefix} ${msg}`, ...logArgs);
    }
  },

  /**
   * Warning level logging
   * Use for potentially harmful situations
   */
  warn: (message, ...args) => {
    if (LogLevels.WARN >= MIN_LOG_LEVEL) {
      const { prefix, message: msg, args: logArgs } = formatMessage('WARN', message, ...args);
      console.warn(`${prefix} ${msg}`, ...logArgs);
      
      // Send warnings to monitoring in production
      if (isProduction) {
        sendToMonitoring(LogLevels.WARN, message, null, args[0]);
      }
    }
  },

  /**
   * Error level logging
   * Use for error events that might still allow the application to continue
   */
  error: (message, error, ...args) => {
    if (LogLevels.ERROR >= MIN_LOG_LEVEL) {
      const { prefix, message: msg } = formatMessage('ERROR', message);
      console.error(`${prefix} ${msg}`, error, ...args);
      
      // Always send errors to monitoring
      sendToMonitoring(LogLevels.ERROR, message, error, args[0]);
    }
  },

  /**
   * Fatal level logging
   * Use for severe errors that cause application termination
   */
  fatal: (message, error, ...args) => {
    const { prefix, message: msg } = formatMessage('FATAL', message);
    console.error(`${prefix} ${msg}`, error, ...args);
    
    // Always send fatal errors to monitoring
    sendToMonitoring(LogLevels.FATAL, message, error, args[0]);
  },

  /**
   * Trace execution time of a function
   */
  trace: (label, fn) => {
    if (!isDevelopment) {
      return fn();
    }

    const start = performance.now();
    console.time(label);
    
    try {
      const result = fn();
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          const duration = performance.now() - start;
          console.timeEnd(label);
          logger.debug(`${label} took ${duration.toFixed(2)}ms`);
        });
      }
      
      const duration = performance.now() - start;
      console.timeEnd(label);
      logger.debug(`${label} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      console.timeEnd(label);
      logger.error(`Error in ${label}`, error);
      throw error;
    }
  },

  /**
   * Group related log messages
   */
  group: (label, fn) => {
    if (!isDevelopment) {
      return fn();
    }

    console.group(label);
    try {
      return fn();
    } finally {
      console.groupEnd();
    }
  },

  /**
   * Log table data (development only)
   */
  table: (data, columns) => {
    if (isDevelopment && data) {
      console.table(data, columns);
    }
  }
};

/**
 * Create a namespaced logger for specific modules
 * 
 * Example:
 * ```javascript
 * const chatLogger = createLogger('Chat');
 * chatLogger.info('Message sent'); // [INFO] [Chat] Message sent
 * ```
 */
export const createLogger = (namespace) => {
  return {
    debug: (message, ...args) => logger.debug(`[${namespace}] ${message}`, ...args),
    info: (message, ...args) => logger.info(`[${namespace}] ${message}`, ...args),
    warn: (message, ...args) => logger.warn(`[${namespace}] ${message}`, ...args),
    error: (message, error, ...args) => logger.error(`[${namespace}] ${message}`, error, ...args),
    fatal: (message, error, ...args) => logger.fatal(`[${namespace}] ${message}`, error, ...args),
    trace: (label, fn) => logger.trace(`[${namespace}] ${label}`, fn),
    group: (label, fn) => logger.group(`[${namespace}] ${label}`, fn),
    table: (data, columns) => logger.table(data, columns)
  };
};

/**
 * Utility to suppress logs in tests
 */
export const suppressLogs = () => {
  if (isTest) {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  }
};

/**
 * Configuration helper
 */
export const configureLogger = (config = {}) => {
  // Future: Allow runtime configuration
  // - Custom log levels
  // - Custom formatting
  // - Custom output destinations
  return logger;
};

export default logger;
