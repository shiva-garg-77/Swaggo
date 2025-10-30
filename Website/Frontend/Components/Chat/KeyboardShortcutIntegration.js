'use client';

import React, { useEffect, useCallback } from 'react';

/**
 * ⌨️ Keyboard Shortcut Integration Component
 * 
 * Integrates keyboard shortcuts with the main chat interface
 * 
 * Features:
 * - Context-aware shortcuts
 * - Event handling
 * - Theme integration
 */

const KeyboardShortcutIntegration = ({ 
  onOpenTemplates,
  onToggleTheme,
  onToggleSearch,
  onNewChat,
  onToggleMute,
  onToggleDND,
  onOpenEmojiPicker,
  onToggleFullscreen,
  onShowHelp,
  onSendMessage,
  onEditLastMessage,
  onNavigatePreviousChat,
  onNavigateNextChat,
  onSelectAllMessages,
  onCopySelectedMessages,
  onPasteMessage,
  onCutSelectedMessages,
  onUndoLastAction,
  onRedoLastAction,
  onReplyToMessage,
  onForwardMessage,
  onDeleteMessage,
  onEditMessage,
  onStarMessage,
  onPinMessage,
  onUnpinMessage,
  onInsertEmoji,
  onInsertGif,
  onInsertLink,
  onBoldText,
  onItalicText,
  onUnderlineText,
  onHeading1,
  onHeading2,
  onHeading3,
  onQuoteText,
  onInsertHorizontalRule,
  onInsertNumberedList,
  onInsertBulletedList,
  onIndentText,
  onOutdentText,
  onToggleOrderedList,
  onToggleUnorderedList,
  onToggleCodeBlock,
  onToggleMention,
  onToggleNotification,
  onToggleWhisper,
  onJumpToChat,
  onSearchChats,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onToggleBottomBar,
  onToggleTopBar,
  onCloseModal,
  onQuitChat,
  onExitApp
}) => {
  // Simple keyboard shortcut registration without external hooks
  const registerShortcut = useCallback((keys, id, description, handler) => {
    const handleKeyDown = (event) => {
      // Safety check for event.key
      if (!event || !event.key) return;
      
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;
      const key = event.key.toLowerCase();
      
      // Parse the shortcut keys
      const shortcutParts = keys.toLowerCase().split('+');
      const needsCtrl = shortcutParts.includes('ctrl');
      const needsShift = shortcutParts.includes('shift');
      const needsAlt = shortcutParts.includes('alt');
      const targetKey = shortcutParts[shortcutParts.length - 1];
      
      // Check if the current key combination matches
      if (
        isCtrl === needsCtrl &&
        isShift === needsShift &&
        isAlt === needsAlt &&
        (key === targetKey || event.key === targetKey)
      ) {
        event.preventDefault();
        handler(event);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Register global shortcuts
  useEffect(() => {
    // Theme toggle
    registerShortcut('ctrl+shift+k', 'toggle_theme', 'Toggle dark/light theme', (event) => {
      if (onToggleTheme) onToggleTheme();
    });

    // Open templates
    registerShortcut('ctrl+shift+t', 'open_templates', 'Open message templates', (event) => {
      if (onOpenTemplates) onOpenTemplates();
    });

    // Toggle search
    registerShortcut('ctrl+shift+s', 'toggle_search', 'Toggle search', (event) => {
      if (onToggleSearch) onToggleSearch();
    });

    // New chat
    registerShortcut('ctrl+shift+n', 'new_chat', 'Start new chat', (event) => {
      if (onNewChat) onNewChat();
    });

    // Toggle mute
    registerShortcut('ctrl+shift+m', 'toggle_mute', 'Toggle mute notifications', (event) => {
      if (onToggleMute) onToggleMute();
    });

    // Toggle do not disturb
    registerShortcut('ctrl+shift+d', 'toggle_dnd', 'Toggle do not disturb', (event) => {
      if (onToggleDND) onToggleDND();
    });

    // Open emoji picker
    registerShortcut('ctrl+shift+e', 'open_emoji_picker', 'Open emoji picker', (event) => {
      if (onOpenEmojiPicker) onOpenEmojiPicker();
    });

    // Toggle fullscreen
    registerShortcut('ctrl+shift+f', 'toggle_fullscreen', 'Toggle fullscreen mode', (event) => {
      if (onToggleFullscreen) onToggleFullscreen();
    });

    // Show help
    registerShortcut('ctrl+shift+h', 'show_help', 'Show keyboard shortcuts help', (event) => {
      if (onShowHelp) onShowHelp();
    });

    registerShortcut('ctrl+shift+/', 'show_help', 'Show keyboard shortcuts help', (event) => {
      if (onShowHelp) onShowHelp();
    });
  }, [
    registerShortcut,
    onToggleTheme,
    onOpenTemplates,
    onToggleSearch,
    onNewChat,
    onToggleMute,
    onToggleDND,
    onOpenEmojiPicker,
    onToggleFullscreen,
    onShowHelp
  ]);

  // Register chat context shortcuts
  useEffect(() => {
    // Send message
    registerShortcut('enter', 'send_message', 'Send message', (event) => {
      if (onSendMessage) onSendMessage();
    });

    registerShortcut('ctrl+enter', 'send_message', 'Send message', (event) => {
      if (onSendMessage) onSendMessage();
    });

    registerShortcut('alt+enter', 'send_message', 'Send message', (event) => {
      if (onSendMessage) onSendMessage();
    });

    // Edit last message
    registerShortcut('ctrl+up', 'edit_last_message', 'Edit last message', (event) => {
      if (onEditLastMessage) onEditLastMessage();
    });

    // Navigate chats
    registerShortcut('ctrl+shift+up', 'navigate_previous_chat', 'Navigate to previous chat', (event) => {
      if (onNavigatePreviousChat) onNavigatePreviousChat();
    });

    registerShortcut('ctrl+shift+down', 'navigate_next_chat', 'Navigate to next chat', (event) => {
      if (onNavigateNextChat) onNavigateNextChat();
    });

    // Message selection
    registerShortcut('ctrl+shift+a', 'select_all_messages', 'Select all messages', (event) => {
      if (onSelectAllMessages) onSelectAllMessages();
    });

    registerShortcut('ctrl+shift+c', 'copy_selected_messages', 'Copy selected messages', (event) => {
      if (onCopySelectedMessages) onCopySelectedMessages();
    });

    registerShortcut('ctrl+shift+v', 'paste_message', 'Paste message', (event) => {
      if (onPasteMessage) onPasteMessage();
    });

    registerShortcut('ctrl+shift+x', 'cut_selected_messages', 'Cut selected messages', (event) => {
      if (onCutSelectedMessages) onCutSelectedMessages();
    });

    // Undo/Redo
    registerShortcut('ctrl+shift+z', 'undo_last_action', 'Undo last action', (event) => {
      if (onUndoLastAction) onUndoLastAction();
    });

    registerShortcut('ctrl+shift+y', 'redo_last_action', 'Redo last action', (event) => {
      if (onRedoLastAction) onRedoLastAction();
    });

    // Message actions
    registerShortcut('ctrl+shift+r', 'reply_to_message', 'Reply to message', (event) => {
      if (onReplyToMessage) onReplyToMessage();
    });

    registerShortcut('ctrl+shift+f', 'forward_message', 'Forward message', (event) => {
      if (onForwardMessage) onForwardMessage();
    });

    registerShortcut('ctrl+shift+d', 'delete_message', 'Delete message', (event) => {
      if (onDeleteMessage) onDeleteMessage();
    });

    registerShortcut('ctrl+shift+e', 'edit_message', 'Edit message', (event) => {
      if (onEditMessage) onEditMessage();
    });

    registerShortcut('ctrl+shift+s', 'star_message', 'Star message', (event) => {
      if (onStarMessage) onStarMessage();
    });

    registerShortcut('ctrl+shift+p', 'pin_message', 'Pin message', (event) => {
      if (onPinMessage) onPinMessage();
    });

    registerShortcut('ctrl+shift+u', 'unpin_message', 'Unpin message', (event) => {
      if (onUnpinMessage) onUnpinMessage();
    });

    // Insert content
    registerShortcut('ctrl+shift+i', 'insert_emoji', 'Insert emoji', (event) => {
      if (onInsertEmoji) onInsertEmoji();
    });

    registerShortcut('ctrl+shift+g', 'insert_gif', 'Insert GIF', (event) => {
      if (onInsertGif) onInsertGif();
    });

    registerShortcut('ctrl+shift+l', 'insert_link', 'Insert link', (event) => {
      if (onInsertLink) onInsertLink();
    });

    // Text formatting
    registerShortcut('ctrl+shift+b', 'bold_text', 'Bold text', (event) => {
      if (onBoldText) onBoldText();
    });

    registerShortcut('ctrl+shift+i', 'italic_text', 'Italic text', (event) => {
      if (onItalicText) onItalicText();
    });

    registerShortcut('ctrl+shift+u', 'underline_text', 'Underline text', (event) => {
      if (onUnderlineText) onUnderlineText();
    });

    registerShortcut('ctrl+shift+1', 'heading1', 'Heading 1', (event) => {
      if (onHeading1) onHeading1();
    });

    registerShortcut('ctrl+shift+2', 'heading2', 'Heading 2', (event) => {
      if (onHeading2) onHeading2();
    });

    registerShortcut('ctrl+shift+3', 'heading3', 'Heading 3', (event) => {
      if (onHeading3) onHeading3();
    });

    registerShortcut('ctrl+shift+.', 'quote_text', 'Quote text', (event) => {
      if (onQuoteText) onQuoteText();
    });

    registerShortcut('ctrl+shift+-', 'insert_horizontal_rule', 'Insert horizontal rule', (event) => {
      if (onInsertHorizontalRule) onInsertHorizontalRule();
    });

    registerShortcut('ctrl+shift+9', 'insert_numbered_list', 'Insert numbered list', (event) => {
      if (onInsertNumberedList) onInsertNumberedList();
    });

    registerShortcut('ctrl+shift+8', 'insert_bulleted_list', 'Insert bulleted list', (event) => {
      if (onInsertBulletedList) onInsertBulletedList();
    });

    registerShortcut('ctrl+shift+[', 'indent_text', 'Indent text', (event) => {
      if (onIndentText) onIndentText();
    });

    registerShortcut('ctrl+shift+]', 'outdent_text', 'Outdent text', (event) => {
      if (onOutdentText) onOutdentText();
    });

    registerShortcut('ctrl+shift+o', 'toggle_ordered_list', 'Toggle ordered list', (event) => {
      if (onToggleOrderedList) onToggleOrderedList();
    });

    registerShortcut('ctrl+shift+u', 'toggle_unordered_list', 'Toggle unordered list', (event) => {
      if (onToggleUnorderedList) onToggleUnorderedList();
    });

    registerShortcut('ctrl+shift+c', 'toggle_code_block', 'Toggle code block', (event) => {
      if (onToggleCodeBlock) onToggleCodeBlock();
    });

    registerShortcut('ctrl+shift+m', 'toggle_mention', 'Toggle mention', (event) => {
      if (onToggleMention) onToggleMention();
    });

    registerShortcut('ctrl+shift+n', 'toggle_notification', 'Toggle notification', (event) => {
      if (onToggleNotification) onToggleNotification();
    });

    registerShortcut('ctrl+shift+w', 'toggle_whisper', 'Toggle whisper mode', (event) => {
      if (onToggleWhisper) onToggleWhisper();
    });

    registerShortcut('ctrl+shift+j', 'jump_to_chat', 'Jump to chat', (event) => {
      if (onJumpToChat) onJumpToChat();
    });

    registerShortcut('ctrl+shift+k', 'search_chats', 'Search chats', (event) => {
      if (onSearchChats) onSearchChats();
    });

    registerShortcut('ctrl+shift+l', 'toggle_left_sidebar', 'Toggle left sidebar', (event) => {
      if (onToggleLeftSidebar) onToggleLeftSidebar();
    });

    registerShortcut('ctrl+shift+r', 'toggle_right_sidebar', 'Toggle right sidebar', (event) => {
      if (onToggleRightSidebar) onToggleRightSidebar();
    });

    registerShortcut('ctrl+shift+b', 'toggle_bottom_bar', 'Toggle bottom bar', (event) => {
      if (onToggleBottomBar) onToggleBottomBar();
    });

    registerShortcut('ctrl+shift+t', 'toggle_top_bar', 'Toggle top bar', (event) => {
      if (onToggleTopBar) onToggleTopBar();
    });

    registerShortcut('ctrl+shift+f', 'toggle_fullscreen', 'Toggle fullscreen', (event) => {
      if (onToggleFullscreen) onToggleFullscreen();
    });

    registerShortcut('ctrl+shift+h', 'show_help', 'Show help', (event) => {
      if (onShowHelp) onShowHelp();
    });

    registerShortcut('ctrl+shift+/', 'show_help', 'Show help', (event) => {
      if (onShowHelp) onShowHelp();
    });

    registerShortcut('ctrl+shift+q', 'quit_chat', 'Quit chat', (event) => {
      if (onQuitChat) onQuitChat();
    });

    registerShortcut('ctrl+shift+x', 'exit_app', 'Exit application', (event) => {
      if (onExitApp) onExitApp();
    });

    registerShortcut('esc', 'close_modal', 'Close modal or popup', (event) => {
      if (onCloseModal) onCloseModal();
    });
  }, [
    registerShortcut,
    onSendMessage,
    onEditLastMessage,
    onNavigatePreviousChat,
    onNavigateNextChat,
    onSelectAllMessages,
    onCopySelectedMessages,
    onPasteMessage,
    onCutSelectedMessages,
    onUndoLastAction,
    onRedoLastAction,
    onReplyToMessage,
    onForwardMessage,
    onDeleteMessage,
    onEditMessage,
    onStarMessage,
    onPinMessage,
    onUnpinMessage,
    onInsertEmoji,
    onInsertGif,
    onInsertLink,
    onBoldText,
    onItalicText,
    onUnderlineText,
    onHeading1,
    onHeading2,
    onHeading3,
    onQuoteText,
    onInsertHorizontalRule,
    onInsertNumberedList,
    onInsertBulletedList,
    onIndentText,
    onOutdentText,
    onToggleOrderedList,
    onToggleUnorderedList,
    onToggleCodeBlock,
    onToggleMention,
    onToggleNotification,
    onToggleWhisper,
    onJumpToChat,
    onSearchChats,
    onToggleLeftSidebar,
    onToggleRightSidebar,
    onToggleBottomBar,
    onToggleTopBar,
    onToggleFullscreen,
    onShowHelp,
    onCloseModal,
    onQuitChat,
    onExitApp
  ]);

  // Register compose context shortcuts
  useEffect(() => {
    // Text formatting
    registerShortcut('ctrl+b', 'bold_text', 'Bold text', (event) => {
      if (onBoldText) onBoldText();
    });

    registerShortcut('ctrl+i', 'italic_text', 'Italic text', (event) => {
      if (onItalicText) onItalicText();
    });

    registerShortcut('ctrl+u', 'underline_text', 'Underline text', (event) => {
      if (onUnderlineText) onUnderlineText();
    });

    registerShortcut('ctrl+shift+.', 'quote_text', 'Quote text', (event) => {
      if (onQuoteText) onQuoteText();
    });

    registerShortcut('ctrl+shift+1', 'heading1', 'Heading 1', (event) => {
      if (onHeading1) onHeading1();
    });

    registerShortcut('ctrl+shift+2', 'heading2', 'Heading 2', (event) => {
      if (onHeading2) onHeading2();
    });

    registerShortcut('ctrl+shift+3', 'heading3', 'Heading 3', (event) => {
      if (onHeading3) onHeading3();
    });

    registerShortcut('ctrl+k', 'insert_link', 'Insert link', (event) => {
      if (onInsertLink) onInsertLink();
    });

    registerShortcut('ctrl+shift+k', 'insert_code', 'Insert code', (event) => {
      if (onToggleCodeBlock) onToggleCodeBlock();
    });

    registerShortcut('ctrl+shift+9', 'insert_numbered_list', 'Insert numbered list', (event) => {
      if (onInsertNumberedList) onInsertNumberedList();
    });

    registerShortcut('ctrl+shift+8', 'insert_bulleted_list', 'Insert bulleted list', (event) => {
      if (onInsertBulletedList) onInsertBulletedList();
    });

    registerShortcut('ctrl+shift+[', 'indent_text', 'Indent text', (event) => {
      if (onIndentText) onIndentText();
    });

    registerShortcut('ctrl+shift+]', 'outdent_text', 'Outdent text', (event) => {
      if (onOutdentText) onOutdentText();
    });

    registerShortcut('ctrl+shift+m', 'insert_mention', 'Insert mention', (event) => {
      if (onToggleMention) onToggleMention();
    });

    registerShortcut('ctrl+shift+e', 'insert_emoji', 'Insert emoji', (event) => {
      if (onInsertEmoji) onInsertEmoji();
    });

    registerShortcut('ctrl+shift+g', 'insert_gif', 'Insert GIF', (event) => {
      if (onInsertGif) onInsertGif();
    });

    registerShortcut('ctrl+shift+f', 'insert_file', 'Insert file', (event) => {
      // This would typically trigger a file input
    });

    registerShortcut('ctrl+shift+v', 'paste_formatted', 'Paste formatted text', (event) => {
      if (onPasteMessage) onPasteMessage();
    });
  }, [
    registerShortcut,
    onBoldText,
    onItalicText,
    onUnderlineText,
    onQuoteText,
    onHeading1,
    onHeading2,
    onHeading3,
    onInsertLink,
    onToggleCodeBlock,
    onInsertNumberedList,
    onInsertBulletedList,
    onIndentText,
    onOutdentText,
    onToggleMention,
    onInsertEmoji,
    onInsertGif,
    onPasteMessage
  ]);

  // Listen for custom keyboard shortcut events
  useEffect(() => {
    const handleShortcutEvent = (event) => {
      console.log('⌨️ Keyboard shortcut triggered:', event.detail);
      // Additional handling can be added here if needed
    };

    document.addEventListener('keyboard-shortcut', handleShortcutEvent);
    return () => document.removeEventListener('keyboard-shortcut', handleShortcutEvent);
  }, []);

  return null; // This component doesn't render anything visible
};

export default KeyboardShortcutIntegration;
