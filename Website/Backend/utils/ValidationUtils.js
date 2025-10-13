import Joi from 'joi';

/**
 * Validation Utilities for GraphQL Resolvers
 * Provides Joi-based validation for input parameters
 */

// Validation schemas
const ValidationSchemas = {
  // Query validations
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
  UpdateChat: Joi.object({
    chatid: Joi.string().required().min(1).max(100),
    chatName: Joi.string().optional().min(1).max(100),
    chatAvatar: Joi.string().optional().uri().max(500)
  }),

  SendMessage: Joi.object({
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
  }),

  EditMessage: Joi.object({
    messageid: Joi.string().required().min(1).max(100),
    content: Joi.string().required().min(1).max(5000)
  }),

  DeleteMessage: Joi.object({
    messageid: Joi.string().required().min(1).max(100)
  }),

  ReactToMessage: Joi.object({
    messageid: Joi.string().required().min(1).max(100),
    emoji: Joi.string().required().min(1).max(10)
  }),

  RemoveReaction: Joi.object({
    messageid: Joi.string().required().min(1).max(100),
    emoji: Joi.string().required().min(1).max(10)
  }),

  MarkMessageAsRead: Joi.object({
    messageid: Joi.string().required().min(1).max(100)
  }),

  MarkChatAsRead: Joi.object({
    chatid: Joi.string().required().min(1).max(100)
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

export { validateArgs, ValidationSchemas };