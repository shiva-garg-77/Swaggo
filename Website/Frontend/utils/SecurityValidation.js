/**
 * 🔒 COMPREHENSIVE INPUT VALIDATION & XSS PREVENTION
 * 
 * FIXES ISSUE #22:
 * ✅ Strengthened input validation rules
 * ✅ XSS prevention and sanitization
 * ✅ Content Security Policy helpers
 * ✅ Secure input handling
 * ✅ SQL injection prevention helpers
 * ✅ CSRF protection utilities
 * ✅ Secure file upload validation
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Input validation patterns and rules
 */
const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
};

/**
 * XSS attack patterns to detect and prevent
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<link\b[^<]*>/gi,
  /<meta\b[^<]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // Event handlers
  /expression\s*\(/gi, // CSS expressions
  /url\s*\(\s*javascript:/gi,
  /@@\w+/gi, // SQL Server variables
  /union\s+select/gi, // SQL injection
  /<svg\b[^>]*onload/gi // SVG with onload
];

/**
 * Dangerous HTML attributes that should be removed
 */
const DANGEROUS_ATTRIBUTES = [
  'onabort', 'onafterprint', 'onbeforeprint', 'onbeforeunload', 'onblur', 'oncanplay',
  'oncanplaythrough', 'onchange', 'onclick', 'oncontextmenu', 'ondblclick', 'ondrag',
  'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
  'ondurationchange', 'onemptied', 'onended', 'onerror', 'onfocus', 'onformchange',
  'onforminput', 'onhashchange', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress',
  'onkeyup', 'onload', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onmessage',
  'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel',
  'onoffline', 'ononline', 'onpagehide', 'onpageshow', 'onpause', 'onplay', 'onplaying',
  'onpopstate', 'onprogress', 'onratechange', 'onreadystatechange', 'onredo', 'onresize',
  'onscroll', 'onseeked', 'onseeking', 'onselect', 'onstalled', 'onstorage', 'onsubmit',
  'onsuspend', 'ontimeupdate', 'onundo', 'onunload', 'onvolumechange', 'onwaiting'
];

