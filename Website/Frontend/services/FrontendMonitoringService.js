/**
 * Frontend Monitoring Service
 * Comprehensive monitoring and observability for the frontend application
 */

class FrontendMonitoringService {
  constructor() {
    this.apiEndpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT || '/api/monitoring';
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_FRONTEND_MONITORING === 'true';
    this.sessionId = this.generateSessionId();
    this.performanceMetrics = [];
    this.errorReports = [];
    this.userInteractions = [];
    
    // Initialize monitoring
    this.initializeMonitoring();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize monitoring system
   */
  initializeMonitoring() {
    if (!this.isEnabled) {
      console.log('Frontend monitoring is disabled');
      return;
    }

    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
    
    // Initialize error monitoring
    this.initializeErrorMonitoring();
    
    // Initialize user interaction tracking
    this.initializeUserInteractionTracking();
    
    console.log('Frontend monitoring service initialized');
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Navigation timing
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.collectNavigationMetrics();
        }, 0);
      });
    }

    // Resource timing
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.collectResourceMetrics();
        }, 2000); // Wait for resources to load
      });
    }

    // Long task monitoring
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            this.recordPerformanceMetric('long_task', {
              duration: entry.duration,
              startTime: entry.startTime,
              attribution: entry.attribution
            });
          }
        });
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  /**
   * Collect navigation metrics
   */
  collectNavigationMetrics() {
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      const metrics = {
        pageLoadTime: nav.loadEventEnd - nav.fetchStart,
        domContentLoadedTime: nav.domContentLoadedEventEnd - nav.fetchStart,
        firstPaint: nav.responseStart - nav.fetchStart,
        firstContentfulPaint: nav.domContentLoadedEventEnd - nav.fetchStart,
        dnsLookupTime: nav.domainLookupEnd - nav.domainLookupStart,
        tcpConnectionTime: nav.connectEnd - nav.connectStart,
        requestTime: nav.responseEnd - nav.requestStart,
        redirectTime: nav.redirectEnd - nav.redirectStart
      };
      
      this.recordPerformanceMetric('navigation', metrics);
    }
  }

  /**
   * Collect resource metrics
   */
  collectResourceMetrics() {
    const resourceEntries = performance.getEntriesByType('resource');
    const resourceMetrics = {
      totalResources: resourceEntries.length,
      slowResources: [],
      resourceSizes: {}
    };

    resourceEntries.forEach(entry => {
      if (entry.duration > 1000) { // Resources taking more than 1 second
        resourceMetrics.slowResources.push({
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize
        });
      }
      
      // Group by resource type
      const resourceType = this.getResourceType(entry.name, entry.initiatorType);
      if (!resourceMetrics.resourceSizes[resourceType]) {
        resourceMetrics.resourceSizes[resourceType] = { count: 0, totalSize: 0 };
      }
      resourceMetrics.resourceSizes[resourceType].count++;
      resourceMetrics.resourceSizes[resourceType].totalSize += entry.transferSize;
    });

    this.recordPerformanceMetric('resources', resourceMetrics);
  }

  /**
   * Get resource type based on file extension and initiator
   */
  getResourceType(name, initiatorType) {
    if (name.includes('.js')) return 'javascript';
    if (name.includes('.css')) return 'css';
    if (/\.(png|jpg|jpeg|gif|webp|svg)/i.test(name)) return 'image';
    if (/\.(woff|woff2|ttf|eot)/i.test(name)) return 'font';
    if (initiatorType === 'xmlhttprequest' || initiatorType === 'fetch') return 'xhr';
    return 'other';
  }

  /**
   * Initialize error monitoring
   */
  initializeErrorMonitoring() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(event.reason, {
        type: 'unhandledrejection',
        promise: '[Promise]',
      });
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

    // React error boundaries would be handled separately in components
  }

  /**
   * Initialize user interaction tracking
   */
  initializeUserInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      this.recordUserInteraction('click', {
        target: event.target.tagName,
        className: event.target.className,
        id: event.target.id,
        text: event.target.textContent?.substring(0, 50)
      });
    }, true);

    // Track form submissions
    document.addEventListener('submit', (event) => {
      this.recordUserInteraction('form_submit', {
        formId: event.target.id,
        formName: event.target.name
      });
    }, true);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordUserInteraction('visibility_change', {
        state: document.visibilityState
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.recordUserInteraction('page_unload', {
        timestamp: Date.now()
      });
    });
  }

  /**
   * Report error to monitoring service
   */
  async reportError(error, context = {}) {
    if (!this.isEnabled) {
      console.log('Error monitoring is disabled');
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
          userAgent: navigator.userAgent,
          url: window.location.href,
          platform: navigator.platform,
          language: navigator.language,
          cookiesEnabled: navigator.cookieEnabled,
          online: navigator.onLine
        },
        metadata: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
        performance: this.getPerformanceContext()
      };

      // Store locally for batch sending
      this.errorReports.push(errorReport);
      
      // Send to backend
      await this.sendErrorReport(errorReport);

      return errorReport;
    } catch (networkError) {
      console.error('Network error while sending error report:', networkError);
    }
  }

  /**
   * Send error report to backend
   */
  async sendErrorReport(errorReport) {
    try {
      const response = await fetch(`${this.apiEndpoint}/errors`, {
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
    }
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(type, data) {
    if (!this.isEnabled) return;

    const metric = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    };

    this.performanceMetrics.push(metric);
    
    // Send performance metrics periodically
    if (this.performanceMetrics.length >= 10) {
      this.sendPerformanceMetrics();
    }
  }

  /**
   * Send performance metrics to backend
   */
  async sendPerformanceMetrics() {
    if (!this.isEnabled || this.performanceMetrics.length === 0) return;

    try {
      const metricsToSend = [...this.performanceMetrics];
      this.performanceMetrics = []; // Clear buffer
      
      const response = await fetch(`${this.apiEndpoint}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          metrics: metricsToSend,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send performance metrics:', response.status);
        // Restore metrics if sending failed
        this.performanceMetrics = [...metricsToSend, ...this.performanceMetrics];
      }

      return response;
    } catch (networkError) {
      console.error('Network error while sending performance metrics:', networkError);
      // Restore metrics if sending failed
      this.performanceMetrics = [...this.performanceMetrics, ...this.performanceMetrics];
    }
  }

  /**
   * Record user interaction
   */
  recordUserInteraction(type, data) {
    if (!this.isEnabled) return;

    const interaction = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data
    };

    this.userInteractions.push(interaction);
    
    // Send user interactions periodically
    if (this.userInteractions.length >= 20) {
      this.sendUserInteractions();
    }
  }

  /**
   * Send user interactions to backend
   */
  async sendUserInteractions() {
    if (!this.isEnabled || this.userInteractions.length === 0) return;

    try {
      const interactionsToSend = [...this.userInteractions];
      this.userInteractions = []; // Clear buffer
      
      const response = await fetch(`${this.apiEndpoint}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          interactions: interactionsToSend,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send user interactions:', response.status);
        // Restore interactions if sending failed
        this.userInteractions = [...interactionsToSend, ...this.userInteractions];
      }

      return response;
    } catch (networkError) {
      console.error('Network error while sending user interactions:', networkError);
      // Restore interactions if sending failed
      this.userInteractions = [...this.userInteractions, ...this.userInteractions];
    }
  }

  /**
   * Get performance context
   */
  getPerformanceContext() {
    if ('performance' in window) {
      return {
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        navigation: performance.navigation ? {
          type: performance.navigation.type,
          redirectCount: performance.navigation.redirectCount
        } : null
      };
    }
    return {};
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
   * Get monitoring status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      sessionId: this.sessionId,
      errorReportsCount: this.errorReports.length,
      performanceMetricsCount: this.performanceMetrics.length,
      userInteractionsCount: this.userInteractions.length
    };
  }

  /**
   * Flush all pending data
   */
  async flush() {
    // Send any remaining data
    if (this.performanceMetrics.length > 0) {
      await this.sendPerformanceMetrics();
    }
    
    if (this.userInteractions.length > 0) {
      await this.sendUserInteractions();
    }
    
    if (this.errorReports.length > 0) {
      // Send individual error reports
      for (const report of this.errorReports) {
        await this.sendErrorReport(report);
      }
    }
  }
}

// Create singleton instance
const frontendMonitoringService = new FrontendMonitoringService();

// Export for use in other modules
export default frontendMonitoringService;