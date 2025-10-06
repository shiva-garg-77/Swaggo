/**
 * 🔒 APOLLO CLIENT REACT HOOKS - COMPREHENSIVE EXPORT
 * 
 * This file ensures all Apollo Client React hooks are properly available
 * and resolves the "useMutation is not a function" error by providing
 * a centralized export of all Apollo Client hooks.
 */

// CRITICAL FIX: Import React hooks from correct v4 path
import { 
  useQuery as apolloUseQuery,
  useMutation as apolloUseMutation,
  useLazyQuery as apolloUseLazyQuery,
  useSubscription as apolloUseSubscription,
  useApolloClient as apolloUseApolloClient,
  ApolloProvider as apolloApolloProvider,
  useReactiveVar
} from '@apollo/client/react';

// Core Apollo Client exports
export {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  gql,
  makeVar
} from '@apollo/client';

// Re-export useReactiveVar from react module
export { useReactiveVar } from '@apollo/client/react';

// React integration exports - CRITICAL for hook functionality
export const useQuery = apolloUseQuery;
export const useMutation = apolloUseMutation;
export const useLazyQuery = apolloUseLazyQuery;
export const useSubscription = apolloUseSubscription;
export const useApolloClient = apolloUseApolloClient;
export const ApolloProvider = apolloApolloProvider;

// Link exports
export {
  setContext
} from '@apollo/client/link/context';

export {
  onError
} from '@apollo/client/link/error';

export {
  RetryLink
} from '@apollo/client/link/retry';

// Cache utilities
export {
  isReference
} from '@apollo/client/utilities';

// Development tools
export {
  MockLink,
  MockSubscriptionLink
} from '@apollo/client/testing';

// Note: Reference and makeReference are not available in Apollo Client v4
// Note: MockedProvider is not available in Apollo Client v4 - use MockLink instead

// Default client import
import client from './apollo-client-ultimate';
export default client;

// Named client export for explicit imports
export { default as apolloClient } from './apollo-client-ultimate';

// Helper to verify all hooks are available
export const verifyApolloHooks = () => {
  const hooks = {
    useQuery: typeof useQuery,
    useMutation: typeof useMutation,
    useLazyQuery: typeof useLazyQuery,
    useSubscription: typeof useSubscription,
    useApolloClient: typeof useApolloClient
  };
  
  console.log('🔍 Apollo React Hooks Status:', hooks);
  
  const missingHooks = Object.entries(hooks)
    .filter(([name, type]) => type !== 'function')
    .map(([name]) => name);
  
  if (missingHooks.length > 0) {
    console.error('❌ Missing Apollo hooks:', missingHooks);
    return false;
  }
  
  console.log('✅ All Apollo React hooks are available');
  return true;
};

// Auto-verify in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setTimeout(() => {
    verifyApolloHooks();
  }, 1000);
}
