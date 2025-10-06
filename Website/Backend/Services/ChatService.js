/**
 * 🎯 Enhanced Chat Service with Comprehensive Features
 * 
 * Features:
 * - Priority-based offline message queue with TTL
 * - Message deduplication by client message ID
 * - Smart typing indicators with auto-timeout
 * - Batched read receipts
 * - Optimized room management
 * - Message reaction batching
 * 
 * @module ChatService
 * @version 2.0.0
 */

class ChatService {
  constructor() {
    // Offline message queue with priority
    this.offlineMessageQueue = new Map(); // userId -> PriorityQueue
    this.messageDeduplication = new Map(); // clientMessageId -> serverMessageId
    
    // Typing indicators with auto-timeout
    this.typingIndicators = new Map(); // chatId -> Map(userId -> timeoutId)
    this.typingTimeouts = new Map(); // userId-chatId -> timeoutId
    
    // Read receipt batching
    this.readReceiptBatch = new Map(); // chatId -> Set(messageIds)
    this.readReceiptTimers = new Map(); // chatId -> timeoutId
    
    // Room join cache
    this.roomParticipants = new Map(); // chatId -> Set(userIds)
    
    // Message reaction batching
    this.reactionBatch = new Map(); // messageId -> Map(userId -> emoji)
    this.reactionTimers = new Map(); // messageId -> timeoutId
    
    // Configuration
    this.config = {
      offlineMessageMaxPerUser: 100,
      offlineMessageTTL: 24 * 60 * 60 * 1000, // 24 hours
      typingIndicatorTimeout: 3000, // 3 seconds
      readReceiptBatchDelay: 1000, // 1 second
      readReceiptBatchSize: 50,
      reactionBatchDelay: 500, // 500ms
      messageDeduplicationTTL: 60 * 1000 // 1 minute
    };
    
    // Initialize cleanup
    this.initializeCleanup();
  }
  
  /**
   * Initialize periodic cleanup for stale data
   */
  initializeCleanup() {
    // Clean offline message queue every 5 minutes
    setInterval(() => {
      this.cleanupOfflineMessages();
    }, 5 * 60 * 1000);
    
    // Clean message deduplication cache every minute
    setInterval(() => {
      this.cleanupDeduplicationCache();
    }, 60 * 1000);
    
    // Clean stale typing indicators every 10 seconds
    setInterval(() => {
      this.cleanupTypingIndicators();
    }, 10 * 1000);
  }
  
