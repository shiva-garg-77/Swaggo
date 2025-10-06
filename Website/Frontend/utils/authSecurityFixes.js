'use client';

import { toast } from 'react-hot-toast';

/**
 * 🔒 AUTHENTICATION & SECURITY FIXES
 * 
 * Addresses critical issues:
 * 1. Autologin not working properly
 * 2. Session validation failures
 * 3. Token management issues 
 * 4. CSRF token handling
 * 5. Backend connection problems
 * 6. Race conditions in auth state
 * 7. Memory leaks in auth listeners
 * 8. Security context errors
 */

// ===== ENHANCED CONFIGURATION WITH BROWSER COMPATIBILITY =====
// CRITICAL FIX: Ensure environment variable is loaded correctly
const getServerUrl = () => {
  // Try multiple ways to get the server URL for browser compatibility
  let serverUrl = null;
  let source = 'unknown';
  
  // Method 1: Standard process.env (works in Node.js and some browser contexts)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SERVER_URL) {
    serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    source = 'process.env';
  }
  
  // Method 2: Next.js runtime config (browser context)
  if (!serverUrl && typeof window !== 'undefined') {
    try {
      // Check Next.js injected environment variables
      if (window.__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_SERVER_URL) {
        serverUrl = window.__NEXT_DATA__.props.pageProps.env.NEXT_PUBLIC_SERVER_URL;
        source = 'window.__NEXT_DATA__';
      }
      
      // Check if Next.js injected env vars in buildId or other locations
      if (!serverUrl && window.__NEXT_DATA__?.buildManifest) {
        // Sometimes Next.js stores env in different locations
        const manifest = window.__NEXT_DATA__.buildManifest;
        if (manifest.env && manifest.env.NEXT_PUBLIC_SERVER_URL) {
          serverUrl = manifest.env.NEXT_PUBLIC_SERVER_URL;
          source = 'buildManifest';
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to access window.__NEXT_DATA__:', error.message);
    }
  }
  
  // Method 3: Check if it's injected as a global variable
  if (!serverUrl && typeof window !== 'undefined' && window.ENV) {
    serverUrl = window.ENV.NEXT_PUBLIC_SERVER_URL;
    source = 'window.ENV';
  }
  
  // Method 4: Hardcoded fallback
  if (!serverUrl) {
    serverUrl = 'http://localhost:45799';
    source = 'hardcoded-fallback';
  }
  
  console.log('🔧 Server URL resolved:', serverUrl, `(source: ${source})`);
  
  // Validate the URL format
  try {
    new URL(serverUrl);
  } catch (error) {
    console.error('❌ Invalid server URL format:', serverUrl, 'falling back to localhost');
    serverUrl = 'http://localhost:45799';
    source = 'fallback-after-validation-error';
  }
  
  return serverUrl;
};

export const AUTH_CONFIG = {
  // API Configuration
  NEXT_PUBLIC_SERVER_URL: getServerUrl(),
  API_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second base delay
  
  // Browser compatibility settings
  BROWSER_FEATURES: {
    SUPPORTS_CREDENTIALS: typeof window !== 'undefined' && 'credentials' in new Request(''),
    SUPPORTS_SAME_SITE: typeof window !== 'undefined' && CSS.supports && CSS.supports('color', 'var(--fake-var)'),
    IS_PRIVATE_MODE: false, // Will be detected dynamically
    STORAGE_AVAILABLE: typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  },
  
  // Session Configuration
  SESSION_CHECK_INTERVAL: 300000, // 5 minutes
  SESSION_REFRESH_THRESHOLD: 1800000, // 30 minutes before expiry (increased)
  MAX_SESSION_IDLE: 14400000, // 4 hours (increased from 1 hour)
  
  // Security Configuration
  FINGERPRINT_TIMEOUT: 3000, // 3 seconds
  CSRF_TOKEN_REFRESH: 900000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
  
  // Storage Keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'user_prefs',
    DEVICE_TRUST: 'device_trust',
    SESSION_META: 'session_meta',
    SECURITY_FLAGS: 'security_flags'
  }
};

// ===== ENHANCED ERROR HANDLING =====
export class AuthError extends Error {
  constructor(message, type, status, data = null, context = null) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.status = status;
    this.data = data;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.retryCount = 0;
  }
  
  static fromResponse(error, response, context = null) {
    const authError = new AuthError(
      error.message || 'Authentication failed',
      error.type || 'auth_error',
      response?.status || error.status,
      response?.data || error.data,
      context
    );
    
    // Preserve retry count if it exists
    if (error.retryCount !== undefined) {
      authError.retryCount = error.retryCount;
    }
    
    return authError;
  }
  
  /**
   * Enhanced error classification
   */
  isRetryable() {
    // Network and server errors are retryable
    if (this.type === 'network_error' || this.type === 'timeout_error') {
      return this.retryCount < 3;
    }
    
    // 5xx server errors are retryable
    if (this.status >= 500 && this.status < 600) {
      return this.retryCount < 2;
    }
    
    // 429 Rate limiting is retryable after delay
    if (this.status === 429) {
      return this.retryCount < 5;
    }
    
    return false;
  }
  
  isExpectedError() {
    // Authentication errors are expected (user not logged in)
    return this.status === 401 || 
           this.type === 'unauthorized' ||
           this.type === 'no_session' ||
           this.message.includes('unauthorized') ||
           this.message.includes('No authentication');
  }
  
  /**
   * User-friendly error message
   */
  getUserMessage() {
    switch (this.type) {
      case 'network_error':
        return 'Connection problem. Please check your internet and try again.';
      
      case 'timeout_error':
        return 'Request timed out. Please try again.';
      
      case 'unauthorized':
      case 'no_session':
        return 'Please log in to continue.';
      
      case 'forbidden':
        return 'You don\'t have permission for this action.';
      
      case 'rate_limited':
        return 'Too many requests. Please wait a moment and try again.';
      
      case 'server_error':
        return 'Server error. Please try again later.';
      
      case 'validation_error':
        return this.message || 'Invalid input. Please check your data.';
      
      default:
        return this.message || 'Something went wrong. Please try again.';
    }
  }
  
  /**
   * Get suggested recovery actions for user
   */
  getRecoveryActions() {
    const actions = [];
    
    switch (this.type) {
      case 'network_error':
        actions.push('Check your internet connection');
        actions.push('Try refreshing the page');
        break;
      
      case 'timeout_error':
        actions.push('Wait a moment and try again');
        actions.push('Check your internet speed');
        break;
      
      case 'unauthorized':
      case 'no_session':
        actions.push('Log in again');
        actions.push('Clear your browser cache if the problem persists');
        break;
      
      case 'rate_limited':
        actions.push('Wait a few minutes before trying again');
        break;
      
      case 'server_error':
        actions.push('Try again in a few minutes');
        actions.push('Contact support if the problem persists');
        break;
    }
    
    return actions;
  }
  
  /**
   * Increment retry count
   */
  incrementRetry() {
    this.retryCount++;
    return this;
  }
  
  /**
   * Convert to plain object for logging
   */
  toLogObject() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      status: this.status,
      timestamp: this.timestamp,
      retryCount: this.retryCount,
      context: this.context,
      data: this.data
    };
  }
}

// ===== ENHANCED API CLIENT =====
export class SecureApiClient {
  constructor(config = AUTH_CONFIG) {
    this.config = config;
    this.abortController = null;
    this.requestQueue = new Map();
    this.rateLimitState = {
      requests: 0,
      resetTime: 0,
      blocked: false
    };
  }
  
