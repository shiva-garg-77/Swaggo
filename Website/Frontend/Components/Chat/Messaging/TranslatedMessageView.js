'use client';

import { useState } from 'react';
import { Languages, Copy, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Translated Message View
 * Shows translated message with original text toggle
 */
export default function TranslatedMessageView({ 
  originalText, 
  translatedText, 
  sourceLanguage, 
  targetLanguage,
  confidence,
  theme = 'light' 
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDark = theme === 'dark';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      toast.success('Translation copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'hi': 'Hindi',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'it': 'Italian'
    };
    return languages[code] || code.toUpperCase();
  };

  return (
    <div className={`mt-2 rounded-lg border ${
      isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
    }`}>
      {/* Translation Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        isDark ? 'border-blue-800' : 'border-blue-200'
      }`}>
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-600" />
          <span className={`text-xs font-medium ${
            isDark ? 'text-blue-400' : 'text-blue-700'
          }`}>
            Translated from {getLanguageName(sourceLanguage)} to {getLanguageName(targetLanguage)}
          </span>
          {confidence && confidence < 0.8 && (
            <AlertCircle className="w-3 h-3 text-yellow-500" title="Low confidence translation" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className={`text-xs px-2 py-1 rounded ${
              isDark 
                ? 'hover:bg-blue-800 text-blue-400' 
                : 'hover:bg-blue-100 text-blue-700'
            }`}
          >
            {showOriginal ? 'Show Translation' : 'Show Original'}
          </button>
          <button
            onClick={handleCopy}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-blue-800' : 'hover:bg-blue-100'
            }`}
            title="Copy translation"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Translation Content */}
      <div className="px-3 py-2">
        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {showOriginal ? originalText : translatedText}
        </p>
      </div>
    </div>
  );
}
