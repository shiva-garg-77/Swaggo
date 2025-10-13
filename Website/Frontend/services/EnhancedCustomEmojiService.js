/**
 * Enhanced Custom Emoji Service
 * Provides advanced emoji management, upload capabilities, and organization
 */

/**
 * Emoji Categories
 */
const EMOJI_CATEGORIES = {
  REACTIONS: 'reactions',
  COMPANY: 'company',
  COMMUNITY: 'community',
  ANIMATED: 'animated',
  FAVORITES: 'favorites',
  RECENT: 'recent'
};

/**
 * File Validation Rules
 */
const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DIMENSIONS: { width: 256, height: 256 },
  ALLOWED_TYPES: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.gif', '.webp']
};

/**
 * Enhanced Custom Emoji Service Class
 */
class EnhancedCustomEmojiService {
  constructor() {
    // Storage keys
    this.STORAGE_KEYS = {
      EMOJIS: 'enhancedCustomEmojis',
      FAVORITES: 'enhancedFavoriteEmojis',
      RECENT: 'enhancedRecentEmojis',
      CATEGORIES: 'enhancedEmojiCategories'
    };
    
    // Load data from storage
    this.emojis = this.loadEmojis();
    this.favorites = this.loadFavorites();
    this.recent = this.loadRecent();
    this.categories = this.loadCategories();
    
    // Performance metrics
    this.metrics = {
      uploads: 0,
      downloads: 0,
      errors: 0,
      cacheHits: 0
    };
    
    // Cache for emoji previews
    this.previewCache = new Map();
    
    console.log('🎨 EnhancedCustomEmojiService initialized');
  }

