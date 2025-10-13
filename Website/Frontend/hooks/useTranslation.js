import { useState, useCallback, useEffect } from 'react';
import TranslationService from '../services/TranslationService';

/**
 * 🌍 Translation Hook
 * 
 * Provides translation functionality for messages and UI elements
 * 
 * Features:
 * - Real-time message translation
 * - Language detection
 * - Batch translation
 * - Translation caching
 * - Error handling
 */

export const useTranslation = (defaultTargetLanguage = 'en') => {
  const [translations, setTranslations] = useState(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLanguage);
  const [supportedLanguages, setSupportedLanguages] = useState([]);

  // Initialize supported languages
  useEffect(() => {
    const fetchSupportedLanguages = async () => {
      try {
        const languages = await TranslationService.getSupportedLanguages();
        setSupportedLanguages(languages);
      } catch (error) {
        console.error('Error fetching supported languages:', error);
      }
    };

    fetchSupportedLanguages();
  }, []);

  /**
   * Translate a single text
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language (optional, uses default if not provided)
   * @param {string} sourceLang - Source language (optional, auto-detected if not provided)
   * @returns {Promise<string>} Translated text
   */
  const translateText = useCallback(async (text, targetLang = null, sourceLang = null) => {
    if (!text?.trim()) {
      return text;
    }

    const effectiveTargetLang = targetLang || targetLanguage;
    
    // Create cache key
    const cacheKey = `${text}_${effectiveTargetLang}_${sourceLang || 'auto'}`;
    
    // Check cache first
    if (translations.has(cacheKey)) {
      return translations.get(cacheKey);
    }

    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      const result = await TranslationService.translateText(text, effectiveTargetLang, sourceLang);
      
      // Cache the translation
      setTranslations(prev => new Map(prev.set(cacheKey, result.translatedText)));
      
      return result.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(error.message || 'Failed to translate text');
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  }, [targetLanguage, translations]);

  /**
   * Translate multiple texts
   * @param {Array} texts - Array of texts to translate
   * @param {string} targetLang - Target language (optional, uses default if not provided)
   * @returns {Promise<Array>} Array of translated texts
   */
  const translateBatch = useCallback(async (texts, targetLang = null) => {
    if (!texts || texts.length === 0) {
      return [];
    }

    const effectiveTargetLang = targetLang || targetLanguage;
    
    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      const results = await TranslationService.batchTranslate(texts, effectiveTargetLang);
      
      // Cache all translations
      setTranslations(prev => {
        const newMap = new Map(prev);
        texts.forEach((text, index) => {
          const cacheKey = `${text}_${effectiveTargetLang}_auto`;
          newMap.set(cacheKey, results[index].translatedText);
        });
        return newMap;
      });
      
      return results.map(result => result.translatedText);
    } catch (error) {
      console.error('Batch translation error:', error);
      setTranslationError(error.message || 'Failed to translate texts');
      return texts; // Return original texts on error
    } finally {
      setIsTranslating(false);
    }
  }, [targetLanguage, translations]);

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @returns {Promise<string>} Detected language code
   */
  const detectLanguage = useCallback(async (text) => {
    if (!text?.trim()) {
      return 'en';
    }

    try {
      const result = await TranslationService.detectLanguage(text);
      return result.language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English on error
    }
  }, []);

  /**
   * Set target language
   * @param {string} languageCode - Language code
   */
  const setLanguage = useCallback((languageCode) => {
    setTargetLanguage(languageCode);
  }, []);

  /**
   * Clear translation cache
   */
  const clearCache = useCallback(() => {
    setTranslations(new Map());
  }, []);

  /**
   * Get translation from cache
   * @param {string} text - Original text
   * @param {string} targetLang - Target language
   * @param {string} sourceLang - Source language
   * @returns {string|null} Translated text or null if not in cache
   */
  const getCachedTranslation = useCallback((text, targetLang = null, sourceLang = null) => {
    const effectiveTargetLang = targetLang || targetLanguage;
    const cacheKey = `${text}_${effectiveTargetLang}_${sourceLang || 'auto'}`;
    return translations.get(cacheKey) || null;
  }, [targetLanguage, translations]);

  return {
    // State
    translations,
    isTranslating,
    translationError,
    targetLanguage,
    supportedLanguages,
    
    // Functions
    translateText,
    translateBatch,
    detectLanguage,
    setLanguage,
    clearCache,
    getCachedTranslation
  };
};

export default useTranslation;