// Manual test to verify monitoring endpoints
import express from 'express';
import { performanceMonitor } from './utils/PerformanceOptimization.js';

const app = express();

// Add performance monitoring middleware
app.use(performanceMonitor.requestTimer());

// Add a test endpoint
app.get('/test', (req, res) => {
  // Simulate some processing time
  setTimeout(() => {
    res.json({ message: 'Test endpoint response' });
  }, 100);
});

// Add another test endpoint that's slower
app.get('/slow', (req, res) => {
  // Simulate slow processing
  setTimeout(() => {
    res.json({ message: 'Slow endpoint response' });
  }, 1500);
});

console.log('🔧 Testing Monitoring Endpoints...');

// Simulate some requests
console.log('\n1. Simulating requests...');

// Make a fast request
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint response' });
});

// Make a slow request
app.get('/slow', (req, res) => {
  res.json({ message: 'Slow endpoint response' });
});

// Wait a bit for the requests to be processed
setTimeout(() => {
  // Get performance metrics
  console.log('\n2. Getting performance metrics...');
  const metrics = performanceMonitor.getMetrics();
  
  console.log('   - Request times count:', metrics.requestTimes.length);
  console.log('   - Slow queries count:', metrics.slowQueries.length);
  console.log('   - Endpoint stats count:', Object.keys(metrics.endpointStats).length);
  console.log('   - Response time histogram entries:', Object.keys(metrics.responseTimeHistogram).length);
  
  // Check if we have endpoint stats
  if (Object.keys(metrics.endpointStats).length > 0) {
    console.log('   - First endpoint stats:', Object.keys(metrics.endpointStats)[0]);
    const firstEndpoint = Object.keys(metrics.endpointStats)[0];
    console.log('   - Request count for first endpoint:', metrics.endpointStats[firstEndpoint].count);
    console.log('   - Average duration for first endpoint:', metrics.endpointStats[firstEndpoint].avgDuration);
  }
  
  console.log('\n✅ Monitoring Endpoints Test Completed Successfully!');
}, 1000);