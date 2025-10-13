/**
 * @fileoverview Tests for ValidationUtils helper functions
 * @version 1.0.0
 */

import {
  validateProfileId,
  validatePostId,
  sanitizeText,
  validateEmail,
  validateUsername,
  validatePassword,
  validatePostContent,
  validatePagination,
  validateFileUpload,
  rateLimitKey,
  createStandardError,
  formatErrorResponse
} from '../ValidationUtils.js';

import validator from 'validator';

// Mock validator
jest.mock('validator', () => ({
  isUUID: jest.fn(),
  escape: jest.fn(text => text),
  isEmail: jest.fn(),
  normalizeEmail: jest.fn(email => email),
  isURL: jest.fn(),
  trim: jest.fn(text => text)
}));

describe('ValidationUtils', () => {
  describe('ID Validation', () => {
    test('should validate profile ID correctly', () => {
      validator.isUUID.mockReturnValue(true);
      
      expect(() => validateProfileId('123e4567-e89b-12d3-a456-426614174000')).not.toThrow();
      expect(validator.isUUID).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 4);
    });

    test('should throw error for invalid profile ID', () => {
      validator.isUUID.mockReturnValue(false);
      
      expect(() => validateProfileId('invalid-id')).toThrow('Profile ID must be a valid UUID');
      expect(() => validateProfileId(null)).toThrow('Invalid profile ID format');
      expect(() => validateProfileId('')).toThrow('Invalid profile ID format');
    });

    test('should validate post ID correctly', () => {
      validator.isUUID.mockReturnValue(true);
      
      expect(() => validatePostId('123e4567-e89b-12d3-a456-426614174000')).not.toThrow();
    });

    test('should throw error for invalid post ID', () => {
      validator.isUUID.mockReturnValue(false);
      
      expect(() => validatePostId('invalid-id')).toThrow('Post ID must be a valid UUID');
      expect(() => validatePostId(null)).toThrow('Invalid post ID format');
    });
  });

  describe('Text Sanitization', () => {
    test('should sanitize text correctly', () => {
      validator.escape.mockImplementation(text => text.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      validator.trim.mockImplementation(text => text.trim());
      
      const result = sanitizeText('<script>alert("xss")</script> Hello World  ');
      
      expect(validator.escape).toHaveBeenCalledWith(' <script>alert("xss")</script> Hello World  ');
      expect(result).toBe('&lt;script&gt;alert("xss")&lt;/script&gt; Hello World');
    });

    test('should handle text length limits', () => {
      const longText = 'a'.repeat(6000);
      
      expect(() => sanitizeText(longText, 5000)).toThrow('Text content exceeds maximum length of 5000 characters');
    });

    test('should handle empty or invalid text', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(123)).toBe('');
    });
  });

  describe('Email Validation', () => {
    test('should validate email correctly', () => {
      validator.isEmail.mockReturnValue(true);
      validator.normalizeEmail.mockImplementation(email => email.toLowerCase());
      
      const result = validateEmail('Test@Example.com');
      
      expect(validator.isEmail).toHaveBeenCalledWith('Test@Example.com');
      expect(validator.normalizeEmail).toHaveBeenCalledWith('Test@Example.com', {
        gmail_remove_dots: true,
        gmail_lowercase: true
      });
      expect(result).toBe('test@example.com');
    });

    test('should throw error for invalid email', () => {
      validator.isEmail.mockReturnValue(false);
      
      expect(() => validateEmail('invalid-email')).toThrow('Invalid email format');
      expect(() => validateEmail(null)).toThrow('Invalid email format');
      expect(() => validateEmail('')).toThrow('Invalid email format');
    });
  });

  describe('Username Validation', () => {
    test('should validate username correctly', () => {
      validator.trim.mockImplementation(text => text.trim());
      
      const result = validateUsername('  TestUser123  ');
      
      expect(result).toBe('TestUser123');
    });

    test('should validate username length constraints', () => {
      expect(() => validateUsername('ab')).toThrow('Username must be between 3 and 30 characters');
      expect(() => validateUsername('a'.repeat(31))).toThrow('Username must be between 3 and 30 characters');
    });

    test('should validate username character constraints', () => {
      expect(() => validateUsername('test user')).toThrow('Username can only contain letters, numbers, dots, underscores, and hyphens');
      expect(() => validateUsername('test@user')).toThrow('Username can only contain letters, numbers, dots, underscores, and hyphens');
      expect(() => validateUsername('test#user')).toThrow('Username can only contain letters, numbers, dots, underscores, and hyphens');
    });

    test('should allow valid username characters', () => {
      expect(() => validateUsername('test.user')).not.toThrow();
      expect(() => validateUsername('test_user')).not.toThrow();
      expect(() => validateUsername('test-user')).not.toThrow();
      expect(() => validateUsername('testUser123')).not.toThrow();
    });

    test('should throw error for missing username', () => {
      expect(() => validateUsername(null)).toThrow('Username is required');
      expect(() => validateUsername(undefined)).toThrow('Username is required');
      expect(() => validateUsername('')).toThrow('Username is required');
    });
  });

  describe('Password Validation', () => {
    test('should validate password length', () => {
      expect(() => validatePassword('1234567')).toThrow('Password must be between 8 and 128 characters');
      expect(() => validatePassword('a'.repeat(129))).toThrow('Password must be between 8 and 128 characters');
      expect(() => validatePassword('ValidPass123')).not.toThrow();
    });

    test('should reject weak passwords', () => {
      expect(() => validatePassword('password')).toThrow('Password is too weak or common');
      expect(() => validatePassword('password123')).toThrow('Password is too weak or common');
      expect(() => validatePassword('12345678')).toThrow('Password is too weak or common');
      expect(() => validatePassword('qwerty123')).toThrow('Password is too weak or common');
      expect(() => validatePassword('admin123')).toThrow('Password is too weak or common');
    });

    test('should accept strong passwords', () => {
      expect(() => validatePassword('MyStr0ng!P@ssw0rd')).not.toThrow();
      expect(() => validatePassword('ValidPassword123!')).not.toThrow();
      expect(() => validatePassword('Another$tr0ngP@ss')).not.toThrow();
    });

    test('should throw error for missing password', () => {
      expect(() => validatePassword(null)).toThrow('Password is required');
      expect(() => validatePassword(undefined)).toThrow('Password is required');
      expect(() => validatePassword('')).toThrow('Password is required');
    });
  });

  describe('Post Content Validation', () => {
    test('should validate text post content', () => {
      validator.escape.mockImplementation(text => text);
      validator.trim.mockImplementation(text => text.trim());
      
      const result = validatePostContent('Hello World', 'text');
      
      expect(result).toBe('Hello World');
    });

    test('should validate text post content length', () => {
      const longContent = 'a'.repeat(10001);
      
      expect(() => validatePostContent(longContent, 'text')).toThrow();
    });

    test('should validate media URLs', () => {
      validator.isURL.mockReturnValue(true);
      
      const result = validatePostContent('https://example.com/image.jpg', 'image');
      
      expect(validator.isURL).toHaveBeenCalledWith('https://example.com/image.jpg', {
        protocols: ['http', 'https'],
        require_tld: false
      });
      expect(result).toBe('https://example.com/image.jpg');
    });

    test('should reject invalid media URLs', () => {
      validator.isURL.mockReturnValue(false);
      
      expect(() => validatePostContent('invalid-url', 'image')).toThrow('Invalid media URL format');
    });

    test('should validate video content', () => {
      validator.isURL.mockReturnValue(true);
      
      expect(() => validatePostContent('https://example.com/video.mp4', 'video')).not.toThrow();
    });

    test('should throw error for invalid post type', () => {
      expect(() => validatePostContent('content', 'invalid')).toThrow('Invalid post type');
    });

    test('should throw error for missing content', () => {
      expect(() => validatePostContent(null)).toThrow('Post content is required');
      expect(() => validatePostContent(undefined)).toThrow('Post content is required');
      expect(() => validatePostContent('')).toThrow('Post content is required');
    });
  });

  describe('Pagination Validation', () => {
    test('should validate pagination parameters', () => {
      const result = validatePagination(25, 50);
      
      expect(result).toEqual({ limit: 25, offset: 50 });
    });

    test('should enforce limit boundaries', () => {
      const result1 = validatePagination(0, 0);
      expect(result1.limit).toBe(1); // Minimum limit
      
      const result2 = validatePagination(150, 0);
      expect(result2.limit).toBe(100); // Maximum limit
      
      const result3 = validatePagination(-10, 0);
      expect(result3.limit).toBe(1); // Negative becomes minimum
    });

    test('should enforce offset boundaries', () => {
      const result1 = validatePagination(10, -5);
      expect(result1.offset).toBe(0); // Negative becomes 0
      
      const result2 = validatePagination(10, 'invalid');
      expect(result2.offset).toBe(0); // Invalid becomes 0
    });

    test('should use default values', () => {
      const result = validatePagination();
      
      expect(result).toEqual({ limit: 10, offset: 0 });
    });
  });

  describe('File Upload Validation', () => {
    test('should validate file size', () => {
      const validFile = { size: 5 * 1024 * 1024, mimetype: 'image/jpeg' }; // 5MB
      
      expect(() => validateFileUpload(validFile)).not.toThrow();
    });

    test('should reject oversized files', () => {
      const oversizedFile = { size: 15 * 1024 * 1024, mimetype: 'image/jpeg' }; // 15MB
      
      expect(() => validateFileUpload(oversizedFile)).toThrow('File size exceeds 10MB limit');
    });

    test('should validate allowed file types', () => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'audio/mpeg',
        'audio/wav'
      ];
      
      allowedTypes.forEach(mimetype => {
        const file = { size: 1024, mimetype };
        expect(() => validateFileUpload(file)).not.toThrow();
      });
    });

    test('should reject disallowed file types', () => {
      const disallowedFile = { size: 1024, mimetype: 'application/exe' };
      
      expect(() => validateFileUpload(disallowedFile)).toThrow('File type not allowed');
    });

    test('should throw error for missing file', () => {
      expect(() => validateFileUpload(null)).toThrow('File is required');
      expect(() => validateFileUpload(undefined)).toThrow('File is required');
    });
  });

  describe('Utility Functions', () => {
    test('should generate rate limit key', () => {
      const key = rateLimitKey('user123', 'create_post');
      
      expect(key).toBe('rate_limit:create_post:user123');
    });

    test('should create standard error', () => {
      const error = createStandardError('Test error', 'TEST_ERROR', 422);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(422);
    });

    test('should format error response', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      
      const response = formatErrorResponse(error);
      
      expect(response).toEqual({
        success: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
          timestamp: expect.any(String)
        }
      });
      
      // Check timestamp format
      expect(Date.parse(response.error.timestamp)).not.toBeNaN();
    });

    test('should handle error without code', () => {
      const error = new Error('Test error');
      
      const response = formatErrorResponse(error);
      
      expect(response.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Integration Tests', () => {
    test('should validate complete user registration data', () => {
      validator.isUUID.mockReturnValue(true);
      validator.isEmail.mockReturnValue(true);
      validator.normalizeEmail.mockImplementation(email => email.toLowerCase());
      validator.trim.mockImplementation(text => text.trim());
      
      // Valid registration data
      const profileId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'Test@Example.com';
      const username = '  TestUser123  ';
      const password = 'MyStr0ng!P@ssw0rd';
      
      expect(() => validateProfileId(profileId)).not.toThrow();
      expect(validateEmail(email)).toBe('test@example.com');
      expect(validateUsername(username)).toBe('TestUser123');
      expect(() => validatePassword(password)).not.toThrow();
    });

    test('should validate complete post creation flow', () => {
      validator.isUUID.mockReturnValue(true);
      validator.escape.mockImplementation(text => text);
      validator.trim.mockImplementation(text => text.trim());
      validator.isURL.mockReturnValue(true);
      
      // Valid post data
      const postId = '123e4567-e89b-12d3-a456-426614174000';
      const content = 'Hello World';
      const pagination = validatePagination(20, 40);
      
      expect(() => validatePostId(postId)).not.toThrow();
      expect(validatePostContent(content, 'text')).toBe('Hello World');
      expect(pagination).toEqual({ limit: 20, offset: 40 });
    });

    test('should handle file upload validation with pagination', () => {
      const file = { size: 2 * 1024 * 1024, mimetype: 'image/jpeg' }; // 2MB JPEG
      const pagination = validatePagination(50, 100);
      
      expect(() => validateFileUpload(file)).not.toThrow();
      expect(pagination).toEqual({ limit: 50, offset: 100 });
    });

    test('should generate proper error responses for validation failures', () => {
      // Test various validation failures
      const testCases = [
        { fn: () => validateProfileId('invalid'), expectedCode: 'BAD_REQUEST' },
        { fn: () => validateEmail('invalid'), expectedCode: 'BAD_REQUEST' },
        { fn: () => validateUsername('ab'), expectedCode: 'BAD_REQUEST' },
        { fn: () => validatePassword('123'), expectedCode: 'BAD_REQUEST' }
      ];
      
      testCases.forEach(({ fn, expectedCode }) => {
        try {
          fn();
        } catch (error) {
          const response = formatErrorResponse(error);
          expect(response.success).toBe(false);
          expect(response.error.code).toBe(expectedCode);
          expect(response.error.message).toBeTruthy();
          expect(Date.parse(response.error.timestamp)).not.toBeNaN();
        }
      });
    });
  });
});