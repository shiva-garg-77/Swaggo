'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../Helper/AuthProvider';
import { SEARCH_USERS, CREATE_CHAT } from './queries';

export default function ChatSidebar({ 
  chats, 
  selectedChat, 
  onChatSelect, 
  onNewChat, 
  loading, 
  isConnected 
}) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const searchInputRef = useRef(null);

  // Search users for new chat
  const { data: searchData, refetch: refetchUsers } = useQuery(SEARCH_USERS, {
    variables: { query: searchQuery, limit: 10 },
    skip: !searchQuery || searchQuery.length < 2,
    onCompleted: (data) => {
      setSearchUsers(data.searchUsers || []);
    }
  });

  // Create new chat mutation
  const [createChat] = useMutation(CREATE_CHAT, {
    onCompleted: (data) => {
      onNewChat(data.CreateChat);
      setSearchQuery('');
      setShowUserSearch(false);
    },
    onError: (error) => {
      console.error('Error creating chat:', error);
    }
  });

  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.length >= 2) {
      setShowUserSearch(true);
      const timeout = setTimeout(() => {
        refetchUsers();
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setShowUserSearch(false);
      setSearchUsers([]);
    }
  };

  // Handle user selection for new chat
  const handleUserSelect = async (selectedUser) => {
    if (selectedUser.profileid === user.profileid) return;

    try {
      await createChat({
        variables: {
          participants: [user.profileid, selectedUser.profileid],
          chatType: 'direct'
        }
      });
    } catch (error) {
      console.error('Failed to create chat:', error);
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
      return `${days}d`;
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
      const otherParticipant = chat.participants.find(p => p.profileid !== user.profileid);
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
    }
    
    return 'Message';
  };

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
          
          {/* Search Results Dropdown */}
          {showUserSearch && searchUsers && searchUsers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {searchUsers.map((searchUser) => (
                <button
                  key={searchUser.profileid}
                  onClick={() => handleUserSelect(searchUser)}
                  className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                  disabled={searchUser.profileid === user.profileid}
                >
                  <img
                    src={searchUser.profilePic || '/default-avatar.png'}
                    alt={searchUser.username}
                    className="w-8 h-8 rounded-full object-cover"
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
              ))}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Search for people to start a new conversation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {(chats || []).map((chat) => {
              const { name, avatar, isOnline } = getChatDisplayInfo(chat);
              const isSelected = selectedChat?.chatid === chat.chatid;
              const lastMessage = chat.lastMessage;
              
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
                      src={avatar || '/default-avatar.png'}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover"
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
