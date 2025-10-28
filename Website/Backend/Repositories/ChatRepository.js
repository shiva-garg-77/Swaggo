import BaseRepository from './BaseRepository.js';
import Chat from '../Models/FeedModels/Chat.js';

/**
 * @fileoverview Chat repository handling all chat-related data operations
 * @module ChatRepository
 */

class ChatRepository extends BaseRepository {
  /**
   * @constructor
   * @description Initialize chat repository
   */
  constructor() {
    super(Chat);
  }

  /**
   * Get all chats for a user with pagination
   * @param {string} profileId - User profile ID
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated chats with metadata
   */
  async getChatsByProfileIdPaginated(profileId, paginationOptions = {}) {
    // 🔧 PAGINATION #83: Use the new paginate method
    return this.paginate({
      'participants.profileid': profileId,
      isActive: true
    }, {
      sort: { lastMessageAt: -1 },
      select: 'chatid chatType chatName chatAvatar lastMessage lastMessageAt participants createdBy unreadCount',
      ...paginationOptions
    });
  }

  /**
   * Get all chats for a user
   * @param {string} profileId - User profile ID
   * @returns {Promise<Array>} Array of chats
   */
  async getChatsByProfileId(profileId) {
    // 🔧 OPTIMIZATION #75: Add projection to only fetch needed fields
    return this.find({
      'participants.profileid': profileId,
      isActive: true
    }, {
      sort: { lastMessageAt: -1 },
      lean: true,
      // Only select fields that are actually needed
      select: 'chatid chatType chatName chatAvatar lastMessage lastMessageAt participants createdBy unreadCount'
    });
  }

  /**
   * Get chat by ID with participant validation
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<Object>} Chat object
   */
  async getChatByIdAndProfileId(chatId, profileId) {
    // 🔧 OPTIMIZATION #75: Add projection to only fetch needed fields
    return this.findOne({
      chatid: chatId,
      isActive: true,
      'participants.profileid': profileId
    }, {
      lean: true,
      // Only select fields that are actually needed
      select: 'chatid chatType chatName chatAvatar lastMessage lastMessageAt participants createdBy unreadCount adminIds chatSettings'
    });
  }

  /**
   * Get chat by participants
   * @param {Array<string>} participants - Array of participant profile IDs
   * @param {string} chatType - Chat type (direct/group)
   * @returns {Promise<Object>} Chat object
   */
  async getChatByParticipants(participants, chatType = 'direct') {
    const query = {
      'participants.profileid': { $all: participants },
      chatType: chatType,
      isActive: true,
      // Use $size on the participants array, not on the nested profileid field
      participants: { $size: participants.length }
    };

    // 🔧 OPTIMIZATION #75: Add projection to only fetch needed fields
    return this.findOne(query, {
      lean: true,
      // Only select fields that are actually needed
      select: 'chatid chatType chatName chatAvatar lastMessage lastMessageAt participants createdBy unreadCount adminIds'
    });
  }

  /**
   * Update chat last message
   * @param {string} chatId - Chat ID
   * @param {Object} lastMessage - Last message data
   * @returns {Promise<Object>} Updated chat
   */
  async updateLastMessage(chatId, lastMessage) {
    return this.updateOne(
      { chatid: chatId },
      {
        lastMessage: lastMessage,
        lastMessageAt: new Date()
      }
    );
  }

  /**
   * Update participant unread count
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @param {number} unreadCount - Unread count
   * @returns {Promise<Object>} Update result
   */
  async updateParticipantUnreadCount(chatId, profileId, unreadCount) {
    return this.updateOne(
      {
        chatid: chatId,
        'participants.profileid': profileId
      },
      {
        $set: {
          'participants.$.unreadCount': unreadCount,
          'participants.$.lastReadAt': new Date()
        }
      }
    );
  }

  /**
   * Add participant to chat
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<Object>} Updated chat
   */
  async addParticipant(chatId, profileId) {
    return this.updateOne(
      { chatid: chatId },
      {
        $addToSet: {
          participants: {
            profileid: profileId,
            unreadCount: 0,
            joinedAt: new Date()
          }
        }
      }
    );
  }

  /**
   * Remove participant from chat
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<Object>} Updated chat
   */
  async removeParticipant(chatId, profileId) {
    return this.updateOne(
      { chatid: chatId },
      {
        $pull: {
          participants: { profileid: profileId }
        }
      }
    );
  }
}

export default ChatRepository;