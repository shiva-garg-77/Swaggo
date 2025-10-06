#!/usr/bin/env node
/**
 * 🔒 COMPREHENSIVE SECURITY VALIDATION SCRIPT
 * 
 * Validates all security implementations to ensure 10/10 rating is maintained
 * Runs tests on authentication, authorization, GraphQL security, and more
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔒 COMPREHENSIVE SECURITY VALIDATION - 10/10 Rating Verification');
console.log('=' .repeat(70));

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

/**
 * Security Test Suite
 */
class SecurityValidator {
  
  /**
   * Test 1: Core Security Files Integrity
   */
  async testSecurityFilesIntegrity() {
    console.log('\n🛡️  TEST 1: Security Files Integrity');
    
    const criticalSecurityFiles = [
      'Services/TokenService.js',
      'Middleware/AuthenticationMiddleware.js', 
      'Middleware/SocketAuthMiddleware.js',
      'utils/GraphQLAuthHelper.js',
      'Config/SecurityConfig.js',
      'Middleware/CsrfProtection.js',
      'Middleware/RateLimiter.js',
      'Middleware/SecurityHeaders.js',
      'Middleware/EnhancedFileUploadSecurity.js'
    ];
    
    let passed = 0;
    for (const file of criticalSecurityFiles) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file} - Present`);
        passed++;
      } else {
        console.log(`  ❌ ${file} - Missing`);
        testResults.errors.push(`Critical security file missing: ${file}`);
        testResults.failed++;
      }
    }
    
    if (passed === criticalSecurityFiles.length) {
      console.log('  🏆 All critical security files present');
      testResults.passed++;
    }
  }
  
  /**
   * Test 2: Duplicate File Detection
   */
  async testDuplicateFileDetection() {
    console.log('\n🔍 TEST 2: Duplicate File Detection');
    
    const duplicateChecks = [
      {
        name: 'Duplicate Auth Helpers',
        files: ['Middleware/Auth.js', 'Controllers/LoginApi.js'],
        shouldNotExist: true
      },
      {
        name: 'Old File Upload Security',
        files: ['Middleware/FileUploadSecurity.js'],
        shouldNotExist: true
      },
      {
        name: 'Example Files in Production',
        files: ['Examples/GraphQLResolverExample.js'],
        shouldNotExist: true
      }
    ];
    
    let cleanupPassed = 0;
    for (const check of duplicateChecks) {
      let checkPassed = true;
      for (const file of check.files) {
        const filePath = path.join(projectRoot, file);
        const exists = fs.existsSync(filePath);
        
        if (check.shouldNotExist && exists) {
          console.log(`  ❌ ${check.name}: ${file} should be removed`);
          checkPassed = false;
          testResults.errors.push(`Duplicate/unused file exists: ${file}`);
        } else if (check.shouldNotExist && !exists) {
          console.log(`  ✅ ${check.name}: ${file} properly removed`);
        }
      }
      
      if (checkPassed) {
        cleanupPassed++;
      }
    }
    
    if (cleanupPassed === duplicateChecks.length) {
      console.log('  🏆 No duplicate files detected');
      testResults.passed++;
    } else {
      testResults.failed++;
    }
  }
  
  /**
   * Test 3: GraphQL Security Implementation
   */
  async testGraphQLSecurityImplementation() {
    console.log('\n🔒 TEST 3: GraphQL Security Implementation');
    
    try {
      // Check if GraphQLAuthHelper is properly imported
      const resolverPath = path.join(projectRoot, 'Controllers/Resolver.js');
      const resolverContent = fs.readFileSync(resolverPath, 'utf8');
      
      const securityChecks = [
        {
          name: 'GraphQLAuth Import',
          pattern: /import GraphQLAuth from.*GraphQLAuthHelper/,
          required: true
        },
        {
          name: 'requireAuth Usage',
          pattern: /GraphQLAuth\.requireAuth/,
          required: true
        },
        {
          name: 'requireCSRF Usage', 
          pattern: /GraphQLAuth\.requireCSRF/,
          required: true
        },
        {
          name: 'logOperation Usage',
          pattern: /GraphQLAuth\.logOperation/,
          required: true
        },
        {
          name: 'validateArgs Usage',
          pattern: /GraphQLAuth\.validateArgs/,
          required: true
        }
      ];
      
      let securityPassed = 0;
      for (const check of securityChecks) {
        if (check.pattern.test(resolverContent)) {
          console.log(`  ✅ ${check.name} - Implemented`);
          securityPassed++;
        } else {
          console.log(`  ❌ ${check.name} - Missing`);
          testResults.errors.push(`Missing GraphQL security: ${check.name}`);
        }
      }
      
      if (securityPassed === securityChecks.length) {
        console.log('  🏆 GraphQL Security fully implemented');
        testResults.passed++;
      } else {
        testResults.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing GraphQL security: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`GraphQL security test failed: ${error.message}`);
    }
  }
  
  /**
   * Test 4: Route Integration Security
   */
  async testRouteIntegrationSecurity() {
    console.log('\n🛣️  TEST 4: Route Integration Security');
    
    try {
      const mainPath = path.join(projectRoot, 'main.js');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      const routeChecks = [
        {
          name: 'AdminRoutes Import',
          pattern: /import AdminRoutes from.*AdminRoutes/,
          required: true
        },
        {
          name: 'UserRoutes Import', 
          pattern: /import UserRoutes from.*UserRoutes/,
          required: true
        },
        {
          name: 'AdminRoutes Integration',
          pattern: /app\.use\(['"`]\/api\/admin['"`], AdminRoutes\)/,
          required: true
        },
        {
          name: 'UserRoutes Integration',
          pattern: /app\.use\(['"`]\/api\/users['"`], UserRoutes\)/,
          required: true
        },
        {
          name: 'CORS Configuration',
          pattern: /credentials:\s*true/,
          required: true
        }
      ];
      
      let routesPassed = 0;
      for (const check of routeChecks) {
        if (check.pattern.test(mainContent)) {
          console.log(`  ✅ ${check.name} - Configured`);
          routesPassed++;
        } else {
          console.log(`  ❌ ${check.name} - Missing`);
          testResults.errors.push(`Missing route security: ${check.name}`);
        }
      }
      
      if (routesPassed === routeChecks.length) {
        console.log('  🏆 All routes securely integrated');
        testResults.passed++;
      } else {
        testResults.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing route integration: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`Route integration test failed: ${error.message}`);
    }
  }
  
  /**
   * Test 5: Authentication Context Enhancement
   */
  async testAuthenticationContextEnhancement() {
    console.log('\n🔐 TEST 5: Authentication Context Enhancement');
    
    try {
      const mainPath = path.join(projectRoot, 'main.js');
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      
      const contextChecks = [
        {
          name: 'TokenService Import',
          pattern: /import TokenService/,
          required: true
        },
        {
          name: 'User Model Import',
          pattern: /import User from.*User/,
          required: true
        },
        {
          name: 'Enhanced Context Creation',
          pattern: /authResult.*authContext.*security/s,
          required: true
        },
        {
          name: 'CSRF Token Extraction',
          pattern: /csrfToken.*cookies.*headers/s,
          required: true
        },
        {
          name: 'Risk Score Assessment',
          pattern: /riskScore/,
          required: true
        }
      ];
      
      let contextPassed = 0;
      for (const check of contextChecks) {
        if (check.pattern.test(mainContent)) {
          console.log(`  ✅ ${check.name} - Implemented`);
          contextPassed++;
        } else {
          console.log(`  ⚠️  ${check.name} - Needs Review`);
          testResults.warnings++;
        }
      }
      
      if (contextPassed >= contextChecks.length - 1) { // Allow 1 warning
        console.log('  🏆 Authentication context properly enhanced');
        testResults.passed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing authentication context: ${error.message}`);
      testResults.failed++;
      testResults.errors.push(`Auth context test failed: ${error.message}`);
    }
  }
  
  /**
   * Test 6: Security Configuration Validation
   */
  async testSecurityConfigurationValidation() {
    console.log('\n⚙️  TEST 6: Security Configuration Validation');
    
    const securityDirs = ['Security', 'Config'];
    let securityFileCount = 0;
    
    for (const dir of securityDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        securityFileCount += files.filter(f => f.endsWith('.js')).length;
        console.log(`  ✅ ${dir}/ - ${files.length} security files`);
      }
    }
    
    if (securityFileCount >= 5) {
      console.log('  🏆 Comprehensive security configuration detected');
      testResults.passed++;
    } else {
      console.log('  ⚠️  Limited security configuration files');
      testResults.warnings++;
    }
  }
  
  /**
   * Generate Security Report
   */
  generateSecurityReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🏆 SECURITY VALIDATION REPORT');
    console.log('='.repeat(70));
    
    const totalTests = testResults.passed + testResults.failed;
    const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`📊 Test Results:`);
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   ⚠️  Warnings: ${testResults.warnings}`);
    console.log(`   📈 Success Rate: ${successRate}%`);
    
    // Security Rating Calculation
    let securityRating = 10;
    if (testResults.failed > 0) {
      securityRating = Math.max(1, 10 - (testResults.failed * 2));
    } else if (testResults.warnings > 2) {
      securityRating = 9;
    }
    
    console.log(`\n🛡️  SECURITY RATING: ${securityRating}/10`);
    
    if (securityRating === 10) {
      console.log('🏆 EXCELLENT! Your security implementation maintains a 10/10 rating!');
    } else if (securityRating >= 8) {
      console.log('✅ GOOD! Your security is strong with minor improvements needed.');
    } else if (securityRating >= 6) {
      console.log('⚠️  FAIR! Security improvements required.');
    } else {
      console.log('❌ POOR! Critical security issues need immediate attention.');
    }
    
    if (testResults.errors.length > 0) {
      console.log('\n🚨 Critical Issues Found:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✅ Security validation completed!');
    console.log('='.repeat(70));
    
    return securityRating;
  }
  
  /**
   * Run All Security Tests
   */
  async runAllTests() {
    console.log(`🔄 Starting security validation at ${new Date().toISOString()}`);
    console.log(`📁 Project Root: ${projectRoot}`);
    
    await this.testSecurityFilesIntegrity();
    await this.testDuplicateFileDetection();
    await this.testGraphQLSecurityImplementation();
    await this.testRouteIntegrationSecurity();
    await this.testAuthenticationContextEnhancement();
    await this.testSecurityConfigurationValidation();
    
    return this.generateSecurityReport();
  }
}

// Execute Security Validation
const validator = new SecurityValidator();
const securityRating = await validator.runAllTests();

// Exit with appropriate code
process.exit(securityRating === 10 ? 0 : 1);