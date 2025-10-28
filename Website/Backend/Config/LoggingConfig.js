/**
 * 📊 COMPREHENSIVE LOGGING & MONITORING CONFIGURATION
 * 
 * Advanced logging, debugging, and monitoring setup for production-ready applications
 * Features:
 * - Structured logging with Winston
 * - Performance monitoring
 * - Error tracking and alerting
 * - Request/response logging
 * - Security event logging
 * - Health monitoring
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Logging configuration
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan'
};

/**
 * Create logs directory if it doesn't exist
 */
async function ensureLogDirectory() {
  const logsDir = path.join(process.cwd(), 'logs');
  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
  }
  return logsDir;
}

/**
 * Safe JSON stringify that handles circular references
 */
function safeStringify(obj, space = 0) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Handle undefined, functions, and symbols
    if (value === undefined) return '[Undefined]';
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'symbol') return '[Symbol]';
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      // Skip certain types that are known to cause issues
      if (value.constructor?.name === 'Socket' || 
          value.constructor?.name === 'HTTPParser' ||
          value.constructor?.name === 'WriteStream' ||
          value.constructor?.name === 'ReadStream') {
        return `[${value.constructor.name}]`;
      }
      
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    
    return value;
  }, space);
}

/**
 * Custom log format for structured logging
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (stack) {
      logEntry.stack = stack;
    }

    return safeStringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? safeStringify(meta, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Create Winston logger instance
 */
