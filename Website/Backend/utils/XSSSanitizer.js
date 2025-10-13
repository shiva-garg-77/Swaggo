import DOMPurify from 'isomorphic-dompurify';

/**
 * XSS Sanitization Utility
 * Provides comprehensive XSS protection for user input
 */

class XSSSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param {string} html - HTML content to sanitize
   * @param {Object} options - DOMPurify options
   * @returns {string} Sanitized HTML
   */
  static sanitizeHTML(html, options = {}) {
    if (!html || typeof html !== 'string') {
      return html;
    }

    // Default configuration for maximum security
    const defaultOptions = {
      // Remove all script tags and event handlers
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base'],
      FORBID_ATTR: ['onerror', 'onload', 'onmouseover', 'onclick', 'onfocus', 'onblur'],
      // Allow safe tags and attributes
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre', 'a', 'img', 'span', 'div', 'table', 'thead', 'tbody',
        'tr', 'td', 'th', 'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'target'
      ],
      // Additional security measures
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      // Strip comments
      KEEP_CONTENT: false
    };

    // Merge options with defaults
    const config = { ...defaultOptions, ...options };

    try {
      return DOMPurify.sanitize(html, config);
    } catch (error) {
      console.error('XSS Sanitization Error:', error);
      // Return empty string for unsafe content
      return '';
    }
  }

  /**
   * Sanitize plain text content
   * @param {string} text - Text content to sanitize
   * @returns {string} Sanitized text
   */
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Remove potentially dangerous characters and patterns
    return text
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object/embed tags
      .replace(/<(?:object|embed)\b[^<]*(?:(?!<\/(?:object|embed)>)<[^<]*)*<\/(?:object|embed)>/gi, '')
      // Remove javascript: links
      .replace(/javascript:/gi, '')
      // Remove data: links (except images)
      .replace(/data:(?!image\/)/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove VBScript
      .replace(/vbscript:/gi, '')
      // Remove expression()
      .replace(/expression\s*\(/gi, '')
      // Remove xmlns attributes
      .replace(/xmlns\s*=/gi, '')
      // Remove xlink:href with javascript
      .replace(/xlink:href\s*=\s*["']javascript:/gi, '')
      // Remove formaction attributes
      .replace(/formaction\s*=/gi, '');
  }

  /**
   * Sanitize URL to prevent malicious redirects
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL or empty string if invalid
   */
  static sanitizeURL(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }

    // Allow only http/https protocols
    const allowedProtocols = ['http:', 'https:'];
    try {
      const parsedUrl = new URL(url);
      if (allowedProtocols.includes(parsedUrl.protocol)) {
        return url;
      }
      return '';
    } catch (error) {
      // If URL parsing fails, it's not a valid URL
      return '';
    }
  }

  /**
   * Sanitize user input object recursively
   * @param {Object|Array|string} input - Input to sanitize
   * @returns {Object|Array|string} Sanitized input
   */
  static sanitizeInput(input) {
    if (!input) {
      return input;
    }

    if (typeof input === 'string') {
      // Check if it looks like HTML
      if (/<[^>]*>/g.test(input)) {
        return this.sanitizeHTML(input);
      } else {
        return this.sanitizeText(input);
      }
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        // Skip internal properties
        if (key.startsWith('_') || key.startsWith('$')) {
          continue;
        }
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Sanitize message content before storing
   * @param {string} content - Message content to sanitize
   * @returns {string} Sanitized content
   */
  static sanitizeMessageContent(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    // For messages, we want to preserve formatting but remove dangerous content
    return this.sanitizeHTML(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'code', 'pre', 'a', 'img', 'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'alt', 'title', 'class', 'style'],
      KEEP_CONTENT: true
    });
  }

  /**
   * Sanitize system message content
   * @param {string} content - System message content to sanitize
   * @returns {string} Sanitized content
   */
  static sanitizeSystemMessage(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    // For system messages, be more restrictive
    return this.sanitizeHTML(content, {
      ALLOWED_TAGS: ['strong', 'em', 'code'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Sanitize media metadata (sticker names, GIF titles, etc.)
   * @param {string} metadata - Media metadata to sanitize
   * @returns {string} Sanitized metadata
   */
  static sanitizeMediaMetadata(metadata) {
    if (!metadata || typeof metadata !== 'string') {
      return metadata;
    }

    // For media metadata, be very restrictive
    return this.sanitizeText(metadata).trim().substring(0, 255); // Limit length
  }

  /**
   * Sanitize user profile data
   * @param {Object} profile - User profile data
   * @returns {Object} Sanitized profile data
   */
  static sanitizeUserProfile(profile) {
    if (!profile || typeof profile !== 'object') {
      return profile;
    }

    const sanitized = { ...profile };
    
    // Sanitize text fields
    const textFields = ['username', 'name', 'bio', 'location'];
    textFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeText(sanitized[field]);
      }
    });

    // Sanitize HTML fields
    const htmlFields = ['about'];
    htmlFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeHTML(sanitized[field]);
      }
    });

    // Sanitize URLs
    const urlFields = ['website', 'profilePic'];
    urlFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.sanitizeURL(sanitized[field]);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize chat name
   * @param {string} name - Chat name to sanitize
   * @returns {string} Sanitized chat name
   */
  static sanitizeChatName(name) {
    if (!name || typeof name !== 'string') {
      return name;
    }

    // For chat names, be restrictive and limit length
    return this.sanitizeText(name).trim().substring(0, 100);
  }

  /**
   * Sanitize all message data including content and metadata
   * @param {Object} messageData - Message data to sanitize
   * @returns {Object} Sanitized message data
   */
  static sanitizeMessageData(messageData) {
    if (!messageData || typeof messageData !== 'object') {
      return messageData;
    }

    const sanitized = { ...messageData };

    // Sanitize main content based on message type
    if (sanitized.content) {
      if (sanitized.messageType === 'system') {
        sanitized.content = this.sanitizeSystemMessage(sanitized.content);
      } else {
        sanitized.content = this.sanitizeMessageContent(sanitized.content);
      }
    }

    // Sanitize media metadata
    if (sanitized.stickerData) {
      sanitized.stickerData = { ...sanitized.stickerData };
      if (sanitized.stickerData.name) {
        sanitized.stickerData.name = this.sanitizeMediaMetadata(sanitized.stickerData.name);
      }
      if (sanitized.stickerData.category) {
        sanitized.stickerData.category = this.sanitizeMediaMetadata(sanitized.stickerData.category);
      }
      if (sanitized.stickerData.url) {
        sanitized.stickerData.url = this.sanitizeURL(sanitized.stickerData.url);
      }
    }

    if (sanitized.gifData) {
      sanitized.gifData = { ...sanitized.gifData };
      if (sanitized.gifData.title) {
        sanitized.gifData.title = this.sanitizeMediaMetadata(sanitized.gifData.title);
      }
      if (sanitized.gifData.category) {
        sanitized.gifData.category = this.sanitizeMediaMetadata(sanitized.gifData.category);
      }
      if (sanitized.gifData.url) {
        sanitized.gifData.url = this.sanitizeURL(sanitized.gifData.url);
      }
      if (sanitized.gifData.thumbnail) {
        sanitized.gifData.thumbnail = this.sanitizeURL(sanitized.gifData.thumbnail);
      }
    }

    if (sanitized.voiceData) {
      sanitized.voiceData = { ...sanitized.voiceData };
      // Voice data doesn't typically have user-generated text, but sanitize just in case
    }

    if (sanitized.fileData) {
      sanitized.fileData = { ...sanitized.fileData };
      if (sanitized.fileData.name) {
        sanitized.fileData.name = this.sanitizeMediaMetadata(sanitized.fileData.name);
      }
    }

    // Sanitize mentions
    if (Array.isArray(sanitized.mentions)) {
      sanitized.mentions = sanitized.mentions.map(mention => 
        typeof mention === 'string' ? this.sanitizeText(mention) : mention
      );
    }

    // Sanitize replyTo
    if (sanitized.replyTo) {
      sanitized.replyTo = this.sanitizeText(sanitized.replyTo);
    }

    return sanitized;
  }
}

export default XSSSanitizer;