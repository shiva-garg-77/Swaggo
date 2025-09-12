'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useAuth } from '../../../Components/Helper/AuthProvider';
import { useSocket } from '../../../Components/Helper/SocketProvider';
import { useTheme } from '../../../Components/Helper/ThemeProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { GET_CHATS, CREATE_CHAT, GET_CHAT_BY_PARTICIPANTS } from '../../../Components/Chat/queries';
import ChatSidebar from '../../../Components/Chat/ChatSidebar';
import ChatList from '../../../Components/Chat/ChatList';
import MessageArea from '../../../Components/Chat/MessageArea';
import ComprehensiveChatInterface from '../../../Components/Chat/ComprehensiveChatInterface';
import notificationService from '../../../Components/Helper/NotificationService';

function MessagePageContent() {
  const { user, loading: authLoading } = useAuth();
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

  // Check if we should open a specific chat (from profile navigation)
  const targetUserId = searchParams.get('userId');
  const targetUsername = searchParams.get('user');
  
  // Debug log
    console.log('💬 Message Page Loaded:', {
      targetUserId,
      targetUsername,
      userProfileId: user?.profileid,
      isConnected,
      chatsCount: chats ? chats.length : 0
    });

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

  // Create new chat function
  const createNewChat = async () => {
    if (!user?.profileid || !targetUserId) {
      console.log('⚠️ Cannot create chat - missing user data:', { userId: user?.profileid, targetUserId });
      return;
    }
    
    console.log('🔄 Creating new chat between:', user.profileid, 'and', targetUserId);
    
    try {
      await createChatMutation({
        variables: {
          participants: [user.profileid, targetUserId],
          chatType: 'direct',
          chatName: null,
          chatAvatar: null
        }
      });
    } catch (error) {
      console.error('❌ Failed to create chat:', error);
    }
  };

  // Fetch user's chats
  const { data: chatsData, loading: chatsLoading, refetch } = useQuery(GET_CHATS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    onCompleted: (data) => {
      const chatsList = data.getChats || [];
      setChats(chatsList);
    },
    onError: (error) => {
      console.error('Error fetching chats:', error);
    }
  });

  // Handle target user ID from URL params
  useEffect(() => {
    if (targetUserId && user?.profileid && chats && chats.length > 0) {
      console.log('📝 Checking for existing chat with user:', targetUserId);
      
      const existingChat = chats.find(chat => 
        chat.participants && chat.participants.some(p => p.profileid === targetUserId)
      );
      
      if (existingChat) {
        console.log('✅ Found existing chat:', existingChat.chatid);
        setSelectedChat(existingChat);
      } else {
        console.log('🔄 No existing chat found, checking with server...');
        // Check if chat exists using participants query
        checkExistingChat({
          variables: {
            participants: [user.profileid, targetUserId]
          }
        });
      }
    }
  }, [targetUserId, user?.profileid, chats, checkExistingChat]);

  // Initialize notifications
  useEffect(() => {
    if (user && !notificationPermissionRequested) {
      // Request notification permission after a short delay
      setTimeout(async () => {
        const granted = await notificationService.requestPermission();
        setNotificationPermissionRequested(true);
        
        if (granted) {
          console.log('✅ Notification permission granted');
        }
      }, 2000); // 2 second delay to avoid immediate permission request
    }

    // Set up notification click handler
    notificationService.setNotificationClickHandler((chatId) => {
      const chat = chats.find(c => c.chatid === chatId);
      if (chat) {
        handleChatSelect(chat);
      }
    });

    return () => {
      notificationService.destroy();
    };
  }, [user, chats]);

  // Track current chat for notifications
  useEffect(() => {
    if (selectedChat) {
      notificationService.setCurrentChat(selectedChat.chatid);
    }
  }, [selectedChat]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // Join user's personal room
    socket.emit('join_user', user.profileid);

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

    // Handle message notifications
    const handleMessageNotification = (data) => {
      console.log('Message notification:', data);
      // You can show toast notifications here
    };

    // Handle user typing
    const handleUserTyping = (data) => {
      console.log('User typing:', data);
      // Update typing indicators
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_notification', handleMessageNotification);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_notification', handleMessageNotification);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, user]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    
    // Clear unread count for this chat
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1); // Simple decrement, could be more sophisticated
      notificationService.updateBadgeCount(newCount);
      if (newCount === 0) {
        notificationService.clearBadge();
      }
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
  };

  const handleStartCall = (type) => {
    setCallType(type);
    setIsCallActive(true);
    // Implement WebRTC call logic here
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallType(null);
    // Implement call cleanup logic here
  };

  if (authLoading) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Please log in to access messages</h2>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            You need to be authenticated to view your chats.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex overflow-hidden ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    } transition-colors duration-300`}>
      {/* Middle Panel - Chat List */}
      <div className={`w-80 border-r flex flex-col transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          loading={chatsLoading}
          isConnected={isConnected}
          user={user}
        />
      </div>

      {/* Right Panel - Comprehensive Chat Interface */}
      <div className={`flex-1 flex flex-col transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <ComprehensiveChatInterface
          selectedChat={selectedChat}
          user={user}
          socket={socket}
          isConnected={isConnected}
          onStartCall={handleStartCall}
          isCallActive={isCallActive}
          callType={callType}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
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
    <Suspense fallback={<MessagePageFallback />}>
      <MessagePageContent />
    </Suspense>
  );
}
