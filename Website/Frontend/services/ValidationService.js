/**
 * Centralized Validation Service
 * Provides unified validation rules and error handling
 */

import { AuthErrorHandler } from '../utils/authUtils';

/**
 * Validation Rules Registry
 */
class ValidationRules {
  constructor() {
    this.rules = new Map();
    this.setupDefaultRules();
  }

  /**
   * Setup default validation rules
   */
  setupDefaultRules() {
    // Email validation
    this.addRule('email', {
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: 'Please enter a valid email address'
    });

    // Username validation
    this.addRule('username', {
      validate: (value) => {
        return value && value.length >= 3 && value.length <= 30 && /^[a-zA-Z0-9_]+$/.test(value);
      },
      message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
    });

    // Password validation
    this.addRule('password', {
      validate: (value) => {
        return value && value.length >= 8;
      },
      message: 'Password must be at least 8 characters long'
    });

    // Strong password validation
    this.addRule('strongPassword', {
      validate: (value) => {
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongPasswordRegex.test(value);
      },
      message: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character'
    });

    // Phone number validation
    this.addRule('phone', {
      validate: (value) => {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(value);
      },
      message: 'Please enter a valid phone number'
    });

    // URL validation
    this.addRule('url', {
      validate: (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please enter a valid URL'
    });

    // Date validation
    this.addRule('date', {
      validate: (value) => {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
      },
      message: 'Please enter a valid date'
    });

    // Age validation (minimum 13 years old)
    this.addRule('minAge', {
      validate: (value, options = { minAge: 13 }) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age >= options.minAge;
      },
      message: 'You must be at least 13 years old'
    });

    // Required field validation
    this.addRule('required', {
      validate: (value) => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
      },
      message: 'This field is required'
    });

    // Minimum length validation
    this.addRule('minLength', {
      validate: (value, options = { min: 1 }) => {
        return value && value.length >= options.min;
      },
      message: (options) => `Must be at least ${options.min} characters long`
    });

    // Maximum length validation
    this.addRule('maxLength', {
      validate: (value, options = { max: 255 }) => {
        return !value || value.length <= options.max;
      },
      message: (options) => `Must be no more than ${options.max} characters long`
    });

    // Number range validation
    this.addRule('numberRange', {
      validate: (value, options = { min: 0, max: 100 }) => {
        const num = Number(value);
        return !isNaN(num) && num >= options.min && num <= options.max;
      },
      message: (options) => `Must be a number between ${options.min} and ${options.max}`
    });

    // File validation
    this.addRule('file', {
      validate: (file, options = { maxSize: 5 * 1024 * 1024, allowedTypes: [] }) => {
        if (!file) return false;
        
        // Check file size
        if (file.size > options.maxSize) return false;
        
        // Check file type if specified
        if (options.allowedTypes.length > 0) {
          return options.allowedTypes.includes(file.type);
        }
        
        return true;
      },
      message: (options) => {
        const sizeMB = Math.round(options.maxSize / (1024 * 1024));
        let msg = `File must be smaller than ${sizeMB}MB`;
        if (options.allowedTypes.length > 0) {
          msg += ` and must be one of: ${options.allowedTypes.join(', ')}`;
        }
        return msg;
      }
    });

    // Image file validation
    this.addRule('image', {
      validate: (file) => {
        if (!file) return false;
        return file.type.startsWith('image/');
      },
      message: 'File must be an image'
    });

    // Match field validation (for password confirmation)
    this.addRule('match', {
      validate: (value, options = { target: '' }) => {
        return value === options.target;
      },
      message: 'Fields do not match'
    });
  }

  /**
   * Add a custom validation rule
   */
  addRule(name, rule) {
    this.rules.set(name, rule);
  }

  /**
   * Get a validation rule
   */
  getRule(name) {
    return this.rules.get(name);
  }

  /**
   * Get all available rules
   */
  getAllRules() {
    return Array.from(this.rules.keys());
  }
}

/**
 * Validation Service Class
 */
