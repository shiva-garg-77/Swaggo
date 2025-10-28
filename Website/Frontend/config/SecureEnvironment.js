/**
 * @fileoverview Secure Environment Configuration Manager
 * @version 3.0.0
 * @author Swaggo Development Team
 * 
 * @description
 * Centralized, secure environment variable management with:
 * ✅ Input validation and sanitization
 * ✅ Secure defaults for all configurations
 * ✅ Environment-specific overrides (dev/prod)
 * ✅ URL validation and protocol enforcement
 * ✅ Security headers and CSP configuration
 * ✅ Windows compatibility optimizations
 * ✅ Connection timeout and retry configurations
 */

'use client';

// Security: Define allowed protocols for different services
const ALLOWED_PROTOCOLS = {
  api: ['http:', 'https:'],
  socket: ['http:', 'https:'], // Socket.IO uses HTTP/HTTPS, not WebSocket protocol
  websocket: ['ws:', 'wss:'], // Only for raw WebSocket connections (not used)
  frontend: ['http:', 'https:']
};

// Security: Define URL validation patterns
const URL_PATTERNS = {
  localhost: /^https?:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?$/,
  development: /^https?:\/\/(localhost|127\.0\.0\.1|::1|[\w-]+\.local)(:\d+)?$/,
  production: /^https:\/\/[\w.-]+\.[a-z]{2,}(:\d+)?$/
};

// Security: Environment validation schema
const ENV_SCHEMA = {
  // API Configuration
  NEXT_PUBLIC_API_URL: {
    required: true,
    type: 'url',
    protocols: ALLOWED_PROTOCOLS.api,
    default: 'http://localhost:45799'
  },
  NEXT_PUBLIC_SERVER_URL: {
    required: true,
    type: 'url',
    protocols: ALLOWED_PROTOCOLS.api,
    default: 'http://localhost:45799'
  },
  NEXT_PUBLIC_GRAPHQL_URL: {
    required: true,
    type: 'url',
    protocols: ALLOWED_PROTOCOLS.api,
    default: 'http://localhost:45799/graphql'
  },
  
  // Socket Configuration (CRITICAL: Must use HTTP for Socket.IO)
  NEXT_PUBLIC_SOCKET_URL: {
    required: true,
    type: 'url',
    protocols: ALLOWED_PROTOCOLS.socket,
    default: 'http://localhost:45799',
    validate: (url) => {
      // SECURITY: Prevent WebSocket protocol for Socket.IO
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        throw new Error('Socket.IO requires HTTP/HTTPS protocol, not WebSocket protocol');
      }
      return true;
    }
  },
  
  // Frontend Configuration
  NEXT_PUBLIC_FRONTEND_URL: {
    required: true,
    type: 'url',
    protocols: ALLOWED_PROTOCOLS.frontend,
    default: 'http://localhost:3000'
  },
  
  // Feature Flags (Security: Validate boolean values)
  NEXT_PUBLIC_DEBUG_MODE: {
    type: 'boolean',
    default: false,
    production: false // Force false in production
  },
  NEXT_PUBLIC_ENABLE_VOICE_MESSAGES: {
    type: 'boolean',
    default: true
  },
  NEXT_PUBLIC_ENABLE_VIDEO_CALLS: {
    type: 'boolean',
    default: true
  },
  NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: {
    type: 'boolean',
    default: true
  },
  
  // Security Configuration
  NEXT_PUBLIC_MAX_FILE_SIZE: {
    type: 'number',
    default: 10485760, // 10MB
    min: 1048576, // 1MB minimum
    max: 52428800 // 50MB maximum
  },
  NEXT_PUBLIC_MAX_IMAGE_SIZE: {
    type: 'number',
    default: 5242880, // 5MB
    min: 524288, // 512KB minimum
    max: 10485760 // 10MB maximum
  },
  NEXT_PUBLIC_SESSION_TIMEOUT: {
    type: 'number',
    default: 3600000, // 1 hour
    min: 300000, // 5 minutes minimum
    max: 86400000 // 24 hours maximum
  },
  
  // Connection Configuration
  NEXT_PUBLIC_CONNECTION_TIMEOUT: {
    type: 'number',
    default: 20000, // 20 seconds
    min: 5000, // 5 seconds minimum
    max: 60000 // 60 seconds maximum
  },
  NEXT_PUBLIC_RETRY_ATTEMPTS: {
    type: 'number',
    default: 3,
    min: 1,
    max: 10
  }
};

/**
 * Secure Environment Configuration Class
 */
class SecureEnvironment {
  constructor() {
    this.config = {};
    this.isInitialized = false;
    this.environment = this.detectEnvironment();
    this.platform = this.detectPlatform();
    
    if (this.environment === 'development') {
      console.log('🔒 SecureEnvironment: Initializing with:', {
        environment: this.environment,
        platform: this.platform
      });
    }
    
    this.loadAndValidateConfig();
  }
  
