/**
 * Comprehensive Monitoring & Logging Configuration
 * Implements application monitoring, error tracking, performance metrics, and logging
 */

// Monitoring Configuration
export interface MonitoringConfig {
  environment: 'development' | 'staging' | 'production';
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserAnalytics: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  endpoints: {
    healthCheck: string;
    metrics: string;
    logs: string;
  };
}

// Logger Implementation
export class Logger {
  private static config: MonitoringConfig;

  static configure(config: MonitoringConfig): void {
    this.config = config;
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error, context?: any): void {
    const logEntry = this.createLogEntry('error', message, { error: error?.stack, ...context });
    this.sendLog(logEntry);
    
    if (this.config?.environment === 'development') {
      console.error(`[ERROR] ${message}`, error, context);
    }
  }

  /**
   * Log warning message
   */
  static warn(message: string, context?: any): void {
    if (!this.shouldLog('warn')) return;
    
    const logEntry = this.createLogEntry('warn', message, context);
    this.sendLog(logEntry);
    
    if (this.config?.environment === 'development') {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  /**
   * Log info message
   */
  static info(message: string, context?: any): void {
    if (!this.shouldLog('info')) return;
    
    const logEntry = this.createLogEntry('info', message, context);
    this.sendLog(logEntry);
    
    if (this.config?.environment === 'development') {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, context?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const logEntry = this.createLogEntry('debug', message, context);
    this.sendLog(logEntry);
    
    if (this.config?.environment === 'development') {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  private static createLogEntry(level: string, message: string, context?: any): any {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      environment: this.config?.environment,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
  }

  private static shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevel = levels.indexOf(this.config?.logLevel || 'error');
    const messageLevel = levels.indexOf(level);
    return messageLevel <= configLevel;
  }

  private static sendLog(logEntry: any): void {
    if (!this.config?.endpoints?.logs) return;
    
    // Send log to backend (non-blocking)
    fetch(this.config.endpoints.logs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(() => {
      // Silently fail - don't log errors from logging
    });
  }

  private static getCurrentUserId(): string | null {
    // Get user ID from your auth system
    return localStorage.getItem('userId') || null;
  }

  private static getSessionId(): string | null {
    return sessionStorage.getItem('sessionId') || null;
  }
}

// Error Tracking
export class ErrorTracker {
  private static isInitialized = false;

  /**
   * Initialize error tracking
   */
  static initialize(_config: MonitoringConfig): void {
    if (this.isInitialized) return;

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript-error'
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        type: 'unhandled-promise-rejection',
        reason: event.reason
      });
    });

    // Capture React errors (if using error boundary)
    this.setupReactErrorBoundary();

    this.isInitialized = true;
    Logger.info('Error tracking initialized');
  }

  /**
   * Manually capture error
   */
  static captureError(error: Error, context?: any): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
      context
    };

    Logger.error('Error captured', error, context);
    this.sendErrorReport(errorData);
  }

  /**
   * Capture exception with additional context
   */
  static captureException(error: Error, tags?: Record<string, string>, extra?: any): void {
    this.captureError(error, { tags, extra });
  }

  private static setupReactErrorBoundary(): void {
    // This would integrate with your React error boundary
    // to automatically capture React component errors
  }

  private static sendErrorReport(errorData: any): void {
    // Send to error tracking service (Sentry, Bugsnag, etc.)
    // For now, just log to our backend
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(() => {
      // Silently fail
    });
  }

  private static getCurrentUserId(): string | null {
    return localStorage.getItem('userId') || null;
  }
}

