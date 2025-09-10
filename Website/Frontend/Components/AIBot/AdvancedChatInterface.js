'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Image, 
  Code, 
  MoreVertical,
  Copy,
  Download,
  RefreshCw,
  Trash2,
  Settings,
  Maximize2,
  Minimize2,
  User,
  Bot
} from 'lucide-react';
import { useAIBot } from '../Helper/AIBotProvider';
import { clsx } from 'clsx';

const AdvancedChatInterface = ({ className, isFullscreen = false, onToggleFullscreen, showHeader = true }) => {
  const {
    currentConversation,
    isTyping,
    sendMessage,
    clearConversation,
    currentConversationId,
    personalities,
    currentPersonality,
    switchPersonality,
    messageTypes,
    messageStatus
  } = useAIBot();

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inputMode, setInputMode] = useState('text'); // 'text', 'code', 'voice'
  const [showMessageActions, setShowMessageActions] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Focus input on conversation change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() && selectedFiles.length === 0) return;

    const messageType = inputMode === 'code' ? messageTypes.CODE : messageTypes.TEXT;
    
    await sendMessage(inputText, messageType, selectedFiles);
    
    // Reset input
    setInputText('');
    setSelectedFiles([]);
    setInputMode('text');
  }, [inputText, selectedFiles, inputMode, sendMessage, messageTypes]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // You might want to show a toast notification here
  };

  const downloadConversation = () => {
    // Implementation for downloading conversation
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(currentConversation, null, 2)], {
      type: 'application/json'
    });
    element.href = URL.createObjectURL(file);
    element.download = `conversation-${new Date().toISOString()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case messageStatus.SENDING:
        return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />;
      case messageStatus.SENT:
        return <div className="w-2 h-2 bg-blue-400 rounded-full" />;
      case messageStatus.DELIVERED:
        return <div className="w-2 h-2 bg-green-400 rounded-full" />;
      case messageStatus.ERROR:
        return <div className="w-2 h-2 bg-red-400 rounded-full" />;
      default:
        return null;
    }
  };

  const currentPersona = personalities[currentPersonality];

  return (
    <div
      className={clsx(
        'flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg',
        {
          'h-screen': isFullscreen,
          'h-96': !isFullscreen
        },
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      {showHeader && (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold',
              `bg-${currentPersona.color}-100 text-${currentPersona.color}-600 dark:bg-${currentPersona.color}-900 dark:text-${currentPersona.color}-300`
            )}>
              {currentPersona.avatar}
            </div>
            {isTyping && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {currentPersona.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isTyping ? 'Typing...' : currentPersona.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Personality Switcher */}
          <div className="relative">
            <select
              value={currentPersonality}
              onChange={(e) => switchPersonality(e.target.value)}
              className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(personalities).map(([key, persona]) => (
                <option key={key} value={key}>
                  {persona.avatar} {persona.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={downloadConversation}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Download conversation"
          >
            <Download size={16} />
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMessageActions(!showMessageActions)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {showMessageActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    clearConversation(currentConversationId);
                    setShowMessageActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Clear conversation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className={clsx(
          'flex-1 overflow-y-auto p-4 space-y-4',
          {
            'border-4 border-dashed border-blue-300 dark:border-blue-600': isDragOver
          }
        )}
      >
        {currentConversation?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            personality={currentPersona}
            onCopy={copyMessage}
            getStatusIcon={getMessageStatusIcon}
            formatTimestamp={formatTimestamp}
          />
        ))}

        {isTyping && <TypingIndicator personality={currentPersona} />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-sm"
              >
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Voice Recording */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={clsx(
              'p-2 transition-colors',
              isRecording
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            )}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Input Mode Toggle */}
          <button
            onClick={() => setInputMode(inputMode === 'text' ? 'code' : 'text')}
            className={clsx(
              'p-2 transition-colors',
              inputMode === 'code'
                ? 'text-blue-500 hover:text-blue-600'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            )}
            title={`Switch to ${inputMode === 'text' ? 'code' : 'text'} mode`}
          >
            <Code size={20} />
          </button>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={inputMode === 'code' ? 'Enter code...' : 'Type your message...'}
              className={clsx(
                'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                {
                  'font-mono text-sm': inputMode === 'code'
                }
              )}
              rows={inputText.split('\n').length > 1 ? Math.min(inputText.split('\n').length, 4) : 1}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() && selectedFiles.length === 0}
            className={clsx(
              'p-2 rounded-md transition-colors',
              inputText.trim() || selectedFiles.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <Image size={48} className="mx-auto text-blue-500 mb-2" />
            <p className="text-blue-600 dark:text-blue-400 font-semibold">
              Drop files here to attach
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, personality, onCopy, getStatusIcon, formatTimestamp }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-[80%] flex', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar */}
        <div className={clsx('flex-shrink-0', isUser ? 'ml-2' : 'mr-2')}>
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
            isUser
              ? 'bg-blue-500 text-white'
              : `bg-${personality.color}-100 text-${personality.color}-600 dark:bg-${personality.color}-900 dark:text-${personality.color}-300`
          )}>
            {isUser ? <User size={16} /> : personality.avatar}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <div
            className={clsx(
              'relative group px-4 py-2 rounded-lg',
              isUser
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            )}
          >
            {/* Message Type Indicator */}
            {message.type === 'code' && (
              <div className="flex items-center space-x-1 mb-2 opacity-70">
                <Code size={12} />
                <span className="text-xs">Code</span>
              </div>
            )}

            {/* Message Content */}
            <div className={clsx({
              'font-mono text-sm whitespace-pre-wrap': message.type === 'code',
              'whitespace-pre-wrap': message.type === 'text'
            })}>
              {message.content}
            </div>

            {/* Message Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onCopy(message.content)}
                className={clsx(
                  'p-1 rounded hover:bg-black/10 transition-colors',
                  isUser ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                )}
                title="Copy message"
              >
                <Copy size={12} />
              </button>
            </div>

            {/* Message Tail */}
            <div
              className={clsx(
                'absolute top-3 w-2 h-2 transform rotate-45',
                isUser
                  ? 'bg-blue-500 -right-1'
                  : 'bg-gray-100 dark:bg-gray-700 -left-1'
              )}
            />
          </div>

          {/* Message Info */}
          <div className={clsx('flex items-center mt-1 space-x-2 text-xs text-gray-400', {
            'justify-end': isUser,
            'justify-start': !isUser
          })}>
            <span>{formatTimestamp(message.timestamp)}</span>
            {isUser && getStatusIcon(message.status)}
            {message.metadata?.confidence && (
              <span>
                Confidence: {Math.round(message.metadata.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Typing Indicator Component
const TypingIndicator = ({ personality }) => (
  <div className="flex justify-start">
    <div className="max-w-[80%] flex">
      <div className="flex-shrink-0 mr-2">
        <div className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
          `bg-${personality.color}-100 text-${personality.color}-600 dark:bg-${personality.color}-900 dark:text-${personality.color}-300`
        )}>
          {personality.avatar}
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  </div>
);

export default AdvancedChatInterface;
