/**
 * Translation Service - Frontend service for message translation
 * 
 * This service provides a client-side interface for interacting with the backend
 * translation API and managing local translation state.
 */

class TranslationService {
  constructor() {
    this.baseUrl = '/api/translation';
    this.supportedLanguages = [];
  }

  /**
   * Translate text to target language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise} Translation result
   */
  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to translate text');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @returns {Promise} Detected language
   */
  async detectLanguage(text) {
    try {
      const response = await fetch(`${this.baseUrl}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ text })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to detect language');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error detecting language:', error);
      throw error;
    }
  }

  /**
   * Get supported languages
   * @returns {Promise} Supported languages
   */
  async getSupportedLanguages() {
    try {
      // Return cached languages if available
      if (this.supportedLanguages.length > 0) {
        return this.supportedLanguages;
      }

      const response = await fetch(`${this.baseUrl}/languages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get supported languages');
      }
      
      this.supportedLanguages = result.data;
      return result.data;
    } catch (error) {
      console.error('Error getting supported languages:', error);
      throw error;
    }
  }

  /**
   * Batch translate multiple texts
   * @param {Array} texts - Array of texts to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise} Array of translation results
   */
  async batchTranslate(texts, targetLanguage) {
    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          texts,
          targetLanguage
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to batch translate texts');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error in batch translation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new TranslationService();