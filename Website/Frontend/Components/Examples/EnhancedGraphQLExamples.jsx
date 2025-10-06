/**
 * Enhanced GraphQL Examples
 * Demonstrating the advanced GraphQL hooks in real-world scenarios
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  useEnhancedQuery,
  useEnhancedMutation,
  useAuthenticatedQuery,
  useBatchedQueries,
  useCacheManager
} from '../../hooks/useAdvancedGraphQL';

// Import your existing GraphQL operations
import { 
  GET_ALL_POSTS, 
  TOGGLE_POST_LIKE, 
  TOGGLE_SAVE_POST 
} from '../../lib/graphql/queries';

import { 
  GET_CHATS, 
  GET_MESSAGES_BY_CHAT,
  SEND_MESSAGE 
} from '../Chat/queries';

/**
 * Enhanced Posts Component - Replaces your current HomeContent logic
 */
export const EnhancedPostsComponent = () => {
  // Using enhanced query with performance monitoring
  const { 
    data, 
    loading, 
    error, 
    retry, 
    performanceData, 
    retryCount 
  } = useEnhancedQuery(GET_ALL_POSTS, {
    componentName: 'PostsFeed',
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
    transformData: (rawData) => {
      // Transform and filter data
      return {
        ...rawData,
        getPosts: rawData?.getPosts?.filter(post => 
          post.postUrl && post.postUrl !== 'null'
        ) || []
      };
    }
  });

  // Enhanced mutations with optimistic updates
  const [toggleLike, { loading: likeLoading, performanceData: likeMetrics }] = useEnhancedMutation(
    TOGGLE_POST_LIKE,
    {
      componentName: 'PostLike',
      optimisticUpdate: (variables) => ({
        query: GET_ALL_POSTS,
        data: {
          getPosts: data?.getPosts?.map(post => 
            post.postid === variables.postid
              ? { ...post, isLikedByUser: !post.isLikedByUser, likeCount: post.likeCount + (post.isLikedByUser ? -1 : 1) }
              : post
          )
        }
      }),
      onError: (error) => {
        console.error('Like failed:', error);
        // Show user notification
      },
      onSuccess: () => {
        console.log('Like successful');
      }
    }
  );

  const handleLike = useCallback(async (postId) => {
    try {
      await toggleLike({
        variables: { postid: postId, profileid: 'current-user-id' }
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, [toggleLike]);

  const posts = data?.getPosts || [];

  return (
    <div className="space-y-6">
      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && performanceData && (
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <strong>Performance:</strong> {performanceData.duration?.toFixed(2)}ms | 
          Cache: {performanceData.cacheHit ? '✅' : '❌'} | 
          Retries: {retryCount}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button 
            onClick={retry}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard 
            key={post.postid} 
            post={post} 
            onLike={() => handleLike(post.postid)}
            likeLoading={likeLoading}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Enhanced Chat Dashboard - Shows batched queries
 */
export const EnhancedChatDashboard = ({ userId }) => {
  // Batch multiple related queries for dashboard
  const { 
    data: batchedData, 
    loading: batchLoading, 
    errors: batchErrors, 
    refetch: refetchBatch 
  } = useBatchedQueries([
    {
      key: 'chats',
      query: GET_CHATS,
      variables: { profileid: userId },
      transform: (data) => data.getChats || []
    },
    // Add more queries as needed
    // {
    //   key: 'notifications',
    //   query: GET_NOTIFICATIONS,
    //   variables: { profileid: userId }
    // }
  ]);

  const chats = batchedData.chats || [];
  const hasErrors = Object.keys(batchErrors).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chat Dashboard</h2>
        <button 
          onClick={refetchBatch}
          disabled={batchLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {batchLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {hasErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">Some data failed to load</h3>
          {Object.entries(batchErrors).map(([key, error]) => (
            <p key={key} className="text-yellow-600 text-sm">
              {key}: {error}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chats.map((chat) => (
          <ChatCard key={chat.chatid} chat={chat} />
        ))}
      </div>
    </div>
  );
};

/**
 * Authenticated Profile Component - Shows authenticated queries
 */
export const AuthenticatedProfile = ({ profileId }) => {
  // This will automatically inject user data and handle auth state
  const { 
    data, 
    loading, 
    error, 
    isAuthenticated, 
    isAuthRequired 
  } = useAuthenticatedQuery(GET_ALL_POSTS, {
    variables: { profileid: profileId },
    requireAuth: true,
    fallbackData: { getPosts: [] },
    componentName: 'UserProfile'
  });

  if (!isAuthenticated && isAuthRequired) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">Please log in</h3>
        <p className="text-gray-600">You need to be authenticated to view this content.</p>
      </div>
    );
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  const posts = data?.getPosts || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostThumbnail key={post.postid} post={post} />
        ))}
      </div>
    </div>
  );
};

/**
 * Cache Management Component - Shows cache operations
 */
export const CacheManagementDashboard = () => {
  const { 
    invalidateQuery, 
    getCacheSize, 
    clearCache, 
    evictFromCache 
  } = useCacheManager();
  
  const [cacheSize, setCacheSize] = useState(0);

  const handleGetCacheSize = useCallback(() => {
    setCacheSize(getCacheSize());
  }, [getCacheSize]);

  const handleInvalidatePosts = useCallback(() => {
    invalidateQuery(GET_ALL_POSTS);
  }, [invalidateQuery]);

  const handleClearCache = useCallback(() => {
    clearCache();
    setCacheSize(0);
  }, [clearCache]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Cache Management</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Cache Size: {cacheSize} entries</span>
          <button 
            onClick={handleGetCacheSize}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Check Size
          </button>
        </div>

        <button 
          onClick={handleInvalidatePosts}
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm mr-2"
        >
          Invalidate Posts
        </button>

        <button 
          onClick={handleClearCache}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Clear All Cache
        </button>
      </div>
    </div>
  );
};

/**
 * Real-time Messages Component - Shows subscription integration
 */
export const RealTimeMessages = ({ chatId }) => {
  const [newMessage, setNewMessage] = useState('');
  
  // Enhanced mutation for sending messages
  const [sendMessage, { loading: sendingMessage }] = useEnhancedMutation(
    SEND_MESSAGE,
    {
      componentName: 'ChatMessage',
      updateQueries: {
        // Update the messages cache when a new message is sent
        [GET_MESSAGES_BY_CHAT]: (cache, { data }, variables) => {
          const existingMessages = cache.readQuery({
            query: GET_MESSAGES_BY_CHAT,
            variables: { chatid: variables.chatid }
          });

          if (existingMessages && data.SendMessage) {
            cache.writeQuery({
              query: GET_MESSAGES_BY_CHAT,
              variables: { chatid: variables.chatid },
              data: {
                getMessagesByChat: [
                  ...existingMessages.getMessagesByChat,
                  data.SendMessage
                ]
              }
            });
          }
        }
      }
    }
  );

  // Get messages with enhanced query
  const { data: messagesData, loading: messagesLoading } = useEnhancedQuery(
    GET_MESSAGES_BY_CHAT,
    {
      variables: { chatid: chatId },
      componentName: 'ChatMessages',
      fetchPolicy: 'cache-and-network'
    }
  );

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        variables: {
          chatid: chatId,
          messageType: 'text',
          content: newMessage.trim()
        }
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [sendMessage, chatId, newMessage]);

  const messages = messagesData?.getMessagesByChat || [];

  return (
    <div className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messagesLoading && messages.length === 0 && (
          <div className="text-center text-gray-500">Loading messages...</div>
        )}
        
        {messages.map((message) => (
          <motion.div
            key={message.messageid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-100 p-3 rounded-lg"
          >
            <div className="text-sm text-gray-600">{message.sender?.username}</div>
            <div>{message.content}</div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {sendingMessage ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Supporting Components
const PostCard = ({ post, onLike, likeLoading }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4">
      <div className="flex items-center space-x-3 mb-3">
        <img 
          src={post.profile?.profilePic || '/default-profile.svg'} 
          alt={post.profile?.username}
          className="w-8 h-8 rounded-full"
        />
        <span className="font-medium">{post.profile?.username}</span>
      </div>
      
      {post.postUrl && (
        <img 
          src={post.postUrl} 
          alt={post.title || 'Post'}
          className="w-full h-48 object-cover rounded-lg mb-3"
        />
      )}
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={onLike}
          disabled={likeLoading}
          className={`flex items-center space-x-1 ${
            post.isLikedByUser ? 'text-red-500' : 'text-gray-500'
          } disabled:opacity-50`}
        >
          <span>♥</span>
          <span>{post.likeCount || 0}</span>
        </button>
      </div>
      
      {post.Description && (
        <p className="text-gray-700 mt-2">{post.Description}</p>
      )}
    </div>
  </div>
);

const ChatCard = ({ chat }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div className="flex items-center space-x-3">
      <img 
        src={chat.chatAvatar || '/default-chat.svg'} 
        alt={chat.chatName}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{chat.chatName}</h3>
        <p className="text-sm text-gray-500 truncate">
          {chat.lastMessage?.content || 'No messages yet'}
        </p>
      </div>
    </div>
  </div>
);

const PostThumbnail = ({ post }) => (
  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
    <img 
      src={post.postUrl} 
      alt={post.title}
      className="w-full h-full object-cover"
    />
  </div>
);

const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="grid grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
      ))}
    </div>
  </div>
);

const ErrorMessage = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <h3 className="text-red-800 font-medium">Error occurred</h3>
    <p className="text-red-600 text-sm">{error.message}</p>
  </div>
);

export default {
  EnhancedPostsComponent,
  EnhancedChatDashboard,
  AuthenticatedProfile,
  CacheManagementDashboard,
  RealTimeMessages
};