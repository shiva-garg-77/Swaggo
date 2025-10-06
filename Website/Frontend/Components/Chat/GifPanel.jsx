'use client';

import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Zap, Loader2 } from 'lucide-react';

// GIF Categories and sample data (extracted from existing component)
const GIF_CATEGORIES = ['Trending', 'Reaction', 'Love', 'Happy', 'Funny', 'Dance', 'Celebration', 'Good Morning', 'Good Night'];

const SAMPLE_GIFS = [
  { id: 1, url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', title: 'Dance', category: 'Dance' },
  { id: 2, url: 'https://media.giphy.com/media/l1J9wXoC8W4JFmREY/giphy.gif', title: 'Celebration', category: 'Celebration' },
  { id: 3, url: 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif', title: 'Happy', category: 'Happy' },
  { id: 4, url: 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif', title: 'Love', category: 'Love' },
  { id: 5, url: 'https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif', title: 'Funny', category: 'Funny' },
  { id: 6, url: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif', title: 'Reaction', category: 'Reaction' },
];

// Custom debounce hook for search performance
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * PERFORMANCE OPTIMIZATION: Extracted and improved GifPanel component
 * Benefits:
 * - Extracted from 3208-line monolithic component
 * - Added debounced search for better performance  
 * - Memoized GIF filtering and rendering
 * - Lazy loading of GIF images
 * - Better error handling for failed GIF loads
 * - Improved search functionality
 */
const GifPanel = memo(({ 
  isOpen, 
  onClose, 
  onGifSelect, 
  theme = 'default',
  initialCategory = 'Trending'
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingGifs, setLoadingGifs] = useState(new Set());
  const [failedGifs, setFailedGifs] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized filtered GIFs for performance
  const filteredGifs = useMemo(() => {
    let gifs = SAMPLE_GIFS;

    // Filter by category if no search query
    if (!debouncedSearchQuery && selectedCategory !== 'Trending') {
      gifs = gifs.filter(gif => gif.category === selectedCategory);
    }

    // Filter by search query if provided
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      gifs = gifs.filter(gif => 
        gif.title.toLowerCase().includes(query) ||
        gif.category.toLowerCase().includes(query)
      );
    }

    return gifs;
  }, [debouncedSearchQuery, selectedCategory]);

  // Handle search query changes with loading state
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  // Handle GIF loading states
  const handleGifLoad = useCallback((gifId) => {
    setLoadingGifs(prev => {
      const newSet = new Set(prev);
      newSet.delete(gifId);
      return newSet;
    });
  }, []);

  const handleGifError = useCallback((gifId) => {
    console.warn(`Failed to load GIF: ${gifId}`);
    setLoadingGifs(prev => {
      const newSet = new Set(prev);
      newSet.delete(gifId);
      return newSet;
    });
    setFailedGifs(prev => new Set(prev.add(gifId)));
  }, []);

  const handleGifClick = useCallback((gif) => {
    if (failedGifs.has(gif.id)) {
      console.warn('Cannot send failed GIF');
      return;
    }
    onGifSelect(gif);
    onClose();
  }, [onGifSelect, onClose, failedGifs]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when changing categories
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`mt-3 p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header with Search */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 mr-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search GIFs..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            aria-label="Close GIF panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Buttons */}
        {!searchQuery && (
          <div className="flex space-x-2 mb-3 overflow-x-auto pb-1">
            {GIF_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1 text-sm rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-red-500 text-white shadow-sm'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        
        {/* GIF Grid */}
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {filteredGifs.length > 0 ? (
            filteredGifs.map(gif => (
              <motion.button
                key={gif.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGifClick(gif)}
                className={`aspect-square rounded-lg overflow-hidden transition-all duration-200 relative ${
                  failedGifs.has(gif.id) 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'hover:shadow-lg cursor-pointer'
                }`}
                disabled={failedGifs.has(gif.id)}
                title={gif.title}
              >
                {/* Loading spinner */}
                {loadingGifs.has(gif.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                )}
                
                {/* Error state */}
                {failedGifs.has(gif.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900">
                    <div className="text-center">
                      <X className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
                    </div>
                  </div>
                )}
                
                {/* GIF Image */}
                <img
                  src={gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  onLoad={() => handleGifLoad(gif.id)}
                  onError={() => handleGifError(gif.id)}
                  onLoadStart={() => setLoadingGifs(prev => new Set(prev.add(gif.id)))}
                  loading="lazy"
                />
                
                {/* Hover overlay with title */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  {gif.title}
                </div>
              </motion.button>
            ))
          ) : (
            <div className="col-span-3 flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-2">
                  {searchQuery ? 'No GIFs found' : 'No GIFs in this category'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className={`mt-2 pt-2 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        } flex justify-between text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <span>
            {searchQuery ? `Search: "${searchQuery}"` : selectedCategory} 
          </span>
          <span>{filteredGifs.length} GIFs</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

GifPanel.displayName = 'GifPanel';

export default GifPanel;
export { GIF_CATEGORIES, SAMPLE_GIFS };