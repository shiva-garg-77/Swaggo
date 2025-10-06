'use client';

import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Reply, Forward, Copy, Trash2, MoreVertical, Heart, 
  Pin, Star, Flag, Edit3, Download, Share2, Timer
} from 'lucide-react';

/**
 * PERFORMANCE OPTIMIZATION: Extracted MessageActions component
 * Benefits:
 * - Modular message action handling
 * - Reduced main component complexity
 * - Reusable across different message types
 * - Memoized action handlers
 */
const MessageActions = memo(({ 
  message,
  onReply,
  onForward,
  onReact,
  onDelete,
  onEdit,
  onPin,
  onStar,
  onFlag,
  onCopy,
  onDownload,
  onShare,
  currentUser,
  theme = 'default',
  position = 'bottom-right',
  quickReactions = ['❤️', '👍', '👎', '😂', '😮', '😢', '🔥', '👏']
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // Check if user can perform certain actions
  const canEdit = message.senderId === currentUser?.profileid;
  const canDelete = message.senderId === currentUser?.profileid;
  const canPin = true; // Assuming all users can pin messages
  
  // Memoized action handlers
  const handleReply = useCallback(() => {
    onReply?.(message);
    setShowActions(false);
  }, [onReply, message]);

  const handleForward = useCallback(() => {
    onForward?.(message);
    setShowActions(false);
  }, [onForward, message]);

  const handleCopy = useCallback(async () => {
    if (message.content) {
      try {
        await navigator.clipboard.writeText(message.content);
        console.log('Message copied to clipboard');
      } catch (error) {
        console.warn('Failed to copy message:', error);
      }
    }
    setShowActions(false);
  }, [message.content]);

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this message?')) {
      onDelete?.(message.id);
    }
    setShowActions(false);
  }, [onDelete, message.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(message);
    setShowActions(false);
  }, [onEdit, message]);

  const handlePin = useCallback(() => {
    onPin?.(message.id, !message.pinned);
    setShowActions(false);
  }, [onPin, message.id, message.pinned]);

  const handleStar = useCallback(() => {
    onStar?.(message.id, !message.starred);
    setShowActions(false);
  }, [onStar, message.id, message.starred]);

  const handleFlag = useCallback(() => {
    onFlag?.(message.id);
    setShowActions(false);
  }, [onFlag, message.id]);

  const handleDownload = useCallback(() => {
    onDownload?.(message);
    setShowActions(false);
  }, [onDownload, message]);

  const handleShare = useCallback(() => {
    onShare?.(message);
    setShowActions(false);
  }, [onShare, message]);

  const handleReaction = useCallback((emoji) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
  }, [onReact, message.id]);

  const getPositionClasses = () => {
    const positions = {
      'top-left': 'bottom-full left-0 mb-2',
      'top-right': 'bottom-full right-0 mb-2',
      'bottom-left': 'top-full left-0 mt-2',
      'bottom-right': 'top-full right-0 mt-2',
    };
    return positions[position] || positions['bottom-right'];
  };

  return (
    <div className="relative">
      {/* Main Actions Button */}
      <button
        onClick={() => setShowActions(!showActions)}
        className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
          theme === 'dark' 
            ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
        title="Message actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Actions Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute ${getPositionClasses()} z-50 min-w-48 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } border rounded-lg shadow-lg py-1`}
          >
            {/* Quick Reactions */}
            <div className={`px-3 py-2 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-1">
                {quickReactions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleReaction(emoji)}
                    className="p-1 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => setShowReactions(true)}
                  className={`p-1 text-sm rounded transition-colors duration-150 ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="More reactions"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Items */}
            <div className="py-1">
              <ActionItem
                icon={Reply}
                label="Reply"
                onClick={handleReply}
                theme={theme}
              />
              
              <ActionItem
                icon={Forward}
                label="Forward"
                onClick={handleForward}
                theme={theme}
              />
              
              <ActionItem
                icon={Copy}
                label="Copy text"
                onClick={handleCopy}
                theme={theme}
                disabled={!message.content}
              />
              
              {canEdit && (
                <ActionItem
                  icon={Edit3}
                  label="Edit"
                  onClick={handleEdit}
                  theme={theme}
                />
              )}
              
              <ActionItem
                icon={Pin}
                label={message.pinned ? 'Unpin' : 'Pin'}
                onClick={handlePin}
                theme={theme}
              />
              
              <ActionItem
                icon={Star}
                label={message.starred ? 'Unstar' : 'Star'}
                onClick={handleStar}
                theme={theme}
                className={message.starred ? 'text-yellow-500' : ''}
              />
              
              {(message.type === 'image' || message.type === 'file' || message.type === 'video') && (
                <ActionItem
                  icon={Download}
                  label="Download"
                  onClick={handleDownload}
                  theme={theme}
                />
              )}
              
              <ActionItem
                icon={Share2}
                label="Share"
                onClick={handleShare}
                theme={theme}
              />
              
              <ActionItem
                icon={Flag}
                label="Report"
                onClick={handleFlag}
                theme={theme}
                className="text-orange-500"
              />
              
              {canDelete && (
                <ActionItem
                  icon={Trash2}
                  label="Delete"
                  onClick={handleDelete}
                  theme={theme}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reactions Modal */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowReactions(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`p-4 rounded-lg shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Choose a reaction
              </h3>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                  '👍', '👎', '👌', '🤞', '🤟', '🤘', '👊', '✊',
                  '🙌', '👏', '🤝', '🙏', '❤️', '🧡', '💛', '💚',
                  '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
                  '🔥', '💯', '💢', '💨', '💤', '👀', '💀', '☠️'
                ].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleReaction(emoji)}
                    className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Action Item Component
const ActionItem = memo(({ icon: Icon, label, onClick, theme, disabled, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150 ${
        disabled 
          ? 'opacity-50 cursor-not-allowed'
          : theme === 'dark'
          ? 'hover:bg-gray-700 text-gray-300'
          : 'hover:bg-gray-50 text-gray-700'
      } ${className}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
});

ActionItem.displayName = 'ActionItem';
MessageActions.displayName = 'MessageActions';

export default MessageActions;