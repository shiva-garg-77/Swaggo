import express from 'express';
import APMIntegration from '../../../utils/APMIntegration.js'; // 🔧 APM #87: Import APM integration
// 🔧 API RESPONSE TIME OPTIMIZATION #184: Import performance monitor
import { performanceMonitor, getCacheStats, getMemoryUsage } from '../../../utils/PerformanceOptimization.js';

const router = express.Router();

// In-memory storage for error reports (in production, you would use a database)
const errorReports = [];
const performanceMetrics = [];
const userInteractions = [];
const MAX_REPORTS = 1000;

/**
 * POST /api/monitoring/errors
 * Receive error reports from frontend
 */
router.post('/errors', (req, res) => {
  try {
    const errorReport = req.body;
    
    // Add timestamp
    errorReport.receivedAt = new Date().toISOString();
    errorReport.id = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    
    // Add to reports array
    errorReports.push(errorReport);
    
    // Limit array size
    if (errorReports.length > MAX_REPORTS) {
      errorReports.shift();
    }
    
    console.log('Error report received:', {
      sessionId: errorReport.sessionId,
      error: errorReport.error?.name,
      message: errorReport.error?.message,
      environment: errorReport.metadata?.environment
    });
    
    // Log to APM
    APMIntegration.recordMetric('frontend.errors', 1, {
      errorType: errorReport.error?.name,
      environment: errorReport.metadata?.environment
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Error report received',
      id: errorReport.id
    });
  } catch (error) {
    console.error('Error processing error report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process error report' 
    });
  }
});

/**
 * POST /api/monitoring/performance
 * Receive performance metrics from frontend
 */
router.post('/performance', (req, res) => {
  try {
    const { sessionId, metrics } = req.body;
    
    // Add metrics to storage
    metrics.forEach(metric => {
      metric.receivedAt = new Date().toISOString();
      metric.sessionId = sessionId;
      performanceMetrics.push(metric);
    });
    
    // Limit array size
    if (performanceMetrics.length > MAX_REPORTS) {
      performanceMetrics.splice(0, performanceMetrics.length - MAX_REPORTS);
    }
    
    console.log('Performance metrics received:', {
      sessionId,
      count: metrics.length
    });
    
    // Log to APM
    metrics.forEach(metric => {
      APMIntegration.recordMetric(`frontend.performance.${metric.type}`, 1, {
        sessionId,
        ...metric.data
      });
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Performance metrics received'
    });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process performance metrics' 
    });
  }
});

/**
 * POST /api/monitoring/interactions
 * Receive user interaction data from frontend
 */
router.post('/interactions', (req, res) => {
  try {
    const { sessionId, interactions } = req.body;
    
    // Add interactions to storage
    interactions.forEach(interaction => {
      interaction.receivedAt = new Date().toISOString();
      interaction.sessionId = sessionId;
      userInteractions.push(interaction);
    });
    
    // Limit array size
    if (userInteractions.length > MAX_REPORTS) {
      userInteractions.splice(0, userInteractions.length - MAX_REPORTS);
    }
    
    console.log('User interactions received:', {
      sessionId,
      count: interactions.length
    });
    
    // Log to APM
    APMIntegration.recordMetric('frontend.interactions', interactions.length, {
      sessionId
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'User interactions received'
    });
  } catch (error) {
    console.error('Error processing user interactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process user interactions' 
    });
  }
});

/**
 * GET /api/monitoring/errors
 * Get recent error reports (protected endpoint)
 */
router.get('/errors', (req, res) => {
  try {
    // In a real implementation, you would check authentication/authorization
    // For now, we'll just return the reports if in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      reports: errorReports.slice(-50), // Return last 50 reports
      total: errorReports.length
    });
  } catch (error) {
    console.error('Error fetching error reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch error reports' 
    });
  }
});

/**
 * DELETE /api/monitoring/errors
 * Clear error reports (protected endpoint)
 */
router.delete('/errors', (req, res) => {
  try {
    // In a real implementation, you would check authentication/authorization
    // For now, we'll just clear the reports if in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const count = errorReports.length;
    errorReports.length = 0;
    
    res.status(200).json({ 
      success: true, 
      message: `Cleared ${count} error reports` 
    });
  } catch (error) {
    console.error('Error clearing error reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear error reports' 
    });
  }
});

// 🔧 APM #87: Add APM metrics endpoint
/**
 * GET /api/monitoring/apm/metrics
 * Get APM metrics
 */
router.get('/apm/metrics', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const metrics = APMIntegration.getRecentMetrics(parseInt(limit));
    const status = APMIntegration.getStatus();
    
    res.status(200).json({ 
      success: true,
      metrics,
      status
    });
  } catch (error) {
    console.error('Error fetching APM metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch APM metrics' 
    });
  }
});

// 🔧 APM #87: Add APM traces endpoint
/**
 * GET /api/monitoring/apm/traces
 * Get APM traces
 */
router.get('/apm/traces', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const traces = APMIntegration.getRecentTraces(parseInt(limit));
    const status = APMIntegration.getStatus();
    
    res.status(200).json({ 
      success: true,
      traces,
      status
    });
  } catch (error) {
    console.error('Error fetching APM traces:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch APM traces' 
    });
  }
});

// 🔧 APM #87: Add APM status endpoint
/**
 * GET /api/monitoring/apm/status
 * Get APM system status
 */
