# 🔒 Frontend Authentication Integration Guide

## Overview

This guide explains how to properly integrate with the enhanced GraphQL authentication system from your frontend applications.

## Authentication Methods Supported

Your backend now supports multiple authentication methods:

1. **Cookie-based authentication** (recommended for web apps)
2. **Bearer token authentication** (recommended for mobile/API clients)
3. **Hybrid authentication** (automatic fallback)

## Cookie Authentication Setup

### 1. Ensure Credentials Are Included

```javascript
// Apollo Client setup
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  credentials: 'include', // CRITICAL: Ensures cookies are sent
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

### 2. CSRF Token Handling

```javascript
// Utility function to get CSRF token from cookies
function getCSRFToken() {
  // Check for prefixed cookies first (most secure)
  const prefixedTokens = [
    getCookie('__Host-csrfToken'),
    getCookie('__Secure-csrfToken'),
    getCookie('csrfToken')
  ].filter(Boolean);
  
  return prefixedTokens[0] || null;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Include CSRF token in mutation headers
const client = new ApolloClient({
  link: from([
    new ApolloLink((operation, forward) => {
      // Add CSRF token to mutation requests
      if (operation.query.definitions.some(def => 
        def.kind === 'OperationDefinition' && def.operation === 'mutation'
      )) {
        const csrfToken = getCSRFToken();
        if (csrfToken) {
          operation.setContext({
            headers: {
              'X-CSRF-Token': csrfToken
            }
          });
        }
      }
      return forward(operation);
    }),
    httpLink
  ]),
  cache: new InMemoryCache(),
});
```

### 3. Error Handling

```javascript
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      // Handle authentication errors
      if (message.includes('Authentication required')) {
        // Redirect to login page
        window.location.href = '/login';
        return;
      }
      
      // Handle CSRF token errors
      if (message.includes('CSRF token')) {
        console.error('CSRF token validation failed - page refresh recommended');
        // Optionally refresh the page to get new tokens
        window.location.reload();
        return;
      }
      
      // Handle high-risk authentication
      if (message.includes('High-risk authentication')) {
        // Show security verification modal
        showSecurityVerificationModal();
        return;
      }
      
      // Handle account locked
      if (message.includes('Account is locked')) {
        // Show account locked message
        showAccountLockedMessage();
        return;
      }
    });
  }
  
  if (networkError) {
    console.error('Network error:', networkError);
    
    // Handle 401 Unauthorized
    if (networkError.statusCode === 401) {
      // Clear local auth state and redirect to login
      clearAuthState();
      window.location.href = '/login';
    }
  }
});

const client = new ApolloClient({
  link: from([errorLink, csrfLink, httpLink]),
  cache: new InMemoryCache(),
});
```

## Bearer Token Authentication

### 1. Token Storage

```javascript
// Secure token storage utility
class TokenManager {
  static getAccessToken() {
    // Try multiple storage locations
    return localStorage.getItem('accessToken') || 
           sessionStorage.getItem('accessToken') ||
           this.getTokenFromCookie('accessToken');
  }
  
  static setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
  
  static clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }
  
  static getTokenFromCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
}
```

### 2. Authorization Header

```javascript
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  const token = TokenManager.getAccessToken();
  
  return {
    headers: {
      ...headers,
      // Include Bearer token if available
      ...(token && { authorization: `Bearer ${token}` }),
    }
  };
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
```

## React Hook for Authentication

```javascript
import { useState, useEffect, useContext, createContext } from 'react';
import { useApolloClient } from '@apollo/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const client = useApolloClient();
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      // Try to fetch current user info
      const { data } = await client.query({
        query: ME_QUERY,
        errorPolicy: 'all'
      });
      
      if (data?.me) {
        setUser(data.me);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('User not authenticated:', error.message);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await client.mutate({
        mutation: LOGOUT_MUTATION
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear client cache and local state
      TokenManager.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      await client.clearStore();
    }
  };
  
  const value = {
    user,
    isAuthenticated,
    loading,
    logout,
    refetchUser: checkAuthStatus
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## GraphQL Queries Examples

### 1. Protected Query

```graphql
query MyFeed {
  myFeed {
    id
    content
    createdAt
    user {
      username
      displayName
      avatar
    }
  }
}
```

### 2. Protected Mutation

```graphql
mutation CreatePost($content: String!, $postType: String!) {
  createPost(content: $content, postType: $postType) {
    success
    message
    post {
      id
      content
      createdAt
      user {
        username
        displayName
      }
    }
  }
}
```

### 3. Using in React Component

```javascript
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from './AuthProvider';

function CreatePostComponent() {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  
  const [createPost, { loading, error }] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: (data) => {
      if (data.createPost.success) {
        setContent('');
        // Refetch feed or update cache
      }
    },
    onError: (error) => {
      console.error('Create post error:', error.message);
    }
  });
  
  const { data: feedData } = useQuery(MY_FEED_QUERY, {
    skip: !isAuthenticated, // Only run if authenticated
    errorPolicy: 'all'
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    createPost({
      variables: {
        content: content.trim(),
        postType: 'text'
      }
    });
  };
  
  if (!isAuthenticated) {
    return <div>Please log in to create posts</div>;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        maxLength={2000}
      />
      <button type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Posting...' : 'Post'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

## Debugging Authentication Issues

### 1. Check Cookie Settings

```javascript
// Debug function to check authentication cookies
function debugAuthCookies() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});
  
  console.log('🍪 Authentication cookies:', {
    accessToken: cookies.accessToken ? 'Present' : 'Missing',
    __Host_accessToken: cookies.__Host_accessToken ? 'Present' : 'Missing',
    __Secure_accessToken: cookies.__Secure_accessToken ? 'Present' : 'Missing',
    csrfToken: cookies.csrfToken ? 'Present' : 'Missing',
    __Host_csrfToken: cookies.__Host_csrfToken ? 'Present' : 'Missing',
    allCookies: Object.keys(cookies)
  });
}
```

### 2. Network Request Debugging

```javascript
// Add this to your Apollo Client setup for debugging
import { from } from '@apollo/client';

const debugLink = new ApolloLink((operation, forward) => {
  console.log(`🔍 GraphQL ${operation.operationName}:`, {
    variables: operation.variables,
    context: operation.getContext()
  });
  
  return forward(operation).map((response) => {
    console.log(`✅ GraphQL ${operation.operationName} response:`, response);
    return response;
  });
});

// Add debugLink to your link chain in development
const client = new ApolloClient({
  link: from([
    debugLink, // Only in development
    errorLink,
    authLink,
    httpLink
  ]),
  cache: new InMemoryCache(),
});
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Include credentials in all GraphQL requests**
3. **Implement proper error handling for auth failures**
4. **Clear tokens on logout**
5. **Handle token expiration gracefully**
6. **Validate CSRF tokens on mutations**
7. **Monitor for suspicious authentication patterns**

## Common Issues and Solutions

### Issue: "Authentication required" errors
**Solution**: Ensure cookies are being sent with `credentials: 'include'`

### Issue: CSRF token validation failed
**Solution**: Include `X-CSRF-Token` header in mutation requests

### Issue: Cookies not being set
**Solution**: Check CORS settings and domain configuration

### Issue: Token expired errors
**Solution**: Implement automatic token refresh logic

### Issue: High-risk authentication detected
**Solution**: Implement additional security verification flows