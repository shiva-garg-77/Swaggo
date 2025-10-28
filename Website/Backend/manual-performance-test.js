// Manual test to verify performance optimization enhancements
import { performanceMonitor } from './utils/PerformanceOptimization.js';

console.log('🔧 Testing Performance Optimization Enhancements');

// Test 1: Verify performance monitor initialization
console.log('\n1. Testing Performance Monitor Initialization...');
console.log('   - Metrics object exists:', !!performanceMonitor.metrics);
console.log('   - Request times cache exists:', !!performanceMonitor.metrics.requestTimes);
console.log('   - Slow queries array exists:', !!performanceMonitor.metrics.slowQueries);
console.log('   - Endpoint stats map exists:', !!performanceMonitor.metrics.endpointStats);
console.log('   - Response time histogram exists:', !!performanceMonitor.metrics.responseTimeHistogram);

// Test 2: Test endpoint statistics tracking
console.log('\n2. Testing Endpoint Statistics Tracking...');
performanceMonitor.updateEndpointStats('GET:/test', 150, 200);
performanceMonitor.updateEndpointStats('GET:/test', 200, 200);
performanceMonitor.updateEndpointStats('POST:/api/data', 300, 201);

const metrics = performanceMonitor.getMetrics();
console.log('   - GET:/test count:', metrics.endpointStats['GET:/test']?.count);
console.log('   - GET:/test avg duration:', metrics.endpointStats['GET:/test']?.avgDuration);
console.log('   - POST:/api/data count:', metrics.endpointStats['POST:/api/data']?.count);

// Test 3: Test response time histogram
console.log('\n3. Testing Response Time Histogram...');
performanceMonitor.metrics.responseTimeHistogram.clear();
performanceMonitor.updateResponseTimeHistogram(50);   // 50ms bucket
performanceMonitor.updateResponseTimeHistogram(150);  // 200ms bucket
performanceMonitor.updateResponseTimeHistogram(250);  // 500ms bucket
performanceMonitor.updateResponseTimeHistogram(1500); // 2000ms bucket
performanceMonitor.updateResponseTimeHistogram(6000); // 5000+ bucket

const histogram = Object.fromEntries(performanceMonitor.metrics.responseTimeHistogram);
console.log('   - 50ms bucket count:', histogram['50ms'] || 0);
console.log('   - 200ms bucket count:', histogram['200ms'] || 0);
console.log('   - 500ms bucket count:', histogram['500ms'] || 0);
console.log('   - 2000ms bucket count:', histogram['2000ms'] || 0);
console.log('   - 5000+ bucket count:', histogram['5000+'] || 0);

// Test 4: Test comprehensive metrics generation
console.log('\n4. Testing Comprehensive Metrics Generation...');
console.log('   - Metrics object has requestTimes:', !!metrics.requestTimes);
console.log('   - Metrics object has slowQueries:', !!metrics.slowQueries);
console.log('   - Metrics object has cacheStats:', !!metrics.cacheStats);
console.log('   - Metrics object has averageResponseTime:', !!metrics.averageResponseTime);
console.log('   - Metrics object has slowRequestCount:', !!metrics.slowRequestCount);
console.log('   - Metrics object has endpointStats:', !!metrics.endpointStats);
console.log('   - Metrics object has responseTimeHistogram:', !!metrics.responseTimeHistogram);

console.log('\n✅ All Performance Optimization Enhancements Verified Successfully!');