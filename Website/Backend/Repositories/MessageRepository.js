import BaseRepository from './BaseRepository.js';
import Message from '../Models/FeedModels/Message.js';

/**
 * @fileoverview Message repository handling all message-related data operations
 * @module MessageRepository
 */

/**
 * Default limit for message queries
 * @type {number}
 */
const DEFAULT_MESSAGE_LIMIT = 50;

/**
 * Default projection fields for message queries
 * @type {string}
 */
const DEFAULT_MESSAGE_FIELDS = 'messageid clientMessageId chatid senderid messageType content attachments replyTo mentions reactions readBy isEdited editHistory messageStatus deliveredTo isPinned pinnedBy pinnedAt threadReplies threadId isEncrypted encryptionKey encryptedContent hasMarkdown parsedContent stickerData gifData voiceData fileData linkPreviews createdAt updatedAt';

/**
 * Reduced projection fields for search results
 * @type {string}
 */
const SEARCH_RESULT_FIELDS = 'messageid clientMessageId chatid senderid messageType content attachments replyTo mentions reactions readBy isEdited messageStatus deliveredTo isPinned threadReplies createdAt';

/**
 * Repository class for handling message-related database operations
 * @extends BaseRepository
 */
class MessageRepository extends BaseRepository {
  /**
   * @constructor
   * @description Initialize message repository
   */
  constructor() {
    super(Message);
  }

  /**
   * Get messages by chat ID with pagination
   * @param {string} chatId - Chat ID
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated messages with metadata
   */
  async getMessagesByChatIdPaginated(chatId, paginationOptions = {}) {
    // 🔧 PAGINATION #83: Use the new paginate method
    return this.paginate({
      chatid: chatId,
      isDeleted: false
    }, {
      sort: { createdAt: -1 },
      select: DEFAULT_MESSAGE_FIELDS,
      ...paginationOptions
    });
  }

  /**
   * Get messages by chat ID
   * @param {string} chatId - Chat ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of messages
   */
  async getMessagesByChatId(chatId, options = {}) {
    const { limit = DEFAULT_MESSAGE_LIMIT, skip = 0, sort = { createdAt: -1 } } = options;
    
    // 🔧 OPTIMIZATION #75: Add projection to only fetch needed fields
    return this.find({
      chatid: chatId,
      isDeleted: false
    }, {
      sort,
      limit,
      skip,
      lean: true,
      // Only select fields that are actually needed
      select: DEFAULT_MESSAGE_FIELDS
    });
  }

  /**
   * Get message by ID with chat validation
   * @param {string} messageId - Message ID
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Message object
   */
  async getMessageByIdAndChatId(messageId, chatId) {
    // 🔧 OPTIMIZATION #75: Add projection to only fetch needed fields
    return this.findOne({
      messageid: messageId,
      chatid: chatId,
      isDeleted: false
    }, {
      lean: true,
      // Only select fields that are actually needed
      select: DEFAULT_MESSAGE_FIELDS
    });
  }

  /**
   * Search messages in chat
   * @param {string} chatId - Chat ID
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of messages
   */
  async searchMessages(chatId, query, options = {}) {
    const { limit = DEFAULT_MESSAGE_LIMIT, skip = 0 } = options;
    
    // 🔧 OPTIMIZATION #75: Add projection to only fetch needed fields
    return this.find({
      chatid: chatId,
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    }, {
      sort: { createdAt: -1 },
      limit,
      skip,
      lean: true,
      // Only select fields that are actually needed for search results
      select: SEARCH_RESULT_FIELDS
    });
  }

  /**
   * Get unread message count for user in chat
   * @param {string} chatId - Chat ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<number>} Unread message count
   */
  async getUnreadMessageCount(chatId, profileId) {
    const lastReadMessage = await this.findOne({
      chatid: chatId,
      'readBy.profileid': profileId
    }, {
      sort: { createdAt: -1 },
      select: 'createdAt',
      lean: true
    });

    if (!lastReadMessage) {
      // If no read messages, count all messages
      return this.count({
        chatid: chatId,
        isDeleted: false
      });
    }

    // Count messages created after last read message
    return this.count({
      chatid: chatId,
      createdAt: { $gt: lastReadMessage.createdAt },
      isDeleted: false
    });
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @param {string} profileId - User profile ID
   * @returns {Promise<Object>} Updated message
   */
  async markMessageAsRead(messageId, profileId) {
    return this.updateOne(
      { messageid: messageId },
      { 
        $addToSet: { 
          readBy: {
            profileid: profileId,
            readAt: new Date()
          }
        }
      }
    );
  }

  /**
   * Add reaction to message
   * @param {string} messageId - Message ID
   * @param {string} profileId - User profile ID
   * @param {string} emoji - Emoji reaction
   * @returns {Promise<Object>} Updated message
   */
  async addReaction(messageId, profileId, emoji) {
    return this.updateOne(
      { messageid: messageId },
      { 
        $addToSet: { 
          reactions: {
            profileid: profileId,
            emoji: emoji,
            createdAt: new Date()
          }
        }
      }
    );
  }

  /**
   * Remove reaction from message
   * @param {string} messageId - Message ID
   * @param {string} profileId - User profile ID
   * @param {string} emoji - Emoji reaction
   * @returns {Promise<Object>} Updated message
   */
  async removeReaction(messageId, profileId, emoji) {
    return this.updateOne(
      { messageid: messageId },
      { 
        $pull: { 
          reactions: { 
            profileid: profileId,
            emoji: emoji
          }
        }
      }
    );
  }

  /**
   * Edit message content
   * @param {string} messageId - Message ID
   * @param {string} content - New content
   * @returns {Promise<Object>} Updated message
   */
  async editMessage(messageId, content) {
    return this.updateOne(
      { messageid: messageId },
      { 
        content: content,
        isEdited: true,
        updatedAt: new Date()
      }
    );
  }

  /**
   * Delete message
   * @param {string} messageId - Message ID
   * @param {boolean} deleteForEveryone - Whether to delete for everyone
   * @param {string} profileId - User profile ID (for deleteForMe)
   * @returns {Promise<Object>} Updated message
   */
  async deleteMessage(messageId, deleteForEveryone = true, profileId = null) {
    if (deleteForEveryone) {
      // Delete for everyone
      return this.updateOne(
        { messageid: messageId },
        { 
          isDeleted: true,
          deletedBy: profileId,
          deletedAt: new Date()
        }
      );
    } else {
      // Delete for me only
      return this.updateOne(
        { messageid: messageId },
        { 
          $addToSet: { 
            deletedFor: profileId
          }
        }
      );
    }
  }
}

export default MessageRepository;




