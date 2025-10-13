import React, { useState, useEffect } from 'react';
import useVoiceCommands from '../../hooks/useVoiceCommands';
import VoiceCommandService from '../../services/VoiceCommandService';
import { Mic, MicOff, Volume2, Settings, HelpCircle, X } from 'lucide-react';

/**
 * 🎤 Voice Command Manager Component
 * 
 * Provides a UI for managing and using voice commands
 * 
 * Features:
 * - Start/stop voice recognition
 * - View recognized commands
 * - Manage voice commands
 * - Display help information
 */

export default function VoiceCommandManager({ 
  isOpen, 
  onClose,
  theme = 'light',
  onOpenChat,
  onNewMessage,
  onSendMessage,
  onReadLastMessage,
  onReadUnreadMessages,
  onNextChat,
  onPreviousChat,
  onSearchChats,
  onOpenSettings,
  onToggleTheme,
  onMuteNotifications,
  onUnmuteNotifications,
  onEnableDND,
  onDisableDND,
  onOpenTemplates,
  onShowHelp,
  onTellTime
}) {
  const [activeTab, setActiveTab] = useState('commands');
  const [newCommand, setNewCommand] = useState({
    context: 'global',
    phrase: '',
    action: '',
    description: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    registerCommand,
    getHelpInfo
  } = useVoiceCommands('global');

  const [commands, setCommands] = useState([]);

  // Load commands on mount
  useEffect(() => {
    if (isOpen) {
      const helpInfo = VoiceCommandService.getHelpInfo();
      setCommands(helpInfo);
    }
  }, [isOpen]);

  // Register default callbacks
  useEffect(() => {
    if (!isOpen) return;

    // Global commands
    registerCommand('open chat', 'open_chat', 'Open chat interface', () => {
      if (onOpenChat) onOpenChat();
    });

    registerCommand('new message', 'new_message', 'Start new message', () => {
      if (onNewMessage) onNewMessage();
    });

    registerCommand('send message', 'send_message', 'Send current message', () => {
      if (onSendMessage) onSendMessage();
    });

    registerCommand('read last message', 'read_last_message', 'Read last received message', () => {
      if (onReadLastMessage) onReadLastMessage();
    });

    registerCommand('read unread messages', 'read_unread_messages', 'Read all unread messages', () => {
      if (onReadUnreadMessages) onReadUnreadMessages();
    });

    registerCommand('next chat', 'next_chat', 'Navigate to next chat', () => {
      if (onNextChat) onNextChat();
    });

    registerCommand('previous chat', 'previous_chat', 'Navigate to previous chat', () => {
      if (onPreviousChat) onPreviousChat();
    });

    registerCommand('search chats', 'search_chats', 'Search for chats', () => {
      if (onSearchChats) onSearchChats();
    });

    registerCommand('open settings', 'open_settings', 'Open settings menu', () => {
      if (onOpenSettings) onOpenSettings();
    });

    registerCommand('toggle theme', 'toggle_theme', 'Toggle dark/light theme', () => {
      if (onToggleTheme) onToggleTheme();
    });

    registerCommand('mute notifications', 'mute_notifications', 'Mute all notifications', () => {
      if (onMuteNotifications) onMuteNotifications();
    });

    registerCommand('unmute notifications', 'unmute_notifications', 'Unmute all notifications', () => {
      if (onUnmuteNotifications) onUnmuteNotifications();
    });

    registerCommand('enable do not disturb', 'enable_dnd', 'Enable do not disturb mode', () => {
      if (onEnableDND) onEnableDND();
    });

    registerCommand('disable do not disturb', 'disable_dnd', 'Disable do not disturb mode', () => {
      if (onDisableDND) onDisableDND();
    });

    registerCommand('open templates', 'open_templates', 'Open message templates', () => {
      if (onOpenTemplates) onOpenTemplates();
    });

    registerCommand('show help', 'show_help', 'Show help information', () => {
      if (onShowHelp) onShowHelp();
    });

    registerCommand('what time is it', 'tell_time', 'Tell current time', () => {
      if (onTellTime) onTellTime();
    });

    registerCommand('stop listening', 'stop_listening', 'Stop voice command listening', () => {
      stopListening();
    });
  }, [
    isOpen,
    registerCommand,
    onOpenChat,
    onNewMessage,
    onSendMessage,
    onReadLastMessage,
    onReadUnreadMessages,
    onNextChat,
    onPreviousChat,
    onSearchChats,
    onOpenSettings,
    onToggleTheme,
    onMuteNotifications,
    onUnmuteNotifications,
    onEnableDND,
    onDisableDND,
    onOpenTemplates,
    onShowHelp,
    onTellTime,
    stopListening
  ]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAddCommand = () => {
    if (newCommand.phrase && newCommand.action && newCommand.description) {
      registerCommand(
        newCommand.phrase,
        newCommand.action,
        newCommand.description,
        () => {
          // Default callback - can be overridden by specific implementations
          console.log(`🎤 Executed voice command: ${newCommand.action}`);
        }
      );
      
      // Reset form
      setNewCommand({
        context: 'global',
        phrase: '',
        action: '',
        description: ''
      });
      setIsAdding(false);
      
      // Refresh commands
      const helpInfo = VoiceCommandService.getHelpInfo();
      setCommands(helpInfo);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all voice commands to defaults?')) {
      // Clear all commands
      VoiceCommandService.commands.clear();
      
      // Reinitialize with defaults
      VoiceCommandService.initializeDefaultCommands();
      
      // Refresh commands
      const helpInfo = VoiceCommandService.getHelpInfo();
      setCommands(helpInfo);
    }
  };

  // Group commands by context
  const groupedCommands = commands.reduce((acc, command) => {
    if (!acc[command.context]) {
      acc[command.context] = [];
    }
    acc[command.context].push(command);
    return acc;
  }, {});

  if (!isOpen) return null;

  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className={`rounded-xl shadow-2xl w-full max-w-md ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center">
              <MicOff className={`w-5 h-5 mr-2 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Voice Commands Not Supported
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className={`p-1 rounded-full transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className={`p-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <p className="mb-4">
              Voice commands are not supported in your browser. Please use a modern browser 
              like Chrome, Edge, or Safari that supports the Web Speech API.
            </p>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${
                theme === 'dark' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            {isListening ? (
              <Mic className={`w-5 h-5 mr-2 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
            ) : (
              <MicOff className={`w-5 h-5 mr-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} />
            )}
            <h3 className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Voice Commands
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleListening}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  isListening
                    ? theme === 'dark' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                    : theme === 'dark' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Listening
                  </>
                )}
              </button>
              
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Status: {isListening ? 'Listening...' : 'Not listening'}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdding(true)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'text-blue-400 hover:bg-gray-700' 
                    : 'text-blue-600 hover:bg-gray-200'
                }`}
                title="Add command"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleResetToDefaults}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Reset to defaults"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Transcript display */}
          {(transcript || interimTranscript) && (
            <div className={`mt-3 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className={`text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Recognized:
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {interimTranscript && (
                  <span className="opacity-70">{interimTranscript}</span>
                )}
                {transcript && (
                  <span>{transcript}</span>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <div className={`mt-3 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
            }`}>
              Error: {error}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => setActiveTab('commands')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'commands'
                ? theme === 'dark' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-blue-500 text-blue-600'
                : theme === 'dark' 
                  ? 'border-transparent text-gray-400 hover:text-gray-300' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Commands
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'add'
                ? theme === 'dark' 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-blue-500 text-blue-600'
                : theme === 'dark' 
                  ? 'border-transparent text-gray-400 hover:text-gray-300' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Command
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'commands' && (
            <>
              {Object.entries(groupedCommands).length === 0 ? (
                <div className={`text-center py-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No voice commands found</p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([context, contextCommands]) => (
                  <div key={context} className="mb-6">
                    <h4 className={`text-md font-semibold mb-3 capitalize ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {context} Commands
                    </h4>
                    
                    <div className="space-y-2">
                      {contextCommands.map((command, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div>
                            <div className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              "{command.phrase}"
                            </div>
                            <div className={`text-sm mt-1 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {command.description}
                            </div>
                          </div>
                          
                          <div className={`px-3 py-1 rounded text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-gray-600 text-gray-200' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {command.action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'add' && (
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <h4 className={`text-md font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Add New Voice Command
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Context
                  </label>
                  <select
                    value={newCommand.context}
                    onChange={(e) => setNewCommand({...newCommand, context: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="global">Global</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Voice Phrase
                  </label>
                  <input
                    type="text"
                    value={newCommand.phrase}
                    onChange={(e) => setNewCommand({...newCommand, phrase: e.target.value})}
                    placeholder="Say this phrase..."
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Action
                  </label>
                  <input
                    type="text"
                    value={newCommand.action}
                    onChange={(e) => setNewCommand({...newCommand, action: e.target.value})}
                    placeholder="Action name"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCommand.description}
                    onChange={(e) => setNewCommand({...newCommand, description: e.target.value})}
                    placeholder="What this command does"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewCommand({
                      context: 'global',
                      phrase: '',
                      action: '',
                      description: ''
                    });
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    theme === 'dark' 
                      ? 'bg-gray-600 text-white hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCommand}
                  disabled={!newCommand.phrase || !newCommand.action || !newCommand.description}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    !newCommand.phrase || !newCommand.action || !newCommand.description
                      ? theme === 'dark' 
                        ? 'bg-gray-600 text-gray-400' 
                        : 'bg-gray-200 text-gray-500'
                      : theme === 'dark' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Add Command
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t text-sm ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}>
          Tip: Speak clearly and naturally. Commands work best in a quiet environment.
        </div>
      </div>
    </div>
  );
}