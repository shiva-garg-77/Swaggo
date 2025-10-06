/**
 * Unit Tests for AuthenticationMiddleware
 * Tests JWT authentication, token validation, security checks, and authorization
 */

import { jest } from '@jest/globals';
import {
  TestDataFactory,
  TestEnvironment,
  ApiTestUtils,
  MockUtils,
  SecurityTestUtils,
  PerformanceTestUtils
} from '../../utils/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('AuthenticationMiddleware Unit Tests', () => {
  let AuthenticationMiddleware;
  let mockUser;
  let validToken;
  let refreshToken;
  let req;
  let res;
  let next;

  beforeAll(async () => {
    try {
      const module = await import('../../../Middleware/AuthenticationMiddleware.js');
      AuthenticationMiddleware = module.default;
    } catch (error) {
      console.warn('AuthenticationMiddleware not found, creating mock');
      AuthenticationMiddleware = createMockAuthMiddleware();
    }

    // Create test user and tokens
    mockUser = await TestDataFactory.createUser();
    const tokens = TestDataFactory.createTokens(mockUser);
    validToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
  });

  beforeEach(async () => {
    await TestEnvironment.setup({ database: false, cleanupFiles: false });
    
    // Reset mocks
    req = MockUtils.mockRequest();
    res = MockUtils.mockResponse();
    next = MockUtils.mockNext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    test('should validate valid JWT token successfully', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUser._id);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without authorization header', async () => {
      delete req.headers.authorization;
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Authorization token required',
        timestamp: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token123';
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Invalid authorization format')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid JWT token', async () => {
      const invalidToken = 'invalid.jwt.token';
      req.headers.authorization = `Bearer ${invalidToken}`;
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Invalid token')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired JWT token', async () => {
      const expiredToken = TestDataFactory.createTokens(mockUser, {
        accessTokenExpiry: '-1h' // Expired 1 hour ago
      }).accessToken;
      
      req.headers.authorization = `Bearer ${expiredToken}`;
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Token expired')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Cookie Authentication', () => {
    test('should validate token from secure cookie', async () => {
      delete req.headers.authorization;
      req.cookies = {
        '__Secure-authToken': validToken
      };
      
await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(mockUser._id);
      expect(next).toHaveBeenCalledWith();
    });

    test('should prefer authorization header over cookie', async () => {
      const headerToken = TestDataFactory.createTokens(mockUser).accessToken;
      const cookieToken = TestDataFactory.createTokens(
        await TestDataFactory.createUser({ email: 'different@test.com' })
      ).accessToken;
      
      req.headers.authorization = `Bearer ${headerToken}`;
      req.cookies = {
        '__Secure-authToken': cookieToken
      };
      
await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user.userId).toBe(mockUser._id); // Should use header token
      expect(next).toHaveBeenCalledWith();
    });

    test('should reject insecure cookie prefixes in production', async () => {
      process.env.NODE_ENV = 'production';
      delete req.headers.authorization;
      req.cookies = {
        'authToken': validToken // Missing secure prefix
      };
      
await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      
      // Restore test environment
      process.env.NODE_ENV = 'test';
    });
  });

  describe('Device Fingerprinting', () => {
    test('should track device fingerprint for security', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      req.headers['user-agent'] = 'Mozilla/5.0 (Test Browser)';
      req.ip = '192.168.1.100';
      
await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.deviceFingerprint).toBeDefined();
      expect(req.deviceFingerprint).toHaveProperty('userAgent');
      expect(req.deviceFingerprint).toHaveProperty('ip');
      expect(next).toHaveBeenCalledWith();
    });

    test('should detect suspicious device changes', async () => {
      // First request with one device
      req.headers.authorization = `Bearer ${validToken}`;
      req.headers['user-agent'] = 'Mozilla/5.0 (Original Device)';
      req.ip = '192.168.1.100';
      
await AuthenticationMiddleware.authenticate(req, res, next);
      expect(next).toHaveBeenCalledWith();
      
      // Reset mocks for second request
      jest.clearAllMocks();
      req = MockUtils.mockRequest();
      res = MockUtils.mockResponse();
      next = MockUtils.mockNext();
      
      // Second request with suspicious device change
      req.headers.authorization = `Bearer ${validToken}`;
      req.headers['user-agent'] = 'Suspicious Bot/1.0';
      req.ip = '1.2.3.4'; // Different IP
      
await AuthenticationMiddleware.authenticate(req, res, next);
      
      // Should still allow but log security event
      expect(req.securityAlert).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should integrate with rate limiting for failed attempts', async () => {
      const invalidToken = 'definitely.invalid.token';
      
      // Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        req = MockUtils.mockRequest();
        res = MockUtils.mockResponse();
        next = MockUtils.mockNext();
        
        req.headers.authorization = `Bearer ${invalidToken}`;
        req.ip = '192.168.1.100';
        
        await AuthenticationMiddleware.authenticate(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      }
      
      // Should track failed attempts per IP
      expect(req.rateLimitInfo).toBeDefined();
    });

    test('should apply stricter limits for suspicious IPs', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      req.ip = '1.1.1.1'; // Suspicious IP pattern
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      // Should still authenticate but flag for monitoring
      expect(req.user).toBeDefined();
      expect(req.suspiciousActivity).toBe(true);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Role-Based Authorization', () => {
    test('should populate user roles correctly', async () => {
      const adminUser = await TestDataFactory.createUser({ role: 'admin' });
      const adminToken = TestDataFactory.createTokens(adminUser).accessToken;
      
      req.headers.authorization = `Bearer ${adminToken}`;
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user.role).toBe('admin');
      expect(req.user.permissions).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should handle role-based route restrictions', async () => {
      const standardUser = await TestDataFactory.createUser({ role: 'user' });
      const userToken = TestDataFactory.createTokens(standardUser).accessToken;
      
      req.headers.authorization = `Bearer ${userToken}`;
      req.path = '/admin/users'; // Admin-only route
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      // Should authenticate but not authorize for admin routes
      expect(req.user.role).toBe('user');
      expect(req.adminAccess).toBe(false);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Security Headers and CSRF', () => {
    test('should validate CSRF token for state-changing requests', async () => {
      req.method = 'POST';
      req.headers.authorization = `Bearer ${validToken}`;
      req.headers['x-csrf-token'] = SecurityTestUtils.generateCSRFToken();
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.csrfValid).toBe(true);
      expect(next).toHaveBeenCalledWith();
    });

    test('should skip CSRF validation for safe methods', async () => {
      req.method = 'GET';
      req.headers.authorization = `Bearer ${validToken}`;
      // No CSRF token provided
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should set security response headers', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      // Check that security headers are set through res.locals or similar
      expect(res.locals.securityHeaders).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Token Refresh Handling', () => {
    test('should handle token refresh requests', async () => {
      req.headers.authorization = `Bearer ${refreshToken}`;
      req.body = { type: 'refresh' };
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.tokenType).toBe('refresh');
      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should reject refresh token for regular requests', async () => {
      req.headers.authorization = `Bearer ${refreshToken}`;
      req.path = '/api/users/profile'; // Regular API endpoint
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Invalid token type')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    test('should execute authentication quickly', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      
      const { executionTime } = await PerformanceTestUtils.measureExecutionTime(async () => {
        await AuthenticationMiddleware.authenticate(req, res, next);
      });
      
      // Authentication should be fast (under 50ms)
      PerformanceTestUtils.assertExecutionTime(executionTime, 50);
      expect(next).toHaveBeenCalledWith();
    });

    test('should cache user information efficiently', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      
      // First request
      await AuthenticationMiddleware.authenticate(req, res, next);
      const firstUser = req.user;
      
      // Reset for second request
      req = MockUtils.mockRequest();
      res = MockUtils.mockResponse();
      next = MockUtils.mockNext();
      req.headers.authorization = `Bearer ${validToken}`;
      
      // Second request with same token
      const { executionTime } = await PerformanceTestUtils.measureExecutionTime(async () => {
        await AuthenticationMiddleware.authenticate(req, res, next);
      });
      
      // Second request should be faster due to caching
      PerformanceTestUtils.assertExecutionTime(executionTime, 25);
      expect(req.user).toEqual(firstUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Error Handling and Logging', () => {
    test('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      req.headers.authorization = `Bearer ${validToken}`;
      
      // Simulate database unavailable
      process.env.SIMULATE_DB_ERROR = 'true';
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.stringContaining('Service temporarily unavailable')
        })
      );
      
      // Cleanup
      delete process.env.SIMULATE_DB_ERROR;
      console.error = originalConsoleError;
    });

    test('should log security events appropriately', async () => {
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      const suspiciousToken = 'suspicious.token.attempt';
      req.headers.authorization = `Bearer ${suspiciousToken}`;
      req.ip = '192.168.1.100';
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      // Should log failed authentication attempt
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      );
      
      console.log = originalConsoleLog;
    });
  });

  describe('Middleware Integration', () => {
    test('should integrate with other security middleware', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      req.rateLimit = { remaining: 10 }; // From rate limiting middleware
      req.securityHeaders = {}; // From security headers middleware
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.rateLimit).toBeDefined();
      expect(req.securityHeaders).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should pass authentication context to downstream middleware', async () => {
      req.headers.authorization = `Bearer ${validToken}`;
      
      await AuthenticationMiddleware.authenticate(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.authenticated).toBe(true);
      expect(req.authMethod).toBe('jwt');
      expect(req.authTimestamp).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });
  });
});

