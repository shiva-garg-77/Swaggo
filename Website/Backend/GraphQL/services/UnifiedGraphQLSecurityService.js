/**
 * @fileoverview Unified GraphQL Security Service
 * @module UnifiedGraphQLSecurityService
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Centralized security service for all GraphQL operations.
 * Consolidates multiple security modules into a single, consistent implementation.
 * Handles:
 * - Query depth limiting
 * - Query complexity analysis
 * - Rate limiting
 * - Input validation and sanitization
 * - Activity monitoring
 * - Threat detection
 */

import depthLimit from 'graphql-depth-limit';
import { createComplexityRule, simpleEstimator } from 'graphql-query-complexity';
import winston from 'winston';
import UnifiedGraphQLErrorHandler from '../../utils/UnifiedGraphQLErrorHandler.js';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'graphql-security' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Unified GraphQL Security Service
 */
class UnifiedGraphQLSecurityService {
  constructor() {
    this.activityLog = [];
    this.threatLog = [];
    this.maxActivityLogSize = 10000;
    this.maxThreatLogSize = 1000;
    
    logger.info('✅ Unified GraphQL Security Service initialized');
  }

  /**
   * Create depth limit validation rule
   * @param {number} maxDepth - Maximum query depth
   * @returns {Function} Validation rule
   */
  createDepthLimitRule(maxDepth = 15) {
    try {
      logger.info('Creating depth limit rule', { maxDepth });
      return depthLimit(maxDepth);
    } catch (error) {
      logger.error('Error creating depth limit rule', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create complexity limit validation rule
   * @param {number} maxComplexity - Maximum query complexity
   * @returns {Function} Validation rule
   */
  createComplexityLimitRule(maxComplexity = 500) {
    try {
      logger.info('Creating complexity limit rule', { maxComplexity });
      return createComplexityRule({
        maximumComplexity: maxComplexity,
        estimators: [simpleEstimator()]
      });
    } catch (error) {
      logger.error('Error creating complexity limit rule', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get all validation rules for GraphQL
   * @param {object} options - Configuration options
   * @returns {Array} Array of validation rules
   */
  getValidationRules(options = {}) {
    const {
      maxDepth = 15,
      maxComplexity = 500,
      includeDepthLimit = true,
      includeComplexityLimit = true
    } = options;

    const rules = [];

    if (includeDepthLimit) {
      rules.push(this.createDepthLimitRule(maxDepth));
    }

    if (includeComplexityLimit) {
      rules.push(this.createComplexityLimitRule(maxComplexity));
    }

    logger.info('Validation rules created', { count: rules.length });
    return rules;
  }

  /**
   * Validate and sanitize GraphQL arguments
   * @param {object} args - Arguments to validate
   * @returns {object} Validated and sanitized arguments
   */
  validateAndSanitizeArgs(args) {
    return UnifiedGraphQLErrorHandler.sanitizeArgs(args);
  }

  /**
   * Monitor GraphQL activity
   * @param {string} operationType - Type of operation (query/mutation/subscription)
   * @param {object} context - GraphQL context
   * @param {object} args - Operation arguments
   */
  monitorActivity(operationType, context, args) {
    const activity = {
      timestamp: new Date().toISOString(),
      operationType,
      userId: context.user?.id || 'anonymous',
      username: context.user?.username || 'anonymous',
      ip: context.authContext?.ipAddress || 'unknown',
      userAgent: context.authContext?.userAgent || 'unknown',
      argsPreview: JSON.stringify(args).substring(0, 100)
    };

    this.activityLog.push(activity);

    // Maintain log size
    if (this.activityLog.length > this.maxActivityLogSize) {
      this.activityLog = this.activityLog.slice(-this.maxActivityLogSize);
    }

    logger.debug('GraphQL activity monitored', activity);
  }

  /**
   * Detect potential threats
   * @param {object} context - GraphQL context
   * @param {object} args - Operation arguments
   * @returns {Array} Array of detected threats
   */
  detectThreats(context, args) {
    const threats = [];

    // Check for SQL injection patterns
    if (this.containsSQLInjectionPattern(args)) {
      threats.push({
        type: 'SQL_INJECTION_ATTEMPT',
        severity: 'HIGH',
        timestamp: new Date().toISOString()
      });
    }

    // Check for NoSQL injection patterns
    if (this.containsNoSQLInjectionPattern(args)) {
      threats.push({
        type: 'NOSQL_INJECTION_ATTEMPT',
        severity: 'HIGH',
        timestamp: new Date().toISOString()
      });
    }

    // Check for XSS patterns
    if (this.containsXSSPattern(args)) {
      threats.push({
        type: 'XSS_ATTEMPT',
        severity: 'MEDIUM',
        timestamp: new Date().toISOString()
      });
    }

    // Log threats
    if (threats.length > 0) {
      threats.forEach(threat => {
        this.threatLog.push({
          ...threat,
          userId: context.user?.id || 'anonymous',
          ip: context.authContext?.ipAddress || 'unknown'
        });

        logger.warn('Security threat detected', {
          ...threat,
          userId: context.user?.id,
          ip: context.authContext?.ipAddress
        });
      });

      // Maintain threat log size
      if (this.threatLog.length > this.maxThreatLogSize) {
        this.threatLog = this.threatLog.slice(-this.maxThreatLogSize);
      }
    }

    return threats;
  }

  /**
   * Check for SQL injection patterns
   * @param {object} args - Arguments to check
   * @returns {boolean} True if SQL injection pattern detected
   */
  containsSQLInjectionPattern(args) {
    const sqlPatterns = [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(-{2}|\/\*|\*\/|;)/,
      /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1)/i
    ];

    const argsStr = JSON.stringify(args).toLowerCase();
    return sqlPatterns.some(pattern => pattern.test(argsStr));
  }

  /**
   * Check for NoSQL injection patterns
   * @param {object} args - Arguments to check
   * @returns {boolean} True if NoSQL injection pattern detected
   */
  containsNoSQLInjectionPattern(args) {
    const noSqlPatterns = [
      /(\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and)/i,
      /({.*:.*{.*}.*})/
    ];

    const argsStr = JSON.stringify(args);
    return noSqlPatterns.some(pattern => pattern.test(argsStr));
  }

  /**
   * Check for XSS patterns
   * @param {object} args - Arguments to check
   * @returns {boolean} True if XSS pattern detected
   */
  containsXSSPattern(args) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    const argsStr = JSON.stringify(args);
    return xssPatterns.some(pattern => pattern.test(argsStr));
  }

  /**
   * Get activity log
   * @param {object} options - Filter options
   * @returns {Array} Activity log entries
   */
  getActivityLog(options = {}) {
    const { limit = 100, userId = null, operationType = null } = options;

    let log = this.activityLog;

    if (userId) {
      log = log.filter(entry => entry.userId === userId);
    }

    if (operationType) {
      log = log.filter(entry => entry.operationType === operationType);
    }

    return log.slice(-limit);
  }

  /**
   * Get threat log
   * @param {object} options - Filter options
   * @returns {Array} Threat log entries
   */
  getThreatLog(options = {}) {
    const { limit = 100, severity = null } = options;

    let log = this.threatLog;

    if (severity) {
      log = log.filter(entry => entry.severity === severity);
    }

    return log.slice(-limit);
  }

  /**
   * Clear activity log
   */
  clearActivityLog() {
    this.activityLog = [];
    logger.info('Activity log cleared');
  }

  /**
   * Clear threat log
   */
  clearThreatLog() {
    this.threatLog = [];
    logger.info('Threat log cleared');
  }

  /**
   * Get security statistics
   * @returns {object} Security statistics
   */
  getStats() {
    return {
      activityLogSize: this.activityLog.length,
      threatLogSize: this.threatLog.length,
      recentThreats: this.threatLog.slice(-10),
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
const unifiedGraphQLSecurityService = new UnifiedGraphQLSecurityService();

export default unifiedGraphQLSecurityService;
