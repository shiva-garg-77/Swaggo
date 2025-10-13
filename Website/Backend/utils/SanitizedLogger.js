/**
 * Sanitized Logger Utility
 * 
 * This utility provides functions to log data while sanitizing sensitive information
 * to prevent exposure of tokens, passwords, and other sensitive data in logs.
 */

class SanitizedLogger {
  /**
   * Sanitizes an object by removing sensitive fields
   * @param {Object} obj - The object to sanitize
   * @param {Array} sensitiveFields - Array of field names to sanitize
   * @returns {Object} - The sanitized object
   */
  static sanitizeObject(obj, sensitiveFields = []) {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Default sensitive fields
    const defaultSensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'authToken',
      'secret',
      'key',
      'apiKey',
      'jwt',
      'sessionId',
      'csrfToken',
      'authorization'
    ];
    
    // Combine default and custom sensitive fields
    const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
    
    // Deep clone the object to avoid modifying the original
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if the key matches any sensitive field (case insensitive)
      const isSensitive = allSensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        // Replace sensitive data with masked value
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeObject(value, sensitiveFields);
      } else {
        // Keep non-sensitive values as-is
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitizes a string by removing sensitive data
   * @param {string} str - The string to sanitize
   * @returns {string} - The sanitized string
   */
  static sanitizeString(str) {
    if (!str || typeof str !== 'string') return str;
    
    // Remove JWT tokens
    let sanitized = str.replace(/eyJ[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*/g, '[JWT_TOKEN]');
    
    // Remove bearer tokens
    sanitized = sanitized.replace(/Bearer [A-Za-z0-9-_]+/gi, 'Bearer [REDACTED]');
    
    // Remove authorization headers
    sanitized = sanitized.replace(/Authorization: [A-Za-z0-9-_]+/gi, 'Authorization: [REDACTED]');
    
    // Remove API keys (assuming they're 32+ character alphanumeric strings)
    sanitized = sanitized.replace(/[A-Za-z0-9]{32,}/g, '[API_KEY]');
    
    return sanitized;
  }

  /**
   * Sanitizes log data
   * @param {*} data - The data to sanitize
   * @returns {*} - The sanitized data
   */
  static sanitize(data) {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    } else if (typeof data === 'object' && data !== null) {
      return this.sanitizeObject(data);
    } else {
      return data;
    }
  }

  /**
   * Logs data with sanitization
   * @param {string} level - Log level (log, warn, error)
   * @param {*} message - The message to log
   * @param {...*} args - Additional arguments to log
   */
  static log(level, message, ...args) {
    const sanitizedMessage = this.sanitize(message);
    const sanitizedArgs = args.map(arg => this.sanitize(arg));
    
    console[level](sanitizedMessage, ...sanitizedArgs);
  }

  /**
   * Logs info messages with sanitization
   * @param {*} message - The message to log
   * @param {...*} args - Additional arguments to log
   */
  static info(message, ...args) {
    this.log('log', message, ...args);
  }

  /**
   * Logs warning messages with sanitization
   * @param {*} message - The message to log
   * @param {...*} args - Additional arguments to log
   */
  static warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  /**
   * Logs error messages with sanitization
   * @param {*} message - The message to log
   * @param {...*} args - Additional arguments to log
   */
  static error(message, ...args) {
    this.log('error', message, ...args);
  }

  /**
   * Creates a sanitized logger with custom sensitive fields
   * @param {Array} customSensitiveFields - Custom sensitive fields to redact
   * @returns {Object} - Logger object with sanitized methods
   */
  static createLogger(customSensitiveFields = []) {
    return {
      log: (message, ...args) => this.log('log', message, ...args),
      info: (message, ...args) => this.info(message, ...args),
      warn: (message, ...args) => this.warn(message, ...args),
      error: (message, ...args) => this.error(message, ...args),
      sanitize: (data) => this.sanitize(data),
      withCustomFields: (fields) => this.createLogger([...customSensitiveFields, ...fields])
    };
  }
}

// Create default logger instance
const defaultLogger = SanitizedLogger.createLogger();

export default SanitizedLogger;
export { defaultLogger as logger };