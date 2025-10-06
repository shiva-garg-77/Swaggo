"use client";

import { useContext, useMemo, createContext } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
// Import centralized environment configuration
import { getConfig, apiConfig, isDevelopment } from '../../config/environment.js';

// Load Apollo error messages in development
if (typeof window !== 'undefined' && isDevelopment) {
  import('@apollo/client/dev').then(({ loadDevMessages, loadErrorMessages }) => {
    loadDevMessages();
    loadErrorMessages();
  });
}

// Create Apollo context to access client from components
export const ApolloClientContext = createContext();

export default function CustomApolloProvider({ children }) {
  const { isAuthenticated, makeSecureRequest } = useFixedSecureAuth();
  const accessToken = null; // Tokens are not exposed in SecureAuth for security

  if (isDevelopment) {
    console.log('🔄 ApolloProvider Render - accessToken:', accessToken ? `Present: ${accessToken.substring(0, 20)}...` : 'NOT PRESENT');
  }

  const client = useMemo(() => {
    if (isDevelopment) {
      console.log('🏠️ Creating Apollo Client...');
      console.log('- accessToken in useMemo:', accessToken ? 'Present' : 'NOT PRESENT');
    }
    
    // CRITICAL FIX: Use frontend proxy in development to avoid CORS issues
    const graphqlUrl = (() => {
      if (isDevelopment && typeof window !== 'undefined') {
        // Browser in development: use frontend proxy
        return '/graphql';
      }
      // SSR or production: use configured URL
      return apiConfig.graphqlUrl;
    })();
    
    console.log('🔗 Apollo Client using GraphQL URL:', graphqlUrl);
    
    const httpLink = createHttpLink({
      uri: graphqlUrl,
      credentials: 'include',
      fetch: (uri, options) => {
        // Only log in development
        if (isDevelopment) {
          console.log('GraphQL Fetch to:', uri);
          console.log('GraphQL Options:', options);
        }
        return fetch(uri, options).then(response => {
          if (isDevelopment) {
            console.log('GraphQL Response status:', response.status);
            console.log('GraphQL Response ok:', response.ok);
          }
          return response;
        }).catch(err => {
          if (isDevelopment) {
            // Don't log AbortErrors as they are normal when queries are cancelled
            if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
              console.error('GraphQL Fetch Error:', err);
            }
          }
          throw err;
        });
      },
    });

    // Create auth link for secure cookie-based authentication
    const authLink = setContext((operation, { headers }) => {
      if (isDevelopment) {
        console.log('\n🔗 SECURE AUTH LINK CALLED:');
        console.log('- Operation:', operation.operationName);
        console.log('- Authentication:', isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
        console.log('- Using httpOnly cookies for auth');
        console.log('- Incoming headers:', headers);
      }
      
      // No bearer token needed - authentication is handled via httpOnly cookies
      const finalHeaders = {
        ...headers,
        // Add CSRF token if needed
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (isDevelopment) {
        console.log('- Final headers to send:', finalHeaders);
        console.log('- Auth method: httpOnly cookies + CSRF protection');
      }
      
      return {
        headers: finalHeaders
      };
    });
    
    // Create error link to handle AbortErrors gracefully
    const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
      // Don't log AbortErrors in development as they're normal
      if (networkError && (networkError.name === 'AbortError' || networkError.message?.includes('aborted'))) {
        return;
      }
      
      if (graphQLErrors && isDevelopment) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(
            `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
          );
        });
      }
      
      if (networkError && isDevelopment) {
        console.error(`Network error: ${networkError}`);
      }
    });

    return new ApolloClient({
      link: from([errorLink, authLink, httpLink]),
      cache: new InMemoryCache({
        resultCaching: true
      }),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-first',
          notifyOnNetworkStatusChange: false
        },
        query: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-first',
          notifyOnNetworkStatusChange: false
        },
        mutate: {
          errorPolicy: 'all',
          fetchPolicy: 'no-cache'
        }
      },
    });
  }, [isAuthenticated]);

  return (
    <ApolloClientContext.Provider value={client}>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </ApolloClientContext.Provider>
  );
}
