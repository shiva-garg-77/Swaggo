"use client";

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '../Helper/AuthProvider';
import { TOGGLE_POST_LIKE } from '../../lib/graphql/simpleQueries';
import { GET_USER_BY_USERNAME, CREATE_MEMORY, GET_MEMORIES } from '../../lib/graphql/queries';

export default function DebugTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Get user profile to get posts
  const { data: profileData } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: null },
    skip: !user
  });

  // Get memories
  const { data: memoriesData } = useQuery(GET_MEMORIES, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid
  });

  // Mutations
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [createMemory] = useMutation(CREATE_MEMORY);

  const addResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testLikePost = async () => {
    if (!user?.profileid) {
      addResult('Like Post', false, 'Not logged in');
      return;
    }

    const firstPost = profileData?.getUserbyUsername?.post?.[0];
    if (!firstPost) {
      addResult('Like Post', false, 'No posts available');
      return;
    }

    try {
      const result = await togglePostLike({
        variables: {
          profileid: user.profileid,
          postid: firstPost.postid
        }
      });
      
      addResult('Like Post', true, `Successfully liked post ${firstPost.postid}`, result.data);
    } catch (error) {
      addResult('Like Post', false, `Error: ${error.message}`, {
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    }
  };

  const testCreateMemory = async () => {
    if (!user?.profileid) {
      addResult('Create Memory', false, 'Not logged in');
      return;
    }

    try {
      const result = await createMemory({
        variables: {
          profileid: user.profileid,
          title: `Test Memory ${Date.now()}`,
          coverImage: null,
          postUrl: null
        }
      });
      
      addResult('Create Memory', true, `Successfully created memory`, result.data);
    } catch (error) {
      addResult('Create Memory', false, `Error: ${error.message}`, {
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('System', true, `User: ${user?.username}, ProfileID: ${user?.profileid}`);
    addResult('System', true, `Posts available: ${profileData?.getUserbyUsername?.post?.length || 0}`);
    addResult('System', true, `Memories available: ${memoriesData?.getMemories?.length || 0}`);
    
    await testLikePost();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testCreateMemory();
    
    setIsRunning(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        GraphQL Debug Test
      </h2>
      
      <div className="mb-4">
        <button
          onClick={runAllTests}
          disabled={isRunning || !user}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded border-l-4 ${
              result.success
                ? 'bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-400'
                : 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">
                {result.test}
              </span>
              <span className="text-xs text-gray-500">
                {result.timestamp}
              </span>
            </div>
            <p className={`text-sm mt-1 ${
              result.success
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {result.message}
            </p>
            {result.data && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer text-gray-500 hover:text-gray-700">
                  Show Data
                </summary>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
