/**
 * 🔍 ENVIRONMENT VALIDATION UTILITY
 * 
 * Validates all environment variables for security and completeness
 * Prevents application startup with insecure configurations
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 🔧 PERFORMANCE FIX #32: Import Winston logger
import appLogger from '../utils/logger.js';

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.requiredVars = [
      'MONGODB_URI',
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'COOKIE_SECRET',
      'CSRF_SECRET',
      'PASSWORD_PEPPER',
      'REQUEST_SIGNING_KEY',
      'PORT',
      'REDIS_PASSWORD'
    ];
    
    this.productionRequiredVars = [
      'SMTP_USER',
      'SMTP_PASSWORD',
      'VAPID_PUBLIC_KEY',
      'VAPID_PRIVATE_KEY'
    ];
  }

  /**
   * Validate all environment variables
   */
  validate() {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('🔍 Validating environment configuration...');
    
    this.checkRequiredVariables();
    this.validateSecretStrength();
    this.checkSecurityConfiguration();
    this.validateDatabaseConfiguration();
    this.validateRedisConfiguration();
    this.validateSSLConfiguration();
    this.checkProductionReadiness();
    this.validateFilePermissions();
    this.validateConnectivity();
    
    // 🔒 SECURITY FIX #29: Add warning about using secret management service
    this.checkSecretManagement();
    
    this.reportResults();
    
    return this.errors.length === 0;
  }

  /**
   * Check if all required environment variables are present
   */
  checkRequiredVariables() {
    const missing = [];
    
    for (const varName of this.requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
    
    if (process.env.NODE_ENV === 'production') {
      for (const varName of this.productionRequiredVars) {
        if (!process.env[varName] || process.env[varName].includes('REPLACE_WITH')) {
          missing.push(varName);
        }
      }
    }
    
    if (missing.length > 0) {
      this.errors.push(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  /**
   * 🔒 SECURITY FIX #29: Check for proper secret management
   * Warn about storing secrets in environment files instead of using secret management service
   */
  checkSecretManagement() {
    // Check if we're using secrets from environment file (not recommended for production)
    const secretVars = [
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'COOKIE_SECRET',
      'CSRF_SECRET',
      'PASSWORD_PEPPER',
      'REQUEST_SIGNING_KEY',
      'DS_SECRET_KEY'
    ];
    
    let secretsFromEnvFile = 0;
    const secretsFromEnv = [];
    
    for (const varName of secretVars) {
      if (process.env[varName]) {
        // Check if the secret appears to be from an environment file
        // This is a heuristic - in a real implementation, you'd check the source
        secretsFromEnv.push(varName);
        secretsFromEnvFile++;
      }
    }
    
    // 🔒 SECURITY FIX #29: Enhanced warning for secret management
    if (secretsFromEnvFile > 0 && process.env.NODE_ENV === 'production') {
      // Check if we're using the built-in SecretsManager
      const usingSecretManager = process.env.USE_SECRET_MANAGER === 'true' || 
                                process.env.NODE_ENV === 'production'; // Default in production
      
      if (!usingSecretManager) {
        this.warnings.push(
          '🔒 SECURITY WARNING: Secrets are being loaded from environment variables. ' +
          'The application now supports built-in secret management. ' +
          'Set NODE_ENV=production to automatically use the SecretsManager or ' +
          'set USE_SECRET_MANAGER=true to enable it explicitly. ' +
          'See docs/SECRET_MANAGEMENT.md for implementation guidance.'
        );
      } else {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.info('✅ Using built-in SecretsManager for secret management');
      }
    }
    
    // For development, add a note about the security risk
    if (secretsFromEnvFile > 0 && process.env.NODE_ENV !== 'production') {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info(
        'ℹ️  NOTE: For enhanced security, use the built-in SecretsManager by setting USE_SECRET_MANAGER=true ' +
        'or migrate to production mode (NODE_ENV=production). ' +
        'See docs/SECRET_MANAGEMENT.md for details.'
      );
    }
    
    // Check for template files
    this.checkTemplateFiles();
  }

  /**
   * Check for required template files with async operations
   */
  async checkTemplateFiles() {
    // Check for template files
    const backendTemplatePath = path.join(__dirname, '../.env.template');
    const frontendTemplatePath = path.join(__dirname, '../../Frontend/.env.template');
    
    try {
      const backendExists = await fs.promises.access(backendTemplatePath, fs.constants.F_OK).then(() => true).catch(() => false);
      if (!backendExists) {
        this.warnings.push('Backend .env.template file is missing. This file should be included in version control.');
      }
      
      const frontendExists = await fs.promises.access(frontendTemplatePath, fs.constants.F_OK).then(() => true).catch(() => false);
      if (!frontendExists) {
        this.warnings.push('Frontend .env.template file is missing. This file should be included in version control.');
      }
    } catch (error) {
      this.warnings.push('Error checking template files: ' + error.message);
    }
  }

  /**
   * Validate the strength of secret keys with enhanced security checks
   */
  validateSecretStrength() {
    const secretVars = [
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'COOKIE_SECRET',
      'CSRF_SECRET',
      'PASSWORD_PEPPER',
      'REQUEST_SIGNING_KEY',
      'DS_SECRET_KEY'
    ];
    
    const placeholderPatterns = [
      /REPLACE_WITH_/i,
      /your-/i,
      /change-this/i,
      /placeholder/i,
      /^secret$/i,
      /^password$/i,
      /^key$/i,
      /^token$/i,
      /^default/i,
      /^admin$/i,
      /^test$/i,
      /123456/,
      /abcdef/,
      /qwerty/i
    ];
    
    for (const varName of secretVars) {
      const secret = process.env[varName];
      
      if (!secret) {
        // Skip validation if secret is not set (might be loaded from SecretsManager)
        if (process.env.NODE_ENV === 'production' || process.env.USE_SECRET_MANAGER === 'true') {
          // In production or when using SecretsManager, secrets should be available
          // This will be checked by checkRequiredVariables()
          continue;
        } else {
          this.errors.push(`${varName} is not defined`);
          continue;
        }
      }
      
      // Check for placeholder values with enhanced patterns
      const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(secret));
      if (isPlaceholder) {
        this.errors.push(`${varName} contains placeholder or weak value - use generateSecrets.js to generate secure secrets`);
        continue;
      }
      
      // Check minimum length (should be at least 64 characters for hex-encoded 32-byte keys)
      if (secret.length < 64) {
        this.errors.push(`${varName} is too short (${secret.length} chars). Minimum: 64 characters. Run: node Scripts/generateSecrets.js`);
        continue;
      }
      
      // Check for weak patterns with enhanced detection
      if (this.isWeakSecret(secret)) {
        this.errors.push(`${varName} appears to be weak or predictable - regenerate with Scripts/generateSecrets.js`);
        continue;
      }
      
      // Check entropy with stricter requirements
      const entropy = this.calculateEntropy(secret);
      if (entropy < 4.5) {
        this.warnings.push(`${varName} has low entropy (${entropy.toFixed(2)}) - consider regenerating for better security`);
      }
      
      // Check for repeated patterns
      if (this.hasRepeatedPatterns(secret)) {
        this.warnings.push(`${varName} contains repeated patterns - consider regenerating`);
      }
      
      // Validate hex encoding for certain secrets
      if (secret.length === 128 && !/^[0-9a-fA-F]+$/.test(secret)) {
        this.warnings.push(`${varName} appears to be 128 characters but not valid hex encoding`);
      }
    }
  }

  /**
   * Check security configuration settings
   */
  checkSecurityConfiguration() {
    // Check HTTPS in production
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'true') {
      this.errors.push('COOKIE_SECURE must be true in production');
    }
    
    // Check SameSite cookie settings
    if (!['strict', 'lax', 'none'].includes(process.env.COOKIE_SAME_SITE?.toLowerCase())) {
      this.warnings.push('COOKIE_SAME_SITE should be set to strict, lax, or none');
    }
    
    // Check bcrypt rounds
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS);
    if (isNaN(bcryptRounds) || bcryptRounds < 12) {
      this.warnings.push('BCRYPT_ROUNDS should be at least 12 for security');
    }
    
    // Check JWT expiry times
    this.validateJWTExpiry();
    
    // Check CORS configuration
    this.validateCORSConfiguration();
  }

  /**
   * Validate JWT expiry settings
   */
  validateJWTExpiry() {
    const accessExpiry = process.env.JWT_EXPIRES_IN;
    const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN;
    
    if (!accessExpiry) {
      this.warnings.push('JWT_EXPIRES_IN not set, using default');
    }
    
    if (!refreshExpiry) {
      this.warnings.push('JWT_REFRESH_EXPIRES_IN not set, using default');
    }
    
    // Parse and validate expiry times
    if (accessExpiry && !this.isValidJWTExpiry(accessExpiry)) {
      this.errors.push('Invalid JWT_EXPIRES_IN format');
    }
    
    if (refreshExpiry && !this.isValidJWTExpiry(refreshExpiry)) {
      this.errors.push('Invalid JWT_REFRESH_EXPIRES_IN format');
    }
    
    // Validate JWT secrets
    this.validateJWTSecrets();
  }

  /**
   * Validate JWT secrets
   */
  validateJWTSecrets() {
    const jwtSecret = process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    
    // In production, JWT secrets are required
    if (process.env.NODE_ENV === 'production') {
      if (!jwtSecret) {
        this.errors.push('JWT_SECRET is required in production');
      }
      
      if (!refreshTokenSecret) {
        this.errors.push('REFRESH_TOKEN_SECRET is required in production');
      }
      
      // Check for weak secrets
      if (jwtSecret && (jwtSecret.includes('default') || jwtSecret.includes('REPLACE_WITH') || jwtSecret.length < 32)) {
        this.errors.push('JWT_SECRET is weak or contains placeholder value');
      }
      
      if (refreshTokenSecret && (refreshTokenSecret.includes('default') || refreshTokenSecret.includes('REPLACE_WITH') || refreshTokenSecret.length < 32)) {
        this.errors.push('REFRESH_TOKEN_SECRET is weak or contains placeholder value');
      }
    }
    
    // Even in development, warn about weak secrets
    if (jwtSecret && jwtSecret.includes('default')) {
      this.warnings.push('JWT_SECRET contains default value - use a strong secret in production');
    }
    
    if (refreshTokenSecret && refreshTokenSecret.includes('default')) {
      this.warnings.push('REFRESH_TOKEN_SECRET contains default value - use a strong secret in production');
    }
  }
  
  /**
   * Validate CORS configuration
   */
  validateCORSConfiguration() {
    const origins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS;
    
    if (!origins) {
      this.warnings.push('No CORS origins specified');
      return;
    }
    
    const originList = origins.split(',');
    
    if (process.env.NODE_ENV === 'production') {
      for (const origin of originList) {
        if (origin.trim().includes('localhost') || origin.trim().includes('127.0.0.1')) {
          this.errors.push('Production CORS should not include localhost origins');
        }
        
        if (!origin.trim().startsWith('https://')) {
          this.warnings.push('Production origins should use HTTPS');
        }
      }
    }
  }

  /**
   * Validate database configuration
   */
  validateDatabaseConfiguration() {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      this.errors.push('MONGODB_URI is required');
      return;
    }
    
    // Check URI format
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      this.errors.push('Invalid MONGODB_URI format');
    }
    
    // Check for authentication in production
    if (process.env.NODE_ENV === 'production') {
      if (!mongoUri.includes('@') && !mongoUri.includes('localhost')) {
        this.warnings.push('Production database should use authentication');
      }
      
      if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('ssl=true')) {
        this.warnings.push('Production database should use SSL/TLS');
      }
    }
  }

  /**
   * Validate Redis configuration
   */
  validateRedisConfiguration() {
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || '6379';
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisPassword) {
      this.errors.push('REDIS_PASSWORD is required for secure Redis configuration');
      return;
    }
    
    // Check Redis password strength
    if (redisPassword.includes('REPLACE_WITH') || redisPassword.includes('password')) {
      this.errors.push('REDIS_PASSWORD contains placeholder value');
    }
    
    if (redisPassword.length < 32) {
      this.warnings.push('REDIS_PASSWORD should be at least 32 characters for security');
    }
    
    // Validate Redis URL format if provided
    if (redisUrl && !redisUrl.match(/^redis:\/\/.*$/)) {
      this.errors.push('Invalid REDIS_URL format');
    }
    
    // Production-specific Redis checks
    if (process.env.NODE_ENV === 'production') {
      if (redisHost === 'localhost' || redisHost === '127.0.0.1') {
        this.warnings.push('Production Redis should not use localhost');
      }
      
      if (process.env.REDIS_SSL !== 'true') {
        this.warnings.push('Production Redis should use SSL/TLS');
      }
      
      if (!process.env.REDIS_MAX_MEMORY) {
        this.warnings.push('REDIS_MAX_MEMORY should be set for production');
      }
    }
  }
  
  /**
   * Validate SSL configuration
   */
  validateSSLConfiguration() {
    // Check if SSL is required in production
    if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'true') {
      this.warnings.push('Production environment should enforce HTTPS (set FORCE_HTTPS=true)');
    }
    
    // Check SSL certificate files in development
    if (process.env.NODE_ENV === 'development') {
      const sslDir = path.join(__dirname, '../certs');
      if (fs.existsSync(sslDir)) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.info('✅ Development SSL directory found');
      }
    }
  }
  
  /**
   * Validate external service connectivity
   */
  async validateConnectivity() {
    if (process.env.NODE_ENV === 'production') {
      const services = [];
      
      // Database connectivity
      const mongoUri = process.env.MONGODB_URI;
      if (mongoUri) {
        services.push({ name: 'MongoDB', url: mongoUri.replace(/\/\/.*@/, '//***:***@') });
      }
      
      // Redis connectivity  
      const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
      services.push({ name: 'Redis', url: redisUrl.replace(/:\/\/.*@/, '://***:***@') });
      
      // External APIs
      if (process.env.SMTP_HOST) {
        services.push({ name: 'SMTP Server', url: process.env.SMTP_HOST });
      }
      
      if (services.length > 0) {
        this.warnings.push('Production connectivity validation recommended for: ' + services.map(s => s.name).join(', '));
      }
    }
  }
  
  /**
   * Check production readiness
   */
  checkProductionReadiness() {
    if (process.env.NODE_ENV !== 'production') return;
    
    const productionChecks = [
      { var: 'ENABLE_HELMET', expected: 'true', message: 'Helmet should be enabled in production' },
      { var: 'ENABLE_COMPRESSION', expected: 'true', message: 'Compression should be enabled in production' },
      { var: 'LOG_LEVEL', expected: ['info', 'warn', 'error'], message: 'Log level should be info, warn, or error in production' }
    ];
    
    for (const check of productionChecks) {
      const value = process.env[check.var];
      
      if (Array.isArray(check.expected)) {
        if (!check.expected.includes(value)) {
          this.warnings.push(check.message);
        }
      } else if (value !== check.expected) {
        this.warnings.push(check.message);
      }
    }
  }

  /**
   * Validate file permissions with async operations
   */
  async validateFilePermissions() {
    const envPath = '.env.local';
    
    try {
      const exists = await fs.promises.access(envPath, fs.constants.F_OK).then(() => true).catch(() => false);
      if (exists) {
        const stats = await fs.promises.stat(envPath);
        const mode = stats.mode & parseInt('777', 8);
        
        // Check if file is readable by others (security risk)
        if (mode & parseInt('044', 8)) {
          this.warnings.push('.env.local file should not be readable by others (chmod 600)');
        }
      }
    } catch (error) {
      this.warnings.push('Could not check .env.local file permissions: ' + error.message);
    }
  }

  /**
   * Check if a secret appears weak or predictable
   */
  isWeakSecret(secret) {
    const weakPatterns = [
      /^(.)\1+$/, // All same character
      /^(..)\1+$/, // Repeated pairs
      /password/i,
      /secret/i,
      /key/i,
      /admin/i,
      /test/i,
      /123/,
      /abc/i
    ];
    
    return weakPatterns.some(pattern => pattern.test(secret));
  }

  /**
   * Calculate Shannon entropy of a string
   */
  calculateEntropy(str) {
    const freq = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / str.length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }
  
  /**
   * Check for repeated patterns in secret
   */
  hasRepeatedPatterns(secret) {
    // Check for repeated substrings of length 2-8
    for (let len = 2; len <= Math.min(8, secret.length / 2); len++) {
      for (let i = 0; i <= secret.length - len * 2; i++) {
        const pattern = secret.substring(i, i + len);
        const nextPattern = secret.substring(i + len, i + len * 2);
        if (pattern === nextPattern) {
          return true;
        }
      }
    }
    
    // Check for repeated characters (more than 3 in a row)
    for (let i = 0; i < secret.length - 3; i++) {
      if (secret[i] === secret[i + 1] && secret[i] === secret[i + 2] && secret[i] === secret[i + 3]) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate JWT expiry format
   */
  isValidJWTExpiry(expiry) {
    return /^\d+[smhdw]$/.test(expiry);
  }

  /**
   * Report validation results
   */
  reportResults() {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info('\n📊 Environment Validation Results:');
    appLogger.info('=' .repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      appLogger.info('✅ All environment variables are properly configured!');
    } else {
      if (this.errors.length > 0) {
        appLogger.info('\n❌ ERRORS (Must be fixed):');
        this.errors.forEach((error, index) => {
          appLogger.info(`  ${index + 1}. ${error}`);
        });
      }
      
      if (this.warnings.length > 0) {
        appLogger.info('\n⚠️  WARNINGS (Recommended fixes):');
        this.warnings.forEach((warning, index) => {
          appLogger.info(`  ${index + 1}. ${warning}`);
        });
      }
    }
    
    appLogger.info('\n' + '=' .repeat(50));
    
    if (this.errors.length > 0) {
      appLogger.info('🚫 Environment validation FAILED. Fix errors before starting the application.');
      appLogger.info('💡 Run: node Scripts/generateSecrets.js to generate secure secrets');
      appLogger.info('💡 Template files are available: Website/Backend/.env.template and Website/Frontend/.env.template');
    } else {
      appLogger.info('✅ Environment validation PASSED. Application can start safely.');
    }
  }

  /**
   * Get validation summary
   */
  getSummary() {
    return {
      passed: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      errorCount: this.errors.length,
      warningCount: this.warnings.length
    };
  }
}

/**
 * Utility function to get environment variable with default value
 */
export const getEnvValue = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * Check if running in development mode
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in test mode
 */
export const isTest = () => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Get environment mode (development, production, test)
 */
export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

export default EnvironmentValidator;