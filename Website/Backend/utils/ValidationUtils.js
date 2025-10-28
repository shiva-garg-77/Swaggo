import Joi from 'joi';
import validator from 'validator';

/**
 * Validation Utilities for GraphQL Resolvers
 * Provides Joi-based validation for input parameters
 */

// Validation schemas
const ValidationSchemas = {
  // Query validations
  chats: Joi.object({
    profileid: Joi.string().optional().min(1).max(100)
  }),

  chat: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  chatByParticipants: Joi.object({
    participants: Joi.array().items(Joi.string().min(1).max(100)).min(1).max(100).required()
  }),

  messages: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(100).optional(),
    cursor: Joi.string().optional().allow(null, '')
  }),

  message: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  getUserChats: Joi.object({
    profileid: Joi.string().required().min(1).max(100)
  }),

  searchChats: Joi.object({
    profileid: Joi.string().required().min(1).max(100),
    query: Joi.string().required().min(1).max(500)
  }),

  getChatParticipants: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
  }),

  getChatAdmins: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
  }),

  getMessagesByChatWithPagination: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(100).optional(),
    cursor: Joi.string().optional().allow(null, '')
  }),

  searchMessagesInChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    query: Joi.string().required().min(1).max(500)
  }),

  getCallHistoryByUser: Joi.object({
    profileid: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).optional()
  }),

  getCallHistoryByChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).optional()
  }),

  getScheduledMessagesByChat: Joi.object({
    chatId: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).optional()
  }),

  getScheduledMessagesByUser: Joi.object({
    profileid: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).optional()
  }),

  getChats: Joi.object({
    profileid: Joi.string().required().min(1).max(100)
  }),

  getChatById: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
  }),

  getChatByParticipants: Joi.object({
    participants: Joi.array().items(Joi.string().min(1).max(100)).min(1).max(100)
  }),

  getMessagesByChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    limit: Joi.number().integer().min(1).max(100).default(50),
    cursor: Joi.string().optional().allow(null, '')
  }),

  getMessageById: Joi.object({
    messageid: Joi.string().required().min(1).max(100)
  }),

  searchMessages: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    query: Joi.string().required().min(1).max(500)
  }),

  getUnreadMessageCount: Joi.object({
    profileid: Joi.string().required().min(1).max(100)
  }),

  getChatUnreadCount: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    profileid: Joi.string().required().min(1).max(100)
  }),

  // Mutation validations
  createChat: Joi.object({
    input: Joi.object({
      participants: Joi.array().items(Joi.string().min(1).max(100)).min(2).max(100).required(),
      chatType: Joi.string().valid('direct', 'group', 'broadcast', 'channel').optional(),
      chatName: Joi.string().optional().min(1).max(100),
      chatAvatar: Joi.string().optional().uri().max(500)
    }).required()
  }),

  updateChat: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      chatName: Joi.string().optional().min(1).max(100),
      chatAvatar: Joi.string().optional().uri().max(500)
    }).required()
  }),

  deleteChat: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  sendMessage: Joi.object({
    input: Joi.object({
      chatid: Joi.string().required().min(1).max(100),
      messageType: Joi.string().required().valid('text', 'image', 'video', 'audio', 'file', 'sticker', 'gif'),
      content: Joi.string().optional().max(5000),
      attachments: Joi.array().items(Joi.object({
        fileid: Joi.string().required(),
        url: Joi.string().uri().required(),
        filename: Joi.string().required(),
        size: Joi.number().integer().positive(),
        mimetype: Joi.string().required()
      })).optional(),
      replyTo: Joi.string().optional().allow(null, ''),
      mentions: Joi.array().items(Joi.string()).optional()
    }).required()
  }),

  editMessage: Joi.object({
    id: Joi.string().required().min(1).max(100),
    content: Joi.string().required().min(1).max(5000)
  }),

  deleteMessage: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),



  // Additional chat mutations
  createGroupChat: Joi.object({
    input: Joi.object({
      chatName: Joi.string().required().min(1).max(100),
      participants: Joi.array().items(Joi.string().min(1).max(100)).min(2).max(100).required(),
      chatAvatar: Joi.string().optional().uri().max(500)
    }).required()
  }),

  updateChatSettings: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    input: Joi.object({
      chatName: Joi.string().optional().min(1).max(100),
      chatAvatar: Joi.string().optional().uri().max(500)
    }).required()
  }),

  deleteChatWithMessages: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
  }),

  addParticipantToChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    profileid: Joi.string().required().min(1).max(100)
  }),

  removeParticipantFromChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    profileid: Joi.string().required().min(1).max(100)
  }),

  makeAdmin: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    profileid: Joi.string().required().min(1).max(100)
  }),

  removeAdmin: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    profileid: Joi.string().required().min(1).max(100)
  }),

  muteChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
  }),

  unmuteChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
  }),

  sendMessageWithAttachments: Joi.object({
    input: Joi.object({
      chatid: Joi.string().required().min(1).max(100),
      content: Joi.string().optional().max(5000),
      attachments: Joi.array().items(Joi.object({
        fileid: Joi.string().required(),
        url: Joi.string().uri().required(),
        filename: Joi.string().required(),
        size: Joi.number().integer().positive(),
        mimetype: Joi.string().required()
      })).required()
    }).required()
  }),

  editMessageWithHistory: Joi.object({
    messageid: Joi.string().required().min(1).max(100),
    content: Joi.string().required().min(1).max(5000)
  }),

  deleteMessageForEveryone: Joi.object({
    messageid: Joi.string().required().min(1).max(100)
  }),

  deleteMessageForMe: Joi.object({
    messageid: Joi.string().required().min(1).max(100)
  }),

  reactToMessage: Joi.object({
    messageid: Joi.string().required().min(1).max(100),
    emoji: Joi.string().required().min(1).max(10)
  }),

  removeReaction: Joi.object({
    messageid: Joi.string().required().min(1).max(100),
    emoji: Joi.string().required().min(1).max(10)
  }),

  markMessageAsRead: Joi.object({
    messageid: Joi.string().required().min(1).max(100)
  }),

  markChatAsRead: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
  }),

  updateCallLog: Joi.object({
    callId: Joi.string().required().min(1).max(100),
    input: Joi.object({
      status: Joi.string().optional(),
      duration: Joi.number().integer().optional()
    }).required()
  }),

  deleteCallLog: Joi.object({
    callId: Joi.string().required().min(1).max(100)
  }),

  createScheduledMessageWithMedia: Joi.object({
    input: Joi.object({
      chatid: Joi.string().required().min(1).max(100),
      content: Joi.string().optional().max(5000),
      scheduledAt: Joi.date().required(),
      attachments: Joi.array().optional()
    }).required()
  }),

  updateScheduledMessage: Joi.object({
    scheduledMessageId: Joi.string().required().min(1).max(100),
    input: Joi.object({
      content: Joi.string().optional().max(5000),
      scheduledAt: Joi.date().optional()
    }).required()
  }),

  cancelScheduledMessageWithNotification: Joi.object({
    scheduledMessageId: Joi.string().required().min(1).max(100)
  }),

  // ==========================================
  // USER & PROFILE MUTATIONS
  // ==========================================

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(128)
  }),

  signup: Joi.object({
    username: Joi.string().required().min(3).max(30),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(128)
  }),

  createUser: Joi.object({
    input: Joi.object({
      username: Joi.string().required().min(3).max(30),
      email: Joi.string().email().required(),
      password: Joi.string().required().min(6).max(128),
      profilePicture: Joi.string().uri().optional()
    }).required()
  }),

  updateUser: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      username: Joi.string().optional().min(3).max(30),
      email: Joi.string().email().optional(),
      profilePicture: Joi.string().uri().optional()
    }).required()
  }),

  deleteUser: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  createProfile: Joi.object({
    input: Joi.object({
      username: Joi.string().required().min(3).max(30),
      name: Joi.string().optional().max(100),
      bio: Joi.string().optional().max(500),
      profilePic: Joi.string().uri().optional()
    }).required()
  }),

  updateProfile: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      username: Joi.string().optional().min(3).max(30),
      name: Joi.string().optional().max(100),
      bio: Joi.string().optional().max(500),
      profilePic: Joi.string().uri().optional()
    }).required()
  }),

  deleteProfile: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  updateProfileSettings: Joi.object({
    profileid: Joi.string().required().min(1).max(100),
    input: Joi.object({
      privacy: Joi.string().optional(),
      notifications: Joi.boolean().optional()
    }).required()
  }),

  // ==========================================
  // POST MUTATIONS
  // ==========================================

  createPost: Joi.object({
    input: Joi.object({
      content: Joi.string().optional().max(10000),
      mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
      postType: Joi.string().valid('text', 'image', 'video', 'link').optional()
    }).required()
  }),

  updatePost: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      content: Joi.string().optional().max(10000),
      mediaUrls: Joi.array().items(Joi.string().uri()).optional()
    }).required()
  }),

  deletePost: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  createPostWithMedia: Joi.object({
    input: Joi.object({
      content: Joi.string().optional().max(10000),
      mediaUrls: Joi.array().items(Joi.string().uri()).required(),
      postType: Joi.string().valid('text', 'image', 'video', 'link').optional()
    }).required()
  }),

  // ==========================================
  // COMMENT MUTATIONS
  // ==========================================

  createComment: Joi.object({
    input: Joi.object({
      postid: Joi.string().required().min(1).max(100),
      content: Joi.string().required().min(1).max(5000)
    }).required()
  }),

  updateComment: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      content: Joi.string().required().min(1).max(5000)
    }).required()
  }),

  deleteComment: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  // ==========================================
  // LIKE MUTATIONS
  // ==========================================

  toggleLike: Joi.object({
    input: Joi.object({
      postid: Joi.string().required().min(1).max(100),
      profileid: Joi.string().required().min(1).max(100)
    }).required()
  }),

  // ==========================================
  // DRAFT MUTATIONS
  // ==========================================

  createDraft: Joi.object({
    input: Joi.object({
      content: Joi.string().optional().max(10000),
      mediaUrls: Joi.array().items(Joi.string().uri()).optional()
    }).required()
  }),

  updateDraft: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      content: Joi.string().optional().max(10000),
      mediaUrls: Joi.array().items(Joi.string().uri()).optional()
    }).required()
  }),

  deleteDraft: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  publishDraft: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  // ==========================================
  // MEMORY MUTATIONS
  // ==========================================

  createMemory: Joi.object({
    input: Joi.object({
      content: Joi.string().optional().max(10000),
      mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
      date: Joi.date().optional()
    }).required()
  }),

  updateMemory: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      content: Joi.string().optional().max(10000),
      mediaUrls: Joi.array().items(Joi.string().uri()).optional(),
      date: Joi.date().optional()
    }).required()
  }),

  deleteMemory: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  // ==========================================
  // STORY MUTATIONS
  // ==========================================

  createStory: Joi.object({
    input: Joi.object({
      mediaUrl: Joi.string().uri().required(),
      mediaType: Joi.string().valid('image', 'video').required(),
      duration: Joi.number().integer().optional()
    }).required()
  }),

  deleteStory: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  createStoryWithPreview: Joi.object({
    input: Joi.object({
      mediaUrl: Joi.string().uri().required(),
      mediaType: Joi.string().valid('image', 'video').required(),
      previewUrl: Joi.string().uri().optional(),
      duration: Joi.number().integer().optional()
    }).required()
  }),

  // ==========================================
  // HIGHLIGHT MUTATIONS
  // ==========================================

  createHighlight: Joi.object({
    input: Joi.object({
      title: Joi.string().required().min(1).max(100),
      storyIds: Joi.array().items(Joi.string().min(1).max(100)).required(),
      coverUrl: Joi.string().uri().optional()
    }).required()
  }),

  updateHighlight: Joi.object({
    id: Joi.string().required().min(1).max(100),
    input: Joi.object({
      title: Joi.string().optional().min(1).max(100),
      storyIds: Joi.array().items(Joi.string().min(1).max(100)).optional(),
      coverUrl: Joi.string().uri().optional()
    }).required()
  }),

  deleteHighlight: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  // ==========================================
  // SCHEDULED MESSAGE MUTATIONS
  // ==========================================

  createScheduledMessage: Joi.object({
    input: Joi.object({
      chatid: Joi.string().required().min(1).max(100),
      content: Joi.string().optional().max(5000),
      scheduledFor: Joi.date().required()
    }).required()
  }),

  cancelScheduledMessage: Joi.object({
    scheduledMessageId: Joi.string().required().min(1).max(100)
  }),

  // ==========================================
  // QUERY VALIDATIONS
  // ==========================================

  user: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  userByUsername: Joi.object({
    username: Joi.string().required().min(3).max(30)
  }),

  users: Joi.object({}),

  profile: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  profileByUsername: Joi.object({
    username: Joi.string().required().min(3).max(30)
  }),

  profiles: Joi.object({}),

  post: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  posts: Joi.object({}),

  drafts: Joi.object({
    profileid: Joi.string().required().min(1).max(100)
  }),

  draft: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  memories: Joi.object({
    profileid: Joi.string().required().min(1).max(100)
  }),

  memory: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  comments: Joi.object({
    postid: Joi.string().required().min(1).max(100)
  }),

  comment: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  likes: Joi.object({
    postid: Joi.string().required().min(1).max(100)
  }),

  like: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  stories: Joi.object({
    profileid: Joi.string().optional().min(1).max(100)
  }),

  story: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  highlights: Joi.object({
    profileid: Joi.string().required().min(1).max(100)
  }),

  highlight: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  callHistory: Joi.object({
    profileid: Joi.string().required().min(1).max(100)
  }),

  callLog: Joi.object({
    id: Joi.string().required().min(1).max(100)
  }),

  scheduledMessages: Joi.object({
    chatId: Joi.string().optional().min(1).max(100)
  }),

  scheduledMessage: Joi.object({
    scheduledMessageId: Joi.string().required().min(1).max(100)
  })
};

