import Message from '../../Models/FeedModels/Message.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Profile from '../../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import BaseService from '../System/BaseService.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../../Helper/UnifiedErrorHandling.js';
import MongoDBSanitizer from '../../utils/MongoDBSanitizer.js';
import XSSSanitizer from '../../Utils/XSSSanitizer.js';
import MessageRepository from '../../Repositories/MessageRepository.js';
import ChatRepository from '../../Repositories/ChatRepository.js';
import ProfileRepository from '../../Repositories/ProfileRepository.js';

/**
 * @fileoverview Message service handling all message-related business logic
 * @module MessageService
 */

class MessageService extends BaseService {
  /**
   * @constructor
   * @description Initialize message service
   */
  constructor() {
    super();
    // Initialize repositories directly (not using DI container)
    console.log('🔧 [MESSAGE-SERVICE] Initializing MessageService...');
    this.messageRepository = new MessageRepository();
    console.log('✅ [MESSAGE-SERVICE] MessageRepository initialized');
    this.chatRepository = new ChatRepository();
    console.log('✅ [MESSAGE-SERVICE] ChatRepository initialized');
    this.profileRepository = new ProfileRepository();
    console.log('✅ [MESSAGE-SERVICE] ProfileRepository initialized');
  }

  /**
   * Send a new message
   * @param {string} chatId - Chat ID
   * @param {string} profileId - Sender profile ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message object
   */
  async sendMessage(chatId, profileId, messageData) {
    console.log('🟢 [SERVICE] sendMessage called');
    console.log('🟢 [SERVICE] Parameters:', {
      chatId,
      profileId,
      messageType: messageData?.messageType,
      contentLength: messageData?.content?.length,
      hasAttachments: messageData?.attachments?.length > 0
    });
    
    return this.handleOperation(async () => {
      console.log('🟢 [SERVICE] Starting handleOperation');
      
      this.validateRequiredParams({ chatId, profileId, messageData }, ['chatId', 'profileId', 'messageData']);
      console.log('🟢 [SERVICE] Parameters validated');
      
      const { content, messageType = 'text', attachments = [], replyTo, mentions = [], clientMessageId } = messageData;

      // Check if user has access to this chat (lean query for validation)
      console.log('🟢 [SERVICE] Checking chat access for chatId:', chatId, 'profileId:', profileId);
      const chatLean = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      console.log('🟢 [SERVICE] Chat found:', chatLean ? {
        chatid: chatLean.chatid,
        chatType: chatLean.chatType,
        participantCount: chatLean.participants?.length
      } : 'NULL');
      
      if (!chatLean) {
        console.error('❌ [SERVICE] Chat not found or user has no access');
        throw new AuthorizationError('Cannot send message to this chat');
      }

      // Check if user is a participant (manual check since lean object doesn't have methods)
      console.log('🟢 [SERVICE] Checking if user is participant');
      console.log('🟢 [SERVICE] Participants:', chatLean.participants?.map(p => ({
        profileid: p.profileid,
        isMatch: p.profileid === profileId
      })));
      
      const isParticipant = chatLean.participants.some(p => p.profileid === profileId);
      console.log('🟢 [SERVICE] Is participant:', isParticipant);
      
      if (!isParticipant) {
        console.error('❌ [SERVICE] User is not a participant in this chat');
        throw new AuthorizationError('You are not a participant in this chat');
      }

      // Sanitize message content to prevent XSS attacks
      console.log('🟢 [SERVICE] Sanitizing content');
      const sanitizedContent = XSSSanitizer.sanitizeMessageContent(content);
      console.log('🟢 [SERVICE] Content sanitized, length:', sanitizedContent?.length);

      // Create new message
      const messageId = uuidv4();
      console.log('🟢 [SERVICE] Creating new message with ID:', messageId);
      
      const newMessage = new Message({
        messageid: messageId,
        clientMessageId: clientMessageId || messageId, // Use clientMessageId from frontend or fallback to messageId
        chatid: chatId,
        senderid: profileId,
        messageType,
        content: sanitizedContent,
        attachments,
        replyTo,
        mentions,
        messageStatus: 'sent'
      });

      console.log('🟢 [SERVICE] Saving message to database');
      await newMessage.save();
      console.log('✅ [SERVICE] Message saved successfully');

      // Update chat's last message (need to fetch non-lean document for save)
      console.log('🟢 [SERVICE] Updating chat last message');
      const chat = await Chat.findOne({ chatid: chatId });
      if (chat) {
        console.log('🟢 [SERVICE] Chat document found, updating');
        chat.lastMessage = newMessage.messageid;
        chat.lastMessageAt = new Date();
        
        // Increment unread count for all participants except sender
        chat.participants.forEach(participant => {
          if (participant.profileid !== profileId) {
            participant.unreadCount = (participant.unreadCount || 0) + 1;
          }
        });
        
        await chat.save();
        console.log('✅ [SERVICE] Chat updated successfully');
      } else {
        console.warn('⚠️ [SERVICE] Chat document not found for update');
      }
      
      // Emit message to all participants (this would be handled by SocketController in the real implementation)
      // For now, we'll just return the message
      console.log('🟢 [SERVICE] Formatting and returning message');
      
      const formattedMessage = this.formatEntity(newMessage);
      console.log('✅ [SERVICE] sendMessage completed successfully:', {
        messageid: formattedMessage?.messageid,
        chatid: formattedMessage?.chatid
      });
      
      return formattedMessage;
    }, 'sendMessage', { chatId, profileId });
  }

