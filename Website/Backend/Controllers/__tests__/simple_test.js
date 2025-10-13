import ComprehensiveSmartRepliesService from '../../Services/ComprehensiveSmartRepliesService.js';
import ComprehensiveEndToEndEncryptionService from '../../Services/ComprehensiveEndToEndEncryptionService.js';
import crypto from 'crypto';

async function testServices() {
  console.log('Testing Comprehensive Smart Replies Service...');
  
  try {
    // Test smart replies
    const result = await ComprehensiveSmartRepliesService.generateSmartReplies('Hello there!');
    console.log('Smart replies result:', result);
    
    // Test encryption
    console.log('\nTesting Comprehensive E2E Encryption Service...');
    
    // Generate key pairs
    const keyPair1 = await ComprehensiveEndToEndEncryptionService.generateKeyPair('user1');
    const keyPair2 = await ComprehensiveEndToEndEncryptionService.generateKeyPair('user2');
    
    console.log('Key pair 1:', { userId: keyPair1.userId, hasPrivateKey: !!keyPair1.privateKey, hasPublicKey: !!keyPair1.publicKey });
    console.log('Key pair 2:', { userId: keyPair2.userId, hasPrivateKey: !!keyPair2.privateKey, hasPublicKey: !!keyPair2.publicKey });
    
    // Get public key
    const publicKey = ComprehensiveEndToEndEncryptionService.getPublicKey('user1');
    console.log('Public key for user1:', !!publicKey);
    
    // Generate shared secret
    const sharedSecret = await ComprehensiveEndToEndEncryptionService.generateSharedSecret(
      keyPair1.privateKey,
      keyPair2.publicKey
    );
    console.log('Shared secret generated:', !!sharedSecret);
    
    // Encrypt and decrypt message
    const content = 'This is a secret message';
    const key = crypto.randomBytes(32);
    
    const encrypted = await ComprehensiveEndToEndEncryptionService.encryptMessage(content, key);
    console.log('Encrypted message:', encrypted);
    
    const decrypted = await ComprehensiveEndToEndEncryptionService.decryptMessage(
      encrypted.encryptedData,
      key,
      encrypted.iv,
      encrypted.authTag
    );
    console.log('Decrypted message:', decrypted);
    console.log('Decryption successful:', decrypted === content);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testServices();