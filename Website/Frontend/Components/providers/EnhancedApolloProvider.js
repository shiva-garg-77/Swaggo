import { ApolloProvider } from '@apollo/client';
import client from '../../lib/apollo-client';

const EnhancedApolloProvider = ({ children }) => {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};

export default EnhancedApolloProvider;
