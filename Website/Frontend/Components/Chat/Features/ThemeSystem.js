'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun, Palette, Check } from 'lucide-react';

// Theme context
const ThemeContext = createContext();

// Available chat themes
export const CHAT_THEMES = {
  default: {
    name: 'Default',
    primary: 'blue',
    background: 'bg-gray-50 dark:bg-gray-900',
    ownBubble: 'bg-gradient-to-r from-blue-500 to-blue-600',
    receivedBubble: 'bg-white dark:bg-gray-800',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    name: 'Green',
    primary: 'green',
    background: 'bg-green-50/30 dark:bg-gray-900',
    ownBubble: 'bg-gradient-to-r from-green-500 to-green-600',
    receivedBubble: 'bg-white dark:bg-gray-800',
    accent: 'text-green-600 dark:text-green-400'
  },
  purple: {
    name: 'Purple',
    primary: 'purple',
    background: 'bg-purple-50/30 dark:bg-gray-900',
    ownBubble: 'bg-gradient-to-r from-purple-500 to-purple-600',
    receivedBubble: 'bg-white dark:bg-gray-800',
    accent: 'text-purple-600 dark:text-purple-400'
  },
  pink: {
    name: 'Pink',
    primary: 'pink',
    background: 'bg-pink-50/30 dark:bg-gray-900',
    ownBubble: 'bg-gradient-to-r from-pink-500 to-pink-600',
    receivedBubble: 'bg-white dark:bg-gray-800',
    accent: 'text-pink-600 dark:text-pink-400'
  },
  orange: {
    name: 'Orange',
    primary: 'orange',
    background: 'bg-orange-50/30 dark:bg-gray-900',
    ownBubble: 'bg-gradient-to-r from-orange-500 to-orange-600',
    receivedBubble: 'bg-white dark:bg-gray-800',
    accent: 'text-orange-600 dark:text-orange-400'
  },
  dark: {
    name: 'Dark Mode Only',
    primary: 'gray',
    background: 'bg-black',
    ownBubble: 'bg-gradient-to-r from-gray-700 to-gray-800',
    receivedBubble: 'bg-gray-900',
    accent: 'text-gray-300'
  }
};

// Theme Provider Component
export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme preferences from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('swaggo-chat-theme') || 'default';
      const savedDarkMode = localStorage.getItem('swaggo-dark-mode') === 'true';
      
      // Check system preference if no saved preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      setCurrentTheme(savedTheme);
      setIsDarkMode(savedDarkMode || (localStorage.getItem('swaggo-dark-mode') === null && systemPrefersDark));
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      setIsInitialized(true);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isInitialized) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode, isInitialized]);

  // Save preferences to localStorage
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('swaggo-dark-mode', isDarkMode.toString());
        localStorage.setItem('swaggo-chat-theme', currentTheme);
      } catch (error) {
        console.error('Error saving theme preferences:', error);
      }
    }
  }, [isDarkMode, currentTheme, isInitialized]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const changeTheme = (themeKey) => {
    setCurrentTheme(themeKey);
  };

  const value = {
    isDarkMode,
    currentTheme,
    theme: CHAT_THEMES[currentTheme],
    toggleDarkMode,
    changeTheme,
    themes: CHAT_THEMES,
    isInitialized
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Dark Mode Toggle Component
export function DarkModeToggle({ className = '' }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isDarkMode 
          ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      } ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}

// Theme Selector Component
export function ThemeSelector({ isOpen, onClose, className = '' }) {
  const { currentTheme, changeTheme, themes, isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40" 
        onClick={onClose}
      />
      
      {/* Theme selector modal */}
      <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chat Themes
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close theme selector"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => {
                changeTheme(key);
                onClose();
              }}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                currentTheme === key
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              aria-label={`Select ${theme.name} theme`}
            >
              {/* Theme preview */}
              <div className="space-y-2 mb-3">
                {/* Own message preview */}
                <div className="flex justify-end">
                  <div className={`w-16 h-6 rounded-lg ${theme.ownBubble} shadow-sm`} />
                </div>
                
                {/* Received message preview */}
                <div className="flex justify-start">
                  <div className={`w-20 h-6 rounded-lg ${theme.receivedBubble} shadow-sm border border-gray-200 dark:border-gray-600`} />
                </div>
              </div>

              {/* Theme name */}
              <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {theme.name}
              </div>

              {/* Selected indicator */}
              {currentTheme === key && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Dark mode info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-600 text-yellow-400' : 'bg-gray-200 text-gray-700'
            }`}>
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Themes adapt to your preferred mode
              </div>
            </div>
          </div>
        </div>

        {/* Reset option */}
        <button
          onClick={() => {
            changeTheme('default');
            onClose();
          }}
          className="w-full mt-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Reset to Default Theme
        </button>
      </div>
    </>
  );
}

// Theme-aware component wrapper
export function ThemedChatContainer({ children, className = '' }) {
  const { theme } = useTheme();
  
  return (
    <div className={`${theme.background} transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
}

// Utility function to get theme-aware classes
export function getThemeClasses(themeKey = 'default') {
  const theme = CHAT_THEMES[themeKey];
  return {
    background: theme.background,
    ownBubble: theme.ownBubble,
    receivedBubble: theme.receivedBubble,
    accent: theme.accent,
    primary: theme.primary
  };
}

// Theme-aware message bubble wrapper
export function ThemedMessageBubble({ children, isOwn, className = '' }) {
  const { theme } = useTheme();
  
  const bubbleClass = isOwn ? theme.ownBubble : theme.receivedBubble;
  
  return (
    <div className={`${bubbleClass} ${className}`}>
      {children}
    </div>
  );
}

// Persistent theme settings hook
export function useThemeSettings() {
  const { isDarkMode, currentTheme, changeTheme, toggleDarkMode, themes } = useTheme();
  
  const exportSettings = () => {
    return {
      isDarkMode,
      currentTheme,
      timestamp: new Date().toISOString()
    };
  };
  
  const importSettings = (settings) => {
    try {
      if (settings.isDarkMode !== undefined) {
        if (settings.isDarkMode !== isDarkMode) {
          toggleDarkMode();
        }
      }
      
      if (settings.currentTheme && themes[settings.currentTheme]) {
        changeTheme(settings.currentTheme);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing theme settings:', error);
      return false;
    }
  };
  
  const resetToDefaults = () => {
    changeTheme('default');
    // Don't automatically toggle dark mode - respect user's preference
  };
  
  return {
    exportSettings,
    importSettings,
    resetToDefaults,
    currentSettings: { isDarkMode, currentTheme }
  };
}