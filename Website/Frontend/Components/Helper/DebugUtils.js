"use client";

import { useContext } from 'react';
import { ApolloClientContext } from './ApolloProvider';
import { clearApolloCache } from '../../lib/apollo/cacheUtils';

/**
 * Debug utility component for developers to manually clear cache
 * Add this to any page temporarily to debug cache issues
 */
export function DebugClearCache() {
  const apolloClient = useContext(ApolloClientContext);

  const handleClearCache = async () => {
    if (!apolloClient) {
      alert('Apollo client not available');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to clear the Apollo cache? This will refresh all data.');
    if (confirmed) {
      console.log('🧹 Manual cache clear initiated...');
      const success = await clearApolloCache(apolloClient);
      if (success) {
        alert('Cache cleared successfully! The page will refresh.');
        window.location.reload();
      } else {
        alert('Failed to clear cache. Check console for errors.');
      }
    }
  };

  const handleDebugAuth = () => {
    console.log('🔍 Current localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}:`, localStorage.getItem(key));
    }
    
    console.log('🍪 Current cookies:', document.cookie);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#ff6b6b',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🛠️ Debug Utils
      </div>
      <button
        onClick={handleClearCache}
        style={{
          background: 'white',
          color: '#ff6b6b',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          marginRight: '8px'
        }}
      >
        Clear Cache
      </button>
      <button
        onClick={handleDebugAuth}
        style={{
          background: 'white',
          color: '#ff6b6b',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Debug Auth
      </button>
    </div>
  );
}

/**
 * Hook to access debug utilities from any component
 */
export function useDebugUtils() {
  const apolloClient = useContext(ApolloClientContext);

  const clearCache = async () => {
    if (apolloClient) {
      return await clearApolloCache(apolloClient);
    }
    return false;
  };

  const logUserData = () => {
    // This would be imported from AuthProvider if needed
    console.log('User data debugging would go here');
  };

  return {
    clearCache,
    logUserData
  };
}
