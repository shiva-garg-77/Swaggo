/**
 * 🔐 JWT SECURITY CONFIGURATION
 * 
 * Enhanced JWT security configuration with key rotation, algorithm management,
 * and comprehensive security policies
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendEnvPath = join(__dirname, '..', '.env.local');

// Load environment variables
dotenv.config({ path: backendEnvPath });

class JWTSecurityConfig {
  constructor() {
    this.config = {
      // JWT Algorithms - Stronger defaults
      algorithms: {
        access: process.env.JWT_ACCESS_ALGORITHM || 'HS512',
        refresh: process.env.JWT_REFRESH_ALGORITHM || 'HS512',
        csrf: process.env.JWT_CSRF_ALGORITHM || 'HS256'
      },
      
      // Key lengths - Minimum secure lengths
      keyLengths: {
        access: parseInt(process.env.JWT_ACCESS_KEY_LENGTH) || 64, // 512 bits
        refresh: parseInt(process.env.JWT_REFRESH_KEY_LENGTH) || 64, // 512 bits
        csrf: parseInt(process.env.JWT_CSRF_KEY_LENGTH) || 32 // 256 bits
      },
      
      // Expiration times - More secure defaults
      expiration: {
        access: process.env.JWT_ACCESS_EXPIRATION || '10m', // Reduced from 15m to 10m
        refresh: process.env.JWT_REFRESH_EXPIRATION || '12h', // Reduced from 24h to 12h
        csrf: process.env.JWT_CSRF_EXPIRATION || '30m' // Reduced from 1h to 30m
      },
      
      // Issuer and Audience
      issuer: process.env.JWT_ISSUER || 'swaggo-backend',
      audience: process.env.JWT_AUDIENCE || 'swaggo-frontend',
      
      // Security features
      security: {
        // Key rotation
        keyRotation: {
          enabled: process.env.JWT_KEY_ROTATION_ENABLED === 'true',
          interval: parseInt(process.env.JWT_KEY_ROTATION_INTERVAL) || 7 * 24 * 60 * 60 * 1000, // 7 days
          gracePeriod: parseInt(process.env.JWT_KEY_GRACE_PERIOD) || 24 * 60 * 60 * 1000 // 24 hours
        },
        
        // Token binding
        tokenBinding: {
          enabled: process.env.JWT_TOKEN_BINDING_ENABLED !== 'false',
          bindToDevice: process.env.JWT_BIND_TO_DEVICE !== 'false', // Enabled by default
          bindToIP: process.env.JWT_BIND_TO_IP !== 'false', // Enabled by default
          bindToUserAgent: process.env.JWT_BIND_TO_USER_AGENT !== 'false' // Enabled by default
        },
        
        // Replay protection
        replayProtection: {
          enabled: process.env.JWT_REPLAY_PROTECTION_ENABLED !== 'false',
          nonceRequired: process.env.JWT_NONCE_REQUIRED === 'true',
          jtiTracking: process.env.JWT_JTI_TRACKING !== 'false'
        },
        
        // Claims validation
        claimsValidation: {
          enabled: process.env.JWT_CLAIMS_VALIDATION_ENABLED !== 'false',
          validateIssuer: process.env.JWT_VALIDATE_ISSUER !== 'false',
          validateAudience: process.env.JWT_VALIDATE_AUDIENCE !== 'false',
          validateExpiration: process.env.JWT_VALIDATE_EXPIRATION !== 'false',
          validateNotBefore: process.env.JWT_VALIDATE_NOT_BEFORE === 'true'
        }
      },
      
      // Performance settings
      performance: {
        cacheKeys: process.env.JWT_CACHE_KEYS === 'true',
        cacheTTL: parseInt(process.env.JWT_CACHE_TTL) || 300000, // 5 minutes
        maxCachedKeys: parseInt(process.env.JWT_MAX_CACHED_KEYS) || 100
      }
    };
    
    // Validate configuration
    this.validateConfiguration();
    
    // Initialize key management
    this.initializeKeyManagement();
  }
  
  /**
   * Validate JWT configuration
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];
    
    // Validate algorithms
    const supportedAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'];
    
    Object.entries(this.config.algorithms).forEach(([type, algorithm]) => {
      if (!supportedAlgorithms.includes(algorithm)) {
        errors.push(`Unsupported ${type} algorithm: ${algorithm}`);
      }
    });
    
    // Validate key lengths
    Object.entries(this.config.keyLengths).forEach(([type, length]) => {
      const minLength = type === 'csrf' ? 32 : 64;
      if (length < minLength) {
        errors.push(`${type} key length too short: ${length} (minimum: ${minLength})`);
      }
    });
    
    // Validate secrets
    const secrets = {
      access: process.env.ACCESS_TOKEN_SECRET,
      refresh: process.env.REFRESH_TOKEN_SECRET,
      csrf: process.env.CSRF_SECRET
    };
    
    Object.entries(secrets).forEach(([type, secret]) => {
      if (!secret) {
        errors.push(`Missing ${type} secret`);
      } else if (secret.length < this.config.keyLengths[type]) {
        warnings.push(`${type} secret is shorter than recommended length`);
      }
    });
    
    // Log validation results
    if (errors.length > 0) {
      console.error('❌ JWT Security Configuration Errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('JWT security configuration validation failed');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ JWT Security Configuration Warnings:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
  
  /**
   * Initialize key management system
   */
  initializeKeyManagement() {
    this.keyStore = new Map();
    this.keyCache = new Map();
    
    // Load current keys
    this.loadCurrentKeys();
    
    // Start key rotation scheduler if enabled
    if (this.config.security.keyRotation.enabled) {
      this.startKeyRotationScheduler();
    }
  }
  
  /**
   * Load current keys from environment or generate if missing
   */
  loadCurrentKeys() {
    const keyTypes = ['access', 'refresh', 'csrf'];
    
    keyTypes.forEach(type => {
      const envVar = this.getSecretEnvVar(type);
      let secret = process.env[envVar];
      
      if (!secret) {
        console.warn(`⚠️ ${type} secret not found in environment, generating temporary key`);
        secret = this.generateSecureKey(type);
      }
      
      this.keyStore.set(type, {
        current: secret,
        previous: null,
        createdAt: new Date(),
        rotatedAt: null
      });
    });
  }
  
  /**
   * Get environment variable name for secret type
   */
  getSecretEnvVar(type) {
    const mapping = {
      access: 'ACCESS_TOKEN_SECRET',
      refresh: 'REFRESH_TOKEN_SECRET',
      csrf: 'CSRF_SECRET'
    };
    
    return mapping[type] || `${type.toUpperCase()}_SECRET`;
  }
  
  /**
   * Generate a cryptographically secure key
   */
  generateSecureKey(type) {
    const length = this.config.keyLengths[type] || 64;
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Start key rotation scheduler
   */
  startKeyRotationScheduler() {
    const interval = this.config.security.keyRotation.interval;
    
    setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        console.error('❌ Failed to rotate JWT keys:', error.message);
      }
    }, interval);
    
    console.log(`⏰ JWT key rotation scheduler started (interval: ${interval}ms)`);
  }
  
  /**
   * Rotate JWT keys
   */
  async rotateKeys() {
    console.log('🔄 Rotating JWT keys...');
    
    const keyTypes = ['access', 'refresh', 'csrf'];
    
    for (const type of keyTypes) {
      try {
        const currentKey = this.keyStore.get(type);
        const newKey = this.generateSecureKey(type);
        
        // Store previous key and set new key
        this.keyStore.set(type, {
          current: newKey,
          previous: currentKey.current,
          createdAt: new Date(),
          rotatedAt: new Date()
        });
        
        console.log(`✅ Rotated ${type} key`);
      } catch (error) {
        console.error(`❌ Failed to rotate ${type} key:`, error.message);
      }
    }
    
    // Clear key cache
    this.keyCache.clear();
    
    console.log('✅ JWT key rotation completed');
  }
  
  /**
   * Get signing key for token type
   */
  getSigningKey(type, allowPrevious = false) {
    const keyData = this.keyStore.get(type);
    
    if (!keyData) {
      throw new Error(`No key found for type: ${type}`);
    }
    
    return keyData.current;
  }
  
  /**
   * Get verification keys (current and previous for grace period)
   */
  getVerificationKeys(type) {
    const keyData = this.keyStore.get(type);
    
    if (!keyData) {
      throw new Error(`No key found for type: ${type}`);
    }
    
    const keys = [keyData.current];
    
    // Include previous key if within grace period
    if (keyData.previous && keyData.rotatedAt) {
      const gracePeriod = this.config.security.keyRotation.gracePeriod;
      const timeSinceRotation = Date.now() - new Date(keyData.rotatedAt).getTime();
      
      if (timeSinceRotation <= gracePeriod) {
        keys.push(keyData.previous);
      }
    }
    
    return keys;
  }
  
  /**
   * Get configuration
   */
  get() {
    return { ...this.config };
  }
  
  /**
   * Get specific configuration section
   */
  getSection(section) {
    return this.config[section] ? { ...this.config[section] } : null;
  }
}

// Export singleton instance
const jwtSecurityConfig = new JWTSecurityConfig();

export default jwtSecurityConfig;
export { JWTSecurityConfig };