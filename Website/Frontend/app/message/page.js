'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { useFixedSecureAuth as useSecureAuth } from '../../context/FixedSecureAuthContext.jsx';
import { useSocket } from '../../Components/Helper/PerfectSocketProvider';
import { useTheme } from '../../Components/Helper/ThemeProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { GET_CHATS, CREATE_CHAT, GET_CHAT_BY_PARTICIPANTS } from '../../Components/Chat/queries';
import ChatSidebar from '../../Components/Chat/ChatSidebar';
import ChatList from '../../Components/Chat/ChatList';
import MessageArea from '../../Components/Chat/MessageArea';
import ComprehensiveChatInterface from '../../Components/Chat/ComprehensiveChatInterface';
import NotificationAccessTaker from '../../Components/Chat/NotificationAccessTaker';
import KeyboardShortcutIntegration from '../../Components/Chat/KeyboardShortcutIntegration';
import VoiceCommandIntegration from '../../Components/Chat/VoiceCommandIntegration';
import notificationService from '../../services/UnifiedNotificationService.js';
import webRTCService from '../../services/WebRTCService';
import ErrorBoundary from '../../Components/Common/ErrorBoundary';
import ProtectedRoute from '../../Components/Helper/ProtectedRoute';

function MessagePageContent() {
  const { user, isLoading: authLoading } = useSecureAuth();
  const { socket, isConnected } = useSocket();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  // Check if we should open a specific chat (from profile navigation)
  const targetUserId = searchParams.get('userId');
  const targetUsername = searchParams.get('user');
  
  const currentUserId = getUserId(user);
  
  // Enhanced debug log
  console.log('💬 Message Page Loaded:', {
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
    isConnected,
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
      if (data?.getChatByParticipants) {
        console.log('✅ Found existing chat via server query:', data.getChatByParticipants.chatid);
        setSelectedChat(data.getChatByParticipants);
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
      if (data?.CreateChat) {
        setChats(prev => [data.CreateChat, ...prev]);
        setSelectedChat(data.CreateChat);
        console.log('✅ New chat created:', data.CreateChat);
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
      
      console.log('🎆 CHAT CREATE: Starting new chat creation:', {
        currentUserId,
        targetUserId,
        participantKey
      });
      
      try {
        const result = await createChatMutation({
          variables: {
            participants: [currentUserId, targetUserId],
            chatType: 'direct',
            chatName: null,
            chatAvatar: null
          }
        });
        
        if (result?.data?.CreateChat) {
          console.log('✅ CHAT CREATE: Successfully created chat:', result.data.CreateChat.chatid);
          return result.data.CreateChat;
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
  const { data: chatsData, loading: chatsLoading, refetch } = useQuery(GET_CHATS, {
    variables: { profileid: currentUserId },
    skip: !currentUserId,
    onCompleted: (data) => {
      const chatsList = data.getChats || [];
      setChats(chatsList);
    },
    onError: (error) => {
      console.error('Error fetching chats:', error);
    }
  });

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
        
        notificationService.showNotification({
          title: `${sender.username || 'Unknown'}`,
          body: data.message.content,
          icon: sender.profilePic || '/default-avatar.png',
          tag: `message-${data.message.messageid}`,
          data: {
            chatId: data.chat.chatid,
            messageId: data.message.messageid,
            action: 'chat'
          }
        });
      }
      
      // Update chat list with new message
      if (chats) {
        const updatedChats = chats.map(chat => {
          if (chat.chatid === data.chat.chatid) {
            return {
              ...chat,
              lastMessage: data.message.content,
              lastMessageAt: data.message.createdAt,
              unreadCount: chat.unreadCount + (data.message.senderid !== user.profileid ? 1 : 0)
            };
          }
          return chat;
        }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        
        setChats(updatedChats);
      }
      
      // Update selected chat if it's the current chat
      if (selectedChat && selectedChat.chatid === data.chat.chatid) {
        setSelectedChat(prev => ({
          ...prev,
          messages: [...(prev.messages || []), data.message]
        }));
      }
    };

    // Handle message delivered
    const handleMessageDelivered = (data) => {
      console.log('Message delivered:', data);
      
      // Update selected chat messages
      if (selectedChat && selectedChat.chatid === data.chatid) {
        setSelectedChat(prev => ({
          ...prev,
          messages: prev.messages?.map(msg => 
            msg.messageid === data.messageid 
              ? { ...msg, messageStatus: 'delivered', deliveredTo: data.deliveredTo }
              : msg
          ) || []
        }));
      }
    };

    // Handle message read
    const handleMessageRead = (data) => {
      console.log('Message read:', data);
      
      // Update selected chat messages
      if (selectedChat && selectedChat.chatid === data.chatid) {
        setSelectedChat(prev => ({
          ...prev,
          messages: prev.messages?.map(msg => {
            if (msg.messageid === data.messageid) {
              const updatedReadBy = [...(msg.readBy || []), data.readBy];
              return { 
                ...msg, 
                readBy: updatedReadBy,
                messageStatus: updatedReadBy.length > 0 ? 'read' : msg.messageStatus
              };
            }
            return msg;
          }) || []
        }));
      }
    };

    // Handle user typing
    const handleUserTyping = (data) => {
      console.log('User typing:', data);
      
      // Update typing indicators in chat list
      if (chats) {
        const updatedChats = chats.map(chat => {
          if (chat.chatid === data.chatid) {
            const typingUsers = chat.typingUsers || [];
            const userIndex = typingUsers.findIndex(u => u.profileid === data.profileid);
            
            if (data.isTyping) {
              // Add user to typing list if not already there
              if (userIndex === -1) {
                const typingUser = {
                  profileid: data.profileid,
                  username: data.username,
                  startedAt: Date.now()
                };
                return {
                  ...chat,
                  typingUsers: [...typingUsers, typingUser]
                };
              }
            } else {
              // Remove user from typing list
              if (userIndex !== -1) {
                const newTypingUsers = [...typingUsers];
                newTypingUsers.splice(userIndex, 1);
                return {
                  ...chat,
                  typingUsers: newTypingUsers
                };
              }
            }
          }
          return chat;
        });
        
        setChats(updatedChats);
      }
    };

    // Handle user joined chat
    const handleUserJoinedChat = (data) => {
      console.log('User joined chat:', data);
      
      // Update chat participants
      if (selectedChat && selectedChat.chatid === data.chatid) {
        setSelectedChat(prev => {
          const participants = prev.participants || [];
          const userExists = participants.some(p => p.profileid === data.profileid);
          
          if (!userExists) {
            return {
              ...prev,
              participants: [...participants, {
                profileid: data.profileid,
                username: data.username,
                isOnline: true,
                joinedAt: new Date().toISOString()
              }]
            };
          }
          return prev;
        });
      }
    };

    // Handle user left chat
    const handleUserLeftChat = (data) => {
      console.log('User left chat:', data);
      
      // Update chat participants
      if (selectedChat && selectedChat.chatid === data.chatid) {
        setSelectedChat(prev => ({
          ...prev,
          participants: prev.participants?.filter(p => p.profileid !== data.profileid) || []
        }));
      }
    };

    // Handle call incoming
    const handleCallIncoming = (data) => {
      console.log('Incoming call:', data);
      
      // Show notification for incoming call
      notificationService.showCallNotification({
        title: `Incoming ${data.callType} call`,
        body: `From ${data.callerUsername}`,
        icon: '/call-icon.png',
        tag: `call-${data.callId}`,
        data: {
          chatId: data.chatid,
          callId: data.callId,
          callType: data.callType,
          callerId: data.callerId,
          callerUsername: data.callerUsername
        }
      });
      
      setIncomingCall(data);
    };

    // Handle call accepted
    const handleCallAccepted = (data) => {
      console.log('Call accepted:', data);
      
      setIsCallActive(true);
      setCallType(data.callType);
      setIncomingCall(null);
      
      // Start WebRTC connection
      webRTCService.startCall(data.callId, data.offer, data.callerId);
    };

    // Handle call rejected
    const handleCallRejected = (data) => {
      console.log('Call rejected:', data);
      
      setIncomingCall(null);
      
      // Show notification
      notificationService.showNotification({
        title: 'Call Rejected',
        body: `${data.callerUsername} rejected your call`,
        icon: '/call-rejected.png'
      });
    };

    // Handle call ended
    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      
      setIsCallActive(false);
      setCallType(null);
      setIncomingCall(null);
      setCallParticipants([]);
      
      // Stop WebRTC connection
      webRTCService.endCall();
    };

    // Handle ICE candidate
    const handleIceCandidate = (data) => {
      console.log('ICE candidate received:', data);
      webRTCService.addIceCandidate(data.candidate);
    };

    // Handle WebRTC offer
    const handleWebrtcOffer = (data) => {
      console.log('WebRTC offer received:', data);
      webRTCService.handleOffer(data.offer, data.callerId);
    };

    // Handle WebRTC answer
    const handleWebrtcAnswer = (data) => {
      console.log('WebRTC answer received:', data);
      webRTCService.handleAnswer(data.answer);
    };

    // Register socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_joined_chat', handleUserJoinedChat);
    socket.on('user_left_chat', handleUserLeftChat);
    socket.on('call_incoming', handleCallIncoming);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('webrtc_offer', handleWebrtcOffer);
    socket.on('webrtc_answer', handleWebrtcAnswer);

    // Cleanup function
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_joined_chat', handleUserJoinedChat);
      socket.off('user_left_chat', handleUserLeftChat);
      socket.off('call_incoming', handleCallIncoming);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('webrtc_offer', handleWebrtcOffer);
      socket.off('webrtc_answer', handleWebrtcAnswer);
      
      // Clean up WebRTC
      webRTCService.destroy();
    };
  }, [socket, user, isConnected, selectedChat, chats]);

  // Handle chat selection
  const handleChatSelect = (chat) => {
    console.log('Selecting chat:', chat.chatid);
    setSelectedChat(chat);
    
    // Mark chat as read
    if (socket && chat.unreadCount > 0) {
      socket.emit('mark_chat_read', { chatid: chat.chatid });
      
      // Update local unread count
      setChats(prev => prev.map(c => 
        c.chatid === chat.chatid ? { ...c, unreadCount: 0 } : c
      ));
    }
    
    // Update URL without page reload
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('chat', chat.chatid);
    window.history.pushState({}, '', newUrl);
  };

  // Handle start call
  const handleStartCall = (type) => {
    if (!selectedChat) return;
    
    console.log('Starting call:', { type, chat: selectedChat });
    
    setIsCallActive(true);
    setCallType(type);
    
    // Emit call initiation
    socket.emit('initiate_call', {
      targetUserId: selectedChat.participants.find(p => p.profileid !== currentUserId)?.profileid,
      callType: type
    });
  };

  // Handle answer call
  const handleAnswerCall = (callData, accept = true) => {
    console.log('Answering call:', { callData, accept });
    
    if (accept) {
      socket.emit('accept_call', {
        callId: callData.callId,
        answer: null // Will be filled by WebRTC service
      });
    } else {
      socket.emit('reject_call', {
        callId: callData.callId
      });
      setIncomingCall(null);
    }
  };

  // Handle end call
  const handleEndCall = () => {
    console.log('Ending call');
    
    if (isCallActive) {
      socket.emit('end_call', {
        callId: webRTCService.getCurrentCallId()
      });
    }
    
    setIsCallActive(false);
    setCallType(null);
    setIncomingCall(null);
    setCallParticipants([]);
    
    // Stop WebRTC connection
    webRTCService.endCall();
  };

  // Handle toggle mute
  const handleToggleMute = () => {
    setIsCallMuted(!isCallMuted);
    webRTCService.toggleMute(!isCallMuted);
  };

  // Handle toggle video
  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    webRTCService.toggleVideo(!isVideoEnabled);
  };

  // Get user ID with multiple fallbacks
  function getUserId(user) {
    if (!user) return null;
    return user.profileid || user.id || user.userId || user._id;
  }

  // Loading state
  if (authLoading || !user) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className={`mt-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationAccessTaker>
      <ErrorBoundary>
        <div className={`h-screen flex transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}>
          {/* Desktop Layout */}
          <div className="hidden md:flex w-full h-full">
            {/* Chat Sidebar */}
            <div className={`w-80 border-r transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <ChatSidebar 
                chats={chats}
                selectedChat={selectedChat}
                onChatSelect={handleChatSelect}
                currentUserId={currentUserId}
                unreadCount={unreadCount}
                theme={theme}
              />
            </div>
            
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full">
              {selectedChat ? (
                <ComprehensiveChatInterface
                  chat={selectedChat}
                  currentUser={user}
                  socket={socket}
                  theme={theme}
                  onBack={() => setSelectedChat(null)}
                  onStartCall={handleStartCall}
                  isCallActive={isCallActive}
                  callType={callType}
                  incomingCall={incomingCall}
                  onAnswerCall={handleAnswerCall}
                  onEndCall={handleEndCall}
                  isCallMuted={isCallMuted}
                  isVideoEnabled={isVideoEnabled}
                  onToggleMute={handleToggleMute}
                  onToggleVideo={handleToggleVideo}
                  localVideoRef={localVideoRef}
                  remoteVideoRef={remoteVideoRef}
                  setLocalVideoRef={setLocalVideoRef}
                  setRemoteVideoRef={setRemoteVideoRef}
                />
              ) : (
                <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Select a chat</h3>
                    <p className={`${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Layout */}
          <div className="md:hidden w-full h-full">
            {selectedChat ? (
              <ComprehensiveChatInterface
                chat={selectedChat}
                currentUser={user}
                socket={socket}
                theme={theme}
                onBack={() => setSelectedChat(null)}
                onStartCall={handleStartCall}
                isCallActive={isCallActive}
                callType={callType}
                incomingCall={incomingCall}
                onAnswerCall={handleAnswerCall}
                onEndCall={handleEndCall}
                isCallMuted={isCallMuted}
                isVideoEnabled={isVideoEnabled}
                onToggleMute={handleToggleMute}
                onToggleVideo={handleToggleVideo}
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
                setLocalVideoRef={setLocalVideoRef}
                setRemoteVideoRef={setRemoteVideoRef}
              />
            ) : (
              <div className={`h-full transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
                <ChatList 
                  chats={chats}
                  selectedChat={selectedChat}
                  onChatSelect={handleChatSelect}
                  currentUserId={currentUserId}
                  unreadCount={unreadCount}
                  theme={theme}
                  onCreateNewChat={createNewChat}
                />
              </div>
            )}
          </div>
          
          {/* Keyboard Shortcuts Integration */}
          <KeyboardShortcutIntegration />
          
          {/* Voice Command Integration */}
          <VoiceCommandIntegration />
        </div>
      </ErrorBoundary>
    </NotificationAccessTaker>
  );
}

function MessagePageFallback() {
  const { theme } = useTheme();
  
  return (
    <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        <p className={`mt-2 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>Loading messages...</p>
      </div>
    </div>
  );
}

export default function MessagePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<MessagePageFallback />}>
        <MessagePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}