  /**
   * Load emojis from localStorage
   */
  loadEmojis() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.EMOJIS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load emojis:', error);
      return [];
    }
  }

  /**
   * Load favorites from localStorage
   */
  loadFavorites() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.FAVORITES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  /**
   * Load recent emojis from localStorage
   */
  loadRecent() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.RECENT);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load recent emojis:', error);
      return [];
    }
  }

  /**
   * Load categories from localStorage
   */
  loadCategories() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      return stored ? JSON.parse(stored) : this.getDefaultCategories();
    } catch (error) {
      console.error('Failed to load categories:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Get default categories
   */
  getDefaultCategories() {
    return {
      [EMOJI_CATEGORIES.REACTIONS]: { name: 'Reactions', count: 0 },
      [EMOJI_CATEGORIES.COMPANY]: { name: 'Company', count: 0 },
      [EMOJI_CATEGORIES.COMMUNITY]: { name: 'Community', count: 0 },
      [EMOJI_CATEGORIES.ANIMATED]: { name: 'Animated', count: 0 }
    };
  }

  /**
   * Save emojis to localStorage
   */
  saveEmojis() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.EMOJIS, JSON.stringify(this.emojis));
      this.updateCategoryCounts();
    } catch (error) {
      console.error('Failed to save emojis:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Save favorites to localStorage
   */
  saveFavorites() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(this.favorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Save recent emojis to localStorage
   */
  saveRecent() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.RECENT, JSON.stringify(this.recent));
    } catch (error) {
      console.error('Failed to save recent emojis:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Save categories to localStorage
   */
  saveCategories() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
    } catch (error) {
      console.error('Failed to save categories:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Update category counts
   */
  updateCategoryCounts() {
    // Reset counts
    Object.keys(this.categories).forEach(key => {
      this.categories[key].count = 0;
    });
    
    // Count emojis in each category
    this.emojis.forEach(emoji => {
      if (this.categories[emoji.category]) {
        this.categories[emoji.category].count++;
      }
    });
    
    this.saveCategories();
  }

  /**
   * Validate emoji file
   */
  async validateEmojiFile(file) {
    // Check file type
    if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`);
    }
    
    // Check file size
    if (file.size > FILE_VALIDATION.MAX_SIZE) {
      throw new Error(`File too large. Maximum size is ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB`);
    }
    
    // Check dimensions
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > FILE_VALIDATION.MAX_DIMENSIONS.width || 
            img.height > FILE_VALIDATION.MAX_DIMENSIONS.height) {
          reject(new Error(`Image too large. Maximum dimensions are ${FILE_VALIDATION.MAX_DIMENSIONS.width}x${FILE_VALIDATION.MAX_DIMENSIONS.height}px`));
        } else {
          resolve({ width: img.width, height: img.height });
        }
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload custom emoji
   */
  async uploadEmoji(file, metadata = {}) {
    try {
      this.metrics.uploads++;
      
      // Validate file
      const dimensions = await this.validateEmojiFile(file);
      
      // Check limits
      if (this.emojis.length >= 100) {
        throw new Error('Maximum 100 custom emojis allowed');
      }
      
      // Generate emoji object
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      const isAnimated = file.type === 'image/gif';
      
      const newEmoji = {
        id: `emoji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: metadata.name || fileName.charAt(0).toUpperCase() + fileName.slice(1),
        url: URL.createObjectURL(file),
        category: metadata.category || (isAnimated ? EMOJI_CATEGORIES.ANIMATED : EMOJI_CATEGORIES.COMMUNITY),
        tags: metadata.tags || [fileName.toLowerCase()],
        animated: isAnimated,
        dimensions,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        ...metadata
      };
      
      // Add to collection
      this.emojis.push(newEmoji);
      this.saveEmojis();
      
      return newEmoji;
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to upload emoji:', error);
      throw error;
    }
  }

  /**
   * Add emoji from URL
   */
  async addEmojiFromUrl(url, metadata = {}) {
    try {
      // Fetch image to validate
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch emoji image');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'emoji.png', { type: blob.type });
      
      return await this.uploadEmoji(file, metadata);
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to add emoji from URL:', error);
      throw error;
    }
  }

  /**
   * Delete emoji
   */
  deleteEmoji(emojiId) {
    try {
      const emoji = this.emojis.find(e => e.id === emojiId);
      if (!emoji) {
        throw new Error('Emoji not found');
      }
      
      // Revoke object URL to free memory
      if (emoji.url.startsWith('blob:')) {
        URL.revokeObjectURL(emoji.url);
      }
      
      // Remove from collections
      this.emojis = this.emojis.filter(e => e.id !== emojiId);
      this.favorites = this.favorites.filter(id => id !== emojiId);
      this.recent = this.recent.filter(id => id !== emojiId);
      
      // Save changes
      this.saveEmojis();
      this.saveFavorites();
      this.saveRecent();
      
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to delete emoji:', error);
      throw error;
    }
  }

  /**
   * Update emoji metadata
   */
  updateEmoji(emojiId, updates) {
    try {
      const emojiIndex = this.emojis.findIndex(e => e.id === emojiId);
      if (emojiIndex === -1) {
        throw new Error('Emoji not found');
      }
      
      // Update emoji
      this.emojis[emojiIndex] = { ...this.emojis[emojiIndex], ...updates };
      this.saveEmojis();
      
      return this.emojis[emojiIndex];
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to update emoji:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(emojiId) {
    try {
      if (this.favorites.includes(emojiId)) {
        this.favorites = this.favorites.filter(id => id !== emojiId);
      } else {
        this.favorites.push(emojiId);
      }
      
      this.saveFavorites();
      return this.favorites.includes(emojiId);
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }

  /**
   * Add to recent
   */
  addToRecent(emojiId) {
    try {
      // Remove if already exists
      this.recent = this.recent.filter(id => id !== emojiId);
      
      // Add to beginning
      this.recent.unshift(emojiId);
      
      // Limit to 20 recent emojis
      if (this.recent.length > 20) {
        this.recent = this.recent.slice(0, 20);
      }
      
      this.saveRecent();
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to add to recent:', error);
    }
  }

  /**
   * Get emojis by category
   */
  getByCategory(category) {
    return this.emojis.filter(e => e.category === category);
  }

  /**
   * Get favorite emojis
   */
  getFavorites() {
    return this.emojis.filter(e => this.favorites.includes(e.id));
  }

  /**
   * Get recent emojis
   */
  getRecent() {
    return this.recent
      .map(id => this.emojis.find(e => e.id === id))
      .filter(e => e !== undefined);
  }

  /**
   * Search emojis
   */
  search(query, options = {}) {
    const { category = null, includeTags = true, limit = 50 } = options;
    const lowerQuery = query.toLowerCase();
    
    let results = this.emojis;
    
    // Filter by category if specified
    if (category) {
      results = results.filter(e => e.category === category);
    }
    
    // Search by name and tags
    results = results.filter(e => 
      e.name.toLowerCase().includes(lowerQuery) ||
      (includeTags && e.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
    
    // Sort by relevance and recency
    results.sort((a, b) => {
      // Exact name match gets highest priority
      if (a.name.toLowerCase() === lowerQuery) return -1;
      if (b.name.toLowerCase() === lowerQuery) return 1;
      
      // Name contains query
      const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
      const bNameMatch = b.name.toLowerCase().includes(lowerQuery);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Tag match
      const aTagMatch = includeTags && a.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      const bTagMatch = includeTags && b.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      if (aTagMatch && !bTagMatch) return -1;
      if (!aTagMatch && bTagMatch) return 1;
      
      // Recent emojis get priority
      const aRecentIndex = this.recent.indexOf(a.id);
      const bRecentIndex = this.recent.indexOf(b.id);
      if (aRecentIndex !== -1 && bRecentIndex !== -1) {
        return aRecentIndex - bRecentIndex;
      }
      if (aRecentIndex !== -1) return -1;
      if (bRecentIndex !== -1) return 1;
      
      // Favorites get priority
      const aIsFavorite = this.favorites.includes(a.id);
      const bIsFavorite = this.favorites.includes(b.id);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      return 0;
    });
    
    return results.slice(0, limit);
  }

  /**
   * Create emoji category
   */
  createCategory(categoryId, name) {
    try {
      if (this.categories[categoryId]) {
        throw new Error('Category already exists');
      }
      
      this.categories[categoryId] = { name, count: 0 };
      this.saveCategories();
      
      return this.categories[categoryId];
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  deleteCategory(categoryId) {
    try {
      if (!this.categories[categoryId]) {
        throw new Error('Category not found');
      }
      
      // Move emojis to default category
      this.emojis.forEach(emoji => {
        if (emoji.category === categoryId) {
          emoji.category = EMOJI_CATEGORIES.COMMUNITY;
        }
      });
      
      // Remove category
      delete this.categories[categoryId];
      this.saveCategories();
      this.saveEmojis();
      
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  /**
   * Export emojis as pack
   */
  exportEmojiPack(category = null) {
    try {
      let emojisToExport = this.emojis;
      
      if (category) {
        emojisToExport = emojisToExport.filter(e => e.category === category);
      }
      
      const pack = {
        name: category ? `${this.categories[category]?.name || category} Emojis` : 'Custom Emojis',
        version: '1.0',
        emojis: emojisToExport.map(emoji => ({
          id: emoji.id,
          name: emoji.name,
          url: emoji.url,
          category: emoji.category,
          tags: emoji.tags,
          animated: emoji.animated,
          dimensions: emoji.dimensions,
          size: emoji.size,
          uploadedAt: emoji.uploadedAt
        })),
        exportedAt: new Date().toISOString()
      };
      
      return pack;
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to export emoji pack:', error);
      throw error;
    }
  }

  /**
   * Import emoji pack
   */
  async importEmojiPack(packData) {
    try {
      if (!packData.emojis || !Array.isArray(packData.emojis)) {
        throw new Error('Invalid emoji pack format');
      }
      
      const importedEmojis = [];
      
      for (const emojiData of packData.emojis) {
        try {
          // Skip if we've reached the limit
          if (this.emojis.length >= 100) {
            console.warn('Emoji limit reached, skipping remaining emojis');
            break;
          }
          
          // Create new emoji object
          const newEmoji = {
            ...emojiData,
            id: `emoji-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            uploadedAt: new Date().toISOString()
          };
          
          this.emojis.push(newEmoji);
          importedEmojis.push(newEmoji);
        } catch (error) {
          console.warn('Failed to import emoji:', error);
        }
      }
      
      this.saveEmojis();
      return importedEmojis;
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to import emoji pack:', error);
      throw error;
    }
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      emojiCount: this.emojis.length,
      favoriteCount: this.favorites.length,
      recentCount: this.recent.length,
      categoryCount: Object.keys(this.categories).length
    };
  }

  /**
   * Clear all data
   */
  clearAll() {
    try {
      // Revoke all object URLs
      this.emojis.forEach(emoji => {
        if (emoji.url.startsWith('blob:')) {
          URL.revokeObjectURL(emoji.url);
        }
      });
      
      // Clear storage
      localStorage.removeItem(this.STORAGE_KEYS.EMOJIS);
      localStorage.removeItem(this.STORAGE_KEYS.FAVORITES);
      localStorage.removeItem(this.STORAGE_KEYS.RECENT);
      localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
      
      // Reset in-memory data
      this.emojis = [];
      this.favorites = [];
      this.recent = [];
      this.categories = this.getDefaultCategories();
      
      console.log('🧹 Emoji service data cleared');
    } catch (error) {
      this.metrics.errors++;
      console.error('Failed to clear emoji data:', error);
    }
  }
}

// Create singleton instance
const enhancedCustomEmojiService = new EnhancedCustomEmojiService();

export default enhancedCustomEmojiService;
export { EMOJI_CATEGORIES, FILE_VALIDATION };