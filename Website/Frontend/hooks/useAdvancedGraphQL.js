/**
 * Advanced GraphQL Utility Hooks
 * Custom hooks that enhance your existing GraphQL usage patterns
 * Built specifically for the Swaggo project architecture
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  useQuery, 
  useMutation, 
  useLazyQuery, 
  useApolloClient, 
  useSubscription 
} from '@apollo/client';
import { useFixedSecureAuth } from '../context/FixedSecureAuthContext';
import { usePerformanceMonitoring } from '../Components/Performance/PerformanceMonitoringDashboard';

/**
 * Enhanced useQuery hook with performance monitoring and smart caching
 */
export const useEnhancedQuery = (query, options = {}) => {
  const {
    trackPerformance = true,
    componentName,
    transformData,
    cacheTimeout = 300000, // 5 minutes default
    retryAttempts = 3,
    onError: customErrorHandler,
    ...apolloOptions
  } = options;

  const { recordMetric } = usePerformanceMonitoring();
  const [performanceData, setPerformanceData] = useState({});
  const startTimeRef = useRef(null);
  const retryCountRef = useRef(0);

  // Start performance tracking
  const onQueryStart = useCallback(() => {
    if (trackPerformance) {
      startTimeRef.current = performance.now();
    }
  }, [trackPerformance]);

  // Handle query completion
  const onQueryComplete = useCallback((result) => {
    if (trackPerformance && startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      const metrics = {
        duration,
        cacheHit: result.loading === false && result.networkStatus === 7,
        hasErrors: !!result.error,
        dataSize: result.data ? JSON.stringify(result.data).length : 0,
        retryCount: retryCountRef.current
      };
      
      setPerformanceData(metrics);
      
      if (componentName) {
        recordMetric(`graphql_query_${componentName}`, metrics);
      }
    }
  }, [trackPerformance, componentName, recordMetric]);

  // Enhanced error handling with retry logic
  const handleError = useCallback((error) => {
    if (retryCountRef.current < retryAttempts && isRetryableError(error)) {
      retryCountRef.current += 1;
      setTimeout(() => {
        queryResult.refetch();
      }, Math.pow(2, retryCountRef.current) * 1000); // Exponential backoff
    }
    
    if (customErrorHandler) {
      customErrorHandler(error);
    }
  }, [retryAttempts, customErrorHandler]);

  const queryResult = useQuery(query, {
    ...apolloOptions,
    onError: handleError,
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      onQueryComplete(queryResult);
      apolloOptions.onCompleted?.(data);
    }
  });

  // Transform data if transform function provided
  const transformedData = useMemo(() => {
    if (!queryResult.data || !transformData) return queryResult.data;
    return transformData(queryResult.data);
  }, [queryResult.data, transformData]);

  // Enhanced retry function
  const retryQuery = useCallback(() => {
    retryCountRef.current = 0;
    onQueryStart();
    return queryResult.refetch();
  }, [queryResult, onQueryStart]);

  return {
    ...queryResult,
    data: transformedData,
    retry: retryQuery,
    performanceData: trackPerformance ? performanceData : null,
    retryCount: retryCountRef.current
  };
};

/**
 * Enhanced useMutation hook with optimistic updates and cache management
 */
