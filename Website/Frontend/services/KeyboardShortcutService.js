/**
 * Keyboard Shortcut Service - Frontend service for managing keyboard shortcuts
 * 
 * This service provides functionality for registering, handling, and managing
 * keyboard shortcuts throughout the application.
 */

class KeyboardShortcutService {
  constructor() {
    this.shortcuts = new Map();
    this.contexts = new Set();
    this.activeContext = 'global';
    this.isListening = false;
    
    // Default shortcuts
    this.defaultShortcuts = {
      global: {
        'ctrl+shift+k': { action: 'toggle_theme', description: 'Toggle dark/light theme' },
        'ctrl+shift+t': { action: 'open_templates', description: 'Open message templates' },
        'ctrl+shift+s': { action: 'toggle_search', description: 'Toggle search' },
        'ctrl+shift+n': { action: 'new_chat', description: 'Start new chat' },
        'ctrl+shift+m': { action: 'toggle_mute', description: 'Toggle mute notifications' },
        'ctrl+shift+d': { action: 'toggle_dnd', description: 'Toggle do not disturb' },
        'ctrl+shift+e': { action: 'open_emoji_picker', description: 'Open emoji picker' },
        'ctrl+shift+f': { action: 'toggle_fullscreen', description: 'Toggle fullscreen mode' },
        'ctrl+shift+h': { action: 'show_help', description: 'Show keyboard shortcuts help' },
        'ctrl+shift+/': { action: 'show_help', description: 'Show keyboard shortcuts help' }
      },
      chat: {
        'enter': { action: 'send_message', description: 'Send message' },
        'shift+enter': { action: 'new_line', description: 'Add new line' },
        'ctrl+enter': { action: 'send_message', description: 'Send message' },
        'alt+enter': { action: 'send_message', description: 'Send message' },
        'ctrl+up': { action: 'edit_last_message', description: 'Edit last message' },
        'ctrl+shift+up': { action: 'navigate_previous_chat', description: 'Navigate to previous chat' },
        'ctrl+shift+down': { action: 'navigate_next_chat', description: 'Navigate to next chat' },
        'ctrl+shift+a': { action: 'select_all_messages', description: 'Select all messages' },
        'ctrl+shift+c': { action: 'copy_selected_messages', description: 'Copy selected messages' },
        'ctrl+shift+v': { action: 'paste_message', description: 'Paste message' },
        'ctrl+shift+x': { action: 'cut_selected_messages', description: 'Cut selected messages' },
        'ctrl+shift+z': { action: 'undo_last_action', description: 'Undo last action' },
        'ctrl+shift+y': { action: 'redo_last_action', description: 'Redo last action' },
        'ctrl+shift+r': { action: 'reply_to_message', description: 'Reply to message' },
        'ctrl+shift+f': { action: 'forward_message', description: 'Forward message' },
        'ctrl+shift+d': { action: 'delete_message', description: 'Delete message' },
        'ctrl+shift+e': { action: 'edit_message', description: 'Edit message' },
        'ctrl+shift+s': { action: 'star_message', description: 'Star message' },
        'ctrl+shift+p': { action: 'pin_message', description: 'Pin message' },
        'ctrl+shift+u': { action: 'unpin_message', description: 'Unpin message' },
        'ctrl+shift+i': { action: 'insert_emoji', description: 'Insert emoji' },
        'ctrl+shift+g': { action: 'insert_gif', description: 'Insert GIF' },
        'ctrl+shift+l': { action: 'insert_link', description: 'Insert link' },
        'ctrl+shift+b': { action: 'bold_text', description: 'Bold text' },
        'ctrl+shift+i': { action: 'italic_text', description: 'Italic text' },
        'ctrl+shift+u': { action: 'underline_text', description: 'Underline text' },
        'ctrl+shift+1': { action: 'heading1', description: 'Heading 1' },
        'ctrl+shift+2': { action: 'heading2', description: 'Heading 2' },
        'ctrl+shift+3': { action: 'heading3', description: 'Heading 3' },
        'ctrl+shift+.': { action: 'quote_text', description: 'Quote text' },
        'ctrl+shift+-': { action: 'insert_horizontal_rule', description: 'Insert horizontal rule' },
        'ctrl+shift+9': { action: 'insert_numbered_list', description: 'Insert numbered list' },
        'ctrl+shift+8': { action: 'insert_bulleted_list', description: 'Insert bulleted list' },
        'ctrl+shift+[': { action: 'indent_text', description: 'Indent text' },
        'ctrl+shift+]': { action: 'outdent_text', description: 'Outdent text' },
        'ctrl+shift+o': { action: 'toggle_ordered_list', description: 'Toggle ordered list' },
        'ctrl+shift+u': { action: 'toggle_unordered_list', description: 'Toggle unordered list' },
        'ctrl+shift+c': { action: 'toggle_code_block', description: 'Toggle code block' },
        'ctrl+shift+m': { action: 'toggle_mention', description: 'Toggle mention' },
        'ctrl+shift+n': { action: 'toggle_notification', description: 'Toggle notification' },
        'ctrl+shift+w': { action: 'toggle_whisper', description: 'Toggle whisper mode' },
        'ctrl+shift+j': { action: 'jump_to_chat', description: 'Jump to chat' },
        'ctrl+shift+k': { action: 'search_chats', description: 'Search chats' },
        'ctrl+shift+l': { action: 'toggle_left_sidebar', description: 'Toggle left sidebar' },
        'ctrl+shift+r': { action: 'toggle_right_sidebar', description: 'Toggle right sidebar' },
        'ctrl+shift+b': { action: 'toggle_bottom_bar', description: 'Toggle bottom bar' },
        'ctrl+shift+t': { action: 'toggle_top_bar', description: 'Toggle top bar' },
        'ctrl+shift+f': { action: 'toggle_fullscreen', description: 'Toggle fullscreen' },
        'ctrl+shift+h': { action: 'show_help', description: 'Show help' },
        'ctrl+shift+/': { action: 'show_help', description: 'Show help' },
        'ctrl+shift+q': { action: 'quit_chat', description: 'Quit chat' },
        'ctrl+shift+x': { action: 'exit_app', description: 'Exit application' },
        'esc': { action: 'close_modal', description: 'Close modal or popup' }
      },
      compose: {
        'ctrl+b': { action: 'bold_text', description: 'Bold text' },
        'ctrl+i': { action: 'italic_text', description: 'Italic text' },
        'ctrl+u': { action: 'underline_text', description: 'Underline text' },
        'ctrl+shift+.': { action: 'quote_text', description: 'Quote text' },
        'ctrl+shift+1': { action: 'heading1', description: 'Heading 1' },
        'ctrl+shift+2': { action: 'heading2', description: 'Heading 2' },
        'ctrl+shift+3': { action: 'heading3', description: 'Heading 3' },
        'ctrl+k': { action: 'insert_link', description: 'Insert link' },
        'ctrl+shift+k': { action: 'insert_code', description: 'Insert code' },
        'ctrl+shift+9': { action: 'insert_numbered_list', description: 'Insert numbered list' },
        'ctrl+shift+8': { action: 'insert_bulleted_list', description: 'Insert bulleted list' },
        'ctrl+shift+[': { action: 'indent_text', description: 'Indent text' },
        'ctrl+shift+]': { action: 'outdent_text', description: 'Outdent text' },
        'ctrl+shift+m': { action: 'insert_mention', description: 'Insert mention' },
        'ctrl+shift+e': { action: 'insert_emoji', description: 'Insert emoji' },
        'ctrl+shift+g': { action: 'insert_gif', description: 'Insert GIF' },
        'ctrl+shift+f': { action: 'insert_file', description: 'Insert file' },
        'ctrl+shift+v': { action: 'paste_formatted', description: 'Paste formatted text' }
      }
    };
    
    // Initialize with default shortcuts
    this.initializeDefaultShortcuts();
  }

