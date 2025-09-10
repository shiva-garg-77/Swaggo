"use client";

import { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { AuthContext } from './AuthProvider';
import { ApolloClientContext } from './ApolloProvider';
import { GET_CURRENT_USER_PROFILE } from '../../lib/graphql/fixedProfileQueries';
import { clearApolloCache } from '../../lib/apollo/cacheUtils';

/**
 * Profile debugging component to test profile queries
 */
export function ProfileDebugger() {
  const { user, accessToken } = useContext(AuthContext);
  const apolloClient = useContext(ApolloClientContext);

  const { data, loading, error, refetch } = useQuery(GET_CURRENT_USER_PROFILE, {
    variables: {},
    skip: !accessToken || !user,
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('✅ Profile debug query completed:', data);
    },
    onError: (error) => {
      console.error('❌ Profile debug query error:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        username: user?.username
      });
    }
  });

  const handleClearCacheAndRefetch = async () => {
    if (apolloClient) {
      console.log('🧹 Clearing cache and refetching...');
      await clearApolloCache(apolloClient);
      setTimeout(() => refetch(), 500);
    }
  };

  const handleTestQuery = () => {
    console.log('🔍 Testing profile query with current user:', {
      hasUser: !!user,
      username: user?.username,
      profileid: user?.profileid,
      hasAccessToken: !!accessToken
    });
    refetch();
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#10b981',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        🔍 Profile Debugger
      </div>
      
      <div style={{ marginBottom: '8px', fontSize: '11px' }}>
        User: {user?.username || 'None'}<br/>
        Profile ID: {user?.profileid || 'None'}<br/>
        Status: {loading ? 'Loading...' : error ? 'Error' : data ? 'Success' : 'No data'}
      </div>

      {error && (
        <div style={{ 
          marginBottom: '8px', 
          fontSize: '10px', 
          background: 'rgba(239, 68, 68, 0.2)', 
          padding: '4px', 
          borderRadius: '4px' 
        }}>
          Error: {error.message.substring(0, 100)}...
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={handleTestQuery}
          style={{
            background: 'white',
            color: '#10b981',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Test Query
        </button>
        <button
          onClick={handleClearCacheAndRefetch}
          style={{
            background: 'white',
            color: '#10b981',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Clear & Retry
        </button>
      </div>
    </div>
  );
}
