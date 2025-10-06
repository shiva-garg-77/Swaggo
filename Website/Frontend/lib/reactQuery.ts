/**
 * 🚀 TANSTACK REACT QUERY SETUP - LATEST DATA FETCHING
 * Perfect 10/10 caching and synchronization
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 📊 Ultra-optimized Query Client Configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // React 19 optimizations
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error) => {
        // Smart retry logic
        if (error?.status === 404) return false;
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Modern features
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Performance optimizations
      structuralSharing: true,
      throwOnError: false,
    },
    mutations: {
      // Perfect error handling
      retry: 1,
      retryDelay: 1000,
      throwOnError: false,
      
      // Optimistic updates
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries();
      },
    },
  },
});

// 🎯 React Query Provider Component
export function ReactQueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginLeft: '5px',
              transform: 'scale(0.8)',
            }
          }}
        />
      )}
    </QueryClientProvider>
  );
}

// 🔄 Pre-configured Query Hooks for Common Operations
export const queryKeys = {
  // User queries
  user: ['user'] as const,
  userProfile: (id: string) => ['user', 'profile', id] as const,
  userSettings: () => ['user', 'settings'] as const,
  
  // Auth queries  
  auth: ['auth'] as const,
  authSession: () => ['auth', 'session'] as const,
  authPermissions: () => ['auth', 'permissions'] as const,
  
  // Data queries
  posts: ['posts'] as const,
  post: (id: string) => ['posts', id] as const,
  postComments: (id: string) => ['posts', id, 'comments'] as const,
  
  // Search queries
  search: (query: string) => ['search', query] as const,
  
  // Infinite queries
  infinitePosts: (filters: any) => ['posts', 'infinite', filters] as const,
};

// 🎯 Modern Query Helpers
export const queryUtils = {
  // Prefetch with smart caching
  prefetch: async (queryKey: any, queryFn: any) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 10 * 60 * 1000, // 10 minutes for prefetched data
    });
  },
  
  // Invalidate with smart targeting
  invalidate: (queryKey: any) => {
    return queryClient.invalidateQueries({ queryKey });
  },
  
  // Smart cache updates
  updateCache: (queryKey: any, updater: any) => {
    queryClient.setQueryData(queryKey, updater);
  },
  
  // Optimistic updates helper
  optimisticUpdate: async (queryKey: any, optimisticData: any, mutationFn: any) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey });
    
    // Snapshot previous value
    const previousData = queryClient.getQueryData(queryKey);
    
    // Optimistically update cache
    queryClient.setQueryData(queryKey, optimisticData);
    
    try {
      // Perform mutation
      const result = await mutationFn();
      
      // Update with real data
      queryClient.setQueryData(queryKey, result);
      
      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  },
};