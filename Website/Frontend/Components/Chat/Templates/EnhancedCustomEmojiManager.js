'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Upload, Download, Trash2, Star, StarOff, 
  Edit3, Save, X, FolderPlus, Package, Share2, Settings,
  Filter, SortAsc, SortDesc
} from 'lucide-react';
import useEnhancedCustomEmojis from '../../hooks/useEnhancedCustomEmojis';

const EnhancedCustomEmojiManager = ({ 
  isOpen, 
  onClose, 
  onEmojiSelect,
  theme = 'default'
}) => {
  const {
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
    filteredEmojis,
    uploadEmoji,
    deleteEmoji,
    toggleFavorite,
    updateEmoji,
    createCategory,
    exportEmojiPack,
    importEmojiPack
  } = useEnhancedCustomEmojis();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingEmoji, setEditingEmoji] = useState(null);
  const [newEmojiData, setNewEmojiData] = useState({ name: '', category: 'community', tags: '' });
  const [newCategoryData, setNewCategoryData] = useState({ id: '', name: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedEmojis, setSelectedEmojis] = useState([]);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      await uploadEmoji(file, {
        name: newEmojiData.name || file.name.replace(/\.[^/.]+$/, ""),
        category: newEmojiData.category,
        tags: newEmojiData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      
      // Reset form
      setNewEmojiData({ name: '', category: 'community', tags: '' });
      setShowUploadForm(false);
    } catch (error) {
      alert(`Failed to upload emoji: ${error.message}`);
    }
  };

  // Handle emoji click
  const handleEmojiClick = (emoji) => {
    if (selectedEmojis.length > 0) {
      // Toggle selection
      if (selectedEmojis.includes(emoji.id)) {
        setSelectedEmojis(selectedEmojis.filter(id => id !== emoji.id));
      } else {
        setSelectedEmojis([...selectedEmojis, emoji.id]);
      }
    } else {
      // Select emoji
      onEmojiSelect(emoji.url);
      onClose();
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedEmojis.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedEmojis.length} emojis?`)) {
      selectedEmojis.forEach(id => deleteEmoji(id));
      setSelectedEmojis([]);
    }
  };

  // Handle bulk export
  const handleBulkExport = () => {
    if (selectedEmojis.length === 0) return;
    
    const pack = {
      name: 'Selected Emojis',
      version: '1.0',
      emojis: emojis.filter(e => selectedEmojis.includes(e.id)),
      exportedAt: new Date().toISOString()
    };
    
    downloadEmojiPack(pack);
  };

  // Download emoji pack
  const downloadEmojiPack = (pack) => {
    const dataStr = JSON.stringify(pack, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${pack.name.replace(/\s+/g, '_')}_emojis.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Handle import emoji pack
  const handleImportPack = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const packData = JSON.parse(text);
      await importEmojiPack(packData);
      alert(`Successfully imported ${packData.emojis?.length || 0} emojis`);
    } catch (error) {
      alert(`Failed to import emoji pack: ${error.message}`);
    }
  };

  // Sort emojis
  const sortedEmojis = [...filteredEmojis].sort((a, b) => {
    if (sortConfig.key === 'name') {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    } else if (sortConfig.key === 'category') {
      const catA = a.category.toLowerCase();
      const catB = b.category.toLowerCase();
      if (catA < catB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (catA > catB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    } else if (sortConfig.key === 'uploadedAt') {
      const dateA = new Date(a.uploadedAt);
      const dateB = new Date(b.uploadedAt);
      if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  });

  // Toggle sort direction
  const toggleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div className={`w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl border overflow-hidden flex flex-col ${
          theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-4 border-b ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Custom Emoji Manager
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search and Actions */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search custom emojis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </button>
                
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Category</span>
                </button>
                
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className={`flex items-center justify-between px-4 py-2 border-b overflow-x-auto ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-1">
              {Object.entries(categories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === key
                      ? 'bg-blue-500 text-white shadow-sm'
                      : theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
              
              <button
                onClick={() => setSelectedCategory('favorites')}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === 'favorites'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : theme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                Favorites ({favorites.length})
              </button>
            </div>
            
            {/* Bulk Actions */}
            {selectedEmojis.length > 0 && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {selectedEmojis.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBulkExport}
                  className="p-1.5 text-blue-500 hover:bg-blue-500 hover:bg-opacity-10 rounded"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Sort Controls */}
          <div className={`px-4 py-2 border-b flex items-center justify-between ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleSort('name')}
                className={`flex items-center gap-1 text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Name</span>
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={() => toggleSort('category')}
                className={`flex items-center gap-1 text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Category</span>
                {sortConfig.key === 'category' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={() => toggleSort('uploadedAt')}
                className={`flex items-center gap-1 text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Date</span>
                {sortConfig.key === 'uploadedAt' && (
                  sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {emojis.length} emojis
            </div>
          </div>
          
          {/* Emoji Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isUploading && (
              <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    Uploading emoji...
                  </span>
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {sortedEmojis.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {sortedEmojis.map((emoji) => (
                  <motion.div
                    key={emoji.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative group rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      selectedEmojis.includes(emoji.id)
                        ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                        : theme === 'dark'
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {/* Selection Overlay */}
                    {selectedEmojis.length > 0 && (
                      <div className={`absolute inset-0 rounded-lg flex items-center justify-center ${
                        selectedEmojis.includes(emoji.id)
                          ? 'bg-blue-500 bg-opacity-20'
                          : 'bg-black bg-opacity-0 group-hover:bg-opacity-20'
                      } transition-all duration-200`}>
                        {selectedEmojis.includes(emoji.id) && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Emoji Image */}
                    <div className="p-3 flex items-center justify-center">
                      <img 
                        src={emoji.url} 
                        alt={emoji.name} 
                        className={`w-12 h-12 object-contain ${
                          emoji.animated ? 'animate-pulse' : ''
                        }`}
                      />
                    </div>
                    
                    {/* Emoji Info */}
                    <div className={`p-2 border-t ${
                      theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <div className={`text-xs font-medium truncate ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {emoji.name}
                      </div>
                      <div className={`text-xs truncate ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {categories[emoji.category]?.name || emoji.category}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(emoji.id);
                        }}
                        className={`p-1 rounded-full ${
                          favorites.includes(emoji.id)
                            ? 'bg-yellow-500 text-white'
                            : theme === 'dark'
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {favorites.includes(emoji.id) ? (
                          <Star className="w-3 h-3" fill="currentColor" />
                        ) : (
                          <StarOff className="w-3 h-3" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEmoji(emoji);
                        }}
                        className={`p-1 rounded-full ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this emoji?')) {
                            deleteEmoji(emoji.id);
                          }
                        }}
                        className={`p-1 rounded-full ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-red-400 hover:bg-red-900 hover:text-red-300'
                            : 'bg-white text-red-500 hover:bg-red-100'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Package className={`w-8 h-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <h3 className={`text-lg font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  No custom emojis yet
                </h3>
                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Upload your first custom emoji to get started
                </p>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Emoji</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className={`px-4 py-3 border-t flex items-center justify-between text-sm ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center gap-4">
              <span>Emoji Storage: {metrics.emojiCount}/100</span>
              <span>Uploads: {metrics.uploads}</span>
              <span>Errors: {metrics.errors}</span>
            </div>
            <div>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
        
        {/* Upload Form Modal */}
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div className={`w-full max-w-md rounded-xl shadow-2xl border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`p-4 border-b ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Upload Custom Emoji
                    </h3>
                    <button
                      onClick={() => setShowUploadForm(false)}
                      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Emoji Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <p className={`mt-1 text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      PNG, JPG, GIF, or WebP. Max 5MB, 256x256px
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={newEmojiData.name}
                      onChange={(e) => setNewEmojiData({...newEmojiData, name: e.target.value})}
                      placeholder="Emoji name"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Category
                    </label>
                    <select
                      value={newEmojiData.category}
                      onChange={(e) => setNewEmojiData({...newEmojiData, category: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {Object.entries(categories).map(([key, category]) => (
                        <option key={key} value={key}>{category.name}</option>
                      ))}
                      <option value="animated">Animated</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newEmojiData.tags}
                      onChange={(e) => setNewEmojiData({...newEmojiData, tags: e.target.value})}
                      placeholder="funny, happy, celebration"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowUploadForm(false)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Category Form Modal */}
        <AnimatePresence>
          {showCategoryForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div className={`w-full max-w-md rounded-xl shadow-2xl border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`p-4 border-b ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Create New Category
                    </h3>
                    <button
                      onClick={() => setShowCategoryForm(false)}
                      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Category ID
                    </label>
                    <input
                      type="text"
                      value={newCategoryData.id}
                      onChange={(e) => setNewCategoryData({...newCategoryData, id: e.target.value})}
                      placeholder="e.g., team-emojis"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategoryData.name}
                      onChange={(e) => setNewCategoryData({...newCategoryData, name: e.target.value})}
                      placeholder="e.g., Team Emojis"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowCategoryForm(false)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (newCategoryData.id && newCategoryData.name) {
                          try {
                            createCategory(newCategoryData.id, newCategoryData.name);
                            setNewCategoryData({ id: '', name: '' });
                            setShowCategoryForm(false);
                          } catch (error) {
                            alert(`Failed to create category: ${error.message}`);
                          }
                        }
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div className={`w-full max-w-md rounded-xl shadow-2xl border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`p-4 border-b ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Export Emoji Pack
                    </h3>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Export Options
                    </label>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          const pack = exportEmojiPack();
                          downloadEmojiPack(pack);
                          setShowExportModal(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          theme === 'dark' 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          All Emojis
                        </div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Export all {emojis.length} custom emojis
                        </div>
                      </button>
                      
                      {Object.entries(categories).map(([key, category]) => (
                        category.count > 0 && (
                          <button
                            key={key}
                            onClick={() => {
                              const pack = exportEmojiPack(key);
                              downloadEmojiPack(pack);
                              setShowExportModal(false);
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              theme === 'dark' 
                                ? 'border-gray-600 hover:bg-gray-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`font-medium ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {category.name}
                            </div>
                            <div className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Export {category.count} emojis
                            </div>
                          </button>
                        )
                      ))}
                      
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <label className={`block text-sm font-medium mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Import Emoji Pack
                        </label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportPack}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        <p className={`mt-1 text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Import emojis from a JSON file
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowExportModal(false)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Edit Emoji Modal */}
        <AnimatePresence>
          {editingEmoji && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div className={`w-full max-w-md rounded-xl shadow-2xl border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <div className={`p-4 border-b ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Edit Emoji
                    </h3>
                    <button
                      onClick={() => setEditingEmoji(null)}
                      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-center mb-6">
                    <img 
                      src={editingEmoji.url} 
                      alt={editingEmoji.name} 
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingEmoji.name}
                      onChange={(e) => setEditingEmoji({...editingEmoji, name: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Category
                    </label>
                    <select
                      value={editingEmoji.category}
                      onChange={(e) => setEditingEmoji({...editingEmoji, category: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {Object.entries(categories).map(([key, category]) => (
                        <option key={key} value={key}>{category.name}</option>
                      ))}
                      <option value="animated">Animated</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editingEmoji.tags?.join(', ') || ''}
                      onChange={(e) => setEditingEmoji({...editingEmoji, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingEmoji(null)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        try {
                          updateEmoji(editingEmoji.id, {
                            name: editingEmoji.name,
                            category: editingEmoji.category,
                            tags: editingEmoji.tags
                          });
                          setEditingEmoji(null);
                        } catch (error) {
                          alert(`Failed to update emoji: ${error.message}`);
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedCustomEmojiManager;