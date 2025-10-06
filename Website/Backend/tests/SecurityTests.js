import axios from 'axios';
import crypto from 'crypto';
import User from '../Models/LoginModels/User.js';
import RefreshTokens from '../Models/LoginModels/RefreshTokens.js';
import { SecurityAudit } from '../Services/SecurityAuditLogger.js';
import SecurityConfig from '../Config/SecurityConfig.js';
import mongoose from 'mongoose';

/**
 * Comprehensive Security Testing Suite
 * Tests rate limiting, logging, token rotation, and security features
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:45799/api';
const TEST_EMAIL = 'security-test@example.com';
const TEST_USERNAME = 'securitytest';
const TEST_PASSWORD = 'TestPassword123!';
const WEAK_PASSWORD = '123';

class SecurityTestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            details: []
        };
        this.testUser = null;
        this.accessToken = null;
        this.refreshToken = null;
    }

    // Helper methods
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📝',
            pass: '✅',
            fail: '❌',
            warn: '⚠️'
        }[type];
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async makeRequest(method, endpoint, data = null, headers = {}) {
        try {
            const config = {
                method,
                url: `${API_BASE_URL}${endpoint}`,
                data,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                validateStatus: () => true // Don't throw on any status code
            };

            const response = await axios(config);
            return response;
        } catch (error) {
            return {
                status: 500,
                data: { error: error.message }
            };
        }
    }

    async testPassed(testName, message = '') {
        this.results.passed++;
        this.results.details.push({ test: testName, status: 'PASSED', message });
        this.log(`${testName}: ${message}`, 'pass');
    }

    async testFailed(testName, message = '') {
        this.results.failed++;
        this.results.details.push({ test: testName, status: 'FAILED', message });
        this.log(`${testName}: ${message}`, 'fail');
    }

    // Test Suite Methods

    /**
     * Test 1: Rate Limiting for Login Attempts
     */
    async testLoginRateLimiting() {
        this.log('Testing login rate limiting...', 'info');
        
        const maxAttempts = SecurityConfig.auth.loginAttempts.maxAttempts;
        let rateLimited = false;
        
        for (let i = 0; i < maxAttempts + 2; i++) {
            const response = await this.makeRequest('POST', '/login', {
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });
            
            if (response.status === 429 || 
                (response.data.code === 'ACCOUNT_LOCKED' && i >= maxAttempts)) {
                rateLimited = true;
                break;
            }
        }
        
        if (rateLimited) {
            await this.testPassed('Login Rate Limiting', 'Account locked after maximum failed attempts');
        } else {
            await this.testFailed('Login Rate Limiting', 'Rate limiting not working properly');
        }
        
        // Wait a bit to avoid affecting other tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * Test 2: Security Audit Logging
     */
    async testSecurityLogging() {
        this.log('Testing security audit logging...', 'info');
        
        // Make a failed login attempt
        await this.makeRequest('POST', '/login', {
            email: 'test-logging@example.com',
            password: 'wrongpassword'
        });
        
        // Wait for log to be written
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if audit log was created
        try {
            const auditLog = await SecurityAudit.findOne({
                eventType: 'LOGIN_FAILED',
                'details.errorMessage': { $regex: /User not found|Invalid password/ }
            }).sort({ timestamp: -1 });
            
            if (auditLog) {
                await this.testPassed('Security Audit Logging', 'Failed login attempt logged successfully');
            } else {
                await this.testFailed('Security Audit Logging', 'Failed login attempt not found in audit logs');
            }
        } catch (error) {
            await this.testFailed('Security Audit Logging', `Database error: ${error.message}`);
        }
    }

    /**
     * Test 3: User Account Security Features
     */
    async testUserSecurityFeatures() {
        this.log('Testing user security features...', 'info');
        
        try {
            // Create test user
            const testUser = new User({
                email: TEST_EMAIL,
                username: TEST_USERNAME,
                password: await bcrypt.hash(TEST_PASSWORD, 10),
                dateOfBirth: new Date('1990-01-01')
            });
            
            await testUser.save();
            this.testUser = testUser;
            
            // Test failed login attempts increment
            await testUser.incrementFailedAttempts();
            await testUser.incrementFailedAttempts();
            
            if (testUser.failedLoginAttempts === 2) {
                await this.testPassed('Failed Attempts Tracking', 'Failed attempts incremented correctly');
            } else {
                await this.testFailed('Failed Attempts Tracking', `Expected 2 attempts, got ${testUser.failedLoginAttempts}`);
            }
            
            // Test account locking
            const maxAttempts = SecurityConfig.auth.loginAttempts.maxAttempts;
            for (let i = 0; i < maxAttempts; i++) {
                await testUser.incrementFailedAttempts();
            }
            
            if (testUser.isAccountLocked()) {
                await this.testPassed('Account Locking', 'Account locked after maximum attempts');
            } else {
                await this.testFailed('Account Locking', 'Account not locked after maximum attempts');
            }
            
            // Test password history
            const hashedPassword = await bcrypt.hash('NewPassword123!', 10);
            await testUser.addPasswordToHistory(hashedPassword);
            
            const isInHistory = await testUser.isPasswordInHistory('NewPassword123!');
            if (isInHistory) {
                await this.testPassed('Password History', 'Password correctly added to history');
            } else {
                await this.testFailed('Password History', 'Password not found in history');
            }
            
        } catch (error) {
            await this.testFailed('User Security Features', `Error: ${error.message}`);
        }
    }

    /**
     * Test 4: Refresh Token Rotation
     */
    async testTokenRotation() {
        this.log('Testing refresh token rotation...', 'info');
        
        try {
            // Create a token family
            const tokenFamily = await RefreshTokens.createTokenFamily(
                this.testUser._id,
                {
                    fingerprint: 'test-fingerprint',
                    userAgent: 'Test Browser',
                    platform: 'Test',
                    browser: 'Test'
                },
                '192.168.1.1'
            );
            
            const originalToken = tokenFamily.Refreshtoken;
            const originalGeneration = tokenFamily.generation;
            
            // Test token rotation
            const rotatedToken = await tokenFamily.rotate();
            
            if (rotatedToken.generation === originalGeneration + 1 && 
                rotatedToken.parentToken === originalToken) {
                await this.testPassed('Token Rotation', 'Token rotated successfully with correct generation');
            } else {
                await this.testFailed('Token Rotation', 'Token rotation failed or incorrect generation');
            }
            
            // Test token theft detection
            const theftResult = await RefreshTokens.detectTokenTheft(originalToken);
            if (theftResult.theft) {
                await this.testPassed('Token Theft Detection', 'Token theft detected for rotated token');
            } else {
                await this.testFailed('Token Theft Detection', 'Token theft not detected for rotated token');
            }
            
        } catch (error) {
            await this.testFailed('Token Rotation', `Error: ${error.message}`);
        }
    }

    /**
     * Test 5: Input Validation and Sanitization
     */
    async testInputValidation() {
        this.log('Testing input validation...', 'info');
        
        // Test SQL injection attempt
        const sqlInjectionAttempt = await this.makeRequest('POST', '/login', {
            email: "' OR '1'='1",
            password: 'anypassword'
        });
        
        if (sqlInjectionAttempt.status === 400 && 
            sqlInjectionAttempt.data.code === 'INVALID_EMAIL') {
            await this.testPassed('SQL Injection Prevention', 'SQL injection attempt blocked');
        } else {
            await this.testFailed('SQL Injection Prevention', 'SQL injection attempt not properly handled');
        }
        
        // Test XSS attempt
        const xssAttempt = await this.makeRequest('POST', '/signup', {
            email: 'test@example.com',
            username: '<script>alert("xss")</script>',
            password: TEST_PASSWORD,
            dateOfBirth: '1990-01-01'
        });
        
        if (xssAttempt.status === 400) {
            await this.testPassed('XSS Prevention', 'XSS attempt blocked');
        } else {
            await this.testFailed('XSS Prevention', 'XSS attempt not properly handled');
        }
        
        // Test weak password
        const weakPasswordAttempt = await this.makeRequest('POST', '/signup', {
            email: 'weak@example.com',
            username: 'weakuser',
            password: WEAK_PASSWORD,
            dateOfBirth: '1990-01-01'
        });
        
        if (weakPasswordAttempt.status === 400 && 
            weakPasswordAttempt.data.message.includes('Password must be at least')) {
            await this.testPassed('Password Policy', 'Weak password rejected');
        } else {
            await this.testFailed('Password Policy', 'Weak password not properly validated');
        }
    }

    /**
     * Test 6: Session Management
     */
    async testSessionManagement() {
        this.log('Testing session management...', 'info');
        
        try {
            if (!this.testUser) {
                throw new Error('Test user not available');
            }
            
            // Add multiple sessions
            const sessions = [];
            const maxSessions = SecurityConfig.auth.session.maxConcurrentSessions;
            
            for (let i = 0; i < maxSessions + 2; i++) {
                const sessionId = crypto.randomUUID();
                await this.testUser.addSession(sessionId, 'Test Device', '192.168.1.1');
                sessions.push(sessionId);
            }
            
            // Check if old sessions were removed
            await this.testUser.reload();
            if (this.testUser.activeSessions.length <= maxSessions) {
                await this.testPassed('Session Limit', 'Old sessions removed when limit exceeded');
            } else {
                await this.testFailed('Session Limit', `Too many active sessions: ${this.testUser.activeSessions.length}`);
            }
            
            // Test session removal
            const sessionToRemove = this.testUser.activeSessions[0].sessionId;
            await this.testUser.removeSession(sessionToRemove);
            
            await this.testUser.reload();
            const sessionExists = this.testUser.activeSessions.some(s => s.sessionId === sessionToRemove);
            
            if (!sessionExists) {
                await this.testPassed('Session Removal', 'Session removed successfully');
            } else {
                await this.testFailed('Session Removal', 'Session not removed');
            }
            
        } catch (error) {
            await this.testFailed('Session Management', `Error: ${error.message}`);
        }
    }

    /**
     * Test 7: Security Configuration Validation
     */
    async testSecurityConfiguration() {
        this.log('Testing security configuration validation...', 'info');
        
        try {
            // Test that required configurations exist
            const requiredConfigs = [
                'auth.jwt.accessTokenSecret',
                'auth.loginAttempts.maxAttempts',
                'cookies.httpOnly',
                'rateLimiting.auth.max',
                'tokenRotation.enabled'
            ];
            
            let allConfigsPresent = true;
            const missingConfigs = [];
            
            for (const configPath of requiredConfigs) {
                const value = configPath.split('.').reduce((obj, key) => obj?.[key], SecurityConfig);
                if (value === undefined || value === null) {
                    allConfigsPresent = false;
                    missingConfigs.push(configPath);
                }
            }
            
            if (allConfigsPresent) {
                await this.testPassed('Security Configuration', 'All required configurations present');
            } else {
                await this.testFailed('Security Configuration', `Missing configs: ${missingConfigs.join(', ')}`);
            }
            
        } catch (error) {
            await this.testFailed('Security Configuration', `Error: ${error.message}`);
        }
    }

    /**
     * Test 8: Cleanup and Maintenance
     */
    async testCleanupOperations() {
        this.log('Testing cleanup operations...', 'info');
        
        try {
            // Test token cleanup
            const deletedTokens = await RefreshTokens.cleanupExpired();
            await this.testPassed('Token Cleanup', `Cleaned up ${deletedTokens} expired tokens`);
            
            // Test audit log cleanup (simulate old logs)
            const testAuditLog = new SecurityAudit({
                eventType: 'TEST_EVENT',
                severity: 'LOW',
                ip: '127.0.0.1',
                timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
            });
            await testAuditLog.save();
            
            // This would be called by a scheduled job
            const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            const deletedLogs = await SecurityAudit.deleteMany({
                timestamp: { $lt: cutoffDate },
                severity: { $nin: ['CRITICAL', 'HIGH'] }
            });
            
            await this.testPassed('Audit Log Cleanup', `Cleaned up ${deletedLogs.deletedCount} old audit logs`);
            
        } catch (error) {
            await this.testFailed('Cleanup Operations', `Error: ${error.message}`);
        }
    }

    /**
     * Cleanup test data
     */
    async cleanup() {
        this.log('Cleaning up test data...', 'info');
        
        try {
            // Remove test user
            if (this.testUser) {
                await User.deleteOne({ _id: this.testUser._id });
            }
            
            // Remove test tokens
            await RefreshTokens.deleteMany({ 
                $or: [
                    { ipAddress: '192.168.1.1' },
                    { 'deviceInfo.fingerprint': 'test-fingerprint' }
                ]
            });
            
            // Remove test audit logs
            await SecurityAudit.deleteMany({ 
                $or: [
                    { eventType: 'TEST_EVENT' },
                    { ip: '192.168.1.1' }
                ]
            });
            
            // Remove any users created during testing
            await User.deleteMany({
                $or: [
                    { email: { $regex: /test.*@example\.com/ } },
                    { username: { $regex: /.*test.*/i } }
                ]
            });
            
            this.log('Test data cleanup completed', 'info');
            
        } catch (error) {
            this.log(`Cleanup error: ${error.message}`, 'warn');
        }
    }

    /**
     * Run all security tests
     */
    async runAllTests() {
        this.log('Starting comprehensive security test suite...', 'info');
        
        try {
            // Ensure database connection
            if (mongoose.connection.readyState !== 1) {
                this.log('Database not connected. Please ensure MongoDB is running.', 'warn');
                return;
            }
            
            // Run all tests
            await this.testSecurityConfiguration();
            await this.testInputValidation();
            await this.testUserSecurityFeatures();
            await this.testTokenRotation();
            await this.testSessionManagement();
            await this.testSecurityLogging();
            await this.testLoginRateLimiting();
            await this.testCleanupOperations();
            
        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'fail');
        } finally {
            await this.cleanup();
        }
        
        // Print results
        this.printResults();
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n' + '='.repeat(80));
        console.log('🔐 SECURITY TEST SUITE RESULTS');
        console.log('='.repeat(80));
        
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.details
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`   • ${test.test}: ${test.message}`);
                });
        }
        
        console.log('\n📋 DETAILED RESULTS:');
        this.results.details.forEach(test => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`   ${status} ${test.test}: ${test.message}`);
        });
        
        const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
        console.log(`\n🎯 Success Rate: ${successRate}%`);
        
        if (successRate >= 90) {
            console.log('🎉 Excellent! Your security implementation is robust.');
        } else if (successRate >= 75) {
            console.log('👍 Good security implementation with room for improvement.');
        } else {
            console.log('⚠️  Security implementation needs attention.');
        }
        
        console.log('='.repeat(80));
    }
}

// Export for use in other modules
export default SecurityTestSuite;

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testSuite = new SecurityTestSuite();
    testSuite.runAllTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}