/**
 * Translation Controller - Handles translation-related HTTP requests
 * 
 * This controller provides endpoints for message translation functionality.
 */

import TranslationService from '../../Services/Features/TranslationService.js';

class TranslationController {
  /**
   * Translate text endpoint
   * POST /api/translate
   */
  async translateText(req, res) {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!text) {
        return res.status(400).json({ 
          success: false, 
          message: 'Text is required' 
        });
      }

      if (!targetLanguage) {
        return res.status(400).json({ 
          success: false, 
          message: 'Target language is required' 
        });
      }

      // Perform translation
      const result = await TranslationService.translateText(text, targetLanguage, sourceLanguage);

      // Return success response
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Translation error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to translate text',
        error: error.message 
      });
    }
  }

  /**
   * Detect language endpoint
   * POST /api/translate/detect
   */
  async detectLanguage(req, res) {
    try {
      const { text } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!text) {
        return res.status(400).json({ 
          success: false, 
          message: 'Text is required' 
        });
      }

      // Perform language detection
      const result = await TranslationService.detectLanguage(text);

      // Return success response
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Language detection error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to detect language',
        error: error.message 
      });
    }
  }

  /**
   * Get supported languages endpoint
   * GET /api/translate/languages
   */
  async getSupportedLanguages(req, res) {
    try {
      const languages = TranslationService.getSupportedLanguages();

      // Return success response
      return res.status(200).json({
        success: true,
        data: languages
      });
    } catch (error) {
      console.error('Get supported languages error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get supported languages',
        error: error.message 
      });
    }
  }

  /**
   * Batch translate texts endpoint
   * POST /api/translate/batch
   */
  async batchTranslate(req, res) {
    try {
      const { texts, targetLanguage } = req.body;
      const userId = req.user?.profileid;

      // Validate input
      if (!texts || !Array.isArray(texts)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Texts must be an array' 
        });
      }

      if (!targetLanguage) {
        return res.status(400).json({ 
          success: false, 
          message: 'Target language is required' 
        });
      }

      // Perform batch translation
      const results = await TranslationService.batchTranslate(texts, targetLanguage);

      // Return success response
      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Batch translation error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to translate texts',
        error: error.message 
      });
    }
  }
}

// Export singleton instance
export default new TranslationController();