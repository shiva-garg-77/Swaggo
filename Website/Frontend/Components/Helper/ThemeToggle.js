/**
 * @fileoverview Theme toggle component wrapper
 * @module Components/Helper/ThemeToggle
 */

'use client';

import UnifiedThemeToggle from '../Theme/UnifiedThemeToggle';

export default function ThemeToggle({ className = '', showChatThemes = true }) {
  return (
    <UnifiedThemeToggle 
      className={className}
      showChatThemes={showChatThemes}
    />
  );
}