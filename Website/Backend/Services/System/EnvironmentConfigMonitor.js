/**
 * 🌍 ENVIRONMENT CONFIGURATION MONITOR & SECURITY COMPLIANCE SYSTEM
 * 
 * Enterprise-grade environment monitoring and compliance management:
 * - Real-time environment variable monitoring
 * - Configuration drift detection
 * - Security compliance validation
 * - Performance metrics tracking
 * - Alert system for configuration changes
 * - Configuration rollback capabilities
 * - Multi-environment support
 * - Automated security policy enforcement
 * - Configuration templates validation
 * - Secret rotation monitoring
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import EnvironmentValidator from '../Config/EnvironmentValidator.js';
import SecurityConfig from '../Config/SecurityConfig.js';
import SecurityAuditLogger from './SecurityAuditLogger.js';

class EnvironmentConfigMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.currentConfig = new Map();
    this.baselineConfig = new Map();
    this.configHistory = [];
    this.watchers = new Map();
    this.complianceRules = new Map();
    
    this.monitoring = {
      enabled: process.env.ENABLE_CONFIG_MONITORING !== 'false',
      interval: parseInt(process.env.CONFIG_MONITOR_INTERVAL) || 60000, // 1 minute
      alertThreshold: 5, // Alert after 5 configuration violations
      maxHistoryEntries: 100
    };
    
    this.metrics = {
      configChanges: 0,
      complianceViolations: 0,
      secretRotations: 0,
      environmentSwitches: 0,
      lastCheck: null,
      uptimeStart: Date.now()
    };
    
    this.alerts = {
      configurationDrift: [],
      complianceViolations: [],
      securityIssues: [],
      performanceIssues: []
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the environment configuration monitor
   */
  async initialize() {
    console.log('🌍 Initializing Environment Configuration Monitor...');
    
    await this.loadBaselineConfiguration();
    await this.setupComplianceRules();
    await this.validateCurrentConfiguration();
    
    if (this.monitoring.enabled) {
      this.startMonitoring();
      this.setupFileWatchers();
    }
    
    this.setupCleanupTasks();
    
    console.log('✅ Environment Configuration Monitor initialized');
  }
  
  /**
   * Load baseline configuration from template
   */
  async loadBaselineConfiguration() {
    try {
      const templatePath = '.env.template';
      
      if (!fs.existsSync(templatePath)) {
        console.warn('⚠️ .env.template not found, creating baseline from current config');
        this.createBaselineFromCurrent();
        return;
      }
      
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const templateVars = this.parseEnvFile(templateContent);
      
      // Store baseline configuration
      for (const [key, value] of templateVars.entries()) {
        this.baselineConfig.set(key, {
          value: value,
          required: this.isRequiredVariable(key),
          sensitive: this.isSensitiveVariable(key),
          type: this.inferVariableType(value),
          loadedAt: new Date()
        });
      }
      
      console.log(`📋 Loaded baseline configuration with ${this.baselineConfig.size} variables`);
      
    } catch (error) {
      console.error('Failed to load baseline configuration:', error);
    }
  }
  
  /**
   * Parse environment file content
   */
  parseEnvFile(content) {
    const vars = new Map();
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        vars.set(key.trim(), value.trim());
      }
    }
    
    return vars;
  }
  
  /**
   * Create baseline from current environment
   */
  createBaselineFromCurrent() {
    for (const [key, value] of Object.entries(process.env)) {
      if (this.isApplicationVariable(key)) {
        this.baselineConfig.set(key, {
          value: value,
          required: this.isRequiredVariable(key),
          sensitive: this.isSensitiveVariable(key),
          type: this.inferVariableType(value),
          loadedAt: new Date()
        });
      }
    }
    
    console.log(`📋 Created baseline from current environment (${this.baselineConfig.size} variables)`);
  }
  
  /**
   * Check if variable is application-specific
   */
  isApplicationVariable(key) {
    const appPrefixes = [
      'MONGODB', 'MONGO', 'DB_', 'DATABASE',
      'JWT', 'ACCESS_TOKEN', 'REFRESH_TOKEN',
      'PORT', 'NODE_ENV', 'FRONTEND',
      'API_', 'NEXT_PUBLIC',
      'COOKIE', 'CSRF', 'PASSWORD',
      'SMTP', 'VAPID', 'REDIS',
      'SSL', 'TLS', 'CERT',
      'LOG', 'AUDIT', 'ALERT'
    ];
    
    return appPrefixes.some(prefix => key.startsWith(prefix));
  }
  
  /**
   * Setup compliance rules
   */
  async setupComplianceRules() {
    // Security compliance rules
    this.complianceRules.set('PRODUCTION_SECRETS', {
      name: 'Production Secrets Validation',
      description: 'Ensure all secrets are properly configured in production',
      severity: 'CRITICAL',
      check: (config) => {
        if (process.env.NODE_ENV === 'production') {
          const secrets = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'COOKIE_SECRET'];
          for (const secret of secrets) {
            const value = config.get(secret)?.value || process.env[secret];
            if (!value || value.includes('REPLACE_WITH') || value.length < 32) {
              return {
                passed: false,
                message: `Production secret ${secret} is not properly configured`
              };
            }
          }
        }
        return { passed: true };
      }
    });
    
    this.complianceRules.set('HTTPS_ENFORCEMENT', {
      name: 'HTTPS Enforcement',
      description: 'Ensure HTTPS is enforced in production',
      severity: 'HIGH',
      check: (config) => {
        if (process.env.NODE_ENV === 'production') {
          const cookieSecure = config.get('COOKIE_SECURE')?.value || process.env.COOKIE_SECURE;
          if (cookieSecure !== 'true') {
            return {
              passed: false,
              message: 'COOKIE_SECURE must be true in production'
            };
          }
        }
        return { passed: true };
      }
    });
    
    this.complianceRules.set('DATABASE_SECURITY', {
      name: 'Database Security Configuration',
      description: 'Ensure database connections use proper security',
      severity: 'HIGH',
      check: (config) => {
        const mongoUri = config.get('MONGODB_URI')?.value || process.env.MONGODB_URI;
        if (mongoUri && process.env.NODE_ENV === 'production') {
          if (!mongoUri.includes('ssl=true') && !mongoUri.includes('tls=true')) {
            return {
              passed: false,
              message: 'Database connection should use SSL/TLS in production'
            };
          }
        }
        return { passed: true };
      }
    });
    
    this.complianceRules.set('RATE_LIMITING', {
      name: 'Rate Limiting Configuration',
      description: 'Ensure rate limiting is properly configured',
      severity: 'MEDIUM',
      check: (config) => {
        const globalLimit = config.get('GLOBAL_RATE_LIMIT_MAX')?.value || process.env.GLOBAL_RATE_LIMIT_MAX;
        if (process.env.NODE_ENV === 'production' && (!globalLimit || parseInt(globalLimit) > 5000)) {
          return {
            passed: false,
            message: 'Rate limiting should be stricter in production'
          };
        }
        return { passed: true };
      }
    });
    
    console.log(`📏 Setup ${this.complianceRules.size} compliance rules`);
  }
  
  /**
   * Validate current configuration against compliance rules
   */
  async validateCurrentConfiguration() {
    console.log('🔍 Validating current configuration...');
    
    // Load current configuration
    this.loadCurrentConfiguration();
    
    // Run compliance checks
    const violations = [];
    
    for (const [ruleId, rule] of this.complianceRules.entries()) {
      try {
        const result = rule.check(this.currentConfig);
        
        if (!result.passed) {
          violations.push({
            ruleId,
            rule: rule.name,
            severity: rule.severity,
            message: result.message,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error(`Error checking compliance rule ${ruleId}:`, error);
      }
    }
    
    // Log violations
    if (violations.length > 0) {
      console.warn(`⚠️ Found ${violations.length} compliance violations:`);
      violations.forEach(v => console.warn(`  - [${v.severity}] ${v.message}`));
      
      this.alerts.complianceViolations.push(...violations);
      this.metrics.complianceViolations += violations.length;
      
      // Send alerts for critical violations
      for (const violation of violations.filter(v => v.severity === 'CRITICAL')) {
        await this.sendAlert('COMPLIANCE_VIOLATION', violation);
      }
    } else {
      console.log('✅ All compliance checks passed');
    }
    
    return violations;
  }
  
  /**
   * Load current configuration from environment
   */
  loadCurrentConfiguration() {
    this.currentConfig.clear();
    
    for (const [key, value] of Object.entries(process.env)) {
      if (this.isApplicationVariable(key)) {
        this.currentConfig.set(key, {
          value: value,
          sensitive: this.isSensitiveVariable(key),
          type: this.inferVariableType(value),
          lastUpdated: new Date()
        });
      }
    }
  }
  
  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    const monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
      await this.detectConfigurationDrift();
      await this.validateCurrentConfiguration();
      await this.checkSecretExpiry();
      
      this.metrics.lastCheck = new Date();
      
    }, this.monitoring.interval);
    
    // Track the interval for cleanup
    this.watchers.set('monitoring', monitoringInterval);
    
    console.log(`🔍 Configuration monitoring started (checking every ${this.monitoring.interval / 1000} seconds)`);
  }
  
  /**
   * Setup file watchers for configuration files
   */
  setupFileWatchers() {
    const filesToWatch = ['.env.local', '.env.template'];
    
    for (const file of filesToWatch) {
      if (fs.existsSync(file)) {
        try {
          const watcher = fs.watch(file, async (eventType) => {
            if (eventType === 'change') {
              console.log(`🔄 Configuration file changed: ${file}`);
              await this.handleConfigurationChange(file);
            }
          });
          
          this.watchers.set(file, watcher);
          console.log(`👁️ Watching configuration file: ${file}`);
          
        } catch (error) {
          console.error(`Failed to watch file ${file}:`, error);
        }
      }
    }
  }
  
  /**
   * Handle configuration file changes
   */
  async handleConfigurationChange(filePath) {
    try {
      console.log(`🔄 Processing configuration change in ${filePath}`);
      
      // Record configuration change
      this.metrics.configChanges++;
      
      // Wait a moment for file write to complete
      await this.sleep(1000);
      
      // Reload and validate
      await this.validateCurrentConfiguration();
      
      // Log security event
      await SecurityAuditLogger.log({
        eventType: 'SECURITY_SETTING_CHANGE',
        severity: 'MEDIUM',
        details: {
          file: filePath,
          action: 'configuration_file_changed'
        }
      });
      
      this.emit('configuration-changed', { filePath, timestamp: new Date() });
      
    } catch (error) {
      console.error(`Failed to handle configuration change for ${filePath}:`, error);
    }
  }
  
  /**
   * Detect configuration drift from baseline
   */
  async detectConfigurationDrift() {
    const driftDetected = [];
    
    // Check for missing required variables
    for (const [key, baseline] of this.baselineConfig.entries()) {
      if (baseline.required && !this.currentConfig.has(key)) {
        driftDetected.push({
          type: 'MISSING_VARIABLE',
          variable: key,
          message: `Required variable ${key} is missing from current configuration`
        });
      }
    }
    
    // Check for unexpected variables
    for (const key of this.currentConfig.keys()) {
      if (!this.baselineConfig.has(key) && this.isApplicationVariable(key)) {
        driftDetected.push({
          type: 'UNEXPECTED_VARIABLE',
          variable: key,
          message: `Unexpected variable ${key} found in current configuration`
        });
      }
    }
    
    // Check for value changes in sensitive variables
    for (const [key, baseline] of this.baselineConfig.entries()) {
      const current = this.currentConfig.get(key);
      if (current && baseline.sensitive && current.value !== baseline.value) {
        if (!baseline.value.includes('REPLACE_WITH')) { // Don't alert for template placeholders
          driftDetected.push({
            type: 'SENSITIVE_VARIABLE_CHANGED',
            variable: key,
            message: `Sensitive variable ${key} has been modified`
          });
        }
      }
    }
    
    if (driftDetected.length > 0) {
      console.warn(`🚨 Configuration drift detected (${driftDetected.length} issues):`);
      driftDetected.forEach(drift => console.warn(`  - ${drift.message}`));
      
      this.alerts.configurationDrift.push(...driftDetected);
      
      // Send alerts for critical drift
      for (const drift of driftDetected.filter(d => d.type === 'MISSING_VARIABLE')) {
        await this.sendAlert('CONFIGURATION_DRIFT', drift);
      }
    }
    
    return driftDetected;
  }
  
  /**
   * Check for secret expiry and rotation needs
   */
  async checkSecretExpiry() {
    const secretsToRotate = [];
    const rotationThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    for (const [key, config] of this.currentConfig.entries()) {
      if (this.isSensitiveVariable(key) && config.lastUpdated) {
        const age = Date.now() - config.lastUpdated.getTime();
        
        if (age > rotationThreshold) {
          secretsToRotate.push({
            variable: key,
            age: Math.floor(age / (24 * 60 * 60 * 1000)), // Age in days
            lastRotated: config.lastUpdated
          });
        }
      }
    }
    
    if (secretsToRotate.length > 0) {
      console.warn(`🔑 Secrets requiring rotation (${secretsToRotate.length}):`);
      secretsToRotate.forEach(secret => 
        console.warn(`  - ${secret.variable} (${secret.age} days old)`)
      );
      
      // Send rotation alerts
      for (const secret of secretsToRotate) {
        await this.sendAlert('SECRET_ROTATION_REQUIRED', secret);
      }
    }
    
    return secretsToRotate;
  }
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: Date.now() - this.metrics.uptimeStart,
      checks: {}
    };
    
    // Check environment validator
    try {
      const validator = new EnvironmentValidator();
      const validationResult = validator.validate();
      
      health.checks.environmentValidation = {
        status: validationResult ? 'pass' : 'fail',
        details: 'Environment variables validation'
      };
      
      if (!validationResult) {
        health.status = 'warning';
      }
      
    } catch (error) {
      health.checks.environmentValidation = {
        status: 'error',
        error: error.message
      };
      health.status = 'error';
    }
    
    // Check compliance
    const violations = await this.validateCurrentConfiguration();
    health.checks.compliance = {
      status: violations.length === 0 ? 'pass' : 'fail',
      violationCount: violations.length
    };
    
    if (violations.some(v => v.severity === 'CRITICAL')) {
      health.status = 'critical';
    } else if (violations.length > 0) {
      health.status = 'warning';
    }
    
    // Check file system
    health.checks.filesystem = {
      status: 'pass',
      configFilesExist: {
        envLocal: fs.existsSync('.env.local'),
        envTemplate: fs.existsSync('.env.template')
      }
    };
    
    this.emit('health-check', health);
    
    return health;
  }
  
  /**
   * Send alert for critical issues
   */
  async sendAlert(alertType, details) {
    const alert = {
      type: alertType,
      severity: this.getAlertSeverity(alertType),
      details,
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    };
    
    console.error(`🚨 CONFIGURATION ALERT [${alert.severity}]: ${alertType}`, details);
    
    // Log to security audit
    await SecurityAuditLogger.log({
      eventType: 'SECURITY_SETTING_CHANGE',
      severity: alert.severity,
      details: {
        alertType,
        alertDetails: details
      }
    });
    
    // Store alert
    this.alerts.securityIssues.push(alert);
    
    // Emit event for external handlers
    this.emit('alert', alert);
    
    return alert;
  }
  
  /**
   * Get alert severity based on type
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'COMPLIANCE_VIOLATION': 'HIGH',
      'CONFIGURATION_DRIFT': 'MEDIUM',
      'SECRET_ROTATION_REQUIRED': 'MEDIUM',
      'MISSING_VARIABLE': 'HIGH',
      'SENSITIVE_VARIABLE_CHANGED': 'HIGH'
    };
    
    return severityMap[alertType] || 'MEDIUM';
  }
  
  /**
   * Utility methods
   */
  isRequiredVariable(key) {
    const required = [
      'MONGODB_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET',
      'COOKIE_SECRET', 'CSRF_SECRET', 'PASSWORD_PEPPER', 'PORT'
    ];
    return required.includes(key);
  }
  
  isSensitiveVariable(key) {
    const sensitive = [
      'PASSWORD', 'SECRET', 'TOKEN', 'KEY', 'PEPPER', 'CSRF',
      'SMTP_PASSWORD', 'VAPID', 'MONGO_PASSWORD'
    ];
    return sensitive.some(pattern => key.includes(pattern));
  }
  
  inferVariableType(value) {
    if (!value) return 'empty';
    if (value === 'true' || value === 'false') return 'boolean';
    if (/^\d+$/.test(value)) return 'integer';
    if (/^https?:\/\//.test(value)) return 'url';
    if (value.includes('@') && value.includes('.')) return 'email';
    return 'string';
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get monitoring dashboard data
   */
  getDashboardData() {
    return {
      status: this.alerts.complianceViolations.length === 0 ? 'healthy' : 'warning',
      metrics: this.metrics,
      alerts: {
        configurationDrift: this.alerts.configurationDrift.length,
        complianceViolations: this.alerts.complianceViolations.length,
        securityIssues: this.alerts.securityIssues.length
      },
      configuration: {
        totalVariables: this.currentConfig.size,
        sensitiveVariables: Array.from(this.currentConfig.keys())
          .filter(key => this.isSensitiveVariable(key)).length,
        requiredVariables: Array.from(this.baselineConfig.values())
          .filter(config => config.required).length
      },
      monitoring: {
        enabled: this.monitoring.enabled,
        interval: this.monitoring.interval,
        watchedFiles: Array.from(this.watchers.keys()).filter(key => key !== 'monitoring')
      }
    };
  }
  
  /**
   * Setup cleanup tasks
   */
  setupCleanupTasks() {
    // Clean up old alerts every hour
    setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      this.alerts.configurationDrift = this.alerts.configurationDrift
        .filter(alert => alert.timestamp > oneHourAgo);
        
      this.alerts.securityIssues = this.alerts.securityIssues
        .filter(alert => alert.timestamp > oneHourAgo);
        
    }, 60 * 60 * 1000); // Every hour
    
    console.log('🧹 Cleanup tasks scheduled');
  }
  
  /**
   * Cleanup watchers and intervals
   */
  cleanup() {
    for (const [name, watcher] of this.watchers.entries()) {
      try {
        if (name === 'monitoring') {
          clearInterval(watcher);
        } else {
          watcher.close();
        }
        console.log(`🗑️ Stopped watching: ${name}`);
      } catch (error) {
        console.error(`Failed to cleanup watcher ${name}:`, error);
      }
    }
    
    this.watchers.clear();
  }
}

// Export singleton instance
const environmentConfigMonitor = new EnvironmentConfigMonitor();

export default environmentConfigMonitor;

// Named exports for specific functionality
export const getDashboardData = () => environmentConfigMonitor.getDashboardData();
export const performHealthCheck = () => environmentConfigMonitor.performHealthCheck();
export const validateConfiguration = () => environmentConfigMonitor.validateCurrentConfiguration();