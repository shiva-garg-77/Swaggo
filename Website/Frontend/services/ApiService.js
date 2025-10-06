/**
 * Centralized API Service
 * Provides unified API response handling, formatting, and error management
 */

import { AuthErrorHandler } from '../utils/authUtils';
import authService from './AuthService';

/**
 * Standard API Response Interface
 */
class ApiResponse {
  constructor(success, data = null, error = null, meta = {}) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.meta = {
      timestamp: new Date().toISOString(),
      ...meta
    };
  }

  static success(data, meta = {}) {
    return new ApiResponse(true, data, null, meta);
  }

  static error(error, meta = {}) {
    return new ApiResponse(false, null, error, meta);
  }
}

/**
 * API Service Class
 * Handles all API requests with unified response formatting
 */
class ApiService {
  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? `http://localhost:${process.env.NEXT_PUBLIC_PORT || 3001}` 
      : '';
    
    this.defaultTimeout = 10000;
    this.maxRetries = 3;
    
    // Request/response interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Setup default interceptors
    this.setupDefaultInterceptors();
  }

  /**
   * Setup default request/response interceptors
   */
  setupDefaultInterceptors() {
    // Add authentication token to requests
    this.addRequestInterceptor(async (config) => {
      const token = authService.getCurrentToken();
      if (token && config.requiresAuth !== false) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return config;
    });

    // Handle authentication errors in responses
    this.addResponseInterceptor(
      (response) => response, // Success handler
      async (error) => { // Error handler
        if (error.status === 401 && authService.isAuthenticated()) {
          // Try to refresh token
          try {
            await authService.refreshToken();
            // Retry the original request
            return this.retryRequest(error.config);
          } catch (refreshError) {
            // Refresh failed, logout user
            await authService.logout();
            throw AuthErrorHandler.createError('AUTH_EXPIRED', 'Session expired. Please log in again.');
          }
        }
        throw error;
      }
    );
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(successHandler, errorHandler) {
    this.responseInterceptors.push({ successHandler, errorHandler });
  }

  /**
   * Process request through interceptors
   */
  async processRequestInterceptors(config) {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }
    return processedConfig;
  }

  /**
   * Process response through interceptors
   */
  async processResponseInterceptors(response, error = null) {
    let processedResponse = response;
    let processedError = error;

    for (const { successHandler, errorHandler } of this.responseInterceptors) {
      try {
        if (processedError && errorHandler) {
          processedError = await errorHandler(processedError);
        } else if (!processedError && successHandler) {
          processedResponse = await successHandler(processedResponse);
        }
      } catch (interceptorError) {
        console.error('Response interceptor error:', interceptorError);
        if (!processedError) {
          processedError = interceptorError;
        }
      }
    }

    if (processedError) {
      throw processedError;
    }

    return processedResponse;
  }

  /**
   * Main request method
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.defaultTimeout,
      retries = this.maxRetries,
      requiresAuth = true,
      ...otherOptions
    } = options;

    // Build request config
    let config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include',
      requiresAuth,
      ...otherOptions
    };

    // Add body if present
    if (body) {
      if (body instanceof FormData) {
        // Don't set content-type for FormData, let browser handle it
        delete config.headers['Content-Type'];
        config.body = body;
      } else if (typeof body === 'object') {
        config.body = JSON.stringify(body);
      } else {
        config.body = body;
      }
    }

    // Process request interceptors
    config = await this.processRequestInterceptors(config);

    // Make the request with retry logic
    return this.makeRequestWithRetry(`${this.baseUrl}${endpoint}`, config, timeout, retries);
  }

  /**
   * Make request with retry logic
   */
  async makeRequestWithRetry(url, config, timeout, retries) {
    let lastError;
    const originalConfig = { ...config };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest(url, config, timeout);
        
        // Process response interceptors
        const processedResponse = await this.processResponseInterceptors(response);
        
        return this.formatResponse(processedResponse);
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Reset config for retry
        config = { ...originalConfig };
      }
    }

    // Process error through interceptors
    try {
      await this.processResponseInterceptors(null, lastError);
    } catch (interceptorError) {
      lastError = interceptorError;
    }

    throw this.formatError(lastError);
  }

  /**
   * Make individual request
   */
  async makeRequest(url, config, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      config.signal = controller.signal;
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { message: response.statusText };
        }

        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        error.response = response;
        throw error;
      }

      // Handle different content types
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return {
          data,
          status: response.status,
          headers: response.headers,
          response
        };
      } else if (contentType && contentType.includes('text/')) {
        const text = await response.text();
        return {
          data: text,
          status: response.status,
          headers: response.headers,
          response
        };
      } else {
        // Handle binary data
        const blob = await response.blob();
        return {
          data: blob,
          status: response.status,
          headers: response.headers,
          response
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.status = 408;
        timeoutError.type = 'REQUEST_TIMEOUT';
        throw timeoutError;
      }
      
      throw error;
    }
  }

  /**
   * Retry a failed request
   */
  async retryRequest(originalConfig) {
    return this.request(originalConfig.url, originalConfig);
  }

  /**
   * Format successful response
   */
  formatResponse(response) {
    const { data, status, headers } = response;
    
    return ApiResponse.success(data, {
      status,
      headers: this.headersToObject(headers)
    });
  }

  /**
   * Format error response
   */
  formatError(error) {
    let formattedError;
    
    if (error.type) {
      // Already formatted error
      formattedError = error;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      formattedError = AuthErrorHandler.createError(
        'NETWORK_ERROR', 
        'Network connection failed. Please check your internet connection.'
      );
    } else if (error.status) {
      // HTTP error
      formattedError = AuthErrorHandler.createError(
        'HTTP_ERROR',
        error.message || `HTTP ${error.status}`,
        { 
          status: error.status,
          data: error.data 
        }
      );
    } else {
      // Unknown error
      formattedError = AuthErrorHandler.createError(
        'UNKNOWN_ERROR',
        error.message || 'An unknown error occurred'
      );
    }

    return ApiResponse.error(formattedError, {
      originalError: error
    });
  }

  /**
   * Convert Headers object to plain object
   */
  headersToObject(headers) {
    const obj = {};
    if (headers && typeof headers.forEach === 'function') {
      headers.forEach((value, key) => {
        obj[key] = value;
      });
    }
    return obj;
  }

  /**
   * Convenience methods for different HTTP verbs
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data 
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data 
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: data 
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(endpoint, file, options = {}) {
    const {
      onProgress,
      additionalData = {},
      fieldName = 'file',
      ...otherOptions
    } = options;

    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional form data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Setup progress tracking
    if (onProgress && typeof onProgress === 'function') {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage: percentComplete
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(ApiResponse.success(response));
            } catch (error) {
              resolve(ApiResponse.success(xhr.responseText));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(this.formatError({
                status: xhr.status,
                message: errorData.message || xhr.statusText,
                data: errorData
              }));
            } catch (parseError) {
              reject(this.formatError({
                status: xhr.status,
                message: xhr.statusText
              }));
            }
          }
        };

        xhr.onerror = () => {
          reject(this.formatError(new Error('Upload failed')));
        };

        // Add authorization header if needed
        const token = authService.getCurrentToken();
        if (token && otherOptions.requiresAuth !== false) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.open('POST', `${this.baseUrl}${endpoint}`);
        xhr.send(formData);
      });
    } else {
      // Use regular request method
      return this.post(endpoint, formData, {
        ...otherOptions,
        headers: {
          // Don't set Content-Type, let browser handle it for FormData
          ...Object.fromEntries(
            Object.entries(otherOptions.headers || {})
              .filter(([key]) => key.toLowerCase() !== 'content-type')
          )
        }
      });
    }
  }

  /**
   * Download file
   */
  async downloadFile(endpoint, filename, options = {}) {
    try {
      const response = await this.request(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          'Accept': 'application/octet-stream'
        }
      });

      if (response.success && response.data instanceof Blob) {
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return ApiResponse.success({ filename, size: response.data.size });
      } else {
        throw new Error('Invalid file response');
      }
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    // This would require tracking active requests
    // For now, we'll just clear any timeouts
    console.log('Cancelling all API requests');
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      const response = await this.get('/api/health', {
        timeout: 5000,
        retries: 1,
        requiresAuth: false
      });
      return response;
    } catch (error) {
      return ApiResponse.error(error, {
        message: 'API health check failed'
      });
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiResponse };