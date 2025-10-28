import { useEffect, useCallback } from 'react';
import getKeyboardShortcutService from '../services/KeyboardShortcutService';

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
    // Only register shortcuts in browser environment
    if (typeof window !== 'undefined') {
      const service = getKeyboardShortcutService();
      if (service && typeof service.registerShortcut === 'function') {
        service.registerShortcut(context, keyCombo, action, description, callback);
      }
    }
  }, [context]);

  /**
   * Unregister a keyboard shortcut
   * @param {string} keyCombo - Key combination
   */
  const unregisterShortcut = useCallback((keyCombo) => {
    // Only unregister shortcuts in browser environment
    if (typeof window !== 'undefined') {
      const service = getKeyboardShortcutService();
      if (service && typeof service.unregisterShortcut === 'function') {
        service.unregisterShortcut(context, keyCombo);
      }
    }
  }, [context]);

  /**
   * Set active context
   * @param {string} newContext - New context
   */
  const setActiveContext = useCallback((newContext) => {
    // Only set active context in browser environment
    if (typeof window !== 'undefined') {
      const service = getKeyboardShortcutService();
      if (service && typeof service.setActiveContext === 'function') {
        service.setActiveContext(newContext);
      }
    }
  }, []);

  /**
   * Get all shortcuts for current context
   * @returns {Map} Map of shortcuts
   */
  const getShortcuts = useCallback(() => {
    // Only get shortcuts in browser environment
    if (typeof window !== 'undefined') {
      const service = getKeyboardShortcutService();
      if (service && typeof service.getShortcutsForContext === 'function') {
        return service.getShortcutsForContext(context);
      }
    }
    return new Map();
  }, [context]);

  /**
   * Get help information for all shortcuts
   * @returns {Array} Array of shortcut help information
   */
  const getHelpInfo = useCallback(() => {
    // Only get help info in browser environment
    if (typeof window !== 'undefined') {
      const service = getKeyboardShortcutService();
      if (service && typeof service.getHelpInfo === 'function') {
        return service.getHelpInfo();
      }
    }
    return [];
  }, []);

  // Set active context on mount
  useEffect(() => {
    // Only set active context in browser environment
    if (typeof window !== 'undefined') {
      const service = getKeyboardShortcutService();
      if (service && typeof service.setActiveContext === 'function') {
        service.setActiveContext(context);
      }
    }
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