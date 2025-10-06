/**
 * Test Utilities and Helpers
 * Provides comprehensive testing utilities for consistent test implementations
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import request from 'supertest';

/**
 * Test Data Factory - Creates consistent test data
 */
export class TestDataFactory {
  static users = {
    // Standard user for general tests
    standard: {
      email: 'user@test.com',
      password: 'Password123!',
      username: 'testuser',
      role: 'user',
      isActive: true,
      isVerified: true
    },

    // Admin user for privileged operations
    admin: {
      email: 'admin@test.com',
      password: 'AdminPass123!',
      username: 'admin',
      role: 'admin',
      isActive: true,
      isVerified: true
    },

    // Unverified user for email verification tests
    unverified: {
      email: 'unverified@test.com',
      password: 'Password123!',
      username: 'unverified',
      role: 'user',
      isActive: true,
      isVerified: false
    },

    // Inactive user for account status tests
    inactive: {
      email: 'inactive@test.com',
      password: 'Password123!',
      username: 'inactive',
      role: 'user',
      isActive: false,
      isVerified: true
    }
  };

  /**
   * Create a user with hashed password
   */
  static async createUser(userData = {}) {
    const user = { ...this.users.standard, ...userData };
    
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    return {
      ...user,
      _id: await this.generateObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate a valid MongoDB ObjectId
   */
  static async generateObjectId() {
    // Import ObjectId dynamically to avoid issues
    const { ObjectId } = await import('mongodb');
    return new ObjectId();
  }

  /**
   * Create JWT tokens for testing
   */
  static createTokens(user, options = {}) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      ...options.payload
    };

    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

    return {
      accessToken: jwt.sign(payload, jwtSecret, {
        expiresIn: options.accessTokenExpiry || '1h'
      }),
      refreshToken: jwt.sign(payload, refreshSecret, {
        expiresIn: options.refreshTokenExpiry || '7d'
      })
    };
  }

  /**
   * Create test file data
   */
  static createTestFile(options = {}) {
    return {
      fieldname: options.fieldname || 'file',
      originalname: options.originalname || 'test-file.txt',
      encoding: options.encoding || '7bit',
      mimetype: options.mimetype || 'text/plain',
      destination: options.destination || './uploads/test',
      filename: options.filename || `test-${Date.now()}.txt`,
      path: options.path || `./uploads/test/test-${Date.now()}.txt`,
      size: options.size || 1024
    };
  }

  /**
   * Create mock API response
   */
  static createApiResponse(data = null, message = 'Success', status = 'success') {
    return {
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Database Test Utilities
 */
export class DatabaseTestUtils {
  static connection = null;

  /**
   * Connect to test database
   */
  static async connect() {
    const { MongoClient } = await import('mongodb');
    
    if (!this.connection) {
      this.connection = await MongoClient.connect(process.env.MONGODB_URI);
    }
    
    return this.connection.db();
  }

  /**
   * Clear all collections in test database
   */
  static async clearDatabase() {
    const db = await this.connect();
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }

  /**
   * Seed database with test data
   */
  static async seedDatabase() {
    const db = await this.connect();
    
    // Clear users collection first to avoid duplicates
    await db.collection('users').deleteMany({});
    
    // Create test users with unique identifiers
    const users = await Promise.all([
      TestDataFactory.createUser({ ...TestDataFactory.users.standard, username: 'testuser1', email: 'user1@test.com' }),
      TestDataFactory.createUser({ ...TestDataFactory.users.admin, username: 'admin1', email: 'admin1@test.com' }),
      TestDataFactory.createUser({ ...TestDataFactory.users.unverified, username: 'unverified1', email: 'unverified1@test.com' }),
      TestDataFactory.createUser({ ...TestDataFactory.users.inactive, username: 'inactive1', email: 'inactive1@test.com' })
    ]);

    // Remove any id fields that might cause conflicts and let MongoDB generate _id automatically
    const cleanUsers = users.map(({ id, ...user }) => user);

    await db.collection('users').insertMany(cleanUsers);
    
    return cleanUsers;
  }

  /**
   * Close database connection
   */
  static async disconnect() {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}

/**
 * API Test Utilities
 */
export class ApiTestUtils {
  /**
   * Create authenticated request with JWT token
   */
  static authenticateRequest(request, user) {
    const tokens = TestDataFactory.createTokens(user);
    return request.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  /**
   * Create request with cookie authentication
   */
  static authenticateRequestWithCookie(request, user) {
    const tokens = TestDataFactory.createTokens(user);
    return request.set('Cookie', `authToken=${tokens.accessToken}`);
  }

  /**
   * Assert API response structure
   */
  static assertApiResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
  }

  /**
   * Assert successful API response
   */
  static assertSuccessResponse(response, expectedStatus = 200, expectedData = null) {
    this.assertApiResponse(response, expectedStatus);
    expect(response.body.status).toBe('success');
    
    if (expectedData) {
      expect(response.body.data).toEqual(expect.objectContaining(expectedData));
    }
  }

  /**
   * Assert error API response
   */
  static assertErrorResponse(response, expectedStatus, expectedMessage = null) {
    this.assertApiResponse(response, expectedStatus);
    expect(response.body.status).toBe('error');
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  }

  /**
   * Assert validation error response
   */
  static assertValidationError(response, field = null) {
    this.assertErrorResponse(response, 400);
    
    if (field) {
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field })
        ])
      );
    }
  }
}

