/**
 * Voice Command Service - Frontend service for voice command recognition
 * 
 * This service provides functionality for recognizing and processing voice commands
 * for hands-free operation of the chat application.
 */

class VoiceCommandService {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.commands = new Map();
    this.context = 'global';
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.continuous = true;
    this.interimResults = true;
    this.lang = 'en-US';
    this.confidenceThreshold = 0.7;
    
    // Default voice commands
    this.defaultCommands = {
      global: {
        'open chat': { action: 'open_chat', description: 'Open chat interface' },
        'new message': { action: 'new_message', description: 'Start new message' },
        'send message': { action: 'send_message', description: 'Send current message' },
        'read last message': { action: 'read_last_message', description: 'Read last received message' },
        'read unread messages': { action: 'read_unread_messages', description: 'Read all unread messages' },
        'next chat': { action: 'next_chat', description: 'Navigate to next chat' },
        'previous chat': { action: 'previous_chat', description: 'Navigate to previous chat' },
        'search chats': { action: 'search_chats', description: 'Search for chats' },
        'open settings': { action: 'open_settings', description: 'Open settings menu' },
        'toggle theme': { action: 'toggle_theme', description: 'Toggle dark/light theme' },
        'mute notifications': { action: 'mute_notifications', description: 'Mute all notifications' },
        'unmute notifications': { action: 'unmute_notifications', description: 'Unmute all notifications' },
        'enable do not disturb': { action: 'enable_dnd', description: 'Enable do not disturb mode' },
        'disable do not disturb': { action: 'disable_dnd', description: 'Disable do not disturb mode' },
        'open templates': { action: 'open_templates', description: 'Open message templates' },
        'show help': { action: 'show_help', description: 'Show help information' },
        'what time is it': { action: 'tell_time', description: 'Tell current time' },
        'stop listening': { action: 'stop_listening', description: 'Stop voice command listening' }
      },
      chat: {
        'send message': { action: 'send_message', description: 'Send current message' },
        'add emoji': { action: 'add_emoji', description: 'Add emoji to message' },
        'add gif': { action: 'add_gif', description: 'Add GIF to message' },
        'add sticker': { action: 'add_sticker', description: 'Add sticker to message' },
        'bold text': { action: 'bold_text', description: 'Make text bold' },
        'italic text': { action: 'italic_text', description: 'Make text italic' },
        'underline text': { action: 'underline_text', description: 'Underline text' },
        'reply to message': { action: 'reply_to_message', description: 'Reply to last message' },
        'forward message': { action: 'forward_message', description: 'Forward message' },
        'delete message': { action: 'delete_message', description: 'Delete message' },
        'edit message': { action: 'edit_message', description: 'Edit message' },
        'star message': { action: 'star_message', description: 'Star message' },
        'pin message': { action: 'pin_message', description: 'Pin message' },
        'unpin message': { action: 'unpin_message', description: 'Unpin message' },
        'scroll up': { action: 'scroll_up', description: 'Scroll chat up' },
        'scroll down': { action: 'scroll_down', description: 'Scroll chat down' },
        'read message': { action: 'read_message', description: 'Read current message' },
        'read chat name': { action: 'read_chat_name', description: 'Read current chat name' },
        'mute chat': { action: 'mute_chat', description: 'Mute current chat' },
        'unmute chat': { action: 'unmute_chat', description: 'Unmute current chat' }
      }
    };
    
