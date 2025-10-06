/**
 * IndexedDB Storage Utility
 * Handles persistent storage for offline messages and application data
 */

class IndexedDBStorage {
  constructor(dbName = 'SwaggoMessenger', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize IndexedDB connection
   */
  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create offline messages store
        if (!db.objectStoreNames.contains('offline_messages')) {
          const messagesStore = db.createObjectStore('offline_messages', { 
            keyPath: 'tempId' 
          });
          messagesStore.createIndex('chatId', 'chatId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
          messagesStore.createIndex('priority', 'priority', { unique: false });
        }

        // Create message queue store
        if (!db.objectStoreNames.contains('message_queue')) {
          const queueStore = db.createObjectStore('message_queue', { 
            keyPath: 'id',
            autoIncrement: true
          });
          queueStore.createIndex('tempId', 'tempId', { unique: false });
          queueStore.createIndex('queuedAt', 'queuedAt', { unique: false });
          queueStore.createIndex('attempts', 'attempts', { unique: false });
        }

        // Create status updates queue store
        if (!db.objectStoreNames.contains('status_updates_queue')) {
          const statusStore = db.createObjectStore('status_updates_queue', { 
            keyPath: 'id',
            autoIncrement: true
          });
          statusStore.createIndex('messageId', 'messageId', { unique: false });
          statusStore.createIndex('queuedAt', 'queuedAt', { unique: false });
        }

        // Create cache store for message data
        if (!db.objectStoreNames.contains('message_cache')) {
          const cacheStore = db.createObjectStore('message_cache', { 
            keyPath: 'messageId' 
          });
          cacheStore.createIndex('chatId', 'chatId', { unique: false });
          cacheStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        console.log('📋 IndexedDB schema upgraded');
      };
    });
  }

  /**
   * Store offline message
   */
  async storeOfflineMessage(message) {
    await this.init();
    
    const transaction = this.db.transaction(['offline_messages'], 'readwrite');
    const store = transaction.objectStore('offline_messages');
    
    const offlineMessage = {
      ...message,
      queuedAt: Date.now(),
      attempts: 0,
      priority: message.priority || 1, // Higher number = higher priority
      maxAttempts: 3
    };

    return new Promise((resolve, reject) => {
      const request = store.put(offlineMessage);
      
      request.onsuccess = () => {
        console.log('💾 Offline message stored:', message.tempId);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to store offline message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all offline messages ordered by priority and timestamp
   */
  async getOfflineMessages(limit = 100) {
    await this.init();
    
    const transaction = this.db.transaction(['offline_messages'], 'readonly');
    const store = transaction.objectStore('offline_messages');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const messages = request.result;
        
        // Sort by priority (desc) then timestamp (asc)
        messages.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return a.timestamp - b.timestamp;
        });
        
        const limitedMessages = limit > 0 ? messages.slice(0, limit) : messages;
        console.log(`📤 Retrieved ${limitedMessages.length} offline messages`);
        resolve(limitedMessages);
      };
      
      request.onerror = () => {
        console.error('Failed to get offline messages:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove offline message after successful send
   */
  async removeOfflineMessage(tempId) {
    await this.init();
    
    const transaction = this.db.transaction(['offline_messages'], 'readwrite');
    const store = transaction.objectStore('offline_messages');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(tempId);
      
      request.onsuccess = () => {
        console.log('🗑️ Offline message removed:', tempId);
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('Failed to remove offline message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update offline message attempts
   */
  async updateMessageAttempts(tempId, attempts) {
    await this.init();
    
    const transaction = this.db.transaction(['offline_messages'], 'readwrite');
    const store = transaction.objectStore('offline_messages');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(tempId);
      
      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          message.attempts = attempts;
          message.lastAttempt = Date.now();
          
          const putRequest = store.put(message);
          putRequest.onsuccess = () => resolve(true);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(false);
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Remove messages that exceeded max attempts
   */
  async cleanupFailedMessages() {
    await this.init();
    
    const transaction = this.db.transaction(['offline_messages'], 'readwrite');
    const store = transaction.objectStore('offline_messages');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const messages = request.result;
        const failedMessages = messages.filter(msg => 
          msg.attempts >= (msg.maxAttempts || 3)
        );
        
        const deletePromises = failedMessages.map(msg => {
          return new Promise((deleteResolve) => {
            const deleteRequest = store.delete(msg.tempId);
            deleteRequest.onsuccess = () => deleteResolve(msg.tempId);
            deleteRequest.onerror = () => deleteResolve(null);
          });
        });
        
        Promise.all(deletePromises).then(results => {
          const cleaned = results.filter(id => id !== null);
          console.log(`🧹 Cleaned ${cleaned.length} failed messages`);
          resolve(cleaned);
        });
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Queue message for processing
   */
  async queueMessage(messageData) {
    await this.init();
    
    const transaction = this.db.transaction(['message_queue'], 'readwrite');
    const store = transaction.objectStore('message_queue');
    
    const queueItem = {
      ...messageData,
      queuedAt: Date.now(),
      attempts: 0,
      priority: messageData.priority || 1
    };

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      
      request.onsuccess = () => {
        console.log('📋 Message queued for processing:', request.result);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to queue message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get queued messages for processing
   */
  async getQueuedMessages(limit = 50) {
    await this.init();
    
    const transaction = this.db.transaction(['message_queue'], 'readonly');
    const store = transaction.objectStore('message_queue');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const messages = request.result;
        
        // Sort by priority (desc) then queuedAt (asc)
        messages.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return a.queuedAt - b.queuedAt;
        });
        
        const limitedMessages = limit > 0 ? messages.slice(0, limit) : messages;
        resolve(limitedMessages);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove processed queue item
   */
  async removeQueueItem(id) {
    await this.init();
    
    const transaction = this.db.transaction(['message_queue'], 'readwrite');
    const store = transaction.objectStore('message_queue');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('✅ Queue item processed:', id);
        resolve(true);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache message data
   */
  async cacheMessage(messageId, messageData, ttl = 24 * 60 * 60 * 1000) {
    await this.init();
    
    const transaction = this.db.transaction(['message_cache'], 'readwrite');
    const store = transaction.objectStore('message_cache');
    
    const cacheItem = {
      messageId,
      data: messageData,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheItem);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached message
   */
  async getCachedMessage(messageId) {
    await this.init();
    
    const transaction = this.db.transaction(['message_cache'], 'readonly');
    const store = transaction.objectStore('message_cache');
    
    return new Promise((resolve, reject) => {
      const request = store.get(messageId);
      
      request.onsuccess = () => {
        const cached = request.result;
        
        if (!cached) {
          resolve(null);
          return;
        }
        
        // Check if expired
        if (Date.now() > cached.expiresAt) {
          // Remove expired cache
          this.removeCachedMessage(messageId);
          resolve(null);
          return;
        }
        
        resolve(cached.data);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove cached message
   */
  async removeCachedMessage(messageId) {
    await this.init();
    
    const transaction = this.db.transaction(['message_cache'], 'readwrite');
    const store = transaction.objectStore('message_cache');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(messageId);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    await this.init();
    
    const transaction = this.db.transaction(['message_cache'], 'readwrite');
    const store = transaction.objectStore('message_cache');
    const index = store.index('cachedAt');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll();
      
      request.onsuccess = () => {
        const cached = request.result;
        const now = Date.now();
        const expired = cached.filter(item => now > item.expiresAt);
        
        const deletePromises = expired.map(item => {
          return new Promise((deleteResolve) => {
            const deleteRequest = store.delete(item.messageId);
            deleteRequest.onsuccess = () => deleteResolve(item.messageId);
            deleteRequest.onerror = () => deleteResolve(null);
          });
        });
        
        Promise.all(deletePromises).then(results => {
          const cleaned = results.filter(id => id !== null);
          console.log(`🧹 Cleaned ${cleaned.length} expired cache entries`);
          resolve(cleaned);
        });
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    await this.init();
    
    const stores = ['offline_messages', 'message_queue', 'status_updates_queue', 'message_cache'];
    const stats = {};
    
    const promises = stores.map(storeName => {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();
        
        request.onsuccess = () => {
          stats[storeName] = request.result;
          resolve();
        };
        
        request.onerror = () => {
          stats[storeName] = 0;
          resolve();
        };
      });
    });
    
    await Promise.all(promises);
    
    return {
      ...stats,
      isInitialized: this.isInitialized,
      dbName: this.dbName,
      version: this.version
    };
  }

  /**
   * Clear all data (use with caution)
   */
  async clearAll() {
    await this.init();
    
    const stores = ['offline_messages', 'message_queue', 'status_updates_queue', 'message_cache'];
    
    const promises = stores.map(storeName => {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          console.log(`🧹 Cleared ${storeName}`);
          resolve();
        };
        
        request.onerror = () => {
          console.error(`Failed to clear ${storeName}:`, request.error);
          resolve();
        };
      });
    });
    
    await Promise.all(promises);
    console.log('🧹 All IndexedDB data cleared');
  }
}

// Create singleton instance
const indexedDBStorage = new IndexedDBStorage();

export default indexedDBStorage;