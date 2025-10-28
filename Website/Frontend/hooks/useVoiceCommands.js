import { useState, useEffect, useCallback } from 'react';
import getVoiceCommandService from '../services/VoiceCommandService';

/**
 * 🎤 Voice Commands Hook
 * 
 * Provides functionality for managing voice commands in React components
 * 
 * Features:
 * - Start/stop voice recognition
 * - Register/unregister commands
 * - Handle voice command events
 * - Manage listening state
 */

export const useVoiceCommands = (context = 'global') => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  // Check if voice commands are supported
  useEffect(() => {
    const service = getVoiceCommandService();
    setIsSupported(service.isSpeechRecognitionSupported());
  }, []);

  // Set context on mount
  useEffect(() => {
    const service = getVoiceCommandService();
    service.setContext(context);
  }, [context]);

  // Event listeners
  useEffect(() => {
    const handleStart = () => {
      setIsListening(true);
      setError(null);
    };

    const handleEnd = () => {
      setIsListening(false);
    };

    const handleError = (event) => {
      setError(event.detail.message || event.detail.error);
      setIsListening(false);
    };

    const handleResult = (event) => {
      setTranscript(event.detail.transcript);
    };

    const handleInterim = (event) => {
      setInterimTranscript(event.detail.transcript);
    };

    const handleNoMatch = (event) => {
      console.log('No matching voice command found for:', event.detail.transcript);
    };

    const handleExecuted = (event) => {
      console.log('Voice command executed:', event.detail.action);
    };

    // Add event listeners
    document.addEventListener('voice-command-start', handleStart);
    document.addEventListener('voice-command-end', handleEnd);
    document.addEventListener('voice-command-error', handleError);
    document.addEventListener('voice-command-result', handleResult);
    document.addEventListener('voice-command-interim', handleInterim);
    document.addEventListener('voice-command-no-match', handleNoMatch);
    document.addEventListener('voice-command-executed', handleExecuted);

    // Cleanup
    return () => {
      document.removeEventListener('voice-command-start', handleStart);
      document.removeEventListener('voice-command-end', handleEnd);
      document.removeEventListener('voice-command-error', handleError);
      document.removeEventListener('voice-command-result', handleResult);
      document.removeEventListener('voice-command-interim', handleInterim);
      document.removeEventListener('voice-command-no-match', handleNoMatch);
      document.removeEventListener('voice-command-executed', handleExecuted);
    };
  }, []);

  /**
   * Start listening for voice commands
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }
    
    const service = getVoiceCommandService();
    service.startListening();
  }, [isSupported]);

  /**
   * Stop listening for voice commands
   */
  const stopListening = useCallback(() => {
    const service = getVoiceCommandService();
    service.stopListening();
  }, []);

  /**
   * Register a voice command
   * @param {string} phrase - Voice phrase to recognize
   * @param {string} action - Action to trigger
   * @param {string} description - Description of the command
   * @param {function} callback - Callback function to execute
   */
  const registerCommand = useCallback((phrase, action, description, callback) => {
    const service = getVoiceCommandService();
    service.registerCommand(context, phrase, action, description, callback);
  }, [context]);

  /**
   * Unregister a voice command
   * @param {string} phrase - Voice phrase
   */
  const unregisterCommand = useCallback((phrase) => {
    const service = getVoiceCommandService();
    service.unregisterCommand(context, phrase);
  }, [context]);

  /**
   * Get all commands for current context
   * @returns {Map} Map of commands
   */
  const getCommands = useCallback(() => {
    const service = getVoiceCommandService();
    return service.getCommandsForContext(context);
  }, [context]);

  /**
   * Get help information for all commands
   * @returns {Array} Array of command help information
   */
  const getHelpInfo = useCallback(() => {
    const service = getVoiceCommandService();
    return service.getHelpInfo();
  }, []);

  /**
   * Set recognition language
   * @param {string} lang - Language code
   */
  const setLanguage = useCallback((lang) => {
    const service = getVoiceCommandService();
    service.setLanguage(lang);
  }, []);

  /**
   * Set confidence threshold
   * @param {number} threshold - Confidence threshold
   */
  const setConfidenceThreshold = useCallback((threshold) => {
    const service = getVoiceCommandService();
    service.setConfidenceThreshold(threshold);
  }, []);

  return {
    // State
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    
    // Functions
    startListening,
    stopListening,
    registerCommand,
    unregisterCommand,
    getCommands,
    getHelpInfo,
    setLanguage,
    setConfidenceThreshold
  };
};

export default useVoiceCommands;