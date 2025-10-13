/**
 * Real-time Message Service
 * Comprehensive message handling with delivery status tracking, offline queuing, and synchronization
 */

import { EventEmitter } from 'events';
import authService from './AuthService';
import cacheService from './CacheService';
import errorHandlingService from './ErrorHandlingService';
import notificationService from './NotificationService';
import { useUnifiedStore } from './useUnifiedStore'; // Use the new unified store
import offlineModeService from './OfflineModeService';
import cdnService from './CDNService';
import enhancedSearchService from './EnhancedSearchService';
// Import the service container to get the socket service
import { getService } from '../core/services';

/**
 * Message Types
 */
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  LOCATION: 'location',
  CONTACT: 'contact',
  SYSTEM: 'system',
  CALL_START: 'call_start',
  CALL_END: 'call_end'
};

/**
 * Chat Types
 */
const CHAT_TYPES = {
  PRIVATE: 'private',
  GROUP: 'group',
  CHANNEL: 'channel',
  SUPPORT: 'support'
};

/**
 * Message States
 */
const MESSAGE_STATES = {
  DRAFT: 'draft',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  DELETED: 'deleted'
};

/**
 * Sync Status
 */
const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  SYNCING: 'syncing',
  CONFLICT: 'conflict',
  FAILED: 'failed'
};

/**
 * Message Service Class
 */
