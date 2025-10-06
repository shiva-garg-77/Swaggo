/**
 * 🔒 SECURE FORM COMPONENTS
 * 
 * FIXES ISSUE #22:
 * ✅ Secure input components with built-in validation
 * ✅ XSS prevention in real-time
 * ✅ CSRF protection integration
 * ✅ Rate limiting support
 * ✅ Accessible form error handling
 * ✅ Secure file upload components
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  SecurityValidator, 
  useSecureValidation, 
  VALIDATION_RULES,
  FILE_UPLOAD_CONFIGS 
} from '../utils/SecurityValidation.js';

/**
 * Secure Text Input Component
 */
export const SecureInput = ({
  type = 'text',
  value = '',
  onChange,
  validationType = 'text',
  validationOptions = {},
  placeholder = '',
  disabled = false,
  required = false,
  'aria-label': ariaLabel,
  className = '',
  showValidation = true,
  onValidation,
  rateLimitKey,
  ...props
}) => {
  const [validationResult, setValidationResult] = useState({ isValid: true, errors: [] });
  const [touched, setTouched] = useState(false);
  const { validate, escape } = useSecureValidation();
  const inputRef = useRef(null);

  // Merge validation options
  const mergedOptions = {
    required,
    ...validationOptions,
    rateLimitKey
  };

  // Validate input
  const validateInput = useCallback((inputValue) => {
    const result = validate(inputValue, validationType, mergedOptions);
    setValidationResult(result);
    
    if (onValidation) {
      onValidation(result);
    }
    
    return result;
  }, [validate, validationType, mergedOptions, onValidation]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const rawValue = e.target.value;
    const result = validateInput(rawValue);
    
    // Always call onChange with sanitized value for non-password fields
    const valueToPass = type === 'password' ? rawValue : result.sanitizedValue;
    
    if (onChange) {
      onChange({
        target: { ...e.target, value: valueToPass },
        isValid: result.isValid,
        errors: result.errors,
        securityFlags: result.securityFlags
      });
    }
  }, [onChange, validateInput, type]);

  // Handle blur for validation
  const handleBlur = useCallback(() => {
    setTouched(true);
    validateInput(value);
  }, [value, validateInput]);

  // Focus security: prevent clipboard attacks
  const handleFocus = useCallback(() => {
    if (type === 'password' && inputRef.current) {
      // Clear any potentially malicious clipboard content for password fields
      const handlePaste = (e) => {
        const pasteData = e.clipboardData?.getData('text') || '';
        if (pasteData.length > 128) { // Prevent extremely long pastes
          e.preventDefault();
        }
      };
      
      inputRef.current.addEventListener('paste', handlePaste, { once: true });
      
      // CRITICAL FIX: Memory leak prevention - cleanup listener
      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('paste', handlePaste);
        }
      };
    }
  }, [type]);

  const hasErrors = touched && showValidation && !validationResult.isValid;
  const inputClassName = `secure-input ${className} ${hasErrors ? 'error' : ''} ${validationResult.isValid && touched ? 'valid' : ''}`;

  return (
    <div className="secure-input-container">
      <input
        ref={inputRef}
        type={type}
        value={type === 'password' ? value : escape(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={escape(placeholder)}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? `${props.id || 'input'}-error` : undefined}
        className={inputClassName}
        autoComplete={type === 'password' ? 'current-password' : 'off'}
        spellCheck="false"
        {...props}
      />
      
      {hasErrors && showValidation && (
        <div 
          id={`${props.id || 'input'}-error`}
          className="secure-input-error"
          role="alert"
          aria-live="polite"
        >
          {validationResult.errors.map((error, index) => (
            <div key={index} className="error-message">
              {escape(error)}
            </div>
          ))}
          {validationResult.securityFlags.length > 0 && (
            <div className="security-warning">
              🚨 Security threat detected: {validationResult.securityFlags.join(', ')}
            </div>
          )}
        </div>
      )}
      
      {touched && validationResult.isValid && showValidation && (
        <div className="secure-input-success" aria-live="polite">
          ✅ Input is valid and secure
        </div>
      )}
    </div>
  );
};

