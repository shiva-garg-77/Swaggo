'use client';

import React, { useState, useEffect } from 'react';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext.jsx';
import { useSocket } from '../Helper/SocketProvider';
import notificationService from '../../services/UnifiedNotificationService.js';
import { io } from 'socket.io-client';

const ServiceDebug = () => {
  const { user, isAuthenticated } = useFixedSecureAuth();
  const { socket, isConnected, connectionStatus } = useSocket();
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    const runDiagnostics = async () => {
      const info = {
        // Authentication
        isAuthenticated,
        hasUser: !!user,
        userId: user?.profileid,
        
        // Environment
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
        graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL,
        
        // Socket
        hasSocket: !!socket,
        socketConnected: isConnected,
        connectionStatus,
        socketId: socket?.id,
        
        // Notification Service
        notificationSupported: 'Notification' in window,
        notificationPermission: typeof window !== 'undefined' ? Notification.permission : 'unknown',
        serviceReady: notificationService.isReady ? notificationService.isReady() : false,
        servicePermission: notificationService.getPermissionStatus ? notificationService.getPermissionStatus() : 'unknown',
        
        // Browser
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
        serviceWorkerSupported: 'serviceWorker' in navigator,
        onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : false,
      };
      
      setDebugInfo(info);
    };

    runDiagnostics();
    
    // Re-run every 2 seconds
    const interval = setInterval(runDiagnostics, 2000);
    
    return () => clearInterval(interval);
  }, [user, isAuthenticated, socket, isConnected, connectionStatus]);

  const testBackendConnection = async () => {
    const results = {};
    
    try {
      // Test 1: Basic HTTP connection
      console.log('🔍 Testing backend HTTP connection...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/health`);
      results.httpConnection = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      results.httpConnection = {
        success: false,
        error: error.message
      };
    }

    try {
      // Test 2: GraphQL endpoint
      console.log('🔍 Testing GraphQL endpoint...');
      const gqlResponse = await fetch(`${process.env.NEXT_PUBLIC_GRAPHQL_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: '{ __typename }'
        })
      });
      const gqlData = await gqlResponse.json();
      results.graphqlConnection = {
        success: !gqlData.errors,
        data: gqlData
      };
    } catch (error) {
      results.graphqlConnection = {
        success: false,
        error: error.message
      };
    }

    try {
      // Test 3: Direct Socket.IO connection
      console.log('🔍 Testing direct Socket.IO connection...');
      const testSocket = io(process.env.NEXT_PUBLIC_SERVER_URL, {
        autoConnect: false,
        timeout: 5000
      });
      
      const socketTest = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        testSocket.on('connect', () => {
          clearTimeout(timeout);
          resolve({
            success: true,
            socketId: testSocket.id
          });
          testSocket.disconnect();
        });
        
        testSocket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
          testSocket.disconnect();
        });
      });
      
      testSocket.connect();
      results.socketConnection = await socketTest;
      
    } catch (error) {
      results.socketConnection = {
        success: false,
        error: error.message
      };
    }

    try {
      // Test 4: Notification service
      console.log('🔍 Testing notification service...');
      await notificationService.initialize(user?.profileid || 'test-user');
      results.notificationService = {
        success: true,
        ready: notificationService.isReady(),
        permission: notificationService.getPermissionStatus()
      };
    } catch (error) {
      results.notificationService = {
        success: false,
        error: error.message
      };
    }

    setTestResults(results);
  };

  const testNotification = async () => {
    try {
      if (notificationService.testNotification) {
        await notificationService.testNotification();
      } else {
        await notificationService.showNotification('Test Notification', {
          body: 'This is a test notification from SwagGo',
          icon: '/icons/notification-icon-192.png'
        });
      }
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const getStatusColor = (isGood) => {
    return isGood ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto">
      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Service Debug Panel</h3>
      
      {/* Real-time Status */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Real-time Status</h4>
        <div className="space-y-1 text-sm">
          <div>Auth: <span className={getStatusColor(debugInfo.isAuthenticated)}>{debugInfo.isAuthenticated ? '✓ Authenticated' : '✗ Not authenticated'}</span></div>
          <div>User: <span className={getStatusColor(debugInfo.hasUser)}>{debugInfo.hasUser ? `✓ ${debugInfo.userId}` : '✗ No user'}</span></div>
          <div>Socket: <span className={getStatusColor(debugInfo.socketConnected)}>{debugInfo.socketConnected ? '✓ Connected' : '✗ Disconnected'}</span></div>
          <div>Status: <span className="text-blue-500">{debugInfo.connectionStatus}</span></div>
          <div>Notifications: <span className={getStatusColor(debugInfo.serviceReady)}>{debugInfo.serviceReady ? '✓ Ready' : '✗ Not ready'}</span></div>
          <div>Permission: <span className="text-blue-500">{debugInfo.servicePermission}</span></div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Environment</h4>
        <div className="space-y-1 text-xs">
          <div>Server: {debugInfo.serverUrl}</div>
          <div>GraphQL: {debugInfo.graphqlUrl}</div>
          <div>Online: <span className={getStatusColor(debugInfo.onlineStatus)}>{debugInfo.onlineStatus ? '✓' : '✗'}</span></div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-4 space-y-2">
        <button
          onClick={testBackendConnection}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Run Connection Tests
        </button>
        <button
          onClick={testNotification}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Test Notification
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Test Results</h4>
          <div className="space-y-2 text-xs">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test}>
                <div className="font-medium">{test}:</div>
                <div className={getStatusColor(result.success)}>
                  {result.success ? '✓ Success' : '✗ Failed'}
                  {result.error && <div className="text-red-500">Error: {result.error}</div>}
                  {result.data && <div className="text-gray-600">Data: {JSON.stringify(result.data).slice(0, 100)}...</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDebug;