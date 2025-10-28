import { performanceMonitor } from '../../../utils/PerformanceOptimization.js';

describe('🔧 Performance Optimization Utilities', () => {
  describe('Performance Monitor', () => {
    test('should initialize with correct structure', () => {
      expect(performanceMonitor).toBeDefined();
      expect(performanceMonitor.metrics).toBeDefined();
      expect(performanceMonitor.metrics.requestTimes).toBeDefined();
      expect(performanceMonitor.metrics.slowQueries).toBeDefined();
      expect(performanceMonitor.metrics.endpointStats).toBeDefined();
      expect(performanceMonitor.metrics.responseTimeHistogram).toBeDefined();
    });

    test('should track endpoint statistics', () => {
      // Simulate a request
      performanceMonitor.updateEndpointStats('GET:/test', 150, 200);
      performanceMonitor.updateEndpointStats('GET:/test', 200, 200);
      performanceMonitor.updateEndpointStats('POST:/api/data', 300, 201);

      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.endpointStats['GET:/test']).toBeDefined();
      expect(metrics.endpointStats['GET:/test'].count).toBe(2);
      expect(metrics.endpointStats['GET:/test'].avgDuration).toBe(175);
      expect(metrics.endpointStats['GET:/test'].minDuration).toBe(150);
      expect(metrics.endpointStats['GET:/test'].maxDuration).toBe(200);
      
      expect(metrics.endpointStats['POST:/api/data']).toBeDefined();
      expect(metrics.endpointStats['POST:/api/data'].count).toBe(1);
      expect(metrics.endpointStats['POST:/api/data'].avgDuration).toBe(300);
    });

    test('should track response time histogram', () => {
      // Clear existing data
      performanceMonitor.metrics.responseTimeHistogram.clear();
      
      // Simulate different response times
      performanceMonitor.updateResponseTimeHistogram(50);   // 50ms bucket
      performanceMonitor.updateResponseTimeHistogram(150);  // 200ms bucket
      performanceMonitor.updateResponseTimeHistogram(250);  // 500ms bucket
      performanceMonitor.updateResponseTimeHistogram(1500); // 2000ms bucket
      performanceMonitor.updateResponseTimeHistogram(6000); // 5000+ bucket

      const histogram = performanceMonitor.metrics.responseTimeHistogram;
      
      expect(histogram.get('50ms')).toBe(1);
      expect(histogram.get('200ms')).toBe(1);
      expect(histogram.get('500ms')).toBe(1);
      expect(histogram.get('2000ms')).toBe(1);
      expect(histogram.get('5000+')).toBe(1);
    });

    test('should generate comprehensive metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveProperty('requestTimes');
      expect(metrics).toHaveProperty('slowQueries');
      expect(metrics).toHaveProperty('cacheStats');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('slowRequestCount');
      expect(metrics).toHaveProperty('endpointStats');
      expect(metrics).toHaveProperty('responseTimeHistogram');
    });

    test('should track slow queries', () => {
      // Clear existing slow queries
      performanceMonitor.metrics.slowQueries = [];
      
      // Add a slow query
      performanceMonitor.metrics.slowQueries.push({
        endpoint: 'GET:/slow-endpoint',
        duration: 1500,
        timestamp: new Date(),
        query: { test: 'value' },
        body: null
      });

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.slowQueries.length).toBe(1);
      expect(metrics.slowQueries[0].endpoint).toBe('GET:/slow-endpoint');
      expect(metrics.slowQueries[0].duration).toBe(1500);
    });
  });
});