  /**
   * Initialize with default shortcuts
   */
  initializeDefaultShortcuts() {
    Object.entries(this.defaultShortcuts).forEach(([context, shortcuts]) => {
      Object.entries(shortcuts).forEach(([keyCombo, shortcut]) => {
        this.registerShortcut(context, keyCombo, shortcut.action, shortcut.description);
      });
    });
  }

  /**
   * Register a new keyboard shortcut
   * @param {string} context - Context where shortcut is active (global, chat, compose, etc.)
   * @param {string} keyCombo - Key combination (e.g., 'ctrl+shift+k')
   * @param {string} action - Action to trigger
   * @param {string} description - Description of the shortcut
   * @param {function} callback - Optional callback function
   */
  registerShortcut(context, keyCombo, action, description, callback = null) {
    const normalizedKeyCombo = this.normalizeKeyCombo(keyCombo);
    
    if (!this.shortcuts.has(context)) {
      this.shortcuts.set(context, new Map());
    }
    
    this.shortcuts.get(context).set(normalizedKeyCombo, {
      action,
      description,
      callback,
      keyCombo: normalizedKeyCombo
    });
    
    this.contexts.add(context);
    
    // Start listening if not already
    if (!this.isListening) {
      this.startListening();
    }
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} context - Context where shortcut is active
   * @param {string} keyCombo - Key combination
   */
  unregisterShortcut(context, keyCombo) {
    const normalizedKeyCombo = this.normalizeKeyCombo(keyCombo);
    
    if (this.shortcuts.has(context)) {
      this.shortcuts.get(context).delete(normalizedKeyCombo);
    }
  }

