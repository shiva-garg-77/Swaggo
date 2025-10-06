/**
 * Memory Management and Performance Monitoring System
 * Addresses: Memory leak detection, Garbage collection optimization, Memory usage monitoring
 */

import { getConfig } from '../config/environment.js';

// Performance metrics interface
interface PerformanceMetrics {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  componentCount: number;
  listenerCount: number;
  cacheSize: number;
  pendingRequests: number;
}

// Memory leak detection interface
interface MemoryLeak {
  type: 'component' | 'listener' | 'cache' | 'websocket' | 'timeout' | 'interval';
  source: string;
  count: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Performance warning interface
interface PerformanceWarning {
  type: 'memory' | 'cpu' | 'network' | 'rendering';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  suggestions: string[];
}

class MemoryManager {
  private static instance: MemoryManager;
  private metrics: PerformanceMetrics[] = [];
  private memoryLeaks: MemoryLeak[] = [];
  private warnings: PerformanceWarning[] = [];
  private observers: Set<any> = new Set();
  private timers: Set<number> = new Set();
  private intervals: Set<number> = new Set();
  private eventListeners: Map<string, number> = new Map();
  private components: Set<string> = new Set();
  private caches: Map<string, any> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: number;
  private cleanupInterval?: number;
  private performanceObserver?: PerformanceObserver;

  // Configuration
  private readonly config = {
    monitoringInterval: getConfig('NEXT_PUBLIC_MEMORY_MONITORING_INTERVAL', 10000), // 10 seconds
    cleanupInterval: getConfig('NEXT_PUBLIC_MEMORY_CLEANUP_INTERVAL', 60000), // 1 minute
    maxMetricsHistory: getConfig('NEXT_PUBLIC_MAX_METRICS_HISTORY', 100),
    memoryThreshold: getConfig('NEXT_PUBLIC_MEMORY_THRESHOLD', 100 * 1024 * 1024), // 100MB
    leakDetectionThreshold: getConfig('NEXT_PUBLIC_LEAK_DETECTION_THRESHOLD', 50),
    gcForceThreshold: getConfig('NEXT_PUBLIC_GC_FORCE_THRESHOLD', 150 * 1024 * 1024), // 150MB
    enableLogging: getConfig('NEXT_PUBLIC_ENABLE_MEMORY_LOGGING', true)
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializePerformanceObserver();
      this.setupUnloadHandler();
    }
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      this.log('Memory monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.log('🔍 Starting memory monitoring...');

    // Monitor performance metrics
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
      this.detectMemoryLeaks();
      this.checkPerformanceThresholds();
    }, this.config.monitoringInterval);

