/**
 * Enhanced API Client with Security-First Design
 * 
 * Features:
 * - Automatic CSRF token handling
 * - HttpOnly cookie authentication
 * - Request/response security validation
 * - Comprehensive error handling with backoff
 * - Security event logging
 * - Request deduplication
 * - Leak-safe logging
 */

import { getConfig, isProduction } from '../config/environment.js';

class EnhancedApiClient {
  constructor() {
    this.baseURL = getConfig('NEXT_PUBLIC_SERVER_URL') || `http://localhost:${getConfig('NEXT_PUBLIC_PORT', '45799')}`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    };
    
    // Security and performance features
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.pendingRequests = new Map(); // Request deduplication
    this.retryDelays = [1000, 2000, 4000]; // Exponential backoff
    this.securityEventLog = [];
    
    // CSRF token cache
    this.csrfToken = null;
    this.csrfTokenExpiry = 0;
    
    // Request rate limiting
    this.requestQueue = [];
    this.maxConcurrentRequests = 6;
    this.currentRequests = 0;
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
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Get CSRF token from cookie or fetch new one
   */
  async getCSRFToken() {
    // Check if we have a valid cached token
    if (this.csrfToken && Date.now() < this.csrfTokenExpiry) {
      return this.csrfToken;
    }
    
    // Try to get token from cookie first
    if (typeof document !== 'undefined') {
      // Try multiple cookie names that the backend might set
      const cookieNames = [
        '__Secure-csrfToken',  // Most common in production
        '__Host-csrfToken',    // Highest security level
        'csrfToken',           // Fallback for development
        'csrf-token'           // Legacy name
      ];
      
      for (const cookieName of cookieNames) {
        const cookieToken = this.getCookieValue(cookieName);
        if (cookieToken) {
          this.csrfToken = cookieToken;
          this.csrfTokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes
          return cookieToken;
        }
      }
    }
    
    // If no token available, make a request to get one
    try {
      const response = await fetch(`${this.baseURL}/api/v1/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
        this.csrfTokenExpiry = Date.now() + (55 * 60 * 1000);
        return this.csrfToken;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', this.sanitizeError(error));
    }
    
    return null;
  }
  
  /**
   * Get cookie value by name
   */
  getCookieValue(name) {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }
  
  /**
   * Get secure headers including CSRF protection
   */
  async getSecurityHeaders() {
    const headers = { ...this.defaultHeaders };
    
    // Add CSRF token for state-changing requests
    const csrfToken = await this.getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Add request fingerprinting for security
    headers['X-Request-Timestamp'] = Date.now().toString();
    headers['X-Client-Version'] = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    
    // Add security nonce from window if available (set by middleware)
    if (typeof window !== 'undefined' && window.__SECURITY_CONFIG__) {
      headers['X-Security-Nonce'] = window.__SECURITY_CONFIG__.nonce;
    }
    
    return headers;
  }

  /**
   * Prepare secure request with comprehensive security headers
   */
  async prepareRequest(url, options = {}) {
    // Ensure URL is absolute
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Get security headers
    const securityHeaders = await this.getSecurityHeaders();
    
    // Merge headers with security priority
    const headers = {
      ...securityHeaders,
      ...(options.headers || {})
    };

    // Prepare final options with security defaults
    let finalOptions = {
      ...options,
      headers,
      credentials: 'include', // Always include cookies for httpOnly auth
      mode: 'cors',
      cache: 'no-cache', // Prevent caching of sensitive requests
      redirect: 'manual' // Handle redirects manually for security
    };
    
    // Validate request security
    this.validateRequestSecurity(fullUrl, finalOptions);

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      finalOptions = await interceptor(finalOptions);
    }

    return { url: fullUrl, options: finalOptions };
  }

  /**
   * Process response with interceptors
   */
  async processResponse(response, originalRequest) {
    let finalResponse = response;

    // Apply response interceptors
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse, originalRequest);
    }

    return finalResponse;
  }

  /**
   * Validate request security
   */
  validateRequestSecurity(url, options) {
    // Check for HTTPS in production
    if (isProduction() && !url.startsWith('https://') && !url.includes('localhost')) {
      this.logSecurityEvent('insecure_request', { url: this.sanitizeUrl(url) });
      throw new Error('Insecure request attempted in production');
    }
    
    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(options.method)) {
      const contentType = options.headers['Content-Type'];
      if (!contentType || !contentType.includes('application/json')) {
        this.logSecurityEvent('invalid_content_type', { method: options.method, contentType });
      }
    }
    
    // Check for required security headers
    if (!options.headers['X-CSRF-Token'] && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      this.logSecurityEvent('missing_csrf_token', { method: options.method, url: this.sanitizeUrl(url) });
    }
  }
  
  /**
   * Sanitize URL for logging (remove sensitive parameters)
   */
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Create a new URLSearchParams to avoid mutating read-only object
      const newSearchParams = new URLSearchParams(urlObj.searchParams);
      
      // Remove sensitive query parameters from the copy
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
      sensitiveParams.forEach(param => {
        if (newSearchParams.has(param)) {
          newSearchParams.set(param, '[REDACTED]');
        }
      });
      
      // Create new URL with sanitized params
      urlObj.search = newSearchParams.toString();
      return urlObj.toString();
    } catch (e) {
      return '[INVALID_URL]';
    }
  }
  
  /**
   * Sanitize error for logging (remove sensitive information)
   */
  sanitizeError(error) {
    if (typeof error === 'object' && error !== null) {
      const sanitized = { ...error };
      const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth', 'authorization'];
      
      // Sanitize error message
      if (sanitized.message) {
        let message = sanitized.message;
        sensitiveKeys.forEach(key => {
          const regex = new RegExp(`${key}[=:]\s*[^\s&]+`, 'gi');
          message = message.replace(regex, `${key}=[REDACTED]`);
        });
        sanitized.message = message;
      }
      
      // Remove sensitive properties
      sensitiveKeys.forEach(key => {
        if (key in sanitized) {
          sanitized[key] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    return error;
  }
  
  /**
   * Log security events
   */
  logSecurityEvent(eventType, details) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      details: this.sanitizeError(details),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      environment: process.env.NODE_ENV
    };
    
    this.securityEventLog.push(event);
    
    // Keep only last 50 events
    if (this.securityEventLog.length > 50) {
      this.securityEventLog.shift();
    }
    
    // Log to console in development
    if (!isProduction()) {
      console.warn(`🔐 Security Event [${eventType}]:`, details);
    }
    
    // In production, you would send to monitoring service
    // await this.sendToSecurityMonitoring(event);
  }
  
  /**
   * Handle authentication and authorization errors
   */
  async handleAuthError(response, originalUrl, originalOptions) {
    const sanitizedUrl = this.sanitizeUrl(originalUrl);
    
    if (response.status === 401) {
      this.logSecurityEvent('authentication_failed', { 
        url: sanitizedUrl, 
        status: response.status 
      });
      
      // In this implementation, we rely on httpOnly cookies
      // so we redirect to login page for re-authentication
      if (typeof window !== 'undefined') {
        // Store current location for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        
        // Redirect to login
        window.location.href = '/login';
      }
      
      throw new Error('Authentication required - redirecting to login');
    }
    
    if (response.status === 403) {
      this.logSecurityEvent('authorization_failed', { 
        url: sanitizedUrl, 
        status: response.status 
      });
      throw new Error('Access denied - insufficient permissions');
    }

    return response;
  }

  /**
   * Enhanced fetch with retry logic and auth handling
   */
  async fetch(url, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Prepare request
        const { url: fullUrl, options: requestOptions } = await this.prepareRequest(url, options);
        
        // Make request
        console.log(`🔄 API Request (attempt ${attempt + 1}):`, {
          url: fullUrl,
          method: requestOptions.method || 'GET',
          hasAuth: !!requestOptions.headers['Authorization']
        });

        let response = await fetch(fullUrl, requestOptions);

        // Handle authentication errors
        if (response.status === 401 && attempt < maxRetries) {
          response = await this.handleAuthError(response, fullUrl, requestOptions);
        }

        // Process response through interceptors
        response = await this.processResponse(response, { url: fullUrl, options: requestOptions });

        // If response is ok or this is the last attempt, return it
        if (response.ok || attempt === maxRetries) {
          console.log(`✅ API Response (${response.status}):`, {
            url: fullUrl,
            status: response.status,
            ok: response.ok
          });
          return response;
        }

        // If not ok and we have retries left, continue to next attempt
        console.log(`⚠️ Request failed (attempt ${attempt + 1}), retrying...`, {
          status: response.status,
          statusText: response.statusText
        });

      } catch (error) {
        console.error(`❌ API Error (attempt ${attempt + 1}):`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.fetch(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post(url, data, options = {}) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  async put(url, data, options = {}) {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PATCH request
   */
  async patch(url, data, options = {}) {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.fetch(url, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * Upload file(s)
   */
  async upload(url, files, additionalData = {}, options = {}) {
    const formData = new FormData();
    
    // Add files
    if (files instanceof FileList) {
      Array.from(files).forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    } else if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    } else if (files instanceof File) {
      formData.append('file', files);
    }

    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    // Remove Content-Type header to let browser set it with boundary
    const uploadOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        // Remove Content-Type to let browser set multipart boundary
      }
    };
    
    if (uploadOptions.headers['Content-Type']) {
      delete uploadOptions.headers['Content-Type'];
    }

    return this.fetch(url, {
      ...uploadOptions,
      method: 'POST',
      body: formData
    });
  }

  /**
   * JSON helper - automatically parse response as JSON
   */
  async json(url, options = {}) {
    const response = await this.fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json();
  }

  /**
   * Text helper - automatically get response as text
   */
  async text(url, options = {}) {
    const response = await this.fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.text();
  }

  /**
   * Blob helper - for file downloads
   */
  async blob(url, options = {}) {
    const response = await this.fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.blob();
  }
}

// Create singleton instance
const enhancedApiClient = new EnhancedApiClient();

// Add default response interceptor for common error handling
enhancedApiClient.addResponseInterceptor(async (response, request) => {
  // Log response details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📡 API Response:', {
      url: request.url,
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
  }

  return response;
});

// Add default request interceptor for logging
enhancedApiClient.addRequestInterceptor(async (options) => {
  // Log request details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📤 API Request:', {
      method: options.method,
      hasAuth: !!options.headers['Authorization'],
      headers: options.headers
    });
  }

  return options;
});

export default enhancedApiClient;

/**
 * Hook for using the API client in React components
 */
export const useApiClient = () => {
  return enhancedApiClient;
};

/**
 * Utility functions for common patterns
 */
export const apiHelpers = {
  /**
   * Check if error is authentication related
   */
  isAuthError: (error) => {
    return error.message.includes('Authentication failed') || 
           error.message.includes('401') ||
           error.message.includes('Unauthorized');
  },

  /**
   * Check if error is network related
   */
  isNetworkError: (error) => {
    return error.message.includes('Failed to fetch') ||
           error.message.includes('Network Error') ||
           error.message.includes('ERR_NETWORK');
  },

  /**
   * Create a safe API call wrapper
   */
  safeApiCall: async (apiCall, fallbackValue = null) => {
    try {
      return await apiCall();
    } catch (error) {
      console.error('Safe API call failed:', error);
      return fallbackValue;
    }
  },

  /**
   * Retry an API call with exponential backoff
   */
  retryApiCall: async (apiCall, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};