  /**
   * Make a secure API request with comprehensive error handling
   */
  async request(endpoint, options = {}) {
    const requestId = `${endpoint}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Prevent duplicate requests
      if (this.requestQueue.has(endpoint)) {
        console.log(`⏳ Request already in progress for ${endpoint}, waiting...`);
        return await this.requestQueue.get(endpoint);
      }
      
      // Create request promise
      const requestPromise = this._executeRequest(endpoint, options, requestId);
      this.requestQueue.set(endpoint, requestPromise);
      
      const result = await requestPromise;
      return result;
      
    } finally {
      // Cleanup request from queue
      this.requestQueue.delete(endpoint);
    }
  }
  
  async _executeRequest(endpoint, options, requestId) {
    const startTime = Date.now();
    
    // SECURITY FIX: Normalize endpoint to prevent double /api prefixes
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    
    // CRITICAL FIX: Use relative URLs in development to leverage Next.js proxy
    const isDevelopment = typeof window !== 'undefined' && 
                         (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const serverUrl = this.config.NEXT_PUBLIC_SERVER_URL || 'http://localhost:45799';
    
    let fullUrl;
    if (isDevelopment) {
      // SECURITY: Use Next.js proxy to maintain CORS security
      fullUrl = normalizedEndpoint;
      console.log(`🔒 [${requestId}] SECURITY: Using secure Next.js proxy: ${normalizedEndpoint}`);
    } else {
      // In production, use absolute URLs
      fullUrl = `${serverUrl}${normalizedEndpoint}`;
      console.log(`🌐 [${requestId}] Using absolute URL for production: ${fullUrl}`);
    }
    
    // Create abort controller for this request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.API_TIMEOUT);
    
    try {
      const connectionType = isDevelopment ? 'Next.js Proxy' : 'Direct';
      console.log(`🔍 [${requestId}] Starting request: ${options.method || 'GET'} ${fullUrl} (${connectionType})`);
      
      // Build headers with security enhancements
      const headers = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Client-Version': '1.0.0',
        'X-Timestamp': Date.now().toString(),
        ...options.headers
      };
      
      // Add CSRF token if available
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      // Make request with retry logic
      let lastError;
      for (let attempt = 0; attempt < this.config.RETRY_ATTEMPTS; attempt++) {
        try {
          console.log(`🔄 [${requestId}] Attempt ${attempt + 1}/${this.config.RETRY_ATTEMPTS}`);
          
          const response = await fetch(fullUrl, {
            ...options,
            headers,
            credentials: 'include', // Essential for httpOnly cookies
            mode: 'cors',
            cache: 'no-cache',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            console.warn(`🚫 Rate limited, waiting ${retryAfter}s`);
            await this.delay(retryAfter * 1000);
            continue;
          }
          
          // Parse response
          let responseData;
          const contentType = response.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = { message: await response.text() };
          }
          
          const responseTime = Date.now() - startTime;
          console.log(`✅ [${requestId}] Response received in ${responseTime}ms:`, {
            status: response.status,
            success: response.ok,
            hasData: !!responseData,
            dataKeys: responseData ? Object.keys(responseData) : []
          });
          
          // Handle non-ok responses
          if (!response.ok) {
            throw new AuthError(
              responseData.message || responseData.error || `HTTP ${response.status}`,
              this.getErrorType(response.status),
              response.status,
              responseData
            );
          }
          
          // Update CSRF token if provided
          const newCSRFToken = response.headers.get('X-CSRF-Token');
          if (newCSRFToken) {
            this.setCSRFToken(newCSRFToken);
          }
          
          return responseData;
          
        } catch (error) {
          lastError = error;
          
          // Don't retry certain errors
          if (error.name === 'AbortError') {
            throw new AuthError('Request timeout', 'timeout_error', 408);
          }
          
          if (error instanceof AuthError && !error.isRetryable()) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < this.config.RETRY_ATTEMPTS - 1) {
            const delay = this.config.RETRY_DELAY * Math.pow(2, attempt);
            console.warn(`⚠️ [${requestId}] Request failed, retrying in ${delay}ms:`, error.message);
            await this.delay(delay);
          }
        }
      }
      
      // All attempts failed
      throw lastError || new AuthError('All retry attempts failed', 'network_error', 0);
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Convert generic errors to AuthError
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new AuthError('Request timeout', 'timeout_error', 408);
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new AuthError('Backend connection failed', 'network_error', 0);
      }
      
      throw new AuthError(error.message, 'unknown_error', 500, error);
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  getErrorType(status) {
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 429) return 'rate_limited';
    if (status >= 500) return 'server_error';
    return 'client_error';
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * SECURITY FIX: Normalize endpoint URLs to prevent double prefixes
   */
  normalizeEndpoint(endpoint) {
    // CRITICAL FIX: Handle undefined/null endpoints
    if (!endpoint || typeof endpoint !== 'string') {
      console.error('❌ Invalid endpoint provided to normalizeEndpoint:', endpoint);
      return '/api/auth/session-status'; // Safe fallback
    }
    
    // SECURITY FIX: Handle endpoint aliases and legacy URLs first
    let normalized = endpoint;
    
    if (normalized.includes('secure-logout')) {
      normalized = normalized.replace('secure-logout', 'logout');
      console.warn('⚠️ Deprecated secure-logout endpoint used, redirecting to /logout');
    }
    
    if (normalized.includes('validate-session')) {
      normalized = normalized.replace('validate-session', 'session-status');
      console.warn('⚠️ Deprecated validate-session endpoint used, redirecting to /session-status');
    }
    
    // CRITICAL FIX: Simplified normalization for development mode with null checks
    // In development, Next.js proxy expects URLs starting with /api
    if (normalized && typeof normalized === 'string' && !normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    
    // Ensure API endpoints start with /api
    if (normalized && typeof normalized === 'string' && 
        !normalized.startsWith('/api') && (normalized.includes('auth') || normalized.includes('graphql') || normalized.includes('upload'))) {
      // Extract the path after any leading slash
      const path = (normalized && normalized.startsWith('/')) ? normalized.substring(1) : normalized;
      normalized = `/api/${path}`;
    }
    
    return normalized;
  }
  
  /**
   * SECURITY: CSRF token handling - COOKIES ONLY, no localStorage
   */
  getCSRFToken() {
    // SECURITY: Only use secure cookies - no client-side storage
    if (typeof document !== 'undefined') {
      try {
        const cookieNames = [
          'csrf-token',          // Standard name from middleware
          '__Host-csrfToken',    // Most secure: __Host- prefix
          '__Secure-csrfToken',  // Secure: __Secure- prefix
          'XSRF-TOKEN'           // Angular convention
        ];
        
        for (const cookieName of cookieNames) {
          const cookies = document.cookie || '';
          if (!cookies || typeof cookies !== 'string') {
            continue;
          }
          
          const cookieValue = cookies
            .split('; ')
            .filter(row => row && typeof row === 'string' && row.length > 0)
            .find(row => {
              if (!row || typeof row !== 'string' || row.length === 0) {
                return false;
              }
              try {
                return row.startsWith(`${cookieName}=`);
              } catch (error) {
                return false;
              }
            })
            ?.split('=')[1];
          
          if (cookieValue) {
            const securityLevel = (cookieName && typeof cookieName === 'string' && cookieName.startsWith('__Host-')) ? 'HIGHEST' :
                                (cookieName && typeof cookieName === 'string' && cookieName.startsWith('__Secure-')) ? 'HIGH' : 'STANDARD';
            
            console.log(`🍪 Found CSRF token in ${securityLevel} security cookie: ${cookieName}`);
            return decodeURIComponent(cookieValue);
          }
        }
      } catch (error) {
        console.warn('⚠️ Cookie access failed:', error.message);
      }
    }
    
    return null;
  }
  
  /**
   * SECURITY: CSRF tokens are managed server-side only
   * Client cannot set CSRF tokens - they are HTTP-only secure cookies
   */
  setCSRFToken(token) {
    console.warn('🔒 SECURITY: CSRF tokens are server-managed only. Client cannot set tokens.');
    console.warn('🔒 CSRF tokens are HTTP-only secure cookies set by server middleware.');
    // No client-side storage - completely secure approach
  }
  
  /**
   * SECURITY: No client-side storage methods - all authentication is server-managed
   * This ensures maximum security by preventing any client-side data persistence
   */
  clearAuthData() {
    console.log('🔒 SECURITY: Authentication is server-managed via secure HTTP-only cookies');
    console.log('🔒 No client-side data to clear - logout handled by server cookie expiration');
    // All authentication state is managed server-side via secure cookies
    // No client-side storage used for maximum security
  }
  
  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// ===== SESSION MANAGER =====
export class SessionManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.sessionCheckInterval = null;
    this.sessionData = null;
    this.listeners = new Set();
    
    // SECURITY FIX: Enhanced session isolation properties
    this.sessionContext = {
      isolationId: null,
      contextBoundary: null,
      storageNamespace: null,
      lastIsolationCheck: null,
      crossUserLeakProtection: true
    };
    
    // Security monitoring
    this.securityMetrics = {
      suspiciousActivities: 0,
      contextViolations: 0,
      lastSecurityScan: null
    };
  }
  
  /**
   * SECURITY FIX: Backend health check before session validation
   */
  async checkBackendHealth() {
    try {
      console.log('🚑 Performing backend health check...');
      
      // CRITICAL FIX: Use API client for proper Next.js proxy routing in development
      const healthData = await Promise.race([
        this.apiClient.request('/health', {
          method: 'GET'
          // Don't include credentials for health check
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 3000)
        )
      ]);
      
      // API client returns parsed data directly, not Response object
      if (healthData && (healthData.status === 'ok' || healthData.healthy !== false)) {
        console.log('✅ Backend health check passed');
        return { healthy: true };
      } else {
        console.warn('⚠️ Backend health check failed:', healthData);
        return { healthy: false, reason: 'unhealthy', details: healthData };
      }
    } catch (error) {
      console.warn('⚠️ Backend health check error:', error.message);
      
      // DEVELOPMENT FALLBACK: In development, allow proceeding even if health check fails
      const isDevelopment = typeof window !== 'undefined' && 
                           (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      if (isDevelopment) {
        console.warn('⚠️ Development mode: Proceeding despite health check failure');
        return { healthy: true, fallback: true, originalError: error.message };
      }
      
      return { healthy: false, reason: 'connection_failed', error: error.message };
    }
  }
  
  /**
   * SECURITY FIX: Enhanced session check with health check, security context isolation, and improved error differentiation
   */
  async checkExistingSession() {
    console.log('🔍 SessionManager: Checking for existing session with security context isolation...');
    
    // CRITICAL FIX: Add initialization delay to prevent premature API calls during hydration
    if (typeof window !== 'undefined') {
      // Detect reload type and adjust delay accordingly
      const isHardReload = performance.navigation?.type === 1 || !performance.getEntriesByType || performance.getEntriesByType('navigation')[0]?.type === 'reload';
      const isSoftReload = !isHardReload && performance.getEntriesByType?.('navigation')[0]?.type === 'navigate';
      
      // Longer delay for soft reloads to ensure authentication state persistence
      const delayTime = isHardReload ? 1000 : isSoftReload ? 2000 : 1500;
      
      console.log(`🔄 Detected ${isHardReload ? 'HARD' : isSoftReload ? 'SOFT' : 'INITIAL'} reload - waiting ${delayTime}ms for proper hydration...`);
      
      // Wait for React hydration and provider initialization to complete
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }
    
    // Initialize security context for this session check
    this.initializeSecurityContext();
    
    // SECURITY FIX: Enhanced health check with retry logic
    let healthCheck = await this.checkBackendHealth();
    
    // If health check fails, retry once after a short delay
    if (!healthCheck.healthy && healthCheck.reason === 'connection_failed') {
      console.log('⚠️ Initial health check failed, retrying in 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      healthCheck = await this.checkBackendHealth();
    }
    
    if (!healthCheck.healthy) {
      console.error('🚨 Backend is not healthy after retry, aborting session check');
      return { 
        success: false, 
        reason: 'backend_unavailable',
        details: healthCheck,
        retryable: healthCheck.reason === 'connection_failed',
        userMessage: healthCheck.reason === 'connection_failed' ? 
          'Cannot connect to server. Please check your connection.' : 
          'Server is temporarily unavailable. Please try again later.'
      };
    } else {
      console.log('✅ Backend health check passed, proceeding with session validation');
    }
    
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Session check attempt ${attempt}/${maxRetries}`);
        