    // Cleanup interval
    this.cleanupInterval = window.setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);

    // Initial metrics collection
    this.collectMetrics();
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.log('🛑 Stopping memory monitoring...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    if (typeof window === 'undefined') return;

    const memory = (performance as any).memory;

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      heapUsed: memory?.usedJSHeapSize || 0,
      heapTotal: memory?.totalJSHeapSize || 0,
      external: 0,
      rss: 0,
      arrayBuffers: 0,
      componentCount: this.components.size,
      listenerCount: Array.from(this.eventListeners.values()).reduce((a, b) => a + b, 0),
      cacheSize: this.caches.size,
      pendingRequests: this.getPendingRequestsCount()
    };

    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsHistory);
    }

    this.log(`Memory usage: ${this.formatBytes(metrics.heapUsed)} / ${this.formatBytes(metrics.heapTotal)}`);
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) return;

    const previousMetrics = this.metrics[this.metrics.length - 2];
    if (!previousMetrics) return;

    // Check for growing memory usage
    const memoryGrowth = currentMetrics.heapUsed - previousMetrics.heapUsed;
    const growthPercentage = (memoryGrowth / previousMetrics.heapUsed) * 100;

    if (memoryGrowth > 5 * 1024 * 1024 && growthPercentage > 10) { // 5MB and 10% growth
      this.reportMemoryLeak({
        type: 'component',
        source: 'Unknown component causing memory growth',
        count: Math.round(growthPercentage),
        timestamp: Date.now(),
        severity: growthPercentage > 50 ? 'critical' : growthPercentage > 25 ? 'high' : 'medium'
      });
    }

    // Check for excessive event listeners
    const totalListeners = currentMetrics.listenerCount;
    if (totalListeners > this.config.leakDetectionThreshold) {
      this.reportMemoryLeak({
        type: 'listener',
        source: 'Excessive event listeners detected',
        count: totalListeners,
        timestamp: Date.now(),
        severity: totalListeners > 200 ? 'critical' : totalListeners > 100 ? 'high' : 'medium'
      });
    }

    // Check for cache bloat
    if (this.caches.size > 50) {
      this.reportMemoryLeak({
        type: 'cache',
        source: 'Cache size growing beyond normal limits',
        count: this.caches.size,
        timestamp: Date.now(),
        severity: this.caches.size > 200 ? 'critical' : 'medium'
      });
    }
  }

  /**
   * Check performance thresholds and issue warnings
   */
  private checkPerformanceThresholds(): void {
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) return;

    // Memory threshold warning
    if (currentMetrics.heapUsed > this.config.memoryThreshold) {
      this.issueWarning({
        type: 'memory',
        message: 'Memory usage exceeds threshold',
        value: currentMetrics.heapUsed,
        threshold: this.config.memoryThreshold,
        timestamp: Date.now(),
        suggestions: [
          'Clear unused caches',
          'Remove unused event listeners',
          'Optimize component lifecycle',
          'Consider lazy loading'
        ]
      });
    }

    // Force garbage collection if memory is too high
    if (currentMetrics.heapUsed > this.config.gcForceThreshold) {
      this.forceGarbageCollection();
    }
  }

  /**
   * Report a detected memory leak
   */
  private reportMemoryLeak(leak: MemoryLeak): void {
    this.memoryLeaks.push(leak);
    
    // Keep only recent leaks
    if (this.memoryLeaks.length > 50) {
      this.memoryLeaks = this.memoryLeaks.slice(-50);
    }

    this.log(`🚨 Memory leak detected: ${leak.type} - ${leak.source} (${leak.count})`, 'warn');
  }

  /**
   * Issue a performance warning
   */
  private issueWarning(warning: PerformanceWarning): void {
    this.warnings.push(warning);
    
    // Keep only recent warnings
    if (this.warnings.length > 50) {
      this.warnings = this.warnings.slice(-50);
    }

    this.log(`⚠️ Performance warning: ${warning.message} (${this.formatBytes(warning.value)})`, 'warn');
  }

  /**
   * Perform cleanup operations
   */
  private performCleanup(): void {
    this.log('🧹 Performing memory cleanup...');

    // Clear old metrics
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsHistory);
    }

    // Clear old memory leaks
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.memoryLeaks = this.memoryLeaks.filter(leak => leak.timestamp > oneHourAgo);

    // Clear old warnings
    this.warnings = this.warnings.filter(warning => warning.timestamp > oneHourAgo);

    // Clean up unused observers
    this.cleanupObservers();

    // Clean up expired cache entries
    this.cleanupExpiredCache();

    // Suggest garbage collection
    this.requestGarbageCollection();
  }

  /**
   * Clean up unused observers
   */
  private cleanupObservers(): void {
    const deadObservers: any[] = [];
    
    this.observers.forEach(observer => {
      if (!observer || typeof observer.disconnect === 'function') {
        try {
          observer.disconnect();
          deadObservers.push(observer);
        } catch (error) {
          deadObservers.push(observer);
        }
      }
    });

    deadObservers.forEach(observer => {
      this.observers.delete(observer);
    });

    if (deadObservers.length > 0) {
      this.log(`🧹 Cleaned up ${deadObservers.length} dead observers`);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    let cleanedCount = 0;
    
    this.caches.forEach((value, key) => {
      if (value && typeof value === 'object' && value.expiry && Date.now() > value.expiry) {
        this.caches.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Request garbage collection (if available)
   */
  private requestGarbageCollection(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
      this.log('♻️ Requested garbage collection');
    }
  }

  /**
   * Force garbage collection for critical memory usage
   */
  private forceGarbageCollection(): void {
    this.log('🚨 Forcing garbage collection due to high memory usage', 'warn');
    
    // Clear all non-essential caches
    this.clearNonEssentialCaches();
    
    // Request immediate GC
    this.requestGarbageCollection();
    
    // Wait and collect metrics again
    setTimeout(() => {
      this.collectMetrics();
    }, 1000);
  }

  /**
   * Clear non-essential caches
   */
  private clearNonEssentialCaches(): void {
    let clearedCount = 0;
    
    this.caches.forEach((_value, key) => {
      if (!key.includes('essential') && !key.includes('critical')) {
        this.caches.delete(key);
        clearedCount++;
      }
    });

    this.log(`🧹 Cleared ${clearedCount} non-essential cache entries`);
  }

  /**
   * Register a component for monitoring
   */
  registerComponent(componentName: string): void {
    this.components.add(componentName);
    this.log(`📝 Registered component: ${componentName}`);
  }

  /**
   * Unregister a component
   */
  unregisterComponent(componentName: string): void {
    this.components.delete(componentName);
    this.log(`📝 Unregistered component: ${componentName}`);
  }

  /**
   * Register an event listener
   */
  registerEventListener(eventType: string): void {
    const current = this.eventListeners.get(eventType) || 0;
    this.eventListeners.set(eventType, current + 1);
  }

  /**
   * Unregister an event listener
   */
  unregisterEventListener(eventType: string): void {
    const current = this.eventListeners.get(eventType) || 0;
    if (current > 1) {
      this.eventListeners.set(eventType, current - 1);
    } else {
      this.eventListeners.delete(eventType);
    }
  }

  /**
   * Register a cache entry
   */
  registerCache(key: string, value: any, ttl?: number): void {
    const entry = ttl ? {
      value,
      expiry: Date.now() + ttl
    } : value;
    
    this.caches.set(key, entry);
  }

  /**
   * Get cache entry
   */
  getCache(key: string): any {
    const entry = this.caches.get(key);
    
    if (entry && typeof entry === 'object' && entry.expiry) {
      if (Date.now() > entry.expiry) {
        this.caches.delete(key);
        return null;
      }
      return entry.value;
    }
    
    return entry;
  }

  /**
   * Clear cache entry
   */
  clearCache(key: string): void {
    this.caches.delete(key);
  }

  /**
   * Register a timer
   */
  registerTimer(timerId: number): void {
    this.timers.add(timerId);
  }

  /**
   * Unregister a timer
   */
  unregisterTimer(timerId: number): void {
    this.timers.delete(timerId);
    clearTimeout(timerId);
  }

  /**
   * Register an interval
   */
  registerInterval(intervalId: number): void {
    this.intervals.add(intervalId);
  }

  /**
   * Unregister an interval
   */
  unregisterInterval(intervalId: number): void {
    this.intervals.delete(intervalId);
    clearInterval(intervalId);
  }

  /**
   * Initialize performance observer
   */
  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.duration > 100) {
            this.issueWarning({
              type: 'rendering',
              message: `Slow operation detected: ${entry.name}`,
              value: entry.duration,
              threshold: 100,
              timestamp: Date.now(),
              suggestions: [
                'Optimize the operation',
                'Consider debouncing',
                'Use requestIdleCallback',
                'Move to web worker'
              ]
            });
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'paint', 'layout-shift'] 
      });
    } catch (error) {
      this.log('Failed to initialize performance observer', 'error');
    }
  }

  /**
   * Setup unload handler for cleanup
   */
  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    window.addEventListener('unload', () => {
      this.cleanup();
    });
  }

  /**
   * Complete cleanup on page unload
   */
  private cleanup(): void {
    this.log('🧹 Performing final cleanup...');
    
    // Clear all timers
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
    
    // Clear all intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();
    
    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();
    
    // Clear caches
    this.caches.clear();
    
    // Stop monitoring
    this.stopMonitoring();
  }

  /**
   * Get pending requests count (estimation)
   */
  private getPendingRequestsCount(): number {
    // This is an estimation - in a real implementation, you'd track actual pending requests
    return 0;
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  /**
   * Get memory leak reports
   */
  getMemoryLeaks(): MemoryLeak[] {
    return [...this.memoryLeaks];
  }

  /**
   * Get performance warnings
   */
  getWarnings(): PerformanceWarning[] {
    return [...this.warnings];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    currentMemoryUsage: string;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    leakCount: number;
    warningCount: number;
    componentCount: number;
    listenerCount: number;
  } {
    const current = this.getCurrentMetrics();
    const previous = this.metrics[this.metrics.length - 2];
    
    let memoryTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (current && previous) {
      const diff = current.heapUsed - previous.heapUsed;
      const threshold = 1024 * 1024; // 1MB threshold
      
      if (diff > threshold) {
        memoryTrend = 'increasing';
      } else if (diff < -threshold) {
        memoryTrend = 'decreasing';
      }
    }

    return {
      currentMemoryUsage: current ? this.formatBytes(current.heapUsed) : 'Unknown',
      memoryTrend,
      leakCount: this.memoryLeaks.length,
      warningCount: this.warnings.length,
      componentCount: this.components.size,
      listenerCount: Array.from(this.eventListeners.values()).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Log message with timestamp
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[MemoryManager ${timestamp}]`;
    
    switch (level) {
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }
}

// Export singleton instance
export default MemoryManager.getInstance();

// Export types for use in other modules
export type { PerformanceMetrics, MemoryLeak, PerformanceWarning };