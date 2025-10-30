'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { useFixedSecureAuth as useSecureAuth } from '../../../context/FixedSecureAuthContext.jsx';
import { useSocket } from '../../Helper/PerfectSocketProvider.jsx';
import { useTheme } from '../../Helper/ThemeProvider';
import { useRouter } from 'next/navigation';
import { GET_CHATS, CREATE_CHAT, GET_CHAT_BY_PARTICIPANTS } from '../../Chat/Messaging/queries';
import ChatSidebar from '../../Chat/UI/ChatSidebar';
import ChatList from '../../Chat/UI/ChatList';
import MessageArea from '../../Chat/UI/MessageArea';
import ComprehensiveChatInterface from '../../Chat/UI/ComprehensiveChatInterface';
import NotificationAccessTaker from '../../Chat/NotificationAccessTaker';
import KeyboardShortcutIntegration from '../../Chat/KeyboardShortcutIntegration';
import VoiceCommandIntegration from '../../Chat/VoiceCommandIntegration';
import notificationService from '../../../services/UnifiedNotificationService.js';
import webRTCService from '../../../services/WebRTCService';
import ErrorBoundary from '../../ErrorBoundary/index.js';

function MessagePageContent() {
  console.log('🚀 MessagePageContent: COMPONENT LOADING STARTED');

  const { user, isLoading: authLoading } = useSecureAuth();
  console.log('👤 MessagePageContent: Auth hook result:', { user, authLoading, hasUser: !!user });

  const { socket, isConnected } = useSocket();
  console.log('🔌 MessagePageContent: Socket hook result:', {
    socket: !!socket,
    isConnected,
    socketId: socket?.id,
    socketConnected: socket?.connected,
    socketDisconnected: socket?.disconnected,
    socketUrl: socket?.io?.uri
  });

  const { theme } = useTheme();
  const router = useRouter();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermissionRequested, setNotificationPermissionRequested] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null); // 'voice' or 'video'
  const [incomingCall, setIncomingCall] = useState(null);
  const [callParticipants, setCallParticipants] = useState([]);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localVideoRef, setLocalVideoRef] = useState(null);
  const [remoteVideoRef, setRemoteVideoRef] = useState(null);
  const [callHistory, setCallHistory] = useState([]);

  // Check if we should open a specific chat (from profile navigation)
  // Completely avoid useSearchParams to prevent the read-only error
  const [targetUserId, setTargetUserId] = useState(null);
  const [targetUsername, setTargetUsername] = useState(null);

  // Extract search params using a defensive approach with try-catch
  useEffect(() => {
    try {
      // Use a more defensive approach to extract search params
      if (typeof window !== 'undefined' && window.location) {
        // Parse the search string manually to avoid any issues with useSearchParams
        const searchString = window.location.search;
        console.log('🔍 URL Search String:', searchString);

        if (searchString) {
          // Remove the leading '?' and split by '&'
          const params = searchString.substring(1).split('&');
          const paramMap = {};

          params.forEach(param => {
            const [key, value] = param.split('=');
            if (key && value !== undefined) {
              paramMap[decodeURIComponent(key)] = decodeURIComponent(value);
            }
          });

          console.log('🔍 Parsed URL Params:', paramMap);

          if (paramMap.userId) {
            console.log('✅ Setting targetUserId:', paramMap.userId);

            // CRITICAL: Check if target is same as current user
            const currentUserId = user?.profileid || user?.id;
            if (currentUserId && paramMap.userId === currentUserId) {
              console.error('❌ URL ERROR: Target user is same as current user!');
              console.error('Current:', currentUserId);
              console.error('Target:', paramMap.userId);
              alert('Error: Cannot message yourself');
              return;
            }

            setTargetUserId(paramMap.userId);
          }
          if (paramMap.user) {
            console.log('✅ Setting targetUsername:', paramMap.user);
            setTargetUsername(paramMap.user);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error extracting search params:', error);
    }
  }, []);

  // Utility function to extract user ID from user object
  const getUserId = (userObj) => {
    return userObj?.profileid || userObj?.id || userObj?.userId || null;
  };

  const currentUserId = getUserId(user);

  // Enhanced debug log with socket details
  console.log('💬 MessagePageContent: DETAILED STATE SNAPSHOT:', {
    targetUserId,
    targetUsername,
    user: user ? {
      hasUser: !!user,
      profileid: user.profileid,
      id: user.id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      allProperties: Object.keys(user)
    } : 'No user object',
    currentUserId,
    socket: {
      exists: !!socket,
      isConnected,
      socketId: socket?.id,
      connected: socket?.connected,
      disconnected: socket?.disconnected,
      io: socket?.io ? {
        uri: socket.io.uri,
        readyState: socket.io.readyState,
        engine: {
          transport: socket.io.engine?.transport?.name,
          readyState: socket.io.engine?.readyState
        }
      } : 'No io object'
    },
    chatsCount: chats ? chats.length : 0,
    authLoading
  });

  // User object for message functionality
  if (typeof window !== 'undefined') {
    window.debugAuth = {
      user,
      currentUserId,
      isAuthenticated: !!user,
      getUserId,
      authLoading
    };
  }

  // Lazy query to check for existing chat
  const [checkExistingChat] = useLazyQuery(GET_CHAT_BY_PARTICIPANTS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('🔍 Query result for existing chat:', data);
      if (data?.chatByParticipants) {
        console.log('✅ Found existing chat via server query:', data.chatByParticipants.chatid);
        setSelectedChat(data.chatByParticipants);
      } else if (targetUserId) {
        console.log('🆕 No existing chat found via server query, creating new one');
        // No existing chat found, create new one
        createNewChat();
      }
    },
    onError: (error) => {
      console.error('❌ Error checking existing chat:', error);
      console.error('Error details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
      if (targetUserId) {
        console.log('🚑 Attempting to create new chat due to error');
        createNewChat();
      }
    }
  });

  // Mutation to create new chat
  const [createChatMutation] = useMutation(CREATE_CHAT, {
    onCompleted: (data) => {
      if (data?.createChat) {
        setChats(prev => [data.createChat, ...prev]);
        setSelectedChat(data.createChat);
        console.log('✅ New chat created:', data.createChat);
      }
    },
    onError: (error) => {
      console.error('❌ Error creating chat:', error);
    }
  });

  // 🔄 CRITICAL FIX: Race-condition-free chat creation with comprehensive locking
  const createNewChat = (() => {
    let creationInProgress = false;
    let lastCreationAttempt = 0;
    const MIN_CREATION_INTERVAL = 2000; // Minimum 2 seconds between creation attempts
    const pendingCreations = new Set(); // Track pending creation keys

    return async () => {
      if (!currentUserId || !targetUserId) {
        console.warn('⚠️ CHAT CREATE: Missing user data:', { currentUserId, targetUserId });
        return null;
      }

      // 🔄 CRITICAL FIX: Create unique key for this participant pair
      const participantKey = [currentUserId, targetUserId].sort().join('-');

      // 🔄 CRITICAL FIX: Prevent multiple creation attempts for same participants
      if (pendingCreations.has(participantKey)) {
        console.warn('⚠️ CHAT CREATE: Creation already in progress for participants:', participantKey);
        return null;
      }

      // 🔄 CRITICAL FIX: Rate limit creation attempts globally
      const now = Date.now();
      if (creationInProgress || (now - lastCreationAttempt < MIN_CREATION_INTERVAL)) {
        console.warn('⚠️ CHAT CREATE: Rate limited - too soon since last attempt');
        return null;
      }

      // 🔄 CRITICAL FIX: Double-check if chat already exists in current state
      const existingChat = chats?.find(chat => {
        if (!chat.participants || !Array.isArray(chat.participants)) return false;

        const participantIds = chat.participants.map(p => {
          // 🔄 CRITICAL FIX: Standardized ID extraction with multiple fallbacks
          return p?.profileid || p?.id || p?.userId || p?._id;
        }).filter(Boolean);

        return participantIds.includes(currentUserId) && participantIds.includes(targetUserId);
      });

      if (existingChat) {
        console.log('✅ CHAT CREATE: Found existing chat during creation check:', existingChat.chatid);
        setSelectedChat(existingChat);
        return existingChat;
      }

      creationInProgress = true;
      lastCreationAttempt = now;
      pendingCreations.add(participantKey);

      console.log('🎆 CHAT CREATE: Starting new chat creation');
      console.log('📊 Current User:', {
        profileid: user?.profileid,
        id: user?.id,
        username: user?.username,
        extracted: currentUserId
      });
      console.log('📊 Target from URL:', {
        targetUserId,
        targetUsername,
        urlSearch: window.location.search
      });

      // Validate participant IDs before creating chat
      if (!currentUserId || !targetUserId) {
        console.error('❌ CHAT CREATE: Missing required participant IDs');
        console.error('Current User ID:', currentUserId);
        console.error('Target User ID:', targetUserId);
        alert('Cannot create chat: Missing user information');
        return null;
      }

      // CRITICAL: Ensure we're not creating a chat with the same user twice
      if (currentUserId === targetUserId) {
        console.error('❌ CHAT CREATE: DUPLICATE USER DETECTED!');
        console.error('Current User ID:', currentUserId);
        console.error('Target User ID:', targetUserId);
        console.error('URL:', window.location.href);
        alert(`Cannot create a chat with yourself!\n\nCurrent: ${currentUserId}\nTarget: ${targetUserId}`);
        return null;
      }

      try {
        // Only include IDs in participants array, NOT usernames
        const participants = [currentUserId, targetUserId];

        // Final validation
        const uniqueParticipants = new Set(participants);
        if (uniqueParticipants.size !== 2) {
          console.error('❌ CHAT CREATE: Duplicate participants after array creation!');
          console.error('Participants:', participants);
          console.error('Unique:', Array.from(uniqueParticipants));
          alert('Error: Duplicate participants detected');
          return null;
        }

        console.log('✅ CHAT CREATE: Participants validated:', {
          participants,
          unique: Array.from(uniqueParticipants),
          count: uniqueParticipants.size
        });

        const result = await createChatMutation({
          variables: {
            input: {
              participants,
              chatType: 'direct',
              chatName: targetUsername || null,
              chatAvatar: null
            }
          }
        });

        if (result?.data?.createChat) {
          console.log('✅ CHAT CREATE: Successfully created chat:', result.data.createChat.chatid);
          return result.data.createChat;
        } else {
          console.error('❌ CHAT CREATE: No chat data returned from mutation');
          return null;
        }
      } catch (error) {
        console.error('❌ CHAT CREATE: Failed to create chat:', error.message);

        // Handle specific error types
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log('🔄 CHAT CREATE: Chat already exists according to server, refetching...');
          // Refetch chats to get the existing one
          if (refetch) {
            await refetch();
          }
        }

        return null;
      } finally {
        // 🔄 CRITICAL FIX: Always reset creation state
        creationInProgress = false;
        pendingCreations.delete(participantKey);
      }
    };
  })();

  // Fetch user's chats
  const { data: chatsData, loading: chatsLoading, refetch, error: chatsError } = useQuery(GET_CHATS, {
    variables: { profileid: currentUserId },
    skip: !currentUserId,
    fetchPolicy: 'network-only', // Always fetch fresh data
    onError: (error) => {
      console.error('❌ Error fetching chats:', error);
    },
    onCompleted: (data) => {
      console.log('✅ Chats loaded successfully:', data?.getUserChats?.length, 'chats');
    }
  });

  // Debug logging for chat loading
  useEffect(() => {
    console.log('📊 Chat Loading Status:', {
      currentUserId,
      chatsLoading,
      hasChatsData: !!chatsData,
      chatsCount: chatsData?.getUserChats?.length || 0,
      chatsError: chatsError?.message
    });
  }, [currentUserId, chatsLoading, chatsData, chatsError]);

  // ✅ FIX: Move state update to useEffect to avoid updating unmounted component
  useEffect(() => {
    if (chatsData?.getUserChats) {
      const chatsList = chatsData.getUserChats || [];
      setChats(chatsList);
      
      // ✅ BEST PRACTICE: Restore selected chat from URL (primary source of truth)
      const urlParams = new URLSearchParams(window.location.search);
      const chatIdFromUrl = urlParams.get('chatId');
      
      if (chatIdFromUrl && !selectedChat) {
        const chatToRestore = chatsList.find(chat => chat.chatid === chatIdFromUrl);
        if (chatToRestore) {
          console.log('✅ Restoring selected chat from URL:', chatToRestore.chatName);
          setSelectedChat(chatToRestore);
        }
      }
    }
  }, [chatsData]);

  // ✅ BEST PRACTICE: Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const urlParams = new URLSearchParams(window.location.search);
      const chatIdFromUrl = urlParams.get('chatId');
      
      if (chatIdFromUrl && chats.length > 0) {
        const chatToRestore = chats.find(chat => chat.chatid === chatIdFromUrl);
        if (chatToRestore) {
          console.log('✅ Browser navigation: Restoring chat from URL:', chatToRestore.chatName);
          setSelectedChat(chatToRestore);
        }
      } else {
        // No chatId in URL, clear selection
        setSelectedChat(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [chats]);

  // 🔄 CRITICAL FIX: Handle target user ID from URL params with standardized participant matching
  useEffect(() => {
    if (targetUserId && currentUserId && chats && chats.length > 0) {
      console.log('📝 CHAT SEARCH: Looking for existing chat with target user:', {
        targetUserId,
        currentUserId,
        totalChats: chats.length
      });

      // 🔄 CRITICAL FIX: Enhanced participant matching with multiple ID fallbacks
      const existingChat = chats.find(chat => {
        if (!chat.participants || !Array.isArray(chat.participants)) {
          console.warn('⚠️ CHAT SEARCH: Chat missing participants array:', chat.chatid);
          return false;
        }

        console.log(`🔍 CHAT SEARCH: Checking chat ${chat.chatid} participants:`,
          chat.participants.map(p => ({
            profileid: p?.profileid,
            id: p?.id,
            userId: p?.userId,
            _id: p?._id,
            username: p?.username
          }))
        );

        // Extract standardized IDs from all participants
        const participantIds = chat.participants.map(p => {
          return p?.profileid || p?.id || p?.userId || p?._id;
        }).filter(Boolean);

        const hasTargetUser = participantIds.includes(targetUserId);
        const hasCurrentUser = participantIds.includes(currentUserId);

        console.log(`🔍 CHAT SEARCH: Chat ${chat.chatid} match check:`, {
          participantIds,
          hasTargetUser,
          hasCurrentUser,
          isMatch: hasTargetUser && hasCurrentUser
        });

        return hasTargetUser && hasCurrentUser;
      });

      if (existingChat) {
        console.log('✅ CHAT SEARCH: Found existing chat:', {
          chatId: existingChat.chatid,
          participantCount: existingChat.participants?.length
        });
        setSelectedChat(existingChat);
      } else {
        console.log('🔄 CHAT SEARCH: No existing chat found locally, checking with server...');
        // Check if chat exists using participants query
        checkExistingChat({
          variables: {
            participants: [currentUserId, targetUserId]
          }
        });
      }
    } else {
      console.log('🔍 CHAT SEARCH: Skipping search - missing requirements:', {
        hasTargetUserId: !!targetUserId,
        hasCurrentUserId: !!currentUserId,
        hasChats: !!(chats && chats.length > 0)
      });
    }
  }, [targetUserId, currentUserId, chats, checkExistingChat]);

  // Initialize notifications and WebRTC
  useEffect(() => {
    if (currentUserId && !notificationPermissionRequested) {
      // Set user ID for notifications
      notificationService.setUserId(currentUserId);

      // Request notification permission after a short delay
      setTimeout(async () => {
        const granted = await notificationService.requestPermission();
        setNotificationPermissionRequested(true);

        if (granted) {
          console.log('✅ Notification permission granted');
        }
      }, 2000); // 2 second delay to avoid immediate permission request
    }

    // Set up notification click handlers
    notificationService.setNotificationClickHandler((chatId, messageId, action) => {
      const chat = chats.find(c => c.chatid === chatId);
      if (chat) {
        handleChatSelect(chat);
      }
    });

    notificationService.setCallClickHandler((chatId, callType, callerId, action) => {
      if (action === 'answer') {
        handleAnswerCall({
          chatid: chatId,
          callType: callType,
          caller: { profileid: callerId }
        }, true);
      } else if (action === 'decline') {
        handleAnswerCall({
          chatid: chatId,
          callType: callType,
          caller: { profileid: callerId }
        }, false);
      }
    });

    notificationService.setCallBackHandler((chatId, callType, callerId) => {
      const chat = chats.find(c => c.chatid === chatId);
      if (chat) {
        handleChatSelect(chat);
        handleStartCall(callType);
      }
    });

    notificationService.setMarkReadHandler((messageId, chatId) => {
      if (socket) {
        socket.emit('mark_message_read', { messageid: messageId, chatid: chatId });
      }
    });

    return () => {
      notificationService.destroy();
    };
  }, [user, chats, socket]);

  // Track current chat for notifications
  useEffect(() => {
    if (selectedChat) {
      notificationService.setCurrentChat(selectedChat.chatid);
    }
  }, [selectedChat]);

  // 🔄 CRITICAL FIX: Socket event handlers and WebRTC setup - only after socket is authenticated
  useEffect(() => {
    if (!socket || !user || !isConnected) {
      console.log('🔍 WebRTC: Waiting for requirements:', {
        hasSocket: !!socket,
        hasUser: !!user,
        isConnected,
        userProfileId: user?.profileid
      });
      return;
    }

    console.log('🎆 WebRTC: All requirements met, initializing WebRTC and socket events');

    // 🔄 CRITICAL FIX: Setup WebRTC only after socket is connected and authenticated
    try {
      webRTCService.initialize(socket);
      console.log('✅ WebRTC: Service initialized successfully');
    } catch (error) {
      console.error('❌ WebRTC: Failed to initialize service:', error);
    }

    // 🔄 CRITICAL FIX: Use standardized user ID for joining personal room
    const userIdentifier = getUserId(user);
    if (userIdentifier) {
      console.log('📱 SOCKET: Joining personal room for user:', userIdentifier);
      socket.emit('join_user', userIdentifier);
    } else {
      console.error('❌ SOCKET: Cannot join personal room - missing user identifier');
    }

    // Handle new message
    const handleNewMessage = (data) => {
      console.log('New message received:', data);

      // Show notification for messages not from current user
      if (data.message.senderid !== user.profileid) {
        const chat = chats.find(c => c.chatid === data.chat.chatid) || data.chat;
        const sender = data.message.sender || { username: 'Unknown', profileid: data.message.senderid };

        notificationService.showMessageNotification(data.message, chat, sender);

        // Update unread count
        if (!selectedChat || selectedChat.chatid !== data.chat.chatid) {
          setUnreadCount(prev => prev + 1);
          notificationService.updateBadgeCount(unreadCount + 1);
        }
      }

      // Update chats list with new message
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.chatid === data.chat.chatid) {
            return {
              ...chat,
              lastMessage: data.message,
              lastMessageAt: data.chat.lastMessageAt
            };
          }
          return chat;
        });
      });
    };

    // Handle chat joined - Issue #16: Reset unread count when user opens chat
    const handleChatJoined = (data) => {
      console.log('Chat joined:', data);

      // Update chats list to reset unread count
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.chatid === data.chatid) {
            return {
              ...chat,
              unreadCount: 0
            };
          }
          return chat;
        });
      });
    };

    // Handle user status changes - Issue #17: Update status in real-time
    const handleUserStatusChanged = (data) => {
      console.log('User status changed:', data);

      // Update chats list with new user status
      setChats(prevChats => {
        return prevChats.map(chat => {
          // Update participant status in this chat
          const updatedParticipants = chat.participants.map(participant => {
            if (participant.profileid === data.profileid) {
              return {
                ...participant,
                isOnline: data.isOnline,
                lastSeen: data.lastSeen
              };
            }
            return participant;
          });

          return {
            ...chat,
            participants: updatedParticipants
          };
        });
      });
    };

    // Handle message notifications
    const handleMessageNotification = (data) => {
      console.log('Message notification:', data);
    };

    // Handle user typing
    const handleUserTyping = (data) => {
      console.log('User typing:', data);
    };

    // Handle incoming calls
    const handleIncomingCall = async (data) => {
      console.log('📞 Incoming call:', data);
      setIncomingCall(data);

      // Show browser notification with ringtone
      if (notificationService) {
        const callerName = data.caller?.username || 'Unknown';
        const callType = data.callType === 'video' ? 'Video' : 'Voice';

        await notificationService.showCallNotification(
          `${callerName} is calling`,
          {
            body: `${callType} call from ${callerName}`,
            icon: data.caller?.profilePic || '/default-avatar.png',
            tag: `incoming-call-${data.callId}`,
            ringtone: '/ringtones/call-ringtone.mp3', // Add ringtone file
            onClick: () => {
              // Focus the window and potentially answer the call
              window.focus();
            },
            onClose: () => {
              // Stop ringtone when notification is closed
              notificationService.stopRingtone();
            }
          }
        );
      }
    };

    // Handle call response
    const handleCallResponse = (data) => {
      console.log('📞 Call response:', data);
      if (data.accepted) {
        setIsCallActive(true);
        setCallType(data.callType || callType);
      } else {
        // Call was declined
        setIsCallActive(false);
        setCallType(null);
        setIncomingCall(null);
      }
    };

    // Handle call ended
    const handleCallEnded = (data) => {
      console.log('📞 Call ended:', data);
      setIsCallActive(false);
      setCallType(null);
      setIncomingCall(null);

      // We no longer need to manually update callHistory since it's fetched from backend
      // The call will be automatically added to the database and will appear in the next fetch
    };

    // WebRTC event handlers
    const handleWebRTCIncomingCall = (callData) => {
      setIncomingCall(callData);
    };

    const handleWebRTCLocalStream = (stream) => {
      if (localVideoRef?.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    const handleWebRTCRemoteStream = (stream) => {
      if (remoteVideoRef?.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    const handleWebRTCCallConnected = () => {
      console.log('📞 Call connected');
      setIsCallActive(true);
    };

    const handleWebRTCCallEnded = (stats) => {
      console.log('📞 Call ended with stats:', stats);
      setIsCallActive(false);
      setCallType(null);
      setIncomingCall(null);

      // We no longer need to manually update callHistory since it's fetched from backend
      // The call will be automatically added to the database and will appear in the next fetch
    };

    // Socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('chat_joined', handleChatJoined); // Issue #16: Add chat_joined listener
    socket.on('user_status_changed', handleUserStatusChanged); // Issue #17: Add user_status_changed listener
    socket.on('message_notification', handleMessageNotification);
    socket.on('user_typing', handleUserTyping);
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_response', handleCallResponse);
    socket.on('call_ended', handleCallEnded);

    // WebRTC event listeners
    webRTCService.on('incomingCall', handleWebRTCIncomingCall);
    webRTCService.on('localStream', handleWebRTCLocalStream);
    webRTCService.on('remoteStream', handleWebRTCRemoteStream);
    webRTCService.on('callConnected', handleWebRTCCallConnected);
    webRTCService.on('callEnded', handleWebRTCCallEnded);

    return () => {
      // Socket cleanup
      socket.off('new_message', handleNewMessage);
      socket.off('chat_joined', handleChatJoined); // Issue #16: Remove chat_joined listener
      socket.off('user_status_changed', handleUserStatusChanged); // Issue #17: Remove user_status_changed listener
      socket.off('message_notification', handleMessageNotification);
      socket.off('user_typing', handleUserTyping);
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_response', handleCallResponse);
      socket.off('call_ended', handleCallEnded);

      // WebRTC cleanup
      webRTCService.off('incomingCall', handleWebRTCIncomingCall);
      webRTCService.off('localStream', handleWebRTCLocalStream);
      webRTCService.off('remoteStream', handleWebRTCRemoteStream);
      webRTCService.off('callConnected', handleWebRTCCallConnected);
      webRTCService.off('callEnded', handleWebRTCCallEnded);
    };
  }, [socket, user, selectedChat, callType, callParticipants]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);

    // ✅ BEST PRACTICE: Update URL to reflect selected chat (shareable, bookmarkable)
    const newUrl = `/message?chatId=${chat.chatid}`;
    window.history.pushState({ chatId: chat.chatid }, '', newUrl);

    // Clear unread count for this chat
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1); // Simple decrement, could be more sophisticated
      notificationService.updateBadgeCount(newCount);
      return newCount;
    });

    // Join chat room
    if (socket) {
      socket.emit('join_chat', chat.chatid);
    }
  };

  const handleNewChat = (newChat) => {
    setChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    
    // ✅ BEST PRACTICE: Update URL for new chat
    const newUrl = `/message?chatId=${newChat.chatid}`;
    window.history.pushState({ chatId: newChat.chatid }, '', newUrl);
  };

  const handleStartCall = async (type) => {
    console.log('📞 Starting call:', { type, selectedChat: selectedChat?.chatid });

    if (!selectedChat) {
      alert('Please select a chat to start a call');
      return;
    }

    try {
      setCallType(type);
      setIsCallActive(true);

      // Get other participants in the chat
      const otherParticipants = selectedChat.participants?.filter(
        p => p.profileid !== user?.profileid
      ) || [];

      if (otherParticipants.length === 0) {
        alert('No other participants in this chat');
        setIsCallActive(false);
        setCallType(null);
        return;
      }

      const targetUserId = otherParticipants[0].profileid;

      // Initialize WebRTC call
      await webRTCService.initCall(selectedChat.chatid, type, targetUserId);

      console.log('✅ Call initiated successfully');

    } catch (error) {
      console.error('❌ Failed to start call:', error);
      alert('Failed to start call: ' + error.message);
      setIsCallActive(false);
      setCallType(null);
    }
  };

  const handleAnswerCall = async (callData, accept) => {
    console.log('📞 Answering call:', { accept, callData });

    try {
      if (accept) {
        // Answer the call using WebRTC service
        await webRTCService.answerCall(callData, true);
        setIsCallActive(true);
        setCallType(callData.callType);
      } else {
        // Decline the call
        await webRTCService.answerCall(callData, false);

        // We no longer need to manually update callHistory since it's fetched from backend
        // The call will be automatically added to the database and will appear in the next fetch
      }
    } catch (error) {
      console.error('❌ Error answering call:', error);
      alert('Failed to answer call: ' + error.message);
    }
  };

  const handleEndCall = async () => {
    console.log('📞 Ending call');

    try {
      await webRTCService.hangup();
      setIsCallActive(false);
      setCallType(null);
      setIncomingCall(null);
      setIsCallMuted(false);
      setIsVideoEnabled(true);

    } catch (error) {
      console.error('❌ Failed to end call:', error);
    }
  };

  const handleToggleMute = () => {
    const muted = webRTCService.toggleMute();
    setIsCallMuted(muted);
  };

  const handleToggleVideo = () => {
    const enabled = webRTCService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleSwitchCamera = async () => {
    await webRTCService.switchCamera();
  };

  // Handler functions for ChatSidebar
  const handleSelectChat = (chat) => {
    handleChatSelect(chat);
  };

  const handleCreateChat = (newChat) => {
    handleNewChat(newChat);
  };

  const handleSearch = (searchTerm) => {
    // Implement search functionality if needed
    console.log('Search term:', searchTerm);
  };

  if (authLoading) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Please log in to access messages</h2>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            You need to be authenticated to view your chats.
          </p>
        </div>
      </div>
    );
  }

  // Handle notification updates
  const handleNotificationUpdate = ({ type, count, data }) => {
    console.log('📊 Notification update:', { type, count, data });

    // Update unread count based on notification events
    if (type === 'message') {
      setUnreadCount(count);
    } else if (type === 'read' || type === 'bulk_read') {
      setUnreadCount(count);
    } else if (type === 'clear') {
      setUnreadCount(0);
    }
  };

  return (
    <>
      <NotificationAccessTaker
        onNotificationUpdate={handleNotificationUpdate}
        showBadge={true}
        autoRequest={true}
        delayBeforeRequest={3000}
      >
        {(notificationContext) => (
          <div className={`h-screen flex overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            } transition-colors duration-300`}>
            {/* Left Panel - Chat Sidebar with Chat List - Hidden on mobile when chat selected */}
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 lg:w-1/4 xl:w-1/5 min-w-[320px] max-w-[400px] border-r flex-shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              }`}>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  console.error('ChatSidebar Error:', error, errorInfo);
                  if (typeof window !== 'undefined' && window.__SECURITY_MONITOR__) {
                    window.__SECURITY_MONITOR__.reportEvent({
                      type: 'component_error',
                      severity: 'high',
                      component: 'ChatSidebar',
                      error: error.message,
                      stack: error.stack
                    });
                  }
                }}
                showDetails={process.env.NODE_ENV === 'development'}
              >
                <ChatSidebar
                  chats={chats}
                  selectedChat={selectedChat}
                  onChatSelect={handleSelectChat}
                  onCreateChat={handleCreateChat}
                  onSearch={handleSearch}
                  theme={theme}
                  unreadCount={unreadCount}
                  loading={chatsLoading}
                  isConnected={isConnected}
                />
              </ErrorBoundary>
            </div>

            {/* Right Panel - Comprehensive Chat Interface */}
            <div className={`flex-1 flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              }`}>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  console.error('ComprehensiveChatInterface Error:', error, errorInfo);
                  // Log to monitoring service if available
                  if (typeof window !== 'undefined' && window.__SECURITY_MONITOR__) {
                    window.__SECURITY_MONITOR__.reportEvent({
                      type: 'component_error',
                      severity: 'high',
                      component: 'ComprehensiveChatInterface',
                      error: error.message,
                      stack: error.stack
                    });
                  }
                }}
                onRetry={() => {
                  console.log('Retrying ComprehensiveChatInterface');
                  // Optionally reload the component or reset state
                }}
                showDetails={process.env.NODE_ENV === 'development'}
              >
                <ComprehensiveChatInterface
                  selectedChat={selectedChat}
                  user={user}
                  socket={socket}
                  isConnected={isConnected}
                  onStartCall={handleStartCall}
                  isCallActive={isCallActive}
                  callType={callType}
                  onEndCall={handleEndCall}
                  incomingCall={incomingCall}
                  onAnswerCall={handleAnswerCall}
                  callHistory={callHistory}
                  isCallMuted={isCallMuted}
                  isVideoEnabled={isVideoEnabled}
                  onToggleMute={handleToggleMute}
                  onToggleVideo={handleToggleVideo}
                  onSwitchCamera={handleSwitchCamera}
                  localVideoRef={localVideoRef}
                  remoteVideoRef={remoteVideoRef}
                  webRTCService={webRTCService}
                  notificationService={notificationService}
                  notificationContext={notificationContext}
                />
              </ErrorBoundary>
            </div>

            {/* Debug Panel - Only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 right-4 z-50">
                <div className={`p-3 rounded-lg border shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                    <span className="text-xs font-medium">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => notificationService.testNotification()}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Test Notification
                    </button>
                    <button
                      onClick={() => {
                        console.log('🔍 Service Worker Debug Info:');
                        console.log('Registration:', notificationService.registration);
                        console.log('Permission:', notificationService.permission);
                        console.log('Push Manager:', notificationService.registration?.pushManager);
                        if (navigator.serviceWorker) {
                          navigator.serviceWorker.getRegistrations().then(registrations => {
                            console.log('All SW Registrations:', registrations);
                          });
                        }
                      }}
                      className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Debug SW
                    </button>
                    <span className="text-xs text-gray-500">
                      Badge: {notificationService.badgeCount || 0}
                    </span>
                    <span className="text-xs text-gray-500">
                      Unread: {unreadCount}
                    </span>
                    <span className="text-xs text-gray-500">
                      Permission: {notificationContext.permissionStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </NotificationAccessTaker>

      {/* Keyboard Shortcuts Integration - Background component for keyboard shortcuts */}
      <KeyboardShortcutIntegration
        onToggleTheme={() => console.log('Toggle theme shortcut')}
        onShowHelp={() => console.log('Show help shortcut')}
      />

      {/* Voice Command Integration - Background component for voice commands */}
      <VoiceCommandIntegration
        onShowHelp={() => console.log('Voice help command')}
      />
    </>
  );
}

function MessagePageFallback() {
  const { theme } = useTheme();

  return (
    <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Loading messages...</p>
      </div>
    </div>
  );
}

export default MessagePageContent;