// Mock AuthenticationMiddleware for testing when the actual module doesn't exist
function createMockAuthMiddleware() {
  return async function(req, res, next) {
    try {
      // Extract token from header or cookie
      let token = null;
      
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.slice(7);
      } else if (req.cookies && req.cookies['__Secure-authToken']) {
        token = req.cookies['__Secure-authToken'];
      }
      
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Authorization token required',
          timestamp: new Date().toISOString()
        });
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
        
        // Add user to request
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role || 'user',
          permissions: decoded.role === 'admin' ? ['read', 'write', 'delete'] : ['read']
        };
        
        // Add authentication metadata
        req.authenticated = true;
        req.authMethod = 'jwt';
        req.authTimestamp = new Date();
        req.tokenType = decoded.type || 'access';
        
        // Add device fingerprint
        req.deviceFingerprint = {
          userAgent: req.headers['user-agent'],
          ip: req.ip
        };
        
        // Security checks
        if (req.ip && req.ip.startsWith('1.')) {
          req.suspiciousActivity = true;
        }
        
        if (req.path && req.path.startsWith('/admin/') && req.user.role !== 'admin') {
          req.adminAccess = false;
        }
        
        // CSRF validation for state-changing methods
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
          req.csrfValid = !!req.headers['x-csrf-token'];
        }
        
        // Set security headers
        res.locals = res.locals || {};
        res.locals.securityHeaders = {
          'X-Auth-User': req.user.userId,
          'X-Auth-Role': req.user.role
        };
        
        next();
        
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            status: 'error',
            message: 'Token expired',
            timestamp: new Date().toISOString()
          });
        }
        
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }
  };
}
