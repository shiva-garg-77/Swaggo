/**
 * GraphQL Pre-Loader
 * 
 * THIS MODULE MUST BE IMPORTED BEFORE ANY OTHER GRAPHQL-RELATED IMPORTS
 * 
 * This ensures the GraphQL singleton instance is created first,
 * preventing "Cannot use GraphQLScalarType from another module or realm" errors.
 */

console.log('🔍 [TRACKING] GraphQLPreLoader: Initializing GraphQL singleton...');

// Import and initialize the GraphQL singleton FIRST
import graphqlInstance from './GraphQLInstance.js';

// Verify it's valid
if (!graphqlInstance.isValid()) {
  throw new Error('GraphQL instance failed to initialize');
}

console.log('✅ [TRACKING] GraphQLPreLoader: GraphQL singleton initialized and validated');

// Export the instance so other modules can use it
export default graphqlInstance;
