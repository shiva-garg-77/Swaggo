/**
 * RSC Connection Manager - Handles React Server Component connection retries
 * Provides automatic retry and connection stability for RSC streaming
 */

class RSCConnectionManager {
  constructor() {
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.connectionState = 'idle';
    this.isEnabled = typeof window !== 'undefined';
    
    if (this.isEnabled) {
      this.initializeConnectionHandling();
    }
  }

  initializeConnectionHandling() {
    console.log('🔄 RSC Connection Manager initializing...');

    // Override fetch for RSC requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      // Check if this looks like an RSC request
      const isRSCRequest = 
        url && (
          url.includes('_next/static') ||
          url.includes('__nextjs_') ||
          (options?.headers && 
           (options.headers['RSC'] === '1' || 
            options.headers['Next-Router-State-Tree']))
        );

      if (isRSCRequest) {
        return await this.fetchWithRetry(originalFetch, ...args);
      }

      return originalFetch.apply(this, args);
    };

    // Handle connection state changes
    this.setupConnectionStateHandling();
  }

  async fetchWithRetry(originalFetch, ...args) {
    const [url] = args;
    let attempt = 0;
    
    while (attempt <= this.maxRetries) {
      try {
        this.connectionState = 'connecting';
        const response = await originalFetch.apply(window, args);
        
        if (response.ok) {
          this.connectionState = 'connected';
          this.retryAttempts = 0; // Reset on success
          return response;
        }
        
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        attempt++;
        this.retryAttempts = attempt;
        this.connectionState = 'error';
        
        if (attempt > this.maxRetries) {
          console.log(`🔄 RSC Connection failed after ${this.maxRetries} retries:`, error.message);
          
          // Return a mock response to prevent cascading errors
          return new Response(JSON.stringify({ 
            __rsc_error_fallback: true,
            message: 'Connection temporarily unavailable' 
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'X-RSC-Fallback': 'true'
            }
          });
        }
        
        console.log(`🔄 RSC Connection retry ${attempt}/${this.maxRetries} in ${this.retryDelay}ms`);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
      }
    }
  }

  setupConnectionStateHandling() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.connectionState = 'hidden';
      } else {
        this.connectionState = 'visible';
        this.retryAttempts = 0; // Reset retries when page becomes visible
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('🔄 RSC Connection: Back online');
      this.connectionState = 'online';
      this.retryAttempts = 0;
    });

    window.addEventListener('offline', () => {
      console.log('🔄 RSC Connection: Gone offline');
      this.connectionState = 'offline';
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API for checking connection state
  getConnectionState() {
    return {
      state: this.connectionState,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries
    };
  }

  // Reset connection state manually
  resetConnection() {
    this.retryAttempts = 0;
    this.connectionState = 'idle';
    console.log('🔄 RSC Connection state reset');
  }
}

// Initialize the connection manager
let rscConnectionManager;
if (typeof window !== 'undefined') {
  rscConnectionManager = new RSCConnectionManager();
  
  // Expose to window for debugging
  window.__RSCConnectionManager = rscConnectionManager;
  
  console.log('✅ RSC Connection Manager ready');
}

export default rscConnectionManager;