/**
 * File System Test Utilities
 */
export class FileSystemTestUtils {
  /**
   * Create temporary test file
   */
  static async createTempFile(content = 'test content', extension = '.txt') {
    const fileName = `test-${Date.now()}${extension}`;
    const filePath = path.join(process.cwd(), 'tests', 'temp', fileName);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    
    return {
      path: filePath,
      name: fileName,
      content
    };
  }

  /**
   * Clean up temporary files
   */
  static async cleanupTempFiles() {
    const tempDir = path.join(process.cwd(), 'tests', 'temp');
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  /**
   * Assert file exists
   */
  static async assertFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      throw new Error(`File does not exist: ${filePath}`);
    }
  }

  /**
   * Assert file does not exist
   */
  static async assertFileNotExists(filePath) {
    try {
      await fs.access(filePath);
      throw new Error(`File should not exist: ${filePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      return true;
    }
  }
}

/**
 * Performance Test Utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    return {
      result,
      executionTime: end - start
    };
  }

  /**
   * Assert execution time is within bounds
   */
  static assertExecutionTime(executionTime, maxTime, minTime = 0) {
    expect(executionTime).toBeGreaterThanOrEqual(minTime);
    expect(executionTime).toBeLessThanOrEqual(maxTime);
  }

  /**
   * Create performance benchmarks
   */
  static async benchmark(fn, iterations = 10) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const { executionTime } = await this.measureExecutionTime(fn);
      times.push(executionTime);
    }
    
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return {
      times,
      average,
      min,
      max,
      iterations
    };
  }
}

/**
 * Security Test Utilities
 */
export class SecurityTestUtils {
  /**
   * Generate malicious payloads for security testing
   */
  static maliciousPayloads = {
    xss: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">'
    ],
    sqlInjection: [
      "' OR 1=1 --",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --"
    ],
    pathTraversal: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd'
    ],
    commandInjection: [
      '; cat /etc/passwd',
      '| whoami',
      '& echo "injection"'
    ]
  };

  /**
   * Test input sanitization
   */
  static async testInputSanitization(endpoint, field, payload) {
    const response = await request(global.app)
      .post(endpoint)
      .send({ [field]: payload });
    
    // Should either reject malicious input or sanitize it
    expect([400, 403, 422]).toContain(response.status);
  }

  /**
   * Test rate limiting
   */
  static async testRateLimit(endpoint, method = 'GET', limit = 10) {
    const requests = [];
    
    for (let i = 0; i < limit + 5; i++) {
      const req = request(global.app)[method.toLowerCase()](endpoint);
      requests.push(req);
    }
    
    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited (429)
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }

  /**
   * Generate CSRF token for testing
   */
  static generateCSRFToken() {
    return createHash('sha256')
      .update(Math.random().toString())
      .digest('hex');
  }
}

/**
 * Mock Utilities
 */
export class MockUtils {
  /**
   * Mock Express request object
   */
  static mockRequest(overrides = {}) {
    const req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: null,
      session: {},
      cookies: {},
      ip: '127.0.0.1',
      method: 'GET',
      path: '/test',
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      // Add Express request methods
      get: function(name) {
        return this.headers[name.toLowerCase()];
      },
      header: function(name) {
        return this.headers[name.toLowerCase()];
      },
      ...overrides
    };
    return req;
  }

  /**
   * Mock Express response object
   */
  static mockResponse() {
    // Try multiple ways to access Jest mock functions
    let jestFn = null;
    
    // Try globalThis first
    if (globalThis.jest && globalThis.jest.fn) {
      jestFn = globalThis.jest.fn;
    }
    // Try global
    else if (typeof global !== 'undefined' && global.jest && global.jest.fn) {
      jestFn = global.jest.fn;
    }
    // Try window (browser environment)
    else if (typeof window !== 'undefined' && window.jest && window.jest.fn) {
      jestFn = window.jest.fn;
    }
    // Create fallback mock function
    else {
      jestFn = () => {
        const fn = function() { return res; };
        fn.mockClear = () => fn;
        fn.mockReset = () => fn;
        fn.mockRestore = () => fn;
        fn.mock = { calls: [], results: [], instances: [] };
        return fn;
      };
    }
    
    const res = {
      status: jestFn(() => res),
      json: jestFn(() => res),
      send: jestFn(() => res),
      cookie: jestFn(() => res),
      clearCookie: jestFn(() => res),
      redirect: jestFn(() => res),
      render: jestFn(() => res),
      end: jestFn(() => res),
      locals: {}
    };
    return res;
  }

  /**
   * Mock Next.js function
   */
  static mockNext() {
    // Try multiple ways to access Jest mock functions
    let jestFn = null;
    
    // Try globalThis first
    if (globalThis.jest && globalThis.jest.fn) {
      jestFn = globalThis.jest.fn;
    }
    // Try global
    else if (typeof global !== 'undefined' && global.jest && global.jest.fn) {
      jestFn = global.jest.fn;
    }
    // Try window (browser environment)
    else if (typeof window !== 'undefined' && window.jest && window.jest.fn) {
      jestFn = window.jest.fn;
    }
    // Create fallback mock function
    else {
      jestFn = () => {
        const fn = function() {};
        fn.mockClear = () => fn;
        fn.mockReset = () => fn;
        fn.mockRestore = () => fn;
        fn.mock = { calls: [], results: [], instances: [] };
        return fn;
      };
    }
    
    return jestFn();
  }

  /**
   * Mock external service responses
   */
  static mockExternalService(serviceName, mockData) {
    const { jest: jestGlobal } = globalThis;
    const mockFn = jestGlobal?.fn || (() => {
      const fn = () => mockData;
      fn.mock = { calls: [] };
      fn.mockResolvedValue = (value) => { fn._resolvedValue = value; return fn; };
      fn.mockResolvedValueOnce = (...values) => { fn._resolvedValues = values; return fn; };
      return fn;
    });
    
    const mock = mockFn();
    
    if (Array.isArray(mockData)) {
      mock.mockResolvedValueOnce?.(...mockData);
    } else {
      mock.mockResolvedValue?.(mockData);
    }
    
    return mock;
  }
}

/**
 * Test Environment Utilities
 */
export class TestEnvironment {
  /**
   * Setup test environment for specific test suite
   */
  static async setup(options = {}) {
    if (options.database !== false) {
      await DatabaseTestUtils.clearDatabase();
      
      if (options.seedData) {
        await DatabaseTestUtils.seedDatabase();
      }
    }
    
    if (options.cleanupFiles !== false) {
      await FileSystemTestUtils.cleanupTempFiles();
    }
  }

  /**
   * Cleanup test environment
   */
  static async cleanup() {
    await DatabaseTestUtils.clearDatabase();
    await FileSystemTestUtils.cleanupTempFiles();
  }

  /**
   * Create isolated test environment
   */
  static isolatedTest(testFn) {
    return async () => {
      await this.setup();
      try {
        await testFn();
      } finally {
        await this.cleanup();
      }
    };
  }
}

// Export all utilities as default export for convenience
export default {
  TestDataFactory,
  DatabaseTestUtils,
  ApiTestUtils,
  FileSystemTestUtils,
  PerformanceTestUtils,
  SecurityTestUtils,
  MockUtils,
  TestEnvironment
};