/**
 * Content Security Policy configuration
 */
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'https:'],
  'connect-src': ["'self'", 'https:', 'wss:', 'ws:'],
  'media-src': ["'self'", 'https:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

/**
 * Security Validation Class
 */
export class SecurityValidator {
  /**
   * Validate input against various security threats
   */
  static validateInput(input, type = 'text', options = {}) {
    const result = {
      isValid: true,
      errors: [],
      sanitizedValue: input,
      securityFlags: []
    };

    if (input == null || input === '') {
      if (options.required) {
        result.isValid = false;
        result.errors.push('Field is required');
      }
      return result;
    }

    // Convert to string for validation
    const stringInput = String(input);

    // Basic XSS detection
    result.securityFlags = this.detectSecurityThreats(stringInput);
    if (result.securityFlags.length > 0) {
      result.isValid = false;
      result.errors.push('Input contains potentially malicious content');
    }

    // Type-specific validation
    switch (type) {
      case 'email':
        result.isValid = this.validateEmail(stringInput);
        if (!result.isValid) result.errors.push('Invalid email format');
        break;
      
      case 'username':
        result.isValid = this.validateUsername(stringInput);
        if (!result.isValid) result.errors.push('Username must be 3-20 alphanumeric characters or underscores');
        break;
        
      case 'password':
        const passwordResult = this.validatePassword(stringInput);
        result.isValid = passwordResult.isValid;
        result.errors.push(...passwordResult.errors);
        break;
        
      case 'url':
        result.isValid = this.validateURL(stringInput);
        if (!result.isValid) result.errors.push('Invalid URL format');
        break;
        
      case 'phone':
        result.isValid = this.validatePhone(stringInput);
        if (!result.isValid) result.errors.push('Invalid phone number format');
        break;
        
      case 'name':
        result.isValid = this.validateName(stringInput);
        if (!result.isValid) result.errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
        break;
        
      case 'html':
        result.sanitizedValue = this.sanitizeHTML(stringInput, options.htmlOptions);
        break;
        
      case 'text':
      default:
        // Basic text validation
        if (options.maxLength && stringInput.length > options.maxLength) {
          result.isValid = false;
          result.errors.push(`Input exceeds maximum length of ${options.maxLength} characters`);
        }
        if (options.minLength && stringInput.length < options.minLength) {
          result.isValid = false;
          result.errors.push(`Input must be at least ${options.minLength} characters`);
        }
        break;
    }

    // Additional length checks
    if (options.maxLength && stringInput.length > options.maxLength) {
      result.isValid = false;
      result.errors.push(`Input exceeds maximum length of ${options.maxLength}`);
    }

    // Rate limiting check (if configured)
    if (options.rateLimitKey) {
      const rateLimitResult = this.checkRateLimit(options.rateLimitKey);
      if (!rateLimitResult.allowed) {
        result.isValid = false;
        result.errors.push(`Rate limit exceeded. Try again in ${rateLimitResult.resetTime}ms`);
      }
    }

    return result;
  }

  /**
   * Detect various security threats in input
   */
  static detectSecurityThreats(input) {
    const threats = [];

    // XSS detection
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        threats.push('XSS_DETECTED');
        break;
      }
    }

    // SQL injection detection
    if (this.detectSQLInjection(input)) {
      threats.push('SQL_INJECTION');
    }

    // Path traversal detection
    if (input.includes('../') || input.includes('..\\') || input.includes('%2e%2e')) {
      threats.push('PATH_TRAVERSAL');
    }

    // Command injection detection
    if (/[;&|`$(){}[\]<>]/.test(input)) {
      threats.push('COMMAND_INJECTION');
    }

    // LDAP injection detection
    if (/[()&|!=<>~*]/.test(input) && input.includes('=')) {
      threats.push('LDAP_INJECTION');
    }

    return threats;
  }

  /**
   * SQL injection detection
   */
  static detectSQLInjection(input) {
    const sqlPatterns = [
      /(';|--|\*|union|select|insert|update|delete|drop|create|alter|exec|xp_|sp_)/gi,
      /exec(\s|\+)+(s|x)p\w+/gi,
      /(\s|;)*(drop|create|alter|truncate|insert|update|delete)\s+(table|database|index|procedure|function)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Email validation
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // Basic format check
    if (!VALIDATION_PATTERNS.EMAIL.test(email)) return false;
    
    // Additional security checks
    if (email.length > 254) return false; // RFC 5321 limit
    
    const [local, domain] = email.split('@');
    if (local.length > 64) return false; // RFC 5321 limit
    
    // Check for dangerous patterns
    if (local.includes('..') || local.startsWith('.') || local.endsWith('.')) return false;
    
    return true;
  }

  /**
   * Username validation
   */
  static validateUsername(username) {
    if (!username || typeof username !== 'string') return false;
    return VALIDATION_PATTERNS.USERNAME.test(username);
  }

  /**
   * Password validation with strength requirements
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      errors: [],
      strength: 0
    };

    if (!password || typeof password !== 'string') {
      result.isValid = false;
      result.errors.push('Password is required');
      return result;
    }

    // Length check
    if (password.length < 6) {
      result.isValid = false;
      result.errors.push('Password must be at least 6 characters long');
    }

    if (password.length > 128) {
      result.isValid = false;
      result.errors.push('Password must not exceed 128 characters');
    }

    // Strength checks
    const checks = [
      { pattern: /[a-z]/, message: 'Password must contain at least one lowercase letter' },
      { pattern: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
      { pattern: /\d/, message: 'Password must contain at least one number' },
      { pattern: /[@$!%*?&]/, message: 'Password must contain at least one special character (@$!%*?&)' }
    ];

    checks.forEach(check => {
      if (check.pattern.test(password)) {
        result.strength++;
      } else {
        result.isValid = false;
        result.errors.push(check.message);
      }
    });

    // Common password patterns
    if (/(.)\1{3,}/.test(password)) {
      result.isValid = false;
      result.errors.push('Password cannot contain more than 3 repeated characters');
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      result.isValid = false;
      result.errors.push('Password is too common, please choose a different one');
    }

    return result;
  }

  /**
   * URL validation
   */
  static validateURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTP/HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
      
      // Block dangerous domains
      const hostname = urlObj.hostname.toLowerCase();
      const dangerousDomains = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      if (dangerousDomains.includes(hostname)) return false;
      
      return VALIDATION_PATTERNS.URL.test(url);
    } catch {
      return false;
    }
  }

  /**
   * Phone number validation
   */
  static validatePhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return VALIDATION_PATTERNS.PHONE.test(cleanPhone);
  }

  /**
   * Name validation
   */
  static validateName(name) {
    if (!name || typeof name !== 'string') return false;
    return VALIDATION_PATTERNS.NAME.test(name) && name.trim().length >= 2;
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(html, options = {}) {
    const config = {
      ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: options.allowedAttributes || ['class'],
      FORBID_ATTR: DANGEROUS_ATTRIBUTES,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style'],
      KEEP_CONTENT: false,
      SANITIZE_DOM: true,
      IN_PLACE: false,
      ...options.dompurifyConfig
    };

    return DOMPurify.sanitize(html, config);
  }

  /**
   * Check if password is commonly used
   */
  static isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Rate limiting check
   */
  static checkRateLimit(key, maxAttempts = 10, windowMs = 60000) {
    if (typeof window === 'undefined') return { allowed: true };

    const now = Date.now();
    const windowKey = `rate_limit_${key}`;
    
    let attempts = JSON.parse(localStorage.getItem(windowKey) || '[]');
    
    // Remove expired attempts
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (attempts.length >= maxAttempts) {
      return { 
        allowed: false, 
        resetTime: windowMs - (now - Math.min(...attempts))
      };
    }
    
    // Add current attempt
    attempts.push(now);
    localStorage.setItem(windowKey, JSON.stringify(attempts));
    
    return { allowed: true };
  }

  /**
   * File upload validation
   */
  static validateFileUpload(file, options = {}) {
    const result = {
      isValid: true,
      errors: [],
      securityFlags: []
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('No file provided');
      return result;
    }

    // File size check
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    // File type validation
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type ${file.type} is not allowed`);
    }

    // File name validation
    const fileName = file.name;
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      result.isValid = false;
      result.errors.push('File name contains invalid characters');
    }

    // Check for executable file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.js', '.vbs', '.ps1'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      result.isValid = false;
      result.errors.push('Executable file types are not allowed');
      result.securityFlags.push('EXECUTABLE_FILE');
    }

    return result;
  }

  /**
   * Generate Content Security Policy header
   */
  static generateCSPHeader(customDirectives = {}) {
    const directives = { ...CSP_DIRECTIVES, ...customDirectives };
    
    return Object.entries(directives)
      .map(([directive, values]) => `${directive} ${values.join(' ')}`)
      .join('; ');
  }

  /**
   * CSRF token generation and validation
   */
  static generateCSRFToken() {
    if (typeof window === 'undefined') return null;
    
    const token = this.generateSecureToken(32);
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  static validateCSRFToken(token) {
    if (typeof window === 'undefined') return false;
    
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken && storedToken === token;
  }

  /**
   * Generate cryptographically secure token
   */
  static generateSecureToken(length = 32) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto
      return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(text) {
    if (!text) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, char => map[char]);
  }

  /**
   * Unescape HTML entities
   */
  static unescapeHTML(text) {
    if (!text) return '';
    
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/'
    };
    
    return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, entity => map[entity]);
  }
}