// Performance Monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static observer: PerformanceObserver | null = null;

  /**
   * Initialize performance monitoring
   */
  static initialize(config: MonitoringConfig): void {
    if (!config.enablePerformanceMonitoring) return;

    this.setupPerformanceObserver();
    this.monitorWebVitals();
    this.trackNavigationTiming();
    this.setupCustomMetrics();

    Logger.info('Performance monitoring initialized');
  }

  /**
   * Record custom metric
   */
  static recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metrics = this.metrics.get(name) || [];
    metrics.push(value);
    this.metrics.set(name, metrics);

    // Send metric to backend
    this.sendMetric({
      name,
      value,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * Start timing
   */
  static startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`timing.${name}`, duration);
    };
  }

  /**
   * Track component render time
   */
  static trackComponentRender(componentName: string): {
    start: () => void;
    end: () => void;
  } {
    let startTime: number;
    
    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(`render.${componentName}`, duration);
      }
    };
  }

  private static setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    // Observe different types of performance entries
    try {
      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      Logger.warn('Some performance metrics not supported', { error });
    }
  }

  private static processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.recordMetric('lcp', entry.startTime);
        break;
      case 'first-input':
        this.recordMetric('fid', (entry as any).processingStart - entry.startTime);
        break;
      case 'layout-shift':
        this.recordMetric('cls', (entry as any).value);
        break;
    }
  }

  private static processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.recordMetric('navigation.dns', entry.domainLookupEnd - entry.domainLookupStart);
    this.recordMetric('navigation.tcp', entry.connectEnd - entry.connectStart);
    this.recordMetric('navigation.request', entry.responseStart - entry.requestStart);
    this.recordMetric('navigation.response', entry.responseEnd - entry.responseStart);
    this.recordMetric('navigation.dom', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
    this.recordMetric('navigation.load', entry.loadEventEnd - entry.loadEventStart);
  }

  private static processPaintEntry(entry: PerformancePaintTiming): void {
    this.recordMetric(entry.name.replace('-', '_'), entry.startTime);
  }

  private static monitorWebVitals(): void {
    // This would integrate with web-vitals library for accurate measurements
    setTimeout(() => {
      // Mock web vitals collection
      this.collectWebVitals();
    }, 1000);
  }

  private static trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.processNavigationEntry(navigation);
        }
      }, 0);
    });
  }

  private static setupCustomMetrics(): void {
    // Track memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory.used', memory.usedJSHeapSize);
        this.recordMetric('memory.total', memory.totalJSHeapSize);
        this.recordMetric('memory.limit', memory.jsHeapSizeLimit);
      }, 30000); // Every 30 seconds
    }

    // Track connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('connection.downlink', connection.downlink);
      this.recordMetric('connection.rtt', connection.rtt);
    }
  }

  private static collectWebVitals(): void {
    // Mock implementation - would use actual web-vitals library
    this.recordMetric('lcp', Math.random() * 4000 + 1000);
    this.recordMetric('fid', Math.random() * 100);
    this.recordMetric('cls', Math.random() * 0.25);
  }

  private static sendMetric(metric: any): void {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(() => {
      // Silently fail
    });
  }
}

// Health Check
export class HealthCheck {
  /**
   * Perform comprehensive health check
   */
  static async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{ name: string; status: string; message?: string; duration: number }>;
    timestamp: string;
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check API connectivity
    const apiCheck = await this.checkApiHealth();
    checks.push(apiCheck);
    if (apiCheck.status === 'unhealthy') overallStatus = 'unhealthy';
    else if (apiCheck.status === 'degraded') overallStatus = 'degraded';

    // Check WebSocket connectivity
    const wsCheck = await this.checkWebSocketHealth();
    checks.push(wsCheck);
    if (wsCheck.status === 'unhealthy' && overallStatus !== 'unhealthy') overallStatus = 'degraded';

    // Check browser capabilities
    const browserCheck = this.checkBrowserCapabilities();
    checks.push(browserCheck);

