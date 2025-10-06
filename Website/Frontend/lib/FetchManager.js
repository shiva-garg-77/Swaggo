/**
 * 🌐 Robust Fetch Manager
 * 
 * Comprehensive fetch wrapper with connection error handling, retry logic,
 * and Windows-specific network optimizations.
 */

class FetchManager {
  constructor() {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,      // Start with 1 second
      maxDelay: 10000,      // Max 10 seconds
      timeout: 15000,       // 15 second timeout
      retryOnCodes: [408, 429, 500, 502, 503, 504, 521, 522, 524],
      retryOnErrors: ['NetworkError', 'Connection closed', 'Failed to fetch', 'Load failed'],
    };
    
    this.activeRequests = new Map();
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      retried: 0,
    };
    
    // Original fetch reference (client-side only)
    this.originalFetch = typeof window !== 'undefined' ? window.fetch : global.fetch || fetch;
    
    console.log('🌐 Fetch Manager initialized');
  }
  
  /**
   * Enhanced fetch with retry logic and error handling
   */
  async fetch(url, options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    // Merge default options with Windows-specific optimizations
    const enhancedOptions = {
      timeout: this.config.timeout,
      ...options,
      headers: {
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Accept': 'application/json, text/plain, */*',
        ...options.headers,
      },
      // Add Windows-specific settings
      keepalive: true,
      signal: options.signal || AbortSignal.timeout(this.config.timeout),
    };
    
    this.requestStats.total++;
    
    let lastError;
    let attempt = 0;
    
    while (attempt <= this.config.maxRetries) {
      try {
        console.log(`🌐 Fetch attempt ${attempt + 1}/${this.config.maxRetries + 1}: ${url}`);
        
        // Store active request for tracking
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), enhancedOptions.timeout);
        
        this.activeRequests.set(requestId, {
          url,
          startTime: Date.now(),
          attempt: attempt + 1,
          controller,
        });
        
        // Make the request
        const response = await this.originalFetch.call(window, url, {
          ...enhancedOptions,
          signal: controller.signal,
        });
        
        // Clear timeout and active request tracking
        clearTimeout(timeoutId);
        this.activeRequests.delete(requestId);
        
        // Check if response is ok or should be retried
        if (response.ok || !this.shouldRetry(response.status, null, attempt)) {
          if (response.ok) {
            this.requestStats.successful++;
          } else {
            this.requestStats.failed++;
          }
          
          const duration = Date.now() - startTime;
          console.log(`🌐 Fetch completed: ${url} (${response.status}) in ${duration}ms`);
          
          return response;
        }
        
        // Prepare for retry
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        // Clear active request tracking
        this.activeRequests.delete(requestId);
        
        console.log(`🌐 Fetch error (attempt ${attempt + 1}):`, error.message);
        
        lastError = error;
        
        // Don't retry if it's an abort error and not due to timeout
        if (error.name === 'AbortError' && !error.message.includes('timeout')) {
          break;
        }
        
        // Don't retry if it's not a retryable error
        if (!this.shouldRetry(null, error, attempt)) {
          break;
        }
      }
      
      attempt++;
      
      // Calculate delay for next attempt with exponential backoff
      if (attempt <= this.config.maxRetries) {
        const delay = Math.min(
          this.config.baseDelay * Math.pow(2, attempt - 1),
          this.config.maxDelay
        );
        
        console.log(`🌐 Retrying in ${delay}ms...`);
        this.requestStats.retried++;
        
        await this.delay(delay);
      }
    }
    
    // All retries exhausted
    this.requestStats.failed++;
    const duration = Date.now() - startTime;
    console.log(`🌐 Fetch failed after ${attempt} attempts: ${url} in ${duration}ms`);
    
    throw lastError;
  }
  
  /**
   * Determine if a request should be retried
   */
  shouldRetry(statusCode, error, attemptNumber) {
    // Don't retry if max retries reached
    if (attemptNumber >= this.config.maxRetries) {
      return false;
    }
    
    // Retry on specific HTTP status codes
    if (statusCode && this.config.retryOnCodes.includes(statusCode)) {
      return true;
    }
    
    // Retry on specific error types/messages
    if (error) {
      const errorMessage = error.message || '';
      const errorName = error.name || '';
      
      // Check for retryable error messages
      for (const retryableError of this.config.retryOnErrors) {
        if (errorMessage.includes(retryableError) || errorName.includes(retryableError)) {
          return true;
        }
      }
      
      // Retry on network-related errors
      if (error instanceof TypeError && errorMessage.includes('fetch')) {
        return true;
      }
      
      // Retry on timeout errors
      if (errorName === 'AbortError' && errorMessage.includes('timeout')) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get request statistics
   */
  getStats() {
    return {
      ...this.requestStats,
      successRate: this.requestStats.total > 0 
        ? (this.requestStats.successful / this.requestStats.total * 100).toFixed(2) + '%'
        : '0%',
      activeRequests: this.activeRequests.size,
      activeRequestDetails: Array.from(this.activeRequests.entries()).map(([id, req]) => ({
        id,
        url: req.url,
        duration: Date.now() - req.startTime,
        attempt: req.attempt,
      })),
    };
  }
  
  /**
   * Cancel all active requests
   */
  cancelAllRequests(reason = 'Cancelled by user') {
    console.log(`🌐 Cancelling ${this.activeRequests.size} active requests`);
    
    for (const [requestId, request] of this.activeRequests.entries()) {
      request.controller.abort();
      console.log(`🌐 Cancelled request: ${request.url}`);
    }
    
    this.activeRequests.clear();
  }
  
  /**
   * Cancel specific request
   */
  cancelRequest(requestId) {
    const request = this.activeRequests.get(requestId);
    if (request) {
      request.controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`🌐 Cancelled request: ${request.url}`);
      return true;
    }
    return false;
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('🌐 Fetch Manager config updated:', this.config);
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      retried: 0,
    };
    console.log('🌐 Fetch Manager stats reset');
  }
}

// Create singleton instance only on client side
let fetchManager = null;

if (typeof window !== 'undefined') {
  fetchManager = new FetchManager();
  
  // Store original fetch
  window._originalFetch = window.fetch;
  
  // Replace global fetch with enhanced version
  window.fetch = function(url, options) {
    return fetchManager.fetch(url, options);
  };
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    fetchManager.cancelAllRequests('Page unload');
  });
  
  // Cancel requests when going offline
  window.addEventListener('offline', () => {
    console.log('🌐 Going offline, cancelling active requests');
    fetchManager.cancelAllRequests('Network offline');
  });
} else {
  // Server-side fallback
  fetchManager = {
    fetch: (url, options) => fetch(url, options),
    getStats: () => ({ total: 0, successful: 0, failed: 0 }),
    cancelAllRequests: () => {},
  };
}

export default fetchManager;
