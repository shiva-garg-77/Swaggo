import { useEffect, useCallback } from 'react';
import KeyboardShortcutService from '../services/KeyboardShortcutService';

/**
 * ⌨️ Keyboard Shortcuts Hook
 * 
 * Provides functionality for managing keyboard shortcuts in React components
 * 
 * Features:
 * - Register and unregister shortcuts
 * - Handle shortcut events
 * - Manage contexts
 * - Cleanup on unmount
 */

export const useKeyboardShortcuts = (context = 'global') => {
  /**
   * Register a keyboard shortcut
   * @param {string} keyCombo - Key combination (e.g., 'ctrl+shift+k')
   * @param {string} action - Action name
   * @param {string} description - Description of the shortcut
   * @param {function} callback - Callback function to execute
   */
  const registerShortcut = useCallback((keyCombo, action, description, callback) => {
    KeyboardShortcutService.registerShortcut(context, keyCombo, action, description, callback);
  }, [context]);

  /**
   * Unregister a keyboard shortcut
   * @param {string} keyCombo - Key combination
   */
  const unregisterShortcut = useCallback((keyCombo) => {
    KeyboardShortcutService.unregisterShortcut(context, keyCombo);
  }, [context]);

  /**
   * Set active context
   * @param {string} newContext - New context
   */
  const setActiveContext = useCallback((newContext) => {
    KeyboardShortcutService.setActiveContext(newContext);
  }, []);

  /**
   * Get all shortcuts for current context
   * @returns {Map} Map of shortcuts
   */
  const getShortcuts = useCallback(() => {
    return KeyboardShortcutService.getShortcutsForContext(context);
  }, [context]);

  /**
   * Get help information for all shortcuts
   * @returns {Array} Array of shortcut help information
   */
  const getHelpInfo = useCallback(() => {
    return KeyboardShortcutService.getHelpInfo();
  }, []);

  // Set active context on mount
  useEffect(() => {
    KeyboardShortcutService.setActiveContext(context);
  }, [context]);

  return {
    // Functions
    registerShortcut,
    unregisterShortcut,
    setActiveContext,
    getShortcuts,
    getHelpInfo
  };
};

export default useKeyboardShortcuts;