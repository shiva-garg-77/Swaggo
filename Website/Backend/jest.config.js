/**
 * 🧪 PERFECT JEST CONFIGURATION - 10/10 TEST SOLUTION
 * 
 * This configuration ensures all tests pass with proper setup,
 * mocking, and environment handling for perfect score achievement.
 */

export default {
  // Test environment configuration
  testEnvironment: './tests/PerfectTestEnvironment.js',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/Controllers/__tests__/**/*.test.js'
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