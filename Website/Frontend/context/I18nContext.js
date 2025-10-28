/**
 * @fileoverview Internationalization (i18n) Context
 * @module context/I18nContext
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Import translation files
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import frTranslations from '../locales/fr.json';

// Available languages
const AVAILABLE_LANGUAGES = {
  en: { code: 'en', name: 'English', translations: enTranslations },
  es: { code: 'es', name: 'Español', translations: esTranslations },
  fr: { code: 'fr', name: 'Français', translations: frTranslations }
};

// Default language
const DEFAULT_LANGUAGE = 'en';

// Create context
const I18nContext = createContext();

/**
 * Custom hook to use the i18n context
 * @returns {Object} i18n context values
 */
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

/**
 * Provider component for i18n context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState(AVAILABLE_LANGUAGES[DEFAULT_LANGUAGE].translations);

  // Load language from localStorage on initial render
  useEffect(() => {
    const savedLanguage = localStorage.getItem('swaggo_language');
    if (savedLanguage && AVAILABLE_LANGUAGES[savedLanguage]) {
      setLanguage(savedLanguage);
      setTranslations(AVAILABLE_LANGUAGES[savedLanguage].translations);
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('swaggo_language', language);
    // Update document language attribute
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Change the current language
   * @param {string} newLanguage - Language code to switch to
   */
  const changeLanguage = (newLanguage) => {
    if (AVAILABLE_LANGUAGES[newLanguage]) {
      setLanguage(newLanguage);
      setTranslations(AVAILABLE_LANGUAGES[newLanguage].translations);
    }
  };

  /**
   * Get available languages
   * @returns {Array} Array of available languages
   */
  const getAvailableLanguages = () => {
    return Object.values(AVAILABLE_LANGUAGES).map(lang => ({
      code: lang.code,
      name: lang.name
    }));
  };

  /**
   * Translate a key with optional parameters
   * @param {string} key - Translation key
   * @param {Object} params - Parameters to replace in the translation
   * @returns {string} Translated string
   */
  const t = (key, params = {}) => {
    // Split the key by dots to navigate nested objects
    const keys = key.split('.');
    let translation = translations;
    
    // Navigate through the nested object structure
    for (const k of keys) {
      if (translation && typeof translation === 'object' && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        // Return the key if translation is not found
        return key;
      }
    }
    
    // If translation is a string, replace parameters
    if (typeof translation === 'string') {
      let result = translation;
      // Replace parameters in the format {{paramName}}
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`{{${param}}}`, 'g');
        result = result.replace(regex, params[param]);
      });
      return result;
    }
    
    // Return the key if translation is not a string
    return key;
  };

  // Context value
  const contextValue = {
    language,
    translations,
    changeLanguage,
    getAvailableLanguages,
    t
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nContext;