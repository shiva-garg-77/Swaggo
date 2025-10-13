'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Enhanced Reply Context Display Component
 * 
 * Shows a rich preview of the message being replied to, including:
 * - Sender name and avatar
 * - Message type icon (text, image, voice, etc.)
 * - Message content preview with truncation
 * - Timestamp
 * - Click-to-navigate to original message with visual highlighting
 */
export default function ReplyContextDisplay({ replyingTo, onJumpToMessage, onCancel }) {
  if (!replyingTo) return null;

  const getMessagePreview = () => {
    const { messageType, content, attachments } = replyingTo;
    
    switch (messageType) {
      case 'text':
        return content || 'Message';
      case 'image':
        return '📷 Image';
      case 'video':
        return '🎥 Video';
      case 'voice':
        return '🎤 Voice message';
      case 'gif':
        return '🎬 GIF';
      case 'sticker':
        return '🎨 Sticker';
      case 'file':
        return `📎 ${attachments?.[0]?.filename || 'File'}`;
      default:
        return 'Message';
    }
  };

  const getMessageIcon = () => {
    const { messageType } = replyingTo;
    
    const iconMap = {
      image: '📷',
      video: '🎥',
      voice: '🎤',
      gif: '🎬',
      sticker: '🎨',
      file: '📎',
      text: '💬'
    };
    
    return iconMap[messageType] || '💬';
  };

  const handleClickJumpToMessage = () => {
    if (onJumpToMessage && replyingTo.messageid) {
      onJumpToMessage(replyingTo.messageid);
    }
  };

  return (
    <div className="mb-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg shadow-sm transition-all hover:shadow-md">
      <div className="p-3 flex items-start space-x-3">
        {/* Message type icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xl">
          {getMessageIcon()}
        </div>
        
        {/* Message preview content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Replying to {replyingTo.sender?.name || replyingTo.sender?.username || 'User'}
              </span>
              {replyingTo.createdAt && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  • {formatDistanceToNow(new Date(replyingTo.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-1">
              {onJumpToMessage && (
                <button
                  onClick={handleClickJumpToMessage}
                  className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors flex items-center"
                  title="Jump to original message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="ml-1 text-xs hidden sm:inline">Jump to</span>
                </button>
              )}
              
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Cancel reply"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Message content preview */}
          <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {getMessagePreview()}
          </div>
          
          {/* Optional: Display image/video thumbnail */}
          {(replyingTo.messageType === 'image' || replyingTo.messageType === 'video') && replyingTo.attachments?.[0]?.url && (
            <div className="mt-2">
              <img 
                src={replyingTo.attachments[0].url} 
                alt="Preview" 
                className="max-h-16 rounded border border-gray-200 dark:border-gray-600 object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}