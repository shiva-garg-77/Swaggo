#!/usr/bin/env node
/**
 * 🔐 SECURE SECRET GENERATION UTILITY
 * 
 * This script generates cryptographically secure secrets for your application
 * Run: node Scripts/generateSecrets.js
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Generating cryptographically secure secrets...\n');

// Generate secure secrets
const secrets = {
  ACCESS_TOKEN_SECRET: crypto.randomBytes(64).toString('hex'),
  REFRESH_TOKEN_SECRET: crypto.randomBytes(64).toString('hex'),
  COOKIE_SECRET: crypto.randomBytes(64).toString('hex'),
  CSRF_SECRET: crypto.randomBytes(64).toString('hex'),
  PASSWORD_PEPPER: crypto.randomBytes(64).toString('hex'),
  REQUEST_SIGNING_KEY: crypto.randomBytes(64).toString('hex'),
  DS_API_KEY: crypto.randomBytes(32).toString('hex')
};

// Generate VAPID keys (requires web-push library)
let vapidKeys = null;
try {
  const webpush = await import('web-push');
  vapidKeys = webpush.default.generateVAPIDKeys();
  console.log('✅ VAPID keys generated successfully');
} catch (error) {
  console.log('⚠️  web-push not installed, VAPID keys not generated');
  console.log('   Run: npm install web-push --save');
  vapidKeys = {
    publicKey: 'INSTALL_WEBPUSH_AND_REGENERATE',
    privateKey: 'INSTALL_WEBPUSH_AND_REGENERATE'
  };
}

// Create secure .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const templatePath = path.join(__dirname, '..', '.env.template');

let envContent = '';

try {
  // Read template file
  envContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace all placeholders with secure values
  envContent = envContent.replace(/REPLACE_WITH_SECURE_64_CHAR_SECRET_FROM_GENERATE_SECRETS_SCRIPT/g, () => crypto.randomBytes(64).toString('hex'));
  envContent = envContent.replace(/REPLACE_WITH_64_CHAR_RANDOM_SECRET/g, () => crypto.randomBytes(64).toString('hex'));
  
  // Replace specific service secrets
  envContent = envContent.replace('REPLACE_WITH_DS_API_KEY', secrets.DS_API_KEY);
  envContent = envContent.replace('REPLACE_WITH_VAPID_PUBLIC_KEY', vapidKeys.publicKey);
  envContent = envContent.replace('REPLACE_WITH_VAPID_PRIVATE_KEY', vapidKeys.privateKey);
  
  // Replace database password with strong random password
  const dbPassword = crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  envContent = envContent.replace('REPLACE_WITH_VERY_STRONG_DATABASE_PASSWORD', dbPassword);
  
  // Replace external service placeholders
  envContent = envContent.replace('REPLACE_WITH_EMAIL', 'your-email@example.com');
  envContent = envContent.replace('REPLACE_WITH_APP_PASSWORD', 'your-gmail-app-password');
  envContent = envContent.replace('REPLACE_WITH_TURN_USERNAME', 'your-turn-server-username');
  envContent = envContent.replace('REPLACE_WITH_TURN_PASSWORD', 'your-turn-server-password');
  envContent = envContent.replace('REPLACE_WITH_YOUR_SLACK_WEBHOOK_URL', 'https://hooks.slack.com/your/webhook/url');
  envContent = envContent.replace('REPLACE_WITH_YOUR_SMS_API_KEY', 'your-sms-provider-api-key');
  
  // Set secure defaults for development
  envContent = envContent.replace('admin@yourdomain.com', process.env.USER ? `${process.env.USER}@localhost` : 'admin@localhost');
  
  // Write secure .env.local
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Secure environment file created at .env.local');
  console.log('📝 Please update the following values manually:');
  console.log('   - SMTP_USER (your email)');
  console.log('   - SMTP_PASSWORD (your app password)');
  console.log('   - TURN_USERNAME and TURN_PASSWORD (if using TURN servers)');
  
} catch (error) {
  console.error('❌ Error creating environment file:', error.message);
  
  // Fallback: display secrets
  console.log('\n🔐 Generated secrets (copy to your .env.local):');
  console.log('=' .repeat(60));
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  if (vapidKeys) {
    console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  }
}

// Generate database encryption key for production
const dbEncryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\n🗄️  Database encryption key (for production):');
console.log(`DB_ENCRYPTION_KEY=${dbEncryptionKey}`);

// Security recommendations
console.log('\n🔒 SECURITY RECOMMENDATIONS:');
console.log('1. Never commit .env.local to version control');
console.log('2. Use different secrets for each environment');
console.log('3. Rotate secrets regularly (quarterly recommended)');
console.log('4. Store production secrets in secure key management');
console.log('5. Monitor for secret exposure in logs');
console.log('6. Use HTTPS in production (COOKIE_SECURE=true)');
console.log('7. Configure proper CORS origins for production');

console.log('\n🚀 Setup complete! Your application is now secure.');