'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../Helper/PerfectSocketProvider';
import VoiceMessageRecorder from './VoiceMessageRecorder';
import GifPanel from './GifPanel';
import StickerPanel from './StickerPanel';
import EmojiPicker from './EmojiPicker';
import MessageTemplatesPanel from './MessageTemplatesPanel';
import InlineLinkPreviewBar from './InlineLinkPreviewBar';
import { Clock, X, Mic } from 'lucide-react';
import cdnService from '../../services/CDNService'; // 🔧 PERFORMANCE FIX #39: Import CDN service for image optimization
import { LazyImage } from '../../utils/performanceOptimizations';

export default function MessageInput({ 
  onSendMessage, 
  onTyping,
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
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState(['😊', '❤️', '👍', '😂', '🔥', '🎉', '😍', '👋', '💯', '✨']);
  const [voiceCmdActive, setVoiceCmdActive] = useState(false);
  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  // Message scheduling state
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showScheduledMessageManager, setShowScheduledMessageManager] = useState(false);
  // Issue #21: Enhanced loading states for message sending
  const [isSending, setIsSending] = useState(false);
  const [sendingMessages, setSendingMessages] = useState(new Map()); // messageId -> status
  const [failedMessages, setFailedMessages] = useState(new Map()); // messageId -> error
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dragCounter = useRef(0);

  // Common emojis
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'];

  // Handle drag and drop events with enhanced functionality
  useEffect(() => {
    let dragTimeout;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        // Check if any of the items are files
        let hasFiles = false;
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].kind === 'file') {
            hasFiles = true;
            break;
          }
        }
        
        if (hasFiles) {
          setIsDragOver(true);
        }
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;
      
      // Use a timeout to prevent flickering when dragging over child elements
      clearTimeout(dragTimeout);
      dragTimeout = setTimeout(() => {
        if (dragCounter.current === 0) {
          setIsDragOver(false);
        }
      }, 50);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Set drop effect to copy to indicate file transfer
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      dragCounter.current = 0;
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Filter out any non-file items
        const files = Array.from(e.dataTransfer.files).filter(file => file.size > 0);
        if (files.length > 0) {
          handleFiles(files);
        }
        e.dataTransfer.clearData();
      }
    };

    // Add event listeners to the document
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      clearTimeout(dragTimeout);
    };
  }, []);

  // Handle typing indicators with debouncing
  useEffect(() => {
    if (!socket || !socket.connected || !chatid) return;

    // Use debounced typing from PerfectSocketProvider
    if (message.length > 0) {
      // Start typing with debounce
      socket.emit('typing_start', { chatid });
    } else {
      // Stop typing when message is empty
      socket.emit('typing_stop', { chatid });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (message.length > 0) {
        socket.emit('typing_stop', { chatid });
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, chatid, socket]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  };

  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);
    adjustTextareaHeight();
    
    // Handle typing indicators (now handled by useEffect with debouncing)
    if (onTyping) {
      onTyping(newValue.trim().length > 0);
    }
  };

  // Prefetch link previews when user types/pastes URLs (debounced)
  const linkPrefetchDebounceRef = useRef(null);
  const prefetchedUrlsRef = useRef(new Set());
  useEffect(() => {
    if (linkPrefetchDebounceRef.current) clearTimeout(linkPrefetchDebounceRef.current);
    linkPrefetchDebounceRef.current = setTimeout(async () => {
      try {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = typeof message === 'string' ? message.match(urlRegex) : null;
        if (urls && urls.length > 0) {
          // Lazy import cache to avoid SSR issues
          let cache;
          try {
            cache = require('../../services/LinkPreviewCache');
          } catch {}
          if (cache && cache.prefetch) {
            for (const u of urls) {
              if (!prefetchedUrlsRef.current.has(u)) {
                prefetchedUrlsRef.current.add(u);
                cache.prefetch(u).catch(() => {});
              }
            }
          }
        }
      } catch {}
    }, 300);
    return () => linkPrefetchDebounceRef.current && clearTimeout(linkPrefetchDebounceRef.current);
  }, [message]);

  // Issue #21: Retry failed message
  const retryMessage = useCallback(async (messageId, messageData) => {
    console.log('🔄 Retrying failed message:', messageId);
    
    // Update status to sending
    setSendingMessages(prev => new Map(prev).set(messageId, 'sending'));
    setFailedMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(messageId);
      return newMap;
    });
    
    try {
      await onSendMessage(messageData.content, messageData.attachments);
      
      // Success - remove from tracking
      setSendingMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(messageId);
        return newMap;
      });
      
      console.log('✅ Message retry successful:', messageId);
    } catch (error) {
      console.error('❌ Message retry failed:', messageId, error);
      
      // Mark as failed again
      setSendingMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(messageId);
        return newMap;
      });
      
      setFailedMessages(prev => new Map(prev).set(messageId, {
        error: error.message,
        data: messageData,
        timestamp: Date.now()
      }));
    }
  }, [onSendMessage]);

  const handleSendMessage = async (content = message.trim(), mediaAttachments = attachments) => {
    if ((content || mediaAttachments.length > 0) && !isSending) {
      const messageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📤 Sending message from input:', { 
        messageId,
        message: content, 
        attachments: mediaAttachments, 
        chatid,
        scheduledTime
      });
      
      // Issue #21: Optimistic UI - Show sending state immediately
      const messageData = {
        content,
        attachments: mediaAttachments,
        chatid,
        timestamp: Date.now(),
        scheduledTime: scheduledTime || null
      };
      
      setSendingMessages(prev => new Map(prev).set(messageId, 'sending'));
      setIsSending(true);
      
      try {
        // Send the message (with scheduling if applicable)
        if (scheduledTime && new Date(scheduledTime) > new Date()) {
          // Schedule the message
          await onSendMessage(content, mediaAttachments, { scheduledTime });
          console.log('📅 Message scheduled for:', new Date(scheduledTime).toLocaleString());
        } else {
          // Send immediately
          await onSendMessage(content, mediaAttachments);
        }
        
        // Success - clear form and states
        setMessage('');
        setAttachments([]);
        setScheduledTime('');
        setShowSchedulePanel(false);
        setIsTyping(false);
        
        // Stop typing indicator
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
        
        // Remove from sending tracking
        setSendingMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(messageId);
          return newMap;
        });
        
        console.log('✅ Message sent successfully:', messageId);
        
      } catch (error) {
        console.error('❌ Failed to send message:', messageId, error);
        
        // Mark as failed with retry option
        setSendingMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(messageId);
          return newMap;
        });
        
        setFailedMessages(prev => new Map(prev).set(messageId, {
          error: error.message,
          data: messageData,
          timestamp: Date.now()
        }));
        
        // Show user-friendly error
        const errorMsg = error.message?.includes('network') ? 
          'Network error. Check your connection.' :
          error.message?.includes('auth') ?
          'Authentication error. Please refresh the page.' :
          'Failed to send message. Please try again.';
          
        // You could show a toast notification here instead of alert
        console.error('Send error:', errorMsg);
        
      } finally {
        setIsSending(false);
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
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
    adjustTextareaHeight();
    
    // Add to recent emojis
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 15);
    });
  };

  // File size limits by type (more visible to users)
  const FILE_SIZE_LIMITS = {
    image: { max: 50 * 1024 * 1024, label: '50MB' }, // 50MB
    video: { max: 100 * 1024 * 1024, label: '100MB' }, // 100MB
    audio: { max: 50 * 1024 * 1024, label: '50MB' }, // 50MB
    document: { max: 50 * 1024 * 1024, label: '50MB' }, // 50MB
    default: { max: 50 * 1024 * 1024, label: '50MB' } // 50MB
  };

  const getFileSizeLimit = (fileType) => {
    if (fileType.startsWith('image/')) return FILE_SIZE_LIMITS.image;
    if (fileType.startsWith('video/')) return FILE_SIZE_LIMITS.video;
    if (fileType.startsWith('audio/')) return FILE_SIZE_LIMITS.audio;
    if (fileType.startsWith('application/') || fileType.startsWith('text/')) return FILE_SIZE_LIMITS.document;
    return FILE_SIZE_LIMITS.default;
  };

  const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];

  const handleFiles = async (files) => {
    const validFiles = [];
    const errors = [];
    const maxFiles = 10; // Limit to 10 files at once
    
    // Check if we're exceeding the file limit
    if (attachments.length + files.length > maxFiles) {
      const remainingSlots = maxFiles - attachments.length;
      if (remainingSlots <= 0) {
        alert(`You can only attach up to ${maxFiles} files at once. Please remove some attachments first.`);
        return;
      }
      
      // Truncate the files array to fit within the limit
      files = Array.from(files).slice(0, remainingSlots);
      alert(`Only the first ${remainingSlots} files will be attached due to the ${maxFiles} file limit.`);
    }
    
    for (const file of files) {
      try {
        // Check file size with visible limits
        const sizeLimit = getFileSizeLimit(file.type);
        if (file.size > sizeLimit.max) {
          errors.push(`"${file.name}" is too large (${formatFileSize(file.size)}). Maximum size for ${file.type.split('/')[0]} files is ${sizeLimit.label}.`);
          continue;
        }
        
        // Check file type (be lenient - warn but don't block)
        const isValidType = ALLOWED_FILE_TYPES.some(type => {
          if (file.type) {
            return file.type === type;
          }
          // For files without type, check extension
          return file.name.match(new RegExp(`\\.(${type.split('/')[1]})$`, 'i'));
        });
        
        if (!isValidType) {
          console.warn(`File type unknown for "${file.name}", allowing but may fail on upload`);
        }
        
        // Check for potentially dangerous files
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js'];
        if (dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
          errors.push(`"${file.name}" - Executable files are not allowed for security reasons.`);
          continue;
        }
        
        // Create a preview URL for images
        let previewUrl = null;
        if (file.type && file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }
        
        validFiles.push({
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'file',
          url: previewUrl || URL.createObjectURL(file),
          filename: file.name,
          size: file.size,
          mimetype: file.type,
          file: file
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        errors.push(`"${file.name}" - Failed to process file.`);
      }
    }
    
    // Display errors if any
    if (errors.length > 0) {
      alert(`File Upload Issues:\n\n${errors.join('\n')}`);
    }
    
    // Add valid files
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      
      // 🔧 NEW: Auto-send if only files are being sent (no text message)
      if (validFiles.length > 0 && !message.trim()) {
        // Set loading state
        setIsSending(true);
        try {
          await handleSendMessage('', [...attachments, ...validFiles]);
        } catch (error) {
          console.error('❌ Failed to send file message:', error);
        } finally {
          setIsSending(false);
        }
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
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

  // 🔧 FIX: Handle voice message recording - Send as proper voice message type
  const handleVoiceMessageRecorded = async (voiceData) => {
    console.log('🎤 Voice message recorded:', voiceData);
    
    // ✅ Upload voice file first using the existing uploadFile function
    try {
      setIsSending(true);
      
      // Create a Blob from the base64 data
      const base64Data = voiceData.base64.split(',')[1]; // Remove data URL prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: voiceData.mimeType || 'audio/webm' });
      
      // Create a File object
      const file = new File([blob], `voice-message-${Date.now()}.webm`, { 
        type: voiceData.mimeType || 'audio/webm' 
      });
      
      // Upload the file using the existing upload mechanism
      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        const formData = new FormData();
        formData.append('file', file);
        
        xhr.open('POST', '/upload');
        xhr.send(formData);
      });
      
      // ✅ CORRECT FORMAT: Send as structured message data with file reference
      const messageData = {
        messageType: 'voice',
        content: '',
        voiceData: {
          duration: voiceData.duration || 0,
          size: voiceData.size || 0,
          mimeType: voiceData.mimeType || 'audio/webm',
          fileId: uploadResult.fileReference.fileid,
          url: uploadResult.fileUrl
        }
      };
      
      console.log('📤 Sending voice message with data:', messageData);
      
      await onSendMessage(messageData);
    } catch (error) {
      console.error('❌ Failed to send voice message:', error);
      alert(`Failed to send voice message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
    
    setShowVoiceRecorder(false);
  };

  // 🔧 FIX: Handle GIF selection - Send as proper gif message type
  const handleGifSelect = async (gif) => {
    console.log('🎬 GIF selected:', gif);
    
    // ✅ CORRECT FORMAT: Send as structured message data, not attachment
    const messageData = {
      messageType: 'gif',
      content: '',
      gifData: {
        id: gif.id || `gif-${Date.now()}`,
        title: gif.title || 'GIF',
        url: gif.url,
        thumbnail: gif.thumbnail || gif.url,
        category: gif.category || 'Trending',
        dimensions: gif.dimensions || { width: 0, height: 0 }
      }
    };
    
    console.log('📤 Sending GIF message with data:', messageData);
    
    // 🔧 NEW: Set loading state and await send operation
    setIsSending(true);
    try {
      await onSendMessage(messageData);
    } catch (error) {
      console.error('❌ Failed to send GIF message:', error);
    } finally {
      setIsSending(false);
    }
    
    setShowGifPanel(false);
  };

  // 🔧 FIX: Handle sticker selection - Send as proper sticker message type
  const handleStickerSelect = async (sticker) => {
    console.log('🎨 Sticker selected:', sticker);
    
    // ✅ CORRECT FORMAT: Send as structured message data, not attachment
    const messageData = {
      messageType: 'sticker',
      content: '',
      stickerData: {
        id: sticker.id || `sticker-${Date.now()}`,
        name: sticker.name || 'Sticker',
        preview: sticker.preview || '',
        url: sticker.url,
        category: sticker.category || 'emotions'
      }
    };
    
    console.log('📤 Sending sticker message with data:', messageData);
    
    // 🔧 NEW: Set loading state and await send operation
    setIsSending(true);
    try {
      await onSendMessage(messageData);
    } catch (error) {
      console.error('❌ Failed to send sticker message:', error);
    } finally {
      setIsSending(false);
    }
    
    setShowStickerPanel(false);
  };

  // Voice commands hook (lazy import to avoid SSR issues)
  const openSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-search-panel'));
    }
  };
  let voiceCommands;
  try {
    // dynamic require to avoid SSR issues
    // eslint-disable-next-line global-require
    const useVoiceCommands = require('../../hooks/useVoiceCommands').default;
    voiceCommands = useVoiceCommands({ onSend: () => handleSendMessage(), onOpenSearch: openSearch });
  } catch (e) {
    voiceCommands = { start: () => {}, stop: () => {}, supported: false };
  }

  return (
    <div className="p-6 bg-white border-t border-gray-200 relative">
      {/* Drag and Drop Overlay with visible file size limits */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center z-50 rounded-xl border-4 border-dashed border-blue-400 backdrop-blur-sm">
          <div className="text-center p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Drop files here
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Supports images, videos, PDFs, and documents
            </p>
            {/* Visible file size limits */}
            <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                  <span className="font-medium">Images:</span> {FILE_SIZE_LIMITS.image.label}
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                  <span className="font-medium">Videos:</span> {FILE_SIZE_LIMITS.video.label}
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                  <span className="font-medium">Audio:</span> {FILE_SIZE_LIMITS.audio.label}
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                  <span className="font-medium">Documents:</span> {FILE_SIZE_LIMITS.document.label}
                </div>
              </div>
              <p className="text-xs">Maximum {maxFiles} files at once</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                JPG, PNG, GIF
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                MP4, WebM
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                PDF, DOC
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-3 p-4 bg-gray-50 dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  Replying to
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-2 truncate">
                  {replyingTo.sender?.name || replyingTo.sender?.username || 'Unknown User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  · {new Date(replyingTo.createdAt || replyingTo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-md leading-relaxed">
                {replyingTo.content || (replyingTo.messageType === 'image' ? '📷 Photo' : 
                                        replyingTo.messageType === 'video' ? '🎥 Video' : 
                                        replyingTo.messageType === 'voice' ? '🎤 Voice message' : 
                                        replyingTo.messageType === 'gif' ? '🎬 GIF' : 
                                        replyingTo.messageType === 'sticker' ? '🎨 Sticker' : 
                                        replyingTo.messageType === 'file' ? `📁 ${replyingTo.filename || 'File'}` : 
                                        'Media message')}
              </div>
              {replyingTo.attachments && replyingTo.attachments.length > 0 && (
                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{replyingTo.attachments.length} attachment{replyingTo.attachments.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <button
              onClick={onCancelReply}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Cancel reply"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Issue #21: Failed Messages with Retry */}
      {failedMessages.size > 0 && (
        <div className="mb-3">
          {Array.from(failedMessages.entries()).map(([messageId, failure]) => (
            <div key={messageId} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Failed to send message
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                    {failure.error || 'Unknown error occurred'}
                  </p>
                  {failure.data.content && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate max-w-xs">
                      "{failure.data.content}"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => retryMessage(messageId, failure.data)}
                  disabled={sendingMessages.has(messageId)}
                  className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded transition-colors flex items-center space-x-1"
                >
                  {sendingMessages.has(messageId) ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  <span>{sendingMessages.has(messageId) ? 'Retrying...' : 'Retry'}</span>
                </button>
                <button
                  onClick={() => {
                    setFailedMessages(prev => {
                      const newMap = new Map(prev);
                      newMap.delete(messageId);
                      return newMap;
                    });
                  }}
                  className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                  title="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-gray-100 dark:bg-gray-800 rounded-xl p-3 max-w-sm shadow-sm hover:shadow-md transition-shadow duration-200">
              {attachment.type === 'image' ? (
                <div className="relative">
                  <LazyImage 
                    src={cdnService.getChatMediaUrl(attachment.url, { type: 'image', maxWidth: 300, quality: 'MEDIUM' })} // 🔧 PERFORMANCE FIX #39: Use CDN-optimized image URLs with responsive sizing
                    alt={attachment.filename}
                    className="max-h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-gray-800/90 rounded-full p-2">
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : attachment.type === 'video' ? (
                <div className="relative">
                  <video 
                    src={cdnService.getChatMediaUrl(attachment.url, { type: 'video', quality: 'MEDIUM' })} // 🔧 PERFORMANCE FIX #39: Use CDN-optimized video URLs
                    className="max-h-32 rounded-lg border border-gray-200 dark:border-gray-700"
                    controls={false}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-gray-800/90 rounded-full p-2">
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-2">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      {attachment.type === 'file' && (
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-40">
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
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm transition-colors duration-200"
                aria-label={`Remove ${attachment.filename}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voice Message Recorder */}
      {showVoiceRecorder && (
        <VoiceMessageRecorder
          onSend={handleVoiceMessageRecorded}
          onCancel={() => setShowVoiceRecorder(false)}
          isOpen={showVoiceRecorder}
        />
      )}

      {/* Templates Panel */}
      {showTemplates && (
        <MessageTemplatesPanel
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onInsert={(text) => { setMessage(prev => (prev ? prev + '\n' : '') + text); setShowTemplates(false); textareaRef.current?.focus(); }}
        />
      )}

      {/* GIF Panel */}
      {showGifPanel && (
        <div className="mb-3">
          <GifPanel
            isOpen={showGifPanel}
            onClose={() => setShowGifPanel(false)}
            onGifSelect={handleGifSelect}
          />
        </div>
      )}

      {/* Sticker Panel */}
      {showStickerPanel && (
        <div className="mb-3">
          <StickerPanel
            isOpen={showStickerPanel}
            onClose={() => setShowStickerPanel(false)}
            onStickerSelect={handleStickerSelect}
          />
        </div>
      )}

      {/* Schedule Panel */}
      {showSchedulePanel && (
        <div className="mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Schedule Message</h3>
            <button 
              onClick={() => setShowSchedulePanel(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send at
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {scheduledTime && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 inline mr-1" />
                Scheduled for: {new Date(scheduledTime).toLocaleString()}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setScheduledTime('');
                  setShowSchedulePanel(false);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowSchedulePanel(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Set Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Message Manager */}
      <ScheduledMessageManager
        user={user}
        chat={chat}
        isOpen={showScheduledMessageManager}
        onClose={() => setShowScheduledMessageManager(false)}
        onMessageUpdated={(message) => {
          console.log('Scheduled message updated:', message);
        }}
        onMessageCancelled={(messageId) => {
          console.log('Scheduled message cancelled:', messageId);
        }}
      />

      <div className="flex items-end space-x-2">
        {/* Media Buttons */}
        <div className="flex space-x-1">
          {/* Voice Message Button */}
          <button
            onClick={() => {
              setShowVoiceRecorder(!showVoiceRecorder);
              setShowGifPanel(false);
              setShowStickerPanel(false);
            }}
            className={`p-3 rounded-full transition-colors ${
              showVoiceRecorder 
                ? 'bg-red-100 text-red-600' 
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            }`}
            title="Record voice message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* GIF Button */}
          <button
            onClick={() => {
              setShowGifPanel(!showGifPanel);
              setShowVoiceRecorder(false);
              setShowStickerPanel(false);
            }}
            className={`p-3 rounded-full transition-colors ${
              showGifPanel 
                ? 'bg-purple-100 text-purple-600' 
                : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50'
            }`}
            title="Send GIF"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Sticker Button */}
          <button
            onClick={() => {
              setShowStickerPanel(!showStickerPanel);
              setShowVoiceRecorder(false);
              setShowGifPanel(false);
            }}
            className={`p-3 rounded-full transition-colors ${
              showStickerPanel 
                ? 'bg-yellow-100 text-yellow-600' 
                : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50'
            }`}
            title="Send sticker"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Attachment Button */}
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setShowVoiceRecorder(false);
              setShowGifPanel(false);
              setShowStickerPanel(false);
            }}
            className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Attach files"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          {/* Templates Button */}
          <button
            onClick={() => {
              setShowTemplates(true);
              setShowVoiceRecorder(false);
              setShowGifPanel(false);
              setShowStickerPanel(false);
            }}
            className="p-3 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Insert template"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 11-6 0 3 3 0 016 0zm8 3a8 8 0 11-16 0 8 8 0 0116 0z" />
            </svg>
          </button>

          {/* Schedule Message Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSchedulePanel(!showSchedulePanel);
                setShowVoiceRecorder(false);
                setShowGifPanel(false);
                setShowStickerPanel(false);
              }}
              className={`p-3 rounded-full transition-colors ${
                showSchedulePanel || scheduledTime
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
              }`}
              title="Schedule message"
            >
              <Clock className="w-5 h-5" />
            </button>
            
            {/* Schedule dropdown menu */}
            {(showSchedulePanel || scheduledTime) && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-48 z-10">
                <button
                  onClick={() => {
                    setShowSchedulePanel(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Set Schedule
                </button>
                <button
                  onClick={() => {
                    setShowScheduledMessageManager(true);
                    setShowSchedulePanel(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Manage Scheduled
                </button>
              </div>
            )}
          </div>
        </div>

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
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowEmoji(false);
                setShowVoiceRecorder(false);
                setShowGifPanel(false);
                setShowStickerPanel(false);
              }}
              className={`p-1 rounded-full transition-colors ${
                showEmojiPicker
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Advanced Emoji Picker Component */}
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiSelect={handleEmojiSelect}
            recentEmojis={recentEmojis}
          />
          {/* Inline Link Previews */}
          <InlineLinkPreviewBar text={message} onDismiss={() => {}} />
        </div>

        {/* Voice Commands Button */}
        <button
          onClick={() => {
            if (voiceCommands.supported) {
              if (!voiceCmdActive) {
                voiceCommands.start();
                setVoiceCmdActive(true);
              } else {
                voiceCommands.stop();
                setVoiceCmdActive(false);
              }
            }
          }}
          className={`p-3 rounded-full transition-colors ${voiceCmdActive ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'} `}
          title={voiceCmdActive ? 'Stop voice commands' : 'Start voice commands'}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={isSending || (!message.trim() && attachments.length === 0 && !showVoiceRecorder && !showGifPanel && !showStickerPanel)}
          className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
            isSending 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : message.trim() || attachments.length > 0
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            // 🔧 NEW: Loading spinner
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
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