'use client';

import React, { useState } from 'react';
import { useAuth } from '../Helper/AuthProvider';
import { useSocket } from '../Helper/SocketProvider';

export default function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar, 
  chat,
  onReply,
  onEdit,
  onDelete
}) {
  const { user } = useAuth();
  const { reactToMessage } = useSocket();
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Handle reaction
  const handleReaction = (emoji) => {
    reactToMessage(message.messageid, emoji, chat.chatid);
    setShowReactions(false);
  };

  // Group reactions by emoji
  const groupReactions = () => {
    if (!message.reactions || !Array.isArray(message.reactions) || message.reactions.length === 0) return [];
    
    const grouped = {};
    message.reactions.forEach(reaction => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasUserReacted: false
        };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].users.push(reaction.profile?.username || 'Unknown');
      if (reaction.profileid === user.profileid) {
        grouped[reaction.emoji].hasUserReacted = true;
      }
    });
    
    return Object.values(grouped);
  };

  // Get read status
  const getReadStatus = () => {
    if (!isOwn || !message.readBy || !chat.participants || !Array.isArray(chat.participants)) return null;
    
    const otherParticipants = chat.participants.filter(p => p.profileid !== user.profileid);
    const readByOthers = message.readBy.filter(read => read.profileid !== user.profileid);
    
    if (readByOthers.length === 0) return 'Sent';
    if (readByOthers.length < otherParticipants.length) return 'Delivered';
    return 'Read';
  };

  const reactionGroups = groupReactions();
  const readStatus = getReadStatus();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
      {/* Avatar for received messages */}
      {!isOwn && showAvatar && (
        <img
          src={message.sender?.profilePic || '/default-avatar.png'}
          alt={message.sender?.username}
          className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
        />
      )}
      
      {/* Spacer for received messages without avatar */}
      {!isOwn && !showAvatar && <div className="w-10 mr-2" />}

      {/* Message Content */}
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
        {/* Sender name for received messages */}
        {!isOwn && showAvatar && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-3">
            {message.sender?.name || message.sender?.username}
          </div>
        )}

        {/* Reply to message */}
        {message.replyTo && (
          <div className="mb-2">
            <div className={`px-3 py-2 rounded-lg border-l-4 ${
              isOwn 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-400'
            }`}>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Replying to {message.replyTo.sender?.username}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {message.replyTo.content}
              </div>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className="relative">
          <div 
            className={`px-4 py-2 rounded-2xl relative ${
              isOwn 
                ? 'bg-red-500 text-white rounded-br-md' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
            }`}
          >
            {/* Text Content */}
            {message.content && (
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
                {message.isEdited && (
                  <span className="text-xs opacity-70 ml-2">(edited)</span>
                )}
              </div>
            )}

            {/* Attachments */}
            {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index}>
                    {attachment.type === 'image' && (
                      <img
                        src={attachment.url}
                        alt={attachment.filename}
                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(attachment.url, '_blank')}
                      />
                    )}
                    {attachment.type === 'video' && (
                      <video
                        src={attachment.url}
                        controls
                        className="max-w-full rounded-lg"
                      />
                    )}
                    {attachment.type === 'file' && (
                      <div className="flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium">{attachment.filename}</div>
                          <div className="text-xs opacity-70">
                            {attachment.size && `${Math.round(attachment.size / 1024)} KB`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Options Button */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`absolute top-1 ${isOwn ? 'left-1' : 'right-1'} w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                isOwn ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
              } flex items-center justify-center`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>

          {/* Reactions */}
          {reactionGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {reactionGroups.map((group, index) => (
                <button
                  key={index}
                  onClick={() => handleReaction(group.emoji)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    group.hasUserReacted
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={group.users.join(', ')}
                >
                  <span>{group.emoji}</span>
                  <span>{group.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Reactions */}
          {showReactions && (
            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10`}>
              <div className="flex space-x-2">
                {quickReactions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleReaction(emoji)}
                    className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options Menu */}
          {showOptions && (
            <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-32`}>
              <button
                onClick={() => {
                  setShowReactions(!showReactions);
                  setShowOptions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                React
              </button>
              <button
                onClick={() => {
                  onReply && onReply(message);
                  setShowOptions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Reply
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => {
                      onEdit && onEdit(message);
                      setShowOptions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete && onDelete(message.messageid);
                      setShowOptions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Timestamp and Read Status */}
        <div className={`mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && readStatus && (
            <span className="text-xs">• {readStatus}</span>
          )}
        </div>
      </div>

      {/* Click outside handler */}
      {(showReactions || showOptions) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowReactions(false);
            setShowOptions(false);
          }}
        />
      )}
    </div>
  );
}
