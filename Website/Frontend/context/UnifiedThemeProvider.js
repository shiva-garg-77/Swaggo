/**
 * @fileoverview Unified theme provider for dark mode and chat themes
 * @module context/UnifiedThemeProvider
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

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

// Theme context
const ThemeContext = createContext();

/**
 * Unified theme provider that handles both dark mode and chat themes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function UnifiedThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [chatTheme, setChatTheme] = useState('default');
  const [mounted, setMounted] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      // Load general theme preference
      const savedTheme = localStorage.getItem('swaggo-theme') || 'light';
      const savedChatTheme = localStorage.getItem('swaggo-chat-theme') || 'default';
      
      // Check system preference if no saved preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      setTheme(savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark) ? 'dark' : 'light');
      setChatTheme(savedChatTheme);
      setMounted(true);
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      setMounted(true);
    }
  }, []);

  // Apply theme to document element
  useEffect(() => {
    if (mounted) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, mounted]);

  // Save preferences to localStorage
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('swaggo-theme', theme);
        localStorage.setItem('swaggo-chat-theme', chatTheme);
      } catch (error) {
        console.error('Error saving theme preferences:', error);
      }
    }
  }, [theme, chatTheme, mounted]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Change chat theme
  const changeChatTheme = (newChatTheme) => {
    if (CHAT_THEMES[newChatTheme]) {
      setChatTheme(newChatTheme);
    }
  };

  // Get current chat theme configuration
  const currentChatTheme = useMemo(() => {
    return CHAT_THEMES[chatTheme] || CHAT_THEMES.default;
  }, [chatTheme]);

  // Check if system prefers dark mode
  const systemPrefersDark = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  // Context value
  const value = {
    // General theme
    theme,
    toggleTheme,
    
    // Chat theme
    chatTheme,
    changeChatTheme,
    currentChatTheme,
    chatThemes: CHAT_THEMES,
    
    // System preferences
    systemPrefersDark,
    
    // Mounting state
    mounted
  };

  // Avoid hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    // Return children without theme context to avoid hydration issues
    return (
      <ThemeContext.Provider value={{
        theme: 'light',
        toggleTheme: () => {},
        chatTheme: 'default',
        changeChatTheme: () => {},
        currentChatTheme: CHAT_THEMES.default,
        chatThemes: CHAT_THEMES,
        systemPrefersDark: false,
        mounted: false
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to use the unified theme context
 * @returns {Object} Theme context values
 */
export function useUnifiedTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useUnifiedTheme must be used within a UnifiedThemeProvider');
  }
  return context;
}

/**
 * Theme-aware component wrapper
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 */
export function ThemedContainer({ children, className = '' }) {
  const { currentChatTheme } = useUnifiedTheme();
  
  return (
    <div className={`${currentChatTheme.background} transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
}

export default UnifiedThemeProvider;