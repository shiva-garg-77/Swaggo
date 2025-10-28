'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

// Mock GIF data - in a real implementation, this would come from an API
const MOCK_GIF_CATEGORIES = [
  { id: 'trending', name: 'Trending' },
  { id: 'funny', name: 'Funny' },
  { id: 'reaction', name: 'Reaction' },
  { id: 'happy', name: 'Happy' },
  { id: 'sad', name: 'Sad' },
  { id: 'angry', name: 'Angry' },
  { id: 'love', name: 'Love' },
  { id: 'celebration', name: 'Celebration' }
];

const MOCK_GIFS = [
  { id: '1', url: 'https://media.giphy.com/media/3o7TKsQ8UQ4l4LhGz6/giphy.gif', title: 'Happy Dance', category: 'trending' },
  { id: '2', url: 'https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif', title: 'Thumbs Up', category: 'reaction' },
  { id: '3', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', title: 'Laughing', category: 'funny' },
  { id: '4', url: 'https://media.giphy.com/media/l0HlHFRb9WJbXjC2c/giphy.gif', title: 'Excited', category: 'happy' },
  { id: '5', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', title: 'Dancing', category: 'trending' },
  { id: '6', url: 'https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif', title: 'Celebration', category: 'celebration' },
  { id: '7', url: 'https://media.giphy.com/media/3o7TKsQ8UQ4l4LhGz6/giphy.gif', title: 'Love', category: 'love' },
  { id: '8', url: 'https://media.giphy.com/media/l0HlHFRb9WJbXjC2c/giphy.gif', title: 'Angry', category: 'angry' },
  { id: '9', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', title: 'Sad', category: 'sad' },
  { id: '10', url: 'https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif', title: 'Surprised', category: 'reaction' },
  { id: '11', url: 'https://media.giphy.com/media/3o7TKsQ8UQ4l4LhGz6/giphy.gif', title: 'Confused', category: 'reaction' },
  { id: '12', url: 'https://media.giphy.com/media/l0HlHFRb9WJbXjC2c/giphy.gif', title: 'Thinking', category: 'reaction' }
];

export default function GifPanel({ isOpen, onClose, onGifSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [gifs, setGifs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter GIFs based on search and category
  const filteredGifs = useMemo(() => {
    let filtered = MOCK_GIFS;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(gif => gif.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(gif => 
        gif.title.toLowerCase().includes(query) || 
        gif.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

  // Simulate loading GIFs
  const loadGifs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setGifs(MOCK_GIFS);
    } catch (err) {
      setError('Failed to load GIFs');
      console.error('Error loading GIFs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadGifs();
    }
  }, [isOpen, loadGifs]);

  const handleGifClick = (gif) => {
    onGifSelect && onGifSelect(gif);
    onClose && onClose();
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GIFs</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Close GIF panel"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search GIFs..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleCategorySelect('all')}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {MOCK_GIF_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* GIFs Grid */}
      {error ? (
        <div className="text-center py-8 text-red-500 dark:text-red-400">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {filteredGifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => handleGifClick(gif)}
              className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Select ${gif.title} GIF`}
            >
              <img
                src={gif.url}
                alt={gif.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        Powered by GIPHY
      </div>
    </div>
  );
}