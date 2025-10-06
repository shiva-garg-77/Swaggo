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
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all', fetchPolicy: 'cache-first' },
    query: { errorPolicy: 'all', fetchPolicy: 'cache-first' },
  }
});

export default client;