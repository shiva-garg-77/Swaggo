/**
 * Voice Command Service - Simplified frontend service for voice command recognition
 * 
 * This service provides basic functionality for recognizing and processing voice commands
 * for hands-free operation of the chat application.
 */

class VoiceCommandService {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.commands = new Map();
    this.context = 'global';
    this.isSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    this.lang = 'en-US';
    
    // Minimal voice commands
    this.defaultCommands = {
      global: {
        'open chat': { action: 'open_chat' },
        'new message': { action: 'new_message' },
        'send message': { action: 'send_message' },
        'read last message': { action: 'read_last_message' },
        'next chat': { action: 'next_chat' },
        'previous chat': { action: 'previous_chat' },
        'open settings': { action: 'open_settings' },
        'toggle theme': { action: 'toggle_theme' },
        'stop listening': { action: 'stop_listening' }
      }
    };
    
    // Initialize speech recognition if supported and in browser
    if (typeof window !== 'undefined' && this.isSupported) {
      this.initializeRecognition();
      this.initializeDefaultCommands();
    }
  }

  /**
   * Initialize speech recognition
   */
  initializeRecognition() {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Simplified: single command at a time
    this.recognition.interimResults = false; // Simplified: no interim results
    this.recognition.lang = this.lang;
    
    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      document.dispatchEvent(new CustomEvent('voice-command-start'));
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      document.dispatchEvent(new CustomEvent('voice-command-end'));
    };
    
    this.recognition.onerror = (event) => {
      document.dispatchEvent(new CustomEvent('voice-command-error', {
        detail: { error: event.error }
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
        this.registerCommand(context, phrase, command.action);
      });
    });
  }

  /**
   * Register a new voice command
   * @param {string} context - Context where command is active
   * @param {string} phrase - Voice phrase to recognize
   * @param {string} action - Action to trigger
   */
  registerCommand(context, phrase, action) {
    const normalizedPhrase = phrase.toLowerCase().trim();
    
    if (!this.commands.has(context)) {
      this.commands.set(context, new Map());
    }
    
    this.commands.get(context).set(normalizedPhrase, { action, phrase: normalizedPhrase });
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
    
    // Process final results only
    for (let i = event.resultIndex; i < results.length; i++) {
      if (results[i].isFinal) {
        finalTranscript += results[i][0].transcript;
      }
    }
    
    // Process final transcript
    if (finalTranscript) {
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
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('voice-command-executed', {
      detail: {
        action: command.action,
        transcript
      }
    }));
  }

  /**
   * Check if speech recognition is supported
   * @returns {boolean} True if supported
   */
  isSpeechRecognitionSupported() {
    return typeof window !== 'undefined' && this.isSupported;
  }
}

// Lazy singleton instance
let instance = null;

function getInstance() {
  if (typeof window === 'undefined') {
    // Return a mock instance for SSR
    return {
      isListening: false,
      isSupported: false,
      startListening: () => {},
      stopListening: () => {},
      registerCommand: () => {},
      unregisterCommand: () => {},
      setContext: () => {},
      getCommandsForContext: () => new Map(),
      getHelpInfo: () => [],
      setLanguage: () => {},
      setConfidenceThreshold: () => {},
      isSpeechRecognitionSupported: () => false
    };
  }
  
  if (!instance) {
    instance = new VoiceCommandService();
  }
  return instance;
}

export default getInstance;
