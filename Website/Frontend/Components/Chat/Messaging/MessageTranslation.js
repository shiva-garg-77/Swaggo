import React, { useState, useEffect } from 'react';
import useTranslation from '../../hooks/useTranslation';
import { Languages, RotateCcw, Copy, Check } from 'lucide-react';

/**
 * 🌍 Message Translation Component
 * 
 * Provides translation functionality for individual messages
 * 
 * Features:
 * - Real-time message translation
 * - Language detection
 * - Copy translated text
 * - Translation history
 */

export default function MessageTranslation({ 
  message, 
  targetLanguage, 
  onTranslationChange,
  theme = 'light'
}) {
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  const {
    isTranslating,
    translationError,
    translateText
  } = useTranslation(targetLanguage);

  // Translate message when target language changes or translation is requested
  useEffect(() => {
    if (showTranslation && message?.content && targetLanguage) {
      handleTranslate();
    }
  }, [showTranslation, message?.content, targetLanguage]);

  const handleTranslate = async () => {
    if (!message?.content || !targetLanguage) return;
    
    try {
      const translated = await translateText(message.content, targetLanguage);
      setTranslatedText(translated);
      setIsTranslated(true);
      
      if (onTranslationChange) {
        onTranslationChange({
          originalText: message.content,
          translatedText: translated,
          targetLanguage
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  const handleCopyTranslation = async () => {
    if (!translatedText) return;
    
    try {
      await navigator.clipboard.writeText(translatedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy translation:', error);
    }
  };

  const handleResetTranslation = () => {
    setIsTranslated(false);
    setTranslatedText('');
    setShowTranslation(false);
  };

  if (!message?.content) {
    return null;
  }

  return (
    <div className="mt-2">
      {/* Translation Toggle */}
      {!showTranslation && (
        <button
          onClick={() => setShowTranslation(true)}
          className={`inline-flex items-center text-xs px-2 py-1 rounded-full transition-colors ${
            theme === 'dark'
              ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100'
          }`}
        >
          <Languages className="w-3 h-3 mr-1" />
          Translate
        </button>
      )}

      {/* Translation in progress */}
      {showTranslation && isTranslating && (
        <div className={`flex items-center p-3 rounded-lg ${
          theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
        }`}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          <span className={`text-sm ${
            theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
          }`}>
            Translating message...
          </span>
        </div>
      )}

      {/* Translation error */}
      {showTranslation && translationError && (
        <div className={`flex items-center p-3 rounded-lg ${
          theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
        }`}>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-red-300' : 'text-red-700'
          }`}>
            Failed to translate message: {translationError}
          </div>
        </div>
      )}

      {/* Translated message */}
      {showTranslation && isTranslated && translatedText && (
        <div className={`mt-2 p-3 rounded-lg border-l-2 ${
          theme === 'dark' 
            ? 'bg-blue-900/20 border-blue-500' 
            : 'bg-blue-50 border-blue-400'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Languages className="w-4 h-4 text-blue-500 mr-2" />
              <span className={`text-xs font-medium ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Translated to {targetLanguage.toUpperCase()}
              </span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handleCopyTranslation}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                title="Copy translation"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleResetTranslation}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                title="Reset translation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {translatedText}
          </div>
        </div>
      )}
    </div>
  );
}