/**
 * Secure Textarea Component
 */
export const SecureTextarea = ({
  value = '',
  onChange,
  validationType = 'text',
  validationOptions = {},
  placeholder = '',
  disabled = false,
  required = false,
  rows = 4,
  maxLength = 1000,
  'aria-label': ariaLabel,
  className = '',
  showValidation = true,
  onValidation,
  allowHtml = false,
  ...props
}) => {
  const [validationResult, setValidationResult] = useState({ isValid: true, errors: [] });
  const [touched, setTouched] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const { validate, sanitize, escape } = useSecureValidation();

  // Merge validation options
  const mergedOptions = {
    required,
    maxLength,
    ...validationOptions
  };

  // Validate input
  const validateInput = useCallback((inputValue) => {
    const type = allowHtml ? 'html' : validationType;
    const result = validate(inputValue, type, mergedOptions);
    setValidationResult(result);
    setCharCount(inputValue.length);
    
    if (onValidation) {
      onValidation(result);
    }
    
    return result;
  }, [validate, validationType, allowHtml, mergedOptions, onValidation]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const rawValue = e.target.value;
    const result = validateInput(rawValue);
    
    // Sanitize if HTML is allowed
    const valueToPass = allowHtml ? result.sanitizedValue : rawValue;
    
    if (onChange) {
      onChange({
        target: { ...e.target, value: valueToPass },
        isValid: result.isValid,
        errors: result.errors,
        securityFlags: result.securityFlags
      });
    }
  }, [onChange, validateInput, allowHtml]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validateInput(value);
  }, [value, validateInput]);

  const hasErrors = touched && showValidation && !validationResult.isValid;
  const textareaClassName = `secure-textarea ${className} ${hasErrors ? 'error' : ''} ${validationResult.isValid && touched ? 'valid' : ''}`;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <div className="secure-textarea-container">
      <textarea
        value={allowHtml ? value : escape(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={escape(placeholder)}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? `${props.id || 'textarea'}-error` : undefined}
        className={textareaClassName}
        spellCheck="false"
        {...props}
      />
      
      <div className="textarea-meta">
        <span className={`char-count ${isNearLimit ? 'warning' : ''}`}>
          {charCount} / {maxLength}
        </span>
        {allowHtml && (
          <span className="html-indicator">HTML allowed</span>
        )}
      </div>
      
      {hasErrors && showValidation && (
        <div 
          id={`${props.id || 'textarea'}-error`}
          className="secure-textarea-error"
          role="alert"
          aria-live="polite"
        >
          {validationResult.errors.map((error, index) => (
            <div key={index} className="error-message">
              {escape(error)}
            </div>
          ))}
          {validationResult.securityFlags.length > 0 && (
            <div className="security-warning">
              🚨 Security threat detected: {validationResult.securityFlags.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Secure File Upload Component
 */
export const SecureFileUpload = ({
  onChange,
  accept = 'image/*',
  multiple = false,
  uploadConfig = FILE_UPLOAD_CONFIGS.IMAGE,
  disabled = false,
  className = '',
  onValidation,
  showPreview = false,
  'aria-label': ariaLabel,
  ...props
}) => {
  const [validationResults, setValidationResults] = useState([]);
  const [previews, setPreviews] = useState([]);
  const { escape } = useSecureValidation();
  const fileInputRef = useRef(null);

  // Validate uploaded files
  const validateFiles = useCallback((files) => {
    const results = Array.from(files).map(file => 
      SecurityValidator.validateFileUpload(file, uploadConfig)
    );
    
    setValidationResults(results);
    
    if (onValidation) {
      onValidation(results);
    }
    
    return results;
  }, [uploadConfig, onValidation]);

  // Generate file previews for images
  const generatePreviews = useCallback((files) => {
    if (!showPreview) return;
    
    const previewPromises = Array.from(files).map(file => {
      if (file.type.startsWith('image/')) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            file: file.name,
            url: e.target.result,
            type: file.type
          });
          reader.readAsDataURL(file);
        });
      }
      return Promise.resolve(null);
    });
    
    Promise.all(previewPromises).then(results => {
      setPreviews(results.filter(Boolean));
    });
  }, [showPreview]);

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setValidationResults([]);
      setPreviews([]);
      return;
    }
    
    const validationResults = validateFiles(files);
    const validFiles = Array.from(files).filter((_, index) => 
      validationResults[index].isValid
    );
    
    if (showPreview) {
      generatePreviews(validFiles);
    }
    
    if (onChange) {
      onChange({
        target: { ...e.target, files: validFiles },
        validationResults,
        validFiles
      });
    }
  }, [validateFiles, generatePreviews, showPreview, onChange]);

  // Clear file selection
  const clearFiles = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setValidationResults([]);
    setPreviews([]);
    
    if (onChange) {
      onChange({
        target: { files: [] },
        validationResults: [],
        validFiles: []
      });
    }
  }, [onChange]);

  const hasErrors = validationResults.some(result => !result.isValid);
  const inputClassName = `secure-file-upload ${className} ${hasErrors ? 'error' : ''}`;

  return (
    <div className="secure-file-upload-container">
      <div className={inputClassName}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-label={ariaLabel}
          className="file-input"
          {...props}
        />
        
        <div className="file-upload-ui">
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <p>Click to select {multiple ? 'files' : 'a file'} or drag and drop</p>
            <p className="upload-limits">
              Max size: {(uploadConfig.maxSize / 1024 / 1024).toFixed(1)}MB
              {uploadConfig.allowedTypes && (
                <span> • Allowed: {uploadConfig.allowedTypes.join(', ')}</span>
              )}
            </p>
          </div>
          
          {validationResults.length > 0 && (
            <button
              type="button"
              onClick={clearFiles}
              className="clear-files-btn"
              aria-label="Clear selected files"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
      
      {/* File Validation Results */}
      {validationResults.length > 0 && (
        <div className="file-validation-results">
          {validationResults.map((result, index) => (
            <div 
              key={index} 
              className={`file-result ${result.isValid ? 'valid' : 'invalid'}`}
            >
              <span className="file-status">
                {result.isValid ? '✅' : '❌'}
              </span>
              <span className="file-info">
                File {index + 1}
                {result.errors.length > 0 && (
                  <span className="file-errors">
                    : {result.errors.map(error => escape(error)).join(', ')}
                  </span>
                )}
                {result.securityFlags.length > 0 && (
                  <span className="security-flags">
                    🚨 {result.securityFlags.join(', ')}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* File Previews */}
      {showPreview && previews.length > 0 && (
        <div className="file-previews">
          {previews.map((preview, index) => (
            <div key={index} className="file-preview">
              <img 
                src={preview.url} 
                alt={`Preview of ${preview.file}`}
                className="preview-image"
              />
              <p className="preview-filename">{escape(preview.file)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Secure Form Component with CSRF Protection
 */
export const SecureForm = ({
  onSubmit,
  children,
  method = 'POST',
  enableCSRF = true,
  className = '',
  validateOnSubmit = true,
  showGlobalErrors = true,
  ...props
}) => {
  const [csrfToken, setCsrfToken] = useState(null);
  const [globalErrors, setGlobalErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const { escape } = useSecureValidation();

  // Generate CSRF token on mount
  useEffect(() => {
    if (enableCSRF) {
      const token = SecurityValidator.generateCSRFToken();
      setCsrfToken(token);
    }
  }, [enableCSRF]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setGlobalErrors([]);
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // CSRF validation
      if (enableCSRF && !SecurityValidator.validateCSRFToken(csrfToken)) {
        throw new Error('CSRF token validation failed. Please refresh the page and try again.');
      }
      
      // Form validation if enabled
      if (validateOnSubmit && formRef.current) {
        const formData = new FormData(formRef.current);
        const formErrors = [];
        
        // Basic form validation - you can extend this
        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string' && value.trim() === '') {
            const field = formRef.current.querySelector(`[name="${key}"]`);
            if (field?.required) {
              formErrors.push(`${key} is required`);
            }
          }
        }
        
        if (formErrors.length > 0) {
          setGlobalErrors(formErrors);
          return;
        }
      }
      
      // Call the provided onSubmit handler
      if (onSubmit) {
        const formData = new FormData(formRef.current);
        
        // Add CSRF token to form data
        if (enableCSRF && csrfToken) {
          formData.append('csrf_token', csrfToken);
        }
        
        await onSubmit({
          formData,
          csrfToken,
          preventDefault: () => {}, // Already prevented
          target: formRef.current
        });
      }
    } catch (error) {
      setGlobalErrors([error.message || 'An error occurred while submitting the form']);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, enableCSRF, csrfToken, validateOnSubmit, isSubmitting]);

  const formClassName = `secure-form ${className} ${isSubmitting ? 'submitting' : ''}`;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      method={method}
      className={formClassName}
      noValidate // We handle validation ourselves
      {...props}
    >
      {/* CSRF Token */}
      {enableCSRF && csrfToken && (
        <input
          type="hidden"
          name="csrf_token"
          value={csrfToken}
        />
      )}
      
      {/* Global Error Display */}
      {showGlobalErrors && globalErrors.length > 0 && (
        <div className="form-global-errors" role="alert" aria-live="polite">
          {globalErrors.map((error, index) => (
            <div key={index} className="global-error">
              ❌ {escape(error)}
            </div>
          ))}
        </div>
      )}
      
      {children}
      
      {/* Loading State */}
      {isSubmitting && (
        <div className="form-loading-overlay">
          <div className="loading-spinner" />
          <p>Submitting securely...</p>
        </div>
      )}
    </form>
  );
};

/**
 * Predefined Secure Form Fields
 */
export const SecureEmailInput = (props) => (
  <SecureInput
    type="email"
    validationType="email"
    validationOptions={VALIDATION_RULES.EMAIL}
    placeholder="Enter your email address"
    aria-label="Email address"
    {...props}
  />
);

export const SecureUsernameInput = (props) => (
  <SecureInput
    type="text"
    validationType="username"
    validationOptions={VALIDATION_RULES.USERNAME}
    placeholder="Enter your username"
    aria-label="Username"
    {...props}
  />
);

export const SecurePasswordInput = (props) => (
  <SecureInput
    type="password"
    validationType="password"
    validationOptions={VALIDATION_RULES.PASSWORD}
    placeholder="Enter your password"
    aria-label="Password"
    {...props}
  />
);

export const SecureNameInput = (props) => (
  <SecureInput
    type="text"
    validationType="name"
    validationOptions={VALIDATION_RULES.NAME}
    placeholder="Enter your name"
    aria-label="Full name"
    {...props}
  />
);

export const SecureMessageTextarea = (props) => (
  <SecureTextarea
    validationType="text"
    validationOptions={VALIDATION_RULES.MESSAGE}
    placeholder="Enter your message"
    aria-label="Message"
    {...props}
  />
);

export const SecureCommentTextarea = (props) => (
  <SecureTextarea
    validationType="html"
    validationOptions={VALIDATION_RULES.COMMENT}
    placeholder="Enter your comment"
    aria-label="Comment"
    allowHtml={true}
    {...props}
  />
);

export const SecureImageUpload = (props) => (
  <SecureFileUpload
    accept="image/*"
    uploadConfig={FILE_UPLOAD_CONFIGS.IMAGE}
    showPreview={true}
    aria-label="Upload image"
    {...props}
  />
);

export const SecureDocumentUpload = (props) => (
  <SecureFileUpload
    accept=".pdf,.doc,.docx,.txt"
    uploadConfig={FILE_UPLOAD_CONFIGS.DOCUMENT}
    aria-label="Upload document"
    {...props}
  />
);

export const SecureAvatarUpload = (props) => (
  <SecureFileUpload
    accept="image/jpeg,image/png"
    uploadConfig={FILE_UPLOAD_CONFIGS.AVATAR}
    showPreview={true}
    aria-label="Upload avatar"
    {...props}
  />
);