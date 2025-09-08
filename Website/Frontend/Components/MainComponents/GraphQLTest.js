"use client";

import { useQuery, useMutation } from '@apollo/client';
import { useContext, useState } from 'react';
import { AuthContext } from '../Helper/AuthProvider';
import { HELLO_QUERY } from '../../lib/graphql/simpleQueries';
import { GET_USER_BY_USERNAME, CREATE_POST_MUTATION } from '../../lib/graphql/profileQueries';
import { useTheme } from '../Helper/ThemeProvider';

export default function GraphQLTest() {
  const { theme } = useTheme();
  const { user, accessToken, debugUserData } = useContext(AuthContext);
  const [testResults, setTestResults] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);
  
  const { data: helloData, loading: helloLoading, error: helloError } = useQuery(HELLO_QUERY);
  
  const [createPost] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: (data) => {
      setTestResults(prev => ({
        ...prev,
        createPost: { success: true, data }
      }));
    },
    onError: (error) => {
      setTestResults(prev => ({
        ...prev,
        createPost: { success: false, error: error.message }
      }));
    }
  });

  const testCreatePost = async () => {
    try {
      await createPost({
        variables: {
          profileid: user?.profileid,
          postUrl: 'https://picsum.photos/600/400?random=1', // Real test image URL
          title: 'Test Post',
          Description: 'This is a test post created from GraphQL Test',
          postType: 'IMAGE'
        }
      });
    } catch (error) {
      console.error('Test create post error:', error);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${
      theme === 'dark' ? 'text-white' : 'text-gray-900'
    }`}>
      <h1 className="text-2xl font-bold mb-6">GraphQL Test Suite</h1>
      
      {/* User Info */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">Current User Context</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Authenticated:</strong> {accessToken ? 'Yes' : 'No'}</p>
          <p><strong>Username:</strong> {user?.username || 'N/A'}</p>
          <p><strong>Profile ID:</strong> {user?.profileid || 'N/A'}</p>
          <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
        </div>
      </div>

      {/* Hello Test */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">Basic Connection Test</h2>
        {helloLoading && <p>Testing connection...</p>}
        {helloError && <p className="text-red-500">❌ Connection failed: {helloError.message}</p>}
        {helloData && <p className="text-green-500">✅ Connected: {helloData.hello}</p>}
      </div>

      {/* Post Creation Test */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">Post Creation Test</h2>
        <button
          onClick={testCreatePost}
          disabled={!accessToken}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            !accessToken
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg'
          }`}
        >
          Test Create Post
        </button>
        
        {testResults.createPost && (
          <div className="mt-3">
            {testResults.createPost.success ? (
              <div>
                <p className="text-green-500">✅ Post creation successful!</p>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {JSON.stringify(testResults.createPost.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <p className="text-red-500">❌ Post creation failed!</p>
                <p className="text-sm text-red-400 mt-1">{testResults.createPost.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Debug Section */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">User Debug Information</h2>
        <button
          onClick={() => setDebugInfo(debugUserData())}
          className="mb-3 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Debug User Data
        </button>
        
        {debugInfo && (
          <div className="mt-3 text-sm">
            <p><strong>Has Token:</strong> {debugInfo.hasToken ? '✅' : '❌'}</p>
            <p><strong>Has User:</strong> {debugInfo.hasUser ? '✅' : '❌'}</p>
            <p><strong>Has Profile ID:</strong> {debugInfo.hasProfileId ? '✅' : '❌'}</p>
            {debugInfo.userData && (
              <div className="mt-2">
                <strong>User Data:</strong>
                <pre className="text-xs mt-1 bg-black bg-opacity-20 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.userData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">System Information</h2>
        <div className="text-xs space-y-1">
          <p><strong>Environment Port:</strong> {process.env.NEXT_PUBLIC_PORT || 'Not set'}</p>
          <p><strong>GraphQL Endpoint:</strong> http://localhost:{process.env.NEXT_PUBLIC_PORT}/graphql</p>
          <p><strong>Token Length:</strong> {accessToken?.length || 0} characters</p>
        </div>
      </div>
    </div>
  );
}
