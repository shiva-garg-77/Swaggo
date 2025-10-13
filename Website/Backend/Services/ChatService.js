import Chat from '../Models/FeedModels/Chat.js';
import Message from '../Models/FeedModels/Message.js';
import Profile from '../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import BaseService from './BaseService.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../Helper/UnifiedErrorHandling.js';
import MongoDBSanitizer from '../utils/MongoDBSanitizer.js';
import ChatRepository from '../Repositories/ChatRepository.js';
import MessageRepository from '../Repositories/MessageRepository.js';
import ProfileRepository from '../Repositories/ProfileRepository.js';

/**
 * @fileoverview Chat service handling all chat-related business logic
 * @module ChatService
 */

class ChatService extends BaseService {
  /**
   * @constructor
   * @description Initialize chat service
   */
  constructor() {
    super();
    // Repositories will be injected by the DI container
    this.chatRepository = null;
    this.messageRepository = null;
    this.profileRepository = null;
  }

  /**
   * Get all chats for a user with pagination
   * @param {string} profileId - User profile ID
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated chats with metadata
   */
  async getChatsPaginated(profileId, paginationOptions = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId }, ['profileId']);
      
      // 🔒 SECURITY FIX: Sanitize profile ID to prevent MongoDB injection
      const sanitizedProfileId = MongoDBSanitizer.sanitizeObjectId(profileId);
      if (!sanitizedProfileId) {
        throw new ValidationError('Invalid profile ID');
      }

      // 🔧 PAGINATION #83: Use the new paginated repository method
      const paginatedChats = await this.chatRepository.getChatsByProfileIdPaginated(sanitizedProfileId, paginationOptions);

      return paginatedChats;
    }, 'getChatsPaginated', { profileId, paginationOptions });
  }

  /**
   * Get all chats for a user
   * @param {string} profileId - User profile ID
   * @returns {Promise<Array>} Array of chats
   */
  async getChats(profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId }, ['profileId']);
      
      // 🔒 SECURITY FIX: Sanitize profile ID to prevent MongoDB injection
      const sanitizedProfileId = MongoDBSanitizer.sanitizeObjectId(profileId);
      if (!sanitizedProfileId) {
        throw new ValidationError('Invalid profile ID');
      }

      // 🔧 OPTIMIZATION #77: Use caching for frequently accessed data
      const chats = await this.chatRepository.getChatsByProfileId(sanitizedProfileId);

      return chats;
    }, 'getChats', { profileId });
  }

  /**
   * Get chat by ID
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<Object>} Chat object
   */
  async getChatById(chatId, profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId }, ['chatId', 'profileId']);
      
      // 🔒 SECURITY FIX: Sanitize chat ID to prevent MongoDB injection
      const sanitizedChatId = MongoDBSanitizer.sanitizeObjectId(chatId);
      if (!sanitizedChatId) {
        throw new ValidationError('Invalid chat ID');
      }

      const chat = await this.chatRepository.getChatByIdAndProfileId(sanitizedChatId, profileId);
      
      if (!chat) {
        throw new NotFoundError('Chat not found');
      }

      // Check if user is a participant
      if (!chat.participants || !chat.participants.some(p => p.profileid === profileId)) {
        throw new AuthorizationError('Not a participant in this chat');
      }

      return chat;
    }, 'getChatById', { chatId, profileId });
  }

  /**
   * Get chat by participants
   * @param {Array<string>} participants - Array of participant profile IDs
   * @param {string} profileId - Requesting user profile ID
   * @returns {Promise<Object>} Chat object
   */
  async getChatByParticipants(participants, profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ participants, profileId }, ['participants', 'profileId']);
      
      // Check if current user is in participants
      if (!participants.includes(profileId)) {
        throw new AuthorizationError('User not in participants list');
      }

      let chat;
      // For direct chats, find existing chat
      if (participants.length === 2) {
        chat = await this.chatRepository.getChatByParticipants(participants, 'direct');
      } else {
        // For group chats, find exact match
        chat = await this.chatRepository.getChatByParticipants(participants, 'group');
      }

      return chat;
    }, 'getChatByParticipants', { participants, profileId });
  }

  /**
   * Create a new chat
   * @param {Array<string>} participants - Array of participant profile IDs
   * @param {string} profileId - Creator profile ID
   * @param {Object} chatData - Additional chat data
   * @returns {Promise<Object>} Created chat object
   */
  async createChat(participants, profileId, chatData = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ participants, profileId }, ['participants', 'profileId']);
      
      // Check if current user is in participants
      if (!participants.includes(profileId)) {
        throw new AuthorizationError('Creator must be a participant');
      }

      // Validate all participants exist
      const participantProfiles = await Profile.find({ 
        profileid: { $in: participants } 
      }).select('profileid username profilePic name isOnline lastSeen');

      if (participantProfiles.length !== participants.length) {
        throw new ValidationError('One or more participants not found');
      }

      // Determine chat type
      const chatType = participants.length === 2 ? 'direct' : 'group';
      
      // For direct chats, check if chat already exists
      if (chatType === 'direct') {
        const existingChat = await this.chatRepository.getChatByParticipants(participants, 'direct');
        
        if (existingChat) {
          return existingChat;
        }
      }

      // Create new chat
      const newChat = new Chat({
        chatid: uuidv4(),
        chatType,
        chatName: chatData.chatName,
        chatAvatar: chatData.chatAvatar,
        participants: participants.map(participantId => ({
          profileid: participantId,
          unreadCount: 0,
          joinedAt: new Date()
        })),
        adminIds: chatType === 'group' ? [profileId] : [],
        createdBy: profileId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newChat.save();
      return this.formatEntity(newChat);
    }, 'createChat', { participants, profileId });
  }

  /**
   * Update chat
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated chat object
   */
  async updateChat(chatId, profileId, updateData) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId, updateData }, ['chatId', 'profileId', 'updateData']);
      
      const chat = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      
      if (!chat) {
        throw new NotFoundError('Chat not found');
      }

      // Check if user is admin (for group chats) or participant (for direct chats)
      if (chat.chatType === 'group' && !chat.adminIds.includes(profileId)) {
        throw new AuthorizationError('Only admins can update group chat');
      }

      if (!chat.isParticipant(profileId)) {
        throw new AuthorizationError('Not a participant in this chat');
      }

      // Update chat
      if (updateData.chatName !== undefined) chat.chatName = updateData.chatName;
      if (updateData.chatAvatar !== undefined) chat.chatAvatar = updateData.chatAvatar;

      chat.updatedAt = new Date();
      await chat.save();
      
      return this.formatEntity(chat);
    }, 'updateChat', { chatId, profileId });
  }

  /**
   * Get messages by chat with pagination
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated messages with metadata
   */
  async getMessagesByChatPaginated(chatId, profileId, paginationOptions = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId }, ['chatId', 'profileId']);
      
      // Check if user has access to this chat
      const chat = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      if (!chat || !chat.participants.some(p => p.profileid === profileId)) {
        throw new AuthorizationError('Cannot access this chat');
      }

      // 🔧 PAGINATION #83: Use the new paginated repository method
      const paginatedMessages = await this.messageRepository.getMessagesByChatIdPaginated(chatId, paginationOptions);

      return paginatedMessages;
    }, 'getMessagesByChatPaginated', { chatId, profileId, paginationOptions });
  }

  /**
   * Get messages by chat
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Messages with pagination info
   */
  async getMessagesByChat(chatId, profileId, options = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId }, ['chatId', 'profileId']);
      
      const { limit = 50, cursor } = options;

      // Check if user has access to this chat
      const chat = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      if (!chat || !chat.participants.some(p => p.profileid === profileId)) {
        throw new AuthorizationError('Cannot access this chat');
      }

      // Build query conditions
      const queryConditions = {
        chatid: chatId,
        isDeleted: false
      };

      // If cursor is provided, use it for pagination
      if (cursor) {
        queryConditions.createdAt = { $lt: new Date(cursor) };
      }

      // 🔧 OPTIMIZATION #75: Use repository method with proper indexing
      const messages = await this.messageRepository.find(queryConditions, {
        sort: { createdAt: -1 },
        limit: limit,
        lean: true
      });

      // Reverse to get chronological order
      const orderedMessages = messages.reverse();

      // Determine if there are more messages
      let hasNextPage = false;
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const nextMessages = await this.messageRepository.find({
          chatid: chatId,
          isDeleted: false,
          createdAt: { $lt: lastMessage.createdAt }
        }, {
          limit: 1,
          lean: true
        });
        
        hasNextPage = nextMessages.length > 0;
      }

      // Get total count for this chat
      const totalCount = await this.messageRepository.count({
        chatid: chatId,
        isDeleted: false
      });

      // Return cursor-based pagination structure
      return {
        messages: orderedMessages,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!cursor,
          startCursor: orderedMessages.length > 0 ? orderedMessages[0].createdAt.toISOString() : null,
          endCursor: orderedMessages.length > 0 ? orderedMessages[orderedMessages.length - 1].createdAt.toISOString() : null
        },
        totalCount
      };
    }, 'getMessagesByChat', { chatId, profileId });
  }

  /**
   * Get unread message count for a user
   * @param {string} profileId - User profile ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadMessageCount(profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ profileId }, ['profileId']);

      // 🔧 OPTIMIZATION #75: Use aggregation pipeline for better performance
      const result = await Chat.aggregate([
        {
          $match: {
            'participants.profileid': profileId,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'messages',
            localField: 'chatid',
            foreignField: 'chatid',
            as: 'messages'
          }
        },
        {
          $unwind: '$messages'
        },
        {
          $match: {
            'messages.senderid': { $ne: profileId },
            'messages.readBy.profileid': { $ne: profileId },
            'messages.isDeleted': false
          }
        },
        {
          $count: 'unreadCount'
        }
      ]);

      return result.length > 0 ? result[0].unreadCount : 0;
    }, 'getUnreadMessageCount', { profileId });
  }

  /**
   * Get unread count for a specific chat
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<number>} Unread message count for chat
   */
  async getChatUnreadCount(chatId, profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId }, ['chatId', 'profileId']);

      // Check if user has access to this chat
      const chat = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      if (!chat || !chat.participants.some(p => p.profileid === profileId)) {
        throw new AuthorizationError('Cannot access this chat');
      }

      // 🔧 OPTIMIZATION #75: Use count with proper indexing
      const count = await this.messageRepository.count({
        chatid: chatId,
        senderid: { $ne: profileId },
        'readBy.profileid': { $ne: profileId },
        isDeleted: false
      });

      return count;
    }, 'getChatUnreadCount', { chatId, profileId });
  }

  /**
   * Mark chat as read
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<boolean>} Success status
   */
  async markChatAsRead(chatId, profileId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ chatId, profileId }, ['chatId', 'profileId']);

      const chat = await this.chatRepository.getChatByIdAndProfileId(chatId, profileId);
      
      if (!chat) {
        throw new NotFoundError('Chat not found');
      }
      
      // Check if user is a participant
      if (!chat.isParticipant(profileId)) {
        throw new AuthorizationError('Not a participant in this chat');
      }
      
      // Mark all messages as read
      await Message.updateMany(
        {
          chatid: chatId,
          senderid: { $ne: profileId },
          'readBy.profileid': { $ne: profileId },
          isDeleted: false
        },
        {
          $addToSet: {
            readBy: {
              profileid: profileId,
              readAt: new Date()
            }
          }
        }
      );
      
      // Reset unread count for user
      const participantIndex = chat.participants.findIndex(p => p.profileid === profileId);
      if (participantIndex !== -1) {
        chat.participants[participantIndex].unreadCount = 0;
        await chat.save();
      }
      
      return true;
    }, 'markChatAsRead', { chatId, profileId });
  }
}

export default ChatService;






