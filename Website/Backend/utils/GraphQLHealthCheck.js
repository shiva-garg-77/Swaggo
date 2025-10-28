/**
 * @fileoverview GraphQL Health Check and Verification
 * @module GraphQLHealthCheck
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Comprehensive health check and verification for GraphQL setup.
 * Ensures all GraphQL instances are properly initialized and compatible.
 */

import graphqlInstance from './GraphQLInstance.js';
import UnifiedGraphQLErrorHandler from './UnifiedGraphQLErrorHandler.js';
import unifiedGraphQLSecurityService from '../GraphQL/services/UnifiedGraphQLSecurityService.js';
import winston from 'winston';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'graphql-health-check' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * GraphQL Health Check Service
 */
class GraphQLHealthCheck {
  /**
   * Run comprehensive health check
   * @returns {object} Health check results
   */
  static async runHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      checks: {},
      status: 'HEALTHY',
      issues: []
    };

    try {
      // Check 1: GraphQL Instance
      results.checks.graphqlInstance = this.checkGraphQLInstance();
      if (!results.checks.graphqlInstance.passed) {
        results.issues.push('GraphQL Instance check failed');
        results.status = 'UNHEALTHY';
      }

      // Check 2: GraphQL Exports
      results.checks.graphqlExports = this.checkGraphQLExports();
      if (!results.checks.graphqlExports.passed) {
        results.issues.push('GraphQL Exports check failed');
        results.status = 'UNHEALTHY';
      }

      // Check 3: Error Handler
      results.checks.errorHandler = this.checkErrorHandler();
      if (!results.checks.errorHandler.passed) {
        results.issues.push('Error Handler check failed');
        results.status = 'DEGRADED';
      }

      // Check 4: Security Service
      results.checks.securityService = this.checkSecurityService();
      if (!results.checks.securityService.passed) {
        results.issues.push('Security Service check failed');
        results.status = 'DEGRADED';
      }

      // Check 5: Scalar Types
      results.checks.scalarTypes = this.checkScalarTypes();
      if (!results.checks.scalarTypes.passed) {
        results.issues.push('Scalar Types check failed');
        results.status = 'DEGRADED';
      }

      // Check 6: Realm Isolation
      results.checks.realmIsolation = this.checkRealmIsolation();
      if (!results.checks.realmIsolation.passed) {
        results.issues.push('Realm Isolation check failed');
        results.status = 'UNHEALTHY';
      }

      logger.info('✅ GraphQL Health Check Completed', {
        status: results.status,
        issueCount: results.issues.length
      });

      return results;
    } catch (error) {
      logger.error('❌ GraphQL Health Check Failed', {
        error: error.message,
        stack: error.stack
      });

      results.status = 'UNHEALTHY';
      results.issues.push(`Health check error: ${error.message}`);
      return results;
    }
  }

  /**
   * Check GraphQL Instance
   * @returns {object} Check result
   */
  static checkGraphQLInstance() {
    try {
      const instance = graphqlInstance.getInstance();
      const isValid = graphqlInstance.isValid();

      return {
        passed: !!instance && isValid,
        details: {
          instanceExists: !!instance,
          isValid,
          initialized: graphqlInstance.initialized,
          initializationTime: graphqlInstance.initializationTime
        }
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Check GraphQL Exports
   * @returns {object} Check result
   */
  static checkGraphQLExports() {
    try {
      const requiredExports = [
        'GraphQLScalarType',
        'GraphQLError',
        'GraphQLObjectType',
        'GraphQLSchema',
        'Kind',
        'validateSchema',
        'parse',
        'print',
        'execute'
      ];

      const instance = graphqlInstance.getInstance();
      const missing = [];

      for (const exportName of requiredExports) {
        if (!instance[exportName]) {
          missing.push(exportName);
        }
      }

      return {
        passed: missing.length === 0,
        details: {
          totalExports: Object.keys(instance).length,
          requiredExports: requiredExports.length,
          missingExports: missing
        }
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Check Error Handler
   * @returns {object} Check result
   */
  static checkErrorHandler() {
    try {
      const methods = [
        'createError',
        'authenticationError',
        'authorizationError',
        'validationError',
        'databaseError',
        'formatErrorForClient',
        'logError',
        'sanitizeArgs'
      ];

      const missing = [];

      for (const method of methods) {
        if (typeof UnifiedGraphQLErrorHandler[method] !== 'function') {
          missing.push(method);
        }
      }

      return {
        passed: missing.length === 0,
        details: {
          totalMethods: methods.length,
          missingMethods: missing
        }
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Check Security Service
   * @returns {object} Check result
   */
  static checkSecurityService() {
    try {
      const methods = [
        'createDepthLimitRule',
        'createComplexityLimitRule',
        'getValidationRules',
        'validateAndSanitizeArgs',
        'monitorActivity',
        'detectThreats',
        'getActivityLog',
        'getThreatLog',
        'getStats'
      ];

      const missing = [];

      for (const method of methods) {
        if (typeof unifiedGraphQLSecurityService[method] !== 'function') {
          missing.push(method);
        }
      }

      return {
        passed: missing.length === 0,
        details: {
          totalMethods: methods.length,
          missingMethods: missing,
          stats: unifiedGraphQLSecurityService.getStats()
        }
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Check Scalar Types
   * @returns {object} Check result
   */
  static checkScalarTypes() {
    try {
      const { GraphQLScalarType, Kind } = graphqlInstance;

      // Try to create a test scalar
      const testScalar = new GraphQLScalarType({
        name: 'TestScalar',
        serialize: (value) => value,
        parseValue: (value) => value,
        parseLiteral: (ast) => ast.value
      });

      return {
        passed: !!testScalar && testScalar.name === 'TestScalar',
        details: {
          scalarCreated: !!testScalar,
          scalarName: testScalar?.name,
          hasKind: !!Kind
        }
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Check Realm Isolation
   * @returns {object} Check result
   */
  static checkRealmIsolation() {
    try {
      const { GraphQLScalarType, Kind } = graphqlInstance;

      // Create two scalars and verify they're from the same realm
      const scalar1 = new GraphQLScalarType({
        name: 'Scalar1',
        serialize: (v) => v,
        parseValue: (v) => v,
        parseLiteral: (ast) => ast.value
      });

      const scalar2 = new GraphQLScalarType({
        name: 'Scalar2',
        serialize: (v) => v,
        parseValue: (v) => v,
        parseLiteral: (ast) => ast.value
      });

      // Both should be instances of the same GraphQLScalarType
      const sameRealm = scalar1 instanceof GraphQLScalarType && scalar2 instanceof GraphQLScalarType;

      return {
        passed: sameRealm,
        details: {
          scalar1IsInstance: scalar1 instanceof GraphQLScalarType,
          scalar2IsInstance: scalar2 instanceof GraphQLScalarType,
          sameRealm
        }
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Get health check summary
   * @returns {string} Summary text
   */
  static async getHealthSummary() {
    const results = await this.runHealthCheck();
    const passedChecks = Object.values(results.checks).filter(c => c.passed).length;
    const totalChecks = Object.keys(results.checks).length;

    return `
GraphQL Health Check Summary
============================
Status: ${results.status}
Passed: ${passedChecks}/${totalChecks}
Timestamp: ${results.timestamp}

${results.issues.length > 0 ? `Issues:\n${results.issues.map(i => `  - ${i}`).join('\n')}\n` : 'No issues detected!\n'}

Detailed Results:
${Object.entries(results.checks)
  .map(([name, result]) => `  ${name}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`)
  .join('\n')}
    `;
  }
}

export default GraphQLHealthCheck;
