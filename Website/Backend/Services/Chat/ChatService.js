import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import Profile from '../../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import BaseService from '../System/BaseService.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../../Helper/UnifiedErrorHandling.js';
import MongoDBSanitizer from '../../utils/MongoDBSanitizer.js';
import ChatRepository from '../../Repositories/ChatRepository.js';
import MessageRepository from '../../Repositories/MessageRepository.js';
import ProfileRepository from '../../Repositories/ProfileRepository.js';

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
    // Initialize repositories
    this.chatRepository = new ChatRepository();
    this.messageRepository = new MessageRepository();
    this.profileRepository = new ProfileRepository();
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

      // 🔧 FIX: Enrich chats with dynamic names
      if (paginatedChats.data && paginatedChats.data.length > 0) {
        paginatedChats.data = await this.enrichChatsWithDynamicNames(paginatedChats.data, sanitizedProfileId);
      }

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

      // 🔧 FIX: Enrich chats with dynamic names
      const enrichedChats = await this.enrichChatsWithDynamicNames(chats, sanitizedProfileId);

      return enrichedChats;
    }, 'getChats', { profileId });
  }

  /**
   * Enrich chats with dynamic names based on chat type and participants
   * @param {Array} chats - Array of chat objects
   * @param {string} currentUserProfileId - Current user's profile ID
   * @returns {Promise<Array>} Enriched chats with dynamic names
   */
  async enrichChatsWithDynamicNames(chats, currentUserProfileId) {
    if (!chats || chats.length === 0) return chats;

    console.log('🔄 Enriching chats with dynamic names for user:', currentUserProfileId);

    // Get all unique participant profile IDs
    const allParticipantIds = new Set();
    chats.forEach(chat => {
      if (chat.participants) {
        chat.participants.forEach(p => allParticipantIds.add(p.profileid));
      }
    });

    console.log('👥 Found participant IDs:', Array.from(allParticipantIds));

    // Fetch all participant profiles in one query
    const Profile = (await import('../../Models/FeedModels/Profile.js')).default;
    const participantProfiles = await Profile.find({
      profileid: { $in: Array.from(allParticipantIds) }
    }).select('profileid username name').lean();

    console.log('📋 Fetched profiles:', participantProfiles.map(p => ({ id: p.profileid, username: p.username })));

    // Create a map for quick lookup
    const profileMap = new Map();
    participantProfiles.forEach(profile => {
      profileMap.set(profile.profileid, profile);
    });

    // Enrich each chat
    const enrichedChats = chats.map(chat => {
      let dynamicChatName = chat.chatName;
      const originalName = chat.chatName;

      // For direct chats, ALWAYS use the other participant's name
      if (chat.chatType === 'direct') {
        const otherParticipant = chat.participants?.find(p => p.profileid !== currentUserProfileId);
        if (otherParticipant) {
          const profile = profileMap.get(otherParticipant.profileid);
          if (profile) {
            // Always use the other participant's name for direct chats
            dynamicChatName = profile.username || profile.name || 'Unknown User';
            console.log(`✏️ Chat ${chat.chatid}: "${originalName}" → "${dynamicChatName}"`);
          }
        }
      }

      // For group chats without a custom name, use default
      if (chat.chatType === 'group' && (!chat.chatName || chat.chatName === 'Group Chat')) {
        dynamicChatName = 'Group Chat';
      }

      return {
        ...chat,
        chatName: dynamicChatName
      };
    });

    return enrichedChats;
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
      console.log('🔍 Creating chat:', { participants, profileId, chatData });
      this.validateRequiredParams({ participants, profileId }, ['participants', 'profileId']);

      // Step 1: Try to find profiles with the provided IDs (check both profileid and userid)
      let participantProfiles = await Profile.find({
        $or: [
          { profileid: { $in: participants } },
          { userid: { $in: participants } }
        ]
      }).select('profileid userid username profilePic name isOnline lastSeen');

      const foundProfileIds = participantProfiles.map(p => p.profileid);
      const foundUserIds = participantProfiles.map(p => p.userid).filter(Boolean);
      const allFoundIds = [...foundProfileIds, ...foundUserIds];
      const invalidIds = participants.filter(id => !allFoundIds.includes(id));

      console.log('🔍 Profile lookup:', {
        requested: participants,
        foundByProfileId: foundProfileIds,
        foundByUserId: foundUserIds,
        invalid: invalidIds
      });

      // Step 1.5: If any IDs are invalid, try looking them up as usernames
      if (invalidIds.length > 0) {
        console.log('⚠️ Attempting to resolve invalid IDs as usernames:', invalidIds);
        const profilesByUsername = await Profile.find({
          username: { $in: invalidIds }
        }).select('profileid userid username profilePic name isOnline lastSeen');

        if (profilesByUsername.length > 0) {
          console.log('✅ Found profiles by username:', profilesByUsername.map(p => ({ username: p.username, profileid: p.profileid })));
          participantProfiles = [...participantProfiles, ...profilesByUsername];
          // Update invalidIds to only include truly invalid ones
          const resolvedUsernames = profilesByUsername.map(p => p.username);
          invalidIds.splice(0, invalidIds.length, ...invalidIds.filter(id => !resolvedUsernames.includes(id)));
        }
      }

      // Step 2: Ensure creator is in participants (auto-add if missing)
      if (!foundProfileIds.includes(profileId)) {
        console.log('⚠️ Creator not in valid participants, fetching creator profile:', profileId);
        const creatorProfile = await Profile.findOne({ profileid: profileId })
          .select('profileid username profilePic name isOnline lastSeen');

        if (creatorProfile) {
          participantProfiles.push(creatorProfile);
          console.log('✅ Added creator profile to participants');
        } else {
          throw new ValidationError(`Creator profile not found: ${profileId}`);
        }
      }

      // Step 3: Remove duplicates and get final participant IDs (only valid profile IDs)
      const allParticipants = [...new Set(participantProfiles.map(p => p.profileid))];

      console.log('🔍 Final participants (invalid IDs removed):', {
        original: participants,
        invalidRemoved: invalidIds,
        creator: profileId,
        final: allParticipants,
        count: allParticipants.length,
        participantProfiles: participantProfiles.map(p => ({
          profileid: p.profileid,
          username: p.username
        }))
      });

      // ✅ CRITICAL: Check if trying to create chat with same user twice
      if (allParticipants.length === 1) {
        console.error('❌ Cannot create chat with same user twice:', {
          participant: allParticipants[0],
          originalParticipants: participants
        });
        throw new ValidationError('Cannot create a chat with yourself');
      }

      // Step 4: Validate we have at least 2 participants for a chat
      if (allParticipants.length < 2) {
        const errorDetails = {
          requestedParticipants: participants,
          validParticipants: allParticipants,
          invalidParticipants: invalidIds,
          message: invalidIds.length > 0
            ? `Invalid participant IDs: ${invalidIds.join(', ')}. These profiles do not exist.`
            : 'A chat requires at least 2 participants'
        };
        console.error('❌ Chat creation failed - insufficient participants:', errorDetails);
        throw new ValidationError(errorDetails.message);
      }

      // Determine chat type
      const chatType = allParticipants.length === 2 ? 'direct' : 'group';

      // For direct chats, set chat name to the other user's username if not provided
      let finalChatName = chatData.chatName;
      if (chatType === 'direct' && !finalChatName) {
        const otherParticipant = participantProfiles.find(p => p.profileid !== profileId);
        if (otherParticipant) {
          finalChatName = otherParticipant.username || otherParticipant.name;
          console.log('📝 Setting direct chat name to:', finalChatName);
        }
      }

      // For direct chats, check if chat already exists
      if (chatType === 'direct') {
        const existingChat = await this.chatRepository.getChatByParticipants(allParticipants, 'direct');

        if (existingChat) {
          return existingChat;
        }
      }

      // Create new chat
      const newChat = new Chat({
        chatid: uuidv4(),
        chatType,
        chatName: finalChatName,
        chatAvatar: chatData.chatAvatar,
        participants: allParticipants.map(participantId => ({
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

      // Debug logging
      console.log('🔍 Created chat:', {
        chatid: newChat.chatid,
        chatType: newChat.chatType,
        participantCount: newChat.participants?.length,
        hasCreatedBy: !!newChat.createdBy
      });

      const formattedChat = this.formatEntity(newChat);
      console.log('📤 Formatted chat has chatid:', formattedChat?.chatid);

      return formattedChat;
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

// Create and export a singleton instance
const chatServiceInstance = new ChatService();
export default chatServiceInstance;
