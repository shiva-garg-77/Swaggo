/**
 * Error Monitoring Service
 * Sends error reports to external monitoring service
 */

class ErrorMonitoringService {
  constructor() {
    this.apiEndpoint = process.env.NEXT_PUBLIC_ERROR_MONITORING_ENDPOINT || '/api/monitoring/errors';
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_ERROR_MONITORING === 'true';
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Report error to monitoring service
   */
  async reportError(error, context = {}) {
    if (!this.isEnabled) {
      console.log('Error monitoring is disabled in development');
      return;
    }

    try {
      const errorReport = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context: this.sanitizeContext(context),
        environment: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          platform: typeof process !== 'undefined' ? process.platform : 'browser',
        },
        metadata: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        }
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        console.warn('Failed to send error report to monitoring service:', response.status);
      }

      return response;
    } catch (networkError) {
      console.error('Network error while sending error report:', networkError);
      // In a real implementation, we might want to queue failed reports
    }
  }

  /**
   * Sanitize context to remove sensitive information
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
   * Report unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    this.reportError(event.reason, {
      type: 'unhandledrejection',
      promise: '[Promise]',
    });
  }

  /**
   * Report uncaught exceptions
   */
  handleUncaughtException(error) {
    this.reportError(error, {
      type: 'uncaughtexception',
    });
  }

  /**
   * Initialize global error handlers
   */
  initializeGlobalHandlers() {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleUnhandledRejection(event);
      });

      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.reportError(event.error, {
          type: 'windowerror',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });
    }
  }
}

// Create singleton instance
const errorMonitoringService = new ErrorMonitoringService();

// Initialize global handlers
errorMonitoringService.initializeGlobalHandlers();

export default errorMonitoringService;