/**
 * Production Logger for Backend Services
 * Provides structured logging with environment-aware output
 */

const fs = require('fs');
const path = require('path');

class ProductionLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = process.env.LOG_LEVEL || (this.isProduction ? 'error' : 'debug');
    this.logDir = path.join(process.cwd(), 'logs');
    
    // Ensure log directory exists
    if (this.isProduction) {
      try {
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true });
        }
      } catch (error) {
        // Fallback if can't create log directory
      }
    }
  }

  /**
   * Format log entry for production
   */
  formatLogEntry(level, message, error, context) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      context: context || {},
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          // Only include stack trace in development
          ...(this.isDevelopment && { stack: error.stack })
        }
      })
    };

    return JSON.stringify(entry);
  }

  /**
   * Write to log file in production
   */
  writeToFile(level, formattedEntry) {
    if (this.isProduction) {
      try {
        const logFile = path.join(this.logDir, `${level}-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, formattedEntry + '\n');
      } catch (error) {
        // Fallback to console if file writing fails
        console.error('Failed to write to log file:', error.message);
      }
    }
  }

  /**
   * Error logging - always enabled
   */
  error(message, error, context = {}) {
    const formattedEntry = this.formatLogEntry('error', message, error, context);
    
    if (this.isProduction) {
      this.writeToFile('error', formattedEntry);
      // Only console.error critical errors in production
      if (context.critical) {
        console.error(`[CRITICAL] ${message}`);
      }
    } else {
      console.error(`[ERROR] ${message}`, error, context);
    }
  }

  /**
   * Warning logging - filtered in production
   */
  warn(message, context = {}) {
    const formattedEntry = this.formatLogEntry('warn', message, null, context);
    
    if (this.isProduction) {
      // Only log critical warnings in production
      if (context.critical || context.security) {
        this.writeToFile('warn', formattedEntry);
        console.warn(`[WARN] ${message}`);
      }
    } else {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  /**
   * Info logging - development and staging only
   */
  info(message, context = {}) {
    const formattedEntry = this.formatLogEntry('info', message, null, context);
    
    if (!this.isProduction) {
      console.info(`[INFO] ${message}`, context);
    } else if (context.production) {
      // Allow specific production info logs
      this.writeToFile('info', formattedEntry);
    }
  }

  /**
   * Debug logging - development only
   */
  debug(message, data = {}) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
}

// Export singleton instance
const logger = new ProductionLogger();
module.exports = logger;