/**
 * Validation Service
 * Provides common validation functions for the application
 */

class ValidationService {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether the email is valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with isValid and message
   */
  validatePassword(password) {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/\d/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }

    return { isValid: true, message: 'Password is valid' };
  }

  /**
   * Validate file type
   * @param {File} file - File to validate
   * @param {Array<string>} allowedTypes - Allowed MIME types
   * @returns {boolean} - Whether the file type is valid
   */
  validateFileType(file, allowedTypes) {
    if (!file || !file.type) return false;
    return allowedTypes.includes(file.type);
  }

  /**
   * Validate file size
   * @param {File} file - File to validate
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {boolean} - Whether the file size is valid
   */
  validateFileSize(file, maxSize) {
    if (!file || !file.size) return false;
    return file.size <= maxSize;
  }

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {Object} - Validation result with isValid and message
   */
  validateUsername(username) {
    if (!username) {
      return { isValid: false, message: 'Username is required' };
    }

    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }

    if (username.length > 30) {
      return { isValid: false, message: 'Username must be no more than 30 characters long' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }

    return { isValid: true, message: 'Username is valid' };
  }

  /**
   * Validate required field
   * @param {any} value - Value to validate
   * @returns {boolean} - Whether the field is valid
   */
  validateRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether the URL is valid
   */
  validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const validationService = new ValidationService();

export default validationService;