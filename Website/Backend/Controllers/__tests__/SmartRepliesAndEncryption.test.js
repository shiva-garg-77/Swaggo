import ComprehensiveSmartRepliesService from '../../Services/ComprehensiveSmartRepliesService.js';
import ComprehensiveEndToEndEncryptionService from '../../Services/ComprehensiveEndToEndEncryptionService.js';

describe('Smart Replies and E2E Encryption Services', () => {
  describe('Comprehensive Smart Replies Service', () => {
    test('should generate smart replies for greeting messages', async () => {
      const result = await ComprehensiveSmartRepliesService.generateSmartReplies('Hello there!');
      expect(result.suggestions).toHaveLength(3);
      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should generate smart replies for thank you messages', async () => {
      const result = await ComprehensiveSmartRepliesService.generateSmartReplies('Thank you so much!');
      expect(result.suggestions).toHaveLength(3);
      expect(result.intent).toBe('thanks');
    });

    test('should generate smart replies for question messages', async () => {
      const result = await ComprehensiveSmartRepliesService.generateSmartReplies('What time is it?');
      expect(result.suggestions).toHaveLength(3);
      expect(result.intent).toBe('question');
    });

    test('should handle empty message content', async () => {
      const result = await ComprehensiveSmartRepliesService.generateSmartReplies('');
      expect(result.suggestions).toHaveLength(3);
    });

    test('should provide metrics', () => {
      const metrics = ComprehensiveSmartRepliesService.getMetrics();
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
    });
  });

  describe('Comprehensive E2E Encryption Service', () => {
    test('should generate key pair for user', async () => {
      const keyPair = await ComprehensiveEndToEndEncryptionService.generateKeyPair('user123');
      expect(keyPair).toHaveProperty('userId', 'user123');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
    });

    test('should get public key for user', () => {
      const publicKey = ComprehensiveEndToEndEncryptionService.getPublicKey('user123');
      expect(publicKey).toBeTruthy();
    });

    test('should generate shared secret', async () => {
      const keyPair1 = await ComprehensiveEndToEndEncryptionService.generateKeyPair('user1');
      const keyPair2 = await ComprehensiveEndToEndEncryptionService.generateKeyPair('user2');
      
      const sharedSecret = await ComprehensiveEndToEndEncryptionService.generateSharedSecret(
        keyPair1.privateKey,
        keyPair2.publicKey
      );
      
      expect(sharedSecret).toBeTruthy();
    });

    test('should encrypt and decrypt message', async () => {
      const content = 'This is a secret message';
      const key = crypto.randomBytes(32);
      
      const encrypted = await ComprehensiveEndToEndEncryptionService.encryptMessage(content, key);
      const decrypted = await ComprehensiveEndToEndEncryptionService.decryptMessage(
        encrypted.encryptedData,
        key,
        encrypted.iv,
        encrypted.authTag
      );
      
      expect(decrypted).toBe(content);
    });

    test('should provide metrics', () => {
      const metrics = ComprehensiveEndToEndEncryptionService.getMetrics();
      expect(metrics).toHaveProperty('totalEncryptedMessages');
      expect(metrics).toHaveProperty('totalDecryptedMessages');
    });
  });
});