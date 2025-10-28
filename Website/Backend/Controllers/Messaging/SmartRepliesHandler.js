import ComprehensiveSmartRepliesService from '../Services/ComprehensiveSmartRepliesService.js';

/**
 * Smart Replies Handler
 * Handles smart replies requests via socket events
 */

class SmartRepliesHandler {
  /**
   * Handle get smart replies request
   */
  static async handleGetSmartReplies(socket, data, callback) {
    try {
      const { messageContent, userContext, conversationHistory } = data;
      
      // Validate input
      if (!messageContent || typeof messageContent !== 'string') {
        if (callback) {
          callback({
            success: false,
            error: 'Invalid message content'
          });
        }
        return;
      }
      
      // Generate smart replies
      const result = await ComprehensiveSmartRepliesService.generateSmartReplies(
        messageContent,
        userContext || {},
        conversationHistory || []
      );
      
      if (callback) {
        callback({
          success: true,
          ...result
        });
      }
    } catch (error) {
      console.error('Smart replies handler error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle user reply selection
   */
  static handleReplySelected(socket, data) {
    try {
      const { userId, replyUsed } = data;
      
      if (userId && replyUsed) {
        ComprehensiveSmartRepliesService.updateUserContext(userId, replyUsed);
      }
    } catch (error) {
      console.error('Reply selection handler error:', error);
    }
  }
}

export default SmartRepliesHandler;