'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import enhancedSearchService from '../../services/EnhancedSearchService';

/**
 * Enhanced Message Search Panel
 * 
 * Features:
 * - Real-time search with debouncing
 * - Highlighted search terms in results
 * - Filter by message type (text, media, links, etc.)
 * - Filter by date range
 * - Filter by sender
 * - Jump to message in conversation
 * - Search result count with navigation
 * - Keyboard navigation (Enter to search, Esc to close)
 */
export default function MessageSearchPanel({ 
  messages = [], 
  onJumpToMessage, 
  onClose,
  currentUser 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState({
    messageTypes: [],
    senders: [],
    dateRange: 'all', // all, today, week, month
    sentiment: 'all', // all, positive, negative, neutral
    importance: 'all', // all, high, medium, low
    hasAttachments: false,
    hasReactions: false,
    isEdited: false
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Perform search with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim() && !hasActiveFilters()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(() => {
      performSearch();
      setIsSearching(false);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, selectedFilters, messages]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      selectedFilters.messageTypes.length > 0 ||
      selectedFilters.senders.length > 0 ||
      selectedFilters.dateRange !== 'all' ||
      selectedFilters.sentiment !== 'all' ||
      selectedFilters.importance !== 'all' ||
      selectedFilters.hasAttachments ||
      selectedFilters.hasReactions ||
      selectedFilters.isEdited
    );
  };

  const parseOperators = (input) => {
    return enhancedSearchService.parseQuery(input);
  };

  const performSearch = () => {
    if (!searchQuery.trim() && !hasActiveFilters()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = enhancedSearchService.search(messages, searchQuery, selectedFilters);
      setSearchResults(results);
      setCurrentResultIndex(results.length > 0 ? 0 : 0);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const filterByDateRange = (dateString, range) => {
    return enhancedSearchService.matchesDateRange(dateString, range);
  };

  const highlightText = (text, query) => {
    if (!text || !query) return text;
    
    // Use the enhanced search service for highlighting
    const highlighted = enhancedSearchService.highlightText(text, query);
    
    // Convert to JSX elements
    const parts = highlighted.split(/(<mark[^>]*>.*?<\/mark>)/gi);
    return parts.map((part, index) => {
      if (part.startsWith('<mark') && part.endsWith('</mark>')) {
        const content = part.replace(/<mark[^>]*>(.*?)<\/mark>/i, '$1');
        return <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 rounded px-0.5">{content}</mark>;
      }
      return part;
    });
  };

  const handleNavigateResult = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex = currentResultIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
    }

    setCurrentResultIndex(newIndex);
    if (onJumpToMessage && searchResults[newIndex]) {
      onJumpToMessage(searchResults[newIndex].messageid);
    }
  };

  const handleResultClick = (messageId, index) => {
    setCurrentResultIndex(index);
    if (onJumpToMessage) {
      onJumpToMessage(messageId);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose?.();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      handleNavigateResult('next');
    }
  };

  const toggleFilter = (filterType, value) => {
    setSelectedFilters(prev => {
      const current = prev[filterType] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: updated };
    });
  };

  const getMessageTypeIcon = (type) => {
    const icons = {
      text: '💬',
      image: '📷',
      video: '🎥',
      voice: '🎤',
      gif: '🎬',
      sticker: '🎨',
      file: '📎',
      link: '🔗'
    };
    return icons[type] || '💬';
  };

  const uniqueSenders = [...new Map(
    messages.map(m => [m.senderid, { id: m.senderid, name: m.sender?.name || m.sender?.username }])
  ).values()];

  const messageTypes = ['text', 'image', 'video', 'voice', 'gif', 'file', 'link'];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Messages
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Result Navigation */}
        {searchResults.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm text-white">
            <span>
              {currentResultIndex + 1} of {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleNavigateResult('prev')}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                disabled={searchResults.length === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handleNavigateResult('next')}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                disabled={searchResults.length === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
        {/* Message Type Filters */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Message Type</label>
          <div className="flex flex-wrap gap-2">
            {messageTypes.map(type => (
              <button
                key={type}
                onClick={() => toggleFilter('messageTypes', type)}
                className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                  selectedFilters.messageTypes.includes(type)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{getMessageTypeIcon(type)}</span>
                <span className="capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Date Range</label>
          <div className="flex gap-2">
            {['all', 'today', 'week', 'month'].map(range => (
              <button
                key={range}
                onClick={() => setSelectedFilters(prev => ({ ...prev, dateRange: range }))}
                className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                  selectedFilters.dateRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="space-y-3">
          {/* Sentiment Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Sentiment</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All', icon: '😊' },
                { value: 'positive', label: 'Positive', icon: '😊' },
                { value: 'negative', label: 'Negative', icon: '😞' },
                { value: 'neutral', label: 'Neutral', icon: '😐' }
              ].map(sentiment => (
                <button
                  key={sentiment.value}
                  onClick={() => setSelectedFilters(prev => ({ ...prev, sentiment: sentiment.value }))}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                    selectedFilters.sentiment === sentiment.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{sentiment.icon}</span>
                  <span>{sentiment.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Importance Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Importance</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All', icon: '⭐' },
                { value: 'high', label: 'High', icon: '🔴' },
                { value: 'medium', label: 'Medium', icon: '🟡' },
                { value: 'low', label: 'Low', icon: '🟢' }
              ].map(importance => (
                <button
                  key={importance.value}
                  onClick={() => setSelectedFilters(prev => ({ ...prev, importance: importance.value }))}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                    selectedFilters.importance === importance.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{importance.icon}</span>
                  <span>{importance.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Boolean Filters */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Special Filters</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'hasAttachments', label: 'Has Attachments', icon: '📎' },
                { key: 'hasReactions', label: 'Has Reactions', icon: '👍' },
                { key: 'isEdited', label: 'Edited Messages', icon: '✏️' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilters(prev => ({ 
                    ...prev, 
                    [filter.key]: !prev[filter.key] 
                  }))}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                    selectedFilters[filter.key]
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          </div>
        ) : searchQuery && searchResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No messages found</p>
            <p className="text-sm mt-1">Try different search terms or filters</p>
          </div>
        ) : searchQuery ? (
          <div className="space-y-2">
            {searchResults.map((message, index) => (
              <div
                key={message.messageid}
                onClick={() => handleResultClick(message.messageid, index)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  index === currentResultIndex
                    ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600 shadow-md'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="flex items-start space-x-2 mb-1">
                  <span className="text-lg">{getMessageTypeIcon(message.messageType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {message.sender?.name || message.sender?.username || 'Unknown'}
                      </span>
                      {message.createdAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                      {message.content ? highlightText(message.content, searchQuery) : getMessageTypeIcon(message.messageType) + ' ' + message.messageType}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>Start typing to search messages</p>
          </div>
        )}
      </div>

      {/* Footer with keyboard shortcuts */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Press <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> for next</span>
          <span><kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
