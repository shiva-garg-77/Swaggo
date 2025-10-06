import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Input Validation and Sanitization Utilities
 * Prevents XSS, injection attacks, and data corruption
 */

class InputValidator {
  constructor() {
    // File type whitelist
    this.allowedImageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    this.allowedVideoTypes = [
      'video/mp4', 'video/webm', 'video/ogg'
    ];
    
    this.allowedAudioTypes = [
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'
    ];
    
    this.allowedDocumentTypes = [
      'application/pdf', 'text/plain', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    // Size limits (in bytes)
    this.sizeLimits = {
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
      document: 25 * 1024 * 1024, // 25MB
      voice: 10 * 1024 * 1024 // 10MB
    };
  }
  
  /**
   * Validate and sanitize text content
   */
  sanitizeText(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    const config = {
      maxLength: options.maxLength || 2000,
      allowHTML: options.allowHTML || false,
      allowEmojis: options.allowEmojis !== false, // default true
      trimWhitespace: options.trimWhitespace !== false // default true
    };
    
    let sanitized = text;
    
    // Trim whitespace
    if (config.trimWhitespace) {
      sanitized = sanitized.trim();
    }
    
    // Length check
    if (sanitized.length > config.maxLength) {
      throw new Error(`Text exceeds maximum length of ${config.maxLength} characters`);
    }
    
    // HTML sanitization
    if (!config.allowHTML) {
      // Strip all HTML tags and decode entities
      sanitized = DOMPurify.sanitize(sanitized, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
    } else {
      // Allow safe HTML only
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre'],
        ALLOWED_ATTR: []
      });
    }
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    return sanitized;
  }
  
  /**
   * Validate chat ID
   */
  validateChatId(chatid) {
    if (!chatid || typeof chatid !== 'string') {
      throw new Error('Chat ID is required and must be a string');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(chatid)) {
      throw new Error('Chat ID contains invalid characters');
    }
    
    if (chatid.length < 1 || chatid.length > 100) {
      throw new Error('Chat ID must be between 1 and 100 characters');
    }
    
    return chatid.trim();
  }
  
  /**
   * Validate client message ID
   */
  validateClientMessageId(clientMessageId) {
    if (!clientMessageId || typeof clientMessageId !== 'string') {
      throw new Error('Client message ID is required and must be a string');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(clientMessageId)) {
      throw new Error('Client message ID contains invalid characters');
    }
    
    if (clientMessageId.length < 1 || clientMessageId.length > 100) {
      throw new Error('Client message ID must be between 1 and 100 characters');
    }
    
    return clientMessageId.trim();
  }
  
  /**
   * Validate message type
   */
  validateMessageType(messageType) {
    const allowedTypes = [
      'text', 'image', 'video', 'audio', 'document', 'voice', 
      'sticker', 'gif', 'location', 'contact', 'system'
    ];
    
    if (!messageType || typeof messageType !== 'string') {
      throw new Error('Message type is required and must be a string');
    }
    
    const sanitizedType = messageType.toLowerCase().trim();
    
    if (!allowedTypes.includes(sanitizedType)) {
      throw new Error(`Invalid message type: ${messageType}`);
    }
    
    return sanitizedType;
  }
  
