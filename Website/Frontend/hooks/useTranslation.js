import { useState, useEffect, useCallback } from 'react';
import { useTranslationStore } from '../store/translationStore';
import TranslationService from '../services/TranslationService';

/**
 * useTranslation Hook
 * Hook for easy translation functionality
 */
export const useTranslation = () => {
  const {
    translations,
    isTranslating,
    preferredLanguage,
    autoTranslate,
    setTranslation,
    setTranslating,
    getTranslation,
    setSupportedLanguages,
    setPreferredLanguage,
    setAutoTranslate,
    initialize
  } = useTranslationStore();

  const [supportedLanguages, setSupportedLanguagesState] = useState([]);

  // Initialize on mount
  useEffect(() => {
    initialize();
    loadSupportedLanguages();
  }, []);

  // Load supported languages
  const loadSupportedLanguages = async () => {
    try {
      const languages = await TranslationService.getSupportedLanguages();
      setSupportedLanguagesState(languages);
      setSupportedLanguages(languages);
    } catch (error) {
      console.error('Error loading supported languages:', error);
    }
  };

  // Translate text
  const translateText = useCallback(async (text, targetLanguage = null, sourceLanguage = null) => {
    try {
      const target = targetLanguage || preferredLanguage;
      const result = await TranslationService.translateText(text, target, sourceLanguage);
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }, [preferredLanguage]);

  // Translate message
  const translateMessage = useCallback(async (messageId, messageContent) => {
    // Check cache first
    const cached = getTranslation(messageId);
    if (cached) {
      return cached;
    }

    setTranslating(messageId, true);
    try {
      const result = await translateText(messageContent);
      setTranslation(messageId, result);
      return result;
    } catch (error) {
      console.error('Error translating message:', error);
      throw error;
    } finally {
      setTranslating(messageId, false);
    }
  }, [translateText, getTranslation, setTranslation, setTranslating]);

  // Detect language
  const detectLanguage = useCallback(async (text) => {
    try {
      const result = await TranslationService.detectLanguage(text);
      return result;
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  }, []);

  // Batch translate
  const batchTranslate = useCallback(async (texts, targetLanguage = null) => {
    try {
      const target = targetLanguage || preferredLanguage;
      const results = await TranslationService.batchTranslate(texts, target);
      return results;
    } catch (error) {
      console.error('Batch translation error:', error);
      throw error;
    }
  }, [preferredLanguage]);

  // Simple t function for i18n compatibility (returns key as-is for now)
  const t = useCallback((key) => {
    // For now, just return the key
    // In a full i18n implementation, this would look up translations
    return key;
  }, []);

  return {
    // State
    translations,
    isTranslating,
    preferredLanguage,
    autoTranslate,
    supportedLanguages,

    // Actions
    translateText,
    translateMessage,
    detectLanguage,
    batchTranslate,
    setPreferredLanguage,
    setAutoTranslate,
    getTranslation,
    
    // i18n compatibility
    t
  };
};

export default useTranslation;
