'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import MessageBubble from './MessageBubble';
import { useSocket } from '../Helper/SocketProvider';

// GraphQL Queries
const GET_THREAD_MESSAGES = gql`
  query GetThreadMessages($threadId: ID!) {
    getThreadMessages(threadId: $threadId) {
      messageid
      chatid
      senderid
      threadId
      messageType
      content
      createdAt
      attachments {
        url
        filename
        type
        size
      }
      sender {
        profileid
        username
        name
        profilePicture
      }
      reactions {
        emoji
        profileid
      }
    }
  }
`;

const SEND_THREAD_REPLY = gql`
  mutation SendThreadReply($threadId: ID!, $chatId: ID!, $content: String!, $messageType: String) {
    sendThreadReply(threadId: $threadId, chatId: $chatId, content: $content, messageType: $messageType) {
      messageid
      content
      createdAt
    }
  }
`;

/**
 * Message Thread View Component
 * 
 * Displays threaded conversations similar to Slack/Discord
 * - Shows original message at top
 * - Lists all replies below
 * - Input for new replies at bottom
 * - Real-time updates via socket
 */
export default function MessageThreadView({ 
  threadId, 
  originalMessage,
  chatId,
  user,
  onClose 
}) {
  const { socket } = useSocket();
  const [replyInput, setReplyInput] = useState('');
  const [threadReplies, setThreadReplies] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch thread messages
  const { data, loading, refetch } = useQuery(GET_THREAD_MESSAGES, {
    variables: { threadId },
    skip: !threadId,
    onCompleted: (data) => {
      if (data?.getThreadMessages) {
        setThreadReplies(data.getThreadMessages);
      }
    }
  });

  // Send thread reply mutation
  const [sendReply, { loading: sending }] = useMutation(SEND_THREAD_REPLY, {
    onCompleted: () => {
      setReplyInput('');
      refetch();
      scrollToBottom();
    },
    onError: (error) => {
      console.error('Error sending thread reply:', error);
      alert('Failed to send reply: ' + error.message);
    }
  });

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !threadId) return;

    const handleThreadReply = (data) => {
      console.log('📨 New thread reply received:', data);
      if (data.threadId === threadId) {
        setThreadReplies(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    socket.on('thread_reply', handleThreadReply);

    return () => {
      socket.off('thread_reply', handleThreadReply);
    };
  }, [socket, threadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendReply = async () => {
    if (!replyInput.trim()) return;

    try {
      await sendReply({
        variables: {
          threadId,
          chatId,
          content: replyInput.trim(),
          messageType: 'text'
        }
      });
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-indigo-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-lg font-semibold text-white">Thread</h3>
            <span className="text-sm text-white/80">
              {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Original Message */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-start space-x-3">
          <img
            src={originalMessage.sender?.profilePicture || '/default-avatar.png'}
            alt={originalMessage.sender?.name || 'User'}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {originalMessage.sender?.name || originalMessage.sender?.username || 'Unknown'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(originalMessage.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              {originalMessage.content}
            </div>
            {originalMessage.attachments?.length > 0 && (
              <div className="mt-2">
                {originalMessage.attachments.map((attachment, index) => (
                  <div key={index} className="text-sm text-blue-500 hover:underline">
                    📎 {attachment.filename}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thread Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : threadReplies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="font-medium">No replies yet</p>
            <p className="text-sm mt-1">Be the first to reply!</p>
          </div>
        ) : (
          threadReplies.map((reply) => (
            <div key={reply.messageid} className="flex items-start space-x-3 pl-3 border-l-2 border-blue-300 dark:border-blue-600">
              <img
                src={reply.sender?.profilePicture || '/default-avatar.png'}
                alt={reply.sender?.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {reply.sender?.name || reply.sender?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {reply.content}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-end space-x-2">
          <img
            src={user?.profilePicture || '/default-avatar.png'}
            alt="Your avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply to thread..."
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</span>
              <button
                onClick={handleSendReply}
                disabled={!replyInput.trim() || sending}
                className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
