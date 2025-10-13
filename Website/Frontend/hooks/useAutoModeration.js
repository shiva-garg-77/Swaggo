import { useState, useCallback } from 'react';
import AIModerationService from '../services/AIModerationService';

/**
 * 🛡️ Auto-Moderation Hook
 * 
 * Provides auto-moderation functionality for content input
 * 
 * Features:
 * - Real-time content moderation
 * - Profanity filtering
 * - Spam detection
 * - Content safety checking
 * - User feedback for moderated content
 */

export const useAutoModeration = (userId) => {
  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);
  const [isContentSafe, setIsContentSafe] = useState(true);
  const [moderationError, setModerationError] = useState(null);

  /**
   * Moderate content before sending
   * @param {string} content - Content to moderate
   * @param {string} title - Optional title
   * @returns {Promise<boolean>} Whether content is safe to send
   */
  const moderateContent = useCallback(async (content, title = null) => {
    if (!content?.trim()) {
      return true;
    }

    try {
      setIsModerating(true);
      setModerationError(null);
      
      // Run AI content moderation pipeline
      const result = await AIModerationService.runContentPipeline(
        content,
        userId,
        title
      );
      
      setModerationResult(result);
      
      // Check if content is safe based on moderation result
      const isSafe = result?.moderation?.is_safe ?? true;
      setIsContentSafe(isSafe);
      
      // If content is not safe, provide feedback
      if (!isSafe) {
        const issues = result.moderation.detected_issues.join(', ');
        setModerationError(`Content flagged for: ${issues}. ${result.moderation.explanation}`);
      }
      
      return isSafe;
    } catch (error) {
      console.error('Auto-moderation error:', error);
      setModerationError('Failed to moderate content. Please try again.');
      return true; // Allow content through if moderation fails
    } finally {
      setIsModerating(false);
    }
  }, [userId]);

  /**
   * Quick profanity check
   * @param {string} content - Content to check
   * @returns {Promise<boolean>} Whether content contains profanity
   */
  const checkProfanity = useCallback(async (content) => {
    if (!content?.trim()) {
      return false;
    }

    try {
      const result = await AIModerationService.moderateContent(content);
      return result?.detected_issues?.includes('profanity') || false;
    } catch (error) {
      console.error('Profanity check error:', error);
      return false;
    }
  }, []);

  /**
   * Check if content is spam
   * @param {string} content - Content to check
   * @returns {Promise<boolean>} Whether content is spam
   */
  const checkSpam = useCallback(async (content) => {
    if (!content?.trim()) {
      return false;
    }

    try {
      const result = await AIModerationService.moderateContent(content);
      return result?.detected_issues?.includes('spam') || false;
    } catch (error) {
      console.error('Spam check error:', error);
      return false;
    }
  }, []);

  /**
   * Filter profanity from content
   * @param {string} content - Content to filter
   * @returns {string} Filtered content
   */
  const filterProfanity = useCallback((content) => {
    if (!content) return content;
    
    // Simple profanity filter - in a real implementation, you would use a more comprehensive solution
    const profanityWords = [
      'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'crap'
    ];
    
    let filteredContent = content;
    profanityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredContent;
  }, []);

  /**
   * Reset moderation state
   */
  const resetModeration = useCallback(() => {
    setIsModerating(false);
    setModerationResult(null);
    setIsContentSafe(true);
    setModerationError(null);
  }, []);

  return {
    // State
    isModerating,
    moderationResult,
    isContentSafe,
    moderationError,
    
    // Functions
    moderateContent,
    checkProfanity,
    checkSpam,
    filterProfanity,
    resetModeration
  };
};

export default useAutoModeration;