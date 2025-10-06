/**
 * @fileoverview Framework Configuration for Production-Ready Settings
 * @module FrameworkConfig
 * @version 2.0.0
 * @author Swaggo Development Team
 * 
 * @description
 * Configuration settings to reduce console noise while maintaining
 * comprehensive monitoring and alerting capabilities.
 */

'use client';

/**
 * Performance monitoring configuration
 * Tuned for development vs production environments
 */
export const PERFORMANCE_CONFIG = {
  // Development settings - more verbose
  development: {
    enableMonitoring: true,
    enableConsoleLogging: true,
    enablePerformanceAlerts: true,
    thresholds: {
      renderTime: 32, // 30fps threshold (less aggressive)
      memoryUsage: 200, // 200MB threshold (more lenient)
      renderCount: 2000, // Higher render count threshold
      fcp: 2000, // First Contentful Paint - 2s
      lcp: 3000, // Largest Contentful Paint - 3s
      fps: 45 // Target FPS (more lenient than 60)
    },
    alertFrequency: {
      maxAlertsPerMinute: 5, // Limit console spam
      cooldownPeriod: 10000 // 10 second cooldown between similar alerts
    }
  },
  
  // Production settings - less verbose, focus on critical issues
  production: {
    enableMonitoring: true,
    enableConsoleLogging: false, // No console logging in production
    enablePerformanceAlerts: false, // No alerts in production console
    thresholds: {
      renderTime: 16, // 60fps threshold
      memoryUsage: 100, // 100MB threshold
      renderCount: 1000,
      fcp: 1800,
      lcp: 2500,
      fps: 55
    },
    alertFrequency: {
      maxAlertsPerMinute: 1,
      cooldownPeriod: 30000 // 30 second cooldown
    }
  }
};

/**
 * Accessibility configuration
 * Tuned for development feedback vs production compliance
 */
export const ACCESSIBILITY_CONFIG = {
  development: {
    enableColorContrastCheck: true,
    enableConsoleWarnings: true,
    enableScreenReaderAnnouncements: true,
    colorContrastThreshold: 4.5, // WCAG AA standard
    checkFrequency: 5000, // Check every 5 seconds
    maxWarningsPerCheck: 3 // Limit console spam
  },
  
  production: {
    enableColorContrastCheck: false, // Don't check in production
    enableConsoleWarnings: false,
    enableScreenReaderAnnouncements: true,
    colorContrastThreshold: 4.5,
    checkFrequency: 0, // Disabled
    maxWarningsPerCheck: 0
  }
};

/**
 * Socket configuration for different environments
 */
export const SOCKET_CONFIG = {
  development: {
    enableVerboseLogging: false, // Reduce socket logging
    enableConnectionAlerts: true,
    reconnectAttempts: 5,
    reconnectDelay: 3000,
    heartbeatInterval: 30000
  },
  
  production: {
    enableVerboseLogging: false,
    enableConnectionAlerts: false,
    reconnectAttempts: 10,
    reconnectDelay: 5000,
    heartbeatInterval: 60000
  }
};

/**
 * Get configuration based on current environment
 */
export const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    performance: PERFORMANCE_CONFIG[env] || PERFORMANCE_CONFIG.development,
    accessibility: ACCESSIBILITY_CONFIG[env] || ACCESSIBILITY_CONFIG.development,
    socket: SOCKET_CONFIG[env] || SOCKET_CONFIG.development,
    environment: env
  };
};

/**
 * Alert rate limiter to prevent console spam
 */
class AlertRateLimiter {
  constructor() {
    this.alertCounts = new Map();
    this.lastAlertTimes = new Map();
  }

  shouldShowAlert(alertType, config) {
    const now = Date.now();
    const { maxAlertsPerMinute, cooldownPeriod } = config.alertFrequency;
    
    // Check cooldown period
    const lastAlert = this.lastAlertTimes.get(alertType);
    if (lastAlert && (now - lastAlert) < cooldownPeriod) {
      return false;
    }
    
    // Check rate limit
    const currentCount = this.alertCounts.get(alertType) || 0;
    if (currentCount >= maxAlertsPerMinute) {
      // Reset count every minute
      const oneMinuteAgo = now - 60000;
      if (lastAlert && lastAlert < oneMinuteAgo) {
        this.alertCounts.set(alertType, 0);
      } else {
        return false;
      }
    }
    
    // Update counters
    this.alertCounts.set(alertType, currentCount + 1);
    this.lastAlertTimes.set(alertType, now);
    
    return true;
  }

