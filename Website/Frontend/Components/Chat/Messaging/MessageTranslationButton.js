'use client';

import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import TranslationService from '../../../services/TranslationService';
import toast from 'react-hot-toast';

/**
 * Message Translation Button
 * Button to translate individual messages
 */
export default function MessageTranslationButton({ 
  message, 
  onTranslated, 
  theme = 'light' 
}) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  const isDark = theme === 'dark';

  const handleTranslate = async () => {
    if (isTranslated) {
      // Toggle back to original
      setIsTranslated(false);
      onTranslated(null);
      return;
    }

    setIsTranslating(true);
    try {
      // Get user's preferred language from localStorage or default to English
      const targetLanguage = localStorage.getItem('preferredLanguage') || 'en';
      
      const result = await TranslationService.translateText(
        message.content,
        targetLanguage
      );

      setIsTranslated(true);
      onTranslated(result);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate message');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <button
      onClick={handleTranslate}
      disabled={isTranslating}
      className={`p-1.5 rounded-lg transition-colors ${
        isTranslated
          ? 'bg-blue-100 text-blue-600'
          : isDark
          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
      }`}
      title={isTranslated ? 'Show original' : 'Translate message'}
    >
      {isTranslating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Languages className="w-4 h-4" />
      )}
    </button>
  );
}