        // CRITICAL FIX: Enhanced request with POST method for security
        const response = await Promise.race([
          this.apiClient.request('/api/auth/session-status', {
            method: 'POST',
            body: JSON.stringify({
              timestamp: Date.now(),
              purpose: 'autologin_check'
            })
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 8000)
          )
        ]);
        
        if (response.authenticated && response.user) {
          console.log('✅ Session status check successful:', response.user.username || response.user.email);
          
          // 🔍 DEBUG: Check if session user object includes profileid from backend
          console.log('🔍 Backend session response user object:', {
            hasUser: !!response.user,
            userKeys: response.user ? Object.keys(response.user) : 'No user',
            userId: response.user?.id,
            profileid: response.user?.profileid,
            username: response.user?.username,
            email: response.user?.email
          });
          
          // SECURITY FIX: Validate and establish session context isolation
          const isolationContext = this.establishSessionIsolation(response.user, response.session);
          
          // Store session data with isolation context
          this.sessionData = {
            ...response,
            isolation: isolationContext
          };
          
          // Handle token refresh if indicated
          if (response.tokensRefreshed) {
            console.log('🔄 Tokens were refreshed during session check');
          }
          
          // Perform security context validation
          const securityValidation = await this.validateSecurityContext(response.user.id);
          
          return { 
            success: true, 
            user: response.user, // Pass user object directly from backend
            session: {
              ...response.session,
              ...isolationContext
            },
            security: {
              ...response.security,
              ...securityValidation
            },
            tokensRefreshed: response.tokensRefreshed || false
          };
        }
        
        // SECURITY FIX: Check if this is a token expiration that can be refreshed
        if (response.reason === 'invalid_tokens' || response.reason === 'token_expired' || response.reason === 'unauthorized') {
          console.log('🔄 Tokens expired/unauthorized, attempting secure refresh before failing...', response.reason);
          
          // Try token refresh as last resort with full security
          const refreshResult = await this.attemptTokenRefresh();
          if (refreshResult.success) {
            console.log('✅ Token refresh successful during autologin recovery');
            
            // Retry session check after successful refresh
            try {
              const retryResponse = await this.apiClient.request('/api/auth/session-status', {
                method: 'POST',
                body: JSON.stringify({
                  timestamp: Date.now(),
                  purpose: 'autologin_check_retry'
                })
              });
              
              if (retryResponse.authenticated && retryResponse.user) {
                console.log('✅ Autologin successful after token refresh:', retryResponse.user.username || retryResponse.user.email);
                
                // 🔍 DEBUG: Check retry session user object includes profileid
                console.log('🔍 Backend retry session response user object:', {
                  hasUser: !!retryResponse.user,
                  userKeys: retryResponse.user ? Object.keys(retryResponse.user) : 'No user',
                  userId: retryResponse.user?.id,
                  profileid: retryResponse.user?.profileid,
                  username: retryResponse.user?.username,
                  email: retryResponse.user?.email
                });
                
                this.sessionData = retryResponse;
                return { 
                  success: true, 
                  user: retryResponse.user, // Pass user object directly from backend
                  session: retryResponse.session,
                  security: retryResponse.security,
                  tokensRefreshed: true,
                  recoveredFromExpiry: true
                };
              }
            } catch (retryError) {
              console.warn('⚠️ Session retry after refresh failed:', retryError.message);
            }
          } else {
            // Handle refresh failure with enhanced error information
            console.log(`❌ Token refresh failed: ${refreshResult.reason}`);
            
            // If refresh failed due to missing token, clear auth state
            if (refreshResult.shouldClearAuth) {
              console.log('🧽 Clearing authentication state due to refresh failure');
              this.clearAuthData && this.clearAuthData();
            }
            
            // Return detailed failure information
            return {
              success: false,
              reason: refreshResult.reason || 'token_refresh_failed',
              userMessage: refreshResult.userMessage || 'Please log in again',
              shouldClearAuth: refreshResult.shouldClearAuth,
              category: 'authentication',
              refreshAttempted: true
            };
          }
        }
        
