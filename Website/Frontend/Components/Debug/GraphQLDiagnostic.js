"use client";

import { useState } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import { TEST_GRAPHQL, CHECK_PROFILE_EXISTS } from '../../lib/graphql/fixedProfileQueries';
import { GET_DRAFTS_QUERY } from '../../lib/graphql/profileQueries';

export default function GraphQLDiagnostic() {
  const { user, isAuthenticated } = useFixedSecureAuth();
  const [testResults, setTestResults] = useState([]);
  const [enhancedDiagnostics, setEnhancedDiagnostics] = useState(null);
  const [securityStatus, setSecurityStatus] = useState('checking');

  // 🔒 SECURITY-ENHANCED: Test basic GraphQL connectivity with security context
  const { data: helloData, error: helloError, loading: helloLoading } = useQuery(TEST_GRAPHQL, {
    context: {
      operationType: 'diagnostics',
      securityLevel: 'low',
      auditRequired: true
    }
  });

  // 🔒 SECURITY-MAINTAINED: Lazy queries for testing with security awareness
  const [testProfile, { data: profileData, error: profileError, loading: profileLoading }] = useLazyQuery(CHECK_PROFILE_EXISTS);
  const [testDrafts, { data: draftsData, error: draftsError, loading: draftsLoading }] = useLazyQuery(GET_DRAFTS_QUERY);

  const addTestResult = (test, result, error = null) => {
    const timestamp = new Date().toISOString();
    setTestResults(prev => [...prev, { test, result, error, timestamp }]);
  };

  const runTests = async () => {
    setTestResults([]);
    
    // Test 1: Basic connectivity
    addTestResult('GraphQL Hello', helloData ? 'SUCCESS' : 'FAILED', helloError?.message);
    
    // Test 2: User authentication status
    addTestResult('Authentication Status', isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    addTestResult('User Context', user ? `Username: ${user.username}, ProfileID: ${user.profileid}` : 'NO USER');
    
    // Test 3: Profile query
    try {
      await testProfile({ variables: { username: null } });
      addTestResult('Profile Query (null username)', profileData ? 'SUCCESS' : 'PENDING');
    } catch (err) {
      addTestResult('Profile Query (null username)', 'FAILED', err.message);
    }
    
    // Test 4: Drafts query with known profile ID
    if (user?.profileid) {
      try {
        await testDrafts({ variables: { profileid: user.profileid } });
        addTestResult('Drafts Query (own profile)', draftsData ? 'SUCCESS' : 'PENDING');
      } catch (err) {
        addTestResult('Drafts Query (own profile)', 'FAILED', err.message);
      }
    }
    
    // Test 5: Drafts query with test profile ID
    try {
      await testDrafts({ variables: { profileid: "89a3277c-0bb9-4bad-9137-a22e4f9d885" } });
      addTestResult('Drafts Query (test profile)', 'TEST EXECUTED');
    } catch (err) {
      addTestResult('Drafts Query (test profile)', 'FAILED', err.message);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return <div>GraphQL Diagnostic only available in development mode</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔧 GraphQL Diagnostic Tool</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Authentication Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Authentication Status</h3>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <div className="text-sm text-gray-600">
              User: {user ? `${user.username} (${user.profileid})` : 'None'}
            </div>
          </div>
        </div>

        {/* Basic GraphQL Test */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">GraphQL Connectivity</h3>
          <div className="space-y-2">
            {helloLoading && <div className="text-blue-600">Loading...</div>}
            {helloError && <div className="text-red-600">Error: {helloError.message}</div>}
            {helloData && <div className="text-green-600">✅ Connected: {helloData.hello}</div>}
          </div>
        </div>
      </div>

      {/* Test Runner */}
      <div className="mb-6">
        <button
          onClick={runTests}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          disabled={helloLoading || profileLoading || draftsLoading}
        >
          {helloLoading || profileLoading || draftsLoading ? 'Running Tests...' : 'Run Diagnostic Tests'}
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Test Results</h3>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border">
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                  result.result.includes('SUCCESS') || result.result.includes('AUTHENTICATED') ? 'bg-green-500' :
                  result.result.includes('FAILED') ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{result.test}</div>
                  <div className="text-sm text-gray-600">{result.result}</div>
                  {result.error && (
                    <div className="text-xs text-red-600 mt-1">{result.error}</div>
                  )}
                  <div className="text-xs text-gray-400">{result.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Display */}
      <details className="mt-6">
        <summary className="cursor-pointer font-medium text-gray-700">🔍 Raw Data (Click to expand)</summary>
        <div className="mt-4 space-y-4 text-xs">
          <div>
            <h4 className="font-medium">Hello Data:</h4>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(helloData, null, 2)}</pre>
          </div>
          <div>
            <h4 className="font-medium">Profile Data:</h4>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(profileData, null, 2)}</pre>
          </div>
          <div>
            <h4 className="font-medium">Drafts Data:</h4>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(draftsData, null, 2)}</pre>
          </div>
        </div>
      </details>
    </div>
  );
}