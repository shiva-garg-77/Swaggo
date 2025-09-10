"use client";

import { useContext, useMemo, createContext } from 'react';
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { AuthContext } from './AuthProvider';

// Load Apollo error messages in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@apollo/client/dev').then(({ loadDevMessages, loadErrorMessages }) => {
    loadDevMessages();
    loadErrorMessages();
  });
}

// Create Apollo context to access client from components
export const ApolloClientContext = createContext();

export default function CustomApolloProvider({ children }) {
  const { accessToken } = useContext(AuthContext);

  console.log('🔄 ApolloProvider Render - accessToken:', accessToken ? `Present: ${accessToken.substring(0, 20)}...` : 'NOT PRESENT');

  const client = useMemo(() => {
    console.log('🏗️ Creating Apollo Client...');
    console.log('- accessToken in useMemo:', accessToken ? 'Present' : 'NOT PRESENT');
    
    const httpLink = createHttpLink({
      uri: `http://localhost:45799/graphql`,
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
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              getPosts: {
                merge(existing, incoming) {
                  return incoming;
                }
              },
              getPostStats: {
                merge(existing, incoming) {
                  return incoming;
                }
              },
              getProfile: {
                merge(existing, incoming) {
                  return incoming;
                }
              }
            }
          },
          Profiles: {
            keyFields: ['profileid']
          },
          Comments: {
            keyFields: ['commentid']
          },
          CommentLikes: {
            keyFields: ['profileid', 'commentid']
          },
          Likes: {
            keyFields: ['profileid', 'postid']
          }
        }
      }),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-and-network'
        },
        query: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-and-network'
        },
      },
    });
  }, [accessToken]);

  return (
    <ApolloClientContext.Provider value={client}>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </ApolloClientContext.Provider>
  );
}