/**
 * Validate input against a schema
 * @param {Object} input - Input data to validate
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @returns {Object} Validation result with value and error
 */
const validateInput = (input, schema) => {
  return schema.validate(input, { abortEarly: false, stripUnknown: true });
};

/**
 * Validate GraphQL arguments
 * @param {Object} args - GraphQL arguments
 * @param {string} schemaName - Name of the schema to use for validation
 * @returns {Object} Validated arguments
 * @throws {Error} If validation fails
 */
const validateArgs = (args, schemaName) => {
  const schema = ValidationSchemas[schemaName];
  if (!schema) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }

  const { error, value } = validateInput(args, schema);

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }

  return value;
};

// Additional validation utilities from Helper/ValidationUtils.js

/**
 * Validate profile ID
 * @param {string} profileid - Profile ID to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid
 */
const validateProfileId = (profileid) => {
  if (!profileid || typeof profileid !== 'string') {
    throw new Error('Invalid profile ID format');
  }

  if (!validator.isUUID(profileid, 4)) {
    throw new Error('Profile ID must be a valid UUID');
  }

  return true;
};

/**
 * Validate post ID
 * @param {string} postid - Post ID to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid
 */
const validatePostId = (postid) => {
  if (!postid || typeof postid !== 'string') {
    throw new Error('Invalid post ID format');
  }

  if (!validator.isUUID(postid, 4)) {
    throw new Error('Post ID must be a valid UUID');
  }

  return true;
};

