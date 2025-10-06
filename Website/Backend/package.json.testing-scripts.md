# Additional Testing Scripts for package.json

Add these scripts to your `Website/Backend/package.json` file to support the comprehensive testing framework:

```json
{
  "scripts": {
    // Environment Setup
    "prepare-test-env": "node scripts/setupTestEnvironment.js",
    "setup:test-env": "npm run prepare-test-env && npm run generate:test-secrets",
    "setup:integration-env": "npm run setup:test-env && npm run db:test-setup",
    "setup:performance-env": "npm run setup:test-env && npm run db:performance-setup",
    "generate:test-secrets": "node scripts/generateSecrets.js --env=test",

    // Database Setup
    "db:test-setup": "node scripts/databaseTestSetup.js",
    "db:performance-setup": "node scripts/databasePerformanceSetup.js",

    // Linting and Code Quality
    "lint": "eslint . --ext .js,.ts",
    "lint:fix": "eslint . --ext .js,.ts --fix",
    "lint:security": "eslint . --ext .js,.ts --config .eslintrc.security.js",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "analyze:complexity": "node scripts/codeQualityAnalyzer.js --complexity",

    // Unit Testing
    "test:unit": "jest --selectProjects unit",
    "test:unit:config": "jest tests/unit/config --coverage",
    "test:unit:middleware": "jest tests/unit/middleware --coverage",
    "test:unit:utils": "jest tests/unit/utils --coverage",
    "test:unit:services": "jest tests/unit/services --coverage",
    "test:unit:models": "jest tests/unit/models --coverage",
    "test:unit:watch": "jest --selectProjects unit --watch",

    // Integration Testing
    "test:integration": "jest --selectProjects integration",
    "test:integration:watch": "jest --selectProjects integration --watch",
    "test:report:integration": "node scripts/generateTestReport.js --type=integration",

    // End-to-End Testing
    "test:e2e": "jest --selectProjects e2e",
    "test:e2e:watch": "jest --selectProjects e2e --watch",
    "test:e2e:report": "node scripts/generateTestReport.js --type=e2e",
    "test:e2e:screenshots": "node scripts/captureTestScreenshots.js",

    // Performance Testing
    "test:performance": "jest tests/performance",
    "performance:report": "node scripts/generatePerformanceReport.js",
    "performance:benchmark": "node scripts/benchmarkResults.js",
    "performance:compare": "node scripts/comparePerformance.js",

    // Security Testing
    "test:security": "jest tests/security",

    // Coverage and Reporting
    "coverage:check": "node scripts/checkCoverage.js",
    "coverage:merge": "node scripts/mergeCoverage.js",
    "coverage:report": "nyc report",
    "report:comprehensive": "node scripts/generateComprehensiveReport.js",

    // Quality Gates
    "quality:evaluate": "node scripts/evaluateQualityGates.js",

    // Build and Start for Testing
    "build:test": "NODE_ENV=test npm run build",
    "start:test": "NODE_ENV=test PORT=3001 node dist/app.js",

    // All Tests
    "test": "npm run test:unit && npm run test:integration",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:ci": "npm run lint && npm run test:unit && npm run test:integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coverageReporters=text --coverageReporters=html",

    // Pre-commit hooks
    "pre-commit": "npm run lint:fix && npm run test:unit",
    "pre-push": "npm run test:ci"
  },
  "devDependencies": {
    // Testing frameworks and utilities
    "@types/jest": "^29.5.0",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "jest-html-reporters": "^3.1.5",
    "jest-junit": "^16.0.0",
    "mongodb-memory-server": "^9.1.6",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",

    // Code quality tools
    "eslint": "^8.57.0",
    "eslint-config-security": "^1.7.1",
    "eslint-plugin-security": "^1.7.1",
    "prettier": "^3.2.5",
    "typescript": "^5.3.3",

    // Performance and load testing
    "autocannon": "^7.12.0",
    "clinic": "^13.0.0",

    // Security testing
    "audit-ci": "^6.6.1",
    "helmet": "^7.1.0",

    // Coverage tools
    "nyc": "^15.1.0",
    "c8": "^9.1.0",

    // Development utilities
    "nodemon": "^3.0.3",
    "cross-env": "^7.0.3",
    "rimraf": "^5.0.5",

    // Git hooks
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2"
  },
  "jest": {
    // Reference to jest.config.js
    "preset": "./jest.config.js"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:unit",
      "pre-push": "npm run test:ci"
    }
  },
  "lint-staged": {
    "*.{js,ts}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "nyc": {
    "reporter": ["text", "html", "json"],
    "exclude": [
      "tests/**/*",
      "coverage/**/*",
      "dist/**/*"
    ]
  }
}
```

## Additional Test Configuration Files

### 1. ESLint Security Configuration (`.eslintrc.security.js`)
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error'
  }
};
```

### 2. Test Environment Variables (`.env.test`)
```env
# Test Environment Configuration
NODE_ENV=test
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/swaggo-test
REDIS_URL=redis://localhost:6379/15

# Security (Test Values)
JWT_SECRET=test-jwt-secret-key-for-testing-only-do-not-use-in-production
JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-only-do-not-use-in-production
ENCRYPTION_KEY=test-encryption-key-for-testing-only-32-characters-long
COOKIE_SECRET=test-cookie-secret-key-for-testing-only-do-not-use-in-production

# Disable external services in tests
EMAIL_ENABLED=false
SMS_ENABLED=false
SLACK_ENABLED=false
PUSH_NOTIFICATIONS_ENABLED=false

# Test-specific settings
LOG_LEVEL=error
RATE_LIMIT_ENABLED=false
CSRF_ENABLED=true
```

### 3. Performance Test Configuration (`.perfrc.js`)
```javascript
module.exports = {
  thresholds: {
    averageResponseTime: 500,
    maxResponseTime: 2000,
    minSuccessRate: 0.95,
    minThroughput: 100,
    maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
    maxCpuUsage: 80 // 80%
  },
  loadTest: {
    duration: 30000, // 30 seconds
    connections: 50,
    pipelining: 1,
    maxConnectionRequests: 1000
  },
  stressTest: {
    startRPS: 10,
    maxRPS: 1000,
    stepSize: 50,
    stepDuration: 10000,
    errorThreshold: 0.1
  }
};
```

### 4. Quality Gates Configuration (`quality-gates.config.js`)
```javascript
module.exports = {
  coverage: {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85
  },
  testResults: {
    minPassRate: 95,
    maxFailures: 5
  },
  security: {
    maxVulnerabilities: 0,
    allowedSeverity: ['low']
  },
  complexity: {
    maxCyclomaticComplexity: 10,
    maxHalsteadDifficulty: 15
  },
  performance: {
    maxRegressionPercent: 10,
    maxResponseTime: 2000,
    minThroughput: 100
  },
  codeQuality: {
    maxLintErrors: 0,
    maxLintWarnings: 10
  }
};
```

## Usage Instructions

1. **Add the scripts** to your existing `package.json` file in the `scripts` section
2. **Install the devDependencies** using `npm install --save-dev [package-names]`
3. **Create the configuration files** in your project root
4. **Set up environment variables** for testing
5. **Configure your CI/CD pipeline** using the provided GitHub Actions workflow

## Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run all tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run CI pipeline locally
npm run test:ci
```

This comprehensive testing framework provides enterprise-grade testing capabilities with quality gates, performance monitoring, and automated CI/CD integration.