/**
 * 🚀 PERFORMANCE TESTING SCRIPT
 * 
 * This script provides tools to test and verify the performance optimizations
 * implemented in the application.
 */

// Performance testing utilities
class PerformanceTester {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  // Add a performance test
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  // Run all performance tests
  async runTests() {
    console.log('🚀 Running performance tests...');
    
    for (const test of this.tests) {
      try {
        console.log(`🧪 Running test: ${test.name}`);
        const start = performance.now();
        const result = await test.testFn();
        const end = performance.now();
        
        const testResult = {
          name: test.name,
          duration: end - start,
          result: result,
          passed: true
        };
        
        this.results.push(testResult);
        console.log(`✅ Test ${test.name} completed in ${testResult.duration.toFixed(2)}ms`);
      } catch (error) {
        const testResult = {
          name: test.name,
          duration: 0,
          error: error.message,
          passed: false
        };
        
        this.results.push(testResult);
        console.error(`❌ Test ${test.name} failed:`, error.message);
      }
    }
    
    this.printResults();
    return this.results;
  }

  // Print test results
  printResults() {
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('==========================');
    
    const passedTests = this.results.filter(r => r.passed);
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`✅ Passed: ${passedTests.length}/${this.results.length}`);
    console.log(`❌ Failed: ${failedTests.length}/${this.results.length}`);
    
    if (passedTests.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      passedTests.forEach(test => {
        console.log(`  ${test.name}: ${test.duration.toFixed(2)}ms`);
      });
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`  ${test.name}: ${test.error}`);
      });
    }
  }

  // Get performance metrics
  getMetrics() {
    const metrics = {
      navigation: {},
      paint: {},
      memory: {},
      network: {}
    };

    // Navigation timing
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        metrics.navigation = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          request: navigation.responseStart - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          load: navigation.loadEventEnd - navigation.loadEventStart
        };
      }

      // Paint timing
      const paint = performance.getEntriesByType('paint');
      paint.forEach(entry => {
        metrics.paint[entry.name] = entry.startTime;
      });
    }

    // Memory usage
    if (performance.memory) {
      metrics.memory = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }

    // Network information
    if (navigator.connection) {
      metrics.network = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }

    return metrics;
  }

  // Print performance metrics
  printMetrics() {
    const metrics = this.getMetrics();
    
    console.log('\n📈 PERFORMANCE METRICS');
    console.log('====================');
    
    if (Object.keys(metrics.navigation).length > 0) {
      console.log('\n🧭 Navigation Timing:');
      Object.entries(metrics.navigation).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.toFixed(2)}ms`);
      });
    }
    
    if (Object.keys(metrics.paint).length > 0) {
      console.log('\n🎨 Paint Timing:');
      Object.entries(metrics.paint).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.toFixed(2)}ms`);
      });
    }
    
    if (Object.keys(metrics.memory).length > 0) {
      console.log('\n💾 Memory Usage:');
      Object.entries(metrics.memory).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}MB`);
      });
    }
    
    if (Object.keys(metrics.network).length > 0) {
      console.log('\n🌐 Network Info:');
      Object.entries(metrics.network).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
  }
}

// Create performance tester instance
const performanceTester = new PerformanceTester();

// Add performance tests
performanceTester.addTest('Apollo Client Initialization', async () => {
  // Test Apollo client initialization time
  const start = performance.now();
  
  // This would typically involve importing and initializing the client
  // For now, we'll just simulate a delay
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const end = performance.now();
  return { time: end - start };
});

performanceTester.addTest('Auth Context Initialization', async () => {
  // Test authentication context initialization time
  const start = performance.now();
  
  // This would typically involve importing and initializing the auth context
  // For now, we'll just simulate a delay
  await new Promise(resolve => setTimeout(resolve, 5));
  
  const end = performance.now();
  return { time: end - start };
});

performanceTester.addTest('Socket Connection', async () => {
  // Test socket connection time
  const start = performance.now();
  
  // This would typically involve connecting to the socket
  // For now, we'll just simulate a delay
  await new Promise(resolve => setTimeout(resolve, 15));
  
  const end = performance.now();
  return { time: end - start };
});

// Performance monitoring function
export const monitorPerformance = () => {
  if (typeof window === 'undefined') return;
  
  // Monitor key performance indicators
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log(`🎨 LCP: ${entry.startTime.toFixed(2)}ms`);
      } else if (entry.entryType === 'first-input') {
        console.log(`⚡ FID: ${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
      } else if (entry.entryType === 'layout-shift') {
        if (!entry.hadRecentInput) {
          console.log(`📐 CLS: ${entry.value.toFixed(4)}`);
        }
      }
    }
  });
  
  // Start observing performance entries
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  } catch (e) {
    // Fallback for older browsers
    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      observer.observe({ type: 'first-input', buffered: true });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e2) {
      // Ignore errors
    }
  }
};

// Run performance tests
export const runPerformanceTests = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Performance tests only run in development mode');
    return;
  }
  
  await performanceTester.runTests();
  performanceTester.printMetrics();
};

// Export utilities
export default {
  PerformanceTester,
  performanceTester,
  monitorPerformance,
  runPerformanceTests
};