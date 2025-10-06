'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Reply, MoreHorizontal, Heart, ThumbsUp, ThumbsDown, Smile, 
  Eye, EyeOff, Copy, Forward, Trash2, Download, Edit3, Star,
  Bookmark, Timer, Clock, Calendar, Volume2, Pause, Play,
  RotateCcw, AlertTriangle, CheckCheck, Check, Send, X,
  Gamepad2, MessageSquare, Bell, Share2, Flag, Pin, Archive,
  Scissor, Palette, Type, Monitor, Camera, Image, FileText
} from 'lucide-react';

const REACTIONS = ['❤️', '👍', '👎', '😂', '😮', '😢', '🎉', '🔥', '👏', '💯'];

const EnhancedMessageBubble = ({
  message,
  isOwn,
  user,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onBookmark,
  onShare,
  onFlag,
  showReactions = true,
  showActions = true
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false);
  
  const contextMenuRef = useRef(null);
  const audioRef = useRef(null);

  // Handle auto-delete countdown
  useEffect(() => {
    if (message.autoDelete && !isExpired) {
      const deleteTime = message.timestamp + message.autoDelete.ms;
      const now = Date.now();
      
      if (now >= deleteTime) {
        setIsExpired(true);
        return;
      }
      
      const timer = setInterval(() => {
        const remaining = deleteTime - Date.now();
        if (remaining <= 0) {
          setIsExpired(true);
          clearInterval(timer);
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [message.autoDelete, message.timestamp, isExpired]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(false);
        setShowReactionPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format time remaining for auto-delete
  const formatTimeRemaining = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Handle voice message playback
  const toggleVoicePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Get message style from formatting
  const getMessageStyle = () => {
    if (!message.formatting) return {};
    
    const { fontFamily, fontSize, color, backgroundColor, bold, italic, underline, align } = message.formatting;
    
    return {
      fontFamily: fontFamily || 'inherit',
      fontSize: fontSize ? `${fontSize}px` : 'inherit',
      color: color || 'inherit',
      backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      textDecoration: underline ? 'underline' : 'none',
      textAlign: align || 'left'
    };
  };

  // Render message content based on type
  const renderMessageContent = () => {
    if (isExpired) {
      return (
        <div className="flex items-center gap-2 text-gray-500 italic">
          <AlertTriangle className="w-4 h-4" />
          This message has been deleted
        </div>
      );
    }

    switch (message.type) {
      case 'text':
      case 'formatted':
        return (
          <div 
            style={getMessageStyle()}
            className={`whitespace-pre-wrap break-words ${
              message.content.length > 500 && !showFullMessage ? 'line-clamp-6' : ''
            }`}
          >
            {message.content}
            {message.content.length > 500 && !showFullMessage && (
              <button
                onClick={() => setShowFullMessage(true)}
                className="block mt-2 text-blue-500 hover:text-blue-700 text-sm"
              >
                Show more
              </button>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button 
              onClick={toggleVoicePlayback}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isOwn ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : 'bg-blue-100 hover:bg-blue-200'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            
            <div className="flex-1 flex items-center gap-1">
              {message.voiceData?.waveform?.map((height, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isOwn ? 'bg-white bg-opacity-70' : 'bg-blue-500'
                  }`}
                  style={{ height: `${height * 20}px` }}
                />
              ))}
            </div>
            
            <span className="text-sm opacity-75">
              {message.voiceData?.duration || '0:00'}
            </span>
            
            {message.voiceData?.url && (
              <audio
                ref={audioRef}
                src={message.voiceData.url}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={() => {
                  // Update duration
                }}
              />
            )}
          </div>
        );

      case 'image':
        return (
          <div className="max-w-sm">
            <img 
              src={message.media?.url || message.attachments?.[0]?.url} 
              alt="Shared image" 
              className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                // Open full screen modal
                window.open(message.media?.url || message.attachments?.[0]?.url, '_blank');
              }}
            />
            {message.content && (
              <div className="mt-2" style={getMessageStyle()}>
                {message.content}
              </div>
            )}
          </div>
        );

      case 'drawing':
        return (
          <div className="max-w-sm">
            <img 
              src={message.drawingData} 
              alt="Drawing" 
              className="w-full rounded-lg border"
            />
            {message.content && (
              <div className="mt-2" style={getMessageStyle()}>
                {message.content}
              </div>
            )}
          </div>
        );

      case 'game':
        return (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="w-4 h-4" />
              <span className="text-sm font-medium">Game Result</span>
            </div>
            <div style={getMessageStyle()}>
              {message.content}
            </div>
          </div>
        );

      case 'sticker':
        return (
          <div className="w-32 h-32">
            <img 
              src={message.sticker?.url} 
              alt={message.sticker?.name}
              className="w-full h-full object-contain"
            />
          </div>
        );

      case 'gif':
        return (
          <div className="max-w-xs rounded-lg overflow-hidden">
            <img 
              src={message.gif?.url} 
              alt={message.gif?.title}
              className="w-full object-cover"
            />
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg min-w-[200px]">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{message.fileName || 'File'}</div>
              <div className="text-xs text-gray-500">{message.fileSize || 'Unknown size'}</div>
            </div>
            <button className="p-2 hover:bg-gray-200 rounded">
              <Download className="w-4 h-4" />
            </button>
          </div>
        );

      default:
        return (
          <div style={getMessageStyle()}>
            {message.content || 'Unsupported message type'}
          </div>
        );
    }
  };

  // Get message status indicator
  const renderMessageStatus = () => {
    if (!isOwn || isExpired) return null;
    
    return (
      <div className="flex items-center gap-1 mt-1">
        {message.status === 'sending' && (
          <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse" />
        )}
        {message.status === 'sent' && (
          <Check className="w-3 h-3 text-blue-200" />
        )}
        {message.status === 'delivered' && (
          <CheckCheck className="w-3 h-3 text-blue-200" />
        )}
        {message.status === 'read' && (
          <CheckCheck className="w-3 h-3 text-blue-400" />
        )}
      </div>
    );
  };

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        className="flex gap-3 mb-4 group"
      >
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
          <div className="p-3 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Timer className="w-4 h-4" />
              Message deleted
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {message.sender?.name?.[0] || message.sender?.username?.[0] || 'U'}
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Reply Reference */}
        {message.replyTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500 text-sm">
            <p className="text-gray-600 font-medium text-xs">
              Replying to {message.replyTo.sender?.name || 'Unknown'}
            </p>
            <p className="text-gray-800 truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Scheduled indicator */}
        {message.scheduled && message.scheduled > Date.now() && (
          <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
            <Calendar className="w-3 h-3" />
            Scheduled for {new Date(message.scheduled).toLocaleString()}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative p-3 rounded-2xl shadow-sm ${
            isOwn 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          {/* Message Content */}
          {renderMessageContent()}

          {/* Auto-delete timer */}
          {timeRemaining && message.autoDelete && (
            <div className={`flex items-center gap-1 text-xs mt-2 ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <Timer className="w-3 h-3" />
              Deletes in {formatTimeRemaining(timeRemaining)}
            </div>
          )}

          {/* Message metadata */}
          <div className={`text-xs mt-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          } flex items-center gap-1`}>
            <span>{message.timestamp}</span>
            {message.edited && (
              <span className="italic">(edited)</span>
            )}
            {message.isBookmarked && (
              <Star className="w-3 h-3 fill-current" />
            )}
            {renderMessageStatus()}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {message.reactions.map((reaction, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReact && onReact(message.id, reaction.emoji)}
                className="bg-white border border-gray-200 rounded-full px-2 py-1 text-xs flex items-center gap-1 cursor-pointer hover:bg-gray-50 shadow-sm"
              >
                <span>{reaction.emoji}</span>
                <span className="text-gray-600 font-medium">{reaction.count}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Message Actions */}
      {showActions && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onReply && onReply(message)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-gray-400" />
          </button>
          
          {showReactions && (
            <button 
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Add Reaction"
            >
              <Smile className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          <button 
            onClick={() => setShowContextMenu(!showContextMenu)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute ${
              isOwn ? 'right-0' : 'left-0'
            } top-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]`}
          >
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                setShowContextMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <Copy className="w-4 h-4 text-gray-500" />
              Copy Text
            </button>
            
            <button
              onClick={() => {
                onShare && onShare(message);
                setShowContextMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <Share2 className="w-4 h-4 text-gray-500" />
              Share
            </button>
            
            <button
              onClick={() => {
                onBookmark && onBookmark(message);
                setShowContextMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
            >
              <Bookmark className="w-4 h-4 text-gray-500" />
              {message.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            </button>
            
            {isOwn && (
              <>
                <button
                  onClick={() => {
                    onEdit && onEdit(message);
                    setShowContextMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                  Edit
                </button>
                
                <button
                  onClick={() => {
                    onDelete && onDelete(message);
                    setShowContextMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-3"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            
            {!isOwn && (
              <button
                onClick={() => {
                  onFlag && onFlag(message);
                  setShowContextMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-3"
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction Picker */}
      <AnimatePresence>
        {showReactionPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${
              isOwn ? 'right-0' : 'left-0'
            } top-0 bg-white rounded-full shadow-xl border border-gray-200 p-2 z-50`}
          >
            <div className="flex gap-1">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact && onReact(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className="p-2 text-lg hover:bg-gray-100 rounded-full transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedMessageBubble;