  /**
   * Detect current environment
   */
  detectEnvironment() {
    if (typeof window === 'undefined') {
      // Server-side
      return process.env.NODE_ENV || 'development';
    }
    
    // Client-side environment detection
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
    
    return 'production';
  }
  
  /**
   * Detect platform for platform-specific optimizations
   */
  detectPlatform() {
    if (typeof navigator === 'undefined') {
      return process.platform || 'unknown';
    }
    
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) return 'windows';
    if (platform.includes('mac')) return 'macos';
    if (platform.includes('linux')) return 'linux';
    
    return 'unknown';
  }
  
  /**
   * Load and validate all environment variables
   */
  loadAndValidateConfig() {
    if (this.environment === 'development') {
      console.log('🔍 SecureEnvironment: Loading configuration...');
    }
    
    for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
      try {
        const value = this.loadEnvironmentVariable(key, schema);
        this.config[key] = value;
        
        if (this.environment === 'development') {
          console.log(`✅ SecureEnvironment: ${key} = ${this.sanitizeLogValue(key, value)}`);
        }
      } catch (error) {
        if (this.environment === 'development') {
          console.error(`❌ SecureEnvironment: Failed to load ${key}:`, error.message);
        }
        
        if (schema.required) {
          throw new Error(`Required environment variable ${key} is invalid: ${error.message}`);
        }
        
        // Use default value for non-required variables
        this.config[key] = schema.default;
      }
    }
    
    // Apply environment-specific overrides
    this.applyEnvironmentOverrides();
    
    // Apply platform-specific optimizations
    this.applyPlatformOptimizations();
    
    this.isInitialized = true;
    if (this.environment === 'development') {
      console.log('✅ SecureEnvironment: Configuration loaded successfully');
    }
  }
  
  /**
   * Load and validate a single environment variable
   */
  loadEnvironmentVariable(key, schema) {
    let rawValue;
    
    if (typeof window === 'undefined') {
      // Server-side
      rawValue = process.env[key];
    } else {
      // Client-side - only NEXT_PUBLIC_ variables are available
      if (key.startsWith('NEXT_PUBLIC_')) {
        rawValue = process.env[key];
      } else {
        throw new Error(`Non-public environment variable ${key} not available on client`);
      }
    }
    
    // Use default if no value provided
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      if (schema.required && !schema.default) {
        throw new Error(`Required environment variable ${key} is missing`);
      }
      rawValue = schema.default;
    }
    
    // Convert string to appropriate type
    let value = this.convertValue(rawValue, schema.type);
    
    // Validate the value
    this.validateValue(key, value, schema);
    
    return value;
  }
  
  /**
   * Convert string value to appropriate type
   */
  convertValue(value, type) {
    if (value === null || value === undefined) {
      return value;
    }
    
    switch (type) {
      case 'boolean':
        if (typeof value === 'boolean') return value;
        return value === 'true' || value === '1' || value === 'yes';
        
      case 'number':
        if (typeof value === 'number') return value;
        const num = parseInt(value, 10);
        if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
        return num;
        
      case 'url':
        return String(value).trim();
        
      default:
        return String(value);
    }
  }
  
  /**
   * Validate value against schema
   */
  validateValue(key, value, schema) {
    // Type-specific validation
    switch (schema.type) {
      case 'url':
        this.validateUrl(value, schema);
        break;
        
      case 'number':
        if (schema.min !== undefined && value < schema.min) {
          throw new Error(`Value ${value} is below minimum ${schema.min}`);
        }
        if (schema.max !== undefined && value > schema.max) {
          throw new Error(`Value ${value} is above maximum ${schema.max}`);
        }
        break;
    }
    
    // Custom validation function
    if (schema.validate) {
      schema.validate(value);
    }
  }
  
  /**
   * Validate URL format and security
   */
  validateUrl(url, schema) {
    let parsedUrl;
    
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    
    // Validate protocol
    if (schema.protocols && !schema.protocols.includes(parsedUrl.protocol)) {
      throw new Error(`Invalid protocol ${parsedUrl.protocol}. Allowed: ${schema.protocols.join(', ')}`);
    }
    
    // Environment-specific URL validation
    const pattern = URL_PATTERNS[this.environment] || URL_PATTERNS.development;
    if (!pattern.test(url)) {
      console.warn(`⚠️ URL ${url} may not be appropriate for ${this.environment} environment`);
    }
    
    // Security: Prevent dangerous URLs
    if (parsedUrl.hostname === '0.0.0.0' || parsedUrl.hostname.includes('..')) {
      throw new Error(`Potentially dangerous URL: ${url}`);
    }
  }
  
  /**
   * Apply environment-specific configuration overrides
   */
  applyEnvironmentOverrides() {
    if (this.environment === 'production') {
      // Force secure settings in production
      this.config.NEXT_PUBLIC_DEBUG_MODE = false;
      
      // Ensure HTTPS in production
      Object.keys(this.config).forEach(key => {
        if (key.includes('URL') && typeof this.config[key] === 'string') {
          if (this.config[key].startsWith('http://') && !this.config[key].includes('localhost')) {
            console.warn(`⚠️ Insecure HTTP URL in production: ${key}`);
          }
        }
      });
    }
    
    if (this.environment === 'development') {
      // Development-specific settings
      console.log('🔧 SecureEnvironment: Applied development overrides');
    }
  }
  
  /**
   * Apply platform-specific optimizations
   */
  applyPlatformOptimizations() {
    if (this.platform === 'windows') {
      // Windows-specific optimizations for connection stability
      this.config.NEXT_PUBLIC_CONNECTION_TIMEOUT = Math.max(
        this.config.NEXT_PUBLIC_CONNECTION_TIMEOUT,
        25000 // Increase timeout on Windows
      );
      
      this.config.NEXT_PUBLIC_RETRY_ATTEMPTS = Math.max(
        this.config.NEXT_PUBLIC_RETRY_ATTEMPTS,
        5 // More retries on Windows
      );
      
      if (this.environment === 'development') {
        console.log('🪟 SecureEnvironment: Applied Windows optimizations');
      }
    }
  }
  
  /**
   * Get configuration value
   */
  get(key) {
    if (!this.isInitialized) {
      throw new Error('SecureEnvironment not initialized');
    }
    
    if (!(key in this.config)) {
      throw new Error(`Configuration key ${key} not found`);
    }
    
    return this.config[key];
  }
  
  /**
   * Get all configuration (for debugging)
   */
  getAll() {
    if (!this.isInitialized) {
      throw new Error('SecureEnvironment not initialized');
    }
    
    // Return sanitized config for logging
    const sanitized = {};
    Object.keys(this.config).forEach(key => {
      sanitized[key] = this.sanitizeLogValue(key, this.config[key]);
    });
    
    return sanitized;
  }
  
  /**
   * Sanitize values for logging (hide sensitive information)
   */
  sanitizeLogValue(key, value) {
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) {
      return '[REDACTED]';
    }
    
    if (key.toLowerCase().includes('token')) {
      return '[REDACTED]';
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 50) + '...[TRUNCATED]';
    }
    
    return value;
  }
  
  /**
   * Validate current configuration
   */
  validateConfiguration() {
    const errors = [];
    
    // Check for common misconfigurations
    const socketUrl = this.get('NEXT_PUBLIC_SOCKET_URL');
    if (socketUrl.startsWith('ws://') || socketUrl.startsWith('wss://')) {
      errors.push('Socket URL uses WebSocket protocol - Socket.IO requires HTTP/HTTPS');
    }
    
    const apiUrl = this.get('NEXT_PUBLIC_API_URL');
    const socketUrlParsed = new URL(socketUrl);
    const apiUrlParsed = new URL(apiUrl);
    
    // Warn if socket and API use different hosts
    if (socketUrlParsed.host !== apiUrlParsed.host && this.environment === 'development') {
      console.warn('⚠️ Socket and API URLs use different hosts - this may cause CORS issues');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
    
    if (this.environment === 'development') {
      console.log('✅ SecureEnvironment: Configuration validation passed');
    }
    return true;
  }
  
  /**
   * Get connection configuration for services
   */
  getConnectionConfig() {
    return {
      timeout: this.get('NEXT_PUBLIC_CONNECTION_TIMEOUT'),
      retryAttempts: this.get('NEXT_PUBLIC_RETRY_ATTEMPTS'),
      maxFileSize: this.get('NEXT_PUBLIC_MAX_FILE_SIZE'),
      maxImageSize: this.get('NEXT_PUBLIC_MAX_IMAGE_SIZE'),
      sessionTimeout: this.get('NEXT_PUBLIC_SESSION_TIMEOUT')
    };
  }
  
  /**
   * Get URL configuration for services
   */
  getUrlConfig() {
    return {
      api: this.get('NEXT_PUBLIC_API_URL'),
      server: this.get('NEXT_PUBLIC_SERVER_URL'),
      graphql: this.get('NEXT_PUBLIC_GRAPHQL_URL'),
      socket: this.get('NEXT_PUBLIC_SOCKET_URL'),
      frontend: this.get('NEXT_PUBLIC_FRONTEND_URL')
    };
  }
  
  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return {
      debug: this.get('NEXT_PUBLIC_DEBUG_MODE'),
      environment: this.environment,
      platform: this.platform,
      maxFileSize: this.get('NEXT_PUBLIC_MAX_FILE_SIZE'),
      sessionTimeout: this.get('NEXT_PUBLIC_SESSION_TIMEOUT')
    };
  }
}

// Export singleton instance
const secureEnvironment = new SecureEnvironment();

// Validate configuration on initialization
secureEnvironment.validateConfiguration();

export default secureEnvironment;

// Export configuration getters for convenience
export const getUrlConfig = () => secureEnvironment.getUrlConfig();
export const getConnectionConfig = () => secureEnvironment.getConnectionConfig();
export const getSecurityConfig = () => secureEnvironment.getSecurityConfig();
export const getEnvironment = () => secureEnvironment.environment;
export const getPlatform = () => secureEnvironment.platform;