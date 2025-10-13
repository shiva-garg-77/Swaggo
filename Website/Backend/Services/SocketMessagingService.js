import BaseService from './BaseService.js';
import MessageService from './MessageService.js';
import Chat from '../Models/FeedModels/Chat.js';
import Message from '../Models/FeedModels/Message.js';
import Profile from '../Models/FeedModels/Profile.js';
import LRUCache from '../Utils/LRUCache.js';
import XSSSanitizer from '../Utils/XSSSanitizer.js';
import { logger } from '../utils/SanitizedLogger.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../Helper/UnifiedErrorHandling.js';
import { v4 as uuidv4 } from 'uuid';
import EventBus from './EventBus.js';

/**
 * @fileoverview Socket messaging service handling real-time messaging, typing indicators, and offline messages
 * @module SocketMessagingService
 * @version 1.0.0
 * @author Swaggo Development Team
 */

class SocketMessagingService extends BaseService {
  /**
   * @constructor
   * @description Initialize socket messaging service with memory-optimized data structures
   */
  constructor() {
    super();
    
    // Services will be injected by the DI container
    this.messageService = null;
    this.eventBus = null;
    
    // Memory-optimized maps with size limits
    this.mapSizeLimits = {
      offlineMessageQueue: 5000,
      recentMessageIds: 5000,
      typingTimeouts: 1000
    };
    
    // Offline message queue with TTL management
    this.offlineMessageQueue = new LRUCache(this.mapSizeLimits.offlineMessageQueue); // profileid -> [messages]
    
    // Duplicate detection - burst protection only
    this.recentMessageIds = new LRUCache(this.mapSizeLimits.recentMessageIds); // clientMessageId+chatid -> timestamp
    this.recentMessageIdsMaxSize = 5000; // Reduced memory footprint
    this.recentMessageIdsWindowMs = 30000; // 30 seconds burst protection
    
    // Typing indicators auto-stop timeouts
    this.typingTimeouts = new Map(); // `${profileid}_${chatid}` -> timeout handle
    
    // Resource limits for memory management
    this.resourceLimits = {
      maxOfflineMessagesPerUser: 25, // Reduced to prevent memory bloat
      maxOfflineUsers: 1000,
      offlineMessageTtl: 12 * 60 * 60 * 1000, // 12 hours
      maxMessageQueueAge: 2 * 60 * 60 * 1000, // 2 hours max age for queued messages
      cleanupInterval: {
        messages: 2 * 60 * 1000, // 2 minutes
        recentIds: 30 * 1000 // 30 seconds
      }
    };
    
    // Initialize cleanup systems
    this.cleanupIntervals = {
      messages: null,
      recentIds: null
    };
    
    // Initialize cleanup systems (will be called after injection)
    // this.initializeCleanupSystems();
  }

  /**
   * Initialize cleanup systems for messaging
   */
  initializeCleanupSystems() {
    this.logger.info('🧹 Initializing messaging cleanup systems...');
    
    // Offline messages cleanup
    this.cleanupIntervals.messages = setInterval(() => {
      this.cleanupOfflineMessagesEnhanced();
    }, this.resourceLimits.cleanupInterval.messages);
    
    // Recent message IDs cleanup
    this.cleanupIntervals.recentIds = setInterval(() => {
      this.cleanupMessageProcessingCache();
    }, this.resourceLimits.cleanupInterval.recentIds);
    
    this.logger.info('✅ Messaging cleanup systems initialized');
  }