class MessageService extends EventEmitter {
  constructor() {
    super();
    
    // Store reference to socket service
    this.socketService = null;
    
    // Get store actions for state synchronization
    const store = useUnifiedStore.getState();
    const {
      addMessage,
      updateMessage,
      removeMessage,
      addMessagesToChat,
      updateUnreadCount,
      updateLastReadMessage,
      setTypingUsers,
      addTypingUser,
      removeTypingUser,
      addOfflineMessage,
      removeOfflineMessage,
      clearOfflineMessages,
      setSyncing,
      setLastSyncTime,
      setSyncStatus,
      setConnected,
      setOnline,
      updateMessageStats
    } = store;
    
    this.storeActions = {
      addMessage,
      updateMessage,
      removeMessage,
      addMessagesToChat,
      updateUnreadCount,
      updateLastReadMessage,
      setTypingUsers,
      addTypingUser,
      removeTypingUser,
      addOfflineMessage,
      removeOfflineMessage,
      clearOfflineMessages,
      setSyncing,
      setLastSyncTime,
      setSyncStatus,
      setConnected,
      setOnline,
      updateMessageStats
    };
    
    // Core data stores (kept for backward compatibility but synchronized with store)
    this.messages = new Map(); // messageId -> message
    this.chats = new Map(); // chatId -> chat info
    this.drafts = new Map(); // chatId -> draft message
    this.typingUsers = new Map(); // chatId -> Set of userIds
    
    // Message organization
    this.messagesByChat = new Map(); // chatId -> Set of messageIds
    this.unreadCounts = new Map(); // chatId -> count
    this.lastReadMessages = new Map(); // chatId -> messageId
    
    // Offline and sync management
    this.offlineMessages = new Map(); // tempId -> message
    this.syncQueue = [];
    this.conflictResolver = new Map(); // messageId -> conflict data
    
    // Message processing
    this.messageProcessors = new Map(); // messageType -> processor function
    this.messageFilters = [];
    this.messageTransformers = [];
    
    // Configuration
    this.config = {
      maxMessagesInMemory: 1000,
      maxOfflineMessages: 100,
      syncInterval: 5000,
      typingTimeout: 3000,
      messageTimeout: 30000,
      retryAttempts: 3,
      enableOptimisticUpdates: true,
      enableMessageEncryption: false,
      autoMarkAsRead: true,
      cacheDuration: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    // State tracking
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.lastSyncTime = null;
    
    // Statistics
    this.stats = {
      totalMessages: 0,
      messagesSent: 0,
      messagesReceived: 0,
      messagesDelivered: 0,
      messagesRead: 0,
      failedMessages: 0,
      syncOperations: 0,
      conflictsResolved: 0
    };
    
    // Timers
    this.syncTimer = null;
    this.typingTimers = new Map();
    
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  initializeService() {
    this.setupSocketListeners();
    this.setupAuthListeners();
    this.setupMessageProcessors();
    this.startSyncTimer();
    this.loadCachedData();
    
    // Subscribe to store changes for synchronization
    useUnifiedStore.subscribe((state) => state.chat.messages, (messages) => {
      // Sync local messages map with store
      this.messages = messages;
    });
    
    useUnifiedStore.subscribe((state) => state.chat.typingUsers, (typingUsers) => {
      // Sync local typing users map with store
      this.typingUsers = typingUsers;
    });
  }

  /**
   * Get socket service instance
   */
  async getSocketService() {
    if (!this.socketService) {
      this.socketService = await getService('socket');
    }
    return this.socketService;
  }

  /**
   * Setup socket event listeners
   */
  async setupSocketListeners() {
    try {
      // Get the socket service from the container
      const socketService = await this.getSocketService();
      
      // Listen for connection events
      socketService.on('connected', () => {
        this.setConnected(true);
        this.setSyncing(false);
        this.startSyncTimer();
        this.syncOfflineMessages();
      });
      
      socketService.on('disconnected', () => {
        this.setConnected(false);
        this.stopSyncTimer();
      });
      
      socketService.on('reconnected', () => {
        this.setConnected(true);
        this.setSyncing(false);
        this.syncOfflineMessages();
      });
      
      // Listen for message events
      socketService.on('message', (message) => {
        this.handleIncomingMessage(message);
      });
      
      socketService.on('message_status_update', (statusUpdate) => {
        this.handleMessageStatusUpdate(statusUpdate);
      });
      
      socketService.on('message_reaction', (reactionData) => {
        this.handleMessageReaction(reactionData);
      });
      
      socketService.on('message_edited', (editData) => {
        this.handleMessageEdit(editData);
      });
      
      socketService.on('message_deleted', (deleteData) => {
        this.handleMessageDelete(deleteData);
      });
      
      socketService.on('message_deleted_by_others', (deleteData) => {
        this.handleMessageDeleteByOthers(deleteData);
      });
      
      // Listen for typing events
      socketService.on('typing_start', (data) => {
        this.handleTypingStart(data);
      });
      
      socketService.on('typing_stop', (data) => {
        this.handleTypingStop(data);
      });
      
      // Listen for system messages
      socketService.on('system_message', (message) => {
        this.handleSystemMessage(message);
      });
      
      // Listen for chat events
      socketService.on('chat_joined', (data) => {
        this.handleChatJoined(data);
      });
    } catch (error) {
      console.error('❌ MessageService: Failed to setup socket listeners:', error);
    }
  }

  /**
   * Setup authentication listeners
   */
  setupAuthListeners() {
    authService.on('authStateChanged', (isAuthenticated) => {
      if (isAuthenticated) {
        this.loadUserData();
      } else {
        this.clearUserData();
      }
    });
  }

  /**
   * Setup message processors for different message types
   */
  setupMessageProcessors() {
    this.messageProcessors.set(MESSAGE_TYPES.TEXT, this.processTextMessage.bind(this));
    this.messageProcessors.set(MESSAGE_TYPES.IMAGE, this.processImageMessage.bind(this));
    this.messageProcessors.set(MESSAGE_TYPES.VIDEO, this.processVideoMessage.bind(this));
    this.messageProcessors.set(MESSAGE_TYPES.AUDIO, this.processAudioMessage.bind(this));
    this.messageProcessors.set(MESSAGE_TYPES.FILE, this.processFileMessage.bind(this));
    this.messageProcessors.set(MESSAGE_TYPES.LOCATION, this.processLocationMessage.bind(this));
    this.messageProcessors.set(MESSAGE_TYPES.CONTACT, this.processContactMessage.bind(this));
    this.messageProcessors.set(MESSAGE_TYPES.SYSTEM, this.processSystemMessage.bind(this));
  }

  /**
   * Handle socket connection
   */
  onSocketConnected() {
    console.log('✅ Socket connected, syncing messages...');
    this.storeActions.setConnected(true);
    this.syncMessages();
  }

  /**
   * Handle socket disconnection
   */
  onSocketDisconnected() {
    console.log('❌ Socket disconnected, enabling offline mode...');
    this.storeActions.setConnected(false);
    // Switch to offline mode - messages will be queued
  }

  /**
   * Handle socket reconnection
   */
  onSocketReconnected() {
    console.log('🔄 Socket reconnected, syncing missed messages...');
    this.syncMissedMessages();
  }

  /**
   * Handle message reaction
   */
  handleMessageReaction(reactionData) {
    try {
      console.log('🎭 Received message reaction:', reactionData);
      
      const { messageid, action, reaction, allReactions } = reactionData;
      
      // Find the message in our store
      const message = this.messages.get(messageid);
      if (!message) {
        console.warn('⚠️ Reaction received for unknown message:', messageid);
        return;
      }
      
      // Update message reactions
      message.reactions = allReactions || [];
      
      // Update message in store
      this.storeActions.updateMessage(message);
      
      // Emit event for UI updates
      this.emit('message_reaction_updated', {
        messageId: messageid,
        reaction,
        action,
        reactions: message.reactions
      });
      
      console.log('✅ Message reaction processed:', {
        messageId: messageid,
        action,
        reactionCount: message.reactions.length
      });
      
    } catch (error) {
      console.error('❌ Error handling message reaction:', error);
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.MESSAGE_PROCESSING_FAILED,
          'Failed to process message reaction',
          { reactionData, error }
        )
      );
    }
  }