    // Initialize speech recognition if supported
    if (this.isSupported) {
      this.initializeRecognition();
      this.initializeDefaultCommands();
    }
  }

  /**
   * Initialize speech recognition
   */
  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.lang = this.lang;
    
    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Voice command listening started');
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('voice-command-start', {
        detail: { isListening: true }
      }));
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Voice command listening stopped');
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('voice-command-end', {
        detail: { isListening: false }
      }));
    };
    
    this.recognition.onerror = (event) => {
      console.error('🎤 Voice command error:', event.error);
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('voice-command-error', {
        detail: { error: event.error, message: event.message }
      }));
    };
    
    this.recognition.onresult = (event) => {
      this.handleRecognitionResult(event);
    };
  }

  /**
   * Initialize with default commands
   */
  initializeDefaultCommands() {
    Object.entries(this.defaultCommands).forEach(([context, commands]) => {
      Object.entries(commands).forEach(([phrase, command]) => {
        this.registerCommand(context, phrase, command.action, command.description);
      });
    });
  }

  /**
   * Register a new voice command
   * @param {string} context - Context where command is active (global, chat, etc.)
   * @param {string} phrase - Voice phrase to recognize
   * @param {string} action - Action to trigger
   * @param {string} description - Description of the command
   * @param {function} callback - Optional callback function
   */
  registerCommand(context, phrase, action, description, callback = null) {
    const normalizedPhrase = phrase.toLowerCase().trim();
    
    if (!this.commands.has(context)) {
      this.commands.set(context, new Map());
    }
    
    this.commands.get(context).set(normalizedPhrase, {
      action,
      description,
      callback,
      phrase: normalizedPhrase
    });
  }

  /**
   * Unregister a voice command
   * @param {string} context - Context where command is active
   * @param {string} phrase - Voice phrase
   */
  unregisterCommand(context, phrase) {
    const normalizedPhrase = phrase.toLowerCase().trim();
    
    if (this.commands.has(context)) {
      this.commands.get(context).delete(normalizedPhrase);
    }
  }

  /**
   * Set active context
   * @param {string} context - Active context
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * Get active context
   * @returns {string} Active context
   */
  getContext() {
    return this.context;
  }

  /**
   * Start listening for voice commands
   */
  startListening() {
    if (!this.isSupported) {
      console.warn('🎤 Speech recognition not supported in this browser');
      return;
    }
    
    if (this.isListening) {
      console.warn('🎤 Already listening for voice commands');
      return;
    }
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('🎤 Failed to start voice command listening:', error);
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening() {
    if (!this.isListening) {
      return;
    }
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('🎤 Failed to stop voice command listening:', error);
    }
  }

  /**
   * Handle recognition results
   * @param {SpeechRecognitionEvent} event - Recognition event
   */
  handleRecognitionResult(event) {
    const results = event.results;
    let finalTranscript = '';
    let interimTranscript = '';
    
    // Process all results
    for (let i = event.resultIndex; i < results.length; i++) {
      const transcript = results[i][0].transcript;
      
      if (results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Dispatch interim results
    if (interimTranscript) {
      document.dispatchEvent(new CustomEvent('voice-command-interim', {
        detail: { transcript: interimTranscript }
      }));
    }
    
    // Process final transcript
    if (finalTranscript) {
      console.log('🎤 Recognized voice command:', finalTranscript);
      
      // Dispatch final result
      document.dispatchEvent(new CustomEvent('voice-command-result', {
        detail: { transcript: finalTranscript }
      }));
      
      // Process the command
      this.processCommand(finalTranscript);
    }
  }

  /**
   * Process recognized voice command
   * @param {string} transcript - Recognized transcript
   */
  processCommand(transcript) {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    // Check commands in current context
    const contextCommands = this.commands.get(this.context);
    if (contextCommands) {
      for (const [phrase, command] of contextCommands.entries()) {
        if (normalizedTranscript.includes(phrase)) {
          this.executeCommand(command, transcript);
          return;
        }
      }
    }
    
    // Check global commands
    const globalCommands = this.commands.get('global');
    if (globalCommands) {
      for (const [phrase, command] of globalCommands.entries()) {
        if (normalizedTranscript.includes(phrase)) {
          this.executeCommand(command, transcript);
          return;
        }
      }
    }
    
    // No matching command found
    console.log('🎤 No matching voice command found for:', transcript);
    
    // Dispatch no match event
    document.dispatchEvent(new CustomEvent('voice-command-no-match', {
      detail: { transcript }
    }));
  }

  /**
   * Execute voice command
   * @param {object} command - Command object
   * @param {string} transcript - Original transcript
   */
  executeCommand(command, transcript) {
    console.log('🎤 Executing voice command:', command.action);
    
    // Execute callback if provided
    if (command.callback) {
      command.callback(transcript);
    }
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('voice-command-executed', {
      detail: {
        action: command.action,
        description: command.description,
        transcript
      }
    }));
  }

  /**
   * Get all registered commands
   * @returns {Map} Map of all commands
   */
  getAllCommands() {
    return this.commands;
  }

  /**
   * Get commands for a specific context
   * @param {string} context - Context name
   * @returns {Map} Map of commands for context
   */
  getCommandsForContext(context) {
    return this.commands.get(context) || new Map();
  }

  /**
   * Get help information for all commands
   * @returns {Array} Array of command help information
   */
  getHelpInfo() {
    const helpInfo = [];
    
    this.commands.forEach((contextCommands, context) => {
      contextCommands.forEach((command, phrase) => {
        helpInfo.push({
          context,
          phrase,
          action: command.action,
          description: command.description
        });
      });
    });
    
    return helpInfo;
  }

  /**
   * Check if speech recognition is supported
   * @returns {boolean} True if supported
   */
  isSpeechRecognitionSupported() {
    return this.isSupported;
  }

  /**
   * Set recognition language
   * @param {string} lang - Language code (e.g., 'en-US')
   */
  setLanguage(lang) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Get current language
   * @returns {string} Language code
   */
  getLanguage() {
    return this.lang;
  }

  /**
   * Set confidence threshold
   * @param {number} threshold - Confidence threshold (0.0 - 1.0)
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Get confidence threshold
   * @returns {number} Confidence threshold
   */
  getConfidenceThreshold() {
    return this.confidenceThreshold;
  }
}

// Export singleton instance
export default new VoiceCommandService();