export const useEnhancedMutation = (mutation, options = {}) => {
  const {
    trackPerformance = true,
    componentName,
    optimisticUpdate,
    rollbackOnError = true,
    invalidateQueries = [],
    updateQueries = {},
    onError: customErrorHandler,
    onSuccess: customSuccessHandler,
    ...apolloOptions
  } = options;

  const client = useApolloClient();
  const { recordMetric } = usePerformanceMonitoring();
  const [performanceData, setPerformanceData] = useState({});
  const optimisticIdRef = useRef(null);

  const [mutate, mutationResult] = useMutation(mutation, {
    ...apolloOptions,
    onError: (error) => {
      // Handle rollback
      if (rollbackOnError && optimisticIdRef.current) {
        client.cache.evict({ id: optimisticIdRef.current });
        client.cache.gc();
      }
      
      if (customErrorHandler) {
        customErrorHandler(error);
      }
    },
    onCompleted: (data) => {
      // Clean up optimistic data
      if (optimisticIdRef.current) {
        optimisticIdRef.current = null;
      }
      
      // Invalidate specified queries
      invalidateQueries.forEach(queryInfo => {
        client.refetchQueries({
          include: [queryInfo.query],
          variables: queryInfo.variables
        });
      });
      
      if (customSuccessHandler) {
        customSuccessHandler(data);
      }
    }
  });

  // Enhanced mutate function with performance tracking and optimistic updates
  const enhancedMutate = useCallback(async (mutationOptions = {}) => {
    const startTime = trackPerformance ? performance.now() : null;
    
    try {
      // Apply optimistic update
      if (optimisticUpdate) {
        optimisticIdRef.current = client.cache.writeQuery({
          ...optimisticUpdate(mutationOptions.variables),
          data: {
            ...optimisticUpdate(mutationOptions.variables).data,
            __optimistic: true
          }
        });
      }

      // Execute mutation
      const result = await mutate({
        ...mutationOptions,
        update: (cache, mutationResult) => {
          // Apply custom cache updates
          Object.entries(updateQueries).forEach(([queryName, updateFn]) => {
            updateFn(cache, mutationResult, mutationOptions.variables);
          });
          
          // Call original update function if provided
          mutationOptions.update?.(cache, mutationResult);
        }
      });

      // Record performance metrics
      if (trackPerformance && componentName && startTime) {
        const metrics = {
          duration: performance.now() - startTime,
          hasErrors: false,
          affectedRecords: result.data ? Object.keys(result.data).length : 0
        };
        
        setPerformanceData(metrics);
        recordMetric(`graphql_mutation_${componentName}`, metrics);
      }

      return result;
    } catch (error) {
      // Record error metrics
      if (trackPerformance && componentName && startTime) {
        const metrics = {
          duration: performance.now() - startTime,
          hasErrors: true,
          errorType: error.constructor.name
        };
        
        setPerformanceData(metrics);
        recordMetric(`graphql_mutation_error_${componentName}`, metrics);
      }
      
      throw error;
    }
  }, [mutate, optimisticUpdate, updateQueries, trackPerformance, componentName, recordMetric, client]);

  return [
    enhancedMutate,
    {
      ...mutationResult,
      performanceData: trackPerformance ? performanceData : null
    }
  ];
};

/**
 * Smart query hook that handles authentication state and provides fallbacks
 */
export const useAuthenticatedQuery = (query, options = {}) => {
  const { user, isAuthenticated } = useFixedSecureAuth();
  const { 
    requireAuth = true, 
    fallbackData = null,
    variables,
    ...queryOptions 
  } = options;

  // Enhance variables with user data if authenticated
  const enhancedVariables = useMemo(() => {
    if (!isAuthenticated || !user) return variables;
    
    return {
      ...variables,
      profileid: variables?.profileid || user.profileid,
      username: variables?.username || user.username
    };
  }, [variables, isAuthenticated, user]);

  const shouldSkip = requireAuth && !isAuthenticated;

  const queryResult = useEnhancedQuery(query, {
    ...queryOptions,
    variables: enhancedVariables,
    skip: shouldSkip
  });

  return {
    ...queryResult,
    data: shouldSkip ? fallbackData : queryResult.data,
    isAuthRequired: requireAuth,
    isAuthenticated
  };
};

/**
 * Batched queries hook for dashboard-style components
 */
