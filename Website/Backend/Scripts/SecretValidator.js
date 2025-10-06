import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🔐 COMPREHENSIVE SECRET VALIDATION & MANAGEMENT SYSTEM
 * 
 * Features:
 * - Validates all environment secrets meet security requirements
 * - Generates cryptographically secure secrets
 * - Prevents use of placeholder/default values in production
 * - Implements secret rotation capabilities
 * - Provides comprehensive audit logging
 */
class SecretValidator {
  constructor() {
    this.requiredSecrets = [
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'CSRF_SECRET',
      'COOKIE_SECRET',
      'PASSWORD_PEPPER',
      'REQUEST_SIGNING_KEY',
      'DS_SECRET_KEY'
    ];
    
    this.placeholderPatterns = [
      /^REPLACE_WITH_/,
      /^your-/,
      /^change-this/,
      /^placeholder/,
      /^secret$/,
      /^password$/,
      /^key$/,
      /^token$/,
      /^default/
    ];
    
    this.minSecretLength = 64; // 256-bit security
    this.maxSecretAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    this.auditLog = [];
  }
  
  /**
   * Validate all required secrets are present and secure
   */
  async validateAllSecrets() {
    console.log('🔍 Starting comprehensive secret validation...');
    
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };
    
    // Check if .env.local exists
    const envPath = path.join(__dirname, '../../../.env.local');
    if (!fs.existsSync(envPath)) {
      results.errors.push('❌ .env.local file not found - copy from .env.template');
      results.valid = false;
    }
    
    // Validate each required secret
    for (const secretName of this.requiredSecrets) {
      const result = await this.validateSecret(secretName);
      
      if (!result.valid) {
        results.errors.push(`❌ ${secretName}: ${result.error}`);
        results.valid = false;
      } else if (result.warning) {
        results.warnings.push(`⚠️ ${secretName}: ${result.warning}`);
      }
      
      if (result.recommendation) {
        results.recommendations.push(`💡 ${secretName}: ${result.recommendation}`);
      }
    }
    
    // Validate database credentials
    const dbResult = await this.validateDatabaseCredentials();
    if (!dbResult.valid) {
      results.errors.push(`❌ Database: ${dbResult.error}`);
      results.valid = false;
    }
    
    // Validate Redis credentials
    const redisResult = await this.validateRedisCredentials();
    if (!redisResult.valid) {
      results.errors.push(`❌ Redis: ${redisResult.error}`);
      results.valid = false;
    }
    
    this.logAuditEvent('secret_validation', { results });
    
