'use client';

import React, { useState, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { useSecureAuth } from '../../context/FixedSecureAuthContext';
import { useSocket } from '../Helper/PerfectSocketProvider';

function MessageThread({ 
  threadStarter, 
  chat, 
  onClose, 
  onReplyToMessage,
  onEditMessage,
  onDeleteMessage 
}) {
  const { user } = useSecureAuth();
  const { socket } = useSocket();
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');

  // Fetch thread messages
  useEffect(() => {
    const fetchThreadMessages = async () => {
      if (!socket || !threadStarter?.threadId) return;
      
      try {
        setLoading(true);
        
        // Request thread messages from backend
        socket.emit('get_thread_messages', {
          threadId: threadStarter.threadId,
          chatid: chat.chatid
        }, (response) => {
          if (response?.success) {
            setThreadMessages(response.messages || []);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to fetch thread messages:', error);
        setLoading(false);
      }
    };
    
    fetchThreadMessages();
  }, [socket, threadStarter, chat]);

  // Handle sending a reply in the thread
  const handleSendReply = async () => {
    if (!newReply.trim() || !socket) return;
    
    try {
      const replyData = {
        chatid: chat.chatid,
        messageType: 'text',
        content: newReply.trim(),
        replyTo: threadStarter.messageid, // Reply to the thread starter
        clientMessageId: `thread_reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };
      
      // Send via socket
      socket.emit('send_message', replyData, (ack) => {
        if (ack?.success) {
          // Add to local state
          setThreadMessages(prev => [...prev, ack.message]);
          setNewReply('');
        } else {
          console.error('Failed to send thread reply:', ack?.error);
        }
      });
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  // Handle key press for sending reply
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Loading thread...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thread</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Thread Starter */}
          <div className="mb-6">
            <MessageBubble
              message={threadStarter}
              isOwn={threadStarter.senderid === user.profileid}
              showAvatar={true}
              chat={chat}
              onReply={onReplyToMessage}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              isThreadView={true}
            />
          </div>
          
          {/* Replies */}
          <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 ml-5">
            {threadMessages
              .filter(msg => msg.messageid !== threadStarter.messageid) // Exclude thread starter
              .map((message) => (
                <div key={message.messageid} className="mb-4">
                  <MessageBubble
                    message={message}
                    isOwn={message.senderid === user.profileid}
                    showAvatar={true}
                    chat={chat}
                    onReply={onReplyToMessage}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    isThreadView={true}
                  />
                </div>
              ))}
          </div>
        </div>
        
        {/* Reply Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end space-x-2">
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a reply..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows="1"
            />
            <button
              onClick={handleSendReply}
              disabled={!newReply.trim()}
              className={`p-2 rounded-full ${
                newReply.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageThread;