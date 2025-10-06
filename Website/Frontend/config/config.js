/**
 * 🔧 FRONTEND CONFIGURATION HELPER
 * 
 * Simple configuration object that reads from environment variables
 * and provides a clean interface for the frontend components.
 * 
 * Only includes NEXT_PUBLIC_ variables that are safe for client-side use.
 */

'use client';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Helper function to get environment variables with defaults
const getEnv = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

// Main configuration object
export const config = {
  // Environment information
  environment: process.env.NODE_ENV || 'development',
  isDevelopment,
  isProduction,

  // API Configuration
  api: {
    baseUrl: getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:45799'),
    serverUrl: getEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:45799'),
    graphqlUrl: getEnv('NEXT_PUBLIC_GRAPHQL_URL', 'http://localhost:45799/graphql'),
    socketUrl: getEnv('NEXT_PUBLIC_SOCKET_URL', 'http://localhost:45799'),
    frontendUrl: getEnv('NEXT_PUBLIC_FRONTEND_URL', 'http://localhost:3000'),
  },

  // Feature flags
  features: {
    debug: getEnv('NEXT_PUBLIC_DEBUG_MODE', 'true') === 'true' && isDevelopment,
    voiceMessages: getEnv('NEXT_PUBLIC_ENABLE_VOICE_MESSAGES', 'true') === 'true',
    videoCalls: getEnv('NEXT_PUBLIC_ENABLE_VIDEO_CALLS', 'true') === 'true',
    pushNotifications: getEnv('NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS', 'true') === 'true',
    screenSharing: getEnv('NEXT_PUBLIC_ENABLE_SCREEN_SHARING', 'true') === 'true',
    offlineMode: getEnv('NEXT_PUBLIC_ENABLE_OFFLINE_MODE', 'true') === 'true',
    messageReactions: getEnv('NEXT_PUBLIC_ENABLE_MESSAGE_REACTIONS', 'true') === 'true',
  },

  // File upload limits
  upload: {
    maxFileSize: parseInt(getEnv('NEXT_PUBLIC_MAX_FILE_SIZE', '10485760')), // 10MB
    maxImageSize: parseInt(getEnv('NEXT_PUBLIC_MAX_IMAGE_SIZE', '5242880')), // 5MB
  },

  // Connection settings
  connection: {
    timeout: parseInt(getEnv('NEXT_PUBLIC_CONNECTION_TIMEOUT', '30000')), // 30 seconds
    retryAttempts: parseInt(getEnv('NEXT_PUBLIC_RETRY_ATTEMPTS', '5')),
    requestTimeout: parseInt(getEnv('NEXT_PUBLIC_REQUEST_TIMEOUT', '25000')), // 25 seconds
    retryDelay: parseInt(getEnv('NEXT_PUBLIC_RETRY_DELAY', '1000')), // 1 second
  },

  // Session configuration
  session: {
    timeout: parseInt(getEnv('NEXT_PUBLIC_SESSION_TIMEOUT', '3600000')), // 1 hour
    maxLoginAttempts: parseInt(getEnv('NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS', '5')),
    lockoutDuration: parseInt(getEnv('NEXT_PUBLIC_LOCKOUT_DURATION', '300000')), // 5 minutes
  },

  // Chat configuration
  chat: {
    maxMessageLength: parseInt(getEnv('NEXT_PUBLIC_MAX_MESSAGE_LENGTH', '4000')),
    callTimeoutMs: parseInt(getEnv('NEXT_PUBLIC_CALL_TIMEOUT_MS', '30000')),
    messagePageSize: parseInt(getEnv('NEXT_PUBLIC_MESSAGE_PAGE_SIZE', '50')),
    typingIndicatorTimeout: parseInt(getEnv('NEXT_PUBLIC_TYPING_INDICATOR_TIMEOUT', '3000')),
  },

  // WebRTC configuration
  webrtc: {
    stunServer: getEnv('NEXT_PUBLIC_STUN_SERVER', 'stun:stun.l.google.com:19302'),
  },

  // Push notifications
  notifications: {
    vapidPublicKey: getEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', ''),
  },

  // Theme configuration
  theme: {
    defaultTheme: getEnv('NEXT_PUBLIC_DEFAULT_THEME', 'light'),
    enableDarkMode: getEnv('NEXT_PUBLIC_ENABLE_DARK_MODE', 'true') === 'true',
  },

  // Logging
  logging: {
    level: getEnv('NEXT_PUBLIC_LOG_LEVEL', isDevelopment ? 'debug' : 'warn'),
  },
};

// Helper functions
export const getApiUrl = (endpoint = '') => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

export const getSocketUrl = () => {
  return config.api.socketUrl;
};

export const isFeatureEnabled = (feature) => {
  return config.features[feature] === true;
};

export const isDebugMode = () => {
  return config.features.debug;
};

// Validation function
export const validateConfig = () => {
  const errors = [];
  const warnings = [];

  // Validate required URLs
  const requiredUrls = ['baseUrl', 'serverUrl', 'graphqlUrl', 'socketUrl'];
  requiredUrls.forEach(urlKey => {
    const url = config.api[urlKey];
    if (!url || !url.startsWith('http')) {
      errors.push(`Invalid or missing ${urlKey}: ${url}`);
    }
  });

  // Validate Socket.IO URL (should not use WebSocket protocol)
  if (config.api.socketUrl.startsWith('ws://') || config.api.socketUrl.startsWith('wss://')) {
    errors.push('Socket.IO URL should use HTTP/HTTPS protocol, not WebSocket');
  }

  // Production checks
  if (isProduction) {
    if (config.features.debug) {
      warnings.push('Debug mode is enabled in production');
    }

    // Check for HTTP URLs in production
    Object.entries(config.api).forEach(([key, url]) => {
      if (typeof url === 'string' && url.startsWith('http://') && !url.includes('localhost')) {
        warnings.push(`Insecure HTTP URL in production: ${key}`);
      }
    });
  }

  return { errors, warnings, isValid: errors.length === 0 };
};

// Validate configuration on load
if (typeof window !== 'undefined') {
  const validation = validateConfig();
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Frontend Configuration Warnings:');
    validation.warnings.forEach(warning => console.warn(`   • ${warning}`));
  }

  if (validation.errors.length > 0) {
    console.error('❌ Frontend Configuration Errors:');
    validation.errors.forEach(error => console.error(`   • ${error}`));
  } else {
    console.log('✅ Frontend configuration loaded successfully');
  }

  if (isDebugMode()) {
    console.log('🔍 Frontend Configuration:', {
      api: config.api,
      features: config.features,
      environment: config.environment
    });
  }
}

export default config;