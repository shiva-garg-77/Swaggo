"use client";

import { useContext, useMemo } from 'react';
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { AuthContext } from './AuthProvider';

export default function CustomApolloProvider({ children }) {
  const { accessToken } = useContext(AuthContext);

  console.log('🔄 ApolloProvider Render - accessToken:', accessToken ? `Present: ${accessToken.substring(0, 20)}...` : 'NOT PRESENT');

  const client = useMemo(() => {
    console.log('🏗️ Creating Apollo Client...');
    console.log('- accessToken in useMemo:', accessToken ? 'Present' : 'NOT PRESENT');
    
    const httpLink = createHttpLink({
      uri: `http://localhost:${process.env.NEXT_PUBLIC_PORT}/graphql`,
      credentials: 'include',
      fetch: (uri, options) => {
        console.log('GraphQL Fetch to:', uri);
        console.log('GraphQL Options:', options);
        return fetch(uri, options).then(response => {
          console.log('GraphQL Response status:', response.status);
          console.log('GraphQL Response ok:', response.ok);
          return response;
        }).catch(err => {
          console.error('GraphQL Fetch Error:', err);
          throw err;
        });
      },
    });

    // Create auth link to add JWT token to headers
    const authLink = setContext((operation, { headers }) => {
      console.log('\n🔗 AUTH LINK CALLED:');
      console.log('- Operation:', operation.operationName);
      console.log('- accessToken available:', !!accessToken);
      
      if (accessToken) {
        console.log('- Token preview:', `${accessToken.substring(0, 20)}...`);
      } else {
        console.log('- ❌ NO TOKEN AVAILABLE!');
      }
      
      console.log('- Incoming headers:', headers);
      
      const finalHeaders = {
        ...headers,
        authorization: accessToken ? `Bearer ${accessToken}` : "",
      };
      
      console.log('- Final headers to send:', finalHeaders);
      console.log('- Authorization header:', finalHeaders.authorization ? 'SET' : 'NOT SET');
      
      return {
        headers: finalHeaders
      };
    });

    return new ApolloClient({
      link: from([authLink, httpLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
      },
    });
  }, [accessToken]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