router.get('/apm/status', (req, res) => {
  try {
    const status = APMIntegration.getStatus();
    
    res.status(200).json({ 
      success: true,
      status
    });
  } catch (error) {
    console.error('Error fetching APM status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch APM status' 
    });
  }
});

// 🔧 Monitoring Enhancement #172: Add endpoint to get frontend monitoring data
/**
 * GET /api/monitoring/frontend
 * Get all frontend monitoring data
 */
router.get('/frontend', (req, res) => {
  try {
    // In a real implementation, you would check authentication/authorization
    // For now, we'll just return the data if in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      errors: errorReports.slice(-50),
      performance: performanceMetrics.slice(-50),
      interactions: userInteractions.slice(-50),
      summary: {
        totalErrors: errorReports.length,
        totalPerformanceMetrics: performanceMetrics.length,
        totalInteractions: userInteractions.length
      }
    });
  } catch (error) {
    console.error('Error fetching frontend monitoring data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch frontend monitoring data' 
    });
  }
});

// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add endpoint to get backend performance metrics
/**
 * GET /api/monitoring/backend/performance
 * Get backend performance metrics including cache stats, memory usage, and request times
 */
router.get('/backend/performance', (req, res) => {
  try {
    // Get performance metrics from PerformanceMonitor
    const performanceMetrics = performanceMonitor.getMetrics();
    
    // Get cache statistics
    const cacheStats = getCacheStats();
    
    // Get memory usage
    const memoryUsage = getMemoryUsage();
    
    // Get APM status
    const apmStatus = APMIntegration.getStatus();
    
    // 🔧 API RESPONSE TIME OPTIMIZATION #184: Enhanced performance metrics with detailed endpoint stats
    res.status(200).json({ 
      success: true,
      performance: performanceMetrics,
      cache: cacheStats,
      memory: memoryUsage,
      apm: apmStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching backend performance metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch backend performance metrics' 
    });
  }
});

// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add endpoint to get slow queries
/**
 * GET /api/monitoring/backend/slow-queries
 * Get slow queries that have been tracked by the performance monitor
 */
router.get('/backend/slow-queries', (req, res) => {
  try {
    // Get performance metrics which includes slow queries
    const performanceMetrics = performanceMonitor.getMetrics();
    
    res.status(200).json({ 
      success: true,
      slowQueries: performanceMetrics.slowQueries,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch slow queries' 
    });
  }
});

// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add endpoint to clear cache
/**
 * POST /api/monitoring/backend/cache/clear
 * Clear all caches (protected endpoint)
 */
router.post('/backend/cache/clear', (req, res) => {
  try {
    // In a real implementation, you would check authentication/authorization
    // For now, we'll just clear the cache if in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Import cleanup function
    const { cleanupCaches } = require('../../utils/PerformanceOptimization.js');
    const cleanedCount = cleanupCaches();
    
    res.status(200).json({ 
      success: true, 
      message: `Cleared ${cleanedCount} cache entries` 
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear caches' 
    });
  }
});

// 🔧 API RESPONSE TIME OPTIMIZATION #184: Add endpoint to get detailed performance insights
/**
 * GET /api/monitoring/backend/performance/insights
 * Get detailed performance insights and recommendations
 */
router.get('/backend/performance/insights', (req, res) => {
  try {
    // Get performance metrics from PerformanceMonitor
    const performanceMetrics = performanceMonitor.getMetrics();
    
    // Generate performance insights
    const insights = [];
    
    // Check for slow endpoints
    const slowEndpoints = Object.entries(performanceMetrics.endpointStats || {})
      .filter(([endpoint, stats]) => stats.avgDuration > 1000)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.avgDuration,
        requestCount: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);
    
    if (slowEndpoints.length > 0) {
      insights.push({
        type: 'slow_endpoints',
        severity: 'warning',
        message: `Found ${slowEndpoints.length} slow endpoints`,
        details: slowEndpoints
      });
    }
    
    // Check cache hit rates
    const cacheInsights = Object.entries(performanceMetrics.cacheStats || {})
      .filter(([cacheName, stats]) => stats.hitRate < 0.8)
      .map(([cacheName, stats]) => ({
        cache: cacheName,
        hitRate: stats.hitRate,
        hits: stats.hits,
        misses: stats.misses
      }));
    
    if (cacheInsights.length > 0) {
      insights.push({
        type: 'low_cache_hit_rate',
        severity: 'warning',
        message: `Found ${cacheInsights.length} caches with low hit rates`,
        details: cacheInsights
      });
    }
    
    // Check response time distribution
    const responseTimeIssues = Object.entries(performanceMetrics.responseTimeHistogram || {})
      .filter(([bucket, count]) => bucket === '5000+' && count > 0)
      .map(([bucket, count]) => ({
        bucket,
        count,
        percentage: ((count / Object.values(performanceMetrics.responseTimeHistogram || {}).reduce((sum, c) => sum + c, 0)) * 100).toFixed(2)
      }));
    
    if (responseTimeIssues.length > 0) {
      insights.push({
        type: 'extreme_response_times',
        severity: 'critical',
        message: 'Found extremely slow responses (>5s)',
        details: responseTimeIssues
      });
    }
    
    res.status(200).json({ 
      success: true,
      insights,
      performance: performanceMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance insights:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch performance insights' 
    });
  }
});

export default router;