class ValidationService {
  constructor() {
    this.rules = new ValidationRules();
    this.errorMessages = new Map();
  }

  /**
   * Validate a single field
   */
  validateField(value, ruleName, options = {}) {
    const rule = this.rules.getRule(ruleName);
    if (!rule) {
      throw new Error(`Validation rule '${ruleName}' not found`);
    }

    const isValid = rule.validate(value, options);
    
    if (!isValid) {
      const message = typeof rule.message === 'function' 
        ? rule.message(options)
        : rule.message;
        
      return {
        isValid: false,
        error: message
      };
    }

    return { isValid: true };
  }

  /**
   * Validate multiple fields with multiple rules
   */
  validateFields(data, validationSchema) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, fieldRules] of Object.entries(validationSchema)) {
      const fieldValue = data[fieldName];
      const fieldErrors = [];

      for (const ruleConfig of fieldRules) {
        const { rule, options = {}, message } = typeof ruleConfig === 'string' 
          ? { rule: ruleConfig } 
          : ruleConfig;

        try {
          const result = this.validateField(fieldValue, rule, options);
          
          if (!result.isValid) {
            fieldErrors.push(message || result.error);
          }
        } catch (error) {
          console.error(`Validation error for field ${fieldName}:`, error);
          fieldErrors.push('Validation error occurred');
        }
      }

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return {
      isValid,
      errors,
      errorCount: Object.keys(errors).length
    };
  }

  /**
   * Validate user registration data
   */
  validateUserRegistration(userData) {
    const schema = {
      username: [
        'required',
        'username'
      ],
      email: [
        'required',
        'email'
      ],
      password: [
        'required',
        'password'
      ],
      confirmPassword: [
        'required',
        {
          rule: 'match',
          options: { target: userData.password },
          message: 'Password confirmation does not match'
        }
      ]
    };

    if (userData.dateOfBirth) {
      schema.dateOfBirth = [
        'date',
        {
          rule: 'minAge',
          options: { minAge: 13 },
          message: 'You must be at least 13 years old to register'
        }
      ];
    }

    return this.validateFields(userData, schema);
  }

  /**
   * Validate user login data
   */
  validateUserLogin(loginData) {
    const schema = {
      password: ['required']
    };

    // Either username or email is required
    if (!loginData.username && !loginData.email) {
      return {
        isValid: false,
        errors: {
          general: ['Username or email is required']
        },
        errorCount: 1
      };
    }

    if (loginData.email) {
      schema.email = ['email'];
    }

    if (loginData.username) {
      schema.username = ['username'];
    }

    return this.validateFields(loginData, schema);
  }

  /**
   * Validate password reset data
   */
  validatePasswordReset(passwordData) {
    return this.validateFields(passwordData, {
      password: [
        'required',
        'password'
      ],
      confirmPassword: [
        'required',
        {
          rule: 'match',
          options: { target: passwordData.password },
          message: 'Password confirmation does not match'
        }
      ]
    });
  }

  /**
   * Validate user profile data
   */
  validateUserProfile(profileData) {
    const schema = {};

    if (profileData.username !== undefined) {
      schema.username = ['required', 'username'];
    }

    if (profileData.email !== undefined) {
      schema.email = ['required', 'email'];
    }

    if (profileData.phone !== undefined && profileData.phone.length > 0) {
      schema.phone = ['phone'];
    }

    if (profileData.website !== undefined && profileData.website.length > 0) {
      schema.website = ['url'];
    }

    if (profileData.bio !== undefined) {
      schema.bio = [
        { rule: 'maxLength', options: { max: 500 } }
      ];
    }

    if (profileData.dateOfBirth !== undefined) {
      schema.dateOfBirth = [
        'date',
        { rule: 'minAge', options: { minAge: 13 } }
      ];
    }

    return this.validateFields(profileData, schema);
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file, options = {}) {
    const defaultOptions = {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: []
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    return this.validateField(file, 'file', mergedOptions);
  }

  /**
   * Validate image upload
   */
  validateImageUpload(file, options = {}) {
    const defaultOptions = {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    // First check if it's a valid file
    const fileValidation = this.validateField(file, 'file', mergedOptions);
    if (!fileValidation.isValid) {
      return fileValidation;
    }

    // Then check if it's an image
    return this.validateField(file, 'image');
  }

  /**
   * Validate chat message
   */
  validateChatMessage(messageData) {
    const schema = {
      content: [
        'required',
        { rule: 'maxLength', options: { max: 2000 } }
      ],
      messageType: [
        'required'
      ]
    };

    // Additional validation for file messages
    if (messageData.messageType === 'file' && messageData.file) {
      const fileValidation = this.validateFileUpload(messageData.file, {
        maxSize: 10 * 1024 * 1024 // 10MB for chat files
      });
      
      if (!fileValidation.isValid) {
        return {
          isValid: false,
          errors: {
            file: [fileValidation.error]
          },
          errorCount: 1
        };
      }
    }

    return this.validateFields(messageData, schema);
  }

  /**
   * Sanitize user input data
   */
  sanitizeUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return null;
    }

    const sanitized = {};
    
    // Define allowed fields and their types
    const allowedFields = {
      id: 'string',
      username: 'string',
      email: 'string',
      profileid: 'string',
      profilePic: 'string',
      name: 'string',
      bio: 'string',
      dateOfBirth: 'string',
      phone: 'string',
      website: 'string',
      roles: 'array'
    };

    for (const [key, expectedType] of Object.entries(allowedFields)) {
      if (userData[key] !== undefined && userData[key] !== null) {
        const value = userData[key];
        
        switch (expectedType) {
          case 'string':
            sanitized[key] = String(value).trim();
            break;
          case 'array':
            sanitized[key] = Array.isArray(value) ? value : [];
            break;
          default:
            sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(html) {
    if (typeof html !== 'string') return '';
    
    // Basic HTML sanitization - remove potentially dangerous tags
    const dangerousTags = /<(script|iframe|object|embed|form|input|textarea|select|option|meta|link|style|title|head|html|body)[^>]*>.*?<\/\1>/gi;
    const dangerousAttributes = /(on\w+|javascript:|data:text\/html)/gi;
    
    return html
      .replace(dangerousTags, '')
      .replace(dangerousAttributes, '');
  }

  /**
   * Create validation error
   */
  createValidationError(message, details = {}) {
    return AuthErrorHandler.createError('VALIDATION_ERROR', message, details);
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(name, validator, message) {
    this.rules.addRule(name, {
      validate: validator,
      message: message
    });
  }

  /**
   * Validate form data with async rules
   */
  async validateFormAsync(data, schema, context = {}) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, fieldRules] of Object.entries(schema)) {
      const fieldValue = data[fieldName];
      const fieldErrors = [];

      for (const ruleConfig of fieldRules) {
        try {
          let result;
          
          if (typeof ruleConfig === 'function') {
            // Custom async validator
            result = await ruleConfig(fieldValue, data, context);
          } else {
            // Standard validation
            result = this.validateField(fieldValue, ruleConfig.rule || ruleConfig, ruleConfig.options);
          }

          if (result && !result.isValid) {
            fieldErrors.push(result.error || result.message);
          }
        } catch (error) {
          console.error(`Async validation error for field ${fieldName}:`, error);
          fieldErrors.push('Validation error occurred');
        }
      }

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return {
      isValid,
      errors,
      errorCount: Object.keys(errors).length
    };
  }

  /**
   * Get user-friendly error messages
   */
  getErrorSummary(validationResult) {
    if (validationResult.isValid) {
      return null;
    }

    const messages = [];
    for (const [field, errors] of Object.entries(validationResult.errors)) {
      for (const error of errors) {
        messages.push(`${field}: ${error}`);
      }
    }

    return messages.join(', ');
  }
}

// Create singleton instance
const validationService = new ValidationService();

export default validationService;
export { ValidationRules };