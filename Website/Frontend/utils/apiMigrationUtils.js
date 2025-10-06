/**
 * API Migration Utilities
 * Helper functions to easily migrate from fetch to enhancedApiClient
 */

import React from 'react';
import enhancedApiClient, { apiHelpers } from '../lib/enhancedApiClient';

/**
 * Drop-in replacement for fetch that uses enhancedApiClient
 * This allows existing code to work with minimal changes
 */
export const enhancedFetch = async (url, options = {}) => {
  try {
    // If URL starts with http, use it as-is, otherwise prepend base URL
    const finalUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
    
    const response = await enhancedApiClient.fetch(finalUrl, options);
    return response;
  } catch (error) {
    console.error('Enhanced fetch error:', error);
    throw error;
  }
};

/**
 * Enhanced fetch with automatic JSON parsing
 */
export const fetchJSON = async (url, options = {}) => {
  try {
    const finalUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
    return await enhancedApiClient.json(finalUrl, options);
  } catch (error) {
    console.error('Enhanced fetchJSON error:', error);
    throw error;
  }
};

/**
 * POST request helper with automatic JSON handling
 */
export const postJSON = async (url, data, options = {}) => {
  try {
    const finalUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
    return await enhancedApiClient.json(finalUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  } catch (error) {
    console.error('Enhanced postJSON error:', error);
    throw error;
  }
};

/**
 * PUT request helper with automatic JSON handling
 */
export const putJSON = async (url, data, options = {}) => {
  try {
    const finalUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
    return await enhancedApiClient.json(finalUrl, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  } catch (error) {
    console.error('Enhanced putJSON error:', error);
    throw error;
  }
};

/**
 * DELETE request helper
 */
export const deleteRequest = async (url, options = {}) => {
  try {
    const finalUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
    const response = await enhancedApiClient.delete(finalUrl, options);
    
    if (response.ok) {
      try {
        return await response.json();
      } catch {
        return { success: true };
      }
    } else {
      throw new Error(`Delete request failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Enhanced delete error:', error);
    throw error;
  }
};

/**
 * Upload helper for file uploads
 */
export const uploadFiles = async (url, files, additionalData = {}, options = {}) => {
  try {
    const finalUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`;
    const response = await enhancedApiClient.upload(finalUrl, files, additionalData, options);
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Upload failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Enhanced upload error:', error);
    throw error;
  }
};

/**
 * Safe API call wrapper with error handling
 */
export const safeApiCall = async (apiFunction, fallbackValue = null, onError = null) => {
  try {
    return await apiFunction();
  } catch (error) {
    console.error('Safe API call failed:', error);
    
    if (onError && typeof onError === 'function') {
      onError(error);
    }
    
    return fallbackValue;
  }
};

/**
 * API call with retry logic
 */
export const retryApiCall = async (apiFunction, maxRetries = 3, delay = 1000) => {
  return await apiHelpers.retryApiCall(apiFunction, maxRetries, delay);
};

/**
 * Check if an error is authentication related
 */
export const isAuthError = (error) => {
  return apiHelpers.isAuthError(error);
};

/**
 * Check if an error is network related
 */
export const isNetworkError = (error) => {
  return apiHelpers.isNetworkError(error);
};

/**
 * Legacy fetch wrapper that maintains backward compatibility
 * Use this to gradually migrate existing fetch calls
 */
export const legacyFetchWrapper = (originalFetch) => {
  return async (url, options = {}) => {
    // Check if this is an API call that needs authentication
    const isApiCall = url.includes('/api/') || url.startsWith('/api') || 
                      url.includes('localhost') || url.includes('127.0.0.1');
    
    if (isApiCall) {
      console.log('🔄 Legacy fetch intercepted, using enhanced client:', url);
      return enhancedFetch(url, options);
    }
    
    // For non-API calls (like external resources), use original fetch
    return originalFetch(url, options);
  };
};

/**
 * Auto-migration helper for components
 * Wraps a component's API calls with enhanced functionality
 */
export const withEnhancedApi = (WrappedComponent) => {
  return function EnhancedApiComponent(props) {
    // Provide enhanced API utilities as props
    const apiUtils = {
      fetchJSON,
      postJSON,
      putJSON,
      deleteRequest,
      uploadFiles,
      safeApiCall,
      retryApiCall,
      isAuthError,
      isNetworkError
    };

    return <WrappedComponent {...props} apiUtils={apiUtils} />;
  };
};

export default {
  enhancedFetch,
  fetchJSON,
  postJSON,
  putJSON,
  deleteRequest,
  uploadFiles,
  safeApiCall,
  retryApiCall,
  isAuthError,
  isNetworkError,
  legacyFetchWrapper,
  withEnhancedApi
};