/**
 * 🔐 ENVIRONMENT CONFIGURATION MANAGER
 * 
 * Centralized environment configuration with security validation
 * Manages environment-specific settings and secret handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnvironmentConfig {
  constructor() {
    this.config = {};
    this.environment = process.env.NODE_ENV || 'development';
    this.isProduction = this.environment === 'production';
    this.isTest = this.environment === 'test';
    this.isDevelopment = this.environment === 'development';
    
    // Load environment variables
    this.loadEnvironmentVariables();
    
    // Validate configuration
    this.validateConfiguration();
  }
  
  /**
   * Load environment variables from appropriate files
   */
  loadEnvironmentVariables() {
    // Load .env file based on environment
    const envFiles = [
      `.env.${this.environment}`,
      '.env.local',
      '.env'
    ];
    
    for (const envFile of envFiles) {
      const envPath = path.join(__dirname, '../../', envFile);
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`📝 Loaded environment file: ${envFile}`);
      }
    }
    
    // Load configuration into this.config
    this.config = {
      // Application
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT) || 45799,
      API_BASE_URL: process.env.API_BASE_URL || '/api',
      
      // Database
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: parseInt(process.env.DB_PORT) || 27017,
      DB_NAME: process.env.DB_NAME || 'Swaggo',
      DB_USER: process.env.DB_USER || '',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
      DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || '',
      
      // Redis
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
      REDIS_DB: parseInt(process.env.REDIS_DB) || 0,
      REDIS_SSL: process.env.REDIS_SSL === 'true',
      REDIS_MAX_MEMORY: process.env.REDIS_MAX_MEMORY || '256mb',
      REDIS_MAX_MEMORY_POLICY: process.env.REDIS_MAX_MEMORY_POLICY || 'allkeys-lru',
      
      // JWT
      JWT_SECRET: process.env.JWT_SECRET || '',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || '',
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      
      // Security
      SESSION_SECRET: process.env.SESSION_SECRET || '',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
      CSRF_SECRET: process.env.CSRF_SECRET || '',
      MAX_SESSIONS: parseInt(process.env.MAX_SESSIONS) || 5,
      SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT) || 3600000,
      
      // Email
      EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.example.com',
      EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
      EMAIL_USER: process.env.EMAIL_USER || '',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
      EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@swaggo.com',
      
      // Cloud Storage
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'swaggo-uploads',
      
      // Third-Party API Keys
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
      FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
      
      // Feature Flags
      FEATURE_CHAT_ENABLED: process.env.FEATURE_CHAT_ENABLED === 'true',
      FEATURE_VIDEO_CALLS_ENABLED: process.env.FEATURE_VIDEO_CALLS_ENABLED === 'true',
      FEATURE_STORIES_ENABLED: process.env.FEATURE_STORIES_ENABLED === 'true',
      FEATURE_LIVE_STREAMING_ENABLED: process.env.FEATURE_LIVE_STREAMING_ENABLED === 'true',
      
      // Performance
      CACHE_TTL: parseInt(process.env.CACHE_TTL) || 300,
      RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
      RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      
      // Logging
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
      LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '100m',
      LOG_MAX_FILES: parseInt(process.env.LOG_MAX_FILES) || 10,
      ENABLE_LOG_TRANSPORTS: process.env.ENABLE_LOG_TRANSPORTS || 'file,console',
      
      // Monitoring
      APM_SERVER_URL: process.env.APM_SERVER_URL || '',
      APM_TOKEN: process.env.APM_TOKEN || ''
    };
  }
  
  /**
   * Validate configuration for security and correctness
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];
    
    // Check for production security requirements
    if (this.isProduction) {
      // Check for placeholder values
      const placeholderPatterns = [
        /REPLACE_WITH_/i,
        /your-/i,
        /change-this/i,
        /placeholder/i,
        /^secret$/i,
        /^password$/i,
        /^key$/i,
        /^token$/i,
        /^default/i
      ];
      
      // Check critical secrets
      const criticalSecrets = [
        'JWT_SECRET',
        'REFRESH_TOKEN_SECRET',
        'SESSION_SECRET',
        'ENCRYPTION_KEY',
        'CSRF_SECRET'
      ];
      
      for (const secret of criticalSecrets) {
        const value = this.config[secret];
        if (!value) {
          errors.push(`Missing required secret: ${secret}`);
        } else if (placeholderPatterns.some(pattern => pattern.test(value))) {
          errors.push(`Placeholder value detected for secret: ${secret}`);
        } else if (value.length < 32) {
          warnings.push(`Secret ${secret} is too short (minimum 32 characters)`);
        }
      }
      
      // Check database credentials
      if (this.config.DB_USER && !this.config.DB_PASSWORD) {
        warnings.push('Database user specified but no password provided');
      }
      
      // Check Redis credentials
      if (this.config.REDIS_SSL && !this.config.REDIS_PASSWORD) {
        warnings.push('Redis SSL enabled but no password provided');
      }
    }
    
    // Log validation results
    if (errors.length > 0) {
      console.error('❌ Environment configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      if (this.isProduction) {
        throw new Error('Environment configuration validation failed');
      }
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ Environment configuration warnings:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Environment configuration validated successfully');
    }
  }
  
  /**
   * Get configuration value
   */
  get(key) {
    return this.config[key];
  }
  
  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }
  
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.config[`FEATURE_${feature.toUpperCase()}_ENABLED`] === true;
  }
  
  /**
   * Get database connection string
   */
  getDatabaseConnectionString() {
    if (this.config.DB_CONNECTION_STRING) {
      return this.config.DB_CONNECTION_STRING;
    }
    
    let connectionString = 'mongodb://';
    
    if (this.config.DB_USER && this.config.DB_PASSWORD) {
      connectionString += `${this.config.DB_USER}:${this.config.DB_PASSWORD}@`;
    }
    
    connectionString += `${this.config.DB_HOST}:${this.config.DB_PORT}/${this.config.DB_NAME}`;
    
    return connectionString;
  }
  
  /**
   * Get Redis connection options
   */
  getRedisOptions() {
    return {
      host: this.config.REDIS_HOST,
      port: this.config.REDIS_PORT,
      password: this.config.REDIS_PASSWORD || undefined,
      db: this.config.REDIS_DB,
      tls: this.config.REDIS_SSL ? {} : undefined
    };
  }
}

// Export singleton instance
const environmentConfig = new EnvironmentConfig();

export default environmentConfig;
export { EnvironmentConfig };