import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Make Jest globally available for test utilities
global.jest = jest;
globalThis.jest = jest;

/**
 * 🧪 GLOBAL TEST SETUP CONFIGURATION
 * 
 * Sets up the testing environment for authentication system tests:
 * - Database connections and cleanup
 * - Environment variables
 * - Global mocks and utilities
 * - Security test helpers
 */

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/swaggo_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

// Global test configuration
const GLOBAL_TEST_CONFIG = {
  // Database settings
  db: {
    connectionTimeout: 10000,
    maxConnections: 10
  },
  
  // Security settings
  security: {
    saltRounds: 4, // Lower for faster tests
    jwtExpiryShort: '1m', // Short for testing
    refreshTokenExpiry: '1h' // Short for testing
  },
  
  // Test data
  testUsers: {
    valid: {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      displayName: 'Test User'
    },
    admin: {
      username: 'admintest',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      displayName: 'Admin Test User',
      role: 'admin'
    }
  }
};

// Setup MongoDB connection for tests
beforeAll(async () => {
  try {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: GLOBAL_TEST_CONFIG.db.maxConnections,
      serverSelectionTimeoutMS: GLOBAL_TEST_CONFIG.db.connectionTimeout
    });
    
    console.log('🔗 Connected to test database');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    process.exit(1);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Clean up test database
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
    
    console.log('🧹 Test database cleaned up');
  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
  }
});

// Setup before each test
beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
  
  // Reset all mocks
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  /**
   * Create a test user with secure defaults
   */
  createTestUser: async (overrides = {}) => {
    const { User } = await import('../Models/User.js');
    const userData = {
      ...GLOBAL_TEST_CONFIG.testUsers.valid,
      ...overrides
    };
    
    const user = await User.createSecureUser(userData);
    await user.save();
    return user;
  },
  
  /**
   * Create a test refresh token
   */
  createTestToken: async (userId, deviceInfo = {}) => {
    const { default: RefreshToken } = await import('../Models/RefreshToken.js');
    const defaultDeviceInfo = {
      userAgent: 'Test User Agent',
      ipAddress: '192.168.1.100',
      screenResolution: '1920x1080',
      timezone: 'UTC',
      language: 'en-US',
      platform: 'Test'
    };
    
    return await RefreshToken.createToken(userId, { ...defaultDeviceInfo, ...deviceInfo });
  },
  
  /**
   * Generate JWT token for testing
   */
  generateTestJWT: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    const defaultPayload = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'user'
    };
    
    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET,
      { expiresIn: GLOBAL_TEST_CONFIG.security.jwtExpiryShort }
    );
  },
  
  /**
   * Create mock request object
   */
  createMockRequest: (overrides = {}) => ({
    headers: {},
    cookies: {},
    ip: '192.168.1.100',
    method: 'GET',
    originalUrl: '/test',
    user: null,
    ...overrides
  }),
  
  /**
   * Create mock response object
   */
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    return res;
  },
  
  /**
   * Wait for async operations to complete
   */
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate secure random string for testing
   */
  generateRandomString: (length = 32) => {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  },
  
  /**
   * Mock Redis client for testing
   */
  createMockRedis: () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushdb: jest.fn()
  }),
  
  /**
   * Security test helpers
   */
  security: {
    /**
     * Test password strength
     */
    isStrongPassword: (password) => {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasNonalphas = /\W/.test(password);
      
      return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
    },
    
    /**
     * Generate device fingerprint for testing
     */
    generateDeviceFingerprint: (userAgent = 'Test Agent', ipAddress = '192.168.1.100') => {
      const crypto = require('crypto');
      return crypto.createHash('sha256')
        .update(`${userAgent}|${ipAddress}|test-screen|test-timezone`)
        .digest('hex');
    },
    
    /**
     * Simulate attack patterns for testing
     */
    simulateAttack: {
      bruteForce: (attempts = 10) => Array(attempts).fill().map((_, i) => ({
        timestamp: Date.now() - (i * 1000),
        ip: '192.168.1.100',
        userAgent: 'Attacker Agent',
        success: false
      })),
      
      tokenReuse: (originalToken) => ({
        type: 'token_reuse',
        originalToken,
        reuseAttempt: Date.now(),
        detected: true
      }),
      
      suspiciousLocation: () => ({
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        latitude: 0,
        longitude: 0,
        suspicious: true
      })
    }
  }
};

// Console override for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(originalConsole.log),
  warn: jest.fn(originalConsole.warn),
  error: jest.fn(originalConsole.error)
};

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests, just log the error
});

console.log('🧪 Test environment initialized with security-focused configuration');

export default GLOBAL_TEST_CONFIG;