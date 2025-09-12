'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MESSAGES_BY_CHAT, SEND_MESSAGE } from './queries';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ModernMessageArea({ 
  selectedChat, 
  user,
  socket,
  isConnected,
  onStartCall,
  isCallActive,
  callType,
  onEndCall
}) {
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch messages for the selected chat
  const { data: messagesData, loading, refetch: refetchMessages } = useQuery(GET_MESSAGES_BY_CHAT, {
    variables: { chatid: selectedChat?.chatid, limit: 50, offset: 0 },
    skip: !selectedChat?.chatid,
    onCompleted: (data) => {
      setAllMessages(data.getMessagesByChat || []);
    }
  });

  // Send message mutation
  const [sendMessageMutation] = useMutation(SEND_MESSAGE, {
    onCompleted: (data) => {
      // Message will be added via socket event
      scrollToBottom();
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    }
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.chat.chatid === selectedChat?.chatid) {
        setAllMessages(prev => [...prev, data.message]);
      }
    };

    const handleUserTyping = (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.profileid]: data.isTyping ? data.username : undefined
      }));
      
      // Clear typing after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newTyping = { ...prev };
            delete newTyping[data.profileid];
            return newTyping;
          });
        }, 3000);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get chat display info
  const getChatDisplayInfo = () => {
    if (!selectedChat) return { name: '', avatar: '', subtitle: '' };
    
    // Check if participants array exists
    const participants = selectedChat.participants || [];
    
    if (selectedChat.chatType === 'group') {
      return {
        name: selectedChat.chatName || 'Group Chat',
        avatar: selectedChat.chatAvatar,
        subtitle: `${participants.length} members`
      };
    } else {
      // Direct chat - find the other participant
      const otherParticipant = participants.find(p => p.profileid !== user?.profileid);
      return {
        name: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
        avatar: otherParticipant?.profilePic,
        subtitle: `@${otherParticipant?.username || 'unknown'}`
      };
    }
  };

  // Handle message sending
  const handleSendMessage = async (content, attachments = [], replyTo = null, mentions = []) => {
    if (!content.trim() && !attachments.length) return;

    try {
      // Send via GraphQL mutation
      await sendMessageMutation({
        variables: {
          chatid: selectedChat.chatid,
          messageType: attachments.length > 0 ? attachments[0].type : 'text',
          content: content.trim(),
          attachments,
          replyTo,
          mentions
        }
      });

      // Also send via Socket.io for real-time delivery
      if (socket) {
        socket.emit('send_message', {
          chatid: selectedChat.chatid,
          messageType: attachments.length > 0 ? attachments[0].type : 'text',
          content: content.trim(),
          attachments,
          replyTo,
          mentions
        });
      }

      // Clear reply state
      setReplyingTo(null);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (socket && selectedChat) {
      socket.emit('typing', {
        chatid: selectedChat.chatid,
        profileid: user.profileid,
        username: user.username,
        isTyping
      });
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your Messages</h3>
          <p className="text-gray-500 max-w-sm">Send private photos and messages to friends or groups.</p>
        </div>
      </div>
    );
  }

  const displayInfo = getChatDisplayInfo();

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={displayInfo.avatar || '/default-avatar.png'}
              alt={displayInfo.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold text-gray-900">{displayInfo.name}</h2>
              <p className="text-sm text-gray-500">{displayInfo.subtitle}</p>
            </div>
          </div>
          
          {/* Call Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onStartCall('voice')}
              disabled={isCallActive}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              title="Voice call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            
            <button
              onClick={() => onStartCall('video')}
              disabled={isCallActive}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              title="Video call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Active Call Indicator */}
      {isCallActive && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                {callType === 'video' ? 'Video' : 'Voice'} call in progress
              </span>
            </div>
            <button
              onClick={onEndCall}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition-colors"
            >
              End call
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : !allMessages || allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500 text-sm">Start the conversation with {displayInfo.name}</p>
          </div>
        ) : (
          <>
            {(allMessages || []).map((message, index) => (
              <MessageBubble
                key={message.messageid}
                message={message}
                isOwn={message.senderid === user?.profileid}
                showAvatar={
                  index === 0 || 
                  allMessages[index - 1]?.senderid !== message.senderid
                }
                onReply={() => setReplyingTo(message)}
              />
            ))}
            
            {/* Typing indicators */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center space-x-2 px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500">
                  {Object.values(typingUsers).filter(Boolean).join(', ')} typing...
                </span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-8 bg-red-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Replying to {replyingTo.sender?.username || 'User'}
                </p>
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {replyingTo.content || 'Message'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          replyingTo={replyingTo}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}
