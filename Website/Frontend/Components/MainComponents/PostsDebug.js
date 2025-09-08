"use client";

import { useQuery } from '@apollo/client';
import { useContext } from 'react';
import { AuthContext } from '../Helper/AuthProvider';
import { GET_ALL_POSTS, HELLO_QUERY } from '../../lib/graphql/simpleQueries';
import { useTheme } from '../Helper/ThemeProvider';

export default function PostsDebug() {
  const { theme } = useTheme();
  const { user, accessToken } = useContext(AuthContext);
  
  const { data: helloData, loading: helloLoading, error: helloError } = useQuery(HELLO_QUERY);
  const { data: postsData, loading: postsLoading, error: postsError } = useQuery(GET_ALL_POSTS);

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${
      theme === 'dark' ? 'text-white' : 'text-gray-900'
    }`}>
      <h1 className="text-2xl font-bold mb-6">GraphQL Debug Panel</h1>
      
      {/* User Info */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Access Token:</strong> {accessToken ? `Present (${accessToken.substring(0, 20)}...)` : 'Not present'}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not loaded'}</p>
        </div>
      </div>

      {/* Hello Query */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">Hello Query Test</h2>
        {helloLoading && <p>Loading hello...</p>}
        {helloError && <p className="text-red-500">Error: {helloError.message}</p>}
        {helloData && <p className="text-green-500">Success: {helloData.hello}</p>}
      </div>

      {/* Posts Query */}
      <div className={`p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">Posts Query Test</h2>
        {postsLoading && <p>Loading posts...</p>}
        {postsError && <p className="text-red-500">Error: {postsError.message}</p>}
        {postsData && (
          <div>
            <p className="text-green-500">Success! Found {postsData.getPosts?.length || 0} posts</p>
            <pre className="mt-2 text-xs overflow-auto max-h-60">
              {JSON.stringify(postsData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