  /**
   * Handle sending a message
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} data - Message data
   * @param {Function} callback - Acknowledgment callback
   * @returns {Promise<void>}
   */
  async handleSendMessage(socket, io, data, callback) {
    return this.handleOperation(async () => {
      const { chatid, content, messageType = 'text', clientMessageId, replyTo, mentions = [] } = data;
      const profileId = socket.user.profileid;
      const username = socket.user.username;

      // Validate required fields
      this.validateRequiredParams({ chatid, content, profileId }, ['chatid', 'content', 'profileId']);

      // Check for duplicate message (burst protection)
      const duplicateKey = `${clientMessageId}_${chatid}`;
      const now = Date.now();
      
      if (this.recentMessageIds.has(duplicateKey)) {
        const lastTimestamp = this.recentMessageIds.get(duplicateKey);
        if (now - lastTimestamp < this.recentMessageIdsWindowMs) {
          this.logger.warn(`🚨 Duplicate message blocked: ${duplicateKey}`, {
            profileId,
            chatid,
            timeSinceFirst: now - lastTimestamp
          });
          
          if (callback) callback({ success: false, error: 'Duplicate message' });
          return;
        }
      }
      
      // Store message ID for duplicate detection
      this.recentMessageIds.set(duplicateKey, now);

      try {
        // Validate chat access
        const chat = await Chat.findOne({ chatid, isActive: true });
        if (!chat || !chat.isParticipant(profileId)) {
          throw new AuthorizationError('Cannot send message to this chat');
        }

        // Sanitize message content
        const sanitizedContent = XSSSanitizer.sanitizeMessageContent(content);

        // Create message using MessageService
        const messageData = {
          content: sanitizedContent,
          messageType,
          replyTo,
          mentions
        };
        
        const savedMessage = await this.messageService.sendMessage(chatid, profileId, messageData);

        // Emit message to all participants in the chat
        const messageForEmit = {
          ...savedMessage,
          senderUsername: username,
          timestamp: new Date().toISOString()
        };

        // Send to all participants
        io.to(chatid).emit('message_received', messageForEmit);

        // Handle offline participants - queue messages
        await this.queueMessageForOfflineUsers(chat, savedMessage, io);

        // Send acknowledgment
        if (callback) {
          callback({
            success: true,
            message: savedMessage,
            timestamp: new Date().toISOString()
          });
        }

        this.logger.info(`📤 Message sent: ${username} in chat ${chatid}`, {
          messageId: savedMessage.messageid,
          messageType
        });
        
        // Emit message sent event
        this.eventBus.emit('message.sent', {
          messageId: savedMessage.messageid,
          chatId: chatid,
          senderId: profileId,
          senderUsername: username,
          content: sanitizedContent,
          messageType,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        this.logger.error('Error sending message:', {
          error: error.message,
          profileId,
          chatid,
          stack: error.stack
        });

        if (callback) {
          callback({
            success: false,
            error: error.message || 'Failed to send message'
          });
        }

        throw error;
      }
    }, 'handleSendMessage', { profileId: socket.user?.profileid, chatid: data.chatid });
  }

  /**
   * Handle batch message sending
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} data - Batch message data
   * @param {Function} callback - Acknowledgment callback
   * @returns {Promise<void>}
   */
  async handleSendBatchedMessages(socket, io, data, callback) {
    return this.handleOperation(async () => {
      const { messages } = data;
      const results = [];

      if (!messages || !Array.isArray(messages)) {
        throw new ValidationError('Messages array is required for batch sending');
      }

      // Limit batch size to prevent abuse
      if (messages.length > 10) {
        throw new ValidationError('Batch size cannot exceed 10 messages');
      }

      for (const messageData of messages) {
        try {
          await this.handleSendMessage(socket, io, messageData, null);
          results.push({ success: true, clientMessageId: messageData.clientMessageId });
        } catch (error) {
          results.push({ 
            success: false, 
            error: error.message, 
            clientMessageId: messageData.clientMessageId 
          });
        }
      }

      if (callback) {
        callback({
          success: true,
          results,
          processed: results.length
        });
      }
    }, 'handleSendBatchedMessages', { profileId: socket.user?.profileid });
  }

  /**
   * Handle typing start indicator
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {string} chatid - Chat ID
   * @returns {Promise<void>}
   */
  async handleTypingStart(socket, io, chatid) {
    return this.handleOperation(async () => {
      const profileId = socket.user.profileid;
      const username = socket.user.username;

      // Validate chat access
      const chat = await Chat.findOne({ chatid, isActive: true });
      if (!chat || !chat.isParticipant(profileId)) {
        throw new AuthorizationError('Cannot send typing indicator to this chat');
      }

      // Emit typing indicator to other participants
      socket.to(chatid).emit('typing_start', {
        chatid,
        profileid: profileId,
        username,
        timestamp: new Date().toISOString()
      });

      // Set auto-stop timeout for typing indicator
      const timeoutKey = `${profileId}_${chatid}`;
      
      // Clear existing timeout if any
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey));
      }

      // Set new timeout (auto-stop after 10 seconds)
      const timeout = setTimeout(() => {
        socket.to(chatid).emit('typing_stop', {
          chatid,
          profileid: profileId,
          username,
          timestamp: new Date().toISOString(),
          reason: 'auto_timeout'
        });
        
        this.typingTimeouts.delete(timeoutKey);
      }, 10000);

      this.typingTimeouts.set(timeoutKey, timeout);

      this.logger.debug(`⌨️ Typing started: ${username} in chat ${chatid}`);
    }, 'handleTypingStart', { profileId: socket.user?.profileid, chatid });
  }

  /**
   * Handle typing stop indicator
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {string} chatid - Chat ID
   * @returns {Promise<void>}
   */
  async handleTypingStop(socket, io, chatid) {
    return this.handleOperation(async () => {
      const profileId = socket.user.profileid;
      const username = socket.user.username;

      // Clear timeout
      const timeoutKey = `${profileId}_${chatid}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey));
        this.typingTimeouts.delete(timeoutKey);
      }

      // Emit typing stop to other participants
      socket.to(chatid).emit('typing_stop', {
        chatid,
        profileid: profileId,
        username,
        timestamp: new Date().toISOString()
      });

      this.logger.debug(`⌨️ Typing stopped: ${username} in chat ${chatid}`);
    }, 'handleTypingStop', { profileId: socket.user?.profileid, chatid });
  }

  /**
   * Handle message read status
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} data - Message read data
   * @returns {Promise<void>}
   */
  async handleMarkMessageRead(socket, io, data) {
    return this.handleOperation(async () => {
      const { messageid, chatid } = data;
      const profileId = socket.user.profileid;

      // Validate required fields
      this.validateRequiredParams({ messageid, chatid }, ['messageid', 'chatid']);

      // Find and update message
      const message = await Message.findOne({ messageid, chatid });
      if (!message) {
        throw new NotFoundError('Message not found');
      }

      // Check if user has access to this chat
      const chat = await Chat.findOne({ chatid });
      if (!chat || !chat.isParticipant(profileId)) {
        throw new AuthorizationError('Cannot mark message as read in this chat');
      }

      // Add read status if not already present
      const existingRead = message.readBy.find(r => r.profileid === profileId);
      if (!existingRead) {
        message.readBy.push({
          profileid: profileId,
          readAt: new Date()
        });
        await message.save();

        // Notify other participants
        socket.to(chatid).emit('message_read', {
          messageid,
          chatid,
          profileid: profileId,
          readAt: new Date().toISOString()
        });
      }
    }, 'handleMarkMessageRead', { profileId: socket.user?.profileid, messageid: data.messageid });
  }

  /**
   * Handle message reaction
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} data - Reaction data
   * @returns {Promise<void>}
   */
  async handleReactToMessage(socket, io, data) {
    return this.handleOperation(async () => {
      const { messageid, emoji } = data;
      const profileId = socket.user.profileid;

      // Use MessageService to add reaction
      const updatedMessage = await this.messageService.reactToMessage(messageid, profileId, emoji);

      // Emit reaction to all participants
      io.to(updatedMessage.chatid).emit('message_reaction', {
        messageid,
        chatid: updatedMessage.chatid,
        profileid: profileId,
        emoji,
        timestamp: new Date().toISOString()
      });
    }, 'handleReactToMessage', { profileId: socket.user?.profileid, messageid: data.messageid });
  }

  /**
   * Queue message for offline users
   * @param {Object} chat - Chat document
   * @param {Object} message - Message document
   * @param {Object} io - Socket.IO server instance
   * @returns {Promise<void>}
   */
  async queueMessageForOfflineUsers(chat, message, io) {
    return this.handleOperation(async () => {
      // Get online users from socket rooms
      const onlineUserIds = new Set();
      const room = io.sockets.adapter.rooms.get(chat.chatid);
      
      if (room) {
        for (const socketId of room) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket && socket.user) {
            onlineUserIds.add(socket.user.profileid);
          }
        }
      }

      // Queue message for offline participants
      for (const participant of chat.participants) {
        if (!onlineUserIds.has(participant.profileid) && participant.profileid !== message.senderid) {
          await this.queueOfflineMessage(participant.profileid, message);
        }
      }
    }, 'queueMessageForOfflineUsers', { chatid: chat.chatid, messageId: message.messageid });
  }

  /**
   * Queue a message for an offline user
   * @param {string} profileId - User profile ID
   * @param {Object} message - Message to queue
   * @returns {Promise<void>}
   */
  async queueOfflineMessage(profileId, message) {
    return this.handleOperation(async () => {
      const queuedMessage = {
        ...message.toObject(),
        queuedAt: new Date()
      };

      let userQueue = this.offlineMessageQueue.get(profileId) || [];
      userQueue.push(queuedMessage);

      // Enforce per-user limit
      if (userQueue.length > this.resourceLimits.maxOfflineMessagesPerUser) {
        userQueue = userQueue.slice(-this.resourceLimits.maxOfflineMessagesPerUser);
      }

      this.offlineMessageQueue.set(profileId, userQueue);
      
      this.logger.debug(`📥 Message queued for offline user ${profileId}`, {
        messageId: message.messageid,
        queueSize: userQueue.length
      });
    }, 'queueOfflineMessage', { profileId, messageId: message.messageid });
  }

  /**
   * Deliver offline messages to a user
   * @param {string} profileId - User profile ID
   * @param {Object} socket - Socket.IO socket instance
   * @returns {Promise<void>}
   */
  async deliverOfflineMessages(profileId, socket) {
    return this.handleOperation(async () => {
      const userQueue = this.offlineMessageQueue.get(profileId);
      
      if (!userQueue || userQueue.length === 0) {
        return;
      }

      this.logger.info(`📬 Delivering ${userQueue.length} offline messages to user ${profileId}`);

      // Send each queued message
      for (const message of userQueue) {
        socket.emit('offline_message_delivered', {
          ...message,
          deliveredAt: new Date().toISOString(),
          wasOffline: true
        });
      }

      // Clear the queue
      this.offlineMessageQueue.delete(profileId);

      this.logger.info(`✅ Delivered ${userQueue.length} offline messages to user ${profileId}`);
    }, 'deliverOfflineMessages', { profileId });
  }

  /**
   * Clean up typing timeouts on disconnect
   * @param {string} profileId - User profile ID
   */
  cleanupTypingTimeouts(profileId) {
    return this.handleOperation(() => {
      if (!this.typingTimeouts || !profileId) return;

      let cleanedCount = 0;
      for (const [key, timeout] of this.typingTimeouts.entries()) {
        if (key.startsWith(`${profileId}_`)) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`🧹 Cleaned up ${cleanedCount} typing timeouts for user ${profileId}`);
      }
    }, 'cleanupTypingTimeouts', { profileId });
  }

  /**
   * Enhanced offline messages cleanup with TTL enforcement
   */
  cleanupOfflineMessagesEnhanced() {
    return this.handleOperation(() => {
      const now = Date.now();
      let totalCleaned = 0;
      let totalMessages = 0;
      
      for (const [profileId, messages] of this.offlineMessageQueue) {
        const originalCount = messages.length;
        totalMessages += originalCount;
        
        // Remove messages older than TTL
        const filteredMessages = messages.filter(msg => {
          const age = now - new Date(msg.queuedAt).getTime();
          return age < this.resourceLimits.offlineMessageTtl;
        });
        
        // Enforce per-user limit
        if (filteredMessages.length > this.resourceLimits.maxOfflineMessagesPerUser) {
          // Keep only the most recent messages
          filteredMessages.splice(0, filteredMessages.length - this.resourceLimits.maxOfflineMessagesPerUser);
        }
        
        const cleanedCount = originalCount - filteredMessages.length;
        totalCleaned += cleanedCount;
        
        if (filteredMessages.length === 0) {
          this.offlineMessageQueue.delete(profileId);
        } else {
          this.offlineMessageQueue.set(profileId, filteredMessages);
        }
      }
      
      // Enforce global offline user limit
      if (this.offlineMessageQueue.size > this.resourceLimits.maxOfflineUsers) {
        const excess = this.offlineMessageQueue.size - this.resourceLimits.maxOfflineUsers;
        const oldestUsers = Array.from(this.offlineMessageQueue.keys()).slice(0, excess);
        oldestUsers.forEach(userId => this.offlineMessageQueue.delete(userId));
        totalCleaned += excess;
      }
      
      if (totalCleaned > 0) {
        this.logger.info(`🧹 Cleaned ${totalCleaned} offline messages`, {
          totalMessages,
          remainingUsers: this.offlineMessageQueue.size
        });
      }
    }, 'cleanupOfflineMessagesEnhanced');
  }

  /**
   * Clean up message processing cache
   */
  cleanupMessageProcessingCache() {
    return this.handleOperation(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      // Clean entries older than window (30 seconds)
      const entries = [];
      for (const [key, value] of this.recentMessageIds.cache.entries()) {
        entries.push([key, value]);
      }
      
      for (const [key, timestamp] of entries) {
        if (now - timestamp > this.recentMessageIdsWindowMs) {
          this.recentMessageIds.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        this.logger.debug(`🧹 Cleaned up ${cleanedCount} old burst duplicate entries`);
      }
    }, 'cleanupMessageProcessingCache');
  }

  /**
   * Get messaging statistics
   * @returns {Object} Messaging statistics
   */
  getMessagingStats() {
    let totalOfflineMessages = 0;
    for (const messages of this.offlineMessageQueue.values()) {
      totalOfflineMessages += messages.length;
    }

    return {
      offlineUsers: this.offlineMessageQueue.size,
      totalOfflineMessages,
      recentMessageIds: this.recentMessageIds.size,
      activeTypingTimeouts: this.typingTimeouts.size
    };
  }

  /**
   * Graceful shutdown - clean up all resources
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    return this.handleOperation(async () => {
      this.logger.info('🛑 SocketMessagingService graceful shutdown initiated...');
      
      // Clear cleanup intervals
      Object.values(this.cleanupIntervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
      
      // Clear all typing timeouts
      for (const timeout of this.typingTimeouts.values()) {
        clearTimeout(timeout);
      }
      this.typingTimeouts.clear();
      
      // Clear all maps
      this.offlineMessageQueue.clear();
      this.recentMessageIds.clear();
      
      this.logger.info('✅ SocketMessagingService shutdown completed');
    }, 'gracefulShutdown');
  }
}

export default SocketMessagingService;