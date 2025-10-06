"use client";

import { useState } from 'react';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';

export default function AutoLoginTest() {
  const { 
    login, 
    isAuthenticated, 
    isLoading, 
    error, 
    user,
    checkBackendHealth,
    _debug 
  } = useFixedSecureAuth();
  
  const [testCredentials, setTestCredentials] = useState({
    identifier: 'testuser@example.com',
    password: 'testpass123'
  });
  const [isTestingLogin, setIsTestingLogin] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);

  const testBackendConnection = async () => {
    try {
      const health = await checkBackendHealth();
      setBackendHealth(health);
    } catch (error) {
      setBackendHealth({ healthy: false, error: error.message });
    }
  };

  const testLogin = async () => {
    setIsTestingLogin(true);
    try {
      const result = await login(testCredentials);
      console.log('🔐 Login test result:', result);
    } catch (error) {
      console.error('❌ Login test error:', error);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const testSessionStatus = async () => {
    try {
      const response = await fetch('http://localhost:45799/api/auth/session-status', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      console.log('🔍 Session status:', data);
      return data;
    } catch (error) {
      console.error('❌ Session status error:', error);
      return { error: error.message };
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔧 Autologin Test Tool</h2>
      
      {/* Authentication Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Current Auth Status</h3>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <div className="text-sm">
              <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
            </div>
            <div className="text-sm">
              <strong>User:</strong> {user ? `${user.username} (${user.profileid})` : 'None'}
            </div>
            <div className="text-sm">
              <strong>Error:</strong> {error || 'None'}
            </div>
            {_debug && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer">Debug Info</summary>
                <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                  {JSON.stringify(_debug, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Backend Health</h3>
          <button
            onClick={testBackendConnection}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mb-2"
          >
            Test Backend
          </button>
          {backendHealth && (
            <div className="text-sm">
              <div className={backendHealth.healthy ? 'text-green-600' : 'text-red-600'}>
                Status: {backendHealth.healthy ? 'Healthy' : 'Unhealthy'}
              </div>
              {backendHealth.error && (
                <div className="text-red-600">Error: {backendHealth.error}</div>
              )}
              <pre className="text-xs bg-gray-100 p-1 mt-1 rounded overflow-auto">
                {JSON.stringify(backendHealth, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Test Login */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-lg mb-2">Test Login</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email/Username:
            </label>
            <input
              type="text"
              value={testCredentials.identifier}
              onChange={(e) => setTestCredentials(prev => ({ ...prev, identifier: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="testuser@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password:
            </label>
            <input
              type="password"
              value={testCredentials.password}
              onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="testpass123"
            />
          </div>
        </div>
        <button
          onClick={testLogin}
          disabled={isTestingLogin || !testCredentials.identifier || !testCredentials.password}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded text-sm mr-3"
        >
          {isTestingLogin ? 'Testing...' : 'Test Login'}
        </button>
        <button
          onClick={testSessionStatus}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
        >
          Check Session Status
        </button>
      </div>

      {/* Quick Instructions */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2 text-yellow-800">How to Fix Autologin</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. <strong>Create a test account:</strong> Use the signup form or create one manually in the backend</li>
          <li>2. <strong>Test login:</strong> Use the form above to test login with valid credentials</li>
          <li>3. <strong>Check cookies:</strong> After successful login, check browser cookies for authentication tokens</li>
          <li>4. <strong>Test autologin:</strong> Refresh the page to see if autologin works with the stored tokens</li>
        </ol>
      </div>
    </div>
  );
}