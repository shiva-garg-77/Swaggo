'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useEnhancedSearch from '../../hooks/useEnhancedSearch';

/**
 * Enhanced Message Search Panel
 * 
 * Features:
 * - Real-time search with debouncing
 * - Highlighted search terms in results
 * - Advanced filtering with operators
 * - Performance optimizations with caching
 * - Relevance-based sorting
 * - Keyboard navigation
 * - Search metrics and analytics
 */
export default function EnhancedSearchPanel({ 
  messages = [], 
  onJumpToMessage, 
  onClose,
  currentUser 
}) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    filters,
    setFilters,
    isSearching,
    searchMetrics,
    currentResultIndex,
    uniqueSenders,
    messageTypeCounts,
    toggleFilter,
    clearFilters,
    navigateResult,
    jumpToResult,
    highlightText,
    clearSearchCache,
    hasActiveFilters
  } = useEnhancedSearch(messages);

  const searchInputRef = useRef(null);
  const [showMetrics, setShowMetrics] = useState(false);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose?.();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      navigateResult('next');
    }
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

  const messageTypes = ['text', 'image', 'video', 'voice', 'gif', 'file', 'link'];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-linear-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Enhanced Search
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

        {/* Search Input with Operators Help */}
        <div className="relative mb-2">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages... (use from:, has:, is:)"
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

        {/* Search Operators Help */}
        <div className="text-xs text-blue-100 mb-2 flex flex-wrap gap-2">
          <span className="bg-blue-400 bg-opacity-30 px-2 py-1 rounded">from:user</span>
          <span className="bg-blue-400 bg-opacity-30 px-2 py-1 rounded">has:image</span>
          <span className="bg-blue-400 bg-opacity-30 px-2 py-1 rounded">is:pinned</span>
          <span className="bg-blue-400 bg-opacity-30 px-2 py-1 rounded">after:2023-01-01</span>
        </div>

        {/* Result Navigation */}
        {searchResults.length > 0 && (
          <div className="flex items-center justify-between text-sm text-white">
            <span>
              {currentResultIndex + 1} of {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => navigateResult('prev')}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                disabled={searchResults.length === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateResult('next')}
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 max-h-96 overflow-y-auto">
        {/* Active Filters Indicator */}
        {hasActiveFilters() && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Active Filters
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Message Type Filters */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
            Message Type
          </label>
          <div className="flex flex-wrap gap-2">
            {messageTypes.map(type => (
              <button
                key={type}
                onClick={() => toggleFilter('messageTypes', type)}
                className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                  filters.messageTypes.includes(type)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{getMessageTypeIcon(type)}</span>
                <span className="capitalize">{type}</span>
                {messageTypeCounts[type] && (
                  <span className="text-xs">({messageTypeCounts[type]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sender Filter */}
        {uniqueSenders.length > 1 && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
              Senders
            </label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {uniqueSenders.map(sender => (
                <button
                  key={sender.id}
                  onClick={() => toggleFilter('senders', sender.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filters.senders.includes(sender.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {sender.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {['all', 'today', 'week', 'month', 'year'].map(range => (
              <button
                key={range}
                onClick={() => setFilters(prev => ({ ...prev, dateRange: range }))}
                className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                  filters.dateRange === range
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
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
              Sentiment
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All', icon: '😊' },
                { value: 'positive', label: 'Positive', icon: '😊' },
                { value: 'negative', label: 'Negative', icon: '😞' },
                { value: 'neutral', label: 'Neutral', icon: '😐' }
              ].map(sentiment => (
                <button
                  key={sentiment.value}
                  onClick={() => setFilters(prev => ({ ...prev, sentiment: sentiment.value }))}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                    filters.sentiment === sentiment.value
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

          {/* Priority Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All', icon: '⭐' },
                { value: 'low', label: 'Low', icon: '🟢' },
                { value: 'medium', label: 'Medium', icon: '🟡' },
                { value: 'high', label: 'High', icon: '🟠' },
                { value: 'critical', label: 'Critical', icon: '🔴' }
              ].map(priority => (
                <button
                  key={priority.value}
                  onClick={() => setFilters(prev => ({ ...prev, priority: priority.value }))}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                    filters.priority === priority.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{priority.icon}</span>
                  <span>{priority.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Boolean Filters */}
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
              Special Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'hasAttachments', label: 'Has Attachments', icon: '📎' },
                { key: 'hasReactions', label: 'Has Reactions', icon: '👍' },
                { key: 'isEdited', label: 'Edited Messages', icon: '✏️' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => toggleFilter(filter.key, !filters[filter.key])}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition-colors ${
                    filters[filter.key]
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

        {/* Search Metrics Toggle */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 flex items-center"
          >
            <svg className={`w-4 h-4 mr-1 transition-transform ${showMetrics ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Search Performance Metrics
          </button>
          
          {showMetrics && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
              <div>Searches: {searchMetrics.searchesPerformed}</div>
              <div>Cache Hits: {searchMetrics.cacheHitRate}</div>
              <div>Avg Time: {searchMetrics.averageSearchTime.toFixed(2)}ms</div>
              <div>Cache Size: {searchMetrics.cacheSize}</div>
              <button
                onClick={clearSearchCache}
                className="col-span-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs"
              >
                Clear Cache
              </button>
            </div>
          )}
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
                onClick={() => {
                  jumpToResult(index);
                  if (onJumpToMessage) {
                    onJumpToMessage(message.messageid);
                  }
                }}
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
                    <div 
                      className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{ 
                        __html: message.content ? highlightText(message.content) : getMessageTypeIcon(message.messageType) + ' ' + message.messageType 
                      }}
                    />
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
            <p className="text-sm mt-1">Use operators like <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">from:</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">has:</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">is:</code></p>
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