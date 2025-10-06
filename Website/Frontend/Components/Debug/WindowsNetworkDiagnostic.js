"use client";
import { useState, useEffect } from 'react';

export default function WindowsNetworkDiagnostic() {
  const [diagnostics, setDiagnostics] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const addDiagnostic = (test, status, details, metadata = {}) => {
    setDiagnostics(prev => [...prev, {
      test,
      status,
      details,
      metadata,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runNetworkDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    
    try {
      // Test 1: Basic Connectivity
      addDiagnostic('Basic Connectivity', 'RUNNING', 'Testing localhost:45799 connectivity...');
      
      try {
        const response = await fetch('http://localhost:45799/health', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          addDiagnostic('Basic Connectivity', 'SUCCESS', 'Backend is reachable', {
            status: data.status,
            port: data.port
          });
        } else {
          addDiagnostic('Basic Connectivity', 'ERROR', `HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        addDiagnostic('Basic Connectivity', 'ERROR', `Connection failed: ${error.message}`);
      }

      // Test 2: CORS Headers Check
      addDiagnostic('CORS Headers', 'RUNNING', 'Checking CORS configuration...');
      
      try {
        const corsResponse = await fetch('http://localhost:45799/graphql', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, X-Requested-With, X-CSRF-Token'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        const corsHeaders = {
          'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers'),
          'Access-Control-Allow-Credentials': corsResponse.headers.get('Access-Control-Allow-Credentials')
        };
        
        const corsOk = corsHeaders['Access-Control-Allow-Origin'] && 
                       corsHeaders['Access-Control-Allow-Methods']?.includes('POST');
        
        addDiagnostic('CORS Headers', corsOk ? 'SUCCESS' : 'WARNING', 
          corsOk ? 'CORS headers are properly configured' : 'CORS headers may be incomplete', 
          corsHeaders);
          
      } catch (error) {
        addDiagnostic('CORS Headers', 'ERROR', `CORS preflight failed: ${error.message}`);
      }

      // Test 3: GraphQL Endpoint Test
      addDiagnostic('GraphQL Endpoint', 'RUNNING', 'Testing GraphQL endpoint...');
      
      try {
        const gqlResponse = await fetch('http://localhost:45799/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': 'dev-token',
            'Origin': 'http://localhost:3000'
          },
          credentials: 'include',
          body: JSON.stringify({
            query: '{ __schema { queryType { name } } }'
          }),
          signal: AbortSignal.timeout(10000)
        });
        
        if (gqlResponse.ok) {
          const gqlData = await gqlResponse.json();
          addDiagnostic('GraphQL Endpoint', 'SUCCESS', 'GraphQL endpoint is working', {
            queryType: gqlData.data?.__schema?.queryType?.name
          });
        } else {
          const errorText = await gqlResponse.text();
          addDiagnostic('GraphQL Endpoint', 'ERROR', `GraphQL ${gqlResponse.status}: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        addDiagnostic('GraphQL Endpoint', 'ERROR', `GraphQL request failed: ${error.message}`);
      }

      // Test 4: Cookie/Domain Check
      addDiagnostic('Cookie Configuration', 'RUNNING', 'Checking cookie configuration...');
      
      const cookies = document.cookie;
      const hasCookies = cookies && cookies.length > 0;
      const hasCSRFToken = cookies.includes('csrf-token') || cookies.includes('XSRF-TOKEN');
      
      addDiagnostic('Cookie Configuration', 
        hasCookies ? 'SUCCESS' : 'WARNING', 
        hasCookies ? `${cookies.split(';').length} cookies found` : 'No cookies found',
        { hasCSRFToken, cookiePreview: cookies.substring(0, 100) + '...' }
      );

      // Test 5: Windows Firewall Check
      addDiagnostic('Windows Environment', 'RUNNING', 'Checking Windows-specific issues...');
      
      const userAgent = navigator.userAgent;
      const isWindows = userAgent.includes('Windows');
      const isLocalhost = window.location.hostname === 'localhost';
      const protocol = window.location.protocol;
      
      const windowsIssues = [];
      if (isWindows && isLocalhost && protocol === 'http:') {
        windowsIssues.push('HTTP on localhost may have Windows Defender restrictions');
      }
      
      addDiagnostic('Windows Environment', windowsIssues.length === 0 ? 'SUCCESS' : 'WARNING',
        windowsIssues.length === 0 ? 'No Windows-specific issues detected' : `${windowsIssues.length} potential issues`,
        { isWindows, isLocalhost, protocol, issues: windowsIssues }
      );

      // Test 6: Performance Test
      addDiagnostic('Performance Test', 'RUNNING', 'Testing request performance...');
      
      const startTime = performance.now();
      try {
        await fetch('http://localhost:45799/health', {
          signal: AbortSignal.timeout(3000)
        });
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        addDiagnostic('Performance Test', duration < 1000 ? 'SUCCESS' : 'WARNING',
          `Request completed in ${duration.toFixed(0)}ms`,
          { duration, threshold: 1000 }
        );
      } catch (error) {
        addDiagnostic('Performance Test', 'ERROR', `Performance test failed: ${error.message}`);
      }

    } catch (error) {
      addDiagnostic('Diagnostic Error', 'ERROR', `Diagnostic suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!showDiagnostic) {
    return (
      <div className="fixed bottom-16 right-4 z-50">
        <button
          onClick={() => setShowDiagnostic(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
        >
          🔧 Network Diagnostic
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
        <h2 className="font-semibold">Windows Network Diagnostic</h2>
        <button
          onClick={() => setShowDiagnostic(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={runNetworkDiagnostics}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded text-sm"
          >
            {isRunning ? '🔄 Running...' : '🚀 Run Full Diagnostic'}
          </button>
          <button
            onClick={() => setDiagnostics([])}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
          >
            Clear Results
          </button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {diagnostics.length === 0 && !isRunning ? (
            <div className="text-gray-500 text-sm text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔧</span>
                </div>
              </div>
              <p>Click "Run Full Diagnostic" to test network connectivity</p>
              <p className="text-xs mt-2">This will test GraphQL endpoint, CORS, cookies, and Windows-specific issues</p>
            </div>
          ) : (
            diagnostics.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.status === 'SUCCESS'
                    ? 'bg-green-50 border-green-400 dark:bg-green-900/20'
                    : result.status === 'WARNING'
                    ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20'
                    : result.status === 'RUNNING'
                    ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20'
                    : 'bg-red-50 border-red-400 dark:bg-red-900/20'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">{result.test}</span>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                <div className={`text-sm ${
                  result.status === 'SUCCESS' ? 'text-green-700 dark:text-green-300' 
                  : result.status === 'WARNING' ? 'text-yellow-700 dark:text-yellow-300'
                  : result.status === 'RUNNING' ? 'text-blue-700 dark:text-blue-300'
                  : 'text-red-700 dark:text-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={
                      result.status === 'SUCCESS' ? '✅' 
                      : result.status === 'WARNING' ? '⚠️'
                      : result.status === 'RUNNING' ? '🔄'
                      : '❌'
                    }>
                      {result.status === 'SUCCESS' ? '✅' 
                       : result.status === 'WARNING' ? '⚠️'
                       : result.status === 'RUNNING' ? '🔄'
                       : '❌'}
                    </span>
                    <strong>{result.status}:</strong> {result.details}
                  </div>
                </div>
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <details className="cursor-pointer">
                      <summary>View Details</summary>
                      <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        {JSON.stringify(result.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Environment Info */}
        <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          <h3 className="font-medium mb-2">Environment Info:</h3>
          <div>OS: {navigator.platform}</div>
          <div>Browser: {navigator.userAgent.split(' ').slice(-2).join(' ')}</div>
          <div>Frontend: {window.location.origin}</div>
          <div>Backend: http://localhost:45799</div>
          <div>Environment: {process.env.NODE_ENV}</div>
        </div>
      </div>
    </div>
  );
}