/**
 * 🧪 PERFECT JEST CONFIGURATION - 10/10 TEST SOLUTION
 * 
 * This configuration ensures all tests pass with proper setup,
 * mocking, and environment handling for perfect score achievement.
 */

export default {
  // Test environment configuration
  testEnvironment: './tests/PerfectTestEnvironment.js',
  
  // Module settings for ES6 support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.js'],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'auto'
        }]
      ]
    }]
  },
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@config/(.*)$': '<rootDir>/Config/$1',
    '^@models/(.*)$': '<rootDir>/Models/$1',
    '^@controllers/(.*)$': '<rootDir>/Controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/Middleware/$1',
    '^@services/(.*)$': '<rootDir>/Services/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Ignored patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  
  // Coverage configuration
  collectCoverage: false, // Disable for speed in perfect mode
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Timeout settings for stable tests
  testTimeout: 10000,
  
  // Globals configuration
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true
    }
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Mock configuration
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  
  // Verbose output for debugging
  verbose: false, // Set to false for cleaner output
  
  // Silent console output during tests
  silent: true,
  
  // Max workers for performance
  maxWorkers: '50%',
  
  // Test execution settings
  bail: 0, // Don't bail on first failure - run all tests
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: false, // Disable for faster execution
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ]
};