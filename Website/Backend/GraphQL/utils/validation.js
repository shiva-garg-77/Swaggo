/**
 * VALIDATION UTILITIES
 *
 * Comprehensive input validation for GraphQL operations with:
 * - Field-level validation
 * - Type checking
 * - Length validation
 * - Format validation
 * - Regex validation
 * - Injection prevention (SQL, Regex, XSS)
 *
 * @fileoverview Validation utilities for all GraphQL inputs
 * @version 1.0.0
 * @author Swaggo Development Team
 */

import { ValidationError } from './errors.js';

/**
 * Validate profile update input
 *
 * @param {Object} input - Profile update input
 * @throws {ValidationError} If validation fails
 * @returns {boolean} True if valid
 *
 * @example
 * Validators.validateProfileUpdate({
 *   username: 'johndoe',
 *   bio: 'Hello world',
 *   email: 'john@example.com'
 * });
 */
const validateProfileUpdate = (input) => {
  const errors = [];

  // Username validation
  if (input.username !== undefined) {
    if (typeof input.username !== 'string') {
      errors.push({ field: 'username', message: 'Username must be a string' });
    } else if (input.username.length < 3 || input.username.length > 30) {
      errors.push({
        field: 'username',
        message: 'Username must be between 3 and 30 characters',
      });
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(input.username)) {
      errors.push({
        field: 'username',
        message: 'Username can only contain letters, numbers, dots, hyphens, and underscores',
      });
    }
  }

  // Name validation
  if (input.name !== undefined) {
    if (typeof input.name !== 'string') {
      errors.push({ field: 'name', message: 'Name must be a string' });
    } else if (input.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name cannot exceed 100 characters',
      });
    }
  }

  // Bio validation
  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') {
      errors.push({ field: 'bio', message: 'Bio must be a string' });
    } else if (input.bio.length > 500) {
      errors.push({
        field: 'bio',
        message: 'Bio cannot exceed 500 characters',
      });
    }
  }

  // Email validation
  if (input.email !== undefined) {
    if (typeof input.email !== 'string') {
      errors.push({ field: 'email', message: 'Email must be a string' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  // Profile picture validation
  if (input.profilePic !== undefined && input.profilePic) {
    if (typeof input.profilePic !== 'string') {
      errors.push({ field: 'profilePic', message: 'Profile picture must be a URL string' });
    } else if (!/^https?:\/\/.+/.test(input.profilePic)) {
      errors.push({
        field: 'profilePic',
        message: 'Profile picture must be a valid URL',
      });
    }
  }

  // If there are validation errors, throw
  if (errors.length > 0) {
    throw new ValidationError(
      `Validation failed: ${errors.map((e) => e.message).join(', ')}`,
      null,
      errors
    );
  }

  return true;
};

/**
 * Validate post creation input
 *
 * @param {Object} input - Post creation input
 * @throws {ValidationError} If validation fails
 * @returns {boolean} True if valid
 *
 * @example
 * Validators.validateCreatePost({
 *   postUrl: 'https://example.com/image.jpg',
 *   postType: 'image',
 *   profileid: 'user123'
 * });
 */
const validateCreatePost = (input) => {
  // Required fields validation
  if (!input.postUrl || !input.postType || !input.profileid) {
    throw new ValidationError(
      'Required fields missing: postUrl, postType, and profileid are required'
    );
  }

  // PostType validation
  const validPostTypes = ['image', 'video', 'text', 'carousel', 'IMAGE', 'VIDEO', 'TEXT'];
  if (!validPostTypes.includes(input.postType)) {
    throw new ValidationError(
      'Invalid postType. Must be one of: image, video, text, carousel',
      'postType'
    );
  }

  // Caption validation
  if (input.caption !== undefined && input.caption !== null) {
    if (typeof input.caption !== 'string') {
      throw new ValidationError('Caption must be a string', 'caption');
    }
    if (input.caption.length > 2200) {
      throw new ValidationError('Caption cannot exceed 2200 characters', 'caption');
    }
  }

  // Description validation
  if (input.Description !== undefined && input.Description !== null) {
    if (typeof input.Description !== 'string') {
      throw new ValidationError('Description must be a string', 'Description');
    }
    if (input.Description.length > 2200) {
      throw new ValidationError('Description cannot exceed 2200 characters', 'Description');
    }
  }

  // Tags validation
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) {
      throw new ValidationError('Tags must be an array', 'tags');
    }
    if (input.tags.length > 30) {
      throw new ValidationError('Cannot have more than 30 tags', 'tags');
    }
  }

  // Location validation
  if (input.location !== undefined && input.location !== null) {
    if (typeof input.location !== 'string') {
      throw new ValidationError('Location must be a string', 'location');
    }
    if (input.location.length > 100) {
      throw new ValidationError('Location cannot exceed 100 characters', 'location');
    }
  }

  return true;
};

/**
 * Validate comment creation input
 *
 * @param {Object} input - Comment input
 * @throws {ValidationError} If validation fails
 * @returns {boolean} True if valid
 */
const validateCreateComment = (input) => {
  // Comment text is required
  if (!input.text || typeof input.text !== 'string') {
    throw new ValidationError('Comment text is required and must be a string', 'text');
  }

  if (input.text.trim().length === 0) {
    throw new ValidationError('Comment text cannot be empty', 'text');
  }

  if (input.text.length > 2200) {
    throw new ValidationError(
      'Comment cannot exceed 2200 characters',
      'text'
    );
  }

  return true;
};

/**
 * Sanitize search query to prevent regex injection
 *
 * @param {string} query - Search query string
 * @throws {ValidationError} If query is invalid
 * @returns {string} Sanitized query
 *
 * @example
 * const safeQuery = Validators.sanitizeSearchQuery('user input.*');
 * // Returns: 'user input\\.\\*'
 */
const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    throw new ValidationError(
      'Search query must be a non-empty string',
      'query'
    );
  }

  // Remove special regex characters to prevent injection
  const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (sanitized.trim().length < 2) {
    throw new ValidationError(
      'Search query must be at least 2 characters',
      'query'
    );
  }

  if (sanitized.length > 100) {
    throw new ValidationError(
      'Search query cannot exceed 100 characters',
      'query'
    );
  }

  return sanitized;
};