    // Check memory usage
    const memoryCheck = this.checkMemoryUsage();
    checks.push(memoryCheck);
    if (memoryCheck.status === 'degraded' && overallStatus === 'healthy') overallStatus = 'degraded';

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  private static async checkApiHealth(): Promise<any> {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        return {
          name: 'api',
          status: duration > 2000 ? 'degraded' : 'healthy',
          duration,
          message: duration > 2000 ? 'API response time is slow' : undefined
        };
      } else {
        return {
          name: 'api',
          status: 'unhealthy',
          duration,
          message: `API returned ${response.status}`
        };
      }
    } catch (error) {
      return {
        name: 'api',
        status: 'unhealthy',
        duration: performance.now() - startTime,
        message: (error as Error).message
      };
    }
  }

  private static async checkWebSocketHealth(): Promise<any> {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
        
        ws.onopen = () => {
          ws.close();
          resolve({
            name: 'websocket',
            status: 'healthy',
            duration: performance.now() - startTime
          });
        };
        
        ws.onerror = () => {
          resolve({
            name: 'websocket',
            status: 'unhealthy',
            duration: performance.now() - startTime,
            message: 'WebSocket connection failed'
          });
        };
        
        setTimeout(() => {
          ws.close();
          resolve({
            name: 'websocket',
            status: 'degraded',
            duration: performance.now() - startTime,
            message: 'WebSocket connection timeout'
          });
        }, 5000);
        
      } catch (error) {
        resolve({
          name: 'websocket',
          status: 'unhealthy',
          duration: performance.now() - startTime,
          message: (error as Error).message
        });
      }
    });
  }

  private static checkBrowserCapabilities(): any {
    const startTime = performance.now();
    const capabilities = {
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      webSockets: 'WebSocket' in window,
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator
    };

    const missingCapabilities = Object.entries(capabilities)
      .filter(([, supported]) => !supported)
      .map(([name]) => name);

    return {
      name: 'browser',
      status: missingCapabilities.length === 0 ? 'healthy' : 'degraded',
      duration: performance.now() - startTime,
      message: missingCapabilities.length > 0 ? 
        `Missing capabilities: ${missingCapabilities.join(', ')}` : undefined
    };
  }

  private static checkMemoryUsage(): any {
    const startTime = performance.now();
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      return {
        name: 'memory',
        status: usagePercentage > 90 ? 'unhealthy' : usagePercentage > 70 ? 'degraded' : 'healthy',
        duration: performance.now() - startTime,
        message: usagePercentage > 70 ? `Memory usage: ${usagePercentage.toFixed(1)}%` : undefined
      };
    }

    return {
      name: 'memory',
      status: 'healthy',
      duration: performance.now() - startTime,
      message: 'Memory monitoring not available'
    };
  }
}

// User Analytics
export class Analytics {
  private static isInitialized = false;

  /**
   * Initialize analytics tracking
   */
  static initialize(config: MonitoringConfig): void {
    if (!config.enableUserAnalytics || this.isInitialized) return;

    this.setupPageTracking();
    this.setupUserInteractionTracking();
    this.setupPerformanceTracking();

    this.isInitialized = true;
    Logger.info('Analytics initialized');
  }

  /**
   * Track page view
   */
  static trackPageView(path: string, title?: string): void {
    this.sendEvent('page_view', {
      path,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }

  /**
   * Track user event
   */
  static trackEvent(eventName: string, properties?: Record<string, any>): void {
    this.sendEvent(eventName, {
      ...properties,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    });
  }

  /**
   * Track user interaction
   */
  static trackInteraction(element: string, action: string, value?: any): void {
    this.trackEvent('user_interaction', {
      element,
      action,
      value
    });
  }

  private static setupPageTracking(): void {
    // Track initial page load
    this.trackPageView(window.location.pathname);

    // Track navigation changes (for SPA)
    let lastPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        this.trackPageView(lastPath);
      }
    }, 1000);
  }

  private static setupUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.dataset.track) {
        this.trackInteraction(target.dataset.track, 'click', target.textContent);
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (form.dataset.track) {
        this.trackInteraction(form.dataset.track, 'submit');
      }
    });
  }

  private static setupPerformanceTracking(): void {
    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if ([25, 50, 75, 90].includes(scrollDepth)) {
          this.trackEvent('scroll_depth', { depth: scrollDepth });
        }
      }
    });

    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - startTime;
      this.trackEvent('time_on_page', { duration: timeOnPage });
    });
  }

  private static sendEvent(eventName: string, properties: any): void {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        properties,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Silently fail
    });
  }

  private static getCurrentUserId(): string | null {
    return localStorage.getItem('userId') || null;
  }

  private static getSessionId(): string | null {
    return sessionStorage.getItem('sessionId') || null;
  }
}

// Main Monitoring Service
export class MonitoringService {
  private static config: MonitoringConfig;

  /**
   * Initialize all monitoring services
   */
  static initialize(config: MonitoringConfig): void {
    this.config = config;

    Logger.configure(config);
    ErrorTracker.initialize(config);
    PerformanceMonitor.initialize(config);
    Analytics.initialize(config);

    // Setup periodic health checks
    setInterval(async () => {
      try {
        const healthStatus = await HealthCheck.checkHealth();
        Logger.info('Health check completed', healthStatus);
      } catch (error) {
        Logger.error('Health check failed', error as Error);
      }
    }, 60000); // Every minute

    Logger.info('Monitoring service initialized', { config });
  }

  /**
   * Get current monitoring status
   */
  static getStatus(): any {
    return {
      config: this.config,
      isInitialized: true,
      timestamp: new Date().toISOString()
    };
  }
}

export default MonitoringService;