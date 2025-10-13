/**
 * MongoDB Sanitizer Utility
 * 
 * This utility provides functions to sanitize user inputs before using them in MongoDB queries
 * to prevent injection attacks and ensure data integrity.
 */

class MongoDBSanitizer {
  /**
   * Sanitizes a string value for safe use in MongoDB queries
   * @param {string} value - The value to sanitize
   * @returns {string} - The sanitized value
   */
  static sanitizeString(value) {
    if (!value || typeof value !== 'string') return '';
    
    // Remove null bytes and other potentially dangerous characters
    return value
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\$/g, '') // Remove dollar signs (MongoDB operators)
      .replace(/{/g, '')  // Remove opening braces
      .replace(/}/g, '')  // Remove closing braces
      .trim();
  }

  /**
   * Validates and sanitizes an array of strings
   * @param {Array} array - The array to sanitize
   * @returns {Array} - The sanitized array
   */
  static sanitizeStringArray(array) {
    if (!Array.isArray(array)) return [];
    
    return array
      .filter(item => typeof item === 'string' && item.length > 0)
      .map(item => this.sanitizeString(item))
      .filter(item => item.length > 0);
  }

  /**
   * Validates if a string is a valid MongoDB ObjectId
   * @param {string} id - The ID to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    
    // Basic format validation (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return false;
    
    return true;
  }

  /**
   * Validates and sanitizes a MongoDB ObjectId
   * @param {string} id - The ID to validate and sanitize
   * @returns {string|null} - The sanitized ID or null if invalid
   */
  static sanitizeObjectId(id) {
    if (!id || typeof id !== 'string') return null;
    
    // Remove any non-hex characters
    const sanitized = id.replace(/[^0-9a-fA-F]/g, '');
    
    // Check if it's a valid ObjectId format
    if (sanitized.length === 24) {
      return sanitized;
    }
    
    return null;
  }

  /**
   * Sanitizes a query object to prevent MongoDB injection
   * @param {Object} query - The query object to sanitize
   * @returns {Object} - The sanitized query object
   */
  static sanitizeQuery(query) {
    if (!query || typeof query !== 'object') return {};
    
    const sanitizedQuery = {};
    
    for (const [key, value] of Object.entries(query)) {
      // Skip internal MongoDB operators
      if (key.startsWith('$')) {
        console.warn(`⚠️ Skipping MongoDB operator in query: ${key}`);
        continue;
      }
      
      // Sanitize based on value type
      if (typeof value === 'string') {
        sanitizedQuery[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitizedQuery[key] = this.sanitizeStringArray(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitizedQuery[key] = this.sanitizeQuery(value);
      } else {
        // For other types (numbers, booleans, etc.), use as-is
        sanitizedQuery[key] = value;
      }
    }
    
    return sanitizedQuery;
  }

  /**
   * Creates a safe query for finding documents by profile ID
   * @param {string} profileId - The profile ID to query by
   * @returns {Object|null} - The safe query object or null if invalid
   */
  static createProfileIdQuery(profileId) {
    const sanitizedId = this.sanitizeObjectId(profileId);
    if (!sanitizedId) {
      console.warn(`⚠️ Invalid profile ID provided: ${profileId}`);
      return null;
    }
    
    return { profileid: sanitizedId };
  }

  /**
   * Creates a safe query for finding documents by chat ID
   * @param {string} chatId - The chat ID to query by
   * @returns {Object|null} - The safe query object or null if invalid
   */
  static createChatIdQuery(chatId) {
    const sanitizedId = this.sanitizeObjectId(chatId);
    if (!sanitizedId) {
      console.warn(`⚠️ Invalid chat ID provided: ${chatId}`);
      return null;
    }
    
    return { chatid: sanitizedId };
  }

  /**
   * Creates a safe query for finding documents by message ID
   * @param {string} messageId - The message ID to query by
   * @returns {Object|null} - The safe query object or null if invalid
   */
  static createMessageIdQuery(messageId) {
    const sanitizedId = this.sanitizeObjectId(messageId);
    if (!sanitizedId) {
      console.warn(`⚠️ Invalid message ID provided: ${messageId}`);
      return null;
    }
    
    return { messageid: sanitizedId };
  }

  /**
   * Creates a safe $in query for an array of IDs
   * @param {Array} ids - Array of IDs to include in the query
   * @returns {Object|null} - The safe $in query object or null if invalid
   */
  static createInQuery(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      console.warn('⚠️ Empty or invalid ID array provided for $in query');
      return null;
    }
    
    const sanitizedIds = ids
      .map(id => this.sanitizeObjectId(id))
      .filter(id => id !== null);
    
    if (sanitizedIds.length === 0) {
      console.warn('⚠️ No valid IDs found after sanitization');
      return null;
    }
    
    return { $in: sanitizedIds };
  }

  /**
   * Validates and sanitizes pagination parameters
   * @param {number} limit - The limit parameter
   * @param {number} skip - The skip parameter
   * @param {number} maxLimit - Maximum allowed limit (default: 100)
   * @returns {Object} - Validated limit and skip values
   */
  static sanitizePagination(limit, skip, maxLimit = 100) {
    const validatedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), maxLimit);
    const validatedSkip = Math.max(parseInt(skip) || 0, 0);
    
    return {
      limit: validatedLimit,
      skip: validatedSkip
    };
  }
}

export default MongoDBSanitizer;