async function createLogger() {
  const logsDir = await ensureLogDirectory();
  
  const transports = [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 5
    }),
    
    // Security events log
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      format: logFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 10
    }),
    
    // Performance log
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      format: logFormat,
      maxsize: 50 * 1024 * 1024,
      maxFiles: 5
    })
  ];

  winston.addColors(LOG_COLORS);

  const logger = winston.createLogger({
    levels: LOG_LEVELS,
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false,
    // Handle uncaught exceptions and unhandled rejections
    exceptionHandlers: [
      new winston.transports.File({ filename: 'exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'rejections.log' })
    ]
  });

  return logger;
}

/**
 * Security event logger
 */
class SecurityLogger {
  constructor(logger) {
    this.logger = logger;
  }

  logAuthenticationAttempt(success, userIdentifier, ipAddress, userAgent, details = {}) {
    this.logger.info('Authentication Attempt', {
      category: 'security',
      eventType: 'authentication_attempt',
      success,
      userIdentifier,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  logSecurityEvent(eventType, severity, details = {}) {
    const logMethod = severity === 'high' ? 'error' : 
                     severity === 'medium' ? 'warn' : 'info';

    this.logger[logMethod]('Security Event', {
      category: 'security',
      eventType,
      severity,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  logRateLimitExceeded(ipAddress, endpoint, count, windowMs) {
    this.logger.warn('Rate Limit Exceeded', {
      category: 'security',
      eventType: 'rate_limit_exceeded',
      ipAddress,
      endpoint,
      attemptCount: count,
      windowMs,
      timestamp: new Date().toISOString()
    });
  }

  logSuspiciousActivity(activityType, details = {}) {
    this.logger.warn('Suspicious Activity Detected', {
      category: 'security',
      eventType: 'suspicious_activity',
      activityType,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

/**
 * Performance monitoring logger
 */
class PerformanceLogger {
  constructor(logger) {
    this.logger = logger;
  }

  logRequestPerformance(req, res, responseTime) {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;

    this.logger.http('Request Performance', {
      category: 'performance',
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      ipAddress: ip,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }

  logDatabasePerformance(operation, collection, executionTime, recordCount = null) {
    this.logger.debug('Database Performance', {
      category: 'performance',
      operation,
      collection,
      executionTime: `${executionTime}ms`,
      recordCount,
      timestamp: new Date().toISOString()
    });
  }

  logSlowQuery(query, executionTime, threshold = 1000) {
    if (executionTime > threshold) {
      this.logger.warn('Slow Query Detected', {
        category: 'performance',
        eventType: 'slow_query',
        query: typeof query === 'string' ? query : safeStringify(query),
        executionTime: `${executionTime}ms`,
        threshold: `${threshold}ms`,
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Application event logger
 */
class ApplicationLogger {
  constructor(logger) {
    this.logger = logger;
  }

  logStartup(port, environment) {
    this.logger.info('Application Started', {
      category: 'application',
      eventType: 'startup',
      port,
      environment,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  }

  logShutdown(signal) {
    this.logger.info('Application Shutdown', {
      category: 'application',
      eventType: 'shutdown',
      signal,
      timestamp: new Date().toISOString()
    });
  }

  logError(error, context = {}) {
    this.logger.error('Application Error', {
      category: 'application',
      eventType: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  logUserAction(userId, action, details = {}) {
    this.logger.info('User Action', {
      category: 'application',
      eventType: 'user_action',
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

/**
 * Health monitoring
 */
class HealthMonitor {
  constructor(logger) {
    this.logger = logger;
    this.metrics = {
      requests: 0,
      errors: 0,
      lastHealthCheck: null,
      startTime: Date.now()
    };
  }

  incrementRequests() {
    this.metrics.requests++;
  }

  incrementErrors() {
    this.metrics.errors++;
  }

  recordHealthCheck(status, details = {}) {
    this.metrics.lastHealthCheck = new Date();
    
    this.logger.info('Health Check', {
      category: 'health',
      status,
      uptime: Date.now() - this.metrics.startTime,
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      errorRate: this.metrics.requests > 0 ? 
        (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%'
    };
  }
}

/**
 * Request logging middleware
 */
function createRequestLogger(logger) {
  const performanceLogger = new PerformanceLogger(logger);
  const healthMonitor = new HealthMonitor(logger);

  return (req, res, next) => {
    const startTime = Date.now();
    
    // Increment request counter
    healthMonitor.incrementRequests();

    // Log request
    logger.http('Incoming Request', {
      category: 'request',
      method: req.method,
      url: req.url,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const responseTime = Date.now() - startTime;
      
      // Log response performance
      performanceLogger.logRequestPerformance(req, res, responseTime);
      
      // Track errors
      if (res.statusCode >= 400) {
        healthMonitor.incrementErrors();
      }

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Error logging middleware
 */
function createErrorLogger(logger) {
  const appLogger = new ApplicationLogger(logger);

  return (error, req, res, next) => {
    appLogger.logError(error, {
      method: req.method,
      url: req.url,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.body,
      params: req.params,
      query: req.query
    });

    next(error);
  };
}

/**
 * Initialize logging system
 */
async function initializeLogging() {
  const logger = await createLogger();
  
  // Create specialized loggers
  const securityLogger = new SecurityLogger(logger);
  const performanceLogger = new PerformanceLogger(logger);
  const appLogger = new ApplicationLogger(logger);
  const healthMonitor = new HealthMonitor(logger);

  // Create middleware
  const requestLogger = createRequestLogger(logger);
  const errorLogger = createErrorLogger(logger);

  // Log system initialization
  appLogger.logStartup(process.env.PORT || 3001, process.env.NODE_ENV || 'development');

  // Handle process termination
  process.on('SIGINT', () => {
    appLogger.logShutdown('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    appLogger.logShutdown('SIGTERM');
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    appLogger.logError(error, { eventType: 'uncaught_exception' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    appLogger.logError(new Error('Unhandled Rejection'), {
      eventType: 'unhandled_rejection',
      reason: reason.toString(),
      promise: promise.toString()
    });
  });

  return {
    logger,
    securityLogger,
    performanceLogger,
    appLogger,
    healthMonitor,
    middleware: {
      requestLogger,
      errorLogger
    }
  };
}

export {
  initializeLogging,
  SecurityLogger,
  PerformanceLogger,
  ApplicationLogger,
  HealthMonitor,
  createRequestLogger,
  createErrorLogger
};

export default initializeLogging;