  /**
   * Handle message edit
   */
  handleMessageEdit(editData) {
    try {
      console.log('✏️ Received message edit:', editData);
      
      const { messageid, content, isEdited, editHistory, updatedAt } = editData;
      
      // Find the message in our store
      const message = this.messages.get(messageid);
      if (!message) {
        console.warn('⚠️ Edit received for unknown message:', messageid);
        return;
      }
      
      // Update message content and edit status
      message.content = content;
      message.isEdited = isEdited;
      message.editHistory = editHistory || [];
      message.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
      
      // Update message in store
      this.storeActions.updateMessage(message);
      
      // Emit event for UI updates
      this.emit('message_edited_updated', {
        messageId: messageid,
        content,
        isEdited,
        editHistory,
        updatedAt
      });
      
      console.log('✅ Message edit processed:', {
        messageId: messageid,
        contentLength: content.length,
        editHistoryCount: editHistory?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Error handling message edit:', error);
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.MESSAGE_PROCESSING_FAILED,
          'Failed to process message edit',
          { editData, error }
        )
      );
    }
  }

  /**
   * Send a message
   */
  async sendMessage(messageData) {
    try {
      const socketService = await this.getSocketService();
      if (socketService.isConnected()) {
        return await socketService.sendMessage(messageData);
      } else {
        throw new Error('Socket not connected');
      }
    } catch (error) {
      console.error('❌ MessageService: Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  handleIncomingMessage(incomingMessage) {
    try {
      console.log('📨 Received message:', incomingMessage.id);
      
      // Process the message
      const processedMessage = this.normalizeMessage(incomingMessage);
      
      // Check if message already exists (duplicate handling)
      if (this.messages.has(processedMessage.id)) {
        console.log('⚠️ Duplicate message received:', processedMessage.id);
        return;
      }

      // Add to store
      this.storeActions.addMessage(processedMessage);
      
      // Update unread count
      const currentUnread = this.storeActions.getUnreadCount(processedMessage.chatId);
      this.storeActions.updateUnreadCount(processedMessage.chatId, currentUnread + 1);
      
      // Auto-mark as read if chat is active and auto-read is enabled
      if (this.config.autoMarkAsRead && this.isActiveChat(processedMessage.chatId)) {
        setTimeout(() => {
          this.markMessageAsRead(processedMessage.id);
        }, 1000);
      }

      // Emit events
      this.emit('message_received', processedMessage);
      this.emit('message_added', processedMessage);
      
      // Show notification if chat is not active
      if (!this.isActiveChat(processedMessage.chatId)) {
        this.showMessageNotification(processedMessage);
      }

      // Cache the message
      this.cacheMessage(processedMessage);
      
      this.stats.messagesReceived++;
      this.storeActions.updateMessageStats({ messagesReceived: this.stats.messagesReceived });

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Error handling incoming message',
          { message: incomingMessage, error }
        )
      );
    }
  }

