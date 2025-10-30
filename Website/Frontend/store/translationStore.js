import { create } from 'zustand';

/**
 * Translation Store
 * Manages translation state and cache
 */
export const useTranslationStore = create((set, get) => ({
  // State
  translations: {}, // Cache: { messageId: { translatedText, sourceLanguage, targetLanguage } }
  isTranslating: {},
  supportedLanguages: [],
  preferredLanguage: 'en',
  autoTranslate: false,

  // Actions
  setTranslation: (messageId, translation) => set((state) => ({
    translations: {
      ...state.translations,
      [messageId]: translation
    }
  })),

  getTranslation: (messageId) => {
    const state = get();
    return state.translations[messageId];
  },

  setTranslating: (messageId, isTranslating) => set((state) => ({
    isTranslating: {
      ...state.isTranslating,
      [messageId]: isTranslating
    }
  })),

  setSupportedLanguages: (languages) => set({ supportedLanguages: languages }),

  setPreferredLanguage: (language) => {
    localStorage.setItem('preferredLanguage', language);
    set({ preferredLanguage: language });
  },

  setAutoTranslate: (enabled) => {
    localStorage.setItem('autoTranslate', enabled.toString());
    set({ autoTranslate: enabled });
  },

  clearTranslations: () => set({ translations: {}, isTranslating: {} }),

  // Initialize from localStorage
  initialize: () => {
    const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
    const autoTranslate = localStorage.getItem('autoTranslate') === 'true';
    set({ preferredLanguage, autoTranslate });
  }
}));
