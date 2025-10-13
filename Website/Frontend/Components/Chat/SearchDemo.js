'use client';

import React, { useState } from 'react';
import EnhancedSearchPanel from './EnhancedSearchPanel';
import useEnhancedSearch from '../../hooks/useEnhancedSearch';

const SearchDemo = () => {
  // Sample messages for demo
  const sampleMessages = [
    {
      messageid: '1',
      content: 'Hello everyone! Welcome to our chat room. This is a great place to discuss projects.',
      sender: { name: 'Alice Johnson', username: 'alice' },
      senderid: 'user1',
      messageType: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      sentiment: 'positive',
      priority: 'medium',
      isPinned: false,
      isBookmarked: false,
      attachments: []
    },
    {
      messageid: '2',
      content: 'Check out this amazing sunset photo I took yesterday!',
      sender: { name: 'Bob Smith', username: 'bob' },
      senderid: 'user2',
      messageType: 'image',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      sentiment: 'positive',
      priority: 'low',
      isPinned: true,
      isBookmarked: true,
      attachments: [{ type: 'image', filename: 'sunset.jpg' }]
    },
    {
      messageid: '3',
      content: 'I need help with the project deadline. It\'s getting urgent!',
      sender: { name: 'Charlie Brown', username: 'charlie' },
      senderid: 'user3',
      messageType: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      sentiment: 'negative',
      priority: 'high',
      isPinned: false,
      isBookmarked: false,
      attachments: [],
      isEdited: true
    },
    {
      messageid: '4',
      content: 'Here\'s the presentation file for tomorrow\'s meeting.',
      sender: { name: 'Diana Prince', username: 'diana' },
      senderid: 'user4',
      messageType: 'file',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      sentiment: 'neutral',
      priority: 'medium',
      isPinned: false,
      isBookmarked: false,
      attachments: [{ type: 'file', filename: 'presentation.pptx' }]
    },
    {
      messageid: '5',
      content: 'Don\'t forget about the team building event next Friday!',
      sender: { name: 'Eve Wilson', username: 'eve' },
      senderid: 'user5',
      messageType: 'text',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      sentiment: 'positive',
      priority: 'low',
      isPinned: false,
      isBookmarked: false,
      attachments: []
    },
    {
      messageid: '6',
      content: 'The quarterly report is now available for review.',
      sender: { name: 'Frank Miller', username: 'frank' },
      senderid: 'user6',
      messageType: 'file',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
      sentiment: 'neutral',
      priority: 'high',
      isPinned: true,
      isBookmarked: false,
      attachments: [{ type: 'file', filename: 'quarterly_report.pdf' }]
    }
  ];

  const [showSearch, setShowSearch] = useState(false);
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchMetrics
  } = useEnhancedSearch(sampleMessages);

  const handleJumpToMessage = (messageId) => {
    console.log('Jumping to message:', messageId);
    // In a real app, this would scroll to the message in the chat
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Enhanced Search Demo</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Demonstration of advanced search capabilities with operators and filters
        </p>

        {/* Demo Controls */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Try These Search Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-600 p-3 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Operators</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">from:alice</code> - Messages from Alice</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">has:image</code> - Messages with images</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">is:pinned</code> - Pinned messages</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">after:2023-01-01</code> - Recent messages</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-600 p-3 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Filters</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>Sentiment: Positive/Negative/Neutral</li>
                <li>Priority: Low/Medium/High/Critical</li>
                <li>Date Range: Today/Week/Month/Year</li>
                <li>Message Types: Text/Image/Video/etc.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Messages
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search messages... (e.g., 'from:alice has:image')"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              {showSearch ? 'Hide' : 'Show'} Search Panel
            </button>
          </div>
        </div>

        {/* Search Results Preview */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Search Results ({searchResults.length})
          </h2>
          
          {isSearching ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.slice(0, 5).map((message) => (
                <div key={message.messageid} className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {message.sender?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {message.sender?.name || 'Unknown'}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {message.content}
                      </p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {searchResults.length > 5 && (
                <div className="text-center py-3 text-gray-500 dark:text-gray-400">
                  + {searchResults.length - 5} more results
                </div>
              )}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No messages found</p>
              <p className="text-sm mt-1">Try different search terms or filters</p>
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

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-300">{searchMetrics.searchesPerformed}</div>
            <div className="text-sm text-blue-800 dark:text-blue-200">Searches</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
            <div className="text-xl font-bold text-green-600 dark:text-green-300">{searchMetrics.cacheHitRate}</div>
            <div className="text-sm text-green-800 dark:text-green-200">Cache Hit Rate</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-300">{searchMetrics.averageSearchTime.toFixed(2)}ms</div>
            <div className="text-sm text-purple-800 dark:text-purple-200">Avg Time</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3">
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-300">{searchMetrics.cacheSize}</div>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">Cache Size</div>
          </div>
        </div>

        {/* Sample Messages */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Sample Messages
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sampleMessages.map((message) => (
              <div key={message.messageid} className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {message.sender?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {message.sender?.name || 'Unknown'}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {message.content}
                    </p>
                    <div className="flex items-center mt-2 space-x-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        message.priority === 'high' || message.priority === 'critical' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                          : message.priority === 'medium' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {message.priority}
                      </span>
                      {message.isPinned && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Pinned
                        </span>
                      )}
                      {message.sentiment && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                          {message.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Search Panel */}
      {showSearch && (
        <EnhancedSearchPanel
          messages={sampleMessages}
          onJumpToMessage={handleJumpToMessage}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
};

export default SearchDemo;