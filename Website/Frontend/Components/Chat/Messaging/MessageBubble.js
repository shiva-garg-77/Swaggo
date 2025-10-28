'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { useSocket } from '../../../Components/Helper/PerfectSocketProvider';
import { MessageStatusIcon, MESSAGE_STATUS } from './MessageStatusSystem';
import VoiceMessagePlayer from '../Voice/VoiceMessagePlayer';
import cdnService from '../../../services/CDNService'; // 🔧 PERFORMANCE FIX #39: Import CDN service for image optimization

dayjs.extend(relativeTime);

export default function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar, 
  chat,
  onReply,
  onEdit,
  onDelete,
  onRetryMessage,
  isSelected,
  isMultiSelectMode,
  onSelectToggle,
  isThreadView = false
}) {
  const { user } = useSecureAuth();
  const { reactToMessage, socket, removeReaction } = useSocket();
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState([]);
  const [showThread, setShowThread] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const allReactionsRef = useRef(null);
  const quickReactionsContainerRef = useRef(null);
  const [recentReactions, setRecentReactions] = useState([]);

  // For progressive loading of media
  const [loadedMedia, setLoadedMedia] = useState({});

  // 🔧 PERFORMANCE FIX #35: Memoize callback functions to prevent unnecessary re-renders
  const handleMediaLoad = useCallback((attachmentId) => {
    setLoadedMedia(prev => ({ ...prev, [attachmentId]: true }));
  }, []);

  const handleBubbleClick = useCallback((e) => {
    // If it's a link or button, don't interfere with its functionality
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    
    // If in multi-select mode, toggle selection
    if (isMultiSelectMode) {
      e.preventDefault();
      onSelectToggle();
    }
  }, [isMultiSelectMode, onSelectToggle]);

  const handleReplyInThread = useCallback(() => {
    if (message.threadId) {
      setShowThread(true);
    } else {
      // If no thread exists, create one by replying to this message
      onReply && onReply(message);
    }
  }, [message, onReply]);

  const saveRecent = useCallback((emoji) => {
    try {
      setRecentReactions(prev => {
        const next = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 8);
        if (typeof window !== 'undefined') window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
        return next;
      });
    } catch {}
  }, []);

  const formatTime = useCallback((timestamp) => {
    return formatMessageTime(timestamp);
  }, []);

  const scrollToMessage = useCallback((messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message
      element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
      setTimeout(() => {
        element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
      }, 2000);
    }
  }, []);

  const getRelativeTime = useCallback((timestamp) => {
    return dayjs(timestamp).fromNow();
  }, []);

  const handleReaction = useCallback((emoji) => {
    const userReacted = (message.reactions || []).some(r => r.emoji === emoji && r.profileid === user.profileid);
    if (userReacted) {
      removeReaction && removeReaction(message.messageid, emoji, chat.chatid);
    } else {
      reactToMessage(message.messageid, emoji, chat.chatid);
      saveRecent(emoji);
    }
    setShowReactions(false);
  }, [message.reactions, message.messageid, user.profileid, chat.chatid, removeReaction, reactToMessage, saveRecent]);

  const groupReactions = useCallback(() => {
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
  }, [message.reactions, user.profileid]);

  const getReadStatus = useCallback(() => {
    if (!isOwn || !message.readBy || !chat.participants || !Array.isArray(chat.participants)) return null;
    
    const otherParticipants = chat.participants.filter(p => p.profileid !== user.profileid);
    const readByOthers = message.readBy.filter(read => read.profileid !== user.profileid);
    
    if (readByOthers.length === 0) return 'Sent';
    if (readByOthers.length < otherParticipants.length) return 'Delivered';
    return 'Read';
  }, [isOwn, message.readBy, chat.participants, user.profileid]);

  const openLightbox = useCallback((attachments, startIndex = 0) => {
    const media = attachments.map(attachment => ({
      url: attachment.url,
      type: attachment.type,
      filename: attachment.filename,
      size: attachment.size
    }));
    setLightboxMedia(media);
    setShowLightbox(true);
  }, []);

  const extractUrls = useCallback((text) => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }, []);

  const isCustomEmojiUrl = useCallback((val) => {
    if (!val || typeof val !== 'string') return false;
    return /^(https?:\/\/|data:image\/)/i.test(val);
  }, []);

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Format timestamp with dayjs
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const messageTime = dayjs(timestamp);
    const now = dayjs();
    
    // Same day: show time only
    if (messageTime.isSame(now, 'day')) {
      return messageTime.format('HH:mm');
    }
    
    // Yesterday: show "Yesterday HH:mm"
    if (messageTime.isSame(now.subtract(1, 'day'), 'day')) {
      return `Yesterday ${messageTime.format('HH:mm')}`;
    }
    
    // This week: show day name and time
    if (messageTime.isAfter(now.subtract(7, 'day'))) {
      return messageTime.format('dddd HH:mm');
    }
    
    // This year: show date without year
    if (messageTime.isSame(now, 'year')) {
      return messageTime.format('MMM D, HH:mm');
    }
    
    // Different year: show full date
    return messageTime.format('MMM D, YYYY HH:mm');
  };
  
  const reactionGroups = groupReactions();
  const readStatus = getReadStatus();

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-xl p-2 transition-colors duration-200 focus-within:bg-gray-50/70 dark:focus-within:bg-gray-800/40`}
      role="article"
      aria-label={`Message from ${isOwn ? 'you' : message.sender?.username} at ${formatTime(message.createdAt)}`}
    >
      {/* Avatar for received messages */}
      {!isOwn && showAvatar && (
        <div className="relative mr-3 flex-shrink-0">
          <img
            src={message.sender?.profilePic || '/default-avatar.png'}
            alt={message.sender?.username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
      )}
      
      {/* Spacer for received messages without avatar */}
      {!isOwn && !showAvatar && <div className="w-13 mr-3" />}

      {/* Message Content */}
      <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${isOwn ? 'order-1' : 'order-2'} flex flex-col`}>
        {/* Sender name for received messages */}
        {!isOwn && showAvatar && (
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 ml-1 tracking-wide">
            {message.sender?.name || message.sender?.username}
          </div>
        )}

        {/* Reply to message */}
        {message.replyTo && (
          <div className="mb-3">
            <div className={`relative px-4 py-3 rounded-2xl border-l-4 backdrop-blur-sm ${
              isOwn 
                ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-500 shadow-sm' 
                : 'bg-gray-50/80 dark:bg-gray-700/40 border-gray-400 shadow-sm'
            }`}>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Replying to {message.replyTo.sender?.username}
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2 leading-relaxed">
                {message.replyTo.content}
              </div>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className="relative">
          <div 
            className={`px-5 py-3 rounded-2xl relative shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md ${
              isOwn 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-lg shadow-blue-200/50' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-lg border border-gray-100 dark:border-gray-700 shadow-gray-200/30 dark:shadow-gray-700/20'
            }`}
          >
            {/* Voice Message */}
            {message.messageType === 'voice' && message.voiceData && (
              <VoiceMessagePlayer 
                voiceData={message.voiceData}
                isOwn={isOwn}
                timestamp={message.createdAt}
              />
            )}
            
            {/* Call Message */}
            {message.messageType === 'call' && message.callData && (
              <div className={`flex items-center gap-3 py-2 px-1 ${
                isOwn ? 'text-white' : 'text-gray-800 dark:text-gray-100'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  message.callData.status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                  message.callData.status === 'missed' ? 'bg-red-100 dark:bg-red-900' :
                  message.callData.status === 'declined' ? 'bg-gray-100 dark:bg-gray-700' :
                  'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {message.callData.callType === 'video' ? (
                    <svg className={`w-5 h-5 ${
                      message.callData.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                      message.callData.status === 'missed' ? 'text-red-600 dark:text-red-400' :
                      message.callData.status === 'declined' ? 'text-gray-600 dark:text-gray-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className={`w-5 h-5 ${
                      message.callData.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                      message.callData.status === 'missed' ? 'text-red-600 dark:text-red-400' :
                      message.callData.status === 'declined' ? 'text-gray-600 dark:text-gray-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {message.callData.callType === 'video' ? 'Video call' : 'Voice call'}
                    {message.callData.status === 'missed' && ' (Missed)'}
                    {message.callData.status === 'declined' && ' (Declined)'}
                  </div>
                  <div className={`text-xs opacity-75 ${
                    isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.callData.duration ? 
                      `Duration: ${Math.floor(message.callData.duration / 60)}:${String(message.callData.duration % 60).padStart(2, '0')}` :
                      getRelativeTime(message.createdAt)
                    }
                  </div>
                </div>
              </div>
            )}
            
            {/* Text Content */}
            {message.content && message.messageType !== 'voice' && message.messageType !== 'call' && (
              <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isOwn ? 'text-white' : 'text-gray-800 dark:text-gray-100'
              }`}>
                {message.content}
                {message.isEdited && (
                  <span className="text-xs opacity-60 ml-2 font-medium">(edited)</span>
                )}
              </div>
            )}

            {/* Attachments */}
            {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
              <div className="mt-3 space-y-3">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="relative group/attachment">
                    {attachment.type === 'image' && (
                      <div className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                        <img
                          src={cdnService.getChatMediaUrl(attachment.url, { type: 'image', maxWidth: 800, quality: 'MEDIUM' })} // 🔧 PERFORMANCE FIX #39: Use CDN-optimized image URLs with responsive sizing
                          alt={attachment.filename}
                          className="max-w-full w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                          onClick={() => window.open(attachment.url, '_blank')}
                          loading="lazy" // 🔧 PERFORMANCE FIX #39: Add lazy loading
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover/attachment:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-gray-800/90 rounded-full p-2">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    {attachment.type === 'video' && (
                      <div className="relative rounded-xl overflow-hidden shadow-sm">
                        <video
                          src={attachment.url}
                          controls
                          className="max-w-full w-full rounded-xl"
                          poster={attachment.thumbnail}
                        />
                      </div>
                    )}
                    {attachment.type === 'file' && (
                      <div className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer hover:scale-102 transition-all duration-200 ${
                        isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`} onClick={() => window.open(attachment.url, '_blank')}>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isOwn ? 'bg-white/30' : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {attachment.filename?.endsWith('.pdf') ? (
                            <svg className={`w-6 h-6 ${isOwn ? 'text-white' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ) : attachment.filename?.match(/\.(doc|docx)$/i) ? (
                            <svg className={`w-6 h-6 ${isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (
                            <svg className={`w-6 h-6 ${isOwn ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${
                            isOwn ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}>{attachment.filename}</div>
                          <div className={`text-xs mt-1 flex items-center space-x-2 ${
                            isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {attachment.size && (
                              <span>{(attachment.size / 1024 / 1024).toFixed(1)} MB</span>
                            )}
                            <span>•</span>
                            <span>Click to download</span>
                          </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isOwn ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          <svg className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
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
              className={`absolute -top-1 ${isOwn ? '-left-1' : '-right-1'} w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                isOwn ? 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700' : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 focus:border-blue-400'
              } flex items-center justify-center`}
              aria-label="Message options"
              aria-expanded={showOptions}
              aria-haspopup="true"
            >
              <svg className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>

          {/* Reactions */}
          {reactionGroups.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Message reactions">
              {reactionGroups.map((group, index) => (
                <button
                  key={index}
                  onClick={() => handleReaction(group.emoji)}
                  className={`group/reaction flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    group.hasUserReacted
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600 shadow-blue-200/50'
                      : 'bg-gray-100/80 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                  title={`${group.users.join(', ')} reacted with ${group.emoji}`}
                  aria-label={`${group.emoji} reaction, ${group.count} ${group.count === 1 ? 'person' : 'people'} reacted. ${group.hasUserReacted ? 'You reacted.' : 'Click to react.'}`}
                >
                  <span className="text-base leading-none" aria-hidden="true">{group.emoji}</span>
                  <span className={`tabular-nums font-semibold ${
                    group.hasUserReacted ? 'text-blue-600 dark:text-blue-400' : ''
                  }`}>{group.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Reactions */}
          {showReactions && (
            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-16 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-xl p-3 z-20 animate-in slide-in-from-bottom-2 duration-200`}>
              <div className="flex gap-1">
                {quickReactions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleReaction(emoji)}
                    className="text-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-xl p-2 transition-all duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-110"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className={`absolute top-full ${isOwn ? 'right-4' : 'left-4'} w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-gray-200/50 dark:border-gray-600/50 transform rotate-45 -translate-y-1.5`}></div>
            </div>
          )}

          {/* Options Menu */}
          {showOptions && (
            <div 
              className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl shadow-xl py-2 z-20 min-w-40 sm:min-w-48 animate-in slide-in-from-top-2 duration-200`}
              role="menu"
              aria-label="Message actions"
            >
              <button
                onClick={() => {
                  setShowReactions(!showReactions);
                  setShowOptions(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200 flex items-center gap-3 focus:outline-none focus:bg-gray-100/80 dark:focus:bg-gray-700/80"
                role="menuitem"
                aria-label="Add reaction to message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 002.5-2.5V6a2.5 2.5 0 00-2.5-2.5H9V10zM15 10h-1.5a2.5 2.5 0 00-2.5 2.5V14a2.5 2.5 0 002.5 2.5H15V10z" />
                </svg>
                Add Reaction
              </button>
              <button
                onClick={() => {
                  onReply && onReply(message);
                  setShowOptions(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200 flex items-center gap-3 focus:outline-none focus:bg-gray-100/80 dark:focus:bg-gray-700/80"
                role="menuitem"
                aria-label="Reply to this message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply
              </button>
              <button
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200 flex items-center gap-3 focus:outline-none focus:bg-gray-100/80 dark:focus:bg-gray-700/80"
                role="menuitem"
                aria-label="Copy message text"
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setShowOptions(false);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              
              {isOwn && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-600 my-2 mx-2"></div>
                  <button
                    onClick={() => {
                      onEdit && onEdit(message);
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200 flex items-center gap-3 focus:outline-none focus:bg-gray-100/80 dark:focus:bg-gray-700/80"
                    role="menuitem"
                    aria-label="Edit this message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Message
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this message?')) {
                        onDelete && onDelete(message.messageid);
                      }
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center gap-3 focus:outline-none focus:bg-red-50/80 dark:focus:bg-red-900/20"
                    role="menuitem"
                    aria-label="Delete this message permanently"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Message
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Timestamp and Read Status */}
        <div className={`mt-2 flex items-center gap-2 text-xs transition-opacity duration-200 ${
          isOwn ? 'justify-end text-right' : 'justify-start text-left'
        }`}>
          <div className={`flex items-center gap-2 ${
            isOwn ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <time className={`font-medium tabular-nums ${
              isOwn ? 'text-blue-200/80' : 'text-gray-500 dark:text-gray-400'
            }`} dateTime={message.createdAt}>
              {formatTime(message.createdAt)}
            </time>
            
            {isOwn && (
              <MessageStatusIcon
                status={message.messageStatus || MESSAGE_STATUS.SENT}
                isOwn={isOwn}
                onRetry={() => message.messageStatus === MESSAGE_STATUS.FAILED && onRetryMessage && onRetryMessage(message.messageid)}
                timestamp={message.createdAt}
                deliveredTo={message.deliveredTo}
                readBy={message.readBy}
              />
            )}
          </div>
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
