/**
 * Utility functions for managing Apollo Client cache
 */

/**
 * Clear all Apollo cache to fix stale data issues
 * @param {ApolloClient} client - Apollo client instance
 */
export const clearApolloCache = async (client) => {
  try {
    console.log('🗑️ Clearing Apollo cache...');
    
    // Clear store and reset cache
    await client.clearStore();
    
    // Also reset the cache completely  
    await client.resetStore();
    
    console.log('✅ Apollo cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear Apollo cache:', error);
    return false;
  }
};

/**
 * Clear specific cache entries by typename
 * @param {ApolloClient} client - Apollo client instance
 * @param {string[]} typeNames - Array of GraphQL typenames to clear
 */
export const clearCacheByType = (client, typeNames = []) => {
  try {
    console.log('🗑️ Clearing cache for types:', typeNames);
    
    typeNames.forEach(typeName => {
      client.cache.evict({ fieldName: typeName });
    });
    
    // Garbage collect dangling references
    client.cache.gc();
    
    console.log('✅ Cache cleared for specified types');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear cache by type:', error);
    return false;
  }
};

/**
 * Clear profile-related cache entries
 * @param {ApolloClient} client - Apollo client instance
 */
export const clearProfileCache = (client) => {
  try {
    console.log('👤 Clearing profile cache...');
    
    // Clear profile-related queries
    client.cache.evict({ fieldName: 'profile' });
    client.cache.evict({ fieldName: 'profileByUsername' });
    client.cache.evict({ fieldName: 'profiles' });
    
    // Garbage collect
    client.cache.gc();
    
    console.log('✅ Profile cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear profile cache:', error);
    return false;
  }
};

/**
 * Clear posts cache to refresh feed
 * @param {ApolloClient} client - Apollo client instance
 */
export const clearPostsCache = (client) => {
  try {
    console.log('📰 Clearing posts cache...');
    
    // Clear posts queries
    client.cache.evict({ fieldName: 'getPosts' });
    client.cache.evict({ fieldName: 'getAllPosts' });
    
    // Garbage collect
    client.cache.gc();
    
    console.log('✅ Posts cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear posts cache:', error);
    return false;
  }
};

/**
 * Refresh cache after authentication changes
 * @param {ApolloClient} client - Apollo client instance
 */
export const refreshCacheAfterAuth = async (client) => {
  try {
    console.log('🔄 Refreshing cache after auth change...');
    
    // Clear all cache first to remove stale data
    await clearApolloCache(client);
    
    console.log('✅ Cache refreshed after auth change');
    return true;
  } catch (error) {
    console.error('❌ Failed to refresh cache after auth:', error);
    return false;
  }
};
