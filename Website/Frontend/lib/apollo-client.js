import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: '/graphql',
  credentials: 'include',
});

const authLink = setContext(async (_, { headers }) => ({
  headers: {
    ...headers,
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
}));

const errorLink = onError(({ networkError }) => {
  if (networkError && !networkError.message?.includes('Failed to fetch')) {
    console.warn('Network error:', networkError.message);
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getMessagesByChat: {
            // Don't cache separate results for different cursor/limit args
            keyArgs: ['chatid'],
            // Merge existing messages with incoming messages
            merge(existing = { messages: [], pageInfo: {}, totalCount: 0 }, incoming, { args }) {
              // If we're fetching the first page (no cursor), replace existing data
              if (!args?.cursor) {
                return incoming;
              }
              
              // For subsequent pages, merge messages
              return {
                ...incoming,
                messages: [...existing.messages, ...incoming.messages],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all', fetchPolicy: 'cache-and-network' },
    query: { errorPolicy: 'all', fetchPolicy: 'cache-first' },
    mutate: { errorPolicy: 'all' }
  }
});

export default client;