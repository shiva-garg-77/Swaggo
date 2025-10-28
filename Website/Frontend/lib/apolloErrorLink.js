/**
 * @fileoverview Apollo Client Error Link Configuration
 * @description Handles GraphQL and network errors gracefully
 */

import { onError } from '@apollo/client/link/error';

/**
 * Error link for Apollo Client
 * Handles GraphQL errors, network errors, and authentication errors
 */
export const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
          locations
        )}, Path: ${path}`
      );

      // Handle specific error types
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Handle authentication errors
        console.warn('User is not authenticated, redirecting to login...');
        
        // Only redirect on client-side
        if (typeof window !== 'undefined') {
          // Store current path for redirect after login
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          // Redirect to login page
          window.location.href = '/login';
        }
      } else if (extensions?.code === 'FORBIDDEN') {
        // Handle authorization errors
        console.warn('User does not have permission for this action');
      } else if (extensions?.code === 'BAD_USER_INPUT') {
        // Handle validation errors
        console.warn('Invalid input provided:', message);
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle specific network errors
    if (networkError.statusCode === 401) {
      console.warn('Authentication expired, please log in again');
    } else if (networkError.statusCode === 503) {
      console.error('Service temporarily unavailable');
    } else if (networkError.statusCode >= 500) {
      console.error('Server error occurred');
    }
  }

  // Optionally retry the operation
  // return forward(operation);
});

export default errorLink;
