/**
 * Centralized Cache Management Service
 * Consolidates caching strategies with unified invalidation and management patterns
 */

import { EventEmitter } from 'events';
import errorHandlingService, { ERROR_TYPES } from './ErrorHandlingService';

/**
 * Cache Storage Types
 */
const STORAGE_TYPES = {
  MEMORY: 'memory',
  SESSION_STORAGE: 'session_storage',
  LOCAL_STORAGE: 'local_storage',
  INDEXED_DB: 'indexed_db'
};

/**
 * Cache Strategies
 */
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache_first',           // Return cached data if available, fetch if not
  NETWORK_FIRST: 'network_first',       // Fetch fresh data, fallback to cache on error
  CACHE_ONLY: 'cache_only',             // Only return cached data
  NETWORK_ONLY: 'network_only',         // Only fetch fresh data
  STALE_WHILE_REVALIDATE: 'stale_while_revalidate' // Return cached data, update in background
};

/**
 * Cache Eviction Policies
 */
const EVICTION_POLICIES = {
  LRU: 'lru',           // Least Recently Used
  LFU: 'lfu',           // Least Frequently Used
  FIFO: 'fifo',         // First In, First Out
  TTL: 'ttl'            // Time To Live
};

/**
 * Cache Entry Class
 */
class CacheEntry {
  constructor(key, value, options = {}) {
    this.key = key;
    this.value = value;
    this.timestamp = Date.now();
    this.ttl = options.ttl || null;
    this.accessCount = 1;
    this.lastAccessed = this.timestamp;
    this.tags = options.tags || [];
    this.size = this.calculateSize(value);
    this.metadata = options.metadata || {};
  }

  calculateSize(value) {
    try {
      return JSON.stringify(value).length * 2; // Approximate size in bytes
    } catch (error) {
      return 0;
    }
  }

  isExpired() {
    if (!this.ttl) return false;
    return Date.now() - this.timestamp > this.ttl;
  }

  access() {
    this.accessCount++;
    this.lastAccessed = Date.now();
    return this;
  }

  toJSON() {
    return {
      key: this.key,
      value: this.value,
      timestamp: this.timestamp,
      ttl: this.ttl,
      accessCount: this.accessCount,
      lastAccessed: this.lastAccessed,
      tags: this.tags,
      size: this.size,
      metadata: this.metadata
    };
  }

  static fromJSON(data) {
    const entry = new CacheEntry(data.key, data.value);
    entry.timestamp = data.timestamp;
    entry.ttl = data.ttl;
    entry.accessCount = data.accessCount;
    entry.lastAccessed = data.lastAccessed;
    entry.tags = data.tags;
    entry.size = data.size;
    entry.metadata = data.metadata;
    return entry;
  }
}

/**
 * Memory Cache Store
 */
class MemoryCacheStore {
  constructor(options = {}) {
    this.data = new Map();
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxEntries = options.maxEntries || 1000;
    this.currentSize = 0;
    this.evictionPolicy = options.evictionPolicy || EVICTION_POLICIES.LRU;
  }

  get(key) {
    const entry = this.data.get(key);
    if (!entry) return null;
    
    if (entry.isExpired()) {
      this.delete(key);
      return null;
    }
    
    return entry.access();
  }

  set(key, value, options = {}) {
    const entry = new CacheEntry(key, value, options);
    
    // Remove existing entry if present
    if (this.data.has(key)) {
      this.delete(key);
    }
    
    // Check size limits
    this.enforceSize(entry.size);
    this.enforceEntryLimit();
    
    this.data.set(key, entry);
    this.currentSize += entry.size;
    
    return entry;
  }

  delete(key) {
    const entry = this.data.get(key);
    if (entry) {
      this.data.delete(key);
      this.currentSize -= entry.size;
      return true;
    }
    return false;
  }

  clear() {
    this.data.clear();
    this.currentSize = 0;
  }

  has(key) {
    const entry = this.data.get(key);
    return entry && !entry.isExpired();
  }

  keys() {
    return Array.from(this.data.keys()).filter(key => !this.data.get(key).isExpired());
  }

  values() {
    return Array.from(this.data.values()).filter(entry => !entry.isExpired());
  }

  size() {
    return this.data.size;
  }