/**
 * Sanitize text input
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized text
 * @throws {Error} If text exceeds maximum length
 */
const sanitizeText = (text, maxLength = 5000) => {
  if (!text || typeof text !== 'string') return '';

  // Remove potentially dangerous HTML/JS content
  const sanitized = validator.escape(text.trim());

  if (sanitized.length > maxLength) {
    throw new Error(`Text content exceeds maximum length of ${maxLength} characters`);
  }

  return sanitized;
};

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {string} Normalized email
 * @throws {Error} If invalid
 */
const validateEmail = (email) => {
  if (!email || !validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }

  return validator.normalizeEmail(email, {
    gmail_remove_dots: true,
    gmail_lowercase: true
  });
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {string} Sanitized username
 * @throws {Error} If invalid
 */
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required');
  }

  const sanitized = username.trim();

  if (sanitized.length < 3 || sanitized.length > 30) {
    throw new Error('Username must be between 3 and 30 characters');
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
    throw new Error('Username can only contain letters, numbers, dots, underscores, and hyphens');
  }

  return sanitized;
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  if (password.length < 6 || password.length > 128) {
    throw new Error('Password must be between 6 and 128 characters');
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      throw new Error('Password is too weak or common');
    }
  }

  return true;
};

/**
 * Validate post content
 * @param {string} content - Content to validate
 * @param {string} postType - Type of post
 * @returns {string} Validated content
 * @throws {Error} If invalid
 */
