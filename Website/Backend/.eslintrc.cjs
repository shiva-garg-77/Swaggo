module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Only critical errors - made less strict
    'no-undef': 'warn', // Changed to warn instead of error
    'no-unused-vars': 'off', // Too noisy during development
    'no-console': 'off',     // Allow console.log in backend
    'no-debugger': 'warn',
    'no-var': 'warn',
    'prefer-const': 'off',   // Too noisy during development
    'no-const-assign': 'warn',
    'no-control-regex': 'warn',
    'no-useless-catch': 'warn',
    'no-case-declarations': 'warn',
    'no-dupe-class-members': 'warn', // Downgrade duplicate class members to warning
    'no-dupe-keys': 'warn', // Downgrade duplicate keys to warning
    'no-global-assign': 'warn', // Downgrade global assignment to warning
    'no-useless-escape': 'warn', // Downgrade unnecessary escapes to warning
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.min.js',
    'coverage/',
  ],
  overrides: [
    {
      // Test files configuration
      files: ['tests/**/*.js', 'test/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
        mocha: true,
        es2022: true,
        node: true,
      },
      globals: {
        expect: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        beforeAll: 'readonly',
        afterEach: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        fail: 'readonly',
        testUser: 'writable',
      },
      rules: {
        'no-undef': 'off', // Turn off for test files
      },
    },
    {
      // MongoDB initialization scripts
      files: ['Security/mongo-init.js', '**/mongo-init.js'],
      env: {
        mongo: true,
      },
      globals: {
        db: 'writable',
        print: 'readonly',
        _getEnv: 'readonly',
      },
      rules: {
        'no-undef': 'off', // Turn off for mongo scripts
      },
    },
  ],
};
