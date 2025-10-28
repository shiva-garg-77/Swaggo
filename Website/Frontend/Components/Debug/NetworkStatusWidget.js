"use client";
import { useState, useEffect } from 'react';

export default function NetworkDiagnosticHelper() {
  const [networkStatus, setNetworkStatus] = useState({
    backendStatus: 'checking',
    graphqlStatus: 'checking',
    lastCheck: null
  });
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false); // Start hidden

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-4), { message, type, timestamp }]);
  };

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET'
      });
      
      if (response.ok) {
        const result = await response.json();
        addLog(`Backend: ${result.status || 'ok'}`, 'success');
        return 'online';
      } else {
        addLog(`Backend error: ${response.status}`, 'error');
        return 'error';
      }
    } catch (error) {
      addLog(`Backend offline: ${error.message}`, 'error');
      return 'offline';
    }
  };

  const checkGraphQLStatus = async () => {
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data?.hello) {
          addLog('GraphQL proxy working', 'success');
          return 'online';
        } else {
          addLog('GraphQL data invalid', 'error');
          return 'error';
        }
      } else {
        addLog(`GraphQL proxy error: ${response.status}`, 'error');
        return 'error';
      }
    } catch (error) {
      addLog(`GraphQL proxy failed: ${error.message}`, 'error');
      return 'offline';
    }
  };

  const runDiagnostics = async () => {
    addLog('Starting diagnostics...', 'info');
    setNetworkStatus(prev => ({ ...prev, lastCheck: new Date() }));
    
    const [backendStatus, graphqlStatus] = await Promise.all([
      checkBackendStatus(),
      checkGraphQLStatus()
    ]);
    
    setNetworkStatus({
      backendStatus,
      graphqlStatus,
      lastCheck: new Date()
    });
    
    addLog('Diagnostics complete', 'info');
    
    // Auto-show if there are errors
    if (backendStatus !== 'online' || graphqlStatus !== 'online') {
      setIsVisible(true);
    }
  };

  useEffect(() => {
    runDiagnostics();
    const interval = setInterval(runDiagnostics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show error notification in corner if hidden
  if (!isVisible) {
    const hasErrors = networkStatus.backendStatus === 'offline' || networkStatus.graphqlStatus === 'offline';
    if (!hasErrors) return null;
    
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="px-3 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-lg animate-pulse"
        >
          🚨 Network Issues
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '✅';
      case 'offline': return '❌';
      case 'error': return '❌';
      case 'checking': return '🔍';
      default: return '❓';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80">
      <div className="rounded-lg shadow-xl border bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-sm">🔧 Network Status</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={runDiagnostics}
              className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Backend Server</span>
            <span className={getStatusColor(networkStatus.backendStatus)}>
              {getStatusIcon(networkStatus.backendStatus)} {networkStatus.backendStatus}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>GraphQL Proxy</span>
            <span className={getStatusColor(networkStatus.graphqlStatus)}>
              {getStatusIcon(networkStatus.graphqlStatus)} {networkStatus.graphqlStatus}
            </span>
          </div>
          
          {networkStatus.lastCheck && (
            <div className="text-xs text-gray-500 mt-2">
              Last checked: {networkStatus.lastCheck.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {logs.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs font-medium mb-2">Activity Log:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-xs flex items-start space-x-2">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span className={log.type === 'success' ? 'text-green-600' : log.type === 'error' ? 'text-red-600' : 'text-blue-600'}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}