'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, X, Calendar, Trash2, Edit3, Check, 
  AlertTriangle, Search, Filter, SortAsc, SortDesc 
} from 'lucide-react';

/**
 * Scheduled Message Manager Component
 * 
 * Features:
 * - View all scheduled messages
 * - Edit scheduled messages
 * - Cancel scheduled messages
 * - Search and filter scheduled messages
 * - Sort by date, recipient, content
 * - Better error handling and user feedback
 */
export default function ScheduledMessageManager({ 
  user, 
  chat,
  isOpen, 
  onClose,
  onMessageUpdated,
  onMessageCancelled
}) {
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('scheduledFor');
  const [sortOrder, setSortOrder] = useState('asc');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editForm, setEditForm] = useState({
    content: '',
    scheduledFor: ''
  });

  // Load scheduled messages
  useEffect(() => {
    if (isOpen && user?.profileid) {
      loadScheduledMessages();
    }
  }, [isOpen, user, chat]);

  const loadScheduledMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const chatId = chat?.chatid;
      const response = await fetch(`/api/scheduled-messages?chatId=${chatId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load scheduled messages');
      }
      
      const messages = await response.json();
      setScheduledMessages(messages);
    } catch (err) {
      console.error('Error loading scheduled messages:', err);
      setError('Failed to load scheduled messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMessage = async (scheduledMessageId) => {
    try {
      const response = await fetch(`/api/scheduled-messages/${scheduledMessageId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel scheduled message');
      }
      
      // Update local state
      setScheduledMessages(prev => 
        prev.filter(msg => msg.scheduledMessageId !== scheduledMessageId)
      );
      
      // Notify parent component
      onMessageCancelled?.(scheduledMessageId);
      
      // Show success feedback
      console.log('Scheduled message cancelled successfully');
    } catch (err) {
      console.error('Error cancelling scheduled message:', err);
      setError('Failed to cancel scheduled message. Please try again.');
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditForm({
      content: message.content || '',
      scheduledFor: format(new Date(message.scheduledFor), "yyyy-MM-dd'T'HH:mm")
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;
    
    try {
      const response = await fetch(`/api/scheduled-messages/${editingMessage.scheduledMessageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editForm.content,
          scheduledFor: new Date(editForm.scheduledFor).toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update scheduled message');
      }
      
      const updatedMessage = await response.json();
      
      // Update local state
      setScheduledMessages(prev => 
        prev.map(msg => 
          msg.scheduledMessageId === editingMessage.scheduledMessageId 
            ? updatedMessage 
            : msg
        )
      );
      
      // Notify parent component
      onMessageUpdated?.(updatedMessage);
      
      // Close edit mode
      setEditingMessage(null);
      
      // Show success feedback
      console.log('Scheduled message updated successfully');
    } catch (err) {
      console.error('Error updating scheduled message:', err);
      setError('Failed to update scheduled message. Please try again.');
    }
  };

  const filteredAndSortedMessages = scheduledMessages
    .filter(msg => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        msg.content?.toLowerCase().includes(query) ||
        msg.messageType?.toLowerCase().includes(query) ||
        format(new Date(msg.scheduledFor), 'PP p').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle date sorting
      if (sortBy === 'scheduledFor') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getMessageTypeIcon = (type) => {
    const icons = {
      text: '💬',
      image: '📷',
      video: '🎥',
      voice: '🎤',
      gif: '🎬',
      sticker: '🎨',
      file: '📎'
    };
    return icons[type] || '💬';
  };

  const formatScheduledTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (date - now) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `In ${Math.max(1, Math.floor(diffInHours * 60))} minutes`;
    } else if (diffInHours < 24) {
      return `In ${Math.floor(diffInHours)} hours`;
    } else {
      return format(date, 'PP p');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Scheduled Messages
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {scheduledMessages.length} scheduled
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scheduled messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                Sort
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading scheduled messages...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Messages</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadScheduledMessages}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredAndSortedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Scheduled Messages</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No messages match your search' : 'You have no scheduled messages'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredAndSortedMessages.map((message) => (
                  <motion.div
                    key={message.scheduledMessageId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    {editingMessage?.scheduledMessageId === message.scheduledMessageId ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getMessageTypeIcon(message.messageType)}</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              Edit Scheduled Message
                            </span>
                          </div>
                          <button
                            onClick={() => setEditingMessage(null)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Message Content
                            </label>
                            <textarea
                              value={editForm.content}
                              onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Scheduled Time
                            </label>
                            <input
                              type="datetime-local"
                              value={editForm.scheduledFor}
                              onChange={(e) => setEditForm({...editForm, scheduledFor: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingMessage(null)}
                              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <span className="text-lg mt-1">{getMessageTypeIcon(message.messageType)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {message.messageType?.toUpperCase()}
                                </span>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                  Scheduled
                                </span>
                              </div>
                              {message.content && (
                                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 line-clamp-2">
                                  {message.content}
                                </p>
                              )}
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>{formatScheduledTime(message.scheduledFor)}</span>
                                <span className="mx-2">•</span>
                                <span>Scheduled for {format(new Date(message.scheduledFor), 'PP p')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditMessage(message)}
                              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit message"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelMessage(message.scheduledMessageId)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Cancel message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Message Preview */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {message.attachments.map((attachment, index) => (
                              <div 
                                key={index} 
                                className="flex items-center space-x-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs"
                              >
                                <span>{getMessageTypeIcon(attachment.type)}</span>
                                <span className="truncate max-w-[100px]">
                                  {attachment.filename || `${attachment.type} attachment`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedMessages.length} of {scheduledMessages.length} messages shown
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}