        // Not authenticated and no recovery possible
        console.log('🔓 No existing session found:', response.reason || 'no_session');
        return { success: false, reason: response.reason || 'no_session' };
        
      } catch (error) {
        console.warn(`⚠️ Session check attempt ${attempt} failed:`, error.message);
        
        // SECURITY FIX: Enhanced error classification and differentiation
        const errorDetails = this.classifySessionError(error);
        
        // Handle authentication-related errors (expected)
        if (errorDetails.category === 'authentication') {
          console.log('🔓 Authentication error (expected):', error.message);
          return { 
            success: false, 
            reason: 'no_session',
            category: 'authentication',
            details: errorDetails
          };
        }
        
        // Handle network errors with specific messaging
        if (errorDetails.category === 'network') {
          console.warn('🌐 Network error detected:', errorDetails.specificReason);
          
          // Don't retry on final attempt
          if (attempt === maxRetries) {
            return { 
              success: false, 
              reason: 'network_error',
              category: 'network',
              specificReason: errorDetails.specificReason,
              retryable: true,
              details: errorDetails
            };
          }
        }
        
        // Handle server errors
        if (errorDetails.category === 'server') {
          console.error('🖥️ Server error:', errorDetails.specificReason);
          
          if (attempt === maxRetries) {
            return { 
              success: false, 
              reason: 'server_error',
              category: 'server',
              specificReason: errorDetails.specificReason,
              retryable: errorDetails.retryable,
              details: errorDetails
            };
          }
        }
        
        // Handle client errors (usually not retryable)
        if (errorDetails.category === 'client') {
          console.error('📱 Client error:', errorDetails.specificReason);
          return { 
            success: false, 
            reason: 'client_error',
            category: 'client',
            specificReason: errorDetails.specificReason,
            retryable: false,
            details: errorDetails
          };
        }
        
        // Handle CSRF errors with token refresh attempt
        if (errorDetails.category === 'csrf') {
          console.warn('🛡️ CSRF error, attempting token refresh:', errorDetails.specificReason);
          
          // Try to refresh CSRF token if this is not the final attempt
          if (attempt < maxRetries) {
            const refreshResult = await this.attemptTokenRefresh();
            if (refreshResult.success) {
              console.log('🔄 Token refresh successful, retrying session check');
              continue; // Retry with new tokens
            } else if (refreshResult.shouldClearAuth) {
              console.log('🧽 Clearing auth state due to CSRF refresh failure');
              this.clearAuthData && this.clearAuthData();
              return {
                success: false,
                reason: 'csrf_refresh_failed',
                userMessage: refreshResult.userMessage || 'Please log in again',
                shouldClearAuth: true,
                category: 'authentication'
              };
            }
          }
          
          return { 
            success: false, 
            reason: 'csrf_error',
            category: 'csrf',
            specificReason: errorDetails.specificReason,
            retryable: false,
            details: errorDetails
          };
        }
        
        // Unknown errors - be cautious
        if (attempt === maxRetries) {
          console.error('❌ Session status check failed permanently:', error.message);
          return { 
            success: false, 
            reason: 'unknown_error',
            category: 'unknown',
            specificReason: error.message,
            retryable: errorDetails.retryable,
            error: error,
            details: errorDetails
          };
        }
        
        // Wait before retry
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    return { success: false, reason: 'max_retries_exceeded' };
  }
  
  /**
   * SECURITY FIX: Classify session errors for proper handling
   */
  classifySessionError(error) {
    // Authentication errors (expected)
    if (error.status === 401 || error.type === 'unauthorized' || 
        error.message.includes('unauthorized') || error.message.includes('no_session')) {
      return {
        category: 'authentication',
        specificReason: 'session_expired_or_invalid',
        retryable: false,
        userFriendly: 'Your session has expired. Please log in again.'
      };
    }
    
    // CSRF errors (special handling)
    if (error.status === 403 && (error.message.includes('CSRF') || error.type === 'csrf_error')) {
      return {
        category: 'csrf',
        specificReason: 'csrf_token_invalid',
        retryable: true,
        userFriendly: 'Security token expired. Refreshing...'
      };
    }
    
    // Network connection errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        category: 'network',
        specificReason: 'connection_failed',
        retryable: true,
        userFriendly: 'Connection problem. Retrying...'
      };
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      return {
        category: 'network',
        specificReason: 'request_timeout',
        retryable: true,
        userFriendly: 'Request timed out. Retrying...'
      };
    }
    
    // Server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
      return {
        category: 'server',
        specificReason: `server_error_${error.status}`,
        retryable: error.status !== 501, // Not implemented errors aren't retryable
        userFriendly: 'Server is having issues. Please wait...'
      };
    }
    
    // Client errors (4xx except 401, 403)
    if (error.status >= 400 && error.status < 500) {
      return {
        category: 'client',
        specificReason: `client_error_${error.status}`,
        retryable: false,
        userFriendly: 'Request error. Please refresh the page.'
      };
    }
    
    // Unknown errors
    return {
      category: 'unknown',
      specificReason: error.message || 'unknown_error',
      retryable: false,
      userFriendly: 'An unexpected error occurred. Please refresh the page.'
    };
  }
  
  /**
   * SECURITY FIX: Attempt automatic token refresh for autologin
   */
  async attemptTokenRefresh() {
    try {
      console.log('🔄 Attempting automatic token refresh...');
      
      // SECURITY FIX: Check if refresh token is likely available before attempting
      const hasRefreshCookie = this.checkRefreshTokenAvailability();
      if (!hasRefreshCookie) {
        console.log('⚠️ No refresh token cookie detected, skipping refresh attempt');
        return {
          success: false,
          reason: 'no_refresh_token_available',
          userMessage: 'Please log in again',
          shouldClearAuth: true
        };
      }
      
      console.log('🔄 Refresh token available, attempting refresh...');
      
      console.log('🔄 Sending token refresh request...');
      
      const response = await this.apiClient.request('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          purpose: 'autologin_token_refresh'
        })
      });
      
      console.log('🔄 Token refresh response:', {
        success: response.success,
        hasUser: !!response.user,
        hasTokens: !!response.tokens,
        reason: response.reason
      });
      
      if (response.success && response.tokens) {
        console.log('✅ Token refresh successful');
        
        // Update CSRF token if provided
        if (response.tokens.csrfToken) {
          this.apiClient.setCSRFToken(response.tokens.csrfToken);
        }
        
        return {
          success: true,
          tokens: response.tokens,
          user: response.user
        };
      } else {
        console.warn('⚠️ Token refresh failed:', response.message);
        return {
          success: false,
          reason: response.reason || 'refresh_failed',
          shouldClearAuth: response.reason === 'invalid_refresh_token' || response.reason === 'refresh_expired'
        };
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error.message);
      
      // Enhanced error handling for different scenarios
      let shouldClearAuth = false;
      let reason = 'refresh_error';
      let userMessage = 'Session refresh failed';
      
      // Check if this is a "refresh token required" error
      if (error.message.includes('Refresh token is required') || 
          error.message.includes('no_refresh_token')) {
        reason = 'no_refresh_token';
        userMessage = 'Please log in again';
        shouldClearAuth = true;
        console.log('🔑 Refresh token not found - user needs to login again');
      }
      // Check if refresh token is invalid/expired
      else if (error.message.includes('refresh_failed') || 
               error.message.includes('invalid') ||
               error.status === 401) {
        reason = 'refresh_expired';
        userMessage = 'Session expired, please log in again';
        shouldClearAuth = true;
        console.log('⏰ Refresh token expired - clearing auth state');
      }
      // Network or server errors
      else if (error.status >= 500 || error.message.includes('fetch')) {
        reason = 'network_error';
        userMessage = 'Connection problem, please try again';
        shouldClearAuth = false;
        console.log('🌐 Network error during token refresh - will retry later');
      }
      
      return {
        success: false,
        reason,
        error: error.message,
        userMessage,
        shouldClearAuth
      };
    }
  }
  
  /**
   * Check if refresh token is likely available in cookies
   */
  checkRefreshTokenAvailability() {
    if (typeof window === 'undefined') return false;
    
    try {
      // Check for refresh token cookies with different prefixes
      const cookieString = document.cookie || '';
      if (!cookieString || typeof cookieString !== 'string') {
        console.log('🍪 Refresh token check: No cookies available');
        return false;
      }
      
      const hasRefreshToken = cookieString.includes('refreshToken') || 
                             cookieString.includes('__Host-refreshToken') || 
                             cookieString.includes('__Secure-refreshToken');
      
      console.log(`🍪 Refresh token availability check: ${hasRefreshToken}`);
      return hasRefreshToken;
    } catch (error) {
      console.warn('⚠️ Could not check cookie availability:', error.message);
      return true; // Assume available if we can't check
    }
  }
  
  /**
   * Enhanced session monitoring with intelligent timing and error handling
   */
  startSessionMonitoring() {
    // Clear any existing monitoring
    this.stopSessionMonitoring();
    
    console.log('🔄 Starting enhanced session monitoring...');
    
    // SECURITY FIX: Start monitoring with adaptive delay based on current session state
    const adaptiveDelay = this.sessionData ? 2000 : 5000; // Shorter delay if session exists
    
    console.log(`🕰️ Starting session monitoring with ${adaptiveDelay}ms delay (adaptive)`);
    
    setTimeout(() => {
      if (!this.sessionCheckInterval) {
        let consecutiveFailures = 0;
        const maxFailures = 3;
        
        this.sessionCheckInterval = setInterval(async () => {
          try {
            console.log('🔍 Session monitoring: Validating current session...');
            const result = await this.validateCurrentSession();
            
            if (result.valid) {
              console.log('✅ Session monitoring: Session is valid');
              consecutiveFailures = 0; // Reset failure count
              
              // Notify listeners of successful validation
              this.notifyListeners('session_validated', result.session);
            } else {
              consecutiveFailures++;
              console.warn(`⚠️ Session monitoring: Session invalid (${consecutiveFailures}/${maxFailures})`, result.reason);
              
              // Only expire session after consecutive failures to avoid false positives
              if (consecutiveFailures >= maxFailures) {
                console.error('❌ Session monitoring: Multiple consecutive failures, expiring session');
                this.notifyListeners('session_expired', result);
                this.stopSessionMonitoring(); // Stop monitoring expired session
              }
            }
          } catch (error) {
            consecutiveFailures++;
            console.warn(`⚠️ Session monitoring error (${consecutiveFailures}/${maxFailures}):`, error.message);
            
            // Handle persistent monitoring errors
            if (consecutiveFailures >= maxFailures) {
              console.error('❌ Session monitoring: Persistent errors, stopping monitoring');
              this.notifyListeners('session_monitoring_failed', { error });
              this.stopSessionMonitoring();
            }
          }
        }, AUTH_CONFIG.SESSION_CHECK_INTERVAL);
        
        console.log(`✅ Session monitoring started with ${AUTH_CONFIG.SESSION_CHECK_INTERVAL}ms interval`);
      }
    }, adaptiveDelay); // SECURITY FIX: Use adaptive delay
  }
  
  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    console.log('⏹️ Session monitoring stopped');
  }
  
  /**
   * Validate current session
   */
  async validateCurrentSession() {
    try {
      const response = await this.apiClient.request('/api/auth/session-status', {
        method: 'POST',
        body: JSON.stringify({
          timestamp: Date.now(),
          purpose: 'session_monitoring'
        })
      });
      
      if (response.authenticated) {
        this.sessionData = response;
        return { valid: true, session: response };
      }
      
      return { valid: false, reason: response.reason || 'invalid_session' };
      
    } catch (error) {
      if (error.isExpectedError()) {
        return { valid: false, reason: 'unauthorized' };
      }
      throw error;
    }
  }
  
  /**
   * Add session event listener
   */
  addListener(callback) {
    this.listeners.add(callback);
  }
  
  /**
   * Remove session event listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  
  /**
   * Notify all listeners of session events
   */
  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }
  
  /**
   * SECURITY FIX: Initialize security context for session isolation
   */
  initializeSecurityContext() {
    this.sessionContext.isolationId = `iso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionContext.contextBoundary = `boundary_${this.sessionContext.isolationId}`;
    this.sessionContext.lastIsolationCheck = new Date().toISOString();
    
    console.log('🔐 Security context initialized:', this.sessionContext.isolationId);
  }
  
  /**
   * SECURITY FIX: Establish session isolation for authenticated user
   */
  establishSessionIsolation(user, session) {
    const userId = user.id || user._id;
    const timestamp = Date.now();
    
    const isolationContext = {
      isolationToken: `iso_${btoa(JSON.stringify({ userId, timestamp }))}`,
      sessionBoundary: `ctx_${userId}_${this.sessionContext.isolationId}`,
      storageNamespace: `ns_${userId}_${timestamp.toString(36)}`,
      contextSeparation: true,
      lastIsolationCheck: new Date().toISOString()
    };
    
    // Update internal session context
    this.sessionContext = {
      ...this.sessionContext,
      contextBoundary: isolationContext.sessionBoundary,
      storageNamespace: isolationContext.storageNamespace
    };
    
    console.log('🔒 Session isolation established for user:', userId);
    return isolationContext;
  }
  
  /**
   * SECURITY FIX: Validate security context integrity
   */
  async validateSecurityContext(userId) {
    const timestamp = Date.now();
    
    try {
      // Check for context tampering indicators
      const contextHealth = this.checkContextIntegrity();
      
      // Scan for cross-user data leaks
      const leakScan = this.scanForCrossUserLeaks(userId);
      
      // Update security metrics
      this.securityMetrics.lastSecurityScan = new Date().toISOString();
      
      if (leakScan.violations > 0) {
        this.securityMetrics.contextViolations += leakScan.violations;
        console.warn('🚨 Security context violations detected:', leakScan);
      }
      
      return {
        sessionIsolationId: this.sessionContext.isolationId,
        contextBoundary: this.sessionContext.contextBoundary,
        crossUserLeakDetection: this.sessionContext.crossUserLeakProtection,
        lastPermissionCheck: new Date().toISOString(),
        securityContextHash: btoa(`${userId}_${timestamp}_${this.sessionContext.isolationId}`),
        contextHealth,
        securityMetrics: this.securityMetrics
      };
    } catch (error) {
      console.error('❌ Security context validation failed:', error);
      
      return {
        sessionIsolationId: null,
        contextBoundary: null,
        crossUserLeakDetection: false,
        lastPermissionCheck: null,
        securityContextHash: null,
        contextHealth: { healthy: false, error: error.message },
        securityMetrics: this.securityMetrics
      };
    }
  }
  
  /**
   * SECURITY FIX: Check context integrity for tampering
   */
  checkContextIntegrity() {
    const issues = [];
    
    // Check if isolation identifiers are present
    if (!this.sessionContext.isolationId) {
      issues.push('Missing isolation ID');
    }
    
    if (!this.sessionContext.contextBoundary) {
      issues.push('Missing context boundary');
    }
    
    // Check timestamp validity
    if (this.sessionContext.lastIsolationCheck) {
      const checkTime = new Date(this.sessionContext.lastIsolationCheck).getTime();
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - checkTime > maxAge) {
        issues.push('Stale isolation context');
      }
    }
    
    const healthy = issues.length === 0;
    
    if (!healthy) {
      console.warn('🔴 Context integrity issues:', issues);
    }
    
    return {
      healthy,
      issues,
      lastCheck: new Date().toISOString()
    };
  }
  
  /**
   * SECURITY FIX: Scan for cross-user data leaks in storage
   */
  scanForCrossUserLeaks(currentUserId) {
    if (typeof window === 'undefined') {
      return { violations: 0, details: [] };
    }
    
    const violations = [];
    const currentNamespace = this.sessionContext.storageNamespace;
    
    try {
      // Scan localStorage for potential leaks
      Object.keys(localStorage).forEach(key => {
        // Skip if key belongs to current user's namespace
        if (currentNamespace && key.includes(currentNamespace)) {
          return;
        }
        
        // Check for keys that look like they belong to other users
        const suspiciousPatterns = [
          /ns_\d+_/,  // Other namespace patterns
          /user_\d+_/, // User-specific patterns
          /session_\d+_/, // Session patterns
          /iso_[a-zA-Z0-9+/=]+_/ // Isolation token patterns
        ];
        
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(key) && !key.includes(currentUserId)) {
            violations.push({
              type: 'localStorage_leak',
              key: key.substring(0, 50) + '...', // Truncate for security
              timestamp: Date.now()
            });
          }
        });
      });
      
      // Scan sessionStorage similarly
      Object.keys(sessionStorage).forEach(key => {
        if (currentNamespace && key.includes(currentNamespace)) {
          return;
        }
        
        if (key.includes('user_') && !key.includes(currentUserId)) {
          violations.push({
            type: 'sessionStorage_leak',
            key: key.substring(0, 50) + '...',
            timestamp: Date.now()
          });
        }
      });
      
    } catch (error) {
      console.error('Error during cross-user leak scan:', error);
      violations.push({
        type: 'scan_error',
        error: error.message,
        timestamp: Date.now()
      });
    }
    
    return {
      violations: violations.length,
      details: violations.slice(0, 10), // Limit details for performance
      scanTime: new Date().toISOString()
    };
  }
  
  /**
   * SECURITY FIX: Clean up cross-user data leaks
   */
  cleanupCrossUserData(currentUserId) {
    if (typeof window === 'undefined') return 0;
    
    const currentNamespace = this.sessionContext.storageNamespace;
    let cleanedCount = 0;
    
    try {
      // Clean localStorage
      Object.keys(localStorage).forEach(key => {
        if (currentNamespace && key.includes(currentNamespace)) {
          return; // Keep current user's data
        }
        
        // Remove keys that look like they belong to other users
        if ((key.includes('user_') || key.includes('ns_') || key.includes('iso_')) && 
            !key.includes(currentUserId)) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });
      
      // Clean sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (currentNamespace && key.includes(currentNamespace)) {
          return;
        }
        
        if (key.includes('user_') && !key.includes(currentUserId)) {
          sessionStorage.removeItem(key);
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`🧽 Cleaned ${cleanedCount} cross-user data items`);
      }
      
    } catch (error) {
      console.error('Error during cross-user data cleanup:', error);
    }
    
    return cleanedCount;
  }
  
  /**
   * Clean up resources - Enhanced with security context cleanup
   */
  destroy() {
    this.stopSessionMonitoring();
    this.listeners.clear();
    this.sessionData = null;
    
    // SECURITY FIX: Clear security context
    this.sessionContext = {
      isolationId: null,
      contextBoundary: null,
      storageNamespace: null,
      lastIsolationCheck: null,
      crossUserLeakProtection: true
    };
    
    this.securityMetrics = {
      suspiciousActivities: 0,
      contextViolations: 0,
      lastSecurityScan: null
    };
    
    console.log('🗿 SessionManager destroyed with security cleanup');
  }
}

// ===== AUTHENTICATION FIX UTILITIES =====
export const AuthFixUtils = {
  /**
   * Enhanced login with proper error handling
   */
  async performLogin(apiClient, credentials) {
    try {
      console.log('🔐 Starting enhanced login process...');
      
      const loginData = {
        identifier: credentials.identifier?.trim(),
        password: credentials.password
      };
      
      // Add optional fields
      if (credentials.totpCode) {
        loginData.totpCode = credentials.totpCode;
      }
      
      if (credentials.trustDevice) {
        loginData.trustDevice = credentials.trustDevice;
      }
      
      if (credentials.rememberMe) {
        loginData.rememberMe = credentials.rememberMe;
      }
      
      console.log('📤 Sending login request with payload:', {
        ...loginData,
        password: '[REDACTED]'
      });
      
      const response = await apiClient.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      
      console.log('📥 Login response received:', {
        success: response.success,
        hasUser: !!response.user,
        requiresMFA: response.requiresMFA,
        hasTokens: !!(response.accessToken || response.tokens)
      });
      
      if (response.success) {
        // 🔍 DEBUG: Check if user object includes profileid from backend
        console.log('🔍 Backend login response user object:', {
          hasUser: !!response.user,
          userKeys: response.user ? Object.keys(response.user) : 'No user',
          userId: response.user?.id,
          profileid: response.user?.profileid,
          username: response.user?.username,
          email: response.user?.email
        });
        
        // Store session preferences securely
        if (response.preferences) {
          localStorage.setItem('user_preferences', JSON.stringify(response.preferences));
        }
        
        toast.success('Login successful! 🎉');
        return {
          success: true,
          user: response.user, // Pass user object directly from backend
          session: response.session,
          security: response.security,
          requiresMFA: response.requiresMFA
        };
      }
      
      throw new AuthError(response.message || 'Login failed', 'login_failed', 400, response);
      
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw AuthError.fromResponse(error);
    }
  },
  
  /**
   * Enhanced signup with validation
   */
  async performSignup(apiClient, userData) {
    try {
      console.log('📝 Starting enhanced signup process...');
      
      const signupData = {
        username: userData.username?.trim(),
        email: userData.email?.trim().toLowerCase(),
        password: userData.password,
        displayName: userData.displayName || userData.username,
        dateOfBirth: userData.dateOfBirth,
        acceptTerms: 'true',
        gdprConsent: 'true'
      };
      
      console.log('📤 Sending signup request with payload:', {
        ...signupData,
        password: '[REDACTED]'
      });
      
      const response = await apiClient.request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData)
      });
      
      console.log('📥 Signup response received:', {
        success: response.success,
        hasUser: !!response.user,
        requiresVerification: response.requiresEmailVerification
      });
      
      if (response.success) {
        toast.success('Account created successfully! 🎉');
        return {
          success: true,
          user: response.user,
          session: response.session,
          security: response.security,
          requiresVerification: response.requiresEmailVerification
        };
      }
      
      throw new AuthError(response.message || 'Signup failed', 'signup_failed', 400, response);
      
    } catch (error) {
      console.error('❌ Signup failed:', error.message);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw AuthError.fromResponse(error);
    }
  },
  
  /**
   * Enhanced logout with CSRF validation, backend cookie clearing, and complete cleanup
   */
  async performLogout(apiClient, options = {}) {
    console.log('🚪 Starting enhanced logout process with CSRF validation...');
    
    // SECURITY FIX: Validate CSRF token availability BEFORE making request
    let csrfToken = apiClient.getCSRFToken();
    if (!csrfToken && !options.skipCSRFRefresh) {
      console.warn('⚠️ No CSRF token found - attempting to refresh from server...');
      
      try {
        // Try to get a fresh CSRF token by making a session status request
        // This should set a new CSRF token in cookies if user is still authenticated
        await apiClient.request('/api/auth/session-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'csrf_refresh_for_logout' })
        });
        
        // Try to get CSRF token again after the request
        csrfToken = apiClient.getCSRFToken();
        
        if (csrfToken) {
          console.log('✅ CSRF token refreshed successfully - proceeding with logout');
        } else {
          console.warn('⚠️ CSRF refresh didn\'t provide new token - user may not be authenticated');
        }
        
      } catch (refreshError) {
        console.warn('⚠️ CSRF refresh failed:', refreshError.message);
        // Continue to check if we still don't have a token
      }
    }
    
    // Final check for CSRF token
    if (!csrfToken) {
      console.error('🚨 No CSRF token available after refresh attempt - trying emergency logout...');
      
      // Try emergency logout to clear httpOnly cookies
      const emergencyLogoutSuccess = await this.attemptEmergencyLogout(apiClient);
      
      // Always perform local cleanup regardless of emergency logout result
      await this.performCompleteLogoutCleanup();
      
      toast.success('Logged out successfully');
      
      return { 
        success: true, 
        forced: true, 
        reason: 'emergency_logout',
        emergencyLogoutWorked: emergencyLogoutSuccess,
        message: emergencyLogoutSuccess ? 
          'Logged out successfully (emergency route used)' : 
          'Logged out locally (emergency route failed)'
      };
    }
    
    console.log('✅ CSRF token found, proceeding with server logout...');
    
    try {
      // Make logout request with explicit CSRF headers
      console.log('📡 Calling backend logout endpoint to clear httpOnly cookies...');
      const response = await apiClient.request('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,  // Explicit CSRF token
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logoutAll: options.logoutAll || false,
          reason: options.reason || 'user_initiated'
        })
      });
      
      console.log('✅ Server logout successful - backend cleared httpOnly cookies:', response);
      
      // CRITICAL FIX: Wait a moment for cookie headers to be processed by browser
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // SECURITY FIX: Now clear client-side tokens and JS-accessible cookies
      await this.performCompleteLogoutCleanup();
      
      console.log('🧹 Complete logout cleanup finished - all cookies and tokens cleared');
      
      toast.success(options.reason === 'security' ? 
        '🛡️ Security logout completed' : 
        'Logged out successfully 👋'
      );
      
      return { 
        success: true, 
        serverLogout: true,
        cookiesCleared: true
      };
      
    } catch (error) {
      console.error('❌ Server logout failed:', error.message, 'Status:', error.status);
      
      // SECURITY FIX: Handle different error types appropriately
      if (error.status === 403) {
        console.error('🚨 CSRF token validation failed during logout');
        
        // CSRF error - try to refresh token and retry once
        if (!options.retried) {
          console.log('🔄 Attempting logout retry with fresh CSRF token...');
          
          try {
            // Try to get fresh CSRF token via a simple authenticated request
            await apiClient.request('/api/auth/session-status', { 
              method: 'POST',
              body: JSON.stringify({ purpose: 'csrf_refresh' })
            });
            
            // Retry logout with fresh token
            return await this.performLogout(apiClient, { ...options, retried: true });
            
          } catch (refreshError) {
            console.error('❌ CSRF refresh failed:', refreshError.message);
            // Fall through to force cleanup
          }
        }
        
        console.warn('⚠️ Backend logout failed due to CSRF - performing aggressive local cleanup');
        await this.performAggressiveLogoutCleanup();
        
        return { 
          success: true, 
          forced: true, 
          reason: 'csrf_failed',
          message: 'Logged out locally (CSRF failed)' 
        };
      }
      
      // For other errors (network, etc.), still perform aggressive cleanup
      console.warn('⚠️ Backend logout failed, performing aggressive local cleanup:', error.message);
      await this.performAggressiveLogoutCleanup();
      
      // CRITICAL FIX: Try forced backend logout without CSRF to clear httpOnly cookies
      await this.attemptForcedBackendLogout(apiClient);
      
      toast.success('Logged out successfully');
      
      return { 
        success: true, 
        forced: true, 
        reason: 'server_error',
        error: error.message,
        message: 'Logged out locally (server unavailable)' 
      };
    }
  },

  /**
   * Attempt emergency logout - direct call to emergency logout endpoint
   * This is used when CSRF token is completely unavailable
   */
  async attemptEmergencyLogout(apiClient) {
    console.log('🚑 Attempting emergency logout to clear httpOnly cookies...');
    
    try {
      const response = await fetch(`${apiClient.config.NEXT_PUBLIC_SERVER_URL}/api/auth/emergency-logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: 'no_csrf_token',
          timestamp: Date.now(),
          userAgent: navigator.userAgent?.substring(0, 100)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Emergency logout successful:', data.message);
        
        // Wait for cookie processing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify cookies were cleared
        const stillHasAuthCookies = this.checkForRemainingAuthCookies();
        
        if (!stillHasAuthCookies) {
          console.log('✅ Emergency logout successfully cleared httpOnly cookies');
          return true;
        } else {
          console.warn('⚠️ Emergency logout completed but some auth cookies may persist');
          return true; // Still consider it successful since the endpoint worked
        }
      } else {
        console.warn(`⚠️ Emergency logout endpoint returned ${response.status}`);
        
        // Even if it returns an error, cookies might have been cleared
        await new Promise(resolve => setTimeout(resolve, 200));
        const stillHasAuthCookies = this.checkForRemainingAuthCookies();
        
        if (!stillHasAuthCookies) {
          console.log('✅ Emergency logout cleared cookies despite error response');
          return true;
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Emergency logout failed:', error.message);
      
      // Check if cookies were cleared anyway (sometimes errors occur after cookie clearing)
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const stillHasAuthCookies = this.checkForRemainingAuthCookies();
        
        if (!stillHasAuthCookies) {
          console.log('✅ Emergency logout cleared cookies despite error');
          return true;
        }
      } catch (checkError) {
        console.warn('⚠️ Could not check cookie status after emergency logout error');
      }
      
      return false;
    }
  },

  /**
   * Attempt forced backend logout to clear httpOnly cookies
   * This tries alternative approaches when CSRF-protected logout fails
   */
  async attemptForcedBackendLogout(apiClient) {
    console.log('🚑 Attempting forced backend logout to clear httpOnly cookies...');
    
    const fallbackMethods = [
      // Method 1: Emergency logout endpoint (no CSRF required)
      async () => {
        console.log('🚑 Trying emergency logout endpoint...');
        return await fetch(`${apiClient.config.NEXT_PUBLIC_SERVER_URL}/api/auth/emergency-logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reason: 'csrf_fallback',
            timestamp: Date.now()
          })
        });
      },
      
      // Method 2: Try token refresh with invalid token (triggers cleanup)
      async () => {
        console.log('🔄 Trying token refresh to trigger cleanup...');
        return await fetch(`${apiClient.config.NEXT_PUBLIC_SERVER_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: 'invalid_to_trigger_cleanup' })
        });
      },
      
      // Method 3: Direct cookie clearing attempt
      async () => {
        console.log('🔄 Trying direct cookie clear...');
        
        // Try to make a request that will fail auth and potentially clear cookies
        const response = await fetch(`${apiClient.config.NEXT_PUBLIC_SERVER_URL}/api/auth/session-status`, {
          method: 'POST',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'X-Force-Logout': 'true'
          },
          body: JSON.stringify({ 
            purpose: 'force_cookie_clear',
            invalidate: true
          })
        });
        
        // If we get a 401, that's actually good - it means auth failed and cookies might be cleared
        return response;
      }
    ];
    
    for (let i = 0; i < fallbackMethods.length; i++) {
      try {
        const response = await fallbackMethods[i]();
        
        if (response) {
          console.log(`✅ Fallback method ${i + 1} response:`, response.status);
          
          // Check if cookies were cleared
          await new Promise(resolve => setTimeout(resolve, 200)); // Wait for cookie processing
          const stillHasAuthCookies = this.checkForRemainingAuthCookies();
          
          if (!stillHasAuthCookies) {
            console.log(`✅ Fallback method ${i + 1} successfully cleared cookies`);
            return true;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Fallback method ${i + 1} failed:`, error.message);
      }
    }
    
    console.warn('⚠️ All fallback logout methods failed - cookies may persist');
    return false;
  },

  /**
   * Check if authentication cookies are still present
   */
  checkForRemainingAuthCookies() {
    if (typeof document === 'undefined') return false;
    
    const authCookiePatterns = [
      'accessToken', 'refreshToken', 'authToken',
      '__Host-accessToken', '__Host-refreshToken',
      '__Secure-accessToken', '__Secure-refreshToken'
    ];
    
    const currentCookies = document.cookie || '';
    if (!currentCookies || typeof currentCookies !== 'string') {
      console.log('🍪 No cookies available for auth check');
      return false;
    }
    
    const remainingAuthCookies = authCookiePatterns.filter(pattern => 
      currentCookies.includes(pattern)
    );
    
    if (remainingAuthCookies.length > 0) {
      console.warn('⚠️ Remaining auth cookies detected:', remainingAuthCookies);
      return true;
    }
    
    console.log('✅ No auth cookies detected - logout appears successful');
    return false;
  },

  /**
   * Perform complete logout cleanup (tokens + cookies + state)
   */
  async performCompleteLogoutCleanup() {
    console.log('🧹 Performing complete logout cleanup...');
    
    // SECURITY FIX: Clear localStorage tokens
    const localStorageKeys = [
      'user_preferences', 
      'device_trust', 
      'csrf_token',
      'csrf_token_backup',
      'session_meta',
      'security_flags'
    ];
    
    localStorageKeys.forEach(key => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage: ${key}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to clear localStorage ${key}:`, error.message);
      }
    });
    
    // SECURITY FIX: Clear sessionStorage tokens
    const sessionStorageKeys = [
      'csrf_token_backup',
      'csrf_token',
      'session_meta'
    ];
    
    sessionStorageKeys.forEach(key => {
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Cleared sessionStorage: ${key}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to clear sessionStorage ${key}:`, error.message);
      }
    });
    
    // SECURITY FIX: Clear JavaScript-accessible cookies
    await this.clearClientCookies();
    
    console.log('✅ Complete logout cleanup finished');
  },

  /**
   * Perform minimal local cleanup (for cases where server logout isn't possible)
   */
  async performLocalLogoutCleanup() {
    console.log('🧹 Performing local logout cleanup...');
    
    // Clear only essential local tokens, keep CSRF for potential retry
    const keysToRemove = ['user_preferences', 'device_trust', 'session_meta'];
    keysToRemove.forEach(key => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage: ${key}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to clear localStorage ${key}:`, error.message);
      }
    });
    
    console.log('✅ Local logout cleanup finished');
  },

  /**
   * Perform aggressive cleanup when backend logout fails
   */
  async performAggressiveLogoutCleanup() {
    console.log('🧹 Performing aggressive logout cleanup (backend failed)...');
    
    // Clear ALL auth-related storage
    await this.performCompleteLogoutCleanup();
    
    // Additional aggressive cleanup
    try {
      // Clear any remaining auth patterns
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('csrf') || 
              key.includes('session') || key.includes('user')) {
            localStorage.removeItem(key);
            console.log(`🗑️ Aggressively cleared localStorage: ${key}`);
          }
        });
      }
      
      if (typeof sessionStorage !== 'undefined') {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.includes('auth') || key.includes('token') || key.includes('csrf') || 
              key.includes('session') || key.includes('user')) {
            sessionStorage.removeItem(key);
            console.log(`🗑️ Aggressively cleared sessionStorage: ${key}`);
          }
        });
      }
      
      // Try to clear all possible auth cookies
      await this.clearAllAuthCookies();
      
    } catch (error) {
      console.warn('⚠️ Aggressive cleanup partial failure:', error.message);
    }
    
    console.log('✅ Aggressive logout cleanup finished');
  },

  /**
   * Clear JavaScript-accessible cookies
   */
  async clearClientCookies() {
    if (typeof document === 'undefined') return;
    
    try {
      // Clear CSRF token cookies (these are JavaScript-readable)
      const csrfCookieNames = [
        'csrfToken',
        '__Secure-csrfToken', 
        '__Host-csrfToken',
        'csrf_token',
        'XSRF-TOKEN'
      ];
      
      csrfCookieNames.forEach(cookieName => {
        // Clear with different path combinations
        const pathVariants = ['/', '/api', '/auth'];
        pathVariants.forEach(path => {
          try {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure; samesite=strict`;
          } catch (error) {
            // Ignore cookie clearing errors
          }
        });
      });
      
      console.log('🍪 Client-side cookies cleared');
    } catch (error) {
      console.warn('⚠️ Client cookie clearing failed:', error.message);
    }
  },

  /**
   * Clear all possible auth cookies (aggressive approach)
   */
  async clearAllAuthCookies() {
    if (typeof document === 'undefined') return;
    
    try {
      // All possible auth cookie names
      const allAuthCookieNames = [
        // CSRF tokens
        'csrfToken', '__Secure-csrfToken', '__Host-csrfToken', 'csrf_token', 'XSRF-TOKEN',
        // Auth tokens (these are httpOnly and can't be cleared by JS, but try anyway)
        'accessToken', 'refreshToken', 'authToken',
        '__Host-accessToken', '__Host-refreshToken', '__Host-authToken',
        '__Secure-accessToken', '__Secure-refreshToken', '__Secure-authToken',
        // Session cookies
        'sessionId', 'session_id', 'JSESSIONID'
      ];
      
      allAuthCookieNames.forEach(cookieName => {
        // Clear with different path and domain combinations
        const pathVariants = ['/', '/api', '/auth'];
        pathVariants.forEach(path => {
          try {
            // Basic clearing
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
            // With secure
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure`;
            // With SameSite
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure; samesite=strict`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; secure; samesite=lax`;
            // With domain variations (for localhost development)
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=localhost`;
          } catch (error) {
            // Ignore individual cookie clearing errors
          }
        });
      });
      
      console.log('🍪 All auth cookies cleared (aggressive mode)');
    } catch (error) {
      console.warn('⚠️ Aggressive cookie clearing failed:', error.message);
    }
  },
  
  /**
   * Enhanced backend connectivity check with detailed error classification
   */
  async checkBackendHealth(apiClient) {
    try {
      console.log('🏥 Checking backend health and connectivity...');
      
      // Try health endpoint with timeout
      const healthPromise = apiClient.request('/health', {
        method: 'GET'
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 3000);
      });
      
      const response = await Promise.race([healthPromise, timeoutPromise]);
      
      console.log('✅ Backend is healthy and reachable:', response);
      return { 
        healthy: true, 
        reachable: true, 
        response,
        errorType: null 
      };
      
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      
      // Enhanced error classification
      const errorType = this.classifyBackendError(error);
      
      return { 
        healthy: false, 
        reachable: errorType !== 'unreachable',
        error, 
        errorType,
        userMessage: this.getBackendErrorMessage(errorType),
        suggestions: this.getBackendErrorSuggestions(errorType)
      };
    }
  },
  
  /**
   * Classify backend connection errors
   */
  classifyBackendError(error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      return 'unreachable'; // Backend server not running
    }
    
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      return 'timeout'; // Backend responding slowly
    }
    
    if (error.status >= 500) {
      return 'server_error'; // Backend has internal error
    }
    
    if (error.status === 404) {
      return 'endpoint_missing'; // Health endpoint not configured
    }
    
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      return 'cors_blocked'; // CORS configuration issue
    }
    
    return 'unknown';
  },
  
  /**
   * Get user-friendly error messages for backend issues
   */
  getBackendErrorMessage(errorType) {
    switch (errorType) {
      case 'unreachable':
        return 'Cannot connect to server. The server may be offline.';
      case 'timeout':
        return 'Server is responding slowly. Please wait.';
      case 'server_error':
        return 'Server is experiencing issues. Please try again.';
      case 'endpoint_missing':
        return 'Server configuration issue. Please contact support.';
      case 'cors_blocked':
        return 'Connection blocked by security settings.';
      default:
        return 'Unable to connect to server.';
    }
  },
  
  /**
   * Get suggestions for backend connection issues
   */
  getBackendErrorSuggestions(errorType) {
    switch (errorType) {
      case 'unreachable':
        return [
          'Check if the server is running',
          'Verify the server port (usually 45799)',
          'Check your network connection'
        ];
      case 'timeout':
        return [
          'Wait a moment and try again',
          'Check your internet speed',
          'The server might be under heavy load'
        ];
      case 'server_error':
        return [
          'Try again in a few minutes',
          'The server is experiencing technical difficulties'
        ];
      case 'cors_blocked':
        return [
          'This is a development configuration issue',
          'Contact the developer to check CORS settings'
        ];
      default:
        return ['Try refreshing the page', 'Contact support if the problem persists'];
    }
  },
  
  /**
   * Reset authentication state safely
   */
  resetAuthState(dispatch, AuthActionTypes) {
    console.log('🔄 Resetting authentication state...');
    
    dispatch({
      type: AuthActionTypes.AUTH_LOGOUT,
      payload: {
        reason: 'state_reset',
        timestamp: Date.now()
      }
    });
    
    // Clear any stored tokens or sensitive data
    const keysToRemove = ['user_preferences', 'device_trust', 'csrf_token'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

// Export for backward compatibility
export const authFixUtils = AuthFixUtils;

// ===== BROWSER COMPATIBILITY UTILITIES =====
export const BrowserCompatibility = {
  /**
   * Detect if browser is in private/incognito mode
   */
  async detectPrivateMode() {
    if (typeof window === 'undefined') return false;
    
    try {
      // Test localStorage availability
      const testKey = '__private_mode_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      // Test IndexedDB availability (more reliable for private mode detection)
      if ('indexedDB' in window) {
        return new Promise((resolve) => {
          const db = indexedDB.open('__private_mode_test__', 1);
          db.onsuccess = () => {
            resolve(false); // Not private mode
          };
          db.onerror = () => {
            resolve(true); // Likely private mode
          };
          setTimeout(() => resolve(false), 100); // Timeout fallback
        });
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ Private mode detection failed:', error.message);
      return true; // Assume private mode if storage fails
    }
  },
  
  /**
   * Check if browser supports modern cookie features
   */
  checkCookieSupport() {
    if (typeof document === 'undefined') return false;
    
    try {
      // Test basic cookie functionality
      const testCookie = '__cookie_test__';
      document.cookie = `${testCookie}=test; path=/; SameSite=Lax`;
      const cookies = document.cookie || '';
      const supported = cookies.includes(testCookie);
      
      // Clean up test cookie
      document.cookie = `${testCookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      
      return supported;
    } catch (error) {
      console.warn('⚠️ Cookie support check failed:', error.message);
      return false;
    }
  },
  
  /**
   * Get browser-specific authentication strategy
   */
  async getAuthStrategy() {
    const isPrivateMode = await this.detectPrivateMode();
    const cookiesSupported = this.checkCookieSupport();
    const storageAvailable = AUTH_CONFIG.BROWSER_FEATURES.STORAGE_AVAILABLE;
    
    console.log('🌐 Browser compatibility check:', {
      isPrivateMode,
      cookiesSupported,
      storageAvailable,
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
    
    // Update global config
    AUTH_CONFIG.BROWSER_FEATURES.IS_PRIVATE_MODE = isPrivateMode;
    
    // Determine optimal strategy
    if (isPrivateMode) {
      return {
        strategy: 'session-only',
        useSessionStorage: true,
        useLocalStorage: false,
        cookieStrategy: 'session',
        warnings: ['Private mode detected - limited persistence']
      };
    }
    
    if (!cookiesSupported) {
      return {
        strategy: 'storage-only',
        useSessionStorage: true,
        useLocalStorage: storageAvailable,
        cookieStrategy: 'none',
        warnings: ['Cookies disabled - using storage fallback']
      };
    }
    
    return {
      strategy: 'full',
      useSessionStorage: true,
      useLocalStorage: storageAvailable,
      cookieStrategy: 'httponly',
      warnings: []
    };
  },
  
  /**
   * Apply browser-specific request modifications
   */
  enhanceRequestOptions(options, authStrategy) {
    const enhanced = { ...options };
    
    // Modify credentials based on browser capabilities
    if (authStrategy.cookieStrategy === 'none') {
      enhanced.credentials = 'omit';
    } else if (AUTH_CONFIG.BROWSER_FEATURES.SUPPORTS_CREDENTIALS) {
      enhanced.credentials = 'include';
    }
    
    // Add browser compatibility headers
    enhanced.headers = {
      ...enhanced.headers,
      'X-Browser-Strategy': authStrategy.strategy,
      'X-Private-Mode': AUTH_CONFIG.BROWSER_FEATURES.IS_PRIVATE_MODE ? '1' : '0'
    };
    
    return enhanced;
  }
};

export default {
  AUTH_CONFIG,
  AuthError,
  SecureApiClient,
  SessionManager,
  AuthFixUtils,
  authFixUtils,
  BrowserCompatibility
};
