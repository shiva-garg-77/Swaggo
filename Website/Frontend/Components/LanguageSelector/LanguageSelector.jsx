/**
 * @fileoverview Language selector component for internationalization
 * @module Components/LanguageSelector/LanguageSelector
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { AccessibleButton } from '../Accessibility/AccessibilityUtils';

/**
 * Language selector component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLabels - Whether to show language labels
 * @param {string} props.variant - Button variant ('icon', 'dropdown', 'list')
 */
export const LanguageSelector = ({ 
  className = '',
  showLabels = true,
  variant = 'dropdown'
}) => {
  const { language, changeLanguage, getAvailableLanguages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableLanguages = getAvailableLanguages();
  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle language change
  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // Icon component for language flags
  const LanguageIcon = ({ code }) => {
    const flagEmojis = {
      en: '🇺🇸',
      es: '🇪🇸',
      fr: '🇫🇷'
    };
    
    return (
      <span className="text-lg" role="img" aria-label={`${code} flag`}>
        {flagEmojis[code] || '🌐'}
      </span>
    );
  };

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <AccessibleButton
          onClick={() => setIsOpen(!isOpen)}
          ariaLabel={t('common.language')}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <LanguageIcon code={language} />
        </AccessibleButton>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
            {availableLanguages.map((lang) => (
              <AccessibleButton
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                ariaLabel={`${t('settings.languageChanged', { language: lang.name })}`}
                className={`w-full text-left px-4 py-2 text-sm ${
                  language === lang.code 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <LanguageIcon code={lang.code} />
                  {showLabels && <span className="ml-2">{lang.name}</span>}
                </div>
              </AccessibleButton>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {availableLanguages.map((lang) => (
          <AccessibleButton
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            ariaLabel={`${t('settings.languageChanged', { language: lang.name })}`}
            className={`px-3 py-1 rounded-full text-sm ${
              language === lang.code 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center">
              <LanguageIcon code={lang.code} />
              {showLabels && <span className="ml-1">{lang.name}</span>}
            </div>
          </AccessibleButton>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <AccessibleButton
        onClick={() => setIsOpen(!isOpen)}
        ariaLabel={t('common.language')}
        className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <LanguageIcon code={language} />
        {showLabels && (
          <>
            <span className="ml-2 mr-1">{currentLanguage?.name}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </AccessibleButton>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
          {availableLanguages.map((lang) => (
            <AccessibleButton
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              ariaLabel={`${t('settings.languageChanged', { language: lang.name })}`}
              className={`w-full text-left px-4 py-2 text-sm ${
                language === lang.code 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <LanguageIcon code={lang.code} />
                {showLabels && <span className="ml-2">{lang.name}</span>}
              </div>
            </AccessibleButton>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;