    return results;
  }
  
  /**
   * Validate individual secret
   */
  async validateSecret(secretName) {
    const secret = process.env[secretName];
    
    // Check if secret exists
    if (!secret) {
      return {
        valid: false,
        error: 'Secret not found in environment'
      };
    }
    
    // Check for placeholder values
    const isPlaceholder = this.placeholderPatterns.some(pattern => 
      pattern.test(secret.toLowerCase())
    );
    
    if (isPlaceholder) {
      return {
        valid: false,
        error: 'Using placeholder value - replace with secure secret'
      };
    }
    
    // Check minimum length
    if (secret.length < this.minSecretLength) {
      return {
        valid: false,
        error: `Secret too short (${secret.length} chars). Minimum: ${this.minSecretLength}`
      };
    }
    
    // Check entropy (randomness)
    const entropy = this.calculateEntropy(secret);
    if (entropy < 4.5) { // Reasonable entropy threshold
      return {
        valid: true,
        warning: `Low entropy detected (${entropy.toFixed(2)}). Consider regenerating.`
      };
    }
    
    // Check for common weak patterns
    if (this.hasWeakPatterns(secret)) {
      return {
        valid: true,
        warning: 'Secret contains predictable patterns'
      };
    }
    
    // Check secret age (if metadata available)
    const ageResult = await this.checkSecretAge(secretName);
    if (ageResult.recommendation) {
      return {
        valid: true,
        recommendation: ageResult.recommendation
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Calculate Shannon entropy of a string
   */
  calculateEntropy(str) {
    const freq = {};
    for (let char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    
    let entropy = 0;
    const length = str.length;
    
    for (let char in freq) {
      const p = freq[char] / length;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }
  
  /**
   * Check for weak patterns in secret
   */
  hasWeakPatterns(secret) {
    const weakPatterns = [
      /^(..)\1+$/, // Repeated pairs
      /^(.)\1{10,}$/, // Too many repeated characters
      /123456|abcdef|qwerty/i, // Common sequences
      /password|secret|admin/i // Common words
    ];
    
    return weakPatterns.some(pattern => pattern.test(secret));
  }
  
  /**
   * Check secret age and rotation needs
   */
  async checkSecretAge(secretName) {
    try {
      const metadataPath = path.join(__dirname, '../../../.secret-metadata.json');
      
      if (!fs.existsSync(metadataPath)) {
        return {
          recommendation: 'Create secret metadata file for rotation tracking'
        };
      }
      
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const secretInfo = metadata[secretName];
      
      if (!secretInfo) {
        return {
          recommendation: 'Add secret to metadata file for rotation tracking'
        };
      }
      
      const age = Date.now() - new Date(secretInfo.created).getTime();
      
      if (age > this.maxSecretAge) {
        return {
          recommendation: `Secret is ${Math.round(age / (24 * 60 * 60 * 1000))} days old. Consider rotation.`
        };
      }
      
      return {};
    } catch (error) {
      return {
        recommendation: 'Error checking secret age - verify metadata file'
      };
    }
  }
  
  /**
   * Validate database credentials
   */
  async validateDatabaseCredentials() {
    const username = process.env.MONGO_USERNAME;
    const password = process.env.MONGO_PASSWORD;
    
    if (!username || !password) {
      return {
        valid: false,
        error: 'Missing MongoDB credentials'
      };
    }
    
    if (username === 'admin' && password.includes('REPLACE_WITH_')) {
      return {
        valid: false,
        error: 'Using placeholder database credentials'
      };
    }
    
    if (password.length < 16) {
      return {
        valid: false,
        error: 'Database password too weak (minimum 16 characters)'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate Redis credentials
   */
  async validateRedisCredentials() {
    const password = process.env.REDIS_PASSWORD;
    
    if (!password) {
      return {
        valid: false,
        error: 'Redis password not configured'
      };
    }
    
    if (password.includes('REPLACE_WITH_')) {
      return {
        valid: false,
        error: 'Using placeholder Redis password'
      };
    }
    
    if (password.length < 32) {
      return {
        valid: false,
        error: 'Redis password too weak (minimum 32 characters)'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Generate new cryptographically secure secrets
   */
  async generateSecrets(options = {}) {
    const {
      length = 64,
      includeSpecial = true,
      excludeSimilar = true
    } = options;
    
    console.log('🔐 Generating cryptographically secure secrets...');
    
    const secrets = {};
    
    for (const secretName of this.requiredSecrets) {
      secrets[secretName] = this.generateSecureSecret(length, {
        includeSpecial,
        excludeSimilar
      });
    }
    
    // Generate database credentials
    secrets.MONGO_PASSWORD = this.generateSecureSecret(32);
    secrets.REDIS_PASSWORD = this.generateSecureSecret(32);
    
    // Save metadata
    await this.saveSecretMetadata(secrets);
    
    this.logAuditEvent('secrets_generated', {
      count: Object.keys(secrets).length,
      timestamp: new Date().toISOString()
    });
    
    return secrets;
  }
  
  /**
   * Generate single secure secret
   */
  generateSecureSecret(length, options = {}) {
    const {
      includeSpecial = true,
      excludeSimilar = true
    } = options;
    
    let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    if (includeSpecial) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }
    
    if (excludeSimilar) {
      // Remove similar looking characters
      charset = charset.replace(/[0O1lI]/g, '');
    }
    
    let secret = '';
    const charsetLength = charset.length;
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charsetLength);
      secret += charset[randomIndex];
    }
    
    return secret;
  }
  
  /**
   * Save secret metadata for rotation tracking
   */
  async saveSecretMetadata(secrets) {
    const metadataPath = path.join(__dirname, '../../../.secret-metadata.json');
    const timestamp = new Date().toISOString();
    
    const metadata = {};
    
    for (const secretName in secrets) {
      metadata[secretName] = {
        created: timestamp,
        length: secrets[secretName].length,
        hash: crypto.createHash('sha256').update(secrets[secretName]).digest('hex').substring(0, 16)
      };
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('💾 Secret metadata saved for rotation tracking');
  }
  
  /**
   * Generate .env.local file with secure secrets
   */
  async generateEnvFile(secrets) {
    const templatePath = path.join(__dirname, '../../../.env.template');
    const envPath = path.join(__dirname, '../../../.env.local');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error('.env.template not found');
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholder values with generated secrets
    for (const [key, value] of Object.entries(secrets)) {
      const pattern = new RegExp(`^${key}=.*$`, 'm');
      template = template.replace(pattern, `${key}=${value}`);
    }
    
    // Replace other placeholder patterns
    template = template.replace(
      /^MONGO_PASSWORD=.*$/m,
      `MONGO_PASSWORD=${secrets.MONGO_PASSWORD}`
    );
    
    template = template.replace(
      /^REDIS_PASSWORD=.*$/m,
      `REDIS_PASSWORD=${secrets.REDIS_PASSWORD}`
    );
    
    fs.writeFileSync(envPath, template);
    console.log('✅ .env.local generated with secure secrets');
  }
  
  /**
   * Validate secrets in production environment
   */
  async validateProduction() {
    if (process.env.NODE_ENV !== 'production') {
      return { valid: true, message: 'Not in production environment' };
    }
    
    const result = await this.validateAllSecrets();
    
    if (!result.valid) {
      console.error('🚨 PRODUCTION SECRET VALIDATION FAILED');
      console.error('Errors:', result.errors);
      process.exit(1);
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Production secret warnings:', result.warnings);
    }
    
    this.logAuditEvent('production_validation', {
      status: 'passed',
      warnings: result.warnings.length
    });
    
    return { valid: true, message: 'Production secrets validated successfully' };
  }
  
  /**
   * Log audit events
   */
  logAuditEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    this.auditLog.push(logEntry);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }
  
  /**
   * Get audit log
   */
  getAuditLog() {
    return this.auditLog;
  }
  
  /**
   * CLI interface for secret management
   */
  static async cli() {
    const validator = new SecretValidator();
    const args = process.argv.slice(2);
    
    switch (args[0]) {
      case 'validate':
        const result = await validator.validateAllSecrets();
        console.log('\n🔍 SECRET VALIDATION RESULTS:');
        
        if (result.valid) {
          console.log('✅ All secrets are valid and secure');
        } else {
          console.log('❌ Secret validation failed');
          result.errors.forEach(error => console.log(error));
        }
        
        if (result.warnings.length > 0) {
          console.log('\n⚠️ WARNINGS:');
          result.warnings.forEach(warning => console.log(warning));
        }
        
        if (result.recommendations.length > 0) {
          console.log('\n💡 RECOMMENDATIONS:');
          result.recommendations.forEach(rec => console.log(rec));
        }
        
        process.exit(result.valid ? 0 : 1);
        
      case 'generate':
        const secrets = await validator.generateSecrets();
        await validator.generateEnvFile(secrets);
        console.log('\n✅ New secure secrets generated and saved to .env.local');
        console.log('🔐 Backup your secrets in a secure location!');
        break;
        
      case 'production-check':
        await validator.validateProduction();
        break;
        
      default:
        console.log('\n🔐 SECRET VALIDATOR CLI');
        console.log('Usage:');
        console.log('  node SecretValidator.js validate      - Validate all secrets');
        console.log('  node SecretValidator.js generate      - Generate new secrets');
        console.log('  node SecretValidator.js production-check - Validate production secrets');
        break;
    }
  }
}

export default SecretValidator;

// CLI interface
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  SecretValidator.cli().catch(console.error);
}