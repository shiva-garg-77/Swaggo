'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react'; 
import { SEARCH_USERS, CREATE_CHAT } from '../Messaging/queries';
import { useTheme } from '../../Helper/ThemeProvider';
import timeFormatter from '../../../utils/timeFormatter'; // Issue #18, #20: Import image utilities
const { formatMessageTime, getValidImageUrl, handleImageError } = timeFormatter;
import { useFixedSecureAuth as useSecureAuth } from '../../../context/FixedSecureAuthContext'; // Add missing import

export default function ChatSidebar({ 
  chats, 
  selectedChat, 
  onChatSelect, 
  onCreateChat, 
  loading, 
  isConnected 
}) {
  const { user } = useSecureAuth();
  
  // Standardized user ID extraction
  const getUserId = useCallback((userObj) => {
    return userObj?.profileid || userObj?.id || userObj?.userId || userObj?._id;
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false); // Issue #19: Add loading indicator state
  
  const searchInputRef = useRef(null);

  // Search users for new chat
  const { data: searchData, refetch: refetchUsers, loading: searchLoading, error: searchError } = useQuery(SEARCH_USERS, {
    variables: { query: searchQuery, limit: 10 },
    skip: !searchQuery || searchQuery.length < 1,
    onCompleted: (data) => {
      console.log('🔍 User search completed:', {
        query: searchQuery,
        resultsCount: data?.searchUsers?.length || 0,
        results: data?.searchUsers?.map(u => ({ username: u.username, profileid: u.profileid })) || []
      });
      setSearchUsers(data.searchUsers || []);
    },
    onError: (error) => {
      console.error('❌ User search error:', {
        query: searchQuery,
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    }
  });

  // Create new chat mutation
  const [createChat] = useMutation(CREATE_CHAT, {
    onCompleted: (data) => {
      console.log('📥 Frontend received createChat data:', {
        hasData: !!data,
        hasCreateChat: !!data?.createChat,
        chatid: data?.createChat?.chatid,
        fullData: data?.createChat
      });
      
      if (onCreateChat) {
        onCreateChat(data.createChat);
      }
      setSearchQuery('');
      setShowUserSearch(false);
    },
    onError: (error) => {
      console.error('Error creating chat:', error);
    }
  });

  // Handle search input changes with debouncing - Issue #19: Reduce debounce to 150ms
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.length >= 1) {
      setShowUserSearch(true);
      setIsSearching(true); // Issue #19: Set loading state
      const timeout = setTimeout(() => {
        console.log('🔍 Triggering user search for:', query);
        refetchUsers()
          .finally(() => {
            setIsSearching(false); // Issue #19: Reset loading state
          });
      }, 150); // Issue #19: Reduce debounce to 150ms
      setSearchTimeout(timeout);
    } else {
      setShowUserSearch(false);
      setSearchUsers([]);
      setIsSearching(false); // Issue #19: Reset loading state
    }
  };

  // Handle user selection for new chat
  const handleUserSelect = async (selectedUser) => {
    // Get consistent user ID (profileid or id) - standardized approach
    const getUserId = (userObj) => {
      return userObj?.profileid || userObj?.id || userObj?.userId || userObj?._id;
    };
    
    const currentUserId = getUserId(user);
    const selectedUserId = getUserId(selectedUser);
    
    console.log('🔍 Creating chat:', {
      currentUserId,
      selectedUserId,
      currentUserName: user?.username,
      selectedUserName: selectedUser?.username,
      currentUserKeys: user ? Object.keys(user) : 'No user',
      selectedUserKeys: selectedUser ? Object.keys(selectedUser) : 'No selected user'
    });
    
    if (!currentUserId || !selectedUserId || selectedUserId === currentUserId) {
      console.warn('⚠️ Cannot create chat - invalid user IDs');
      alert('Cannot create chat with this user. Please try again.');
      return;
    }

    try {
      console.log('📤 Sending createChat mutation with:', {
        participants: [currentUserId, selectedUserId],
        chatType: 'direct'
      });
      
      const result = await createChat({
        variables: {
          input: {
            participants: [currentUserId, selectedUserId],
            chatType: 'direct'
          }
        }
      });
      
      console.log('✅ Chat creation result:', result);
      console.log('✅ Created chat data:', result?.data?.createChat);
      
      // ✅ FIX: Validate chat was created with chatid
      const createdChat = result?.data?.createChat;
      if (!createdChat || !createdChat.chatid) {
        console.error('❌ Chat created but missing chatid:', createdChat);
        alert('Chat was created but has invalid data. Please refresh the page.');
        return;
      }
      
      console.log('✅ Chat created successfully with chatid:', createdChat.chatid);
      
      // Clear search after successful creation
      setSearchQuery('');
      setShowUserSearch(false);
      setSearchUsers([]);
      
      // ✅ FIX: Automatically select the newly created chat
      if (onChatSelect && createdChat) {
        console.log('🎯 Auto-selecting newly created chat');
        onChatSelect(createdChat);
      }
      
    } catch (error) {
      console.error('❌ Failed to create chat:', error);
      console.error('Error details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        extraInfo: error.extraInfo
      });
      
      // ✅ FIX: Better error message for user
      const errorMessage = error.graphQLErrors?.[0]?.message || error.message || 'Unknown error';
      alert(`Failed to create chat: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    }
  };

  // Get chat display info
  const getChatDisplayInfo = (chat) => {
    if (chat.chatType === 'group') {
      return {
        name: chat.chatName || 'Group Chat',
        avatar: chat.chatAvatar,
        isOnline: false
      };
    } else {
      // Direct chat - find the other participant
      const currentUserId = getUserId(user);
      const otherParticipant = chat.participants.find(p => 
        getUserId(p) !== currentUserId
      );
      return {
        name: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
        avatar: otherParticipant?.profilePic,
        isOnline: false // You can integrate online status here
      };
    }
  };

  // Get last message preview
  const getLastMessagePreview = (message) => {
    if (!message) return 'No messages yet';
    
    if (message.messageType === 'text') {
      return message.content || 'Message';
    } else if (message.messageType === 'image') {
      return '📷 Photo';
    } else if (message.messageType === 'video') {
      return '🎥 Video';
    } else if (message.messageType === 'file') {
      return '📎 File';
    } else if (message.messageType === 'voice') {
      return '🎤 Voice message';
    }
    
    return 'Message';
  };

  // Format last message time - Issue #18: Use standardized formatter
  // const formatMessageTime = (timestamp) => {
  //   const now = new Date();
  //   const messageTime = new Date(timestamp);
  //   const diffInHours = (now - messageTime) / (1000 * 60 * 60);
  //   
  //   if (diffInHours < 1) {
  //     const minutes = Math.floor((now - messageTime) / (1000 * 60));
  //     return minutes < 1 ? 'now' : `${minutes}m`;
  //   } else if (diffInHours < 24) {
  //     return `${Math.floor(diffInHours)}h`;
  //   } else {
  //     const days = Math.floor(diffInHours / 24);
  //     return `${days}d`;
  //   }
  // };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <div className="flex items-center space-x-2">
            {/* Connection status indicator */}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              onClick={() => searchInputRef.current?.focus()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {/* Search Results Dropdown - Force show for debugging */}
          {(showUserSearch || searchQuery.length >= 1) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {isSearching ? ( // Issue #19: Show loading indicator
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Searching users...
                </div>
              ) : searchLoading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Searching users...
                </div>
              ) : searchError ? (
                <div className="p-4 text-center text-red-500">
                  ❌ Search failed: {searchError.message}
                </div>
              ) : searchUsers && searchUsers.length > 0 ? (
                searchUsers.map((searchUser) => (
                  <button
                    key={searchUser.profileid || searchUser.id}
                    onClick={() => handleUserSelect(searchUser)}
                    className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                    disabled={getUserId(searchUser) === getUserId(user)}
                  >
                    <img
                      src={getValidImageUrl(searchUser.profilePic)} // Issue #20: Use validated image URL
                      alt={searchUser.username}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => handleImageError(e)} // Issue #20: Handle image loading errors
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {searchUser.name || searchUser.username}
                        </span>
                        {searchUser.isVerified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">@{searchUser.username}</span>
                    </div>
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  🔍 No users found for "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 mb-2">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !chats || chats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9 8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Search for people to start a new conversation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {(chats || []).map((chat) => {
              // Skip chats without a valid chatid
              if (!chat || !chat.chatid) {
                console.warn('Skipping chat without valid chatid:', chat);
                return null;
              }
              
              const { name, avatar, isOnline } = getChatDisplayInfo(chat);
              const isSelected = selectedChat?.chatid === chat.chatid;
              const lastMessage = chat.lastMessage;
              
              // ✅ Check if this is a chat with yourself (invalid chat)
              const currentUserId = getUserId(user);
              const isSelfChat = chat.participants && chat.participants.length === 2 && 
                chat.participants.every(p => getUserId(p) === currentUserId);
              
              // Skip rendering chats with yourself
              if (isSelfChat) {
                console.warn('⚠️ Skipping self-chat:', chat.chatid);
                return null;
              }
              
              return (
                <button
                  key={chat.chatid}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isSelected ? 'bg-red-50 dark:bg-red-900/20 border-r-2 border-red-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={getValidImageUrl(avatar)} // Issue #20: Use validated image URL
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => handleImageError(e)} // Issue #20: Handle image loading errors
                    />
                    {isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {name}
                      </h3>
                      {chat.lastMessageAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {formatMessageTime(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {lastMessage && lastMessage.sender?.profileid === user.profileid && 'You: '}
                        {getLastMessagePreview(lastMessage)}
                      </p>
                      {/* Unread indicator - you can add unread count here */}
                      {/* <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div> */}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}