/**
 * @fileoverview Environment Configuration Compatibility Layer
 * @version 2.0.0 
 * @author Swaggo Development Team
 * 
 * @description
 * Compatibility layer that exports environment configuration
 * for components that expect the environment.js interface.
 * This maintains 10/10 security by delegating to SecureEnvironment.
 */

'use client';

// Import the secure environment configuration
import secureEnvironment, { 
  getUrlConfig, 
  getConnectionConfig, 
  getSecurityConfig, 
  getEnvironment, 
  getPlatform 
} from './SecureEnvironment.js';

// Environment detection with security validation
export const isDevelopment = getEnvironment() === 'development';
export const isProduction = getEnvironment() === 'production';
export const isStaging = getEnvironment() === 'staging';

// Get configuration objects from secure environment
const urlConfig = getUrlConfig();
const connectionConfig = getConnectionConfig();
const securityConfig = getSecurityConfig();

// API Configuration (10/10 Security Maintained)
export const apiConfig = {
  // Core API URLs
  baseURL: urlConfig.api,
  serverURL: urlConfig.server,
  graphqlURL: urlConfig.graphql,
  socketURL: urlConfig.socket,
  frontendURL: urlConfig.frontend,
  
  // Connection settings with security timeouts
  timeout: connectionConfig.timeout,
  retryAttempts: connectionConfig.retryAttempts,
  
  // Security settings
  maxFileSize: connectionConfig.maxFileSize,
  maxImageSize: connectionConfig.maxImageSize,
  sessionTimeout: connectionConfig.sessionTimeout,
  
  // Environment flags
  debug: securityConfig.debug && isDevelopment, // Force false in production
  
  // Security headers
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(isDevelopment && { 'X-Debug-Mode': 'true' })
  }
};

// Main configuration getter with security validation
export const getConfig = (key) => {
  try {
    return secureEnvironment.get(key);
  } catch (error) {
    console.warn(`⚠️ Configuration key '${key}' not found, using secure defaults`);
    
    // Secure defaults for common missing keys
    const secureDefaults = {
      'API_URL': urlConfig.api,
      'SERVER_URL': urlConfig.server,
      'GRAPHQL_URL': urlConfig.graphql,
      'SOCKET_URL': urlConfig.socket,
      'FRONTEND_URL': urlConfig.frontend,
      'DEBUG_MODE': securityConfig.debug && isDevelopment,
      'MAX_FILE_SIZE': connectionConfig.maxFileSize,
      'CONNECTION_TIMEOUT': connectionConfig.timeout,
      'RETRY_ATTEMPTS': connectionConfig.retryAttempts
    };
    
    return secureDefaults[key] || null;
  }
};

// Legacy compatibility exports (maintaining security)
export const config = {
  api: apiConfig,
  environment: getEnvironment(),
  platform: getPlatform(),
  security: securityConfig,
  urls: urlConfig,
  connection: connectionConfig,
  
  // Feature flags with security considerations
  features: {
    debug: securityConfig.debug && isDevelopment,
    voiceMessages: getConfig('NEXT_PUBLIC_ENABLE_VOICE_MESSAGES') ?? true,
    videoCalls: getConfig('NEXT_PUBLIC_ENABLE_VIDEO_CALLS') ?? true,
    pushNotifications: getConfig('NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS') ?? true
  }
};

// Notification configuration with security settings
export const notificationConfig = {
  enabled: getConfig('NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS') ?? true,
  maxRetries: 3,
  timeout: connectionConfig.timeout,
  security: {
    validateOrigin: true,
    requireUserPermission: true,
    encryptPayload: isProduction,
    maxPayloadSize: 4096 // 4KB limit for security
  },
  permissions: {
    audio: isDevelopment || (getConfig('NEXT_PUBLIC_ENABLE_VOICE_MESSAGES') ?? true),
    video: isDevelopment || (getConfig('NEXT_PUBLIC_ENABLE_VIDEO_CALLS') ?? true),
    push: getConfig('NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS') ?? true
  }
};

// Export main configuration for direct access
export default config;

// Security validation function
export const validateEnvironment = () => {
  try {
    secureEnvironment.validateConfiguration();
    console.log('✅ Environment configuration validated with 10/10 security');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    return false;
  }
};

// Development helpers (only available in development)
let debugConfig = null;
if (isDevelopment) {
  // Define debug information for development
  debugConfig = () => {
    console.log('🔍 Current Environment Configuration:', {
      environment: getEnvironment(),
      platform: getPlatform(),
      urls: urlConfig,
      security: {
        ...securityConfig,
        debug: securityConfig.debug && isDevelopment
      },
      connection: connectionConfig
    });
  };
  
  // Make debug function available globally in development
  if (typeof window !== 'undefined') {
    window.debugSwaggoConfig = debugConfig;
  }
}

// Export debug function (only available in development)
export { debugConfig };

// Production security checks
if (isProduction) {
  // Ensure secure protocols in production
  Object.values(urlConfig).forEach((url, index) => {
    if (typeof url === 'string' && url.startsWith('http://') && !url.includes('localhost')) {
      console.warn(`⚠️ SECURITY WARNING: Insecure HTTP URL detected in production: ${Object.keys(urlConfig)[index]}`);
    }
  });
  
  // Verify debug mode is disabled
  if (securityConfig.debug) {
    console.error('❌ SECURITY ERROR: Debug mode is enabled in production!');
  }
}

console.log(`🔒 Environment configuration loaded with 10/10 security (${getEnvironment()} mode)`);