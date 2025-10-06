"use client";

import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import { useState } from 'react';

export default function AuthTest() {
  const auth = useFixedSecureAuth();
  const [testResults, setTestResults] = useState([]);
  
  const addResult = (test, result, error = null) => {
    setTestResults(prev => [...prev, {
      test,
      result,
      error,
      timestamp: new Date().toISOString()
    }]);
  };

  const testLogin = async () => {
    addResult('login_start', 'Starting login test...');
    
    try {
      const result = await auth.login({
        identifier: 'aditya_123',  // Using the actual database user
        password: 'ADutya@1234'   // Correct password for aditya_123 user (fixed typo)
      });
      
      addResult('login_complete', result.success ? 'SUCCESS' : 'FAILED', result.error);
    } catch (error) {
      addResult('login_complete', 'ERROR', error.message);
    }
  };

  const testAuth = async () => {
    addResult('auth_check', 'Checking authentication status...');
    
    try {
      // Test the backend endpoint directly
      const response = await fetch('http://localhost:45799/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      addResult('auth_check_complete', response.status === 200 ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED', data);
    } catch (error) {
      addResult('auth_check_complete', 'ERROR', error.message);
    }
  };

  return (
    <div className="fixed top-4 left-4 bg-white/95 border border-gray-200 rounded-lg p-4 max-w-md z-[10000] shadow-lg">
      <h3 className="font-bold text-lg mb-4">🧪 Auth Test Panel</h3>
      
      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <strong>Status:</strong> {auth.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </div>
        <div className="text-sm">
          <strong>Loading:</strong> {auth.isLoading ? '⏳ Yes' : '✅ No'}
        </div>
        <div className="text-sm">
          <strong>User:</strong> {auth.user ? auth.user.username : 'None'}
        </div>
        {auth.error && (
          <div className="text-sm text-red-600">
            <strong>Error:</strong> {typeof auth.error === 'string' ? auth.error : JSON.stringify(auth.error)}
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <button 
          onClick={testAuth}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Test Auth Status
        </button>
        <button 
          onClick={testLogin}
          className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Test Login
        </button>
      </div>
      
      <div className="border-t pt-3">
        <h4 className="font-semibold text-sm mb-2">Test Results:</h4>
        <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
          {testResults.slice(-5).map((result, i) => (
            <div key={i} className={`p-2 rounded ${
              result.result.includes('SUCCESS') || result.result.includes('AUTHENTICATED') 
                ? 'bg-green-100' 
                : result.result.includes('ERROR') || result.result.includes('FAILED')
                ? 'bg-red-100'
                : 'bg-gray-100'
            }`}>
              <div className="font-medium">{result.test}</div>
              <div>{result.result}</div>
              {result.error && (
                <div className="text-red-600 mt-1">{typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}