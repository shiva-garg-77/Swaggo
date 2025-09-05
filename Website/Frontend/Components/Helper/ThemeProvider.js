'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Apply theme to document element (this is what Tailwind uses)
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    setMounted(true);
    
    // Ensure the documentElement class matches the theme (head script should have set this)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  // Avoid hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    // Return children without theme context to avoid hydration issues
    return (
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