  /**
   * Validate email address
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }
    
    const sanitizedEmail = email.toLowerCase().trim();
    
    if (!validator.isEmail(sanitizedEmail)) {
      throw new Error('Invalid email format');
    }
    
    if (sanitizedEmail.length > 254) {
      throw new Error('Email is too long');
    }
    
    return sanitizedEmail;
  }
  
  /**
   * Validate username
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required and must be a string');
    }
    
    const sanitized = username.trim();
    
    if (sanitized.length < 3 || sanitized.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }
    
    if (!/^[a-zA-Z0-9_.-]+$/.test(sanitized)) {
      throw new Error('Username can only contain letters, numbers, dots, hyphens, and underscores');
    }
    
    // Reserved usernames
    const reserved = ['admin', 'root', 'system', 'api', 'null', 'undefined', 'test'];
    if (reserved.includes(sanitized.toLowerCase())) {
      throw new Error('Username is reserved');
    }
    
    return sanitized;
  }
  
  /**
   * Validate file data
   */
  validateFileData(fileData, messageType) {
    if (!fileData || typeof fileData !== 'object') {
      throw new Error('File data is required and must be an object');
    }
    
    const { name, size, mimeType, fileBase64 } = fileData;
    
    // Validate file name
    if (!name || typeof name !== 'string') {
      throw new Error('File name is required');
    }
    
    const sanitizedName = this.sanitizeFileName(name);
    if (sanitizedName.length > 255) {
      throw new Error('File name is too long');
    }
    
    // Validate file size
    if (!size || typeof size !== 'number' || size <= 0) {
      throw new Error('Invalid file size');
    }
    
    const sizeLimit = this.sizeLimits[messageType] || this.sizeLimits.document;
    if (size > sizeLimit) {
      throw new Error(`File size exceeds limit of ${Math.round(sizeLimit / 1024 / 1024)}MB`);
    }
    
    // Validate MIME type
    if (!mimeType || typeof mimeType !== 'string') {
      throw new Error('MIME type is required');
    }
    
    if (!this.isAllowedMimeType(mimeType, messageType)) {
      throw new Error(`File type ${mimeType} is not allowed for ${messageType} messages`);
    }
    
    // Validate base64 data if present
    if (fileBase64) {
      if (typeof fileBase64 !== 'string') {
        throw new Error('File base64 data must be a string');
      }
      
      // Basic base64 validation
      if (!/^[A-Za-z0-9+/=]+$/.test(fileBase64)) {
        throw new Error('Invalid base64 file data');
      }
      
      // Check if base64 size matches declared size (approximately)
      const calculatedSize = Math.round((fileBase64.length * 3) / 4);
      const sizeDifference = Math.abs(calculatedSize - size);
      
      if (sizeDifference > size * 0.1) { // Allow 10% difference
        throw new Error('File size does not match base64 data size');
      }
    }
    
    return {
      name: sanitizedName,
      size,
      mimeType: mimeType.toLowerCase(),
      fileBase64
    };
  }
  
