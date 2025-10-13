import crypto from 'crypto';
import { promisify } from 'util';

/**
 * @fileoverview Async crypto utilities to replace synchronous crypto operations
 * @module AsyncCrypto
 */

// Promisify crypto functions
const pbkdf2Async = promisify(crypto.pbkdf2);
const randomBytesAsync = promisify(crypto.randomBytes);

class AsyncCrypto {
  /**
   * Async version of pbkdf2Sync
   * @param {string|Buffer} password - Password or key
   * @param {string|Buffer} salt - Salt
   * @param {number} iterations - Number of iterations
   * @param {number} keylen - Key length
   * @param {string} digest - Digest algorithm
   * @returns {Promise<Buffer>} Derived key
   */
  static async pbkdf2(password, salt, iterations, keylen, digest) {
    try {
      return await pbkdf2Async(password, salt, iterations, keylen, digest);
    } catch (error) {
      throw new Error(`PBKDF2 operation failed: ${error.message}`);
    }
  }

  /**
   * Async version of randomBytes
   * @param {number} size - Number of bytes to generate
   * @returns {Promise<Buffer>} Random bytes
   */
  static async randomBytes(size) {
    try {
      return await randomBytesAsync(size);
    } catch (error) {
      throw new Error(`Random bytes generation failed: ${error.message}`);
    }
  }

  /**
   * Generate secure token hash from token value using async crypto
   * @param {string} tokenValue - Token value to hash
   * @returns {Promise<Object>} Object containing salt and hash
   */
  static async hashToken(tokenValue) {
    try {
      const saltBuffer = await this.randomBytes(32);
      const salt = saltBuffer.toString('hex');
      const hashBuffer = await this.pbkdf2(tokenValue, salt, 100000, 64, 'sha512');
      const hash = hashBuffer.toString('hex');
      
      return {
        salt,
        hash,
        algorithm: 'pbkdf2-sha512'
      };
    } catch (error) {
      throw new Error(`Token hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify token against stored hash using async crypto
   * @param {string} tokenValue - Token value to verify
   * @param {string} salt - Salt used for hashing
   * @param {string} storedHash - Stored hash to compare against
   * @returns {Promise<boolean>} Whether token is valid
   */
  static async verifyToken(tokenValue, salt, storedHash) {
    if (!salt || !storedHash) {
      return false;
    }
    
    try {
      const hashBuffer = await this.pbkdf2(tokenValue, salt, 100000, 64, 'sha512');
      const hash = hashBuffer.toString('hex');
      
      // timingSafeEqual is synchronous but fast, so it's acceptable
      return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hash, 'hex'));
    } catch (error) {
      console.error('Token hash verification error:', error.message);
      return false;
    }
  }

  /**
   * Generate device fingerprint hash
   * @param {string} userAgent - User agent string
   * @param {string} ipAddress - IP address
   * @param {string} additionalData - Additional data to include in fingerprint
   * @returns {string} Device fingerprint hash
   */
  static generateDeviceHash(userAgent, ipAddress, additionalData = '') {
    const fingerprint = `${userAgent}|${ipAddress}|${additionalData}|${Date.now()}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Generate secure random string
   * @param {number} length - Length of string to generate
   * @param {string} encoding - Encoding format (hex, base64, etc.)
   * @returns {Promise<string>} Random string
   */
  static async generateRandomString(length = 32, encoding = 'hex') {
    try {
      const buffer = await this.randomBytes(length);
      return buffer.toString(encoding);
    } catch (error) {
      throw new Error(`Random string generation failed: ${error.message}`);
    }
  }

  /**
   * Derive key using PBKDF2 with async crypto
   * @param {string} secret - Secret to derive key from
   * @param {string} salt - Salt for key derivation
   * @param {number} iterations - Number of iterations
   * @param {number} keylen - Key length
   * @param {string} digest - Digest algorithm
   * @returns {Promise<Buffer>} Derived key
   */
  static async deriveKey(secret, salt, iterations = 100000, keylen = 64, digest = 'sha512') {
    try {
      return await this.pbkdf2(secret, salt, iterations, keylen, digest);
    } catch (error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }
}

export default AsyncCrypto;