"use client";
import { useState, useEffect } from 'react';
import { useTheme } from '../Helper/ThemeProvider';

export default function NetworkConnectivityHelper() {
  const { theme } = useTheme();
  const [error, setError] = useState(null);
  const [showHelper, setShowHelper] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState(null);

  useEffect(() => {
    const handleNetworkError = (event) => {
      console.log('🌐 Network connectivity error detected:', event.detail);
      setError(event.detail);
      setShowHelper(true);
      setLastErrorTime(new Date().toLocaleTimeString());
    };

    window.addEventListener('network-connectivity-error', handleNetworkError);
    
    return () => {
      window.removeEventListener('network-connectivity-error', handleNetworkError);
    };
  }, []);

  const handleDismiss = () => {
    setShowHelper(false);
    setError(null);
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'query { hello }'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('✅ Connection test successful! ' + JSON.stringify(result.data));
        setShowHelper(false);
      } else {
        alert('❌ Connection test failed with status: ' + response.status);
      }
    } catch (err) {
      alert('❌ Connection test failed: ' + err.message);
    }
  };

  const handleOpenBackend = () => {
    window.open('http://localhost:45799/graphql', '_blank');
  };

  if (!showHelper) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className={`rounded-lg shadow-lg border-l-4 border-red-500 p-4 ${
        theme === 'dark' 
          ? 'bg-gray-800 text-white border-gray-700' 
          : 'bg-white text-gray-900 border-gray-200'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Network Connection Issue
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-400">
              <p className="mb-2">
                Failed to connect to the backend server for operation: <strong>{error?.operationName}</strong>
              </p>
              {lastErrorTime && (
                <p className="text-xs text-gray-500 mb-2">Last error: {lastErrorTime}</p>
              )}
              <p className="text-xs">
                {error?.suggestion}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleTestConnection}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Test Connection
              </button>
              <button
                onClick={handleOpenBackend}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Open GraphQL
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}