const validatePostContent = (content, postType = 'text') => {
  if (!content) {
    throw new Error('Post content is required');
  }

  switch (postType.toLowerCase()) {
    case 'text':
      return sanitizeText(content, 10000); // 10k char limit for text posts
    case 'image':
    case 'video':
      // For media posts, content might be a URL
      if (typeof content === 'string' && content.startsWith('http')) {
        if (!validator.isURL(content, {
          protocols: ['http', 'https'],
          require_tld: false // Allow localhost URLs
        })) {
          throw new Error('Invalid media URL format');
        }
      }
      return content;
    default:
      throw new Error('Invalid post type');
  }
};

/**
 * Validate pagination parameters
 * @param {number} limit - Number of items per page
 * @param {number} offset - Offset for pagination
 * @returns {Object} Validated pagination parameters
 */
const validatePagination = (limit = 10, offset = 0) => {
  const validLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100); // 1-100 range
  const validOffset = Math.max(parseInt(offset) || 0, 0); // Non-negative

  return { limit: validLimit, offset: validOffset };
};

/**
 * Validate file upload
 * @param {Object} file - File object to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid
 */
const validateFileUpload = (file) => {
  if (!file) {
    throw new Error('File is required');
  }

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxFileSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }

  return true;
};

/**
 * Generate rate limit key
 * @param {string} userId - User ID
 * @param {string} action - Action name
 * @returns {string} Rate limit key
 */
const rateLimitKey = (userId, action) => {
  return `rate_limit:${action}:${userId}`;
};

/**
 * Create standard error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Error object
 */
const createStandardError = (message, code = 'BAD_REQUEST', statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error) => {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };
};

export { validateArgs, ValidationSchemas, validateInput, validateProfileId, validatePostId, sanitizeText, validateEmail, validateUsername, validatePassword, validatePostContent, validatePagination, validateFileUpload, rateLimitKey, createStandardError, formatErrorResponse };