/**
 * React Hook for secure input validation
 */
export const useSecureValidation = () => {
  const validate = (input, type, options) => {
    return SecurityValidator.validateInput(input, type, options);
  };

  const sanitize = (html, options) => {
    return SecurityValidator.sanitizeHTML(html, options);
  };

  const escape = (text) => {
    return SecurityValidator.escapeHTML(text);
  };

  return { validate, sanitize, escape };
};

/**
 * Validation rules for common form fields
 */
export const VALIDATION_RULES = {
  EMAIL: { type: 'email', required: true, maxLength: 254 },
  USERNAME: { type: 'username', required: true, minLength: 3, maxLength: 20 },
  PASSWORD: { type: 'password', required: true, minLength: 6, maxLength: 128 },
  NAME: { type: 'name', required: true, minLength: 2, maxLength: 50 },
  URL: { type: 'url', maxLength: 2048 },
  PHONE: { type: 'phone', maxLength: 20 },
  MESSAGE: { type: 'text', required: true, maxLength: 1000 },
  COMMENT: { type: 'html', maxLength: 500, htmlOptions: { allowedTags: ['b', 'i', 'em', 'strong'] } }
};

/**
 * File upload configurations
 */
export const FILE_UPLOAD_CONFIGS = {
  IMAGE: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  DOCUMENT: {
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  AVATAR: {
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: 2 * 1024 * 1024 // 2MB
  }
};

export default SecurityValidator;