/**
 * Frontend Security Configuration
 * Provides client-side security utilities and rate limiting
 */

/**
 * Client-side rate limiter for API calls
 */
class RateLimiter {
  static store = {};

  /**
   * Check if a key is rate limited
   */
  static isRateLimited(key, maxRequests, windowMs) {
    const now = Date.now();
    const record = this.store[key];

    if (!record) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return false;
    }

    // Reset if window expired
    if (now > record.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return false;
    }

    // Increment count
    record.count++;
    
    return record.count > maxRequests;
  }

  /**
   * Get remaining requests for a key
   */
  static getRemainingRequests(key, maxRequests) {
    const record = this.store[key];
    if (!record) return maxRequests;

    const remaining = maxRequests - record.count;
    return Math.max(0, remaining);
  }

  /**
   * Clear rate limit for a key
   */
  static clearRateLimit(key) {
    delete this.store[key];
  }

  /**
   * Clear all rate limits
   */
  static clearAll() {
    this.store = {};
  }
}

/**
 * Input sanitizer for client-side data validation
 */
class InputSanitizer {
  /**
   * Sanitize and validate email
   */
  static sanitizeEmail(email) {
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }

    const sanitized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Remove potentially dangerous characters
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
      .trim();

    if (sanitized.length > maxLength) {
      throw new Error(`Input too long. Maximum ${maxLength} characters allowed`);
    }

    return sanitized;
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url) {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }

    const sanitized = url.trim();
    
    // Check if it's a valid URL
    try {
      const parsedUrl = new URL(sanitized);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }
      
      return parsedUrl.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Sanitize number input
   */
  static sanitizeNumber(input, min, max) {
    const num = Number(input);
    
    if (isNaN(num)) {
      throw new Error('Input must be a valid number');
    }

    if (min !== undefined && num < min) {
      throw new Error(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new Error(`Number must be at most ${max}`);
    }

    return num;
  }

  /**
   * Sanitize boolean input
   */
  static sanitizeBoolean(input) {
    if (typeof input === 'boolean') {
      return input;
    }

    if (typeof input === 'string') {
      const lower = input.toLowerCase().trim();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }

    if (typeof input === 'number') {
      return input !== 0;
    }

    throw new Error('Input must be a valid boolean value');
  }

  /**
   * Escape HTML characters
   */
  static escapeHtml(input) {
    if (typeof input !== 'string') {
      return String(input);
    }

    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
  }

  /**
   * Validate and sanitize phone number
   */
  static sanitizePhoneNumber(phone) {
    if (typeof phone !== 'string') {
      throw new Error('Phone number must be a string');
    }

    // Remove all non-digit characters except + at start
    const sanitized = phone.replace(/[^\d+]/g, '');
    
    // Basic validation (adjust regex as needed for your requirements)
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,15}$/;
    
    if (!phoneRegex.test(sanitized)) {
      throw new Error('Invalid phone number format');
    }

    return sanitized;
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName) {
    if (typeof fileName !== 'string') {
      throw new Error('File name must be a string');
    }

    // Remove dangerous characters
    const sanitized = fileName
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .replace(/[<>:"|\\?\*]/g, '_') // Replace invalid characters
      .replace(/\.\.+/g, '.') // Replace multiple dots
      .replace(/^\.|\.$/, '') // Remove leading/trailing dots
      .trim();

    // Ensure it's not empty and not too long
    if (!sanitized || sanitized.length === 0) {
      return 'file';
    }

    if (sanitized.length > 255) {
      const lastDot = sanitized.lastIndexOf('.');
      if (lastDot !== -1) {
        const extension = sanitized.substring(lastDot);
        const nameWithoutExt = sanitized.substring(0, lastDot);
        return nameWithoutExt.substring(0, 255 - extension.length) + extension;
      } else {
        return sanitized.substring(0, 255);
      }
    }

    return sanitized;
  }
}

/**
 * Security utilities for frontend
 */
class SecurityUtils {
  /**
   * Generate a secure random string
   */
  static generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Check if content might contain malicious patterns
   */
  static containsMaliciousPatterns(content) {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /file:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<link/i,
      /<meta/i
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Validate content security
   */
  static validateContentSecurity(content) {
    const issues = [];

    if (this.containsMaliciousPatterns(content)) {
      issues.push('Content contains potentially malicious patterns');
    }

    if (content.length > 50000) {
      issues.push('Content is too long');
    }

    return {
      isSecure: issues.length === 0,
      issues
    };
  }
}

/**
 * File upload security for frontend validation
 */
class FileUploadSecurity {
  static allowedImageTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
  ];

  static allowedDocumentTypes = [
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  static dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar',
    '.js', '.vbs', '.ps1', '.sh', '.php', '.asp', '.jsp'
  ];

  /**
   * Validate file upload
   */
  static validateFile(file, type = 'image') {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for documents
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit (${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    // Check file type
    const allowedTypes = type === 'image' ? this.allowedImageTypes : this.allowedDocumentTypes;
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type '${file.type}' is not allowed`);
    }

    // Check file extension
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (this.dangerousExtensions.includes(extension)) {
      throw new Error(`File extension '${extension}' is not allowed for security reasons`);
    }

    // Check file name for suspicious patterns
    if (this.hasSuspiciousFileName(file.name)) {
      throw new Error('File name contains suspicious patterns');
    }
  }

  /**
   * Get file extension
   */
  static getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  /**
   * Check for suspicious file names
   */
  static hasSuspiciousFileName(fileName) {
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /[\x00-\x1f\x7f-\x9f]/, // Control characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
      /[<>:"|\\?\*]/, // Invalid filename characters
      /^\./, // Hidden files (starting with dot)
      /\.$/ // Files ending with dot
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName) {
    // Remove dangerous characters
    const sanitized = fileName
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .replace(/[<>:"|\\?\*]/g, '_') // Replace invalid characters
      .replace(/\.\.+/g, '.') // Replace multiple dots
      .replace(/^\.|\.$/, '') // Remove leading/trailing dots
      .trim();

    // Ensure it's not empty and not too long
    if (!sanitized || sanitized.length === 0) {
      return 'file';
    }

    if (sanitized.length > 255) {
      const extension = this.getFileExtension(sanitized);
      const nameWithoutExt = sanitized.substring(0, sanitized.length - extension.length);
      return nameWithoutExt.substring(0, 255 - extension.length) + extension;
    }

    return sanitized;
  }

  /**
   * Get maximum file size for type
   */
  static getMaxFileSize(type = 'image') {
    return type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
  }

  /**
   * Get allowed MIME types for type
   */
  static getAllowedTypes(type = 'image') {
    return type === 'image' ? [...this.allowedImageTypes] : [...this.allowedDocumentTypes];
  }
}

const SecurityConfig = {
  RateLimiter,
  InputSanitizer,
  SecurityUtils,
  FileUploadSecurity
};

export default SecurityConfig;