import React, { useState, useMemo } from 'react';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import useSmartCategorization from '../../hooks/useSmartCategorization';
import { Folder, Tag, Filter, Search } from 'lucide-react';

/**
 * 📁 Categorized Message List Component
 * 
 * Displays messages organized by AI-powered categories and tags
 * 
 * Features:
 * - Category-based message filtering
 * - Tag-based message filtering
 * - Search functionality
 * - Performance metrics
 */

export default function CategorizedMessageList({ 
  messages = [],
  chat,
  currentUser,
  theme = 'light',
  onReply,
  onEdit,
  onDelete,
  onRetryMessage
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    categories,
    getCategories
  } = useSmartCategorization();

  // Get all unique tags from messages
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    messages.forEach(message => {
      if (message.categories?.tags) {
        message.categories.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [messages]);

  // Filter messages based on selected category, tag, and search query
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Category filter
      if (selectedCategory !== 'all' && 
          (!message.categories?.categories || 
           !message.categories.categories.includes(selectedCategory))) {
        return false;
      }
      
      // Tag filter
      if (selectedTag !== 'all' && 
          (!message.categories?.tags || 
           !message.categories.tags.includes(selectedTag))) {
        return false;
      }
      
      // Search filter
      if (searchQuery && 
          !message.content?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !message.categories?.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !message.categories?.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }
      
      return true;
    });
  }, [messages, selectedCategory, selectedTag, searchQuery]);

  // Group messages by category
  const messagesByCategory = useMemo(() => {
    const grouped = {};
    
    filteredMessages.forEach(message => {
      const categories = message.categories?.categories || ['uncategorized'];
      const primaryCategory = categories[0] || 'uncategorized';
      
      if (!grouped[primaryCategory]) {
        grouped[primaryCategory] = [];
      }
      
      grouped[primaryCategory].push(message);
    });
    
    return grouped;
  }, [filteredMessages]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      {/* Header with filters */}
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Categorized Messages
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? theme === 'dark' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-500 text-white'
                  : theme === 'dark' 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
        
        {/* Filters panel */}
        {showFilters && (
          <div className={`mt-4 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {Object.keys(categories).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="uncategorized">Uncategorized</option>
                </select>
              </div>
              
              {/* Tag filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tag
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Search */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Search
                </label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages by category */}
      <div className="p-4">
        {Object.entries(messagesByCategory).length > 0 ? (
          Object.entries(messagesByCategory).map(([category, categoryMessages]) => (
            <div key={category} className="mb-8">
              <div className={`flex items-center mb-4 p-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Folder className={`w-5 h-5 mr-2 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <h3 className={`text-lg font-semibold capitalize ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {category}
                </h3>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {categoryMessages.length}
                </span>
              </div>
              
              <div className="space-y-4">
                {categoryMessages.map((message) => (
                  <EnhancedMessageBubble
                    key={message.messageid}
                    message={message}
                    isOwn={message.sender?.profileid === currentUser?.profileid}
                    showAvatar={true}
                    chat={chat}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRetryMessage={onRetryMessage}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-12 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No messages found</p>
            <p className="text-sm mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}