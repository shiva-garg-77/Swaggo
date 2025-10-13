import { useState, useEffect, useCallback } from 'react';
import enhancedCustomEmojiService, { EMOJI_CATEGORIES } from '../services/EnhancedCustomEmojiService';

/**
 * React hook for enhanced custom emoji functionality
 * Provides advanced emoji management, upload capabilities, and organization
 */
export const useEnhancedCustomEmojis = () => {
  const [emojis, setEmojis] = useState(enhancedCustomEmojiService.emojis);
  const [favorites, setFavorites] = useState(enhancedCustomEmojiService.favorites);
  const [recent, setRecent] = useState(enhancedCustomEmojiService.recent);
  const [categories, setCategories] = useState(enhancedCustomEmojiService.categories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(EMOJI_CATEGORIES.RECENT);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metrics, setMetrics] = useState(enhancedCustomEmojiService.getMetrics());

  // Update state when service data changes
  useEffect(() => {
    const updateState = () => {
      setEmojis([...enhancedCustomEmojiService.emojis]);
      setFavorites([...enhancedCustomEmojiService.favorites]);
      setRecent([...enhancedCustomEmojiService.recent]);
      setCategories({...enhancedCustomEmojiService.categories});
      setMetrics(enhancedCustomEmojiService.getMetrics());
    };

    // Initial update
    updateState();

    // Set up interval to update metrics
    const interval = setInterval(() => {
      setMetrics(enhancedCustomEmojiService.getMetrics());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Get filtered emojis based on search and category
  const filteredEmojis = useCallback(() => {
    if (selectedCategory === EMOJI_CATEGORIES.RECENT) {
      return recent;
    }
    
    if (selectedCategory === EMOJI_CATEGORIES.FAVORITES) {
      return emojis.filter(e => favorites.includes(e.id));
    }
    
    if (!searchQuery) {
      return emojis.filter(e => e.category === selectedCategory);
    }
    
    return enhancedCustomEmojiService.search(searchQuery, { category: selectedCategory });
  }, [emojis, favorites, recent, searchQuery, selectedCategory]);

  // Upload emoji
  const uploadEmoji = useCallback(async (file, metadata = {}) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const result = await enhancedCustomEmojiService.uploadEmoji(file, metadata);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update state
      setEmojis([...enhancedCustomEmojiService.emojis]);
      setCategories({...enhancedCustomEmojiService.categories});
      setMetrics(enhancedCustomEmojiService.getMetrics());
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
      return result;
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      throw error;
    }
  }, []);

  // Add emoji from URL
  const addEmojiFromUrl = useCallback(async (url, metadata = {}) => {
    try {
      const result = await enhancedCustomEmojiService.addEmojiFromUrl(url, metadata);
      setEmojis([...enhancedCustomEmojiService.emojis]);
      setCategories({...enhancedCustomEmojiService.categories});
      setMetrics(enhancedCustomEmojiService.getMetrics());
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Delete emoji
  const deleteEmoji = useCallback((emojiId) => {
    try {
      enhancedCustomEmojiService.deleteEmoji(emojiId);
      setEmojis([...enhancedCustomEmojiService.emojis]);
      setFavorites([...enhancedCustomEmojiService.favorites]);
      setRecent([...enhancedCustomEmojiService.recent]);
      setCategories({...enhancedCustomEmojiService.categories});
      setMetrics(enhancedCustomEmojiService.getMetrics());
    } catch (error) {
      throw error;
    }
  }, []);

  // Update emoji
  const updateEmoji = useCallback((emojiId, updates) => {
    try {
      const result = enhancedCustomEmojiService.updateEmoji(emojiId, updates);
      setEmojis([...enhancedCustomEmojiService.emojis]);
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((emojiId) => {
    try {
      const isFavorite = enhancedCustomEmojiService.toggleFavorite(emojiId);
      setFavorites([...enhancedCustomEmojiService.favorites]);
      return isFavorite;
    } catch (error) {
      throw error;
    }
  }, []);

  // Add to recent
  const addToRecent = useCallback((emojiId) => {
    try {
      enhancedCustomEmojiService.addToRecent(emojiId);
      setRecent([...enhancedCustomEmojiService.recent]);
    } catch (error) {
      throw error;
    }
  }, []);

  // Search emojis
  const searchEmojis = useCallback((query, options = {}) => {
    return enhancedCustomEmojiService.search(query, options);
  }, []);

  // Create category
  const createCategory = useCallback((categoryId, name) => {
    try {
      const result = enhancedCustomEmojiService.createCategory(categoryId, name);
      setCategories({...enhancedCustomEmojiService.categories});
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback((categoryId) => {
    try {
      const result = enhancedCustomEmojiService.deleteCategory(categoryId);
      setCategories({...enhancedCustomEmojiService.categories});
      setEmojis([...enhancedCustomEmojiService.emojis]);
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Export emoji pack
  const exportEmojiPack = useCallback((category = null) => {
    return enhancedCustomEmojiService.exportEmojiPack(category);
  }, []);

  // Import emoji pack
  const importEmojiPack = useCallback(async (packData) => {
    try {
      const result = await enhancedCustomEmojiService.importEmojiPack(packData);
      setEmojis([...enhancedCustomEmojiService.emojis]);
      setCategories({...enhancedCustomEmojiService.categories});
      setMetrics(enhancedCustomEmojiService.getMetrics());
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Clear all data
  const clearAll = useCallback(() => {
    enhancedCustomEmojiService.clearAll();
    setEmojis([]);
    setFavorites([]);
    setRecent([]);
    setCategories(enhancedCustomEmojiService.getDefaultCategories());
    setMetrics(enhancedCustomEmojiService.getMetrics());
  }, []);

  return {
    // State
    emojis,
    favorites,
    recent,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isUploading,
    uploadProgress,
    metrics,
    
    // Computed
    filteredEmojis: filteredEmojis(),
    
    // Actions
    uploadEmoji,
    addEmojiFromUrl,
    deleteEmoji,
    updateEmoji,
    toggleFavorite,
    addToRecent,
    searchEmojis,
    createCategory,
    deleteCategory,
    exportEmojiPack,
    importEmojiPack,
    clearAll,
    
    // Constants
    EMOJI_CATEGORIES
  };
};

export default useEnhancedCustomEmojis;