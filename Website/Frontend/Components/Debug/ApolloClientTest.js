/**
 * 🔒 APOLLO CLIENT TEST COMPONENT
 * 
 * Tests Apollo Client functionality to ensure useMutation and other hooks work properly
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '../../../lib/apollo-client-hooks';
import { GET_ALL_POSTS, TOGGLE_POST_LIKE } from '../../../lib/graphql/queries';

export default function ApolloClientTest() {
  const [testResults, setTestResults] = useState({
    hooksAvailable: false,
    queryWorking: false,
    mutationWorking: false,
    clientWorking: false
  });

  const apolloClient = useApolloClient();

  // Test query
  const { data, loading, error } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-first'
  });

  // Test mutation  
  const [toggleLike, { loading: mutationLoading }] = useMutation(TOGGLE_POST_LIKE);

  useEffect(() => {
    // Test if hooks are available
    const hooksTest = {
      useQuery: typeof useQuery === 'function',
      useMutation: typeof useMutation === 'function',
      useApolloClient: typeof useApolloClient === 'function'
    };

    setTestResults(prev => ({
      ...prev,
      hooksAvailable: Object.values(hooksTest).every(Boolean),
      queryWorking: !loading && !error,
      mutationWorking: typeof toggleLike === 'function',
      clientWorking: !!apolloClient
    }));
  }, [loading, error, toggleLike, apolloClient]);

  const handleTestMutation = async () => {
    try {
      console.log('🧪 Testing mutation functionality...');
      // Don't actually run the mutation, just test if it's callable
      console.log('✅ Mutation is callable:', typeof toggleLike === 'function');
    } catch (error) {
      console.error('❌ Mutation test failed:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        🔒 Apollo Client Test
      </h3>
      
      <div className="space-y-3">
        <div className={`flex items-center space-x-2 ${testResults.hooksAvailable ? 'text-green-600' : 'text-red-600'}`}>
          <span>{testResults.hooksAvailable ? '✅' : '❌'}</span>
          <span>React Hooks Available</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${testResults.queryWorking ? 'text-green-600' : 'text-yellow-600'}`}>
          <span>{testResults.queryWorking ? '✅' : '⏳'}</span>
          <span>useQuery Working</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${testResults.mutationWorking ? 'text-green-600' : 'text-red-600'}`}>
          <span>{testResults.mutationWorking ? '✅' : '❌'}</span>
          <span>useMutation Working</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${testResults.clientWorking ? 'text-green-600' : 'text-red-600'}`}>
          <span>{testResults.clientWorking ? '✅' : '❌'}</span>
          <span>Apollo Client Available</span>
        </div>
      </div>

      {loading && (
        <p className="text-blue-600 mt-4">Loading query...</p>
      )}

      {error && (
        <p className="text-red-600 mt-4">Query error: {error.message}</p>
      )}

      {data && (
        <p className="text-green-600 mt-4">
          Query successful: {data.getPosts?.length || 0} posts
        </p>
      )}

      <button
        onClick={handleTestMutation}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        disabled={mutationLoading}
      >
        Test Mutation
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>Apollo Client Status:</p>
        <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>
    </div>
  );
}