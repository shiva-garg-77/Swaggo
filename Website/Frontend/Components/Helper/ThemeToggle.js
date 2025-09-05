'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 p-4 rounded-full shadow-lg"
      style={{
        backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
        color: theme === 'light' ? '#000000' : '#ffffff',
        border: `1px solid ${theme === 'light' ? '#e5e5e5' : '#333333'}`,
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
