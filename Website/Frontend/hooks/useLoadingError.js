"use client";

import { useState, useCallback, useRef } from 'react';

// Create useErrorHandler hook since it doesn't exist in ErrorBoundary
const useErrorHandler = () => {
  return useCallback((error, context = {}) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(' Error Handler:', error, context);
    }
    
    // In production, send to monitoring service
    if (typeof window !== 'undefined' && window.errorReporting) {
      window.errorReporting.logError(error, context);
    }
  }, []);
};

/**
 * Hook for managing loading states and error handling
 */
export const useLoadingError = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const handleError = useErrorHandler();
  const abortControllerRef = useRef(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const execute = useCallback(async (asyncOperation, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      transform,
      timeout = 10000,
      retryCount = 0,
      retryDelay = 1000
    } = options;

    // Abort any previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    let attempt = 0;
    const maxAttempts = retryCount + 1;

    while (attempt < maxAttempts) {
      try {
        // Add timeout to the promise
        const timeoutPromise = new Promise((_, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('Operation timed out')), timeout);
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Operation aborted'));
          });
        });

        const result = await Promise.race([
          asyncOperation(signal),
          timeoutPromise
        ]);

        // Check if aborted
        if (signal.aborted) {
          throw new Error('Operation aborted');
        }

        // Transform data if transformer provided
        const finalData = transform ? transform(result) : result;
        
        setData(finalData);
        setLoading(false);
        
        if (onSuccess) {
          onSuccess(finalData);
        }

        return finalData;
      } catch (err) {
        attempt++;
        
        // If this was the last attempt or error is not retryable
        if (attempt >= maxAttempts || err.name === 'AbortError' || err.message.includes('aborted')) {
          setError(err);
          setLoading(false);
          
          handleError(err, { 
            operation: asyncOperation.name || 'unknown',
            attempt,
            maxAttempts 
          });
          
          if (onError) {
            onError(err);
          }
          
          throw err;
        }
        
        // Wait before retry
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
  }, [handleError]);

  return {
    loading,
    error,
    data,
    execute,
    clearError,
    clearData,
    reset,
    setLoading,
    setError,
    setData
  };
};

/**
 * Hook for managing multiple loading states
 */
export const useMultipleLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  const handleError = useErrorHandler();

  const setLoading = useCallback((key, loading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const setError = useCallback((key, error) => {
    setErrors(prev => ({
      ...prev,
      [key]: error
    }));
    
    if (error) {
      handleError(error, { key });
    }
  }, [handleError]);

  const clearError = useCallback((key) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const hasError = useCallback((key) => {
    return errors[key] || null;
  }, [errors]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const hasAnyError = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    setLoading,
    setError,
    clearError,
    clearAllErrors,
    isLoading,
    hasError,
    isAnyLoading,
    hasAnyError,
    loadingStates,
    errors
  };
};

/**
 * Hook for GraphQL operation states
 */
export const useGraphQLLoadingError = () => {
  const [operations, setOperations] = useState({});
  const handleError = useErrorHandler();

  const updateOperation = useCallback((operationName, update) => {
    setOperations(prev => ({
      ...prev,
      [operationName]: {
        ...prev[operationName],
        ...update
      }
    }));
  }, []);

  const setOperationLoading = useCallback((operationName, loading) => {
    updateOperation(operationName, { loading, error: null });
  }, [updateOperation]);

  const setOperationError = useCallback((operationName, error) => {
    updateOperation(operationName, { loading: false, error });
    handleError(error, { operation: operationName });
  }, [updateOperation, handleError]);

  const setOperationData = useCallback((operationName, data) => {
    updateOperation(operationName, { loading: false, data, error: null });
  }, [updateOperation]);

  const getOperationState = useCallback((operationName) => {
    return operations[operationName] || { loading: false, error: null, data: null };
  }, [operations]);

  const clearOperation = useCallback((operationName) => {
    setOperations(prev => {
      const newOperations = { ...prev };
      delete newOperations[operationName];
      return newOperations;
    });
  }, []);

  return {
    setOperationLoading,
    setOperationError,
    setOperationData,
    getOperationState,
    clearOperation,
    operations
  };
};

/**
 * Hook for retry functionality with exponential backoff
 */
export const useRetry = (operation, dependencies = []) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const { loading, error, execute, reset } = useLoadingError();

  const retry = useCallback(async (customRetryCount = 3) => {
    setIsRetrying(true);
    
    try {
      await execute(operation, {
        retryCount: customRetryCount,
        retryDelay: Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff capped at 10s
      });
      setRetryCount(0);
    } catch (err) {
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  }, [execute, operation, retryCount]);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    reset();
  }, [reset]);

  return {
    retry,
    resetRetry,
    retryCount,
    isRetrying,
    loading,
    error
  };
};

export default useLoadingError;