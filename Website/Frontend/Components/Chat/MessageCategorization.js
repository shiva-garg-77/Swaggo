import React, { useState, useEffect } from 'react';
import useSmartCategorization from '../../hooks/useSmartCategorization';
import { Tag, Folder, BarChart, RefreshCw } from 'lucide-react';

/**
 * 🧠 Message Categorization Component
 * 
 * Displays AI-powered categorization and tagging for messages
 * 
 * Features:
 * - Real-time message categorization
 * - Category and tag display
 * - Confidence indicators
 * - Performance metrics
 */

export default function MessageCategorization({ 
  message, 
  theme = 'light',
  showMetrics = false
}) {
  const [categorization, setCategorization] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    isCategorizing,
    categorizationError,
    categorizeMessage,
    getMetrics,
    metrics
  } = useSmartCategorization();

  // Categorize message when it changes
  useEffect(() => {
    if (message?.content) {
      handleCategorize();
    }
  }, [message?.content]);

  const handleCategorize = async () => {
    if (!message?.content) return;
    
    try {
      const result = await categorizeMessage(message.content, {
        userId: message.sender?.profileid,
        chatId: message.chatId,
        timestamp: message.createdAt
      });
      
      setCategorization(result);
    } catch (error) {
      console.error('Categorization error:', error);
    }
  };

  const handleRefresh = async () => {
    await handleCategorize();
  };

  if (!message?.content) {
    return null;
  }

  if (isCategorizing) {
    return (
      <div className={`flex items-center p-2 rounded-lg ${
        theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
      }`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
        <span className={`text-sm ${
          theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
        }`}>
          Categorizing message...
        </span>
      </div>
    );
  }

  if (categorizationError) {
    return (
      <div className={`flex items-center p-2 rounded-lg ${
        theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
      }`}>
        <div className={`text-sm ${
          theme === 'dark' ? 'text-red-300' : 'text-red-700'
        }`}>
          Failed to categorize message: {categorizationError}
        </div>
      </div>
    );
  }

  if (!categorization) {
    return null;
  }

  return (
    <div className={`mt-2 p-3 rounded-lg border ${
      theme === 'dark' 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Folder className="w-4 h-4 text-blue-500 mr-2" />
          <span className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          }`}>
            Message Categorization
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className={`p-1 rounded transition-colors ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
          title="Refresh categorization"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Categories */}
      {categorization.categories && categorization.categories.length > 0 && (
        <div className="mb-3">
          <div className={`text-xs font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Categories
          </div>
          <div className="flex flex-wrap gap-1">
            {categorization.categories.map((category, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                <Folder className="w-3 h-3 mr-1" />
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {categorization.tags && categorization.tags.length > 0 && (
        <div className="mb-3">
          <div className={`text-xs font-medium mb-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Tags
          </div>
          <div className="flex flex-wrap gap-1">
            {categorization.tags.map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-purple-900/30 text-purple-300 border border-purple-700'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence and Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`text-xs ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Confidence: {Math.round(categorization.confidence * 100)}%
          </div>
          <div 
            className="ml-2 h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700"
          >
            <div 
              className="h-2 rounded-full bg-blue-500" 
              style={{ width: `${categorization.confidence * 100}%` }}
            ></div>
          </div>
        </div>
        
        {showMetrics && metrics && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <BarChart className="w-3 h-3 mr-1" />
            <span>{Math.round(metrics.averageProcessingTime)}ms</span>
          </div>
        )}
      </div>

      {/* Toggle for more details */}
      {categorization.keywords && categorization.keywords.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-xs ${
              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            {showDetails ? 'Hide' : 'Show'} keywords
          </button>
          
          {showDetails && (
            <div className={`mt-2 p-2 rounded text-xs ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className={`font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Keywords:
              </div>
              <div className="flex flex-wrap gap-1">
                {categorization.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className={`px-1.5 py-0.5 rounded ${
                      theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}