  enforceSize(newEntrySize) {
    while (this.currentSize + newEntrySize > this.maxSize && this.data.size > 0) {
      this.evictOne();
    }
  }

  enforceEntryLimit() {
    while (this.data.size >= this.maxEntries) {
      this.evictOne();
    }
  }

  evictOne() {
    if (this.data.size === 0) return;
    
    let keyToEvict;
    
    switch (this.evictionPolicy) {
      case EVICTION_POLICIES.LRU:
        keyToEvict = this.getLRUKey();
        break;
      case EVICTION_POLICIES.LFU:
        keyToEvict = this.getLFUKey();
        break;
      case EVICTION_POLICIES.FIFO:
        keyToEvict = this.getFIFOKey();
        break;
      case EVICTION_POLICIES.TTL:
        keyToEvict = this.getTTLKey();
        break;
      default:
        keyToEvict = this.data.keys().next().value;
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }

  getLRUKey() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.data.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  getLFUKey() {
    let leastUsedKey = null;
    let leastCount = Infinity;
    
    for (const [key, entry] of this.data.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }

  getFIFOKey() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.data.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  getTTLKey() {
    const now = Date.now();
    let expiredKey = null;
    let shortestTTL = Infinity;
    
    for (const [key, entry] of this.data.entries()) {
      if (entry.ttl && entry.isExpired()) {
        return key; // Return immediately if expired
      }
      
      if (entry.ttl) {
        const remainingTTL = entry.ttl - (now - entry.timestamp);
        if (remainingTTL < shortestTTL) {
          shortestTTL = remainingTTL;
          expiredKey = key;
        }
      }
    }
    
    return expiredKey || this.getLRUKey(); // Fallback to LRU
  }

  cleanup() {
    const expiredKeys = [];
    for (const [key, entry] of this.data.entries()) {
      if (entry.isExpired()) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    return expiredKeys.length;
  }
}

/**
 * Browser Storage Cache Store (LocalStorage/SessionStorage)
 */
class BrowserStorageCacheStore {
  constructor(storageType, options = {}) {
    this.storageType = storageType;
    this.storage = storageType === STORAGE_TYPES.LOCAL_STORAGE ? localStorage : sessionStorage;
    this.keyPrefix = options.keyPrefix || 'cache_';
    this.maxEntries = options.maxEntries || 100;
  }

  get(key) {
    try {
      const data = this.storage.getItem(this.keyPrefix + key);
      if (!data) return null;
      
      const entry = CacheEntry.fromJSON(JSON.parse(data));
      if (entry.isExpired()) {
        this.delete(key);
        return null;
      }
      
      return entry.access();
    } catch (error) {
      return null;
    }
  }

  set(key, value, options = {}) {
    try {
      const entry = new CacheEntry(key, value, options);
      
      // Enforce entry limits
      this.enforceEntryLimit();
      
      this.storage.setItem(this.keyPrefix + key, JSON.stringify(entry.toJSON()));
      return entry;
    } catch (error) {
      // Storage quota exceeded or other error
      this.cleanup();
      try {
        const entry = new CacheEntry(key, value, options);
        this.storage.setItem(this.keyPrefix + key, JSON.stringify(entry.toJSON()));
        return entry;
      } catch (retryError) {
        return null;
      }
    }
  }

  delete(key) {
    try {
      this.storage.removeItem(this.keyPrefix + key);
      return true;
    } catch (error) {
      return false;
    }
  }

  clear() {
    try {
      const keys = this.keys();
      keys.forEach(key => this.delete(key));
    } catch (error) {
      // Fallback to clearing all storage if we can't enumerate keys
      if (this.storageType === STORAGE_TYPES.LOCAL_STORAGE) {
        localStorage.clear();
      } else {
        sessionStorage.clear();
      }
    }
  }

  has(key) {
    const entry = this.get(key);
    return entry !== null;
  }

  keys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        keys.push(key.substring(this.keyPrefix.length));
      }
    }
    return keys;
  }

  size() {
    return this.keys().length;
  }

  enforceEntryLimit() {
    const keys = this.keys();
    while (keys.length >= this.maxEntries) {
      // Remove oldest entries
      const oldestKey = this.getOldestKey(keys);
      if (oldestKey) {
        this.delete(oldestKey);
        keys.splice(keys.indexOf(oldestKey), 1);
      } else {
        break;
      }
    }
  }

