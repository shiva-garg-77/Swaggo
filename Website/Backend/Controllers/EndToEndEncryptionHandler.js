import ComprehensiveEndToEndEncryptionService from '../Services/ComprehensiveEndToEndEncryptionService.js';

/**
 * End-to-End Encryption Handler
 * Handles E2E encryption requests via socket events
 */

class EndToEndEncryptionHandler {
  /**
   * Handle generate key pair request
   */
  static async handleGenerateKeyPair(socket, data, callback) {
    try {
      const { userId } = data;
      
      // Validate input
      if (!userId) {
        if (callback) {
          callback({
            success: false,
            error: 'User ID is required'
          });
        }
        return;
      }
      
      // Generate key pair
      const keyPair = await ComprehensiveEndToEndEncryptionService.generateKeyPair(userId);
      
      if (callback) {
        callback({
          success: true,
          publicKey: keyPair.publicKey
        });
      }
    } catch (error) {
      console.error('Key pair generation error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle encrypt message request
   */
  static async handleEncryptMessage(socket, data, callback) {
    try {
      const { senderId, recipientId, content, metadata } = data;
      
      // Validate input
      if (!senderId || !recipientId || !content) {
        if (callback) {
          callback({
            success: false,
            error: 'Sender ID, recipient ID, and content are required'
          });
        }
        return;
      }
      
      // Create encrypted message
      const encryptedMessage = await ComprehensiveEndToEndEncryptionService.createEncryptedMessage(
        senderId,
        recipientId,
        content,
        metadata || {}
      );
      
      if (callback) {
        callback({
          success: true,
          encryptedMessage
        });
      }
    } catch (error) {
      console.error('Message encryption error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle decrypt message request
   */
  static async handleDecryptMessage(socket, data, callback) {
    try {
      const { encryptedMessage, recipientId } = data;
      
      // Validate input
      if (!encryptedMessage || !recipientId) {
        if (callback) {
          callback({
            success: false,
            error: 'Encrypted message and recipient ID are required'
          });
        }
        return;
      }
      
      // Decrypt message
      const decryptedMessage = await ComprehensiveEndToEndEncryptionService.decryptMessageEnvelope(
        encryptedMessage,
        recipientId
      );
      
      if (callback) {
        callback({
          success: true,
          decryptedMessage
        });
      }
    } catch (error) {
      console.error('Message decryption error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle get public key request
   */
  static handleGetPublicKey(socket, data, callback) {
    try {
      const { userId } = data;
      
      if (!userId) {
        if (callback) {
          callback({
            success: false,
            error: 'User ID is required'
          });
        }
        return;
      }
      
      const publicKey = ComprehensiveEndToEndEncryptionService.getPublicKey(userId);
      
      if (callback) {
        callback({
          success: true,
          publicKey
        });
      }
    } catch (error) {
      console.error('Get public key error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
}

export default EndToEndEncryptionHandler;