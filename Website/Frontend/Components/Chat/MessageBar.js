"use client";

import React, { useState, useRef } from 'react';
import { Send, Smile, Paperclip, Mic, MicOff, Image, Camera, FileText, Plus, X } from 'lucide-react';
import { useTheme } from '../Helper/ThemeProvider';

const MessageBar = ({ 
  onSendMessage, 
  placeholder = "Type a message...", 
  disabled = false,
  onVoiceRecord,
  onFileAttach,
  onImageAttach 
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Common emojis for quick access
  const quickEmojis = ['😊', '😂', '❤️', '👍', '👎', '😮', '🎉', '🔥', '💯', '✨'];

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
    setShowEmojiPicker(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingTime(0);
      onVoiceRecord?.(recordingTime);
    } else {
      setIsRecording(true);
      // Start recording timer (simplified)
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Stop after 60 seconds max
      setTimeout(() => {
        setIsRecording(false);
        setRecordingTime(0);
        clearInterval(interval);
      }, 60000);
    }
  };

  const handleFileSelect = (type) => {
    if (type === 'image') {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
    setShowAttachments(false);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onImageAttach?.(files);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileAttach?.(files);
    }
  };

  return (
    <div className={`border-t transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Recording Indicator */}
      {isRecording && (
        <div className={`p-3 border-b ${
          theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-red-300' : 'text-red-700'
              }`}>
                Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsRecording(false);
                  setRecordingTime(0);
                }}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={toggleRecording}
                className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Quick Emojis
            </h3>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className={`p-2 text-xl rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachments Panel */}
      {showAttachments && (
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Attachments
            </h3>
            <button
              onClick={() => setShowAttachments(false)}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Image Attachment */}
            <button
              onClick={() => handleFileSelect('image')}
              className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:border-blue-500 hover:bg-blue-900/20'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <Image className={`w-6 h-6 mx-auto mb-2 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Photo
              </span>
            </button>

            {/* Camera */}
            <button
              onClick={() => handleFileSelect('camera')}
              className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:border-green-500 hover:bg-green-900/20'
                  : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
              }`}
            >
              <Camera className={`w-6 h-6 mx-auto mb-2 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Camera
              </span>
            </button>

            {/* File */}
            <button
              onClick={() => handleFileSelect('file')}
              className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:border-purple-500 hover:bg-purple-900/20'
                  : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
              }`}
            >
              <FileText className={`w-6 h-6 mx-auto mb-2 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                File
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Message Input Bar */}
      <div className="p-4">
        <div className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl focus-within:shadow-xl focus-within:border-blue-400 ${
          theme === 'dark' 
            ? 'bg-gray-800/95 backdrop-blur-sm border-gray-600 focus-within:border-blue-500' 
            : 'bg-white/95 backdrop-blur-sm border-gray-200 focus-within:border-blue-400'
        }`}>
          <div className="flex items-end space-x-4 p-4">
            {/* Attachment Button */}
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className={`p-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                showAttachments
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200/50'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/70'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/70'
              }`}
              aria-label="Add attachment"
              aria-expanded={showAttachments}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled || isRecording}
                className={`w-full resize-none border-0 focus:outline-none focus:ring-0 transition-all duration-200 text-sm leading-relaxed ${
                  theme === 'dark'
                    ? 'bg-transparent text-white placeholder-gray-400'
                    : 'bg-transparent text-gray-900 placeholder-gray-500'
                } disabled:opacity-50`}
                rows={1}
                style={{ minHeight: '28px', maxHeight: '120px' }}
                aria-label="Type your message"
              />
            </div>

            {/* Input Actions */}
            <div className="flex items-center space-x-2">
              {/* Emoji Button */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${
                  showEmojiPicker
                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200/50'
                    : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/70'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/70'
                }`}
                aria-label="Add emoji"
                aria-expanded={showEmojiPicker}
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Voice/Send Button */}
              {message.trim() ? (
                <button
                  onClick={handleSend}
                  disabled={disabled}
                  className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-200/50"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 shadow-md ${
                    isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/50 shadow-red-200/50'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500/50 shadow-gray-700/30'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-gray-500/50 shadow-gray-200/50'
                  }`}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Helper Text */}
        <div className={`mt-2 text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default MessageBar;
