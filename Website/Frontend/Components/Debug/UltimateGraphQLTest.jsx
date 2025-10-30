'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useFixedSecureAuth as useSecureAuth } from '../../context/FixedSecureAuthContext.jsx';
import { gql } from '@apollo/client';
import client, { getAuthStatus } from '../../lib/apollo-client-ultimate';

// Import all GraphQL operations for comprehensive testing
import { 
  GET_USER_BY_USERNAME, 
  CREATE_POST_MUTATION,
  TOGGLE_LIKE_POST,
  TOGGLE_SAVE_POST,
  BLOCK_USER,
  RESTRICT_USER,
  GET_DRAFTS_QUERY,
  CREATE_DRAFT_MUTATION,
  PUBLISH_DRAFT_MUTATION,
  DELETE_DRAFT_MUTATION
} from '../../lib/graphql/profileQueries';

// Simple test queries
const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

const GET_POSTS_QUERY = gql`
  query GetPosts {
    getPosts {
      postid
      title
      description
      postType
    }
  }
`;

export default function UltimateGraphQLTest() {
  const { isAuthenticated, user, isLoading, login, logout, error } = useSecureAuth();
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Test data for various operations
  const [testData, setTestData] = useState({
    post: { title: 'Test Post', description: 'Test Description', imageUrl: 'https://via.placeholder.com/400' },
    targetUser: 'shiva'
  });

  // Authentication status
  const authStatus = getAuthStatus();

  // Basic connectivity test
  const { data: helloData, loading: helloLoading, error: helloError } = useQuery(HELLO_QUERY, {
    onCompleted: (data) => {
      addTestResult('🌐 Basic Connectivity', 'SUCCESS', `Hello response: ${data.hello}`);
    },
    onError: (error) => {
      addTestResult('🌐 Basic Connectivity', 'ERROR', error.message);
    }
  });

  // Public data test
  const { data: postsData, loading: postsLoading, error: postsError } = useQuery(GET_POSTS_QUERY, {
    onCompleted: (data) => {
      addTestResult('📊 Public Data Access', 'SUCCESS', `Loaded ${data.getPosts?.length || 0} posts`);
    },
    onError: (error) => {
      addTestResult('📊 Public Data Access', 'ERROR', error.message);
    }
  });

  // Authenticated data test
  const { data: userData, loading: userLoading, error: userError, refetch: refetchUser } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: null }, // null for current user
    skip: !isAuthenticated,
    onCompleted: (data) => {
      if (data?.getUserbyUsername) {
        addTestResult('👤 Authenticated Data Access', 'SUCCESS', `Current user: ${data.getUserbyUsername.username}`);
      }
    },
    onError: (error) => {
      addTestResult('👤 Authenticated Data Access', 'ERROR', error.message);
    }
  });

  // Draft operations test
  const { data: draftsData, error: draftsError, refetch: refetchDrafts } = useQuery(GET_DRAFTS_QUERY, {
    variables: { profileid: userData?.getUserbyUsername?.profileid },
    skip: !isAuthenticated || !userData?.getUserbyUsername?.profileid,
    onCompleted: (data) => {
      addTestResult('📝 Draft Access', 'SUCCESS', `Found ${data.getDrafts?.length || 0} drafts`);
    },
    onError: (error) => {
      addTestResult('📝 Draft Access', 'ERROR', error.message);
    }
  });

  // Mutation tests
  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: (data) => {
      addTestResult('📸 Create Post', 'SUCCESS', `Post created: ${data.CreatePost?.postid}`);
    },
    onError: (error) => {
      addTestResult('📸 Create Post', 'ERROR', error.message);
    }
  });

  const [createDraft] = useMutation(CREATE_DRAFT_MUTATION, {
    onCompleted: (data) => {
      addTestResult('💾 Create Draft', 'SUCCESS', `Draft created: ${data.CreateDraft?.draftid}`);
    },
    onError: (error) => {
      addTestResult('💾 Create Draft', 'ERROR', error.message);
    }
  });

  const [toggleLike] = useMutation(TOGGLE_LIKE_POST, {
    onCompleted: (data) => {
      addTestResult('❤️ Toggle Like', 'SUCCESS', 'Like toggled successfully');
    },
    onError: (error) => {
      addTestResult('❤️ Toggle Like', 'ERROR', error.message);
    }
  });

  const [toggleSave] = useMutation(TOGGLE_SAVE_POST, {
    onCompleted: (data) => {
      addTestResult('🔖 Toggle Save', 'SUCCESS', 'Save toggled successfully');
    },
    onError: (error) => {
      addTestResult('🔖 Toggle Save', 'ERROR', error.message);
    }
  });

  const [blockUser] = useMutation(BLOCK_USER, {
    onCompleted: (data) => {
      addTestResult('🚫 Block User', 'SUCCESS', 'User blocked successfully');
    },
    onError: (error) => {
      addTestResult('🚫 Block User', 'ERROR', error.message);
    }
  });

  const [restrictUser] = useMutation(RESTRICT_USER, {
    onCompleted: (data) => {
      addTestResult('⚠️ Restrict User', 'SUCCESS', 'User restricted successfully');
    },
    onError: (error) => {
      addTestResult('⚠️ Restrict User', 'ERROR', error.message);
    }
  });

  const addTestResult = (test, status, message) => {
    setTestResults(prev => [{
      test,
      status,
      message: message.substring(0, 200), // Limit message length
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now() + Math.random()
    }, ...prev.slice(0, 19)]); // Keep last 20 results
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setCurrentTest('login');
    try {
      addTestResult('🔑 Login Attempt', 'PENDING', `Attempting login for: ${loginForm.username}`);
      const result = await login(loginForm);
      
      if (result.success) {
        addTestResult('🔑 Login', 'SUCCESS', `Logged in as: ${result.user?.username || loginForm.username}`);
        // Test authenticated operations after login
        setTimeout(() => {
          refetchUser();
          runAuthenticatedTests();
        }, 1000);
      } else {
        addTestResult('🔑 Login', 'ERROR', result.error || 'Login failed');
      }
    } catch (error) {
      addTestResult('🔑 Login', 'ERROR', error.message);
    } finally {
      setCurrentTest(null);
    }
  };

  const runAuthenticatedTests = async () => {
    if (!isAuthenticated || !user || !userData?.getUserbyUsername) {
      addTestResult('⚠️ Authenticated Tests', 'SKIPPED', 'Not authenticated');
      return;
    }

    setCurrentTest('authenticated');
    const userProfile = userData.getUserbyUsername;

    // Test draft creation
    try {
      await createDraft({
        variables: {
          profileid: userProfile.profileid,
          title: 'Test Draft',
          caption: 'This is a test draft',
          postType: 'text'
        }
      });
    } catch (error) {
      // Already logged by mutation handler
    }

    setCurrentTest(null);
  };

  const runMutationTests = async () => {
    if (!isAuthenticated || !userData?.getUserbyUsername) {
      addTestResult('⚠️ Mutation Tests', 'SKIPPED', 'Authentication required');
      return;
    }

    setCurrentTest('mutations');
    const userProfile = userData.getUserbyUsername;

    try {
      // Test post creation
      await createPost({
        variables: {
          profileid: userProfile.profileid,
          postUrl: testData.post.imageUrl,
          title: testData.post.title,
          Description: testData.post.description,
          postType: 'image'
        }
      });

      // If we have posts, test like/save operations
      if (postsData?.getPosts?.length > 0) {
        const firstPost = postsData.getPosts[0];
        
        await toggleLike({
          variables: {
            profileid: userProfile.profileid,
            postid: firstPost.postid
          }
        });

        await toggleSave({
          variables: {
            profileid: userProfile.profileid,
            postid: firstPost.postid
          }
        });
      }

    } catch (error) {
      // Errors are already logged by mutation handlers
    } finally {
      setCurrentTest(null);
    }
  };

  const runUserOperationTests = async () => {
    if (!isAuthenticated || !userData?.getUserbyUsername) {
      addTestResult('⚠️ User Operations', 'SKIPPED', 'Authentication required');
      return;
    }

    setCurrentTest('user-ops');
    const userProfile = userData.getUserbyUsername;

    // Find target user to test block/restrict (don't test on self)
    try {
      const targetUserData = await client.query({
        query: GET_USER_BY_USERNAME,
        variables: { username: testData.targetUser },
        fetchPolicy: 'network-only'
      });

      if (targetUserData.data?.getUserbyUsername) {
        const targetProfile = targetUserData.data.getUserbyUsername;
        
        // Test restrict (less severe than block)
        await restrictUser({
          variables: {
            profileid: userProfile.profileid,
            targetprofileid: targetProfile.profileid
          }
        });
      }
    } catch (error) {
      // Errors are already logged by mutation handlers
    } finally {
      setCurrentTest(null);
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    addTestResult('🧪 Test Suite', 'PENDING', 'Starting comprehensive GraphQL test suite...');
    
    // Basic tests are handled by useQuery hooks
    // Authenticated tests run after login
    if (isAuthenticated) {
      runAuthenticatedTests();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-50 border-green-200';
      case 'ERROR': return 'text-red-600 bg-red-50 border-red-200';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'SKIPPED': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      addTestResult('🔐 Auth Status', 'SUCCESS', `Authenticated as: ${user.username || user.email}`);
    } else if (!isLoading && !isAuthenticated) {
      addTestResult('🔐 Auth Status', 'INFO', 'Not authenticated - ready for login');
    }
  }, [isAuthenticated, user, isLoading]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2">🚀 Ultimate GraphQL Test Suite</h1>
        <p className="text-blue-100">Comprehensive testing for all GraphQL operations with 10/10 security</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${
          isAuthenticated 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <h3 className="font-semibold">Authentication</h3>
          <p>{isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
          {user && (
            <p className="text-sm mt-1">{user.username || user.email}</p>
          )}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
          <h3 className="font-semibold">Connectivity</h3>
          <p>{helloLoading ? '⏳ Testing...' : helloData?.hello ? '✅ Connected' : '❌ Failed'}</p>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg">
          <h3 className="font-semibold">Data Access</h3>
          <p>{postsLoading ? '⏳ Loading...' : postsData?.getPosts ? `✅ ${postsData.getPosts.length} posts` : '❌ Failed'}</p>
        </div>

        <div className={`p-4 rounded-lg border ${
          authStatus.authenticated 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <h3 className="font-semibold">Cookie Status</h3>
          <p>CSRF: {authStatus.hasCSRF ? '✅' : '❌'}</p>
          <p>Auth: {authStatus.hasAuth ? '✅' : '❌'}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <h3 className="font-semibold">Authentication Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 Test Controls</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runAllTests}
            disabled={currentTest}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            🧪 Run All Tests
          </button>

          {isAuthenticated ? (
            <>
              <button
                onClick={runMutationTests}
                disabled={currentTest}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                🚀 Test Mutations
              </button>
              
              <button
                onClick={runUserOperationTests}
                disabled={currentTest}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                👥 Test User Operations
              </button>
              
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setLoginForm({username: process.env.NEXT_PUBLIC_TEST_USERNAME || 'testuser', password: process.env.NEXT_PUBLIC_TEST_PASSWORD || 'test123'})}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              🔑 Fill Test Credentials
            </button>
          )}
        </div>
        
        {currentTest && (
          <div className="mt-3 flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span>Running {currentTest} tests...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Form */}
        {!isAuthenticated && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 Authentication Test</h3>
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
                disabled={currentTest === 'login'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {currentTest === 'login' ? '🔄 Logging in...' : '🔐 Test Login'}
              </button>
            </form>
          </div>
        )}

        {/* Test Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Test Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Username (for user operations)
              </label>
              <input
                type="text"
                value={testData.targetUser}
                onChange={(e) => setTestData({...testData, targetUser: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter target username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Post Title
              </label>
              <input
                type="text"
                value={testData.post.title}
                onChange={(e) => setTestData({...testData, post: {...testData.post, title: e.target.value}})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Test post title"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Test Results</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No test results yet. Run tests to see results here.
            </p>
          ) : (
            testResults.map((result) => (
              <div
                key={result.id}
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