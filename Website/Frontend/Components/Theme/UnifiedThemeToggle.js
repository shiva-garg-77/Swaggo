/**
 * @fileoverview Unified theme toggle component for dark mode and chat themes
 * @module Components/Theme/UnifiedThemeToggle
 */

'use client';

import React, { useState } from 'react';
import { useUnifiedTheme } from '../../context/UnifiedThemeProvider';
import { AccessibleButton } from '../Accessibility/AccessibilityUtils';

/**
 * Unified theme toggle component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showChatThemes - Whether to show chat theme options
 */
export default function UnifiedThemeToggle({ 
  className = '',
  showChatThemes = true 
}) {
  const { theme, toggleTheme, chatTheme, changeChatTheme, chatThemes } = useUnifiedTheme();
  const [showChatThemeSelector, setShowChatThemeSelector] = useState(false);

  // Icons for theme toggle
  const SunIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
    </svg>
  );

  const MoonIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );

  const PaletteIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Dark mode toggle */}
      <AccessibleButton
        onClick={toggleTheme}
        ariaLabel={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        className={`p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${
          theme === 'light' 
            ? 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50' 
            : 'bg-gray-800 text-yellow-300 border border-gray-700 hover:bg-gray-700'
        }`}
      >
        <div className="flex items-center justify-center w-6 h-6 transition-transform duration-300 group-hover:rotate-12">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </div>
      </AccessibleButton>

      {/* Chat theme selector */}
      {showChatThemes && (
        <div className="relative">
          <AccessibleButton
            onClick={() => setShowChatThemeSelector(!showChatThemeSelector)}
            ariaLabel="Change chat theme"
            className={`p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${
              theme === 'light' 
                ? 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50' 
                : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            <PaletteIcon />
          </AccessibleButton>

          {/* Chat theme selector dropdown */}
          {showChatThemeSelector && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowChatThemeSelector(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Chat Themes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(chatThemes).map(([key, themeConfig]) => (
                    <AccessibleButton
                      key={key}
                      onClick={() => {
                        changeChatTheme(key);
                        setShowChatThemeSelector(false);
                      }}
                      ariaLabel={`Select ${themeConfig.name} theme`}
                      className={`p-2 rounded-lg text-xs text-center transition-all ${
                        chatTheme === key
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex space-x-1 mb-1">
                          {/* Own message preview */}
                          <div className={`w-6 h-3 rounded ${themeConfig.ownBubble}`} />
                          {/* Received message preview */}
                          <div className={`w-8 h-3 rounded ${themeConfig.receivedBubble} border border-gray-200 dark:border-gray-600`} />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {themeConfig.name}
                        </span>
                      </div>
                    </AccessibleButton>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}