/**
 * Validate pagination parameters
 *
 * @param {number} limit - Number of items to return
 * @param {number} offset - Number of items to skip
 * @throws {ValidationError} If parameters are invalid
 * @returns {Object} Validated parameters
 */
const validatePagination = (limit = 20, offset = 0) => {
  const validatedLimit = parseInt(limit, 10);
  const validatedOffset = parseInt(offset, 10);

  if (isNaN(validatedLimit) || validatedLimit < 1) {
    throw new ValidationError('Limit must be a positive integer', 'limit');
  }

  if (validatedLimit > 100) {
    throw new ValidationError('Limit cannot exceed 100', 'limit');
  }

  if (isNaN(validatedOffset) || validatedOffset < 0) {
    throw new ValidationError('Offset must be a non-negative integer', 'offset');
  }

  return {
    limit: validatedLimit,
    offset: validatedOffset,
  };
};

/**
 * Validate ID format
 *
 * @param {string} id - ID to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @throws {ValidationError} If ID is invalid
 * @returns {boolean} True if valid
 */
const validateID = (id, fieldName = 'id') => {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${fieldName} must be a non-empty string`, fieldName);
  }

  if (id.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }

  // Basic sanity check - adjust based on your ID format
  if (id.length > 100) {
    throw new ValidationError(`${fieldName} is too long`, fieldName);
  }

  return true;
};

/**
 * Validate file upload
 *
 * @param {Object} file - Uploaded file object
 * @param {Object} options - Validation options
 * @throws {ValidationError} If file is invalid
 * @returns {boolean} True if valid
 */
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
  } = options;

  if (!file) {
    throw new ValidationError('No file provided', 'file');
  }

  const { mimetype, size } = file;

  // Check file type
  if (!allowedTypes.includes(mimetype)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      'file'
    );
  }

  // Check file size
  if (size && size > maxSize) {
    throw new ValidationError(
      `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      'file'
    );
  }

  return true;
};

/**
 * Validate array input
 *
 * @param {Array} arr - Array to validate
 * @param {string} fieldName - Field name for errors
 * @param {Object} options - Validation options
 * @throws {ValidationError} If array is invalid
 * @returns {boolean} True if valid
 */
const validateArray = (arr, fieldName, options = {}) => {
  const { maxLength = 100, minLength = 0, required = false } = options;

  if (required && !arr) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  if (!arr) {
    return true; // Optional and not provided
  }

  if (!Array.isArray(arr)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  if (arr.length < minLength) {
    throw new ValidationError(
      `${fieldName} must contain at least ${minLength} items`,
      fieldName
    );
  }

  if (arr.length > maxLength) {
    throw new ValidationError(
      `${fieldName} cannot contain more than ${maxLength} items`,
      fieldName
    );
  }

  return true;
};

/**
 * Sanitize HTML to prevent XSS
 *
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Export all validators
 */
export const Validators = {
  validateProfileUpdate,
  validateCreatePost,
  validateCreateComment,
  sanitizeSearchQuery,
  validatePagination,
  validateID,
  validateFileUpload,
  validateArray,
  sanitizeHTML,
};

export default Validators;
