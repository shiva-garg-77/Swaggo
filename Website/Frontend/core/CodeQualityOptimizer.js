/**
 * Comprehensive Code Quality Optimizer
 * Removes development artifacts and optimizes code for production
 */

class CodeQualityOptimizer {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.enableLogging = !this.isProduction;
    this.performanceMetrics = new Map();
  }

  /**
   * Production-safe logging system
   * Replaces all console.log statements with structured logging
   */
  createProductionLogger() {
    const logger = {
      // Error logging - always enabled
      error: (message, error, context = {}) => {
        if (typeof window !== 'undefined' && window.errorReporting) {
          window.errorReporting.captureError(error || new Error(message), {
            level: 'error',
            context,
            timestamp: new Date().toISOString()
          });
        }
        
        // In production, only log errors to external service
        if (this.isProduction) {
          this.sendToExternalLogging('error', message, error, context);
        } else {
          console.error(`[ERROR] ${message}`, error, context);
        }
      },

      // Warning logging - production filtered
      warn: (message, context = {}) => {
        if (this.isProduction) {
          // Only log critical warnings in production
          if (context.critical || context.security) {
            this.sendToExternalLogging('warn', message, null, context);
          }
        } else {
          console.warn(`[WARN] ${message}`, context);
        }
      },

      // Info logging - development only
      info: (message, context = {}) => {
        if (!this.isProduction) {
          console.info(`[INFO] ${message}`, context);
        }
      },

      // Debug logging - development only
      debug: (message, data = {}) => {
        if (this.isDevelopment) {
          console.debug(`[DEBUG] ${message}`, data);
        }
      }
    };

    return logger;
  }

  /**
   * Performance monitoring for production
   */
  createPerformanceMonitor() {
    return {
      // Start timing
      start: (operationName) => {
        if (typeof performance !== 'undefined') {
          const startTime = performance.now();
          this.performanceMetrics.set(operationName, startTime);
          return startTime;
        }
        return Date.now();
      },

      // End timing and report
      end: (operationName, threshold = 100) => {
        const startTime = this.performanceMetrics.get(operationName);
        if (!startTime) return 0;

        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const duration = endTime - startTime;
        
        this.performanceMetrics.delete(operationName);

        // Only report slow operations in production
        if (duration > threshold) {
          if (this.isProduction) {
            this.sendToExternalLogging('performance', `Slow operation: ${operationName}`, null, {
              duration,
              threshold,
              timestamp: new Date().toISOString()
            });
          } else {
            console.warn(`🐌 Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
          }
        }

        return duration;
      }
    };
  }

  /**
   * Memory usage optimizer
   */
  createMemoryOptimizer() {
    const cleanupFunctions = new Set();
    
    return {
      // Register cleanup function
      registerCleanup: (cleanupFn, name = 'anonymous') => {
        cleanupFunctions.add({ fn: cleanupFn, name });
      },

      // Execute all cleanup functions
      cleanup: () => {
        let cleanedUp = 0;
        for (const { fn, name } of cleanupFunctions) {
          try {
            fn();
            cleanedUp++;
          } catch (error) {
            this.createProductionLogger().error(`Cleanup failed for ${name}`, error);
          }
        }
        cleanupFunctions.clear();
        return cleanedUp;
      },

      // Monitor memory usage
      checkMemoryUsage: () => {
        if (typeof performance !== 'undefined' && performance.memory) {
          const memory = performance.memory;
          const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          
          if (usagePercent > 80) {
            this.createProductionLogger().warn('High memory usage detected', {
              critical: true,
              usagePercent: usagePercent.toFixed(2),
              usedMB: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
              limitMB: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
            });
          }

          return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            usagePercent
          };
        }
        return null;
      }
    };
  }

  /**
   * Development code remover
   */
  createDevelopmentCodeCleaner() {
    return {
      // Remove debug statements
      removeDebugCode: () => {
        if (this.isProduction) {
          // Override debug functions to no-ops
          if (typeof window !== 'undefined') {
            window.debugMode = false;
            window.enableDebugOutput = false;
          }
          
          // Remove development-only DOM elements
          const debugElements = document.querySelectorAll('[data-debug="true"], .debug-only, .dev-only');
          debugElements.forEach(el => el.remove());
        }
      },

      // Clean development data attributes
      cleanDataAttributes: () => {
        if (this.isProduction) {
          const elements = document.querySelectorAll('[data-debug], [data-test-id], [data-dev]');
          elements.forEach(el => {
            el.removeAttribute('data-debug');
            el.removeAttribute('data-test-id');
            el.removeAttribute('data-dev');
          });
        }
      }
    };
  }

  /**
   * Error boundary optimizer for production
   */
  createOptimizedErrorBoundary() {
    return {
      // Production error handler
      handleError: (error, errorInfo, errorId) => {
        const errorData = {
          message: error.message,
          name: error.name,
          errorId,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        };

        // In production, send minimal error data
        if (this.isProduction) {
          // Don't include stack traces or sensitive info
          this.sendToExternalLogging('error', 'Component Error', null, errorData);
        } else {
          // Development: include full error details
          this.createProductionLogger().error('Component Error', error, {
            ...errorData,
            stack: error.stack,
            errorInfo
          });
        }
      },

      // Recovery strategies
      getRecoveryStrategy: (error) => {
        // Network errors
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
          return 'network_retry';
        }

        // Chunk loading errors (common in production)
        if (error.name === 'ChunkLoadError' || error.message.includes('chunk')) {
          return 'reload_page';
        }

        // Authentication errors
        if (error.message.includes('auth') || error.message.includes('token')) {
          return 'redirect_login';
        }

        // Default fallback
        return 'fallback_ui';
      }
    };
  }

  /**
   * External logging service interface
   */
  sendToExternalLogging(level, message, error, context) {
    // This would integrate with services like Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && window.externalLogger) {
      window.externalLogger.log({
        level,
        message,
        error: error ? {
          name: error.name,
          message: error.message,
          // Don't send stack traces in production for security
          stack: this.isDevelopment ? error.stack : undefined
        } : null,
        context,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Initialize optimized systems
   */
  initialize() {
    const logger = this.createProductionLogger();
    const performance = this.createPerformanceMonitor();
    const memory = this.createMemoryOptimizer();
    const cleaner = this.createDevelopmentCodeCleaner();
    const errorBoundary = this.createOptimizedErrorBoundary();

    // Clean up development code in production
    if (this.isProduction && typeof document !== 'undefined') {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          cleaner.removeDebugCode();
          cleaner.cleanDataAttributes();
        });
      } else {
        cleaner.removeDebugCode();
        cleaner.cleanDataAttributes();
      }
    }

    // Set up memory monitoring
    if (typeof window !== 'undefined') {
      // Check memory usage periodically
      setInterval(() => {
        memory.checkMemoryUsage();
      }, 30000); // Every 30 seconds

      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        memory.cleanup();
      });
    }

    // Global error handling
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        errorBoundary.handleError(event.error, { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno 
        }, `global_${Date.now()}`);
      });

      window.addEventListener('unhandledrejection', (event) => {
        errorBoundary.handleError(event.reason, {
          type: 'unhandled_promise_rejection'
        }, `promise_${Date.now()}`);
      });
    }

    return {
      logger,
      performance,
      memory,
      cleaner,
      errorBoundary
    };
  }
}

// Global instance
const codeQualityOptimizer = new CodeQualityOptimizer();
const optimizedSystems = codeQualityOptimizer.initialize();

// Export for use throughout the application
export default codeQualityOptimizer;
export const {
  logger,
  performance: performanceMonitor,
  memory: memoryManager,
  cleaner: devCleaner,
  errorBoundary: optimizedErrorBoundary
} = optimizedSystems;

// Global exposure for debugging in development
if (typeof window !== 'undefined' && !codeQualityOptimizer.isProduction) {
  window.codeQualityOptimizer = codeQualityOptimizer;
  window.optimizedSystems = optimizedSystems;
}