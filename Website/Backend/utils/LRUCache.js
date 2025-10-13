/**
 * @fileoverview LRU (Least Recently Used) Cache implementation
 * @module LRUCache
 * @version 1.0.0
 * @author Swaggo Development Team
 * 
 * @description
 * Simple LRU cache implementation to prevent memory leaks in SocketController.
 * This implementation uses a Map for O(1) access and a doubly linked list for
 * O(1) insertion and deletion.
 * 
 * Features:
 * - Fixed maximum size to prevent memory leaks
 * - Automatic eviction of least recently used items when capacity is exceeded
 * - O(1) get and set operations
 * - Memory usage monitoring
 * 
 * @example
 * ```javascript
 * const cache = new LRUCache(100); // Max 100 items
 * cache.set('key1', 'value1');
 * const value = cache.get('key1');
 * console.log(cache.size()); // 1
 * ```
 */

class LRUCache {
  /**
   * @constructor
   * @param {number} maxSize - Maximum number of items the cache can hold
   */
  constructor(maxSize = 1000) {
    if (maxSize <= 0) {
      throw new Error('Max size must be greater than 0');
    }
    
    this.maxSize = maxSize;
    this.cache = new Map(); // For O(1) access
    this.head = null; // Most recently used
    this.tail = null; // Least recently used
    this.nodeMap = new Map(); // Maps keys to nodes in the linked list
  }

  /**
   * Get value from cache by key
   * @param {string|number} key - Key to look up
   * @returns {*} Value if found, undefined otherwise
   */
  get(key) {
    const node = this.nodeMap.get(key);
    
    if (!node) {
      return undefined;
    }
    
    // Move node to head (most recently used)
    this._moveToHead(node);
    
    return node.value;
  }

  /**
   * Set key-value pair in cache
   * @param {string|number} key - Key to store
   * @param {*} value - Value to store
   * @returns {boolean} True if successful
   */
  set(key, value) {
    let node = this.nodeMap.get(key);
    
    if (node) {
      // Update existing node
      node.value = value;
      this._moveToHead(node);
    } else {
      // Create new node
      node = {
        key,
        value,
        prev: null,
        next: null
      };
      
      // Check if we need to evict
      if (this.cache.size >= this.maxSize) {
        this._evict();
      }
      
      // Add new node to head
      this._addToHead(node);
      this.nodeMap.set(key, node);
    }
    
    this.cache.set(key, value);
    return true;
  }

  /**
   * Delete key from cache
   * @param {string|number} key - Key to delete
   * @returns {boolean} True if key existed and was deleted
   */
  delete(key) {
    const node = this.nodeMap.get(key);
    
    if (!node) {
      return false;
    }
    
    this._removeNode(node);
    this.nodeMap.delete(key);
    this.cache.delete(key);
    
    return true;
  }

  /**
   * Check if key exists in cache
   * @param {string|number} key - Key to check
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get current size of cache
   * @returns {number} Number of items in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clear all items from cache
   */
  clear() {
    this.cache.clear();
    this.nodeMap.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics about the cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.cache.size / this.maxSize) * 100)
    };
  }

  /**
   * Add node to head of linked list
   * @private
   * @param {Object} node - Node to add
   */
  _addToHead(node) {
    node.prev = null;
    node.next = this.head;
    
    if (this.head) {
      this.head.prev = node;
    }
    
    this.head = node;
    
    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove node from linked list
   * @private
   * @param {Object} node - Node to remove
   */
  _removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Move node to head of linked list
   * @private
   * @param {Object} node - Node to move
   */
  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  /**
   * Remove least recently used item (tail)
   * @private
   */
  _evict() {
    if (!this.tail) {
      return;
    }
    
    const key = this.tail.key;
    this.cache.delete(key);
    this.nodeMap.delete(key);
    this._removeNode(this.tail);
  }
}

export default LRUCache;