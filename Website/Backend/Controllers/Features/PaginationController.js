import express from 'express';
import { container } from '../Config/DIContainer.js';
import { TYPES } from '../Config/DIContainer.js';
import AuthenticationMiddleware from '../Middleware/AuthenticationMiddleware.js';
// 🔧 PERFORMANCE FIX #32: Import Winston logger
import appLogger from '../utils/logger.js';

const router = express.Router();

// Get service instances from DI container
const chatService = container.get(TYPES.ChatService);
const userService = container.get(TYPES.UserService);
const messageService = container.get(TYPES.MessageService);

/**
 * Pagination Controller for REST endpoints
 * Implements proper pagination for all list endpoints as per Issue #83
 */

// Get paginated chats for a user
router.get('/chats', AuthenticationMiddleware.authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const profileId = req.user.profileid;
    
    // 🔧 OPTIMIZED PAGINATION #142: Use optimized pagination
    const paginatedChats = await chatService.getChatsPaginated(profileId, {
      page,
      limit
    });
    
    // 🔧 LARGE PAYLOAD OPTIMIZATION #145: Add lightweight chat format for list views
    const lightweightChats = paginatedChats.data?.map(chat => ({
      chatid: chat.chatid,
      chatType: chat.chatType,
      chatName: chat.chatName,
      chatAvatar: chat.chatAvatar,
      lastMessage: chat.lastMessage ? {
        content: chat.lastMessage.content?.substring(0, 100), // Truncate long content
        messageType: chat.lastMessage.messageType,
        createdAt: chat.lastMessage.createdAt
      } : null,
      lastMessageAt: chat.lastMessageAt,
      participantCount: chat.participants?.length || 0,
      unreadCount: chat.unreadCount,
      isArchived: chat.isArchived,
      isMuted: chat.mutedBy && chat.mutedBy.length > 0
    })) || [];
    
    res.json({
      success: true,
      data: lightweightChats,
      pagination: paginatedChats.pagination
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Error fetching paginated chats:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get paginated messages for a chat
router.get('/chats/:chatId/messages', AuthenticationMiddleware.authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const profileId = req.user.profileid;
    
    // 🔧 OPTIMIZED PAGINATION #142: Use optimized pagination
    const paginatedMessages = await chatService.getMessagesByChatPaginated(chatId, profileId, {
      page,
      limit
    });
    
    // 🔧 LARGE PAYLOAD OPTIMIZATION #145: Add lightweight message format for list views
    const lightweightMessages = paginatedMessages.data?.map(message => ({
      messageid: message.messageid,
      chatid: message.chatid,
      senderid: message.senderid,
      content: message.content?.substring(0, 200), // Truncate long content
      messageType: message.messageType,
      createdAt: message.createdAt,
      hasAttachments: message.attachments && message.attachments.length > 0,
      attachmentCount: message.attachments?.length || 0,
      reactionCount: message.reactions?.length || 0,
      isEdited: message.isEdited,
      isPinned: message.isPinned,
      replyTo: message.replyTo ? { messageid: message.replyTo.messageid } : null
    })) || [];
    
    res.json({
      success: true,
      data: lightweightMessages,
      pagination: paginatedMessages.pagination
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Error fetching paginated messages:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search users with pagination
router.get('/users/search', AuthenticationMiddleware.authenticate, async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }
    
    // 🔧 OPTIMIZED PAGINATION #142: Use optimized pagination
    const paginatedUsers = await userService.searchUsersPaginated(query, {
      page,
      limit
    });
    
    // 🔧 LARGE PAYLOAD OPTIMIZATION #145: Add lightweight user format for list views
    const lightweightUsers = paginatedUsers.data?.map(user => ({
      profileid: user.profileid,
      username: user.username,
      displayname: user.displayname,
      profilePic: user.profilePic,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      bio: user.bio?.substring(0, 100), // Truncate long bio
      friendCount: user.friends?.length || 0
    })) || [];
    
    res.json({
      success: true,
      data: lightweightUsers,
      pagination: paginatedUsers.pagination
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Error searching users with pagination:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search messages in a chat with pagination
router.get('/chats/:chatId/messages/search', AuthenticationMiddleware.authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;
    const profileId = req.user.profileid;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }
    
    // 🔧 OPTIMIZED PAGINATION #142: Use optimized pagination
    const paginatedMessages = await messageService.searchMessagesPaginated(chatId, profileId, query, {
      page,
      limit
    });
    
    res.json({
      success: true,
      ...paginatedMessages
    });
  } catch (error) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
    appLogger.error('Error searching messages with pagination:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;