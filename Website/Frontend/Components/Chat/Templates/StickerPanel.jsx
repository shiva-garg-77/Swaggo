'use client';

import React, { useState, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Heart, Zap } from 'lucide-react';

// Enhanced Stickers with categories
const STICKER_CATEGORIES = {
  emotions: [
    { id: 1, url: '/stickers/happy.png', name: 'Happy', preview: '😊' },
    { id: 2, url: '/stickers/love.png', name: 'Love', preview: '😍' },
    { id: 3, url: '/stickers/laugh.png', name: 'Laugh', preview: '😂' },
    { id: 4, url: '/stickers/cool.png', name: 'Cool', preview: '😎' },
    { id: 5, url: '/stickers/thinking.png', name: 'Thinking', preview: '🤔' },
    { id: 6, url: '/stickers/angry.png', name: 'Angry', preview: '😠' },
  ],
  reactions: [
    { id: 7, url: '/stickers/thumbs-up.png', name: 'Thumbs Up', preview: '👍' },
    { id: 8, url: '/stickers/clap.png', name: 'Clap', preview: '👏' },
    { id: 9, url: '/stickers/fire.png', name: 'Fire', preview: '🔥' },
    { id: 10, url: '/stickers/heart.png', name: 'Heart', preview: '❤️' },
    { id: 11, url: '/stickers/star.png', name: 'Star', preview: '⭐' },
    { id: 12, url: '/stickers/party.png', name: 'Party', preview: '🎉' },
  ],
  animals: [
    { id: 13, url: '/stickers/cat.png', name: 'Cat', preview: '🐱' },
    { id: 14, url: '/stickers/dog.png', name: 'Dog', preview: '🐶' },
    { id: 15, url: '/stickers/panda.png', name: 'Panda', preview: '🐼' },
    { id: 16, url: '/stickers/lion.png', name: 'Lion', preview: '🦁' },
    { id: 17, url: '/stickers/tiger.png', name: 'Tiger', preview: '🐯' },
    { id: 18, url: '/stickers/fox.png', name: 'Fox', preview: '🦊' },
  ]
};

// Category icons mapping
const CATEGORY_ICONS = {
  emotions: Heart,
  reactions: Zap,
  animals: Star
};

/**
 * PERFORMANCE OPTIMIZATION: Extracted StickerPanel component  
 * Benefits:
 * - Reduced main component bundle size
 * - Lazy loading of sticker assets
 * - Memoized sticker rendering
 * - Efficient category switching
 */
const StickerPanel = memo(({ 
  isOpen, 
  onClose, 
  onStickerSelect, 
  theme = 'default' 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('emotions');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStickers, setLoadingStickers] = useState(new Set());

  // Memoized filtered stickers for performance
  const filteredStickers = useMemo(() => {
    const categoryStickers = STICKER_CATEGORIES[selectedCategory] || [];
    
    if (!searchQuery) return categoryStickers;
    
    return categoryStickers.filter(sticker =>
      sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sticker.preview.includes(searchQuery)
    );
  }, [selectedCategory, searchQuery]);

  // Handle sticker loading state
  const handleStickerLoad = useCallback((stickerId) => {
    setLoadingStickers(prev => {
      const newSet = new Set(prev);
      newSet.delete(stickerId);
      return newSet;
    });
  }, []);

  const handleStickerError = useCallback((stickerId) => {
    console.warn(`Failed to load sticker: ${stickerId}`);
    setLoadingStickers(prev => {
      const newSet = new Set(prev);
      newSet.delete(stickerId);
      return newSet;
    });
  }, []);

  const handleStickerClick = useCallback((sticker) => {
    onStickerSelect(sticker);
    onClose();
  }, [onStickerSelect, onClose]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when changing categories
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full mb-2 left-0 w-96 h-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden"
      >
        {/* Header with Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-around p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          {Object.keys(STICKER_CATEGORIES).map((category) => {
            const IconComponent = CATEGORY_ICONS[category] || Heart;
            return (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">{category}</span>
              </button>
            );
          })}
        </div>

        {/* Stickers Grid */}
        <div className="p-2 overflow-y-auto h-56">
          {filteredStickers.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {filteredStickers.map((sticker) => (
                <motion.button
                  key={sticker.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStickerClick(sticker)}
                  className="relative p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:shadow-md transition-all duration-200 bg-gray-50 dark:bg-gray-700 aspect-square"
                  title={sticker.name}
                >
                  {/* Preview emoji as fallback */}
                  <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">
                    {sticker.preview}
                  </div>
                  
                  {/* Actual sticker image */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {loadingStickers.has(sticker.id) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                        />
                      </div>
                    )}
                    
                    <img
                      src={sticker.url}
                      alt={sticker.name}
                      className="w-full h-full object-contain rounded-lg"
                      onLoad={() => handleStickerLoad(sticker.id)}
                      onError={() => handleStickerError(sticker.id)}
                      onLoadStart={() => setLoadingStickers(prev => new Set(prev.add(sticker.id)))}
                    />
                  </div>
                  
                  {/* Sticker name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
                    {sticker.name}
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? 'No stickers found' : 'No stickers available'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-500 hover:underline mt-1"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with category info */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} stickers</span>
            <span>{filteredStickers.length} available</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

StickerPanel.displayName = 'StickerPanel';

export default StickerPanel;
export { STICKER_CATEGORIES };