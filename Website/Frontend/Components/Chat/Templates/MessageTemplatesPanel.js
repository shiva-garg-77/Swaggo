/**
 * MessageTemplatesPanel - Component for displaying and managing message templates
 * 
 * This component provides a UI for selecting, creating, and managing message templates.
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Edit2, Trash2, Folder } from 'lucide-react';
import { useMessageTemplates } from '../../../hooks/useMessageTemplates';

const MessageTemplatesPanel = ({ isOpen, onClose, onInsert }) => {
  const { templates, categories, loading, error, loadTemplates, searchTemplates } = useMessageTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter templates based on search and category
  useEffect(() => {
    let result = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(template => 
        template.title.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(result);
  }, [templates, searchQuery, selectedCategory]);

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const results = await searchTemplates(query);
        setFilteredTemplates(results);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Message Templates</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap flex items-center gap-1 ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Folder className="w-3 h-3" />
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading templates: {error}</p>
              <button 
                onClick={loadTemplates}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No templates found' : 'No templates yet'}
              </p>
              <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Create your first template
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map(template => (
                <div 
                  key={template.id} 
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => onInsert(template.content)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {template.content}
                      </p>
                      {template.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                          {template.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500">
                        <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500">
                        <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Manage Templates
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageTemplatesPanel;