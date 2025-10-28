'use client';

import React, { useState } from 'react';
import EnhancedCustomEmojiManager from './EnhancedCustomEmojiManager';
import useEnhancedCustomEmojis from '../../hooks/useEnhancedCustomEmojis';

const CustomEmojiDemo = () => {
  const {
    emojis,
    favorites,
    recent,
    categories,
    metrics,
    uploadEmoji,
    deleteEmoji,
    toggleFavorite,
    searchEmojis
  } = useEnhancedCustomEmojis();

  const [showManager, setShowManager] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');

  // Search results
  const searchResults = searchQuery 
    ? searchEmojis(searchQuery)
    : [];

  // Handle emoji selection
  const handleEmojiSelect = (emojiUrl) => {
    setSelectedEmoji(emojiUrl);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      await uploadEmoji(file, {
        name: file.name.replace(/\.[^/.]+$/, ""),
        category: 'community',
        tags: ['demo', 'test']
      });
      alert('Emoji uploaded successfully!');
    } catch (error) {
      alert(`Failed to upload emoji: ${error.message}`);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto p-6">
        <div className={`rounded-lg shadow-lg p-6 mb-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Enhanced Custom Emoji Demo
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <button
                onClick={() => setShowManager(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Open Emoji Manager
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <div className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {metrics.emojiCount}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Emojis
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'
            }`}>
              <div className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                {favorites.length}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Favorites
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'
            }`}>
              <div className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
              }`}>
                {recent.length}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Recent
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-50'
            }`}>
              <div className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {metrics.uploads}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Uploads
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-red-50'
            }`}>
              <div className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {metrics.errors}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Errors
              </div>
            </div>
          </div>

          {/* Upload Demo */}
          <div className={`p-4 rounded-lg mb-6 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Upload New Emoji
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className={`text-sm self-center ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                PNG, JPG, GIF, or WebP. Max 5MB
              </p>
            </div>
          </div>

          {/* Search Demo */}
          <div className={`p-4 rounded-lg mb-6 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Search Emojis
            </h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emojis by name or tag..."
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {searchQuery && (
              <div className="mt-4">
                <h3 className={`text-md font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {searchResults.slice(0, 8).map((emoji) => (
                      <div
                        key={emoji.id}
                        onClick={() => handleEmojiSelect(emoji.url)}
                        className={`p-3 rounded-lg cursor-pointer border-2 transition-all hover:scale-105 ${
                          selectedEmoji === emoji.url
                            ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                            : theme === 'dark'
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={emoji.url} 
                          alt={emoji.name} 
                          className="w-12 h-12 object-contain mx-auto"
                        />
                        <div className={`text-xs text-center mt-2 truncate ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {emoji.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No emojis found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Emoji Preview */}
          {selectedEmoji && (
            <div className={`p-4 rounded-lg mb-6 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <h2 className={`text-lg font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Selected Emoji
              </h2>
              <div className="flex items-center gap-4">
                <img 
                  src={selectedEmoji} 
                  alt="Selected emoji" 
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <p className={`mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Click on any emoji in the manager to select it here
                  </p>
                  <button
                    onClick={() => setSelectedEmoji(null)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories Overview */}
          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Emoji Categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(categories).map(([key, category]) => (
                <div 
                  key={key}
                  className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                  }`}
                >
                  <div className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {category.name}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {category.count} emojis
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className={`rounded-lg shadow-lg p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Enhanced Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
              }`}>
                Advanced Management
              </h3>
              <ul className={`text-sm space-y-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>• Create custom categories</li>
                <li>• Bulk emoji operations</li>
                <li>• Emoji tagging and search</li>
                <li>• Favorite emoji management</li>
              </ul>
            </div>
            
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-700'
              }`}>
                Enhanced Upload
              </h3>
              <ul className={`text-sm space-y-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>• File validation and optimization</li>
                <li>• Progress tracking</li>
                <li>• Metadata editing</li>
                <li>• Animated GIF support</li>
              </ul>
            </div>
            
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-purple-50'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-purple-400' : 'text-purple-700'
              }`}>
                Emoji Sharing
              </h3>
              <ul className={`text-sm space-y-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>• Export/import emoji packs</li>
                <li>• Share with team members</li>
                <li>• Backup and restore</li>
                <li>• Cross-platform compatibility</li>
              </ul>
            </div>
            
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-50'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'
              }`}>
                Performance
              </h3>
              <ul className={`text-sm space-y-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>• Local storage optimization</li>
                <li>• Memory management</li>
                <li>• Fast search and filtering</li>
                <li>• Usage analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom Emoji Manager */}
      {showManager && (
        <EnhancedCustomEmojiManager
          isOpen={showManager}
          onClose={() => setShowManager(false)}
          onEmojiSelect={handleEmojiSelect}
          theme={theme}
        />
      )}
    </div>
  );
};

export default CustomEmojiDemo;