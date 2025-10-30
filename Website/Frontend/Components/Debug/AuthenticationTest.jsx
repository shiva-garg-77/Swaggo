'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useFixedSecureAuth as useSecureAuth } from '../../context/FixedSecureAuthContext.jsx';
import { gql } from '@apollo/client';
// CRITICAL MEMORY LEAK FIXES
import { useComprehensiveCleanup, useMemoryMonitoring } from '../../utils/memoryLeakFixes';

// Simple test queries
const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

const GET_CURRENT_USER_QUERY = gql`
  query GetCurrentUser {
    getUserbyUsername {
      profileid
      username
      name
      email
    }
  }
`;

const CREATE_POST_TEST = gql`
  mutation CreatePostTest($profileid: String!, $postUrl: String!, $title: String, $Description: String, $postType: String!) {
    CreatePost(profileid: $profileid, postUrl: $postUrl, title: $title, Description: $Description, postType: $postType) {
      postid
      title
      description
    }
  }
`;

export default function AuthenticationTest() {
  const { isAuthenticated, user, isLoading, login, logout, error } = useSecureAuth();
  const [testResults, setTestResults] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [postForm, setPostForm] = useState({ title: '', description: '', imageUrl: '' });

  // 🔧 CRITICAL: Initialize comprehensive memory leak prevention
  const cleanup = useComprehensiveCleanup();
  
  // 🔧 CRITICAL: Monitor memory usage for debug components
  useMemoryMonitoring({
    alertThreshold: 40 * 1024 * 1024, // 40MB threshold for debug components
    checkInterval: 60000, // Check every minute
    onMemoryAlert: (memoryInfo) => {
      console.warn('🚨 MEMORY ALERT in AuthenticationTest:', {
        used: `${(memoryInfo.used / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${memoryInfo.percentage.toFixed(1)}%`,
        testResultsCount: testResults.length
      });
      // Auto-cleanup old test results if memory is high
      if (testResults.length > 50) {
        setTestResults(prev => prev.slice(-25)); // Keep only last 25 results
      }
    }
  });

  // Test basic hello query
  const { data: helloData, loading: helloLoading, error: helloError } = useQuery(HELLO_QUERY, {
    onCompleted: (data) => {
      addTestResult('Hello Query', 'SUCCESS', `Response: ${data.hello}`);
    },
    onError: (error) => {
      addTestResult('Hello Query', 'ERROR', error.message);
    }
  });

  // Test authenticated user query
  const { data: userData, loading: userLoading, error: userError, refetch: refetchUser } = useQuery(GET_CURRENT_USER_QUERY, {
    skip: !isAuthenticated,
    onCompleted: (data) => {
      if (data?.getUserbyUsername) {
        addTestResult('Get Current User', 'SUCCESS', `User: ${data.getUserbyUsername.username}`);
      }
    },
    onError: (error) => {
      addTestResult('Get Current User', 'ERROR', error.message);
    }
  });

  // Test mutation
  const [createPost] = useMutation(CREATE_POST_TEST, {
    onCompleted: (data) => {
      if (data?.CreatePost) {
        addTestResult('Create Post', 'SUCCESS', `Post created: ${data.CreatePost.postid}`);
      }
    },
    onError: (error) => {
      addTestResult('Create Post', 'ERROR', error.message);
    }
  });

  const addTestResult = useCallback((test, status, message) => {
    setTestResults(prev => [{
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev.slice(0, 24)]); // Keep only last 25 results to prevent memory leaks
  }, []);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    try {
      addTestResult('Login Attempt', 'PENDING', `Attempting login for: ${loginForm.username}`);
      const result = await login(loginForm);
      
      if (result.success) {
        addTestResult('Login', 'SUCCESS', `Logged in as: ${result.user?.username || loginForm.username}`);
        // Test authenticated query after login
        cleanup.setTimeout(() => refetchUser(), 1000);
      } else {
        addTestResult('Login', 'ERROR', result.error || 'Login failed');
      }
    } catch (error) {
      addTestResult('Login', 'ERROR', error.message);
    }
  }, [loginForm, login, addTestResult, cleanup, refetchUser]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      addTestResult('Create Post', 'ERROR', 'Not authenticated');
      return;
    }

    try {
      await createPost({
        variables: {
          profileid: user.profileid || user.id,
          postUrl: postForm.imageUrl || 'https://via.placeholder.com/400',
          title: postForm.title || 'Test Post',
          Description: postForm.description || 'Test post description',
          postType: 'image'
        }
      });
    } catch (error) {
      console.error('Post creation error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      addTestResult('Logout', 'SUCCESS', 'Logged out successfully');
    } catch (error) {
      addTestResult('Logout', 'ERROR', error.message);
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    addTestResult('Test Suite', 'PENDING', 'Starting comprehensive authentication test...');
    
    // Test basic connectivity first
    setTimeout(() => refetchUser(), 500);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      addTestResult('Auth State', 'SUCCESS', `Authenticated as: ${user.username || user.email}`);
    } else if (!isLoading && !isAuthenticated) {
      addTestResult('Auth State', 'INFO', 'Not authenticated - ready for login');
    }
  }, [isAuthenticated, user, isLoading]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-50 border-green-200';
      case 'ERROR': return 'text-red-600 bg-red-50 border-red-200';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-600">Loading authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Authentication Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Authentication Test Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${
            isAuthenticated 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <h3 className="font-semibold">Authentication Status</h3>
            <p>{isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            {user && (
              <p className="text-sm mt-1">
                User: {user.username || user.email} ({user.id})
              </p>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
            <h3 className="font-semibold">GraphQL Status</h3>
            <p>Hello Query: {helloLoading ? '⏳ Loading...' : helloData?.hello ? '✅ Working' : '❌ Failed'}</p>
            <p>User Query: {userLoading ? '⏳ Loading...' : userData?.getUserbyUsername ? '✅ Working' : '❌ Failed'}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg mb-4">
            <h3 className="font-semibold">Authentication Error</h3>
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={runAllTests}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🧪 Run All Tests
          </button>
          
          {!isAuthenticated && (
            <button
              onClick={() => setLoginForm({...loginForm, username: process.env.NEXT_PUBLIC_TEST_USERNAME || 'testuser', password: process.env.NEXT_PUBLIC_TEST_PASSWORD || 'test123'})}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              🔑 Fill Test Login
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Form */}
        {!isAuthenticated && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔓 Login Test</h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username/Email
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username or email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                🔐 Test Login
              </button>
            </form>
          </div>
        )}

        {/* Create Post Test */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Create Post Test</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={postForm.description}
                  onChange={(e) => setPostForm({...postForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Post description"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={postForm.imageUrl}
                  onChange={(e) => setPostForm({...postForm, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                📸 Test Create Post
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Test Results</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No test results yet. Click "Run All Tests" to start testing.
            </p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="font-medium">{result.test}</span>
                    <span className="ml-2 text-sm">({result.status})</span>
                  </div>
                  <span className="text-xs opacity-75">{result.timestamp}</span>
                </div>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}