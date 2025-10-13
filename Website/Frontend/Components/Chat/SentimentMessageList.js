import React, { useState, useMemo } from 'react';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import useSentimentAnalysis from '../../hooks/useSentimentAnalysis';
import { Smile, Frown, Meh, Heart, Angry, Filter, Search } from 'lucide-react';

/**
 * 😊 Sentiment Message List Component
 * 
 * Displays messages organized by AI-powered sentiment analysis
 * 
 * Features:
 * - Sentiment-based message filtering
 * - Search functionality
 * - Performance metrics
 */

export default function SentimentMessageList({ 
  messages = [],
  chat,
  currentUser,
  theme = 'light',
  onReply,
  onEdit,
  onDelete,
  onRetryMessage
}) {
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    sentimentDefinitions,
    getDefinitions
  } = useSentimentAnalysis();

  // Get sentiment icon component
  const getSentimentIcon = (sentimentType) => {
    switch (sentimentType) {
      case 'very_positive':
        return <Heart className="w-4 h-4 text-green-500" />;
      case 'positive':
        return <Smile className="w-4 h-4 text-green-400" />;
      case 'neutral':
        return <Meh className="w-4 h-4 text-gray-400" />;
      case 'negative':
        return <Frown className="w-4 h-4 text-yellow-500" />;
      case 'very_negative':
        return <Angry className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-gray-400" />;
    }
  };

  // Filter messages based on selected sentiment and search query
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Sentiment filter
      if (selectedSentiment !== 'all' && 
          (!message.sentiment?.sentiment || 
           message.sentiment.sentiment !== selectedSentiment)) {
        return false;
      }
      
      // Search filter
      if (searchQuery && 
          !message.content?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [messages, selectedSentiment, searchQuery]);

  // Group messages by sentiment
  const messagesBySentiment = useMemo(() => {
    const grouped = {};
    
    filteredMessages.forEach(message => {
      const sentiment = message.sentiment?.sentiment || 'neutral';
      
      if (!grouped[sentiment]) {
        grouped[sentiment] = [];
      }
      
      grouped[sentiment].push(message);
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
          <h2 className={`text-xl font-bold flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Smile className="w-6 h-6 mr-2 text-blue-500" />
            Sentiment Analysis
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sentiment filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Sentiment
                </label>
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Sentiments</option>
                  {Object.entries(sentimentDefinitions).map(([key, definition]) => (
                    <option key={key} value={key}>
                      {definition.label}
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
      
      {/* Messages by sentiment */}
      <div className="p-4">
        {Object.entries(messagesBySentiment).length > 0 ? (
          Object.entries(messagesBySentiment).map(([sentiment, sentimentMessages]) => {
            const definition = sentimentDefinitions[sentiment] || {
              label: sentiment,
              color: '#9CA3AF'
            };
            
            return (
              <div key={sentiment} className="mb-8">
                <div className={`flex items-center mb-4 p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {getSentimentIcon(sentiment)}
                  <h3 className={`text-lg font-semibold capitalize ml-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {definition.label}
                  </h3>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {sentimentMessages.length}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {sentimentMessages.map((message) => (
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
            );
          })
        ) : (
          <div className={`text-center py-12 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Smile className="w-12 h-12 mx-auto mb-4 opacity-50" />
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