  /**
   * Set active context
   * @param {string} context - Active context
   */
  setActiveContext(context) {
    this.activeContext = context;
  }

  /**
   * Get active context
   * @returns {string} Active context
   */
  getActiveContext() {
    return this.activeContext;
  }

  /**
   * Get all contexts
   * @returns {Set} Set of contexts
   */
  getContexts() {
    return this.contexts;
  }

  /**
   * Get shortcuts for a context
   * @param {string} context - Context name
   * @returns {Map} Map of shortcuts
   */
  getShortcutsForContext(context) {
    return this.shortcuts.get(context) || new Map();
  }

  /**
   * Get all shortcuts grouped by context
   * @returns {Map} Map of all shortcuts
   */
  getAllShortcuts() {
    return this.shortcuts;
  }

  /**
   * Normalize key combination
   * @param {string} keyCombo - Key combination
   * @returns {string} Normalized key combination
   */
  normalizeKeyCombo(keyCombo) {
    return keyCombo.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Parse keyboard event to key combination string
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {string} Key combination string
   */
  parseKeyEvent(event) {
    const keys = [];
    
    if (event.ctrlKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    if (event.metaKey) keys.push('meta');
    
    // Handle special keys
    const specialKeys = {
      ' ': 'space',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Enter': 'enter',
      'Escape': 'esc',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'Tab': 'tab',
      'CapsLock': 'capslock',
      'NumLock': 'numlock',
      'ScrollLock': 'scrolllock',
      'Pause': 'pause',
      'Insert': 'insert',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown'
    };
    
    const key = specialKeys[event.key] || event.key.toLowerCase();
    
    // Don't include modifier keys in the final key
    if (!['ctrl', 'shift', 'alt', 'meta'].includes(key)) {
      keys.push(key);
    }
    
    return keys.join('+');
  }

  /**
   * Start listening for keyboard events
   */
  startListening() {
    if (this.isListening) return;
    
    this.isListening = true;
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening() {
    this.isListening = false;
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    // Don't handle if target is an input, textarea, or contenteditable
    if (this.isInputTarget(event.target)) {
      return;
    }
    
    const keyCombo = this.parseKeyEvent(event);
    const contextsToCheck = [this.activeContext, 'global'];
    
    for (const context of contextsToCheck) {
      if (this.shortcuts.has(context)) {
        const contextShortcuts = this.shortcuts.get(context);
        if (contextShortcuts.has(keyCombo)) {
          const shortcut = contextShortcuts.get(keyCombo);
          
          // Prevent default for most shortcuts
          if (keyCombo !== 'esc') {
            event.preventDefault();
          }
          
          // Execute callback if provided
          if (shortcut.callback) {
            shortcut.callback(event);
          }
          
          // Dispatch custom event
          const customEvent = new CustomEvent('keyboard-shortcut', {
            detail: {
              context,
              keyCombo,
              action: shortcut.action,
              event
            }
          });
          
          document.dispatchEvent(customEvent);
          
          return;
        }
      }
    }
  }

  /**
   * Check if target is an input element
   * @param {Element} target - Target element
   * @returns {boolean} True if target is input
   */
  isInputTarget(target) {
    const inputTypes = ['input', 'textarea', 'select'];
    const isInput = inputTypes.includes(target.tagName.toLowerCase());
    const isContentEditable = target.hasAttribute('contenteditable') && target.getAttribute('contenteditable') !== 'false';
    
    return isInput || isContentEditable;
  }

  /**
   * Get help information for all shortcuts
   * @returns {Array} Array of shortcut help information
   */
  getHelpInfo() {
    const helpInfo = [];
    
    this.shortcuts.forEach((contextShortcuts, context) => {
      contextShortcuts.forEach((shortcut, keyCombo) => {
        helpInfo.push({
          context,
          keyCombo: shortcut.keyCombo,
          action: shortcut.action,
          description: shortcut.description
        });
      });
    });
    
    return helpInfo;
  }
}

// Export singleton instance
export default new KeyboardShortcutService();