  /**
   * Handle message status update
   */
  handleMessageStatusUpdate(statusUpdate) {
    try {
      const { tempId, messageId, status, sentAt, deliveredAt, seenAt, error } = statusUpdate;
      
      // Find message by temp ID or message ID
      let message = null;
      if (tempId) {
        message = Array.from(this.messages.values()).find(msg => msg.tempId === tempId);
      } else if (messageId) {
        message = this.messages.get(messageId);
      }

      if (!message) {
        console.warn('⚠️ Message not found for status update:', statusUpdate);
        return;
      }

      // Update message properties
      if (messageId && !message.id) {
        message.id = messageId;
        // Re-index by real ID
        this.messages.delete(message.tempId);
        this.messages.set(messageId, message);
        this.storeActions.updateMessage(message);
      }

      message.deliveryStatus = status;
      
      if (sentAt) {
        message.sentAt = sentAt;
        message.state = MESSAGE_STATES.SENT;
      }
      
      if (deliveredAt) {
        message.deliveredAt = deliveredAt;
        message.state = MESSAGE_STATES.DELIVERED;
      }
      
      if (seenAt) {
        message.seenAt = seenAt;
        message.state = MESSAGE_STATES.READ;
      }
      
      if (error) {
        message.error = error;
        message.state = MESSAGE_STATES.FAILED;
      }

      // Update statistics
      switch (status) {
        case MESSAGE_STATUS.DELIVERED:
          this.stats.messagesDelivered++;
          this.storeActions.updateMessageStats({ messagesDelivered: this.stats.messagesDelivered });
          break;
        case MESSAGE_STATUS.SEEN:
          this.stats.messagesRead++;
          this.storeActions.updateMessageStats({ messagesRead: this.stats.messagesRead });
          break;
        case MESSAGE_STATUS.FAILED:
          this.stats.failedMessages++;
          this.storeActions.updateMessageStats({ failedMessages: this.stats.failedMessages });
          break;
      }

      // Update cache
      this.cacheMessage(message);
      
      // Emit event
      this.emit('message_status_updated', {
        messageId: message.id || message.tempId,
        status,
        message
      });

      console.log(`📋 Message status updated: ${message.id || message.tempId} -> ${status}`);

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Error handling message status update',
          { statusUpdate, error }
        )
      );
    }
  }

  /**
   * Handle message delete confirmation
   */
  handleMessageDelete(deleteData) {
    try {
      const { messageid, deleteForEveryone } = deleteData;
      
      // Update local message state
      const message = this.messages.get(messageid);
      if (message) {
        message.isDeleted = true;
        message.deletedAt = Date.now();
        
        // If deleted for everyone, update for all users
        if (deleteForEveryone) {
          message.deletedForEveryone = true;
        }
        
        // Update store
        this.storeActions.updateMessage(message);
        this.cacheMessage(message);
      }
      
      console.log('🗑️ Message deleted locally:', { messageid, deleteForEveryone });
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Error handling message delete',
          { deleteData, error }
        )
      );
    }
  }

  /**
   * Handle message deleted by others
   */
  handleMessageDeleteByOthers(deleteData) {
    try {
      const { messageid, isDeleted, deletedBy, deletedAt, deleteForEveryone } = deleteData;
      
      // Update local message state
      const message = this.messages.get(messageid);
      if (message) {
        message.isDeleted = isDeleted;
        message.deletedBy = deletedBy;
        message.deletedAt = deletedAt ? new Date(deletedAt).getTime() : Date.now();
        
        // If deleted for everyone, update for all users
        if (deleteForEveryone) {
          message.deletedForEveryone = true;
        }
        
        // Update store
        this.storeActions.updateMessage(message);
        this.cacheMessage(message);
      }
      
      console.log('🗑️ Message deleted by others:', deleteData);
      
      // Emit event for UI updates
      this.emit('message_deleted_by_others', deleteData);
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Error handling message delete by others',
          { deleteData, error }
        )
      );
    }
  }

  /**
   * Handle typing start
   */
  handleTypingStart(data) {
    const { chatId, userId } = data;
    
    this.storeActions.addTypingUser(chatId, userId);
    
    // Clear existing timer
    const timerId = `${chatId}_${userId}`;
    if (this.typingTimers.has(timerId)) {
      clearTimeout(this.typingTimers.get(timerId));
    }
    
    // Set timeout to auto-stop typing
    const timer = setTimeout(() => {
      this.handleTypingStop(data);
    }, this.config.typingTimeout);
    
    this.typingTimers.set(timerId, timer);
    
    const typingUsers = this.storeActions.getTypingUsers(chatId);
    this.emit('typing_start', { chatId, userId, typingUsers });
  }

  /**
   * Handle typing stop
   */
  handleTypingStop(data) {
    const { chatId, userId } = data;
    
    this.storeActions.removeTypingUser(chatId, userId);
    
    // Clear timer
    const timerId = `${chatId}_${userId}`;
    if (this.typingTimers.has(timerId)) {
      clearTimeout(this.typingTimers.get(timerId));
      this.typingTimers.delete(timerId);
    }
    
    const typingUsers = this.storeActions.getTypingUsers(chatId);
    this.emit('typing_stop', { 
      chatId, 
      userId, 
      typingUsers
    });
  }

  /**
   * Handle system message
   */
  handleSystemMessage(message) {
    const systemMessage = {
      ...message,
      type: MESSAGE_TYPES.SYSTEM,
      state: MESSAGE_STATES.DELIVERED,
      deliveryStatus: MESSAGE_STATUS.DELIVERED
    };
    
    this.storeActions.addMessage(systemMessage);
    this.emit('system_message', systemMessage);
    this.emit('message_added', systemMessage);
  }

  /**
   * Handle chat joined
   */
  handleChatJoined(data) {
    try {
      console.log('📥 Chat joined:', data);
      
      // Emit event for UI updates
      this.emit('chat_joined', data);
      
    } catch (error) {
      console.error('❌ Error handling chat joined:', error);
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Error handling chat joined',
          { data, error }
        )
      );
    }
  }

  /**
   * Start typing indicator
   */
  async sendTypingStart(chatId) {
    try {
      const socketService = await this.getSocketService();
      if (socketService.isConnected()) {
        socketService.sendTypingStart(chatId);
      }
    } catch (error) {
      console.error('❌ MessageService: Failed to send typing start:', error);
    }
  }

  /**
   * Stop typing indicator
   */
  async sendTypingStop(chatId) {
    try {
      const socketService = await this.getSocketService();
      if (socketService.isConnected()) {
        socketService.sendTypingStop(chatId);
      }
    } catch (error) {
      console.error('❌ MessageService: Failed to send typing stop:', error);
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Update local state
      message.state = MESSAGE_STATES.READ;
      this.storeActions.updateLastReadMessage(message.chatId, messageId);
      
      // Send read receipt if connected
      if (socketService.isConnected()) {
        socketService.sendMessageSeen(messageId);
      }
      
      // Update unread count
      const currentUnread = this.storeActions.getUnreadCount(message.chatId);
      this.storeActions.updateUnreadCount(message.chatId, Math.max(0, currentUnread - 1));
      
      // Cache update
      this.cacheMessage(message);
      
      this.emit('message_read', { messageId, chatId: message.chatId });
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.BUSINESS_RULE_VIOLATION,
          'Failed to mark message as read',
          { messageId, error }
        )
      );
    }
  }

  /**
   * Mark all messages in chat as read
   */
  async markChatAsRead(chatId) {
    try {
      const chatMessages = this.getMessagesForChat(chatId);
      const unreadMessages = chatMessages.filter(msg => msg.state !== MESSAGE_STATES.READ);
      
      for (const message of unreadMessages) {
        await this.markMessageAsRead(message.id || message.tempId);
      }
      
      // Reset unread count
      this.storeActions.updateUnreadCount(chatId, 0);
      
      this.emit('chat_read', { chatId, messageCount: unreadMessages.length });
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.BUSINESS_RULE_VIOLATION,
          'Failed to mark chat as read',
          { chatId, error }
        )
      );
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId, deleteForEveryone = false) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check permissions
      const currentUser = authService.getCurrentUser();
      if (message.senderId !== currentUser.id && !deleteForEveryone) {
        throw new Error('Cannot delete message - insufficient permissions');
      }

      // Update local state
      message.deletedAt = Date.now();
      message.state = MESSAGE_STATES.DELETED;
      
      // Send delete request if connected
      if (socketService.isConnected()) {
        socketService.socket.emit('delete_message', {
          messageId,
          chatId: message.chatId,
          deleteForEveryone
        });
      }
      
      // Update cache
      this.cacheMessage(message);
      
      this.emit('message_deleted', { messageId, chatId: message.chatId, deleteForEveryone });
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.AUTH_PERMISSION_DENIED,
          'Failed to delete message',
          { messageId, deleteForEveryone, error }
        )
      );
      throw error;
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId, newContent) {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check permissions
      const currentUser = authService.getCurrentUser();
      if (message.senderId !== currentUser.id) {
        throw new Error('Cannot edit message - insufficient permissions');
      }

      // Update local state
      message.content = newContent;
      message.editedAt = Date.now();
      
      // Send edit request if connected
      if (socketService.isConnected()) {
        socketService.socket.emit('edit_message', {
          messageId,
          chatId: message.chatId,
          content: newContent
        });
      }
      
      // Update cache
      this.cacheMessage(message);
      
      this.storeActions.updateMessage(message);
      this.emit('message_edited', { messageId, chatId: message.chatId, content: newContent });
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.AUTH_PERMISSION_DENIED,
          'Failed to edit message',
          { messageId, newContent, error }
        )
      );
      throw error;
    }
  }

  /**
   * Forward message
   */
  async forwardMessage(messageId, targetChatIds) {
    try {
      const originalMessage = this.messages.get(messageId);
      if (!originalMessage) {
        throw new Error('Message not found');
      }

      const forwardPromises = targetChatIds.map(chatId => {
        return this.sendMessage(chatId, {
          type: originalMessage.type,
          content: originalMessage.content,
          metadata: { ...originalMessage.metadata, originalMessageId: messageId },
          forwarded: true
        });
      });

      const results = await Promise.allSettled(forwardPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      this.emit('messages_forwarded', { 
        originalMessageId: messageId, 
        successful, 
        failed, 
        targetChats: targetChatIds 
      });
      
      return { successful, failed };

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.BUSINESS_RULE_VIOLATION,
          'Failed to forward message',
          { messageId, targetChatIds, error }
        )
      );
      throw error;
    }
  }

  /**
   * Get messages for a chat
   */
  getMessagesForChat(chatId, limit = 50, offset = 0) {
    try {
      const messages = this.storeActions.getMessagesForChat(chatId, limit, offset);
      
      // Filter out deleted messages
      const currentUser = authService.getCurrentUser();
      const filteredMessages = messages.filter(message => {
        // If message is not deleted, include it
        if (!message.isDeleted) {
          return true;
        }
        
        // If message is deleted for everyone, exclude it
        if (message.deletedForEveryone) {
          return false;
        }
        
        // If message is deleted for me, exclude it
        if (message.deletedForMe) {
          return false;
        }
        
        // Include message by default
        return true;
      });
      
      return filteredMessages;
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Error getting messages for chat',
          { chatId, limit, offset, error }
        )
      );
      return [];
    }
  }

  /**
   * Get chat unread count
   */
  getUnreadCount(chatId) {
    return this.storeActions.getUnreadCount(chatId);
  }

  /**
   * Get total unread count
   */
  getTotalUnreadCount() {
    let total = 0;
    for (const [chatId, count] of this.unreadCounts) {
      total += count;
    }
    return total;
  }

  /**
   * Get typing users for chat
   */
  getTypingUsers(chatId) {
    return this.storeActions.getTypingUsers(chatId);
  }

  /**
   * Search messages with enhanced capabilities
   */
  searchMessages(query, options = {}) {
    try {
      const {
        chatId = null,
        type = null,
        senderId = null,
        fromDate = null,
        toDate = null,
        limit = 100,
        filters = {}
      } = options;

      // Use the enhanced search service for better performance
      let results = Array.from(this.messages.values());
      
      // Apply basic filters first
      if (chatId) {
        results = results.filter(msg => msg.chatId === chatId);
      }

      if (type) {
        results = results.filter(msg => msg.type === type);
      }

      if (senderId) {
        results = results.filter(msg => msg.senderId === senderId);
      }

      if (fromDate) {
        results = results.filter(msg => msg.timestamp >= fromDate);
      }

      if (toDate) {
        results = results.filter(msg => msg.timestamp <= toDate);
      }

      // Use enhanced search service for text search and advanced filtering
      const searchResults = enhancedSearchService.search(results, query, filters);
      
      // Apply limit
      return searchResults.slice(0, limit);
    } catch (error) {
      console.error('Enhanced search failed, falling back to basic search:', error);
      
      // Fallback to basic search
      return this.basicSearchMessages(query, options);
    }
  }

  /**
   * Basic search as fallback
   */
  basicSearchMessages(query, options = {}) {
    const {
      chatId = null,
      type = null,
      senderId = null,
      fromDate = null,
      toDate = null,
      limit = 100
    } = options;

    let results = Array.from(this.messages.values());

    // Apply filters
    if (chatId) {
      results = results.filter(msg => msg.chatId === chatId);
    }

    if (type) {
      results = results.filter(msg => msg.type === type);
    }

    if (senderId) {
      results = results.filter(msg => msg.senderId === senderId);
    }

    if (fromDate) {
      results = results.filter(msg => msg.timestamp >= fromDate);
    }

    if (toDate) {
      results = results.filter(msg => msg.timestamp <= toDate);
    }

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(msg => {
        if (msg.type === MESSAGE_TYPES.TEXT) {
          return msg.content.toLowerCase().includes(searchTerm);
        }
        return false;
      });
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    return results.slice(0, limit);
  }

  /**
   * Update search index when messages change
   */
  updateSearchIndex() {
    const messages = Array.from(this.messages.values());
    enhancedSearchService.createIndex(messages);
  }

  /**
   * Message processing methods for different types
   */
  async processMessage(message) {
    const processor = this.messageProcessors.get(message.type);
    if (processor) {
      return await processor(message);
    }
    return message;
  }

  processTextMessage(message) {
    // Apply text transformations
    message.content = DataTransformer.Text.normalize(message.content, {
      removeExtraSpaces: true,
      trim: true
    });
    
    // Extract mentions, hashtags, URLs
    message.metadata.mentions = this.extractMentions(message.content);
    message.metadata.hashtags = this.extractHashtags(message.content);
    message.metadata.urls = this.extractUrls(message.content);
    
    return message;
  }

  async processImageMessage(message) {
    // Image processing would go here
    // e.g., thumbnail generation, compression
    if (message.metadata.file) {
      // Generate thumbnail if not present
      if (!message.metadata.thumbnail) {
        // This would integrate with file upload service
        // message.metadata.thumbnail = await generateThumbnail(message.metadata.file);
      }
    }
    return message;
  }

  async processVideoMessage(message) {
    // Video processing
    return message;
  }

  async processAudioMessage(message) {
    // Audio processing
    return message;
  }

  async processFileMessage(message) {
    // File processing
    return message;
  }

  async processLocationMessage(message) {
    // Location processing
    return message;
  }

  async processContactMessage(message) {
    // Contact processing
    return message;
  }

  async processSystemMessage(message) {
    // System message processing
    return message;
  }

  /**
   * Utility methods
   */
  normalizeMessage(rawMessage) {
    return {
      id: rawMessage.id,
      tempId: rawMessage.tempId || null,
      chatId: rawMessage.chatId,
      senderId: rawMessage.senderId,
      type: rawMessage.type || MESSAGE_TYPES.TEXT,
      content: rawMessage.content,
      metadata: rawMessage.metadata || {},
      timestamp: rawMessage.timestamp || Date.now(),
      state: MESSAGE_STATES.DELIVERED,
      deliveryStatus: MESSAGE_STATUS.DELIVERED,
      readBy: rawMessage.readBy || [],
      editedAt: rawMessage.editedAt || null,
      deletedAt: rawMessage.deletedAt || null,
      replyTo: rawMessage.replyTo || null,
      forwarded: rawMessage.forwarded || false
    };
  }

  /**
   * Sync operations
   */
  async syncMessages() {
    if (this.isSyncing) return;
    
    this.storeActions.setSyncing(true);
    
    try {
      console.log('🔄 Starting message sync...');
      
      // Sync offline messages first
      await this.syncOfflineMessages();
      
      // Sync missed messages
      await this.syncMissedMessages();
      
      this.lastSyncTime = Date.now();
      this.storeActions.setLastSyncTime(this.lastSyncTime);
      this.stats.syncOperations++;
      this.storeActions.updateMessageStats({ syncOperations: this.stats.syncOperations });
      
      this.storeActions.setSyncStatus('synced');
      this.emit('sync_completed', { timestamp: this.lastSyncTime });
      
      console.log('✅ Message sync completed');
      
    } catch (error) {
      this.storeActions.setSyncStatus('error');
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.NETWORK_ERROR,
          'Message sync failed',
          { error }
        )
      );
    } finally {
      this.storeActions.setSyncing(false);
    }
  }

  async syncOfflineMessages() {
    try {
      const socketService = await this.getSocketService();
      if (!socketService.isConnected()) return;
      
      // Process offline messages
      for (const [tempId, message] of this.offlineMessages.entries()) {
        try {
          await socketService.sendMessage({
            ...message,
            tempId // Include tempId for correlation
          });
          
          // Remove from offline queue on success
          this.removeOfflineMessage(tempId);
        } catch (sendError) {
          console.warn('⚠️ MessageService: Failed to sync offline message:', sendError);
          // Keep message in queue for retry
        }
      }
    } catch (error) {
      console.error('❌ MessageService: Failed to sync offline messages:', error);
    }
  }

  async syncMissedMessages() {
    if (!socketService.isConnected()) return;
    
    // Request missed messages since last sync
    const lastSync = this.lastSyncTime || Date.now() - (24 * 60 * 60 * 1000); // 24h default
    
    socketService.socket.emit('sync_messages', {
      since: lastSync,
      userId: authService.getCurrentUser()?.id
    });
  }

  startSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      if (this.isOnline && socketService.isConnected()) {
        this.syncMessages();
      }
    }, this.config.syncInterval);
  }

  /**
   * Extract URLs from text content
   * @param {string} text - Text content to extract URLs from
   * @returns {Array} Array of extracted URLs
   */
  extractUrls(text) {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }
}

export default MessageService;
