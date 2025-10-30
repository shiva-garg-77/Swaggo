'use client';

import { useState, useEffect } from 'react';
import { Search, Check, Globe } from 'lucide-react';

/**
 * Language Selector Component
 * Dropdown for selecting translation language
 */
export default function LanguageSelector({ 
  value, 
  onChange, 
  theme = 'light',
  label = 'Select Language'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const isDark = theme === 'dark';

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'it', name: 'Italian', native: 'Italiano' }
  ];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLanguage = languages.find(lang => lang.code === value);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <label className={`block text-sm font-medium mb-2 ${
        isDark ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {label}
      </label>

      {/* Selected Language Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 rounded-lg border flex items-center justify-between ${
          isDark 
            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>
            {selectedLanguage 
              ? `${selectedLanguage.name} (${selectedLanguage.native})`
              : 'Select a language'
            }
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className={`absolute z-20 mt-2 w-full rounded-lg border shadow-lg ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* Search */}
            <div className="p-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {/* Language List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredLanguages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No languages found
                </div>
              ) : (
                filteredLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full px-4 py-2 flex items-center justify-between hover:bg-opacity-50 ${
                      lang.code === value
                        ? isDark ? 'bg-blue-900/50' : 'bg-blue-50'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className={`font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {lang.name}
                      </span>
                      <span className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {lang.native}
                      </span>
                    </div>
                    {lang.code === value && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