  reset() {
    this.alertCounts.clear();
    this.lastAlertTimes.clear();
  }
}

// Global rate limiter instance
export const alertRateLimiter = new AlertRateLimiter();

/**
 * Smart console logger that respects configuration
 */
export const smartLog = {
  performance: (message, data, level = 'info') => {
    const config = getCurrentConfig();
    if (!config.performance.enableConsoleLogging) return;
    
    if (!alertRateLimiter.shouldShowAlert('performance', config.performance)) {
      return;
    }
    
    const prefix = '🚀 [Performance]';
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`, data);
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data);
        break;
      default:
        console.log(`${prefix} ${message}`, data);
    }
  },
  
  accessibility: (message, data, level = 'info') => {
    const config = getCurrentConfig();
    if (!config.accessibility.enableConsoleWarnings) return;
    
    if (!alertRateLimiter.shouldShowAlert('accessibility', config.accessibility)) {
      return;
    }
    
    const prefix = '♿ [Accessibility]';
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`, data);
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data);
        break;
      default:
        console.log(`${prefix} ${message}`, data);
    }
  },
  
  socket: (message, data, level = 'info') => {
    const config = getCurrentConfig();
    if (!config.socket.enableVerboseLogging) return;
    
    if (!alertRateLimiter.shouldShowAlert('socket', config.socket)) {
      return;
    }
    
    const prefix = '📡 [Socket]';
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`, data);
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data);
        break;
      default:
        console.log(`${prefix} ${message}`, data);
    }
  }
};

/**
 * Performance threshold checker
 */
export const checkPerformanceThresholds = (metrics) => {
  const config = getCurrentConfig();
  const issues = [];
  
  if (metrics.renderTime > config.performance.thresholds.renderTime) {
    issues.push({
      type: 'render_time',
      value: metrics.renderTime,
      threshold: config.performance.thresholds.renderTime,
      severity: metrics.renderTime > config.performance.thresholds.renderTime * 2 ? 'high' : 'medium'
    });
  }
  
  if (metrics.memoryUsage > config.performance.thresholds.memoryUsage) {
    issues.push({
      type: 'memory_usage',
      value: metrics.memoryUsage,
      threshold: config.performance.thresholds.memoryUsage,
      severity: metrics.memoryUsage > config.performance.thresholds.memoryUsage * 1.5 ? 'high' : 'medium'
    });
  }
  
  return issues;
};

/**
 * Accessibility compliance checker
 */
export const checkAccessibilityCompliance = (issues) => {
  const config = getCurrentConfig();
  
  if (!config.accessibility.enableColorContrastCheck) {
    return [];
  }
  
  // Filter and limit issues to prevent spam
  const filteredIssues = issues
    .filter(issue => issue.severity === 'high') // Only show high severity issues
    .slice(0, config.accessibility.maxWarningsPerCheck); // Limit number of warnings
  
  return filteredIssues;
};

/**
 * Optimized framework provider configuration
 */
export const getOptimizedProviderConfig = () => {
  const config = getCurrentConfig();
  
  return {
    performance: {
      enableMonitoring: config.performance.enableMonitoring,
      autoOptimize: true,
      thresholds: config.performance.thresholds,
      enableBundleAnalysis: config.environment === 'development'
    },
    accessibility: {
      enableAnnouncements: config.accessibility.enableScreenReaderAnnouncements,
      enableKeyboardShortcuts: true,
      enableColorContrastCheck: config.accessibility.enableColorContrastCheck
    },
    socket: {
      enableReconnection: true,
      maxReconnectAttempts: config.socket.reconnectAttempts,
      reconnectDelay: config.socket.reconnectDelay
    }
  };
};

export default {
  getCurrentConfig,
  smartLog,
  checkPerformanceThresholds,
  checkAccessibilityCompliance,
  getOptimizedProviderConfig,
  alertRateLimiter
};