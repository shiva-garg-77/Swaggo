'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { SEARCH_USERS, CREATE_CHAT, GET_CHATS } from './queries';
import ConnectionStatus from './ConnectionStatus';
import NotificationSettings from './NotificationSettings';
import { useTheme } from '../Helper/ThemeProvider';

export default function ChatList({ 
  chats, 
  selectedChat, 
  onChatSelect, 
  onNewChat, 
  loading, 
  isConnected,
  user 
}) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  const searchInputRef = useRef(null);

  // Search users for new chat
  const { refetch: refetchUsers, loading: searchLoading, error: searchError } = useQuery(SEARCH_USERS, {
    variables: { query: searchQuery, limit: 10 },
    skip: !searchQuery || searchQuery.length < 2,
    onCompleted: (data) => {
      console.log('✅ User search completed:', data);
      setSearchUsers(data.searchUsers || []);
    },
    onError: (error) => {
      console.error('❌ User search error:', error);
      setSearchUsers([]);
    }
  });

  // Create new chat mutation
  const [createChat, { loading: createChatLoading }] = useMutation(CREATE_CHAT, {
    refetchQueries: user?.profileid ? [
      { query: GET_CHATS, variables: { profileid: user.profileid } }
    ] : [],
    onCompleted: (data) => {
      console.log('✅ Chat created successfully:', data);
      // Handle both naming conventions: CreateChat or createChat
      const chatData = data?.CreateChat || data?.createChat;
      
      if (chatData) {
        console.log('📝 Calling onNewChat with:', chatData);
        onNewChat(chatData);
        setSearchQuery('');
        setShowUserSearch(false);
      } else {
        console.error('❌ CreateChat response missing data:', data);
        console.warn('🔄 Backend returned empty - chat may already exist');
        // Since refetchQueries is set, the chat list will refresh automatically
        alert('Chat created or already exists. Check your chat list!');
        setSearchQuery('');
        setShowUserSearch(false);
      }
    },
    onError: (error) => {
      console.error('❌ Error creating chat:', error);
      const errorMsg = error.message || 'Unknown error';
      
      // Check if it's a "chat already exists" error
      if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('duplicate')) {
        alert('A chat with this user already exists. Please refresh the page.');
      } else {
        alert('Failed to create chat: ' + errorMsg);
      }
    }
  });

  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    console.log('🔍 Search query changed:', query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.length >= 2) {
      setShowUserSearch(true);
      const timeout = setTimeout(() => {
        console.log('🔍 Executing user search for:', query);
        refetchUsers({ query, limit: 10 })
          .then(result => {
            console.log('✅ Search results:', result.data);
            // Manually update search results since onCompleted doesn't fire on refetch
            if (result.data && result.data.searchUsers) {
              console.log('📝 Setting search users:', result.data.searchUsers);
              setSearchUsers(result.data.searchUsers);
            } else {
              console.warn('⚠️ No searchUsers in response:', result.data);
              setSearchUsers([]);
            }
          })
          .catch(err => {
            console.error('❌ Search failed:', err);
            setSearchUsers([]);
          });
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setShowUserSearch(false);
      setSearchUsers([]);
    }
  };

  // Handle user selection for new chat
  const handleUserSelect = async (selectedUser) => {
    console.log('\n=== CHAT CREATION DEBUG START ===');
    console.log('👥 User selected for chat:', selectedUser);
    console.log('🔍 Selected user fields:', {
      profileid: selectedUser?.profileid,
      username: selectedUser?.username,
      name: selectedUser?.name,
      hasProfileid: !!selectedUser?.profileid,
      profileidType: typeof selectedUser?.profileid,
      allKeys: Object.keys(selectedUser || {})
    });
    
    // Check if user is loaded and has profileid
    if (!user || !user.profileid) {
      console.error('❌ Current user data not available:', { user });
      alert('User data not loaded. Please refresh the page.');
      return;
    }
    
    console.log('🔑 Current user data:', {
      profileid: user.profileid,
      username: user?.username,
      hasProfileid: !!user.profileid,
      profileidType: typeof user.profileid
    });
    
    if (!selectedUser || !selectedUser.profileid) {
      console.error('❌ Selected user data invalid:', { selectedUser });
      alert('Selected user data is invalid. Missing profileid.');
      return;
    }
    
    if (selectedUser.profileid === user.profileid) {
      console.warn('⚠️ Cannot create chat with yourself');
      return;
    }

    const participants = [user.profileid, selectedUser.profileid];
    console.log('📦 FINAL PARTICIPANTS ARRAY TO SEND:');
    console.log('  - Type:', typeof participants);
    console.log('  - Length:', participants.length);
    console.log('  - [0] (Current user):', participants[0], '(type:', typeof participants[0], ')');
    console.log('  - [1] (Selected user):', participants[1], '(type:', typeof participants[1], ')');
    console.log('📤 Full mutation variables:', {
      participants,
      chatType: 'direct'
    });
    console.log('🍪 Apollo Client credentials: include');

    try {
      const result = await createChat({
        variables: {
          participants: [user.profileid, selectedUser.profileid],
          chatType: 'direct'
        }
      });
      console.log('✅ createChat result:', result);
      console.log('=== CHAT CREATION DEBUG END ===\n');
    } catch (error) {
      console.error('❌ Failed to create chat:', error);
      console.error('Error details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
      console.log('=== CHAT CREATION DEBUG END ===\n');
      alert('Failed to create chat: ' + error.message);
    }
  };

  // Format last message time
  const formatMessageTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - messageTime) / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return days < 7 ? `${days}d` : new Date(timestamp).toLocaleDateString();
    }
  };

  // Get chat display info
  const getChatDisplayInfo = (chat) => {
    // Check if chat exists first
    if (!chat || !chat.participants) {
      return {
        name: 'Unknown Chat',
        avatar: null,
        isOnline: false
      };
    }
    
    if (chat.chatType === 'group') {
      return {
        name: chat.chatName || 'Group Chat',
        avatar: chat.chatAvatar,
        isOnline: false
      };
    } else {
      // Direct chat - find the other participant
      // Only try to filter by user.profileid if user data is available
      const otherParticipant = user && user.profileid 
        ? chat.participants.find(p => p.profileid !== user.profileid)
        : chat.participants[0]; // Fallback to first participant if user not loaded
      return {
        name: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
        avatar: otherParticipant?.profilePic,
        isOnline: Math.random() > 0.5 // Mock online status - replace with real data
      };
    }
  };

  // Get last message preview
  const getLastMessagePreview = (message) => {
    if (!message) return 'Start a conversation';
    
    switch (message.messageType) {
      case 'text':
        return message.content || 'Message';
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎥 Video';
      case 'file':
        return '📎 File';
      case 'voice':
        return '🎤 Voice message';
      default:
        return 'Message';
    }
  };

  const themeClasses = {
    container: theme === 'dark' 
      ? 'bg-gray-900 border-gray-800 text-white' 
      : 'bg-white border-gray-200 text-gray-900',
    header: theme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-gray-50 border-gray-200',
    searchInput: theme === 'dark' 
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500',
    chatItem: theme === 'dark' 
      ? 'hover:bg-gray-800 border-gray-800' 
      : 'hover:bg-gray-50 border-gray-100',
    selectedChat: theme === 'dark' 
      ? 'bg-gray-800 border-l-red-500 shadow-lg' 
      : 'bg-red-50 border-l-red-500 shadow-md',
    dropdown: theme === 'dark' 
      ? 'bg-gray-800 border-gray-600 shadow-xl' 
      : 'bg-white border-gray-200 shadow-lg'
  };

  return (
    <div className={`flex flex-col h-full border-r transition-all duration-300 ${themeClasses.container}`}>
      {/* Professional Header */}
      <div className={`p-6 border-b ${themeClasses.header}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {chats?.length || 0} conversations
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ConnectionStatus isConnected={isConnected} />
            <button 
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              onClick={() => setShowNotificationSettings(true)}
              title="Notification Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Modern Search Input */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations or start new chat..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={`w-full px-4 py-3 pl-11 pr-4 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 ${themeClasses.searchInput}`}
          />
          <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {/* Enhanced Search Results Dropdown */}
          {showUserSearch && (
            <div className={`absolute top-full left-0 right-0 mt-2 border rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto ${themeClasses.dropdown}`}>
              {searchLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Searching...
                  </p>
                </div>
              ) : searchError ? (
                <div className="p-4 text-center">
                  <p className="text-red-500 text-sm">
                    ❌ Search failed. Please try again.
                  </p>
                  <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {searchError.message}
                  </p>
                </div>
              ) : searchUsers && searchUsers.length > 0 ? (
                <>
                  <div className={`p-2 text-xs font-medium uppercase tracking-wide ${theme === 'dark' ? 'text-gray-400 bg-gray-900' : 'text-gray-500 bg-gray-50'}`}>
                    People
                  </div>
              {searchUsers.map((searchUser, index) => (
                <button
                  key={searchUser.profileid}
                  onClick={() => handleUserSelect(searchUser)}
                  disabled={!user || !user.profileid || searchUser.profileid === user.profileid || createChatLoading}
                  className={`w-full p-4 flex items-center space-x-3 transition-colors ${
                    (!user || !user.profileid || searchUser.profileid === user.profileid || createChatLoading) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } ${index === searchUsers.length - 1 ? '' : 'border-b border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="relative">
                    <img
                      src={searchUser.profilePic || '/default-avatar.png'}
                      alt={searchUser.username}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold truncate">
                        {searchUser.name || searchUser.username}
                      </span>
                      {createChatLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : searchUser.isVerified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      @{searchUser.username}
                    </p>
                  </div>
                </button>
              ))}
                </>
              ) : (
                <div className="p-4 text-center">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    No users found for "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-xl animate-pulse">
                <div className={`w-14 h-14 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="flex-1">
                  <div className={`h-4 rounded mb-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-3 rounded w-3/4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'}`}></div>
                </div>
                <div className={`h-3 w-12 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
            ))}
          </div>
        ) : !chats || chats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Search for people above to start your first conversation
            </p>
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Chatting
            </button>
          </div>
        ) : (
          <div className="p-2">
            {(chats || []).filter(chat => chat && chat.chatid).map((chat, index) => {
              const { name, avatar, isOnline } = getChatDisplayInfo(chat);
              const isSelected = selectedChat?.chatid === chat.chatid;
              const lastMessage = chat.lastMessage;
              
              return (
                <button
                  key={chat.chatid}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-4 flex items-center space-x-4 rounded-xl transition-all duration-200 mb-1 border-l-4 ${
                    isSelected 
                      ? `${themeClasses.selectedChat} border-l-red-500` 
                      : `${themeClasses.chatItem} border-l-transparent hover:border-l-red-300`
                  }`}
                >
                  {/* Professional Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 p-0.5 shadow-sm">
                      <img
                        src={avatar || '/default-avatar.png'}
                        alt={name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
                    )}
                  </div>

                  {/* Chat Information */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate text-base">
                        {name}
                      </h3>
                      {chat.lastMessageAt && (
                        <span className={`text-xs font-medium ${
                          isSelected 
                            ? 'text-red-600 dark:text-red-400' 
                            : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate pr-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {lastMessage && user && user.profileid && lastMessage.sender?.profileid === user.profileid && (
                          <span className="text-red-500 font-medium">You: </span>
                        )}
                        {getLastMessagePreview(lastMessage)}
                      </p>
                      {/* Unread Badge - Add your unread logic here */}
                      {chat.unreadCount > 0 && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center ml-2 shadow-sm">
                          <span className="text-xs text-white font-bold">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  );
}
