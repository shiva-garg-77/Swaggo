#!/usr/bin/env node
/**
 * 🔐 DOCKER SECRETS INITIALIZATION SCRIPT
 * 
 * Creates secure secrets directory and files for Docker Compose secrets management
 * Sets proper file permissions for security
 * Integrates with existing generateSecrets.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root
const projectRoot = path.join(__dirname, '../../..');
const secretsDir = path.join(projectRoot, 'Website/Backend/security/.secrets');

console.log('🔐 Initializing Docker Secrets Management...');

/**
 * Create secrets directory with secure permissions
 */
function createSecretsDirectory() {
  try {
    // Create directory structure
    if (!fs.existsSync(secretsDir)) {
      fs.mkdirSync(secretsDir, { recursive: true, mode: 0o700 });
      console.log('✅ Created secrets directory with secure permissions (700)');
    } else {
      console.log('📁 Secrets directory already exists');
    }
    
    // Set secure permissions on directory
    fs.chmodSync(secretsDir, 0o700);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create secrets directory:', error.message);
    return false;
  }
}

/**
 * Generate secure secret file
 */
function createSecretFile(filename, value) {
  const filePath = path.join(secretsDir, filename);
  
  try {
    fs.writeFileSync(filePath, value, { mode: 0o600 });
    console.log(`✅ Created ${filename} with secure permissions (600)`);
  } catch (error) {
    console.error(`❌ Failed to create ${filename}:`, error.message);
  }
}

/**
 * Load secrets from environment or generate new ones
 */
function getOrGenerateSecrets() {
  const secrets = {};
  
  // Try to load from environment first
  const requiredSecrets = [
    { env: 'MONGO_USERNAME', file: 'mongo_username.txt', default: 'swaggo_admin' },
    { env: 'MONGO_PASSWORD', file: 'mongo_password.txt', generate: true, length: 32 },
    { env: 'REDIS_PASSWORD', file: 'redis_password.txt', generate: true, length: 32 },
    { env: 'ACCESS_TOKEN_SECRET', file: 'access_token_secret.txt', generate: true, length: 64 },
    { env: 'REFRESH_TOKEN_SECRET', file: 'refresh_token_secret.txt', generate: true, length: 64 },
    { env: 'CSRF_SECRET', file: 'csrf_secret.txt', generate: true, length: 64 }
  ];
  
  for (const secret of requiredSecrets) {
    let value = process.env[secret.env];
    
    if (!value || value.includes('REPLACE_WITH') || value.includes('your-')) {
      if (secret.generate) {
        // Generate cryptographically secure secret
        value = crypto.randomBytes(secret.length).toString('hex');
      } else {
        value = secret.default;
      }
    }
    
    secrets[secret.file] = value;
  }
  
  return secrets;
}

/**
 * Validate secret file permissions
 */
function validatePermissions() {
  console.log('🔍 Validating secret file permissions...');
  
  const files = fs.readdirSync(secretsDir);
  let allSecure = true;
  
  for (const file of files) {
    const filePath = path.join(secretsDir, file);
    const stats = fs.statSync(filePath);
    const permissions = (stats.mode & 0o777).toString(8);
    
    if (permissions !== '600') {
      console.warn(`⚠️ ${file} has insecure permissions (${permissions}). Should be 600.`);
      try {
        fs.chmodSync(filePath, 0o600);
        console.log(`✅ Fixed permissions for ${file}`);
      } catch (error) {
        console.error(`❌ Failed to fix permissions for ${file}:`, error.message);
        allSecure = false;
      }
    } else {
      console.log(`✅ ${file} has secure permissions (${permissions})`);
    }
  }
  
  return allSecure;
}

/**
 * Create Docker Compose secrets initialization script
 */
function createDockerComposeScript() {
  const scriptPath = path.join(projectRoot, 'Website/Backend/Scripts/docker-secrets-init.sh');
  const scriptContent = `#!/bin/bash
# 🔐 Docker Secrets Initialization Script
# Run this script to initialize secrets for Docker Compose

echo "🔐 Initializing Docker secrets for production deployment..."

# Create secrets directory if it doesn't exist
mkdir -p ./security/.secrets

# Set secure permissions
chmod 700 ./security/.secrets

# Initialize secrets from environment or generate new ones
node Scripts/initializeSecrets.js

# Validate all permissions are secure
find ./security/.secrets -type f -exec chmod 600 {} \\;

echo "✅ Docker secrets initialized successfully!"
echo "💡 Remember to backup your secrets in a secure location"
echo "🚨 Never commit secrets to version control"
`;

  try {
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    console.log('✅ Created Docker Compose initialization script');
  } catch (error) {
    console.error('❌ Failed to create initialization script:', error.message);
  }
}

/**
 * Create .gitignore for secrets directory
 */
function createGitIgnore() {
  const gitignorePath = path.join(path.dirname(secretsDir), '.gitignore');
  const gitignoreContent = `# 🔐 NEVER COMMIT SECRETS TO VERSION CONTROL
.secrets/
*.key
*.pem
*.p12
*.pfx
*.jks
*.secret
*_secret.txt
*_password.txt
*_token.txt
`;

  try {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Created .gitignore for security directory');
  } catch (error) {
    console.error('❌ Failed to create .gitignore:', error.message);
  }
}

/**
 * Main initialization function
 */
async function main() {
  console.log('🚀 Starting Docker Secrets Initialization...\n');
  
  // Step 1: Create secrets directory
  if (!createSecretsDirectory()) {
    process.exit(1);
  }
  
  // Step 2: Generate or load secrets
  console.log('\n🔑 Generating/Loading secrets...');
  const secrets = getOrGenerateSecrets();
  
  // Step 3: Create secret files
  console.log('\n📝 Creating secret files...');
  for (const [filename, value] of Object.entries(secrets)) {
    createSecretFile(filename, value);
  }
  
  // Step 4: Validate permissions
  console.log('');
  validatePermissions();
  
  // Step 5: Create additional scripts and files
  console.log('\n🛠️  Creating additional files...');
  createDockerComposeScript();
  createGitIgnore();
  
  // Step 6: Final summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Docker Secrets Initialization Complete!');
  console.log('');
  console.log('📁 Secrets Location: ./security/.secrets/');
  console.log('🔒 Permissions: Directory (700), Files (600)');
  console.log('📜 Scripts Created: docker-secrets-init.sh');
  console.log('🚫 Git Protection: .gitignore created');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('1. Review generated secrets');
  console.log('2. Backup secrets securely');
  console.log('3. Run: docker-compose up -d');
  console.log('');
  console.log('⚠️  SECURITY REMINDER:');
  console.log('- Never commit secrets to version control');
  console.log('- Use external secret management in production');
  console.log('- Rotate secrets regularly');
  console.log('- Monitor secret access');
  console.log('='.repeat(60));
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });
}

export default { main, createSecretsDirectory, getOrGenerateSecrets, validatePermissions };