export const useBatchedQueries = (queryConfigs = []) => {
  const [batchedData, setBatchedData] = useState({});
  const [batchedLoading, setBatchedLoading] = useState(true);
  const [batchedErrors, setBatchedErrors] = useState({});
  
  const client = useApolloClient();

  const executeBatch = useCallback(async () => {
    setBatchedLoading(true);
    setBatchedErrors({});
    
    try {
      const promises = queryConfigs.map(async ({ key, query, variables, transform }) => {
        try {
          const result = await client.query({ query, variables });
          return {
            key,
            data: transform ? transform(result.data) : result.data,
            error: null
          };
        } catch (error) {
          return {
            key,
            data: null,
            error: error.message
          };
        }
      });

      const results = await Promise.allSettled(promises);
      
      const data = {};
      const errors = {};
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          data[result.value.key] = result.value.data;
          if (result.value.error) {
            errors[result.value.key] = result.value.error;
          }
        } else {
          errors[result.key] = result.reason.message;
        }
      });
      
      setBatchedData(data);
      setBatchedErrors(errors);
    } catch (error) {
      console.error('Batch query execution failed:', error);
    } finally {
      setBatchedLoading(false);
    }
  }, [queryConfigs, client]);

  useEffect(() => {
    if (queryConfigs.length > 0) {
      executeBatch();
    }
  }, [executeBatch]);

  const refetchBatch = useCallback(() => {
    executeBatch();
  }, [executeBatch]);

  return {
    data: batchedData,
    loading: batchedLoading,
    errors: batchedErrors,
    refetch: refetchBatch,
    hasErrors: Object.keys(batchedErrors).length > 0
  };
};

/**
 * Real-time query hook with subscription support
 */
export const useRealTimeQuery = (query, subscription, options = {}) => {
  const {
    variables,
    subscriptionVariables,
    mergeSubscriptionData,
    ...queryOptions
  } = options;

  const queryResult = useEnhancedQuery(query, {
    ...queryOptions,
    variables
  });

  // Use subscription to get real-time updates
  const subscriptionResult = useSubscription(subscription, {
    variables: subscriptionVariables || variables,
    onSubscriptionData: ({ subscriptionData }) => {
      if (!subscriptionData.data) return;
      
      // Merge subscription data with query cache
      if (mergeSubscriptionData) {
        const existingData = queryResult.data;
        const mergedData = mergeSubscriptionData(existingData, subscriptionData.data);
        
        // Update cache with merged data
        queryResult.updateQuery(() => mergedData);
      }
    }
  });

  return {
    ...queryResult,
    subscription: subscriptionResult,
    isLive: !subscriptionResult.loading && !subscriptionResult.error
  };
};

/**
 * Cache management hook for manual cache operations
 */
export const useCacheManager = () => {
  const client = useApolloClient();

  const invalidateQuery = useCallback((query, variables = {}) => {
    client.refetchQueries({
      include: [query],
      variables
    });
  }, [client]);

  const updateCache = useCallback((query, variables, updateFn) => {
    const existingData = client.cache.readQuery({ query, variables });
    if (existingData) {
      const updatedData = updateFn(existingData);
      client.cache.writeQuery({
        query,
        variables,
        data: updatedData
      });
    }
  }, [client]);

  const evictFromCache = useCallback((typename, id) => {
    client.cache.evict({
      id: client.cache.identify({ __typename: typename, id })
    });
    client.cache.gc();
  }, [client]);

  const getCacheSize = useCallback(() => {
    const cache = client.cache;
    return Object.keys(cache.data.data).length;
  }, [client]);

  const clearCache = useCallback(() => {
    client.cache.reset();
  }, [client]);

  return {
    invalidateQuery,
    updateCache,
    evictFromCache,
    getCacheSize,
    clearCache
  };
};

// Utility functions
export const isRetryableError = (error) => {
  if (!error) return false;
  
  // Network errors are generally retryable
  if (error.networkError) {
    const networkError = error.networkError;
    return networkError.statusCode >= 500 || networkError.statusCode === 429;
  }
  
  // GraphQL errors with specific error codes
  if (error.graphQLErrors) {
    return error.graphQLErrors.some(gqlError => 
      ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'].includes(gqlError.extensions?.code)
    );
  }
  
  return false;
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  QUERY_DURATION_WARNING: 2000, // 2 seconds
  QUERY_DURATION_ERROR: 5000,   // 5 seconds
  CACHE_SIZE_WARNING: 1000,     // 1000 entries
  CACHE_SIZE_ERROR: 5000        // 5000 entries
};

export default {
  useEnhancedQuery,
  useEnhancedMutation,
  useAuthenticatedQuery,
  useBatchedQueries,
  useRealTimeQuery,
  useCacheManager,
  isRetryableError,
  PERFORMANCE_THRESHOLDS
};