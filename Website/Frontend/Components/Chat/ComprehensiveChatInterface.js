'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Phone, Video, MoreVertical, Smile, Paperclip, Mic, MicOff, 
  Image, FileText, Heart, Reply, Copy, Forward, Trash2, Download, 
  Volume2, Pause, Play, Camera, Gift, Zap, MessageCircle, Share2, 
  Eye, EyeOff, Shield, Settings, Search, Plus, Users, Bell, 
  Palette, Type, Moon, Sun, Translate, Bot, Pin, Archive, 
  VolumeX, Flag, X, ChevronDown, ChevronUp, RotateCcw,
  Clock, Check, CheckCheck, Headphones, Monitor, Filter,
  Lock, Unlock, AlertTriangle, Star, Bookmark, Edit3,
  Scissors, Layers, Maximize, Minimize,
  SkipBack, SkipForward, Repeat, Shuffle,
  UserPlus, UserMinus, Volume1, Wifi, WifiOff, ZapOff,
  MousePointer, Gauge, Languages, PenTool, Sliders,
  BarChart3, Activity, Timer, UserCheck, ShieldCheck,
  UserX, Slash
} from 'lucide-react';
import { useTheme } from '../Helper/ThemeProvider';

// Enhanced Emoji Categories with more emojis
const EMOJI_CATEGORIES = {
  recent: { icon: '🕐', emojis: ['😊', '❤️', '👍', '😂', '😢', '😮', '🎉', '😍', '👋', '🔥', '💯', '✨', '🙌', '👏', '💪'] },
  smileys: { icon: '😊', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲'] },
  people: { icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'] },
  nature: { icon: '🌳', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊'] },
  food: { icon: '🍕', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'] },
  activities: { icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🏇', '🧘', '🏄', '🏊', '🚴', '🚵', '🧗'] },
  travel: { icon: '✈️', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸'] },
  objects: { icon: '💡', emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️'] },
  symbols: { icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳'] },
  flags: { icon: '🏳️', emojis: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇮🇳', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇯🇵', '🇨🇳', '🇷🇺', '🇧🇷', '🇦🇺', '🇨🇦', '🇮🇹', '🇪🇸', '🇰🇷', '🇳🇱', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇹🇷', '🇬🇷', '🇵🇹', '🇮🇪', '🇦🇹', '🇨🇭', '🇧🇪', '🇱🇺'] }
};

// Enhanced Stickers with categories
const STICKER_CATEGORIES = {
  emotions: [
    { id: 1, url: '/stickers/happy.png', name: 'Happy', preview: '😊' },
    { id: 2, url: '/stickers/love.png', name: 'Love', preview: '😍' },
    { id: 3, url: '/stickers/laugh.png', name: 'Laugh', preview: '😂' },
    { id: 4, url: '/stickers/cool.png', name: 'Cool', preview: '😎' },
    { id: 5, url: '/stickers/thinking.png', name: 'Thinking', preview: '🤔' },
    { id: 6, url: '/stickers/angry.png', name: 'Angry', preview: '😠' },
  ],
  reactions: [
    { id: 7, url: '/stickers/thumbs-up.png', name: 'Thumbs Up', preview: '👍' },
    { id: 8, url: '/stickers/clap.png', name: 'Clap', preview: '👏' },
    { id: 9, url: '/stickers/fire.png', name: 'Fire', preview: '🔥' },
    { id: 10, url: '/stickers/heart.png', name: 'Heart', preview: '❤️' },
    { id: 11, url: '/stickers/star.png', name: 'Star', preview: '⭐' },
    { id: 12, url: '/stickers/party.png', name: 'Party', preview: '🎉' },
  ],
  animals: [
    { id: 13, url: '/stickers/cat.png', name: 'Cat', preview: '🐱' },
    { id: 14, url: '/stickers/dog.png', name: 'Dog', preview: '🐶' },
    { id: 15, url: '/stickers/panda.png', name: 'Panda', preview: '🐼' },
    { id: 16, url: '/stickers/lion.png', name: 'Lion', preview: '🦁' },
    { id: 17, url: '/stickers/tiger.png', name: 'Tiger', preview: '🐯' },
    { id: 18, url: '/stickers/fox.png', name: 'Fox', preview: '🦊' },
  ]
};

// GIF Search Results (simulated)
const GIF_CATEGORIES = ['Trending', 'Reaction', 'Love', 'Happy', 'Funny', 'Dance', 'Celebration', 'Good Morning', 'Good Night'];

const SAMPLE_GIFS = [
  { id: 1, url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', title: 'Dance', category: 'Dance' },
  { id: 2, url: 'https://media.giphy.com/media/l1J9wXoC8W4JFmREY/giphy.gif', title: 'Celebration', category: 'Celebration' },
  { id: 3, url: 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif', title: 'Happy', category: 'Happy' },
  { id: 4, url: 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif', title: 'Love', category: 'Love' },
  { id: 5, url: 'https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif', title: 'Funny', category: 'Funny' },
  { id: 6, url: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif', title: 'Reaction', category: 'Reaction' },
];

// Chat Themes
const CHAT_THEMES = [
  { id: 'default', name: 'Default', primary: '#EF4444', secondary: '#F3F4F6', preview: 'linear-gradient(135deg, #EF4444, #DC2626)' },
  { id: 'ocean', name: 'Ocean', primary: '#3B82F6', secondary: '#DBEAFE', preview: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  { id: 'forest', name: 'Forest', primary: '#10B981', secondary: '#D1FAE5', preview: 'linear-gradient(135deg, #10B981, #059669)' },
  { id: 'sunset', name: 'Sunset', primary: '#F59E0B', secondary: '#FEF3C7', preview: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { id: 'purple', name: 'Purple', primary: '#8B5CF6', secondary: '#EDE9FE', preview: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
  { id: 'dark', name: 'Dark', primary: '#1F2937', secondary: '#374151', preview: 'linear-gradient(135deg, #1F2937, #111827)' },
];

const ComprehensiveChatInterface = ({ 
  selectedChat, 
  user, 
  socket, 
  isConnected, 
  onStartCall, 
  isCallActive, 
  callType, 
  onEndCall 
}) => {
  const { theme } = useTheme();
  
  // Core Chat States
  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceWaveform, setVoiceWaveform] = useState([]);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  // Reply & Thread States
  const [replyingTo, setReplyingTo] = useState(null);
  const [isThreadView, setIsThreadView] = useState(false);
  const [threadMessages, setThreadMessages] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  // Reaction States
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [quickReactions] = useState(['❤️', '👍', '👎', '😂', '😮', '😢', '🔥', '👏']);

  // Panel States
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  // Customization States
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [chatBackground, setChatBackground] = useState('default');
  const [fontSize, setFontSize] = useState('medium');
  const [chatNickname, setChatNickname] = useState('');
  const [notificationSound, setNotificationSound] = useState('default');

  // Privacy & Security States
  const [vanishMode, setVanishMode] = useState(false);
  const [secretChat, setSecretChat] = useState(false);
  const [screenshotDetection, setScreenshotDetection] = useState(true);
  const [autoDeleteTimer, setAutoDeleteTimer] = useState(0);

  // Smart Features States
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('hi');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  // Media & Files States
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [mediaQuality, setMediaQuality] = useState('normal');
  const [viewOnceMode, setViewOnceMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Call States
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callParticipants, setCallParticipants] = useState([]);
  const [callRecording, setCallRecording] = useState(false);

  // Emoji States
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('recent');
  const [recentEmojis, setRecentEmojis] = useState(['😊', '❤️', '👍', '😂', '😢', '😮', '🎉', '😍', '👋', '🔥']);

  // GIF States
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifResults, setGifResults] = useState(SAMPLE_GIFS);
  const [selectedGifCategory, setSelectedGifCategory] = useState('Trending');

  // Sticker States
  const [selectedStickerCategory, setSelectedStickerCategory] = useState('emotions');

  // Poll States
  const [createPollMode, setCreatePollMode] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Contact & Group States
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupParticipants, setGroupParticipants] = useState([]);

  // Notes/Status States
  const [userNote, setUserNote] = useState('');
  const [noteExpiry, setNoteExpiry] = useState(24);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const voiceRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const recordingTimer = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !selectedChat) return;

    console.log('Setting up Socket.io listeners for chat:', selectedChat.chatid);

    // Join the chat room
    socket.emit('join_chat', selectedChat.chatid);

    // Listen for new messages
    const handleNewMessage = (data) => {
      console.log('Received new message:', data);
      if (data.chat.chatid === selectedChat.chatid) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.find(msg => msg.id === data.message.messageid);
          if (exists) return prev;
          
          const newMessage = {
            id: data.message.messageid,
            content: data.message.content,
            senderId: data.message.senderid.profileid || data.message.senderid,
            senderName: data.message.senderid.username || 'Unknown',
            senderAvatar: data.message.senderid.profilePic || '/default-avatar.png',
            timestamp: new Date(data.message.createdAt),
            type: data.message.messageType || 'text',
            status: 'received',
            reactions: data.message.reactions || [],
            isEdited: false,
            isPinned: false,
            attachments: data.message.attachments || [],
            mentions: data.message.mentions || []
          };
          return [...prev, newMessage];
        });
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (data.profileid !== user?.profileid) {
        setOtherUserTyping(data.isTyping);
        if (data.isTyping) {
          // Auto-hide typing indicator after 3 seconds
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    };

    // Listen for message read status
    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageid) {
          return { ...msg, status: 'read' };
        }
        return msg;
      }));
    };

    // Listen for message reactions
    const handleMessageReaction = (data) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageid) {
          const existingReactions = msg.reactions || [];
          const updatedReactions = [...existingReactions];
          
          // Find if this user already reacted with this emoji
          const existingIndex = updatedReactions.findIndex(
            r => r.emoji === data.reaction.emoji && 
                r.users && r.users.includes(data.reaction.profileid)
          );
          
          if (existingIndex > -1) {
            // Update existing reaction
            updatedReactions[existingIndex] = {
              ...updatedReactions[existingIndex],
              count: updatedReactions[existingIndex].count + 1
            };
          } else {
            // Add new reaction or increment count
            const emojiReactionIndex = updatedReactions.findIndex(r => r.emoji === data.reaction.emoji);
            if (emojiReactionIndex > -1) {
              updatedReactions[emojiReactionIndex] = {
                ...updatedReactions[emojiReactionIndex],
                count: updatedReactions[emojiReactionIndex].count + 1,
                users: [...(updatedReactions[emojiReactionIndex].users || []), data.reaction.profileid]
              };
            } else {
              updatedReactions.push({
                emoji: data.reaction.emoji,
                count: 1,
                users: [data.reaction.profileid]
              });
            }
          }
          
          return { ...msg, reactions: updatedReactions };
        }
        return msg;
      }));
    };

    // Listen for call invitations
    const handleCallInvitation = (data) => {
      console.log('Incoming call:', data);
      setIncomingCall({
        callId: data.callId,
        caller: data.caller,
        callType: data.callType,
        chatid: data.chatid
      });
    };

    // Listen for call responses
    const handleCallResponse = (data) => {
      console.log('Call response:', data);
      if (data.accepted) {
        onStartCall(data.callType);
      } else {
        // Call was declined
        console.log('Call was declined');
      }
    };

    // Register event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_read', handleMessageRead);
    socket.on('message_reaction', handleMessageReaction);
    socket.on('incoming_call', handleCallInvitation);
    socket.on('call_response', handleCallResponse);

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup on unmount or chat change
    return () => {
      console.log('Cleaning up Socket.io listeners');
      socket.emit('leave_chat', selectedChat.chatid);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_read', handleMessageRead);
      socket.off('message_reaction', handleMessageReaction);
      socket.off('incoming_call', handleCallInvitation);
      socket.off('call_response', handleCallResponse);
      socket.off('error');
    };
  }, [socket, selectedChat, user]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      console.log('Loading messages for chat:', selectedChat.chatid);
      // Here you could load historical messages from your GraphQL API
      // For now, we'll start with an empty array and rely on real-time messages
      setMessages([]);
    }
  }, [selectedChat]);

  // Voice Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        // Simulate waveform data
        setVoiceWaveform(prev => [...prev, Math.random()]);
      }, 100);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      setRecordingTime(0);
      setVoiceWaveform([]);
    }
    
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [isRecording]);

  // Typing Indicator
  useEffect(() => {
    if (!socket || !selectedChat) return;
    
    let typingTimer;
    if (inputText.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', selectedChat.chatid);
    }
    
    if (isTyping) {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing_stop', selectedChat.chatid);
      }, 2000);
    }

    return () => {
      clearTimeout(typingTimer);
      if (isTyping && socket) {
        socket.emit('typing_stop', selectedChat.chatid);
      }
    };
  }, [inputText, isTyping, socket, selectedChat]);

  // AI Suggestions
  useEffect(() => {
    if (inputText.length > 3) {
      // Simulate AI suggestions
      const suggestions = [
        "That sounds great!",
        "I completely agree.",
        "Thanks for sharing!",
        "Let me think about it.",
        "Absolutely!"
      ];
      setAiSuggestions(suggestions.slice(0, 3));
    } else {
      setAiSuggestions([]);
    }
  }, [inputText]);

  // Call Handlers
  const handleStartCall = useCallback((callType) => {
    console.log(`📞 Attempting to start ${callType} call...`);
    console.log('Socket available:', !!socket);
    console.log('Socket connected:', socket?.connected);
    console.log('Selected chat:', selectedChat?.chatid);
    console.log('User:', user?.username);
    
    if (!socket) {
      console.error('❌ Cannot start call: Socket not available');
      alert('Chat connection not available. Please refresh the page.');
      return;
    }
    
    if (!socket.connected) {
      console.error('❌ Cannot start call: Socket not connected');
      alert('Not connected to chat server. Please wait for connection.');
      return;
    }
    
    if (!selectedChat) {
      console.error('❌ Cannot start call: No chat selected');
      alert('No chat selected for call.');
      return;
    }
    
    if (!user) {
      console.error('❌ Cannot start call: No user data');
      alert('User data not available.');
      return;
    }

    const callId = `call_${Date.now()}_${Math.random()}`;
    console.log(`Starting ${callType} call in chat:`, selectedChat.chatid);
    
    // Emit call initiation to other participants
    socket.emit('initiate_call', {
      callId,
      chatid: selectedChat.chatid,
      callType,
      caller: {
        profileid: user.profileid,
        username: user.username,
        profilePic: user.profilePic
      }
    });
    
    // Start the call locally
    if (onStartCall) {
      onStartCall(callType);
    }
  }, [socket, selectedChat, user, onStartCall]);

  const handleAnswerCall = useCallback((accept) => {
    if (!socket || !incomingCall) return;
    
    console.log(`${accept ? 'Accepting' : 'Declining'} call:`, incomingCall.callId);
    
    socket.emit('answer_call', {
      callId: incomingCall.callId,
      chatid: incomingCall.chatid,
      accepted: accept,
      answerer: {
        profileid: user?.profileid,
        username: user?.username,
        profilePic: user?.profilePic
      }
    });
    
    if (accept && onStartCall) {
      onStartCall(incomingCall.callType);
    }
    
    setIncomingCall(null);
  }, [socket, incomingCall, user, onStartCall]);

  const handleEndCall = useCallback(() => {
    if (!socket || !selectedChat) return;
    
    console.log('Ending call');
    
    socket.emit('end_call', {
      chatid: selectedChat.chatid
    });
    
    if (onEndCall) {
      onEndCall();
    }
  }, [socket, selectedChat, onEndCall]);

  // Message Handlers
  const handleSendMessage = useCallback(() => {
    console.log('📨 Attempting to send message...');
    console.log('Input text:', inputText);
    console.log('Socket available:', !!socket);
    console.log('Socket connected:', socket?.connected);
    console.log('Selected chat:', selectedChat?.chatid);
    
    if (!inputText.trim() && selectedMedia.length === 0 && selectedFiles.length === 0) {
      console.log('⚠️ No content to send');
      return;
    }
    
    if (!socket) {
      console.error('❌ Socket not available');
      alert('Chat connection not available. Please refresh the page.');
      return;
    }
    
    if (!socket.connected) {
      console.error('❌ Socket not connected');
      alert('Not connected to chat server. Please wait for connection.');
      return;
    }
    
    if (!selectedChat) {
      console.error('❌ No chat selected');
      alert('No chat selected');
      return;
    }

    const clientMessageId = `msg_${Date.now()}_${Math.random()}`;
    const messageContent = inputText.trim();
    const messageType = selectedMedia.length > 0 ? 'media' : selectedFiles.length > 0 ? 'file' : 'text';
    
    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      id: clientMessageId,
      content: messageContent,
      senderId: user?.profileid || "me",
      senderName: user?.username || "You",
      senderAvatar: user?.profilePic || '/default-avatar.png',
      timestamp: new Date(),
      type: messageType,
      media: selectedMedia.length > 0 ? selectedMedia[0] : undefined,
      files: selectedFiles.length > 0 ? selectedFiles : undefined,
      attachments: [...selectedMedia, ...selectedFiles],
      replyTo: replyingTo?.id || undefined,
      status: 'sending',
      reactions: [],
      isEdited: false,
      isPinned: false,
      viewOnce: viewOnceMode,
      secretMessage: secretChat,
      mentions: [] // Extract mentions from content if needed
    };

    // Add optimistic message to UI
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input and selected items
    setInputText('');
    setSelectedMedia([]);
    setSelectedFiles([]);
    setReplyingTo(null);
    setViewOnceMode(false);

    // Send message through Socket.io
    const messageData = {
      chatid: selectedChat.chatid,
      messageType: messageType,
      content: messageContent,
      attachments: [...selectedMedia, ...selectedFiles].map(item => ({
        type: item.type || 'file',
        url: item.url || '',
        filename: item.name || '',
        size: item.size || 0,
        caption: item.caption || ''
      })),
      replyTo: replyingTo?.id || null,
      mentions: [], // Extract mentions from content if needed
      clientMessageId: clientMessageId
    };

    console.log('Sending message:', messageData);
    
    socket.emit('send_message', messageData, (response) => {
      console.log('Message send response:', response);
      
      if (response) {
        if (response.success) {
          // Update the optimistic message with server data
          setMessages(prev => prev.map(msg => {
            if (msg.id === clientMessageId) {
              return {
                ...msg,
                id: response.serverMessageId || msg.id,
                status: 'sent',
                timestamp: new Date(response.timestamp || msg.timestamp)
              };
            }
            return msg;
          }));
        } else {
          // Handle send error
          console.error('Failed to send message:', response.error);
          setMessages(prev => prev.map(msg => {
            if (msg.id === clientMessageId) {
              return { ...msg, status: 'failed' };
            }
            return msg;
          }));
        }
      }
    });

    // Stop typing indicator
    if (socket) {
      socket.emit('typing_stop', selectedChat.chatid);
    }
  }, [inputText, selectedMedia, selectedFiles, replyingTo, viewOnceMode, secretChat, user, socket, selectedChat]);

  const handleEmojiSelect = useCallback((emoji) => {
    setInputText(prev => prev + emoji);
    // Update recent emojis
    setRecentEmojis(prev => {
      const updated = [emoji, ...prev.filter(e => e !== emoji)];
      return updated.slice(0, 10);
    });
    inputRef.current?.focus();
  }, []);

  const handleStickerSend = useCallback((sticker) => {
    const newMessage = {
      id: Date.now(),
      content: '',
      senderId: user?.profileid || "me",
      senderName: "You",
      timestamp: new Date(),
      type: 'sticker',
      sticker: sticker,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setShowStickerPanel(false);
  }, [user]);

  const handleGifSend = useCallback((gif) => {
    const newMessage = {
      id: Date.now(),
      content: '',
      senderId: user?.profileid || "me",
      senderName: "You",
      timestamp: new Date(),
      type: 'gif',
      gif: gif,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setShowGifPanel(false);
  }, [user]);

  const handleReaction = useCallback((messageId, emoji) => {
    if (!socket || !selectedChat) return;
    
    // Optimistically update the UI
    const userId = user?.profileid || "me";
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (existingReaction.users && existingReaction.users.includes(userId)) {
            // Remove reaction
            return {
              ...msg,
              reactions: msg.reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== userId) }
                  : r
              ).filter(r => r.count > 0)
            };
          } else {
            // Add reaction
            return {
              ...msg,
              reactions: msg.reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count + 1, users: [...(r.users || []), userId] }
                  : r
              )
            };
          }
        } else {
          // New reaction
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, count: 1, users: [userId] }]
          };
        }
      }
      return msg;
    }));
    
    // Send reaction to server
    socket.emit('react_to_message', {
      messageid: messageId,
      emoji: emoji,
      chatid: selectedChat.chatid
    });
    
    setShowReactionPicker(null);
  }, [user, socket, selectedChat]);

  const handleVoiceRecord = useCallback(() => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      
      // Create voice message
      const newMessage = {
        id: Date.now(),
        content: '',
        senderId: user?.profileid || "me",
        senderName: "You",
        timestamp: new Date(),
        type: 'voice',
        voiceData: {
          duration: recordingTime / 10,
          waveform: voiceWaveform,
          url: `/voice/recording_${Date.now()}.mp3`
        },
        status: 'sending'
      };
      
      setMessages(prev => [...prev, newMessage]);
    } else {
      // Start recording
      setIsRecording(true);
    }
  }, [isRecording, recordingTime, voiceWaveform, user]);

  const handleMessageAction = useCallback((action, messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    switch (action) {
      case 'reply':
        setReplyingTo(message);
        inputRef.current?.focus();
        break;
      case 'forward':
        // Implement forward functionality
        break;
      case 'copy':
        if (message.content) {
          navigator.clipboard.writeText(message.content);
        }
        break;
      case 'delete':
        setMessages(prev => prev.filter(m => m.id !== messageId));
        break;
      case 'edit':
        if (message.senderId === (user?.profileid || "me")) {
          setInputText(message.content);
          // Mark as editing
        }
        break;
      case 'pin':
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
        ));
        break;
      case 'translate':
        // Implement translation
        break;
      default:
        break;
    }
    setSelectedMessageId(null);
  }, [messages, user]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedChat) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center`}>
            <MessageCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to SwagGo Chat
          </h2>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {socket ? 'Chat is ready!' : 'Connecting to chat server...'}
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              socket && isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {socket && isConnected ? 'Connected to server' : 'Not connected'}
            </span>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            <div className={`p-4 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <Shield className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Secure</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>End-to-end encrypted</p>
            </div>
            <div className={`p-4 rounded-xl ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <Zap className="w-8 h-8 text-yellow-500 mb-2" />
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Fast</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Lightning quick delivery</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    } transition-colors duration-300`}>
      {/* Chat Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      } shadow-sm`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={selectedChat.avatar || "/default-avatar.png"}
              alt={selectedChat.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {selectedChat.name}
              {chatNickname && <span className="text-red-500"> ({chatNickname})</span>}
            </h3>
            <div className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {otherUserTyping ? (
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>typing...</span>
                </div>
              ) : (
                <>
                  {isOnline ? 'Online' : `Last seen ${formatTime(lastSeen)}`}
                  {secretChat && (
                    <div className="flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Secret Chat</span>
                    </div>
                  )}
                  {vanishMode && (
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>Vanish Mode</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <button
            onClick={() => setShowSearchPanel(!showSearchPanel)}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Voice Call */}
          <button
            onClick={() => handleStartCall('voice')}
            disabled={isCallActive || !socket || !selectedChat}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            } disabled:opacity-50`}
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => handleStartCall('video')}
            disabled={isCallActive || !socket || !selectedChat}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            } disabled:opacity-50`}
          >
            <Video className="w-5 h-5" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettingsPanel && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className={`absolute right-0 top-12 w-64 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } rounded-lg shadow-xl border z-50`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Chat Settings
                      </span>
                      <button
                        onClick={() => setShowSettingsPanel(false)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Vanish Mode */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>Vanish Mode</span>
                      </div>
                      <button
                        onClick={() => setVanishMode(!vanishMode)}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          vanishMode ? 'bg-red-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        } relative`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          vanishMode ? 'transform translate-x-5' : 'transform translate-x-1'
                        } mt-1`} />
                      </button>
                    </div>

                    {/* Secret Chat */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>Secret Chat</span>
                      </div>
                      <button
                        onClick={() => setSecretChat(!secretChat)}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          secretChat ? 'bg-green-500' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        } relative`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          secretChat ? 'transform translate-x-5' : 'transform translate-x-1'
                        } mt-1`} />
                      </button>
                    </div>

                    {/* Theme Selector */}
                    <div>
                      <label className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Chat Theme
                      </label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {CHAT_THEMES.slice(0, 6).map(chatTheme => (
                          <button
                            key={chatTheme.id}
                            onClick={() => setSelectedTheme(chatTheme.id)}
                            className={`w-full h-8 rounded-md ${
                              selectedTheme === chatTheme.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            style={{ background: chatTheme.preview }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <button
                        onClick={() => setShowSettingsPanel(false)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Palette className="w-4 h-4" />
                          <span>More Themes</span>
                        </div>
                      </button>
                      <button className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Pin className="w-4 h-4" />
                          <span>Pinned Messages</span>
                        </div>
                      </button>
                      <button className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Archive className="w-4 h-4" />
                          <span>Archive Chat</span>
                        </div>
                      </button>
                      <button className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}>
                        <div className="flex items-center space-x-2">
                          <UserX className="w-4 h-4" />
                          <span>Block User</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search Panel */}
      <AnimatePresence>
        {showSearchPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-b ${
              theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                />
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-500">
                  No messages found for "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {/* User Note/Status */}
        {userNote && (
          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
          } border`}>
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
              }`}>
                {selectedChat.name}'s Note
              </span>
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
            }`}>
              {userNote}
            </p>
          </div>
        )}

        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && (
          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
          } border`}>
            <div className="flex items-center space-x-2 mb-2">
              <Pin className="w-4 h-4 text-yellow-500" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
              }`}>
                Pinned Messages
              </span>
            </div>
            <div className="space-y-1">
              {pinnedMessages.map(msg => (
                <div key={msg.id} className={`text-sm ${
                  theme === 'dark' ? 'text-yellow-200' : 'text-yellow-600'
                }`}>
                  {msg.content.substring(0, 100)}...
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === (user?.profileid || "me")}
              onReaction={(emoji) => handleReaction(message.id, emoji)}
              onAction={(action) => handleMessageAction(action, message.id)}
              theme={theme}
              quickReactions={quickReactions}
              showReactionPicker={showReactionPicker === message.id}
              setShowReactionPicker={setShowReactionPicker}
              playingVoiceId={playingVoiceId}
              setPlayingVoiceId={setPlayingVoiceId}
              formatTime={formatTime}
              formatDuration={formatDuration}
              showTranslation={showTranslation}
              translationLanguage={translationLanguage}
            />
          ))}
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`mx-4 mb-2 p-3 rounded-lg border-l-4 border-red-500 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium text-red-500`}>
                  Replying to {replyingTo.senderName}
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                } truncate`}>
                  {replyingTo.content || replyingTo.type}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className={`p-1 rounded ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestions */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Smart Suggestions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputText(suggestion);
                    setAiSuggestions([]);
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className={`p-4 border-t ${
        theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Media Preview */}
        <AnimatePresence>
          {selectedMedia.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="flex flex-wrap gap-2">
                {selectedMedia.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'image' ? (
                      <img
                        src={media.preview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <Video className="w-6 h-6" />
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedMedia(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Media Options */}
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="viewOnce"
                    checked={viewOnceMode}
                    onChange={(e) => setViewOnceMode(e.target.checked)}
                    className="rounded text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="viewOnce" className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    View once
                  </label>
                </div>
                <select
                  value={mediaQuality}
                  onChange={(e) => setMediaQuality(e.target.value)}
                  className={`text-sm rounded px-2 py-1 ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border`}
                >
                  <option value="normal">Normal Quality</option>
                  <option value="hd">HD Quality</option>
                  <option value="compressed">Compressed</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Recording */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`mb-3 p-4 rounded-lg ${
                theme === 'dark' ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'
              } border`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-red-300' : 'text-red-700'
                  }`}>
                    Recording... {formatDuration(Math.floor(recordingTime / 10))}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsRecording(false)}
                    className={`px-3 py-1 text-sm rounded ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVoiceRecord}
                    className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Send
                  </button>
                </div>
              </div>
              
              {/* Voice Waveform Preview */}
              <div className="mt-3 flex items-center space-x-1 h-8">
                {voiceWaveform.slice(-20).map((amplitude, index) => (
                  <div
                    key={index}
                    className="w-1 bg-red-500 rounded-full transition-all duration-200"
                    style={{ height: `${Math.max(amplitude * 32, 4)}px` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input */}
        <div className="flex items-end space-x-3">
          {/* Attachment Button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Attachment Panel */}
            <AnimatePresence>
              {showAttachmentPanel && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={`absolute bottom-12 left-0 w-64 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } rounded-lg shadow-xl border ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  } z-50`}
                >
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Photo */}
                      <button
                        onClick={() => {
                          // Implement photo selection
                          setShowAttachmentPanel(false);
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Image className="w-6 h-6 text-blue-500 mb-2" />
                        <span className="text-sm">Photo</span>
                      </button>

                      {/* Video */}
                      <button
                        onClick={() => {
                          setShowAttachmentPanel(false);
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Video className="w-6 h-6 text-green-500 mb-2" />
                        <span className="text-sm">Video</span>
                      </button>

                      {/* Document */}
                      <button
                        onClick={() => {
                          setShowAttachmentPanel(false);
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <FileText className="w-6 h-6 text-orange-500 mb-2" />
                        <span className="text-sm">Document</span>
                      </button>

                      {/* Camera */}
                      <button
                        onClick={() => {
                          setShowAttachmentPanel(false);
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Camera className="w-6 h-6 text-purple-500 mb-2" />
                        <span className="text-sm">Camera</span>
                      </button>

                      {/* Poll */}
                      <button
                        onClick={() => {
                          setCreatePollMode(true);
                          setShowAttachmentPanel(false);
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <BarChart3 className="w-6 h-6 text-indigo-500 mb-2" />
                        <span className="text-sm">Poll</span>
                      </button>

                      {/* Contact */}
                      <button
                        onClick={() => {
                          setShowAddContact(true);
                          setShowAttachmentPanel(false);
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <UserPlus className="w-6 h-6 text-teal-500 mb-2" />
                        <span className="text-sm">Contact</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${selectedChat.name}...`}
              className={`w-full p-3 pr-20 rounded-2xl border resize-none max-h-32 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
              } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
              rows={1}
              style={{ minHeight: '48px' }}
            />
            
            {/* Input Buttons */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {/* Emoji Button */}
              <button
                onClick={() => setShowEmojiPanel(!showEmojiPanel)}
                className={`p-1.5 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-400'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* GIF Button */}
              <button
                onClick={() => setShowGifPanel(!showGifPanel)}
                className={`p-1.5 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-400'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <Gift className="w-4 h-4" />
              </button>

              {/* Sticker Button */}
              <button
                onClick={() => setShowStickerPanel(!showStickerPanel)}
                className={`p-1.5 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-400'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Send/Voice Button */}
          <div>
            {inputText.trim() || selectedMedia.length > 0 || selectedFiles.length > 0 ? (
              <button
                onClick={handleSendMessage}
                className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleVoiceRecord}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Emoji Panel */}
        <AnimatePresence>
          {showEmojiPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-3 p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex space-x-2">
                  {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedEmojiCategory(key)}
                      className={`p-2 rounded transition-colors ${
                        selectedEmojiCategory === key
                          ? 'bg-red-500 text-white'
                          : theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">{category.icon}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowEmojiPanel(false)}
                  className={`p-1 rounded ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                {EMOJI_CATEGORIES[selectedEmojiCategory]?.emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GIF Panel */}
        <AnimatePresence>
          {showGifPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-3 p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 mr-3">
                  <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={gifSearchQuery}
                    onChange={(e) => setGifSearchQuery(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                  />
                </div>
                <button
                  onClick={() => setShowGifPanel(false)}
                  className={`p-1 rounded ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex space-x-2 mb-3">
                {GIF_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedGifCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedGifCategory === category
                        ? 'bg-red-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {gifResults.filter(gif => !gifSearchQuery || gif.title.toLowerCase().includes(gifSearchQuery.toLowerCase()) || gif.category === selectedGifCategory).map(gif => (
                  <button
                    key={gif.id}
                    onClick={() => handleGifSend(gif)}
                    className="aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform"
                  >
                    <img
                      src={gif.url}
                      alt={gif.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticker Panel */}
        <AnimatePresence>
          {showStickerPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-3 p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex space-x-2">
                  {Object.keys(STICKER_CATEGORIES).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedStickerCategory(category)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors capitalize ${
                        selectedStickerCategory === category
                          ? 'bg-red-500 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowStickerPanel(false)}
                  className={`p-1 rounded ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {STICKER_CATEGORIES[selectedStickerCategory]?.map(sticker => (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerSend(sticker)}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-3xl mb-1">{sticker.preview}</span>
                    <span className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {sticker.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Incoming Call Notification */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]"
          >
            <div className="flex items-center space-x-3">
              <img
                src={incomingCall.caller?.profilePic || '/default-avatar.png'}
                alt={incomingCall.caller?.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {incomingCall.caller?.username || 'Unknown'}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Incoming {incomingCall.callType} call...
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => handleAnswerCall(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </button>
              <button
                onClick={() => handleAnswerCall(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                {incomingCall.callType === 'video' ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                <span>Accept</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Interface (when active) */}
      <AnimatePresence>
        {isCallActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 z-50 flex flex-col"
          >
            {/* Call Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedChat.avatar || "/default-avatar.png"}
                  alt={selectedChat.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="text-white font-semibold">{selectedChat.name}</h3>
                  <p className="text-gray-300 text-sm">
                    {callType === 'video' ? 'Video call' : 'Voice call'} • {formatDuration(callDuration)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {callRecording && (
                  <div className="flex items-center space-x-2 bg-red-500 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-sm">Recording</span>
                  </div>
                )}
                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`p-2 rounded-full ${
                    isScreenSharing ? 'bg-blue-500' : 'bg-gray-700'
                  } text-white hover:bg-opacity-80`}
                >
                  <Monitor className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative">
              {callType === 'video' ? (
                <div className="relative w-full h-full">
                  {/* Remote Video */}
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <img
                        src={selectedChat.avatar || "/default-avatar.png"}
                        alt={selectedChat.name}
                        className="w-32 h-32 rounded-full mx-auto mb-4"
                      />
                      <p className="text-white text-xl">{selectedChat.name}</p>
                    </div>
                  </div>
                  
                  {/* Local Video (Picture-in-Picture) */}
                  <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <span className="text-white text-sm">You</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <img
                      src={selectedChat.avatar || "/default-avatar.png"}
                      alt={selectedChat.name}
                      className="w-48 h-48 rounded-full mx-auto mb-6"
                    />
                    <h2 className="text-white text-3xl font-light mb-2">{selectedChat.name}</h2>
                    <p className="text-gray-300">Voice call • {formatDuration(callDuration)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Call Controls */}
            <div className="p-6 flex items-center justify-center space-x-6">
              {/* Mute */}
              <button
                onClick={() => setIsCallMuted(!isCallMuted)}
                className={`p-4 rounded-full ${
                  isCallMuted ? 'bg-red-500' : 'bg-gray-700'
                } text-white hover:bg-opacity-80 transition-colors`}
              >
                {isCallMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Video Toggle (for video calls) */}
              {callType === 'video' && (
                <button
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`p-4 rounded-full ${
                    !isVideoEnabled ? 'bg-red-500' : 'bg-gray-700'
                  } text-white hover:bg-opacity-80 transition-colors`}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
              )}

              {/* End Call */}
              <button
                onClick={onEndCall}
                className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Phone className="w-6 h-6 transform rotate-225" />
              </button>

              {/* Add Participant */}
              <button
                onClick={() => {/* Implement add participant */}}
                className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                <UserPlus className="w-6 h-6" />
              </button>

              {/* Record */}
              <button
                onClick={() => setCallRecording(!callRecording)}
                className={`p-4 rounded-full ${
                  callRecording ? 'bg-red-500' : 'bg-gray-700'
                } text-white hover:bg-opacity-80 transition-colors`}
              >
                <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${
                    callRecording ? 'bg-white' : 'bg-transparent'
                  }`} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({
  message,
  isOwn,
  onReaction,
  onAction,
  theme,
  quickReactions,
  showReactionPicker,
  setShowReactionPicker,
  playingVoiceId,
  setPlayingVoiceId,
  formatTime,
  formatDuration,
  showTranslation,
  translationLanguage
}) => {
  const [showActions, setShowActions] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  
  const handleDoubleClick = () => {
    if (!isOwn) {
      onReaction('❤️');
    }
  };

  const handleVoicePlay = () => {
    if (playingVoiceId === message.id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(message.id);
      // Simulate voice playback progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 1;
        setVoiceProgress(progress);
        if (progress >= message.voiceData.duration) {
          clearInterval(interval);
          setPlayingVoiceId(null);
          setVoiceProgress(0);
        }
      }, 1000);
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div>
            {message.replyTo && (
              <div className={`mb-2 p-2 rounded border-l-2 border-gray-400 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-xs text-gray-500 mb-1">{message.replyTo.senderName}</div>
                <div className="text-sm opacity-75">{message.replyTo.content}</div>
              </div>
            )}
            <p className="text-sm leading-relaxed">{message.content}</p>
            {showTranslation && (
              <div className={`mt-2 p-2 rounded text-sm ${
                theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'
              } border-l-2 border-blue-400`}>
                <div className="flex items-center space-x-1 mb-1">
                  <Languages className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-500">Translated to {translationLanguage}</span>
                </div>
                <p>नमस्ते! आज आप कैसे हैं?</p>
              </div>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex items-center space-x-3 min-w-[200px]">
            <button
              onClick={handleVoicePlay}
              className={`p-2 rounded-full transition-colors ${
                isOwn
                  ? 'bg-white/20 hover:bg-white/30'
                  : theme === 'dark'
                  ? 'bg-gray-600 hover:bg-gray-500'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {playingVoiceId === message.id ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            
            {/* Waveform */}
            <div className="flex-1 flex items-center space-x-1 h-8">
              {message.voiceData.waveform.map((amplitude, index) => (
                <div
                  key={index}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    playingVoiceId === message.id && index <= voiceProgress
                      ? isOwn ? 'bg-white' : 'bg-red-500'
                      : isOwn
                      ? 'bg-white/50'
                      : theme === 'dark'
                      ? 'bg-gray-400'
                      : 'bg-gray-400'
                  }`}
                  style={{ height: `${Math.max(amplitude * 24, 4)}px` }}
                />
              ))}
            </div>
            
            <span className="text-xs opacity-75">
              {formatDuration(message.voiceData.duration)}
            </span>
          </div>
        );

      case 'media':
        return (
          <div>
            {message.media.type === 'image' ? (
              <div className="relative">
                <img
                  src={message.media.url}
                  alt={message.media.caption || 'Image'}
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                />
                {message.media.viewOnce && (
                  <div className="absolute top-2 left-2 bg-black/50 rounded-full p-1">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                )}
                {message.media.quality === 'hd' && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    HD
                  </div>
                )}
              </div>
            ) : (
              <div className="relative max-w-xs">
                <video
                  src={message.media.url}
                  className="w-full rounded-lg"
                  controls
                />
                {message.media.viewOnce && (
                  <div className="absolute top-2 left-2 bg-black/50 rounded-full p-1">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}
            {message.media.caption && (
              <p className="mt-2 text-sm">{message.media.caption}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div>
            {message.files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  isOwn
                    ? 'bg-white/10'
                    : theme === 'dark'
                    ? 'bg-gray-700'
                    : 'bg-gray-100'
                }`}
              >
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{file.name}</div>
                  <div className="text-xs opacity-75">{file.size}</div>
                </div>
                <button className={`p-1 rounded ${
                  isOwn
                    ? 'hover:bg-white/20'
                    : theme === 'dark'
                    ? 'hover:bg-gray-600'
                    : 'hover:bg-gray-200'
                }`}>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        );

      case 'sticker':
        return (
          <div className="text-6xl">
            {message.sticker.preview}
          </div>
        );

      case 'gif':
        return (
          <img
            src={message.gif.url}
            alt={message.gif.title}
            className="max-w-xs rounded-lg"
          />
        );

      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onDoubleClick={handleDoubleClick}
    >
      <div className={`max-w-xs lg:max-w-md relative ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Sender Info */}
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <img
              src={message.senderAvatar || "/default-avatar.png"}
              alt={message.senderName}
              className="w-6 h-6 rounded-full"
            />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {message.senderName}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white ml-auto rounded-br-md'
              : theme === 'dark'
              ? 'bg-gray-800 text-white rounded-bl-md'
              : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-200'
          } ${message.isPinned ? 'ring-2 ring-yellow-500' : ''}`}
        >
          {/* Pinned Indicator */}
          {message.isPinned && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <Pin className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Secret Message Indicator */}
          {message.secretMessage && (
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}

          {renderMessageContent()}

          {/* Message Status */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-2">
              <span className={`text-xs opacity-75`}>
                {formatTime(message.timestamp)}
              </span>
              {message.isEdited && (
                <span className="text-xs opacity-60">edited</span>
              )}
            </div>
            
            {isOwn && (
              <div className="flex items-center space-x-1">
                {message.status === 'sending' && (
                  <Clock className="w-3 h-3 opacity-60" />
                )}
                {message.status === 'sent' && (
                  <Check className="w-3 h-3 opacity-60" />
                )}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3 h-3 opacity-60" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                )}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => onReaction(reaction.emoji)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="font-medium">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`flex items-center mt-1 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}>
          {/* Quick Reactions */}
          <div className="flex items-center space-x-1">
            {quickReactions.slice(0, 3).map(emoji => (
              <button
                key={emoji}
                onClick={() => onReaction(emoji)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110 ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-white hover:bg-gray-50 shadow-sm border'
                }`}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-white hover:bg-gray-50 shadow-sm border'
              }`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* More Actions */}
          <button
            onClick={() => setShowActions(!showActions)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-white hover:bg-gray-50 shadow-sm border'
            }`}
          >
            <MoreVertical className="w-3 h-3" />
          </button>

          {/* Actions Menu */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-10 w-48 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } rounded-lg shadow-xl border ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                } z-50`}
              >
                <div className="p-2">
                  <button
                    onClick={() => {
                      onAction('reply', message.id);
                      setShowActions(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onAction('forward', message.id);
                      setShowActions(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Forward className="w-4 h-4" />
                      <span>Forward</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onAction('copy', message.id);
                      setShowActions(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onAction('pin', message.id);
                      setShowActions(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Pin className="w-4 h-4" />
                      <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                    </div>
                  </button>
                  {!isOwn && (
                    <button
                      onClick={() => {
                        onAction('translate', message.id);
                        setShowActions(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Languages className="w-4 h-4" />
                        <span>Translate</span>
                      </div>
                    </button>
                  )}
                  {isOwn && (
                    <>
                      <button
                        onClick={() => {
                          onAction('edit', message.id);
                          setShowActions(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          onAction('delete', message.id);
                          setShowActions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <div className="flex items-center space-x-2">
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-12 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } rounded-lg shadow-xl border ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              } z-50 p-2`}
            >
              <div className="flex items-center space-x-2">
                {quickReactions.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ComprehensiveChatInterface;
