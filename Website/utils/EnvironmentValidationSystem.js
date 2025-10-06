/**
 * 🛡️ ENVIRONMENT VALIDATION SYSTEM - 10/10 SECURITY
 * 
 * CRITICAL SECURITY FEATURES:
 * ✅ Validates environment variables
 * ✅ Checks secret strength
 * ✅ Validates database configs
 * ✅ Ensures production readiness
 * 
 * @version 1.0.0 SECURITY CRITICAL
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class EnvironmentValidationSystem {
  constructor() {
    this.results = { passed: [], warnings: [], errors: [], critical: [], score: 0 };
    
    this.requirements = {
      minSecretLength: 64,
      requiredSecrets: ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'CSRF_SECRET', 'ENCRYPTION_KEY'],
      requiredEnvVars: ['NODE_ENV', 'PORT', 'MONGODB_URI', 'NEXT_PUBLIC_API_URL']
    };
  }

  async validateEnvironment() {
    console.log('🔍 Starting environment validation...');
    
    await this.validateRequiredVariables();
    await this.validateSecrets();
    await this.validateDatabaseConfig();
    await this.validateProductionReadiness();
    
    this.calculateScore();
    return await this.generateReport();
  }

  async validateRequiredVariables() {
    for (const varName of this.requirements.requiredEnvVars) {
      const value = process.env[varName];
      
      if (!value) {
        this.addError(`Required variable ${varName} is not set`);
      } else if (this.isPlaceholder(value)) {
        this.addError(`Variable ${varName} contains placeholder value`);
      } else {
        this.addPass(`Variable ${varName} is properly set`);
      }
    }
  }

  async validateSecrets() {
    for (const secretName of this.requirements.requiredSecrets) {
      const secret = process.env[secretName];
      
      if (!secret) {
        this.addCritical(`Secret ${secretName} is not defined`);
      } else if (secret.length < this.requirements.minSecretLength) {
        this.addCritical(`Secret ${secretName} is too short`);
      } else if (this.isWeakSecret(secret)) {
        this.addCritical(`Secret ${secretName} is weak`);
      } else {
        this.addPass(`Secret ${secretName} meets requirements`);
      }
    }
  }

  async validateDatabaseConfig() {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      this.addCritical('Database connection string missing');
      return;
    }
    
    try {
      const url = new URL(mongoUri);
      
      if (!['mongodb:', 'mongodb+srv:'].includes(url.protocol)) {
        this.addError('Invalid database protocol');
      }
      
      if (process.env.NODE_ENV === 'production' && url.hostname.includes('localhost')) {
        this.addCritical('Database uses localhost in production');
      }
      
      this.addPass('Database configuration valid');
    } catch (error) {
      this.addCritical('Invalid database URI format');
    }
  }

  async validateProductionReadiness() {
    if (process.env.NODE_ENV !== 'production') return;
    
    const debugFlags = ['DEBUG', 'VERBOSE_LOGGING', 'BYPASS_RATE_LIMIT'];
    
    for (const flag of debugFlags) {
      if (process.env[flag] === 'true') {
        this.addCritical(`Debug flag ${flag} enabled in production`);
      }
    }
  }

  isPlaceholder(value) {
    const patterns = [/replace.?with/i, /placeholder/i, /example/i, /^secret$/i];
    return patterns.some(pattern => pattern.test(value));
  }

  isWeakSecret(secret) {
    const weakPatterns = [/^(.)\1{10,}$/, /^123456/, /^password/i, /qwerty/i];
    return weakPatterns.some(pattern => pattern.test(secret));
  }

  addPass(message) { this.results.passed.push(message); }
  addWarning(message) { this.results.warnings.push(message); console.warn(`⚠️ ${message}`); }
  addError(message) { this.results.errors.push(message); console.error(`❌ ${message}`); }
  addCritical(message) { this.results.critical.push(message); console.error(`🚨 ${message}`); }

  calculateScore() {
    const total = this.results.passed.length + this.results.warnings.length + 
                  this.results.errors.length + this.results.critical.length;
    
    if (total === 0) return;
    
    let score = (this.results.passed.length / total) * 100;
    score -= this.results.warnings.length * 2;
    score -= this.results.errors.length * 5;
    score -= this.results.critical.length * 15;
    
    this.results.score = Math.max(0, Math.min(100, Math.round(score)));
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      score: this.results.score,
      status: this.getStatus(),
      summary: {
        passed: this.results.passed.length,
        warnings: this.results.warnings.length,
        errors: this.results.errors.length,
        critical: this.results.critical.length
      },
      results: this.results
    };
    
    const reportPath = path.resolve(process.cwd(), 'ENVIRONMENT_VALIDATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Environment Validation Report:');
    console.log(`🎯 Score: ${report.score}/100`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`⚠️ Warnings: ${report.summary.warnings}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    console.log(`🚨 Critical: ${report.summary.critical}`);
    
    return report;
  }

  getStatus() {
    if (this.results.critical.length > 0) return 'FAILED - Critical issues';
    if (this.results.errors.length > 0) return 'FAILED - Errors found';
    if (this.results.warnings.length > 0) return 'PASSED with warnings';
    return 'PASSED - All checks successful';
  }
}

const environmentValidator = new EnvironmentValidationSystem();
export default environmentValidator;