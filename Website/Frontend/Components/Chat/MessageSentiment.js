import React, { useState, useEffect } from 'react';
import useSentimentAnalysis from '../../hooks/useSentimentAnalysis';
import { Smile, Frown, Meh, Heart, Angry, RefreshCw } from 'lucide-react';

/**
 * 😊 Message Sentiment Component
 * 
 * Displays AI-powered sentiment analysis for messages
 * 
 * Features:
 * - Real-time sentiment analysis
 * - Visual sentiment indicators
 * - Confidence indicators
 * - Performance metrics
 */

export default function MessageSentiment({ 
  message, 
  theme = 'light',
  showMetrics = false
}) {
  const [sentiment, setSentiment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    isAnalyzing,
    analysisError,
    analyzeSentiment,
    getDefinitions,
    sentimentDefinitions
  } = useSentimentAnalysis();

  // Analyze sentiment when message changes
  useEffect(() => {
    if (message?.content) {
      handleAnalyze();
    }
  }, [message?.content]);

  const handleAnalyze = async () => {
    if (!message?.content) return;
    
    try {
      const result = await analyzeSentiment(message.content, {
        userId: message.sender?.profileid,
        chatId: message.chatId,
        timestamp: message.createdAt
      });
      
      setSentiment(result);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
    }
  };

  const handleRefresh = async () => {
    await handleAnalyze();
  };

  const getSentimentIcon = (sentimentType) => {
    switch (sentimentType) {
      case 'very_positive':
        return <Heart className="w-5 h-5 text-green-500" />;
      case 'positive':
        return <Smile className="w-5 h-5 text-green-400" />;
      case 'neutral':
        return <Meh className="w-5 h-5 text-gray-400" />;
      case 'negative':
        return <Frown className="w-5 h-5 text-yellow-500" />;
      case 'very_negative':
        return <Angry className="w-5 h-5 text-red-500" />;
      default:
        return <Meh className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentimentType) => {
    switch (sentimentType) {
      case 'very_positive':
        return 'bg-green-500';
      case 'positive':
        return 'bg-green-400';
      case 'neutral':
        return 'bg-gray-400';
      case 'negative':
        return 'bg-yellow-500';
      case 'very_negative':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getSentimentLabel = (sentimentType) => {
    if (sentimentDefinitions && sentimentDefinitions[sentimentType]) {
      return sentimentDefinitions[sentimentType].label;
    }
    
    switch (sentimentType) {
      case 'very_positive':
        return 'Very Positive';
      case 'positive':
        return 'Positive';
      case 'neutral':
        return 'Neutral';
      case 'negative':
        return 'Negative';
      case 'very_negative':
        return 'Very Negative';
      default:
        return 'Neutral';
    }
  };

  if (!message?.content) {
    return null;
  }

  if (isAnalyzing) {
    return (
      <div className={`flex items-center p-2 rounded-lg ${
        theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
      }`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
        <span className={`text-sm ${
          theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
        }`}>
          Analyzing sentiment...
        </span>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className={`flex items-center p-2 rounded-lg ${
        theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
      }`}>
        <div className={`text-sm ${
          theme === 'dark' ? 'text-red-300' : 'text-red-700'
        }`}>
          Failed to analyze sentiment: {analysisError}
        </div>
      </div>
    );
  }

  if (!sentiment) {
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
          {getSentimentIcon(sentiment.sentiment)}
          <span className={`text-sm font-medium ml-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {getSentimentLabel(sentiment.sentiment)}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className={`p-1 rounded transition-colors ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
          title="Refresh sentiment analysis"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sentiment score and confidence */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`text-xs ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Score: {sentiment.score.toFixed(2)}
          </div>
          <div 
            className="ml-2 h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700"
          >
            <div 
              className={`h-2 rounded-full ${getSentimentColor(sentiment.sentiment)}`} 
              style={{ 
                width: `${Math.min(Math.abs(sentiment.score) * 20, 100)}%`,
                marginLeft: sentiment.score < 0 ? 'auto' : '0'
              }}
            ></div>
          </div>
        </div>
        
        <div className={`text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Confidence: {Math.round(sentiment.confidence * 100)}%
        </div>
      </div>

      {/* Emotional words */}
      {sentiment.emotionalWords && sentiment.emotionalWords.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-xs ${
              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            {showDetails ? 'Hide' : 'Show'} emotional words
          </button>
          
          {showDetails && (
            <div className={`mt-2 p-2 rounded text-xs ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className={`font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Emotional words:
              </div>
              <div className="flex flex-wrap gap-1">
                {sentiment.emotionalWords.map((word, index) => (
                  <span
                    key={index}
                    className={`px-1.5 py-0.5 rounded ${
                      theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {word}
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