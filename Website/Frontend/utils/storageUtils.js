/**
 * STORAGE UTILITIES
 * Comprehensive localStorage and sessionStorage management
 * SSR-safe implementation for Next.js
 */

import { useState } from 'react';

/**
 * Safe localStorage wrapper with error handling and SSR support
 */
class StorageManager {
  constructor(storage = 'local') {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.storage = null;
      this.isAvailable = false;
    } else {
      try {
        this.storage = storage === 'session' ? window.sessionStorage : window.localStorage;
        this.isAvailable = true;
      } catch (error) {
        console.warn('Storage not available:', error);
        this.storage = null;
        this.isAvailable = false;
      }
    }
  }
  
  /**
   * Set item in storage
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = null) {
    if (!this.isAvailable || !this.storage) return false;
    
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl
      };
      this.storage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }
  
  /**
   * Get item from storage
   * @param {string} key
   * @param {any} defaultValue
   * @returns {any}
   */
  get(key, defaultValue = null) {
    if (!this.isAvailable || !this.storage) return defaultValue;
    
    try {
      const itemStr = this.storage.getItem(key);
      if (!itemStr) return defaultValue;
      
      const item = JSON.parse(itemStr);
      
      // Check if item has expired
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key);
        return defaultValue;
      }
      
      return item.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }
  
  /**
   * Remove item from storage
   * @param {string} key
   */
  remove(key) {
    if (!this.isAvailable || !this.storage) return false;
    
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
  
  /**
   * Clear all items
   */
  clear() {
    if (!this.isAvailable || !this.storage) return false;
    
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
  
  /**
   * Check if key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    if (!this.isAvailable || !this.storage) return false;
    return this.storage.getItem(key) !== null;
  }
  
  /**
   * Get all keys
   * @returns {string[]}
   */
  keys() {
    if (!this.isAvailable || !this.storage) return [];
    return Object.keys(this.storage);
  }
  
  /**
   * Get storage size in bytes
   * @returns {number}
   */
  size() {
    if (!this.isAvailable || !this.storage) return 0;
    
    let total = 0;
    for (let key in this.storage) {
      if (this.storage.hasOwnProperty(key)) {
        total += this.storage[key].length + key.length;
      }
    }
    return total;
  }
}

// Create instances
export const localStorage = new StorageManager('local');
export const sessionStorage = new StorageManager('session');

/**
 * Save draft with auto-save
 * @param {string} key
 * @param {any} data
 * @param {number} debounceMs
 */
let autoSaveTimers = {};

export function saveDraft(key, data, debounceMs = 1000) {
  if (autoSaveTimers[key]) {
    clearTimeout(autoSaveTimers[key]);
  }
  
  autoSaveTimers[key] = setTimeout(() => {
    localStorage.set(`draft_${key}`, data, 7 * 24 * 60 * 60 * 1000); // 7 days TTL
  }, debounceMs);
}

/**
 * Get draft
 * @param {string} key
 * @returns {any}
 */
export function getDraft(key) {
  return localStorage.get(`draft_${key}`);
}

/**
 * Clear draft
 * @param {string} key
 */
export function clearDraft(key) {
  localStorage.remove(`draft_${key}`);
}

/**
 * Save user preference
 * @param {string} key
 * @param {any} value
 */
export function savePreference(key, value) {
  localStorage.set(`pref_${key}`, value);
}

/**
 * Get user preference
 * @param {string} key
 * @param {any} defaultValue
 * @returns {any}
 */
export function getPreference(key, defaultValue = null) {
  return localStorage.get(`pref_${key}`, defaultValue);
}

/**
 * React hook for localStorage
 * @param {string} key
 * @param {any} initialValue
 * @returns {[any, Function]}
 */
export function useLocalStorage(key, initialValue) {
  // Note: This requires React to be imported in the consuming component
  // Usage: import { useState } from 'react'; then use this hook
  if (typeof window === 'undefined') {
    return [initialValue, () => {}];
  }
  
  const [storedValue, setStoredValue] = useState(() => {
    return localStorage.get(key, initialValue);
  });
  
  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    localStorage.set(key, valueToStore);
  };
  
  return [storedValue, setValue];
}

/**
 * React hook for sessionStorage
 * @param {string} key
 * @param {any} initialValue
 * @returns {[any, Function]}
 */
export function useSessionStorage(key, initialValue) {
  if (typeof window === 'undefined') {
    return [initialValue, () => {}];
  }
  
  const [storedValue, setStoredValue] = useState(() => {
    return sessionStorage.get(key, initialValue);
  });
  
  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    sessionStorage.set(key, valueToStore);
  };
  
  return [storedValue, setValue];
}

/**
 * Cache API responses
 * @param {string} key
 * @param {Function} fetchFn
 * @param {number} ttl - Cache duration in ms
 * @returns {Promise<any>}
 */
export async function cacheResponse(key, fetchFn, ttl = 5 * 60 * 1000) {
  const cached = localStorage.get(`cache_${key}`);
  
  if (cached) {
    return cached;
  }
  
  const data = await fetchFn();
  localStorage.set(`cache_${key}`, data, ttl);
  return data;
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  const keys = localStorage.keys();
  keys.forEach(key => {
    if (key.startsWith('cache_')) {
      localStorage.remove(key);
    }
  });
}