  getOldestKey(keys) {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const key of keys) {
      const entry = this.get(key);
      if (entry && entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  cleanup() {
    const keys = this.keys();
    let cleaned = 0;
    
    for (const key of keys) {
      const entry = this.get(key);
      if (!entry) {
        // Entry was expired and removed during get
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

/**
 * IndexedDB Cache Store (for large data)
 */
class IndexedDBCacheStore {
  constructor(options = {}) {
    this.dbName = options.dbName || 'CacheDB';
    this.storeName = options.storeName || 'cache';
    this.version = options.version || 1;
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('lastAccessed', 'lastAccessed');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      };
    });
  }

  async get(key) {
    await this.initPromise;
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const data = request.result;
        if (!data) {
          resolve(null);
          return;
        }
        
        const entry = CacheEntry.fromJSON(data);
        if (entry.isExpired()) {
          // Delete expired entry
          store.delete(key);
          resolve(null);
          return;
        }
        
        // Update access info
        entry.access();
        store.put(entry.toJSON());
        resolve(entry);
      };
      
      request.onerror = () => resolve(null);
    });
  }

  async set(key, value, options = {}) {
    await this.initPromise;
    
    return new Promise((resolve) => {
      const entry = new CacheEntry(key, value, options);
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry.toJSON());
      
      request.onsuccess = () => resolve(entry);
      request.onerror = () => resolve(null);
    });
  }

  async delete(key) {
    await this.initPromise;
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  async clear() {
    await this.initPromise;
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  async has(key) {
    const entry = await this.get(key);
    return entry !== null;
  }

  async keys() {
    await this.initPromise;
    
    return new Promise((resolve) => {
      const keys = [];
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const entry = CacheEntry.fromJSON(cursor.value);
          if (!entry.isExpired()) {
            keys.push(cursor.key);
          }
          cursor.continue();
        } else {
          resolve(keys);
        }
      };
      
      request.onerror = () => resolve([]);
    });
  }

  async size() {
    const keys = await this.keys();
    return keys.length;
  }

  async cleanup() {
    await this.initPromise;
    
    return new Promise((resolve) => {
      let cleaned = 0;
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const entry = CacheEntry.fromJSON(cursor.value);
          if (entry.isExpired()) {
            cursor.delete();
            cleaned++;
          }
          cursor.continue();
        } else {
          resolve(cleaned);
        }
      };
      
      request.onerror = () => resolve(0);
    });
  }
}

/**
 * Main Cache Service Class
 */
class CacheService extends EventEmitter {
  constructor() {
    super();
    
    // Storage backends
    this.stores = new Map();
    
    // Configuration
    this.config = {
      defaultTTL: 5 * 60 * 1000,        // 5 minutes
      defaultStrategy: CACHE_STRATEGIES.CACHE_FIRST,
      cleanupInterval: 60000,           // 1 minute
      maxRetries: 3,
      retryDelay: 1000,
      enableMetrics: true
    };
    
    // Cache patterns and groups
    this.cacheGroups = new Map();      // groupName -> Set of keys
    this.keyPatterns = new Map();      // pattern -> config
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      errors: 0,
      totalSize: 0
    };
    
    // Initialize default stores
    this.initializeStores();
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Initialize default cache stores
   */
  initializeStores() {
    // Memory store for fast access
    this.stores.set(STORAGE_TYPES.MEMORY, new MemoryCacheStore({
      maxSize: 10 * 1024 * 1024,    // 10MB
      maxEntries: 1000,
      evictionPolicy: EVICTION_POLICIES.LRU
    }));
    
    // Session storage for session-scoped data
    if (typeof window !== 'undefined' && window.sessionStorage) {
      this.stores.set(STORAGE_TYPES.SESSION_STORAGE, new BrowserStorageCacheStore(STORAGE_TYPES.SESSION_STORAGE, {
        keyPrefix: 'swaggo_session_cache_',
        maxEntries: 100
      }));
    }
    
    // Local storage for persistent data
    if (typeof window !== 'undefined' && window.localStorage) {
      this.stores.set(STORAGE_TYPES.LOCAL_STORAGE, new BrowserStorageCacheStore(STORAGE_TYPES.LOCAL_STORAGE, {
        keyPrefix: 'swaggo_cache_',
        maxEntries: 200
      }));
    }
    
    // IndexedDB for large data
    if (typeof window !== 'undefined' && window.indexedDB) {
      this.stores.set(STORAGE_TYPES.INDEXED_DB, new IndexedDBCacheStore({
        dbName: 'SwaggoCache',
        storeName: 'cache',
        version: 1
      }));
    }
  }