  /**
   * Sanitize file name
   */
  sanitizeFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') {
      return 'unknown_file';
    }
    
    // Remove path separators and dangerous characters
    let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
    
    // Ensure not empty
    if (!sanitized) {
      sanitized = 'unknown_file';
    }
    
    return sanitized;
  }
  
  /**
   * Check if MIME type is allowed for message type
   */
  isAllowedMimeType(mimeType, messageType) {
    const type = mimeType.toLowerCase();
    
    switch (messageType) {
      case 'image':
        return this.allowedImageTypes.includes(type);
      case 'video':
        return this.allowedVideoTypes.includes(type);
      case 'audio':
      case 'voice':
        return this.allowedAudioTypes.includes(type);
      case 'document':
        return this.allowedDocumentTypes.includes(type) ||
               this.allowedImageTypes.includes(type); // Allow images as documents
      default:
        return false;
    }
  }
  
  /**
   * Validate voice data
   */
  validateVoiceData(voiceData) {
    if (!voiceData || typeof voiceData !== 'object') {
      throw new Error('Voice data is required and must be an object');
    }
    
    const { duration, size, mimeType, audioBase64 } = voiceData;
    
    // Validate duration
    if (!duration || typeof duration !== 'number' || duration <= 0) {
      throw new Error('Invalid voice message duration');
    }
    
    if (duration > 300) { // 5 minutes max
      throw new Error('Voice message too long (maximum 5 minutes)');
    }
    
    // Validate size
    if (!size || typeof size !== 'number' || size <= 0) {
      throw new Error('Invalid voice message size');
    }
    
    if (size > this.sizeLimits.voice) {
      throw new Error(`Voice message too large (maximum ${Math.round(this.sizeLimits.voice / 1024 / 1024)}MB)`);
    }
    
    // Validate MIME type
    if (!mimeType || !this.allowedAudioTypes.includes(mimeType.toLowerCase())) {
      throw new Error('Invalid voice message format');
    }
    
    // Validate base64 if present
    if (audioBase64) {
      if (typeof audioBase64 !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(audioBase64)) {
        throw new Error('Invalid voice message data');
      }
    }
    
    return {
      duration,
      size,
      mimeType: mimeType.toLowerCase(),
      audioBase64
    };
  }
  
  /**
   * Validate attachments array
   */
  validateAttachments(attachments) {
    if (!attachments) {
      return [];
    }
    
    if (!Array.isArray(attachments)) {
      throw new Error('Attachments must be an array');
    }
    
    if (attachments.length > 10) {
      throw new Error('Too many attachments (maximum 10)');
    }
    
    return attachments.map((attachment, index) => {
      if (!attachment || typeof attachment !== 'object') {
        throw new Error(`Invalid attachment at index ${index}`);
      }
      
      // Basic attachment validation
      if (!attachment.type || !attachment.url) {
        throw new Error(`Attachment at index ${index} missing required fields`);
      }
      
      return {
        type: this.sanitizeText(attachment.type, { maxLength: 50 }),
        url: validator.isURL(attachment.url) ? attachment.url : null,
        name: attachment.name ? this.sanitizeFileName(attachment.name) : null,
        size: attachment.size && typeof attachment.size === 'number' ? attachment.size : null
      };
    }).filter(attachment => attachment.url); // Remove invalid URLs
  }
  
  /**
   * Validate mentions array
   */
  validateMentions(mentions) {
    if (!mentions) {
      return [];
    }
    
    if (!Array.isArray(mentions)) {
      throw new Error('Mentions must be an array');
    }
    
    if (mentions.length > 20) {
      throw new Error('Too many mentions (maximum 20)');
    }
    
    return mentions.map(mention => {
      if (typeof mention !== 'string') {
        throw new Error('Each mention must be a string');
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(mention)) {
        throw new Error('Invalid mention format');
      }
      
      return mention.trim();
    }).filter(mention => mention.length > 0);
  }
  
  /**
   * Comprehensive message data validation
   */
  validateMessageData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Message data is required and must be an object');
    }
    
    const validated = {
      chatid: this.validateChatId(data.chatid),
      messageType: this.validateMessageType(data.messageType),
      clientMessageId: this.validateClientMessageId(data.clientMessageId),
      content: data.content ? this.sanitizeText(data.content, { maxLength: 2000 }) : '',
      attachments: this.validateAttachments(data.attachments),
      mentions: this.validateMentions(data.mentions),
      replyTo: data.replyTo ? this.validateClientMessageId(data.replyTo) : null
    };
    
    // Type-specific validation
    if (validated.messageType === 'voice' && data.voiceData) {
      validated.voiceData = this.validateVoiceData(data.voiceData);
    }
    
    if (['image', 'video', 'audio', 'document'].includes(validated.messageType) && data.fileData) {
      validated.fileData = this.validateFileData(data.fileData, validated.messageType);
    }
    
    if (validated.messageType === 'sticker' && data.stickerData) {
      validated.stickerData = this.validateStickerData(data.stickerData);
    }
    
    if (validated.messageType === 'gif' && data.gifData) {
      validated.gifData = this.validateGifData(data.gifData);
    }
    
    return validated;
  }
  
  /**
   * Validate sticker data
   */
  validateStickerData(stickerData) {
    if (!stickerData || typeof stickerData !== 'object') {
      throw new Error('Sticker data is required');
    }
    
    return {
      id: stickerData.id ? this.sanitizeText(stickerData.id, { maxLength: 100 }) : '',
      name: stickerData.name ? this.sanitizeText(stickerData.name, { maxLength: 100 }) : '',
      preview: stickerData.preview && validator.isURL(stickerData.preview) ? stickerData.preview : null,
      url: stickerData.url && validator.isURL(stickerData.url) ? stickerData.url : null,
      category: stickerData.category ? this.sanitizeText(stickerData.category, { maxLength: 50 }) : ''
    };
  }
  
  /**
   * Validate GIF data
   */
  validateGifData(gifData) {
    if (!gifData || typeof gifData !== 'object') {
      throw new Error('GIF data is required');
    }
    
    return {
      id: gifData.id ? this.sanitizeText(gifData.id, { maxLength: 100 }) : '',
      title: gifData.title ? this.sanitizeText(gifData.title, { maxLength: 200 }) : '',
      url: gifData.url && validator.isURL(gifData.url) ? gifData.url : null,
      thumbnail: gifData.thumbnail && validator.isURL(gifData.thumbnail) ? gifData.thumbnail : null,
      category: gifData.category ? this.sanitizeText(gifData.category, { maxLength: 50 }) : '',
      dimensions: gifData.dimensions && typeof gifData.dimensions === 'object' ? {
        width: parseInt(gifData.dimensions.width) || 0,
        height: parseInt(gifData.dimensions.height) || 0
      } : null
    };
  }
}

// Create singleton instance
const inputValidator = new InputValidator();

export default inputValidator;
