'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../Helper/SocketProvider';

export default function MessageInput({ 
  onSendMessage, 
  placeholder = 'Type a message...', 
  chatid,
  socket,
  replyingTo,
  onCancelReply
}) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Common emojis
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'];

  // Handle typing indicators
  useEffect(() => {
    if (!socket || !socket.connected || !chatid) return;

    if (message.length > 0 && !isTyping) {
      setIsTyping(true);
      console.log('⌨️ Started typing in chat:', chatid);
      socket.emit('typing_start', {
        chatid: chatid,
        isTyping: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        console.log('⌨️ Stopped typing in chat:', chatid);
        socket.emit('typing_stop', {
          chatid: chatid,
          isTyping: false
        });
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, chatid, isTyping, socket]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      console.log('📤 Sending message from input:', { message: message.trim(), attachments, chatid });
      
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      setIsTyping(false);
      
      if (socket && socket.connected && chatid) {
        socket.emit('typing_stop', {
          chatid: chatid,
          isTyping: false
        });
      }
      
      // Clear reply state
      if (onCancelReply) {
        onCancelReply();
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
    adjustTextareaHeight();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 'file',
      url: URL.createObjectURL(file),
      filename: file.name,
      size: file.size,
      mimetype: file.type,
      file: file
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 bg-white border-t border-gray-200">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Replying to {replyingTo.sender?.name || replyingTo.sender?.username}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-md">
                {replyingTo.content || 'Media message'}
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-2 max-w-xs">
              {attachment.type === 'image' ? (
                <img 
                  src={attachment.url} 
                  alt={attachment.filename}
                  className="max-h-20 rounded object-cover"
                />
              ) : attachment.type === 'video' ? (
                <video 
                  src={attachment.url} 
                  className="max-h-20 rounded"
                  controls={false}
                />
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                      {attachment.filename}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full px-6 py-3 pr-12 bg-gray-100 border border-gray-200 rounded-full resize-none text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[48px] max-h-[100px] transition-all"
            rows={1}
          />
          
          {/* Emoji Button */}
          <div className="absolute right-3 bottom-3">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-1 text-gray-500 hover:text-red-500 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-64 max-h-40 overflow-y-auto z-50">
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() && attachments.length === 0}
          className={`p-3 rounded-full transition-all duration-200 ${
            message.trim() || attachments.length > 0
              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