  /**
   * Configure cache service
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Register cache pattern with specific configuration
   */
  registerPattern(pattern, config) {
    this.keyPatterns.set(pattern, {
      storageType: STORAGE_TYPES.MEMORY,
      ttl: this.config.defaultTTL,
      strategy: this.config.defaultStrategy,
      tags: [],
      group: null,
      ...config
    });
  }

  /**
   * Get cache configuration for a key
   */
  getKeyConfig(key) {
    // Check for exact pattern match first
    if (this.keyPatterns.has(key)) {
      return this.keyPatterns.get(key);
    }
    
    // Check for regex pattern matches
    for (const [pattern, config] of this.keyPatterns.entries()) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(key)) {
          return config;
        }
      } catch (error) {
        // Invalid regex, skip
        continue;
      }
    }
    
    // Return default config
    return {
      storageType: STORAGE_TYPES.MEMORY,
      ttl: this.config.defaultTTL,
      strategy: this.config.defaultStrategy,
      tags: [],
      group: null
    };
  }

  /**
   * Get value from cache
   */
  async get(key, options = {}) {
    try {
      const keyConfig = this.getKeyConfig(key);
      const storeType = options.storageType || keyConfig.storageType;
      const store = this.stores.get(storeType);
      
      if (!store) {
        this.updateStats('errors');
        return null;
      }
      
      const entry = await store.get(key);
      if (entry) {
        this.updateStats('hits');
        this.emit('cacheHit', { key, value: entry.value, store: storeType });
        return entry.value;
      } else {
        this.updateStats('misses');
        this.emit('cacheMiss', { key, store: storeType });
        return null;
      }
      
    } catch (error) {
      this.updateStats('errors');
      errorHandlingService.handleError(
        errorHandlingService.createError(ERROR_TYPES.CACHE_ERROR, `Cache get failed for key: ${key}`, { key, error })
      );
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, options = {}) {
    try {
      const keyConfig = this.getKeyConfig(key);
      const storeType = options.storageType || keyConfig.storageType;
      const ttl = options.ttl || keyConfig.ttl;
      const tags = [...(keyConfig.tags || []), ...(options.tags || [])];
      const group = options.group || keyConfig.group;
      
      const store = this.stores.get(storeType);
      if (!store) {
        this.updateStats('errors');
        return false;
      }
      
      const entry = await store.set(key, value, {
        ttl,
        tags,
        metadata: {
          ...options.metadata,
          group
        }
      });
      
      if (entry) {
        this.updateStats('sets');
        
        // Add to group if specified
        if (group) {
          this.addToGroup(group, key);
        }
        
        this.emit('cacheSet', { key, value, store: storeType, entry });
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.updateStats('errors');
      errorHandlingService.handleError(
        errorHandlingService.createError(ERROR_TYPES.CACHE_ERROR, `Cache set failed for key: ${key}`, { key, value, error })
      );
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key, options = {}) {
    try {
      const keyConfig = this.getKeyConfig(key);
      const storeType = options.storageType || keyConfig.storageType;
      const store = this.stores.get(storeType);
      
      if (!store) {
        return false;
      }
      
      const success = await store.delete(key);
      if (success) {
        this.updateStats('deletes');
        this.removeFromAllGroups(key);
        this.emit('cacheDelete', { key, store: storeType });
      }
      
      return success;
      
    } catch (error) {
      this.updateStats('errors');
      errorHandlingService.handleError(
        errorHandlingService.createError(ERROR_TYPES.CACHE_ERROR, `Cache delete failed for key: ${key}`, { key, error })
      );
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key, options = {}) {
    try {
      const keyConfig = this.getKeyConfig(key);
      const storeType = options.storageType || keyConfig.storageType;
      const store = this.stores.get(storeType);
      
      if (!store) {
        return false;
      }
      
      return await store.has(key);
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(ERROR_TYPES.CACHE_ERROR, `Cache has check failed for key: ${key}`, { key, error })
      );
      return false;
    }
  }

  /**
   * Clear entire cache or specific store
   */
  async clear(storageType = null) {
    try {
      if (storageType) {
        const store = this.stores.get(storageType);
        if (store) {
          await store.clear();
          this.emit('cacheCleared', { store: storageType });
        }
      } else {
        // Clear all stores
        for (const [type, store] of this.stores.entries()) {
          await store.clear();
        }
        this.cacheGroups.clear();
        this.emit('cacheCleared', { store: 'all' });
      }
      
      return true;
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(ERROR_TYPES.CACHE_ERROR, 'Cache clear failed', { storageType, error })
      );
      return false;
    }
  }

  /**
   * Get or set with caching strategy
   */
  async getOrSet(key, fetcher, options = {}) {
    try {
      const keyConfig = this.getKeyConfig(key);
      const strategy = options.strategy || keyConfig.strategy;
      
      switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
          return await this.cacheFirstStrategy(key, fetcher, options);
        case CACHE_STRATEGIES.NETWORK_FIRST:
          return await this.networkFirstStrategy(key, fetcher, options);
        case CACHE_STRATEGIES.CACHE_ONLY:
          return await this.get(key, options);
        case CACHE_STRATEGIES.NETWORK_ONLY:
          return await this.networkOnlyStrategy(key, fetcher, options);
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
          return await this.staleWhileRevalidateStrategy(key, fetcher, options);
        default:
          return await this.cacheFirstStrategy(key, fetcher, options);
      }
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(ERROR_TYPES.CACHE_ERROR, `Cache getOrSet failed for key: ${key}`, { key, error })
      );
      return null;
    }
  }

  /**
   * Cache first strategy implementation
   */
  async cacheFirstStrategy(key, fetcher, options) {
    const cached = await this.get(key, options);
    if (cached !== null) {
      return cached;
    }
    
    const fresh = await this.executeFetcher(fetcher, key);
    if (fresh !== null) {
      await this.set(key, fresh, options);
    }
    
    return fresh;
  }

  /**
   * Network first strategy implementation
   */
  async networkFirstStrategy(key, fetcher, options) {
    try {
      const fresh = await this.executeFetcher(fetcher, key);
      if (fresh !== null) {
        await this.set(key, fresh, options);
        return fresh;
      }
    } catch (error) {
      // Network failed, try cache
    }
    
    return await this.get(key, options);
  }

  /**
   * Network only strategy implementation
   */
  async networkOnlyStrategy(key, fetcher, options) {
    const fresh = await this.executeFetcher(fetcher, key);
    if (fresh !== null) {
      await this.set(key, fresh, options);
    }
    return fresh;
  }

  /**
   * Stale while revalidate strategy implementation
   */
  async staleWhileRevalidateStrategy(key, fetcher, options) {
    const cached = await this.get(key, options);
    
    // Fetch fresh data in background
    this.executeFetcher(fetcher, key).then(fresh => {
      if (fresh !== null) {
        this.set(key, fresh, options);
      }
    }).catch(error => {
      // Ignore background fetch errors
    });
    
    return cached;
  }

  /**
   * Execute fetcher function with error handling
   */
  async executeFetcher(fetcher, key) {
    try {
      if (typeof fetcher === 'function') {
        return await fetcher(key);
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags, storageType = null) {
    const storesToSearch = storageType 
      ? [this.stores.get(storageType)].filter(Boolean)
      : Array.from(this.stores.values());
    
    const invalidatedKeys = [];
    
    for (const store of storesToSearch) {
      try {
        const keys = await store.keys();
        
        for (const key of keys) {
          const entry = await store.get(key);
          if (entry && entry.tags && tags.some(tag => entry.tags.includes(tag))) {
            await store.delete(key);
            invalidatedKeys.push(key);
            this.removeFromAllGroups(key);
          }
        }
      } catch (error) {
        // Continue with other stores
      }
    }
    
    this.emit('cacheInvalidated', { tags, keys: invalidatedKeys });
    return invalidatedKeys;
  }

  /**
   * Invalidate cache by key pattern
   */
  async invalidateByPattern(pattern, storageType = null) {
    const storesToSearch = storageType 
      ? [this.stores.get(storageType)].filter(Boolean)
      : Array.from(this.stores.values());
    
    const invalidatedKeys = [];
    const regex = new RegExp(pattern);
    
    for (const store of storesToSearch) {
      try {
        const keys = await store.keys();
        
        for (const key of keys) {
          if (regex.test(key)) {
            await store.delete(key);
            invalidatedKeys.push(key);
            this.removeFromAllGroups(key);
          }
        }
      } catch (error) {
        // Continue with other stores
      }
    }
    
    this.emit('cacheInvalidated', { pattern, keys: invalidatedKeys });
    return invalidatedKeys;
  }

  /**
   * Invalidate cache by group
   */
  async invalidateGroup(groupName, storageType = null) {
    const groupKeys = this.cacheGroups.get(groupName);
    if (!groupKeys) return [];
    
    const invalidatedKeys = [];
    const storesToSearch = storageType 
      ? [this.stores.get(storageType)].filter(Boolean)
      : Array.from(this.stores.values());
    
    for (const store of storesToSearch) {
      for (const key of groupKeys) {
        try {
          const success = await store.delete(key);
          if (success) {
            invalidatedKeys.push(key);
          }
        } catch (error) {
          // Continue with other keys
        }
      }
    }
    
    this.cacheGroups.delete(groupName);
    this.emit('cacheInvalidated', { group: groupName, keys: invalidatedKeys });
    return invalidatedKeys;
  }

  /**
   * Add key to cache group
   */
  addToGroup(groupName, key) {
    if (!this.cacheGroups.has(groupName)) {
      this.cacheGroups.set(groupName, new Set());
    }
    this.cacheGroups.get(groupName).add(key);
  }

  /**
   * Remove key from all groups
   */
  removeFromAllGroups(key) {
    for (const [groupName, keys] of this.cacheGroups.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.cacheGroups.delete(groupName);
      }
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  async cleanup() {
    let totalCleaned = 0;
    
    for (const [type, store] of this.stores.entries()) {
      try {
        const cleaned = await store.cleanup();
        totalCleaned += cleaned;
        
        if (cleaned > 0) {
          this.updateStats('evictions', cleaned);
          this.emit('cacheCleanup', { store: type, cleaned });
        }
      } catch (error) {
        // Continue with other stores
      }
    }
    
    return totalCleaned;
  }

  /**
   * Update statistics
   */
  updateStats(metric, value = 1) {
    if (!this.config.enableMetrics) return;
    
    if (this.stats.hasOwnProperty(metric)) {
      this.stats[metric] += value;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const storeStats = {};
    
    for (const [type, store] of this.stores.entries()) {
      try {
        storeStats[type] = {
          size: await store.size(),
          keys: (await store.keys()).length
        };
      } catch (error) {
        storeStats[type] = { size: 0, keys: 0 };
      }
    }
    
    return {
      ...this.stats,
      hitRatio: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      stores: storeStats,
      groups: this.cacheGroups.size,
      patterns: this.keyPatterns.size
    };
  }

  /**
   * Get all cache keys from all stores
   */
  async getAllKeys(storageType = null) {
    const allKeys = [];
    const storesToSearch = storageType 
      ? [this.stores.get(storageType)].filter(Boolean)
      : Array.from(this.stores.values());
    
    for (const store of storesToSearch) {
      try {
        const keys = await store.keys();
        allKeys.push(...keys);
      } catch (error) {
        // Continue with other stores
      }
    }
    
    return [...new Set(allKeys)]; // Remove duplicates
  }

  /**
   * Warm up cache with predefined data
   */
  async warmUp(dataMap, options = {}) {
    const results = [];
    
    for (const [key, value] of dataMap.entries()) {
      try {
        const success = await this.set(key, value, options);
        results.push({ key, success });
      } catch (error) {
        results.push({ key, success: false, error });
      }
    }
    
    this.emit('cacheWarmUp', { results });
    return results;
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy() {
    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Clear all caches
    this.clear();
    
    // Clear all data structures
    this.cacheGroups.clear();
    this.keyPatterns.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.emit('serviceDestroyed');
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;
export { 
  STORAGE_TYPES, 
  CACHE_STRATEGIES, 
  EVICTION_POLICIES,
  CacheEntry
};