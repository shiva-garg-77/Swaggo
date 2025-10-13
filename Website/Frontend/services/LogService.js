/**
 * Frontend Log Service
 * Handles logging with different levels and development checks
 */

class LogService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.minLogLevel = this.isProduction ? 2 : 4; // ERROR/WARN in prod, ALL in dev
  }

  /**
   * Check if message should be logged based on level
   */
  shouldLog(level) {
    return level <= this.minLogLevel;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const levelName = ['DEBUG', 'INFO', 'WARN', 'ERROR'][level - 1] || 'LOG';
    
    let formattedMessage = `[${timestamp}] ${levelName}: ${message}`;
    
    if (Object.keys(context).length > 0) {
      formattedMessage += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Log debug message
   */
  debug(message, context = {}) {
    if (!this.shouldLog(1)) return;
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage(1, message, context));
    }
  }

  /**
   * Log info message
   */
  info(message, context = {}) {
    if (!this.shouldLog(2)) return;
    
    if (this.isDevelopment) {
      console.info(this.formatMessage(2, message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message, context = {}) {
    if (!this.shouldLog(3)) return;
    
    console.warn(this.formatMessage(3, message, context));
  }

  /**
   * Log error message
   */
  error(message, context = {}) {
    if (!this.shouldLog(4)) return;
    
    console.error(this.formatMessage(4, message, context));
  }

  /**
   * Log with specific level
   */
  log(level, message, context = {}) {
    switch (level) {
      case 1:
        this.debug(message, context);
        break;
      case 2:
        this.info(message, context);
        break;
      case 3:
        this.warn(message, context);
        break;
      case 4:
        this.error(message, context);
        break;
      default:
        if (this.isDevelopment) {
          console.log(this.formatMessage(level, message, context));
        }
    }
  }

  /**
   * Sanitize sensitive data from context
   */
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const sanitized = { ...context };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'pin', 'cvv'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, context = {}) {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...context,
      operation,
      duration,
      type: 'performance'
    });
  }

  /**
   * Log security events
   */
  security(eventType, message, context = {}) {
    this.warn(`Security: ${eventType} - ${message}`, {
      ...context,
      eventType,
      type: 'security'
    });
  }

  /**
   * Log business events
   */
  business(action, message, context = {}) {
    this.info(`Business: ${action} - ${message}`, {
      ...context,
      action,
      type: 'business'
    });
  }
}

// Create singleton instance
const logService = new LogService();

export default logService;