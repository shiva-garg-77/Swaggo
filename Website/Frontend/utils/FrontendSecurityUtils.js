/**
 * Security utilities for input validation and XSS prevention
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return '';

  // Simple XSS prevention - remove script tags and event handlers
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');
};

/**
 * Sanitize user input for display
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format and check for suspicious patterns
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid and safe
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;

  // Check for suspicious protocols
  if (/^(javascript|data|vbscript|file):/i.test(url)) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Validate file types for uploads
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - Whether file type is allowed
 */
export const isValidFileType = (file, allowedTypes = []) => {
  if (!file || !file.type) return false;
  
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeBytes - Maximum file size in bytes
 * @returns {boolean} - Whether file size is within limit
 */
export const isValidFileSize = (file, maxSizeBytes) => {
  if (!file || !file.size) return false;
  
  return file.size <= maxSizeBytes;
};

/**
 * Generate a secure random string
 * @param {number} length - Length of random string
 * @returns {string} - Random string
 */
export const generateSecureRandom = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Use crypto API in browser
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for non-crypto environments
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};

/**
 * Rate limiting utility for client-side operations
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute by default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    let requestTimes = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    // Check if under limit
    if (requestTimes.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    requestTimes.push(now);
    this.requests.set(identifier, requestTimes);
    
    return true;
  }

  getRemainingRequests(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    let requestTimes = this.requests.get(identifier) || [];
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - requestTimes.length);
  }

  getTimeUntilReset(identifier) {
    const requestTimes = this.requests.get(identifier) || [];
    if (requestTimes.length === 0) return 0;
    
    const oldestRequest = Math.min(...requestTimes);
    const resetTime = oldestRequest + this.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }
}

/**
 * Content Security Policy helpers
 */
export const CSPUtils = {
  /**
   * Generate nonce for inline scripts/styles
   * @returns {string} - CSP nonce
   */
  generateNonce: () => {
    return generateSecureRandom(16);
  },

  /**
   * Check if current page has proper CSP headers
   * @returns {boolean} - Whether CSP is enabled
   */
  hasCSP: () => {
    if (typeof document === 'undefined') return false;
    
    const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    return metaTags.length > 0;
  },

  /**
   * Report CSP violations (in development)
   * @param {Object} violation - CSP violation report
   */
  reportViolation: (violation) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('CSP Violation:', violation);
    }
    
    // In production, you might want to send this to an error reporting service
  }
};

/**
 * Input validation schemas
 */
export const ValidationSchemas = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
  },
  
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  
  password: {
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 6 characters with uppercase, lowercase, number, and special character'
  },
  
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Please enter a valid URL starting with http:// or https://'
  }
};

/**
 * Validate input against schema
 * @param {string} value - Value to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation result
 */
export const validateInput = (value, schema) => {
  const errors = [];
  
  if (schema.required && (!value || value.trim() === '')) {
    errors.push('This field is required');
  }
  
  if (value && schema.minLength && value.length < schema.minLength) {
    errors.push(`Must be at least ${schema.minLength} characters`);
  }
  
  if (value && schema.maxLength && value.length > schema.maxLength) {
    errors.push(`Must be no more than ${schema.maxLength} characters`);
  }
  
  if (value && schema.pattern && !schema.pattern.test(value)) {
    errors.push(schema.message || 'Invalid format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Secure storage utility
 */
export const SecureStorage = {
  /**
   * Set item in secure storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {boolean} encrypt - Whether to encrypt the value
   */
  setItem: (key, value, encrypt = false) => {
    if (typeof window === 'undefined') return;
    
    try {
      let serializedValue = JSON.stringify(value);
      
      if (encrypt) {
        // Simple obfuscation (not real encryption, but better than plain text)
        serializedValue = btoa(serializedValue);
      }
      
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Failed to set secure storage item:', error);
    }
  },

  /**
   * Get item from secure storage
   * @param {string} key - Storage key
   * @param {boolean} encrypted - Whether value is encrypted
   * @returns {any} - Stored value
   */
  getItem: (key, encrypted = false) => {
    if (typeof window === 'undefined') return null;
    
    try {
      let value = localStorage.getItem(key);
      if (!value) return null;
      
      if (encrypted) {
        value = atob(value);
      }
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to get secure storage item:', error);
      return null;
    }
  },

  /**
   * Remove item from secure storage
   * @param {string} key - Storage key
   */
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove secure storage item:', error);
    }
  }
};

// Create global rate limiter instances
export const apiRateLimiter = new RateLimiter(60, 60000); // 60 requests per minute
export const authRateLimiter = new RateLimiter(5, 300000); // 5 auth attempts per 5 minutes

export { RateLimiter };

export default {
  sanitizeHTML,
  sanitizeInput,
  isValidEmail,
  isValidURL,
  isValidFileType,
  isValidFileSize,
  generateSecureRandom,
  CSPUtils,
  ValidationSchemas,
  validateInput,
  SecureStorage,
  RateLimiter,
  apiRateLimiter,
  authRateLimiter
};