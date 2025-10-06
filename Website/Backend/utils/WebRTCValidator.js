/**
 * WebRTC Security Validator
 * Validates WebRTC signaling messages and ICE candidates for security
 */

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

class WebRTCValidator {
  constructor() {
    // Define allowed ICE candidate types for security
    this.allowedCandidateTypes = ['host', 'srflx', 'relay', 'prflx'];
    
    // Define allowed protocols
    this.allowedProtocols = ['udp', 'tcp'];
    
    // Maximum allowed candidates per message
    this.maxCandidatesPerMessage = 10;
    
    // SDP security patterns to block
    this.maliciousSdpPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /url\s*\(/i,
      /import\s/i,
      /@import/i
    ];
    
    // Define secure ICE server configurations
    this.secureIceServers = [
      // Google STUN servers (Primary)
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302'
        ]
      },
      // Cloudflare STUN servers
      {
        urls: ['stun:stun.cloudflare.com:3478']
      },
      // Additional reliable STUN servers
      {
        urls: [
          'stun:stun.stunprotocol.org:3478',
          'stun:openrelay.metered.ca:80'
        ]
      }
    ];
  }

  /**
   * Validate WebRTC offer SDP
   */
  validateOffer(offerData) {
    try {
      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        sanitized: null
      };

      // Basic structure validation
      if (!offerData || typeof offerData !== 'object') {
        validation.valid = false;
        validation.errors.push('Invalid offer data structure');
        return validation;
      }

      // Validate offer object
      if (!offerData.offer || typeof offerData.offer !== 'object') {
        validation.valid = false;
        validation.errors.push('Missing or invalid offer object');
        return validation;
      }

      // Validate SDP
      if (typeof offerData.offer.sdp !== 'string') {
        validation.valid = false;
        validation.errors.push('Missing or invalid SDP string');
        return validation;
      }

      // Validate offer type
      if (offerData.offer.type !== 'offer') {
        validation.valid = false;
        validation.errors.push('Invalid offer type');
        return validation;
      }

      // Security: Check for malicious SDP content
      const sdpValidation = this.validateSdpContent(offerData.offer.sdp);
      if (!sdpValidation.valid) {
        validation.valid = false;
        validation.errors.push(...sdpValidation.errors);
        return validation;
      }

      // Validate chat and user IDs
      if (offerData.chatid && !this.isValidChatId(offerData.chatid)) {
        validation.valid = false;
        validation.errors.push('Invalid chat ID format');
      }

      if (offerData.from && !this.isValidUserId(offerData.from)) {
        validation.valid = false;
        validation.errors.push('Invalid user ID format');
      }

      // Sanitize the SDP content
      validation.sanitized = {
        ...offerData,
        offer: {
          ...offerData.offer,
          sdp: this.sanitizeSdp(offerData.offer.sdp)
        }
      };

      return validation;

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        sanitized: null
      };
    }
  }

  /**
   * Validate WebRTC answer SDP
   */
  validateAnswer(answerData) {
    try {
      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        sanitized: null
      };

      // Basic structure validation
      if (!answerData || typeof answerData !== 'object') {
        validation.valid = false;
        validation.errors.push('Invalid answer data structure');
        return validation;
      }

      // Validate answer object
      if (!answerData.answer || typeof answerData.answer !== 'object') {
        validation.valid = false;
        validation.errors.push('Missing or invalid answer object');
        return validation;
      }

      // Validate SDP
      if (typeof answerData.answer.sdp !== 'string') {
        validation.valid = false;
        validation.errors.push('Missing or invalid SDP string');
        return validation;
      }

      // Validate answer type
      if (answerData.answer.type !== 'answer') {
        validation.valid = false;
        validation.errors.push('Invalid answer type');
        return validation;
      }

      // Security: Check for malicious SDP content
      const sdpValidation = this.validateSdpContent(answerData.answer.sdp);
      if (!sdpValidation.valid) {
        validation.valid = false;
        validation.errors.push(...sdpValidation.errors);
        return validation;
      }

      // Validate chat and user IDs
      if (answerData.chatid && !this.isValidChatId(answerData.chatid)) {
        validation.valid = false;
        validation.errors.push('Invalid chat ID format');
      }

      if (answerData.from && !this.isValidUserId(answerData.from)) {
        validation.valid = false;
        validation.errors.push('Invalid user ID format');
      }

      // Sanitize the SDP content
      validation.sanitized = {
        ...answerData,
        answer: {
          ...answerData.answer,
          sdp: this.sanitizeSdp(answerData.answer.sdp)
        }
      };

      return validation;

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        sanitized: null
      };
    }
  }

  /**
   * Validate ICE candidate data
   */
  validateIceCandidate(candidateData) {
    try {
      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        sanitized: null
      };

      // Basic structure validation
      if (!candidateData || typeof candidateData !== 'object') {
        validation.valid = false;
        validation.errors.push('Invalid candidate data structure');
        return validation;
      }

      // Validate candidate object
      if (!candidateData.candidate || typeof candidateData.candidate !== 'object') {
        validation.valid = false;
        validation.errors.push('Missing or invalid candidate object');
        return validation;
      }

      const candidate = candidateData.candidate;

      // Validate required fields
      if (typeof candidate.candidate !== 'string' || !candidate.candidate.trim()) {
        validation.valid = false;
        validation.errors.push('Missing or invalid candidate string');
        return validation;
      }

      if (typeof candidate.sdpMLineIndex !== 'number' || candidate.sdpMLineIndex < 0) {
        validation.valid = false;
        validation.errors.push('Invalid sdpMLineIndex');
      }

      if (typeof candidate.sdpMid !== 'string') {
        validation.valid = false;
        validation.errors.push('Invalid sdpMid');
      }

      // Parse and validate ICE candidate string
      const candidateValidation = this.parseAndValidateCandidate(candidate.candidate);
      if (!candidateValidation.valid) {
        validation.valid = false;
        validation.errors.push(...candidateValidation.errors);
        validation.warnings.push(...candidateValidation.warnings);
      }

      // Validate chat and user IDs
      if (candidateData.chatid && !this.isValidChatId(candidateData.chatid)) {
        validation.valid = false;
        validation.errors.push('Invalid chat ID format');
      }

      if (candidateData.from && !this.isValidUserId(candidateData.from)) {
        validation.valid = false;
        validation.errors.push('Invalid user ID format');
      }

      // Sanitize candidate data
      validation.sanitized = {
        ...candidateData,
        candidate: {
          ...candidateData.candidate,
          candidate: candidateValidation.sanitized || candidate.candidate
        }
      };

      return validation;

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        sanitized: null
      };
    }
  }

  /**
   * Parse and validate ICE candidate string
   */
  parseAndValidateCandidate(candidateString) {
    try {
      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        sanitized: candidateString.trim()
      };

      // Basic format validation
      if (!candidateString.startsWith('candidate:')) {
        validation.valid = false;
        validation.errors.push('Invalid candidate format - must start with "candidate:"');
        return validation;
      }

      // Parse candidate components
      const parts = candidateString.split(' ');
      if (parts.length < 6) {
        validation.valid = false;
        validation.errors.push('Invalid candidate format - insufficient parts');
        return validation;
      }

      const [candidatePrefix, foundation, component, protocol, priority, ip, port, type, ...rest] = parts;

      // Validate foundation (should be alphanumeric)
      if (!/^[a-zA-Z0-9]+$/.test(foundation)) {
        validation.warnings.push('Candidate foundation contains non-alphanumeric characters');
      }

      // Validate component (should be 1 or 2)
      if (component !== '1' && component !== '2') {
        validation.valid = false;
        validation.errors.push('Invalid component number - must be 1 or 2');
      }

      // Validate protocol
      if (!this.allowedProtocols.includes(protocol.toLowerCase())) {
        validation.valid = false;
        validation.errors.push(`Invalid protocol: ${protocol}. Allowed: ${this.allowedProtocols.join(', ')}`);
      }

      // Validate priority (should be a number)
      const priorityNum = parseInt(priority, 10);
      if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 2147483647) {
        validation.valid = false;
        validation.errors.push('Invalid priority value');
      }

      // Validate IP address
      if (!validator.isIP(ip)) {
        // Check if it's an FQDN for relay candidates
        if (type !== 'relay' || !validator.isFQDN(ip)) {
          validation.valid = false;
          validation.errors.push('Invalid IP address or FQDN');
        }
      }

      // Security: Block private IPs in certain contexts (optional warning)
      if (validator.isIP(ip)) {
        if (this.isPrivateIP(ip) && type === 'host') {
          validation.warnings.push('Host candidate uses private IP address');
        }
      }

      // Validate port
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        validation.valid = false;
        validation.errors.push('Invalid port number');
      }

      // Validate candidate type
      if (!this.allowedCandidateTypes.includes(type)) {
        validation.valid = false;
        validation.errors.push(`Invalid candidate type: ${type}. Allowed: ${this.allowedCandidateTypes.join(', ')}`);
      }

      return validation;

    } catch (error) {
      return {
        valid: false,
        errors: [`Candidate parsing error: ${error.message}`],
        warnings: [],
        sanitized: null
      };
    }
  }

  /**
   * Validate SDP content for security issues
   */
  validateSdpContent(sdp) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check for malicious patterns
    for (const pattern of this.maliciousSdpPatterns) {
      if (pattern.test(sdp)) {
        validation.valid = false;
        validation.errors.push(`Potentially malicious content detected in SDP`);
        break;
      }
    }

    // Check SDP length (prevent DoS)
    if (sdp.length > 50000) { // 50KB limit
      validation.valid = false;
      validation.errors.push('SDP content exceeds maximum allowed length');
    }

    // Validate basic SDP structure
    if (!sdp.includes('v=0')) {
      validation.valid = false;
      validation.errors.push('Invalid SDP - missing version line');
    }

    if (!sdp.includes('o=') || !sdp.includes('s=')) {
      validation.valid = false;
      validation.errors.push('Invalid SDP - missing required fields');
    }

    return validation;
  }

  /**
   * Sanitize SDP content
   */
  sanitizeSdp(sdp) {
    // Remove any potentially dangerous content
    let sanitized = DOMPurify.sanitize(sdp, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });

    // Additional SDP-specific sanitization
    sanitized = sanitized.replace(/javascript:/gi, 'removed:');
    sanitized = sanitized.replace(/vbscript:/gi, 'removed:');

    return sanitized;
  }

  /**
   * Validate chat ID format
   */
  isValidChatId(chatId) {
    if (typeof chatId !== 'string') return false;
    
    // Chat ID should be alphanumeric with possible dashes/underscores
    return /^[a-zA-Z0-9_-]+$/.test(chatId) && chatId.length >= 1 && chatId.length <= 50;
  }

  /**
   * Validate user ID format
   */
  isValidUserId(userId) {
    if (typeof userId !== 'string') return false;
    
    // User ID should be alphanumeric with possible dashes/underscores
    return /^[a-zA-Z0-9_-]+$/.test(userId) && userId.length >= 1 && userId.length <= 50;
  }

  /**
   * Check if IP is private/local
   */
  isPrivateIP(ip) {
    if (!validator.isIP(ip)) return false;
    
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Get secure ICE server configuration
   */
  getSecureIceServers() {
    return this.secureIceServers;
  }

  /**
   * Rate limiting for WebRTC signaling
   */
  checkSignalingRateLimit(userId, messageType) {
    // This would integrate with your existing rate limiter
    // For now, return a simple structure
    return {
      allowed: true,
      remaining: 100,
      resetTime: Date.now() + 60000
    };
  }
}

// Export singleton instance
export default new WebRTCValidator();