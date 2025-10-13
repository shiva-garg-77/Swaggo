import express from 'express';
import { container } from '../Config/DIContainer.js';
import { TYPES } from '../Config/DIContainer.js';
import AuthenticationMiddleware from '../Middleware/AuthenticationMiddleware.js';

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
    
    const paginatedChats = await chatService.getChatsPaginated(profileId, {
      page,
      limit
    });
    
    res.json({
      success: true,
      ...paginatedChats
    });
  } catch (error) {
    console.error('Error fetching paginated chats:', error);
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
    
    const paginatedMessages = await chatService.getMessagesByChatPaginated(chatId, profileId, {
      page,
      limit
    });
    
    res.json({
      success: true,
      ...paginatedMessages
    });
  } catch (error) {
    console.error('Error fetching paginated messages:', error);
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
    
    const paginatedUsers = await userService.searchUsersPaginated(query, {
      page,
      limit
    });
    
    res.json({
      success: true,
      ...paginatedUsers
    });
  } catch (error) {
    console.error('Error searching users with pagination:', error);
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
    
    const paginatedMessages = await messageService.searchMessagesPaginated(chatId, profileId, query, {
      page,
      limit
    });
    
    res.json({
      success: true,
      ...paginatedMessages
    });
  } catch (error) {
    console.error('Error searching messages with pagination:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;