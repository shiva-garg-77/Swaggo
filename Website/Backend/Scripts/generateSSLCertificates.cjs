#!/usr/bin/env node
/**
 * 🔐 SSL CERTIFICATE GENERATOR
 * 
 * Generates self-signed SSL certificates for development
 * WARNING: Only use these certificates for development!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SSLCertificateGenerator {
  constructor() {
    this.certDir = path.join(__dirname, '..', 'certs');
  }

  /**
   * Generate SSL certificates for development
   */
  async generate() {
    console.log('🔐 Generating SSL certificates for development...\n');

    try {
      // Create certificates directory
      if (!fs.existsSync(this.certDir)) {
        fs.mkdirSync(this.certDir, { recursive: true });
        console.log('📁 Created certificates directory');
      }

      // Certificate paths
      const keyPath = path.join(this.certDir, 'localhost.key');
      const certPath = path.join(this.certDir, 'localhost.crt');

      // Check if certificates already exist
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        console.log('✅ SSL certificates already exist');
        this.verifyCertificates(keyPath, certPath);
        return;
      }

      // Generate private key
      console.log('🔑 Generating private key...');
      execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'pipe' });

      // Generate certificate
      console.log('📜 Generating certificate...');
      const subj = '/C=US/ST=Dev/L=Dev/O=Swaggo/OU=Development/CN=localhost';
      execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "${subj}"`, { stdio: 'pipe' });

      console.log('\n✅ SSL certificates generated successfully!');
      console.log(`📂 Certificate location: ${this.certDir}`);
      console.log(`🔑 Private key: ${keyPath}`);
      console.log(`📜 Certificate: ${certPath}`);

      this.verifyCertificates(keyPath, certPath);
      this.printUsageInstructions();

    } catch (error) {
      if (error.message.includes('openssl')) {
        console.log('❌ OpenSSL not found. Installing OpenSSL...');
        this.installOpenSSL();
      } else {
        console.error('❌ Error generating certificates:', error.message);
      }
    }
  }

  /**
   * Verify generated certificates
   */
  verifyCertificates(keyPath, certPath) {
    try {
      const keyStats = fs.statSync(keyPath);
      const certStats = fs.statSync(certPath);

      console.log('\n📊 Certificate verification:');
      console.log(`🔑 Private key: ${keyStats.size} bytes`);
      console.log(`📜 Certificate: ${certStats.size} bytes`);
      
      // Check certificate details
      const certInfo = execSync(`openssl x509 -in "${certPath}" -text -noout`, { encoding: 'utf8' });
      const expiryMatch = certInfo.match(/Not After : (.+)/);
      if (expiryMatch) {
        console.log(`📅 Expires: ${expiryMatch[1]}`);
      }

    } catch (error) {
      console.log('⚠️  Certificate verification skipped (OpenSSL not available)');
    }
  }

  /**
   * Install OpenSSL instructions
   */
  installOpenSSL() {
    console.log('\n📋 OpenSSL Installation Instructions:');
    console.log('='.repeat(60));
    
    if (process.platform === 'win32') {
      console.log('Windows:');
      console.log('1. Download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html');
      console.log('2. Install and add to PATH');
      console.log('3. Or use: choco install openssl');
    } else if (process.platform === 'darwin') {
      console.log('macOS:');
      console.log('1. brew install openssl');
    } else {
      console.log('Linux:');
      console.log('1. apt-get install openssl  # Ubuntu/Debian');
      console.log('2. yum install openssl       # RHEL/CentOS');
    }
    
    console.log('\nAlternative: Use Node.js crypto module (basic certificates)');
    this.generateBasicCertificates();
  }

  /**
   * Generate basic certificates using Node.js crypto (fallback)
   */
  generateBasicCertificates() {
    console.log('\n🔄 Generating basic certificates using Node.js...');
    
    try {
      const { generateKeyPairSync } = require('crypto');
      
      // Generate key pair
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      // Create basic certificate (self-signed)
      const keyPath = path.join(this.certDir, 'localhost.key');
      const certPath = path.join(this.certDir, 'localhost.crt');

      fs.writeFileSync(keyPath, privateKey);
      fs.writeFileSync(certPath, publicKey); // Note: This is not a proper X.509 cert, just for development

      console.log('✅ Basic certificates created (for development only)');
      console.log('⚠️  Note: These are not proper X.509 certificates. Install OpenSSL for full support.');

    } catch (error) {
      console.error('❌ Failed to generate basic certificates:', error.message);
    }
  }

  /**
   * Print usage instructions
   */
  printUsageInstructions() {
    console.log('\n📋 Usage Instructions:');
    console.log('='.repeat(60));
    console.log('1. Add to your .env.local:');
    console.log('   HTTPS_ENABLED=true');
    console.log('   SSL_KEY_PATH=./certs/localhost.key');
    console.log('   SSL_CERT_PATH=./certs/localhost.crt');
    console.log('');
    console.log('2. Update your Express server to use HTTPS:');
    console.log('   const https = require("https");');
    console.log('   const options = {');
    console.log('     key: fs.readFileSync(process.env.SSL_KEY_PATH),');
    console.log('     cert: fs.readFileSync(process.env.SSL_CERT_PATH)');
    console.log('   };');
    console.log('   https.createServer(options, app).listen(443);');
    console.log('');
    console.log('3. Trust the certificate in your browser');
    console.log('4. Access your app at: https://localhost');
    console.log('');
    console.log('🚨 WARNING: Never use these certificates in production!');
    console.log('🛡️  For production, use Let\'s Encrypt or proper CA certificates.');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new SSLCertificateGenerator();
  generator.generate().catch(console.error);
}

module.exports = SSLCertificateGenerator;