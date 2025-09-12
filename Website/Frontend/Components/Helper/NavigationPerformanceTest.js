'use client';

import { useState, useEffect } from 'react';
import { useUltraFastNavigation } from './UltraFastNavigation';
import { motion, AnimatePresence } from 'framer-motion';

const NavigationPerformanceTest = ({ enabled = false }) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { navigateUltraFast, isReady } = useUltraFastNavigation();

  const testRoutes = ['/home', '/Profile', '/create', '/reel', '/message', '/dashboard'];

  const runPerformanceTest = async () => {
    if (!isReady) {
      console.warn('Ultra-fast navigation not ready');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setShowResults(true);

    const results = [];

    for (const route of testRoutes) {
      const startTime = performance.now();
      
      try {
        await navigateUltraFast(route);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        results.push({
          route,
          duration: duration.toFixed(2),
          status: 'success',
          timestamp: new Date().toLocaleTimeString()
        });

        console.log(`🚀 Navigation to ${route}: ${duration.toFixed(2)}ms`);
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        results.push({
          route,
          duration: duration.toFixed(2),
          status: 'error',
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        });

        console.error(`❌ Navigation to ${route} failed:`, error);
      }

      // Update results in real-time
      setTestResults([...results]);
    }

    setIsRunning(false);
    
    // Calculate averages
    const successfulTests = results.filter(r => r.status === 'success');
    const averageTime = successfulTests.reduce((sum, r) => sum + parseFloat(r.duration), 0) / successfulTests.length;
    
    console.log(`📊 Performance Test Complete:`);
    console.log(`   Average Navigation Time: ${averageTime.toFixed(2)}ms`);
    console.log(`   Successful: ${successfulTests.length}/${results.length}`);
    console.log(`   Total Test Time: ${results.reduce((sum, r) => sum + parseFloat(r.duration), 0).toFixed(2)}ms`);
  };

  if (!enabled) return null;

  return (
    <AnimatePresence>
      {showResults && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-[9999] bg-black/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/20 max-w-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Navigation Performance</h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <motion.div
                key={`${result.route}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                  result.status === 'success' 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={result.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {result.status === 'success' ? '🚀' : '❌'}
                  </span>
                  <span className="font-mono">{result.route}</span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${result.status === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {result.duration}ms
                  </div>
                  <div className="text-white/50 text-xs">{result.timestamp}</div>
                </div>
              </motion.div>
            ))}
            
            {testResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: testResults.length * 0.1 + 0.2 }}
                className="border-t border-white/20 pt-2 mt-2"
              >
                <div className="text-xs text-white/70">
                  Average: {testResults
                    .filter(r => r.status === 'success')
                    .reduce((sum, r) => sum + parseFloat(r.duration), 0) / 
                    testResults.filter(r => r.status === 'success').length || 0}ms
                </div>
                <div className="text-xs text-white/70">
                  Success Rate: {testResults.filter(r => r.status === 'success').length}/{testResults.length}
                </div>
              </motion.div>
            )}
          </div>

          {!isRunning && testResults.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={runPerformanceTest}
              disabled={!isReady}
              className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              {isReady ? '🚀 Run Speed Test' : '⏳ Initializing...'}
            </motion.button>
          )}

          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center mt-2 text-sm"
            >
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Running tests...
            </motion.div>
          )}
        </motion.div>
      )}
      
      {/* Floating test button */}
      {!showResults && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowResults(true)}
          className="fixed bottom-4 right-4 z-[9999] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white p-3 rounded-full shadow-lg"
          title="Test Navigation Performance"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default NavigationPerformanceTest;
