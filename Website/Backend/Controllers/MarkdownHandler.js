import MarkdownSupportService from '../Services/MarkdownSupportService.js';

/**
 * Markdown Handler
 * Handles markdown processing requests via socket events
 */

class MarkdownHandler {
  /**
   * Handle parse markdown request
   */
  static handleParseMarkdown(socket, data, callback) {
    try {
      const { markdownContent } = data;
      
      // Validate input
      if (!markdownContent || typeof markdownContent !== 'string') {
        if (callback) {
          callback({
            success: false,
            error: 'Invalid markdown content'
          });
        }
        return;
      }
      
      // Parse markdown
      const htmlContent = MarkdownSupportService.parseMarkdown(markdownContent);
      const hasMarkdown = MarkdownSupportService.containsMarkdown(markdownContent);
      
      if (callback) {
        callback({
          success: true,
          htmlContent,
          hasMarkdown
        });
      }
    } catch (error) {
      console.error('Markdown parsing error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle check markdown request
   */
  static handleCheckMarkdown(socket, data, callback) {
    try {
      const { content } = data;
      
      // Validate input
      if (!content || typeof content !== 'string') {
        if (callback) {
          callback({
            success: false,
            error: 'Invalid content'
          });
        }
        return;
      }
      
      // Check if content contains markdown
      const hasMarkdown = MarkdownSupportService.containsMarkdown(content);
      
      if (callback) {
        callback({
          success: true,
          hasMarkdown
        });
      }
    } catch (error) {
      console.error('Markdown checking error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle strip markdown request
   */
  static handleStripMarkdown(socket, data, callback) {
    try {
      const { markdownContent } = data;
      
      // Validate input
      if (!markdownContent || typeof markdownContent !== 'string') {
        if (callback) {
          callback({
            success: false,
            error: 'Invalid markdown content'
          });
        }
        return;
      }
      
      // Strip markdown formatting
      const plainText = MarkdownSupportService.stripMarkdown(markdownContent);
      
      if (callback) {
        callback({
          success: true,
          plainText
        });
      }
    } catch (error) {
      console.error('Markdown stripping error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle get supported features request
   */
  static handleGetSupportedFeatures(socket, data, callback) {
    try {
      const features = MarkdownSupportService.getSupportedFeatures();
      
      if (callback) {
        callback({
          success: true,
          features
        });
      }
    } catch (error) {
      console.error('Get supported features error:', error);
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
    }
  }
}

export default MarkdownHandler;