  /**
   * Edit a message
   * @param {string} messageId - Message ID
   * @param {string} profileId - Editor profile ID
   * @param {string} content - New message content
   * @returns {Promise<Object>} Updated message object
   */
  async editMessage(messageId, profileId, content) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ messageId, profileId, content }, ['messageId', 'profileId', 'content']);
      
      const message = await this.messageRepository.getMessageByIdAndChatId(messageId, null);
      
      if (!message) {
        throw new NotFoundError('Message not found');
      }
      
      // Check if user is the sender
      if (message.senderid !== profileId) {
        throw new AuthorizationError('Cannot edit other users\' messages');
      }
      
      // Sanitize message content to prevent XSS attacks
      const sanitizedContent = XSSSanitizer.sanitizeMessageContent(content);
      
      message.content = sanitizedContent;
      message.edited = true;
      message.updatedAt = new Date();
      
      await message.save();
      
      return this.formatEntity(message);
    }, 'editMessage', { messageId, profileId });
  }

  /**
   * Delete a message
   * @param {string} messageId - Message ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<Object>} Deleted message object
   */
  async deleteMessage(messageId, profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ messageId, profileId }, ['messageId', 'profileId']);
      
      const message = await this.messageRepository.findById(messageId);
      
      if (!message) {
        throw new NotFoundError('Message not found');
      }
      
      // Check if user is the sender or an admin
      const chatLean = await this.chatRepository.getChatByIdAndProfileId(message.chatid, profileId);
      if (!chatLean) {
        throw new AuthorizationError('Cannot access this chat');
      }
      
      const isAdmin = chatLean.adminIds && chatLean.adminIds.some(id => id === profileId || id.toString() === profileId);
      
      if (message.senderid !== profileId && !isAdmin) {
        throw new AuthorizationError('Cannot delete this message');
      }
      
      // Soft delete for sender, hard delete for admin
      if (isAdmin) {
        // Hard delete
        await this.messageRepository.deleteOne({ messageid: messageId });
        message.isDeleted = true;
        message.deletedBy = profileId;
        message.deletedAt = new Date();
      } else {
        // Soft delete
        message.isDeleted = true;
        message.deletedBy = profileId;
        message.deletedAt = new Date();
        message.content = '';
        message.attachments = [];
      }
      
      await message.save();
      
      return this.formatEntity(message);
    }, 'deleteMessage', { messageId, profileId });
  }

  /**
   * Add reaction to message
   * @param {string} messageId - Message ID
   * @param {string} profileId - Reacting user profile ID
   * @param {string} emoji - Emoji reaction
   * @returns {Promise<Object>} Updated message object
   */
  async reactToMessage(messageId, profileId, emoji) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ messageId, profileId, emoji }, ['messageId', 'profileId', 'emoji']);
      
      const message = await this.messageRepository.getMessageByIdAndChatId(messageId, null);
      
      if (!message) {
        throw new NotFoundError('Message not found');
      }
      
      // Check if user has access to this chat
      const chatLean = await this.chatRepository.getChatByIdAndProfileId(message.chatid, profileId);
      if (!chatLean) {
        throw new AuthorizationError('Cannot react to messages in this chat');
      }
      
      // Check if user is a participant (manual check since lean object doesn't have methods)
      const isParticipant = chatLean.participants.some(p => p.profileid === profileId);
      if (!isParticipant) {
        throw new AuthorizationError('You are not a participant in this chat');
      }
      
      // Add reaction
      const existingReactionIndex = message.reactions.findIndex(
        r => r.profileid === profileId && r.emoji === emoji
      );
      
      if (existingReactionIndex === -1) {
        message.reactions.push({
          profileid: profileId,
          emoji,
          createdAt: new Date()
        });
      }
      
      await message.save();
      
      return this.formatEntity(message);
    }, 'reactToMessage', { messageId, profileId });
  }

  /**
   * Remove reaction from message
   * @param {string} messageId - Message ID
   * @param {string} profileId - User profile ID
   * @param {string} emoji - Emoji reaction
   * @returns {Promise<Object>} Updated message object
   */
  async removeReaction(messageId, profileId, emoji) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ messageId, profileId, emoji }, ['messageId', 'profileId', 'emoji']);
      
      const message = await this.messageRepository.getMessageByIdAndChatId(messageId, null);
      
      if (!message) {
        throw new NotFoundError('Message not found');
      }
      
      // Check if user has access to this chat
      const chatLean = await this.chatRepository.getChatByIdAndProfileId(message.chatid, profileId);
      if (!chatLean) {
        throw new AuthorizationError('Cannot remove reactions in this chat');
      }
      
      // Check if user is a participant (manual check since lean object doesn't have methods)
      const isParticipant = chatLean.participants.some(p => p.profileid === profileId);
      if (!isParticipant) {
        throw new AuthorizationError('You are not a participant in this chat');
      }
      
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.profileid === profileId && r.emoji === emoji)
      );
      
      await message.save();
      
      return this.formatEntity(message);
    }, 'removeReaction', { messageId, profileId });
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @param {string} profileId - Reader profile ID
   * @returns {Promise<Object>} Updated message object
   */
  async markMessageAsRead(messageId, profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ messageId, profileId }, ['messageId', 'profileId']);
      
      const message = await this.messageRepository.getMessageByIdAndChatId(messageId, null);
      
      if (!message) {
        throw new NotFoundError('Message not found');
      }
      
      // Check if user has access to this chat
      const chatLean = await this.chatRepository.getChatByIdAndProfileId(message.chatid, profileId);
      if (!chatLean) {
        throw new AuthorizationError('Cannot mark messages as read in this chat');
      }
      
      // Check if user is a participant (manual check since lean object doesn't have methods)
      const isParticipant = chatLean.participants.some(p => p.profileid === profileId);
      if (!isParticipant) {
        throw new AuthorizationError('You are not a participant in this chat');
      }
      
      // Update read status
      const readStatusIndex = message.readBy.findIndex(r => r.profileid === profileId);
      
      if (readStatusIndex === -1) {
        message.readBy.push({
          profileid: profileId,
          readAt: new Date()
        });
      } else {
        message.readBy[readStatusIndex].readAt = new Date();
      }
      
      await message.save();
      
      // Update chat unread count (need to fetch non-lean document for save)
      const chat = await Chat.findOne({ chatid: message.chatid });
      if (chat) {
        const participantIndex = chat.participants.findIndex(p => p.profileid === profileId);
        if (participantIndex !== -1 && chat.participants[participantIndex].unreadCount > 0) {
          chat.participants[participantIndex].unreadCount -= 1;
          await chat.save();
        }
      }
      
      return this.formatEntity(message);
    }, 'markMessageAsRead', { messageId, profileId });
  }

  /**
   * Search messages in a chat with pagination
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @param {string} query - Search query
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated messages with metadata
   */
  async searchMessagesPaginated(chatId, profileId, query, paginationOptions = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId, query }, ['chatId', 'profileId', 'query']);
      
      // Check if user has access to this chat
      const chat = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      if (!chat || !chat.participants.some(p => p.profileid === profileId)) {
        throw new AuthorizationError('Cannot search this chat');
      }

      // 🔧 PAGINATION #83: Use the new paginated repository method with search criteria
      const searchCriteria = {
        chatid: chatId,
        content: { $regex: query, $options: 'i' },
        isDeleted: false
      };

      const paginatedMessages = await this.messageRepository.paginate(searchCriteria, {
        sort: { createdAt: -1 },
        select: 'messageid clientMessageId chatid senderid messageType content attachments replyTo mentions reactions readBy isEdited messageStatus deliveredTo isPinned threadReplies createdAt',
        ...paginationOptions
      });

      return paginatedMessages;
    }, 'searchMessagesPaginated', { chatId, profileId, query, paginationOptions });
  }

  /**
   * Search messages in a chat
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching messages
   */
  async searchMessages(chatId, profileId, query) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId, query }, ['chatId', 'profileId', 'query']);
      
      // Check if user has access to this chat
      const chat = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      if (!chat || !chat.participants.some(p => p.profileid === profileId)) {
        throw new AuthorizationError('Cannot search this chat');
      }

      // 🔧 OPTIMIZATION #75: Use repository method with proper indexing and projection
      const messages = await this.messageRepository.searchMessages(chatId, query, { limit: 20 });

      return messages;
    }, 'searchMessages', { chatId, profileId });
  }

  /**
   * Get message by ID
   * @param {string} messageId - Message ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<Object>} Message object
   */
  async getMessageById(messageId, profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ messageId, profileId }, ['messageId', 'profileId']);
      
      // 🔒 SECURITY FIX: Sanitize message ID to prevent MongoDB injection
      const sanitizedMessageId = MongoDBSanitizer.sanitizeObjectId(messageId);
      if (!sanitizedMessageId) {
        throw new ValidationError('Invalid message ID');
      }
      
      // 🔧 OPTIMIZATION #75: Use lean query with proper projection
      const message = await this.messageRepository.findOne({ messageid: sanitizedMessageId, isDeleted: false }, {
        lean: true
      });
      
      if (!message) {
        throw new NotFoundError('Message not found');
      }

      // Check if user has access to this chat
      // 🔧 OPTIMIZATION #75: Use lean query with proper projection
      const chat = await this.chatRepository.findOne({ chatid: message.chatid }, {
        lean: true,
        select: 'participants'
      });
      
      if (!chat || !chat.participants.some(p => p.profileid === profileId)) {
        throw new AuthorizationError('Cannot access this message');
      }

      return message;
    }, 'getMessageById', { messageId, profileId });
  }
}

export default MessageService;