  /**
   * Add message to offline queue with priority
   * @param {string} userId - Target user ID
   * @param {Object} message - Message data
   * @param {number} priority - Message priority (1=high, 2=normal, 3=low)
   */
  queueOfflineMessage(userId, message, priority = 2) {
    if (!this.offlineMessageQueue.has(userId)) {
      this.offlineMessageQueue.set(userId, []);
    }
    
    const queue = this.offlineMessageQueue.get(userId);
    
    // Add with timestamp and priority
    queue.push({
      message,
      priority,
      timestamp: Date.now(),
      ttl: Date.now() + this.config.offlineMessageTTL
    });
    
    // Sort by priority (lower number = higher priority) then timestamp
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.timestamp - b.timestamp;
    });
    
    // Enforce size limit
    if (queue.length > this.config.offlineMessageMaxPerUser) {
      queue.splice(this.config.offlineMessageMaxPerUser);
    }
    
    console.log(`📬 Queued offline message for ${userId} (Priority: ${priority}, Queue size: ${queue.length})`);
  }
  
  /**
   * Get and clear offline messages for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of messages
   */
  getOfflineMessages(userId) {
    const queue = this.offlineMessageQueue.get(userId);
    if (!queue || queue.length === 0) {
      return [];
    }
    
    // Clear the queue
    this.offlineMessageQueue.delete(userId);
    
    // Filter out expired messages
    const now = Date.now();
    const validMessages = queue
      .filter(item => item.ttl > now)
      .map(item => item.message);
    
    console.log(`📮 Delivering ${validMessages.length} offline messages to ${userId}`);
    return validMessages;
  }
  
  /**
   * Check if message is duplicate
   * @param {string} clientMessageId - Client-generated message ID
   * @returns {string|null} Server message ID if duplicate, null otherwise
   */
  checkMessageDuplicate(clientMessageId) {
    if (!clientMessageId) return null;
    
    return this.messageDeduplication.get(clientMessageId) || null;
  }
  
  /**
   * Register message to prevent duplicates
   * @param {string} clientMessageId - Client-generated message ID
   * @param {string} serverMessageId - Server-generated message ID
   */
  registerMessage(clientMessageId, serverMessageId) {
    if (!clientMessageId) return;
    
    this.messageDeduplication.set(clientMessageId, {
      serverMessageId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Start typing indicator for user in chat
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @param {Function} callback - Callback to clear indicator
   */
  startTyping(chatId, userId, callback) {
    const key = `${userId}-${chatId}`;
    
    // Clear existing timeout
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key));
    }
    
    // Set new timeout to auto-clear
    const timeoutId = setTimeout(() => {
      this.stopTyping(chatId, userId);
      if (callback) callback();
    }, this.config.typingIndicatorTimeout);
    
    this.typingTimeouts.set(key, timeoutId);
    
    // Track in chat-level map
    if (!this.typingIndicators.has(chatId)) {
      this.typingIndicators.set(chatId, new Map());
    }
    this.typingIndicators.get(chatId).set(userId, timeoutId);
    
    console.log(`⌨️  ${userId} started typing in ${chatId}`);
  }
  
  /**
   * Stop typing indicator for user in chat
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   */
  stopTyping(chatId, userId) {
    const key = `${userId}-${chatId}`;
    
    // Clear timeout
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key));
      this.typingTimeouts.delete(key);
    }
    
    // Remove from chat-level map
    if (this.typingIndicators.has(chatId)) {
      this.typingIndicators.get(chatId).delete(userId);
      
      if (this.typingIndicators.get(chatId).size === 0) {
        this.typingIndicators.delete(chatId);
      }
    }
    
    console.log(`⌨️  ${userId} stopped typing in ${chatId}`);
  }
  
  /**
   * Add read receipt to batch
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID
   * @param {Function} flushCallback - Callback when batch is flushed
   */
  addReadReceipt(chatId, messageId, flushCallback) {
    if (!this.readReceiptBatch.has(chatId)) {
      this.readReceiptBatch.set(chatId, new Set());
    }
    
    this.readReceiptBatch.get(chatId).add(messageId);
    
    // Clear existing timer
    if (this.readReceiptTimers.has(chatId)) {
      clearTimeout(this.readReceiptTimers.get(chatId));
    }
    
    // Set timer to flush batch
    const timeoutId = setTimeout(() => {
      this.flushReadReceipts(chatId, flushCallback);
    }, this.config.readReceiptBatchDelay);
    
    this.readReceiptTimers.set(chatId, timeoutId);
    
    // Force flush if batch size exceeded
    if (this.readReceiptBatch.get(chatId).size >= this.config.readReceiptBatchSize) {
      clearTimeout(timeoutId);
      this.flushReadReceipts(chatId, flushCallback);
    }
  }
  
  /**
   * Flush read receipt batch
   * @param {string} chatId - Chat ID
   * @param {Function} callback - Callback with message IDs
   */
  flushReadReceipts(chatId, callback) {
    const batch = this.readReceiptBatch.get(chatId);
    if (!batch || batch.size === 0) return;
    
    const messageIds = Array.from(batch);
    this.readReceiptBatch.delete(chatId);
    this.readReceiptTimers.delete(chatId);
    
    console.log(`📖 Flushing ${messageIds.length} read receipts for chat ${chatId}`);
    
    if (callback) {
      callback(messageIds);
    }
  }
  
  /**
   * Add reaction to batch
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} emoji - Emoji reaction
   * @param {Function} flushCallback - Callback when batch is flushed
   */
  addReaction(messageId, userId, emoji, flushCallback) {
    if (!this.reactionBatch.has(messageId)) {
      this.reactionBatch.set(messageId, new Map());
    }
    
    this.reactionBatch.get(messageId).set(userId, emoji);
    
    // Clear existing timer
    if (this.reactionTimers.has(messageId)) {
      clearTimeout(this.reactionTimers.get(messageId));
    }
    
    // Set timer to flush batch
    const timeoutId = setTimeout(() => {
      this.flushReactions(messageId, flushCallback);
    }, this.config.reactionBatchDelay);
    
    this.reactionTimers.set(messageId, timeoutId);
  }
  
  /**
   * Flush reaction batch
   * @param {string} messageId - Message ID
   * @param {Function} callback - Callback with reactions
   */
  flushReactions(messageId, callback) {
    const batch = this.reactionBatch.get(messageId);
    if (!batch || batch.size === 0) return;
    
    const reactions = Array.from(batch.entries()).map(([userId, emoji]) => ({
      userId,
      emoji
    }));
    
    this.reactionBatch.delete(messageId);
    this.reactionTimers.delete(messageId);
    
    console.log(`😀 Flushing ${reactions.length} reactions for message ${messageId}`);
    
    if (callback) {
      callback(reactions);
    }
  }
  
  /**
   * Cleanup expired offline messages
   */
  cleanupOfflineMessages() {
    const now = Date.now();
    let totalCleaned = 0;
    
    for (const [userId, queue] of this.offlineMessageQueue.entries()) {
      const validMessages = queue.filter(item => item.ttl > now);
      
      if (validMessages.length === 0) {
        this.offlineMessageQueue.delete(userId);
        totalCleaned += queue.length;
      } else if (validMessages.length < queue.length) {
        this.offlineMessageQueue.set(userId, validMessages);
        totalCleaned += queue.length - validMessages.length;
      }
    }
    
    if (totalCleaned > 0) {
      console.log(`🧹 Cleaned ${totalCleaned} expired offline messages`);
    }
  }
  
  /**
   * Cleanup expired deduplication cache
   */
  cleanupDeduplicationCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [clientMessageId, data] of this.messageDeduplication.entries()) {
      if (now - data.timestamp > this.config.messageDeduplicationTTL) {
        this.messageDeduplication.delete(clientMessageId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired deduplication entries`);
    }
  }
  
  /**
   * Cleanup stale typing indicators
   */
  cleanupTypingIndicators() {
    // This is handled by individual timeouts, but we clean up any orphaned entries
    const staleKeys = [];
    
    for (const [key, timeoutId] of this.typingTimeouts.entries()) {
      // Check if timeout is still valid (defensive cleanup)
      if (!timeoutId) {
        staleKeys.push(key);
      }
    }
    
    staleKeys.forEach(key => this.typingTimeouts.delete(key));
    
    if (staleKeys.length > 0) {
      console.log(`🧹 Cleaned ${staleKeys.length} stale typing indicators`);
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      offlineQueues: this.offlineMessageQueue.size,
      totalQueuedMessages: Array.from(this.offlineMessageQueue.values())
        .reduce((sum, queue) => sum + queue.length, 0),
      deduplicationCacheSize: this.messageDeduplication.size,
      activeTypingIndicators: Array.from(this.typingIndicators.values())
        .reduce((sum, map) => sum + map.size, 0),
      pendingReadReceipts: Array.from(this.readReceiptBatch.values())
        .reduce((sum, set) => sum + set.size, 0),
      pendingReactions: Array.from(this.reactionBatch.values())
        .reduce((sum, map) => sum + map.size, 0)
    };
  }
}

export default new ChatService();