/**
 * Production-Ready Logger Utility
 * 
 * Provides environment-aware logging with multiple log levels
 * and optional integration with monitoring services
 * 
 * This is now a wrapper around the StandardizedLoggingService for backward compatibility
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

// Use dynamic import to avoid circular dependency
let standardizedLoggingService = null;

// Lazy initialization function
const getLoggingService = async () => {
  if (!standardizedLoggingService) {
    try {
      const serviceModule = await import('../services/StandardizedLoggingService.js');
      standardizedLoggingService = serviceModule.default;
    } catch (error) {
      console.error('Failed to load StandardizedLoggingService:', error);
      // Fallback to basic console logging
      standardizedLoggingService = {
        debug: (...args) => console.debug(...args),
        info: (...args) => console.info(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
        fatal: (...args) => console.error('[FATAL]', ...args)
      };
    }
  }
  return standardizedLoggingService;
};

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
 * Main logger object
 * 
 * This is maintained for backward compatibility with existing code
 */
export const logger = {
  /**
   * Debug level logging - only in development
   * Use for detailed troubleshooting information
   */
  debug: async (message, ...args) => {
    if (LogLevels.DEBUG >= MIN_LOG_LEVEL && !isProduction) {
      const service = await getLoggingService();
      service.debug(message, args[0] || {});
    }
  },

  /**
   * Info level logging
   * Use for general informational messages
   */
  info: async (message, ...args) => {
    if (LogLevels.INFO >= MIN_LOG_LEVEL) {
      const service = await getLoggingService();
      service.info(message, args[0] || {});
    }
  },

  /**
   * Warning level logging
   * Use for potentially harmful situations
   */
  warn: async (message, ...args) => {
    if (LogLevels.WARN >= MIN_LOG_LEVEL) {
      const service = await getLoggingService();
      service.warn(message, args[0] || {});
    }
  },

  /**
   * Error level logging
   * Use for error events that might still allow the application to continue
   */
  error: async (message, error, ...args) => {
    if (LogLevels.ERROR >= MIN_LOG_LEVEL) {
      const service = await getLoggingService();
      service.error(message, error, args[0] || {});
    }
  },

  /**
   * Fatal level logging
   * Use for severe errors that cause application termination
   */
  fatal: async (message, error, ...args) => {
    const service = await getLoggingService();
    service.fatal(message, error, args[0] || {});
  },

  /**
   * Trace execution time of a function
   */
  trace: async (label, fn) => {
    const service = await getLoggingService();
    return service.trace(label, fn);
  },

  /**
   * Group related log messages
   */
  group: async (label, fn) => {
    const service = await getLoggingService();
    return service.group(label, fn);
  },

  /**
   * Log table data (development only)
   */
  table: async (data, columns) => {
    const service = await getLoggingService();
    service.table(data, columns);
  }
};

// Make logger methods synchronous by creating a proxy
const createSyncLogger = () => {
  return new Proxy(logger, {
    get(target, prop) {
      if (typeof target[prop] === 'function' && prop !== 'then') {
        return (...args) => {
          // Call the async method but don't await it to keep it synchronous
          target[prop](...args).catch(err => {
            // Log any errors that occur during async logging
            console.error('Logging error:', err);
          });
        };
      }
      return target[prop];
    }
  });
};

// Export the synchronous version of the logger
export const syncLogger = createSyncLogger();

/**
 * Create a namespaced logger for specific modules
 * 
 * Example:
 * ```javascript
 * const chatLogger = createLogger('Chat');
 * chatLogger.info('Message sent'); // [INFO] [Chat] Message sent
 * ```
 */
export const createLogger = async (namespace) => {
  const service = await getLoggingService();
  return service.createLogger(namespace);
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
  return syncLogger;
};

export default syncLogger;