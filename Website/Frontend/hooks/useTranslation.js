import { useI18n } from '../context/I18nContext';

/**
 * Hook for using translations in components
 * @returns {Object} Translation functions and utilities
 */
export const useTranslation = () => {
  const { t, language, changeLanguage, getAvailableLanguages } = useI18n();
  
  return {
    /**
     * Translate a key with optional parameters
     * @param {string} key - Translation key
     * @param {Object} params - Parameters to replace in the translation
     * @returns {string} Translated string
     */
    t,
    
    /**
     * Current language code
     */
    language,
    
    /**
     * Change the current language
     * @param {string} newLanguage - Language code to switch to
     */
    changeLanguage,
    
    /**
     * Get available languages
     * @returns {Array} Array of available languages
     */
    getAvailableLanguages,
    
    /**
     * Check if a translation key exists
     * @param {string} key - Translation key
     * @returns {boolean} Whether the key exists
     */
    exists: (key) => {
      const keys = key.split('.');
      let translation = t('common.appName'); // Get root translations object
      for (const k of keys) {
        if (translation && typeof translation === 'object' && translation[k] !== undefined) {
          translation = translation[k];
        } else {
          return false;
        }
      }
      return true;
    }
  };
};

export default useTranslation;