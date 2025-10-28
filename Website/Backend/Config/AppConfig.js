/**
 * @fileoverview Application Configuration
 * @module Config/AppConfig
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Centralized application configuration that loads values from environment variables
 * and provides default values for all configuration options.
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Application configuration object
 * @typedef {Object} AppConfig
 * @property {Object} app - Application settings
 * @property {Object} database - Database configuration
 * @property {Object} redis - Redis configuration
 * @property {Object} jwt - JWT configuration
 * @property {Object} security - Security settings
 * @property {Object} email - Email configuration
 * @property {Object} cloud - Cloud storage configuration
 * @property {Object} thirdParty - Third-party API keys
 * @property {Object} features - Feature flags
 * @property {Object} performance - Performance settings
 * @property {Object} logging - Logging configuration
 * @property {Object} monitoring - Monitoring configuration
 */

const AppConfig = {
  // Application settings
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    baseUrl: process.env.API_BASE_URL || '/api',
    name: 'Swaggo',
    version: '1.0.0'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 27017,
    name: process.env.DB_NAME || 'swaggo_dev',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    connectionString: process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/swaggo_dev'
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    ssl: process.env.REDIS_SSL === 'true',
    maxMemory: process.env.REDIS_MAX_MEMORY || '256mb',
    maxMemoryPolicy: process.env.REDIS_MAX_MEMORY_POLICY || 'allkeys-lru'
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'swaggo-default-jwt-secret-key-for-dev-only'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshToken: {
      secret: process.env.REFRESH_TOKEN_SECRET || (process.env.NODE_ENV === 'production' ? null : 'swaggo-default-refresh-token-secret-key-for-dev-only'),
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    }
  },

  // Security settings
  security: {
    sessionSecret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'swaggo-default-session-secret-key-for-dev-only'),
    encryptionKey: process.env.ENCRYPTION_KEY || (process.env.NODE_ENV === 'production' ? null : 'swaggo-default-encryption-key-for-dev-only123456789012'),
    csrfSecret: process.env.CSRF_SECRET || (process.env.NODE_ENV === 'production' ? null : 'swaggo-default-csrf-secret-key-for-dev-only')
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@swaggo.com'
  },

  // Cloud storage configuration
  cloud: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
      region: process.env.AWS_REGION || 'us-east-1',
      bucketName: process.env.AWS_BUCKET_NAME || 'swaggo-uploads'
    }
  },

  // Third-party API keys
  thirdParty: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || ''
    }
  },

  // Feature flags
  features: {
    chat: process.env.FEATURE_CHAT_ENABLED === 'true',
    videoCalls: process.env.FEATURE_VIDEO_CALLS_ENABLED === 'true',
    stories: process.env.FEATURE_STORIES_ENABLED === 'true',
    liveStreaming: process.env.FEATURE_LIVE_STREAMING_ENABLED === 'true'
  },

  // Performance settings
  performance: {
    cacheTtl: parseInt(process.env.CACHE_TTL, 10) || 300,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log'
  },

  // Monitoring configuration
  monitoring: {
    apmServerUrl: process.env.APM_SERVER_URL || '',
    apmToken: process.env.APM_TOKEN || ''
  }
};

export default AppConfig;