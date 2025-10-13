/**
 * Translation Service - Frontend service for message translation
 * 
 * This service provides message translation capabilities using AI-powered translation.
 */

import apiService from './ApiService';

class TranslationService {
  constructor() {
    this.supportedLanguages = [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'ru', name: 'Russian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'it', name: 'Italian' }
    ];
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
      // Check if translation is needed (same language)
      if (sourceLanguage && sourceLanguage === targetLanguage) {
        return {
          translatedText: text,
          sourceLanguage: targetLanguage,
          targetLanguage: targetLanguage,
          confidence: 1.0
        };
      }

      // Call backend API for translation
      const response = await apiService.post('/translate', {
        text,
        targetLanguage,
        sourceLanguage
      });
      
      return response.data;
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
      // Call backend API for language detection
      const response = await apiService.post('/translate/detect', {
        text
      });
      
      return response.data;
    } catch (error) {
      console.error('Error detecting language:', error);
      throw error;
    }
  }

  /**
   * Get supported languages
   * @returns {Array} Supported languages
   */
  async getSupportedLanguages() {
    try {
      // Call backend API for supported languages
      const response = await apiService.get('/translate/languages');
      
      return response.data;
    } catch (error) {
      console.error('Error getting supported languages:', error);
      // Return default languages if API call fails
      return this.supportedLanguages;
    }
  }

  /**
   * Simulate translation (for demo purposes)
   * In a real implementation, you would call an actual translation API
   */
  async simulateTranslation(text, targetLanguage, sourceLanguage = null) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple translation simulation
    const translations = {
      'hi': {
        'Hello! How are you today?': 'नमस्ते! आप आज कैसे हैं?',
        'Good morning!': 'शुभ प्रभात!',
        'See you later!': 'बाद में मिलते हैं!',
        'Thank you very much!': 'बहुत धन्यवाद!',
        'Happy birthday!': 'जन्मदिन की शुभकामनाएं!'
      },
      'es': {
        'Hello! How are you today?': '¡Hola! ¿Cómo estás hoy?',
        'Good morning!': '¡Buenos días!',
        'See you later!': '¡Hasta luego!',
        'Thank you very much!': '¡Muchas gracias!',
        'Happy birthday!': '¡Feliz cumpleaños!'
      },
      'fr': {
        'Hello! How are you today?': 'Bonjour! Comment allez-vous aujourd\'hui?',
        'Good morning!': 'Bonjour!',
        'See you later!': 'À plus tard!',
        'Thank you very much!': 'Merci beaucoup!',
        'Happy birthday!': 'Joyeux anniversaire!'
      },
      'de': {
        'Hello! How are you today?': 'Hallo! Wie geht es dir heute?',
        'Good morning!': 'Guten Morgen!',
        'See you later!': 'Bis später!',
        'Thank you very much!': 'Vielen Dank!',
        'Happy birthday!': 'Alles Gute zum Geburtstag!'
      },
      'ja': {
        'Hello! How are you today?': 'こんにちは！今日はどうですか？',
        'Good morning!': 'おはようございます！',
        'See you later!': 'また後で！',
        'Thank you very much!': 'どうもありがとうございました！',
        'Happy birthday!': 'お誕生日おめでとうございます！'
      }
    };

    const targetTranslations = translations[targetLanguage] || {};
    const translatedText = targetTranslations[text] || `[Translated to ${targetLanguage}] ${text}`;

    return {
      translatedText,
      sourceLanguage: sourceLanguage || 'en',
      targetLanguage,
      confidence: 0.9
    };
  }

  /**
   * Simulate language detection (for demo purposes)
   */
  simulateLanguageDetection(text) {
    // Simple language detection based on common words
    const languageIndicators = {
      'hi': ['नमस्ते', 'आप', 'कैसे', 'हैं', 'धन्यवाद'],
      'es': ['hola', 'como', 'estas', 'gracias', 'por', 'favor'],
      'fr': ['bonjour', 'comment', 'allez', 'merci', 's\'il', 'vous'],
      'de': ['hallo', 'wie', 'geht', 'danke', 'bitte'],
      'ja': ['こんにちは', 'どう', 'です', 'ありがとう', 'お願い']
    };

    const lowerText = text.toLowerCase();
    
    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      const matches = indicators.filter(indicator => lowerText.includes(indicator.toLowerCase()));
      if (matches.length > 0) {
        return lang;
      }
    }
    
    // Default to English
    return 'en';
  }

  /**
   * Batch translate multiple texts
   * @param {Array} texts - Array of texts to translate
   * @param {string} targetLanguage - Target language code
   * @returns {Promise} Array of translation results
   */
  async batchTranslate(texts, targetLanguage) {
    try {
      // Call backend API for batch translation
      const response = await apiService.post('/translate/batch', {
        texts,
        targetLanguage
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in batch translation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new TranslationService();