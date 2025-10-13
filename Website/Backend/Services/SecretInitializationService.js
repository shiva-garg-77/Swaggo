import secretsManager from '../Security/SecretsManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🔐 SECRET INITIALIZATION SERVICE
 * 
 * Initializes application secrets from the SecretsManager at startup
 * This service replaces direct environment variable loading for sensitive data
 * in production environments for enhanced security
 */

class SecretInitializationService {
  constructor() {
    this.requiredSecrets = [
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'COOKIE_SECRET',
      'CSRF_SECRET',
      'PASSWORD_PEPPER',
      'REQUEST_SIGNING_KEY',
      'DS_SECRET_KEY'
    ];
    
    this.isInitialized = false;
  }

  /**
   * Initialize secrets for the application
   * In production, loads secrets from SecretsManager
   * In development, can fall back to environment variables with warnings
   */
  async initialize() {
    console.log('🔐 Initializing application secrets...');
    
    // Check if we're in production mode
    const isProduction = process.env.NODE_ENV === 'production';
    
    // For production, always use SecretsManager
    if (isProduction) {
      console.log('🔒 Production mode: Loading secrets from SecretsManager...');
      await this.loadSecretsFromManager();
    } else {
      // For development, check if we should use SecretsManager
      const useSecretsManager = process.env.USE_SECRET_MANAGER === 'true';
      
      if (useSecretsManager) {
        console.log('🔧 Development mode with SecretsManager enabled...');
        await this.loadSecretsFromManager();
      } else {
        console.log('🔧 Development mode: Using environment variables (NOT RECOMMENDED FOR PRODUCTION)');
        await this.validateEnvironmentSecrets();
      }
    }
    
    this.isInitialized = true;
    console.log('✅ Secret initialization completed');
  }

  /**
   * Load secrets from the SecretsManager
   */
  async loadSecretsFromManager() {
    try {
      // Ensure SecretsManager is initialized
      if (!secretsManager.isInitialized) {
        await secretsManager.initialize();
      }
      
      // Load required secrets
      for (const secretName of this.requiredSecrets) {
        const secretValue = await secretsManager.getSecret(secretName);
        
        if (secretValue) {
          // Set the environment variable for compatibility with existing code
          process.env[secretName] = secretValue;
          console.log(`✅ Loaded secret: ${secretName}`);
        } else {
          // If secret doesn't exist, try to generate and store it
          console.log(`⚠️ Secret not found: ${secretName}, generating new one...`);
          const generatedSecret = this.generateSecureSecret(secretName);
          await secretsManager.setSecret(secretName, generatedSecret, {
            type: this.getSecretType(secretName),
            category: 'CRITICAL',
            description: `Auto-generated secret for ${secretName}`
          });
          
          // Set the environment variable
          process.env[secretName] = generatedSecret;
          console.log(`✅ Generated and stored secret: ${secretName}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load secrets from SecretsManager:', error);
      throw new Error(`Secret initialization failed: ${error.message}`);
    }
  }

  /**
   * Validate environment secrets in development mode
   */
  async validateEnvironmentSecrets() {
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
    
    for (const secretName of this.requiredSecrets) {
      const secretValue = process.env[secretName];
      
      if (!secretValue) {
        console.warn(`⚠️ Missing environment variable: ${secretName}`);
        continue;
      }
      
      // Check for placeholder values
      const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(secretValue));
      if (isPlaceholder) {
        console.warn(`⚠️ Environment variable ${secretName} contains placeholder value`);
      }
      
      // Check minimum length
      if (secretValue.length < 32) {
        console.warn(`⚠️ Environment variable ${secretName} is too short`);
      }
    }
  }

  /**
   * Generate a cryptographically secure secret
   */
  generateSecureSecret(secretName) {
    const secretType = this.getSecretType(secretName);
    
    switch (secretType) {
      case 'jwt':
        return require('crypto').randomBytes(64).toString('hex');
      case 'api_key':
        return 'sk_' + require('crypto').randomBytes(32).toString('hex');
      case 'encryption':
        return require('crypto').randomBytes(32).toString('base64');
      default:
        return require('crypto').randomBytes(64).toString('hex');
    }
  }

  /**
   * Get secret type for categorization
   */
  getSecretType(secretName) {
    if (secretName.includes('TOKEN')) return 'jwt';
    if (secretName.includes('KEY')) return 'api_key';
    if (secretName.includes('SECRET')) return 'encryption';
    return 'api_key';
  }

  /**
   * Pre-populate SecretsManager with secrets from environment (for migration)
   */
  async migrateEnvironmentSecrets() {
    console.log('🔄 Migrating environment secrets to SecretsManager...');
    
    try {
      // Ensure SecretsManager is initialized
      if (!secretsManager.isInitialized) {
        await secretsManager.initialize();
      }
      
      let migratedCount = 0;
      
      // Migrate required secrets from environment to SecretsManager
      for (const secretName of this.requiredSecrets) {
        const secretValue = process.env[secretName];
        
        if (secretValue) {
          // Check if secret already exists in SecretsManager
          const existingSecret = await secretsManager.getSecret(secretName);
          
          if (!existingSecret) {
            // Store the secret in SecretsManager
            await secretsManager.setSecret(secretName, secretValue, {
              type: this.getSecretType(secretName),
              category: 'CRITICAL',
              description: `Migrated from environment variable`
            });
            
            console.log(`✅ Migrated secret: ${secretName}`);
            migratedCount++;
          } else {
            console.log(`ℹ️ Secret already exists in SecretsManager: ${secretName}`);
          }
        } else {
          console.warn(`⚠️ Environment variable not found: ${secretName}`);
        }
      }
      
      console.log(`🔄 Migration completed: ${migratedCount} secrets migrated`);
    } catch (error) {
      console.error('❌ Failed to migrate secrets:', error);
      throw error;
    }
  }
}

// Export singleton instance
const secretInitializationService = new SecretInitializationService();

export default secretInitializationService;