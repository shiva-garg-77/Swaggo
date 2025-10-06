#!/usr/bin/env node

/**
 * 🛠️ DEVELOPMENT WORKFLOW AUTOMATION SCRIPTS
 * 
 * Comprehensive development utilities for the Swaggo Backend project
 * Features:
 * - Environment setup and validation
 * - Database management
 * - Testing automation
 * - Development server management
 * - Code quality checks
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

/**
 * Colors for console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Utility functions
 */
const utils = {
  log: (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
  },
  
  error: (message) => {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
  },
  
  success: (message) => {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  },
  
  warning: (message) => {
    console.warn(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  },
  
  info: (message) => {
    console.info(`${colors.blue}ℹ️  ${message}${colors.reset}`);
  },
  
  header: (message) => {
    console.log(`\n${colors.cyan}${colors.bright}🚀 ${message}${colors.reset}\n`);
  },
  
  execPromise: (command, options = {}) => {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: projectRoot, ...options }, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stderr });
        } else {
          resolve(stdout);
        }
      });
    });
  },
  
  spawnCommand: (command, args, options = {}) => {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: projectRoot,
        ...options
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
      
      child.on('error', reject);
    });
  }
};

/**
 * Development commands
 */
const commands = {
  /**
   * Setup development environment
   */
  async setup() {
    utils.header('Setting up development environment');
    
    try {
      // Check if .env exists
      const envExists = await fs.access(path.join(projectRoot, '.env'))
        .then(() => true)
        .catch(() => false);
      
      if (!envExists) {
        utils.info('Creating .env file from template...');
        const envTemplate = `# Swaggo Backend Environment Configuration
# 🔐 Security Configuration
NODE_ENV=development
PORT=3001

# 📊 Database Configuration
MONGODB_URI=mongodb://localhost:27017/swaggo_dev
TEST_MONGODB_URI=mongodb://localhost:27017/swaggo_test

# 🔑 JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here-min-32-chars
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# 🛡️ Security Keys
CSRF_SECRET=your-super-secure-csrf-secret-key-here-min-32-chars
ENCRYPTION_KEY=your-super-secure-encryption-key-here-min-32-chars
PEPPER=your-super-secure-pepper-for-password-hashing-here

# 📧 Email Configuration (Optional)
EMAIL_FROM=noreply@swaggo.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 🔗 External Services (Optional)
REDIS_URL=redis://localhost:6379
RATE_LIMIT_REDIS_URL=redis://localhost:6379/1

# 🌍 CORS Configuration
CORS_ORIGIN=http://localhost:3000

# 📊 Monitoring (Optional)
ENABLE_METRICS=true
ENABLE_TRACING=false

# 🐛 Debug Configuration
DEBUG=swaggo:*
LOG_LEVEL=info`;

        await fs.writeFile(path.join(projectRoot, '.env'), envTemplate);
        utils.success('Created .env file - please update with your actual values');
      }
      
      // Install dependencies
      utils.info('Installing dependencies...');
      await utils.spawnCommand('npm', ['install']);
      utils.success('Dependencies installed');
      
      // Setup git hooks
      utils.info('Setting up git hooks...');
      try {
        await utils.spawnCommand('npm', ['run', 'prepare']);
        utils.success('Git hooks configured');
      } catch (error) {
        utils.warning('Could not setup git hooks - continuing...');
      }
      
      // Validate environment
      await commands.validate();
      
      utils.success('Development environment setup complete!');
      utils.info('Next steps:');
      utils.log('  1. Update .env file with your configuration');
      utils.log('  2. Start MongoDB server');
      utils.log('  3. Run: npm run dev');
      
    } catch (error) {
      utils.error(`Setup failed: ${error.message}`);
      process.exit(1);
    }
  },
  
  /**
   * Validate development environment
   */
  async validate() {
    utils.header('Validating development environment');
    
    const checks = [
      {
        name: 'Node.js version',
        check: async () => {
          const output = await utils.execPromise('node --version');
          const version = output.trim();
          const majorVersion = parseInt(version.slice(1).split('.')[0]);
          if (majorVersion < 18) {
            throw new Error(`Node.js 18+ required, found ${version}`);
          }
          return version;
        }
      },
      {
        name: 'npm version',
        check: async () => {
          const output = await utils.execPromise('npm --version');
          return output.trim();
        }
      },
      {
        name: 'MongoDB connection',
        check: async () => {
          try {
            await utils.execPromise('mongosh --eval "db.runCommand({ping: 1})" --quiet', { timeout: 5000 });
            return 'Connected';
          } catch {
            throw new Error('MongoDB not accessible - please start MongoDB server');
          }
        }
      },
      {
        name: 'Environment variables',
        check: async () => {
          const envPath = path.join(projectRoot, '.env');
          await fs.access(envPath);
          const env = await fs.readFile(envPath, 'utf8');
          const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
          const missing = requiredVars.filter(varName => !env.includes(`${varName}=`));
          if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
          }
          return 'Valid';
        }
      },
      {
        name: 'Dependencies',
        check: async () => {
          await fs.access(path.join(projectRoot, 'node_modules'));
          return 'Installed';
        }
      }
    ];
    
    let allPassed = true;
    
    for (const { name, check } of checks) {
      try {
        const result = await check();
        utils.success(`${name}: ${result}`);
      } catch (error) {
        utils.error(`${name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      utils.success('All environment checks passed!');
    } else {
      utils.error('Some environment checks failed - please fix before continuing');
      process.exit(1);
    }
  },
  
  /**
   * Reset development database
   */
  async resetDb() {
    utils.header('Resetting development database');
    
    try {
      utils.info('Dropping development database...');
      await utils.execPromise('mongosh swaggo_dev --eval "db.dropDatabase()" --quiet');
      
      utils.info('Dropping test database...');
      await utils.execPromise('mongosh swaggo_test --eval "db.dropDatabase()" --quiet');
      
      utils.success('Databases reset successfully');
    } catch (error) {
      utils.error(`Database reset failed: ${error.message}`);
      process.exit(1);
    }
  },
  
  /**
   * Run comprehensive tests
   */
  async testFull() {
    utils.header('Running comprehensive test suite');
    
    const testCommands = [
      { name: 'Linting', command: 'npm run lint:check' },
      { name: 'Code formatting', command: 'npm run format:check' },
      { name: 'Type checking', command: 'npm run type-check' },
      { name: 'Security audit', command: 'npm run security-audit' },
      { name: 'Unit tests', command: 'npm test' },
      { name: 'Integration tests', command: 'npm run test:integration' },
      { name: 'E2E tests', command: 'npm run test:e2e' }
    ];
    
    for (const { name, command } of testCommands) {
      try {
        utils.info(`Running ${name}...`);
        await utils.execPromise(command);
        utils.success(`${name} passed`);
      } catch (error) {
        utils.error(`${name} failed: ${error.stderr || error.message}`);
        return;
      }
    }
    
    utils.success('All tests passed! 🎉');
  },
  
  /**
   * Start development server with hot reload
   */
  async dev() {
    utils.header('Starting development server');
    
    // Validate environment first
    await commands.validate();
    
    utils.info('Starting server with hot reload...');
    utils.log('📚 API Documentation will be available at: http://localhost:3001/api-docs');
    utils.log('🔍 Server will restart automatically on file changes');
    utils.log('🛑 Press Ctrl+C to stop\n');
    
    await utils.spawnCommand('npm', ['run', 'dev']);
  },
  
  /**
   * Generate project documentation
   */
  async docs() {
    utils.header('Generating project documentation');
    
    try {
      utils.info('Generating JSDoc documentation...');
      await utils.spawnCommand('npm', ['run', 'docs']);
      
      utils.info('Generating markdown API docs...');
      await utils.spawnCommand('npm', ['run', 'docs:md']);
      
      utils.success('Documentation generated successfully');
      utils.info('View documentation at: ./docs/index.html');
    } catch (error) {
      utils.error(`Documentation generation failed: ${error.message}`);
    }
  },
  
  /**
   * Clean project artifacts
   */
  async clean() {
    utils.header('Cleaning project artifacts');
    
    const cleanTargets = [
      'node_modules',
      'coverage',
      'docs',
      '.nyc_output',
      'logs',
      'temp'
    ];
    
    for (const target of cleanTargets) {
      const targetPath = path.join(projectRoot, target);
      try {
        await fs.rm(targetPath, { recursive: true, force: true });
        utils.success(`Removed ${target}`);
      } catch (error) {
        utils.info(`${target} not found - skipping`);
      }
    }
    
    utils.success('Project cleaned successfully');
  },
  
  /**
   * Show help information
   */
  help() {
    utils.header('Swaggo Development Tools');
    
    console.log('Available commands:\n');
    
    const commandHelp = [
      { cmd: 'setup', desc: 'Setup development environment' },
      { cmd: 'validate', desc: 'Validate development environment' },
      { cmd: 'dev', desc: 'Start development server with hot reload' },
      { cmd: 'test', desc: 'Run comprehensive test suite' },
      { cmd: 'reset-db', desc: 'Reset development and test databases' },
      { cmd: 'docs', desc: 'Generate project documentation' },
      { cmd: 'clean', desc: 'Clean project artifacts' },
      { cmd: 'help', desc: 'Show this help message' }
    ];
    
    commandHelp.forEach(({ cmd, desc }) => {
      console.log(`  ${colors.cyan}${cmd.padEnd(12)}${colors.reset} ${desc}`);
    });
    
    console.log('\nUsage:');
    console.log(`  ${colors.yellow}node scripts/dev.js <command>${colors.reset}`);
    console.log(`  ${colors.yellow}npm run dev:setup${colors.reset}`);
    console.log(`  ${colors.yellow}npm run dev:validate${colors.reset}\n`);
  }
};

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    commands.help();
    return;
  }
  
  const commandKey = command.replace('-', '').replace('_', '');
  const cmd = commands[commandKey] || commands[command];
  
  if (!cmd) {
    utils.error(`Unknown command: ${command}`);
    commands.help();
    process.exit(1);
  }
  
  try {
    await cmd();
  } catch (error) {
    utils.error(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  utils.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  utils.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default commands;