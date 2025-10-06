"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';

const RecommendationCard = ({ recommendation, onInteract, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleInteraction = (type) => {
    onInteract(recommendation.id, type);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
          : 'bg-white border-gray-200 hover:border-blue-500'
      } shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            recommendation.category === 'technology' ? 'bg-blue-100 text-blue-800' :
            recommendation.category === 'business' ? 'bg-green-100 text-green-800' :
            recommendation.category === 'education' ? 'bg-purple-100 text-purple-800' :
            recommendation.category === 'lifestyle' ? 'bg-pink-100 text-pink-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {recommendation.category || 'General'}
          </div>
          {recommendation.personalization_score && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-yellow-500">⭐</span>
              <span className={`text-xs font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {Math.round(recommendation.personalization_score * 100)}% match
              </span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            theme === 'dark' 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {isExpanded ? '↑' : '↓'}
        </button>
      </div>
      
      <h3 className={`font-semibold mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {recommendation.title}
      </h3>
      
      <p className={`text-sm leading-relaxed ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      } ${!isExpanded ? 'line-clamp-2' : ''}`}>
        {recommendation.description || recommendation.content}
      </p>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            {/* Tags */}
            {recommendation.tags && recommendation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {recommendation.tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs rounded-full ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Metadata */}
            <div className={`text-xs space-y-1 mb-3 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {recommendation.created_at && (
                <div>📅 {new Date(recommendation.created_at).toLocaleDateString()}</div>
              )}
              {recommendation.views && (
                <div>👁️ {recommendation.views.toLocaleString()} views</div>
              )}
              {recommendation.likes && (
                <div>❤️ {recommendation.likes.toLocaleString()} likes</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInteraction('like');
            }}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-red-400' 
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <span>❤️</span>
            <span>Like</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInteraction('save');
            }}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-blue-400' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <span>🔖</span>
            <span>Save</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInteraction('share');
            }}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-green-400' 
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            <span>🔗</span>
            <span>Share</span>
          </button>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleInteraction('hide');
          }}
          className={`text-xs transition-colors ${
            theme === 'dark' 
              ? 'text-gray-500 hover:text-gray-300' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Hide
        </button>
      </div>
    </motion.div>
  );
};

export default function SmartRecommendationWidget({ userId = 'demo_user_123', maxRecommendations = 10 }) {
  const { theme } = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Sample content pool for recommendations
  const sampleContentPool = [
    {
      id: 'content_1',
      title: 'Getting Started with React Hooks',
      description: 'Learn the fundamentals of React Hooks and how they can simplify your component logic.',
      content: 'React Hooks are functions that let you use state and other React features without writing a class...',
      category: 'technology',
      tags: ['react', 'javascript', 'web development', 'hooks'],
      views: 1250,
      likes: 89,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      popularity_score: 0.8
    },
    {
      id: 'content_2',
      title: 'Building a Successful Startup',
      description: 'Essential strategies and insights for entrepreneurs looking to build successful startups.',
      content: 'Starting a business is one of the most challenging yet rewarding endeavors...',
      category: 'business',
      tags: ['startup', 'entrepreneurship', 'business strategy', 'funding'],
      views: 2100,
      likes: 156,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      popularity_score: 0.9
    },
    {
      id: 'content_3',
      title: 'Machine Learning Fundamentals',
      description: 'An introduction to machine learning concepts, algorithms, and practical applications.',
      content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms...',
      category: 'technology',
      tags: ['machine learning', 'ai', 'python', 'data science'],
      views: 890,
      likes: 67,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      popularity_score: 0.7
    },
    {
      id: 'content_4',
      title: 'Effective Learning Strategies',
      description: 'Proven methods to enhance your learning efficiency and retention.',
      content: 'Learning effectively is a skill that can be developed and improved over time...',
      category: 'education',
      tags: ['learning', 'study techniques', 'productivity', 'skill development'],
      views: 1450,
      likes: 112,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      popularity_score: 0.6
    },
    {
      id: 'content_5',
      title: 'Digital Marketing Trends 2024',
      description: 'Latest trends and strategies in digital marketing for the upcoming year.',
      content: 'Digital marketing continues to evolve at a rapid pace with new trends emerging...',
      category: 'business',
      tags: ['digital marketing', 'trends', 'social media', 'advertising'],
      views: 1800,
      likes: 134,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      popularity_score: 0.8
    }
  ];

  const fetchRecommendations = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch('http://localhost:5000/api/ai/personalize/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          content_pool: sampleContentPool,
          num_recommendations: maxRecommendations
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
        setError(null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Recommendations fetch error:', err);
      setError(err.message);
      // Fallback to showing sample content
      setRecommendations(sampleContentPool.slice(0, maxRecommendations));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInteraction = async (contentId, interactionType) => {
    try {
      // Find the content item to get its tags
      const content = recommendations.find(rec => rec.id === contentId);
      if (!content) return;

      // Update personalization profile
      await fetch('http://localhost:5000/api/ai/personalize/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          content_tags: content.tags || [],
          interaction_type: interactionType,
          content_category: content.category
        }),
      });

      // Handle specific interactions
      if (interactionType === 'hide') {
        // Remove from current recommendations
        setRecommendations(prev => prev.filter(rec => rec.id !== contentId));
      } else if (interactionType === 'like' || interactionType === 'save') {
        // Update the recommendation in the list to show interaction
        setRecommendations(prev => prev.map(rec => 
          rec.id === contentId 
            ? { ...rec, userInteraction: interactionType }
            : rec
        ));
        
        // Refresh recommendations to get updated personalized content
        setTimeout(() => {
          fetchRecommendations();
        }, 1000);
      }

      console.log(`User ${userId} performed ${interactionType} on content ${contentId}`);
    } catch (error) {
      console.error('Interaction tracking failed:', error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userId, maxRecommendations]);

  const filteredRecommendations = filter === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === filter);

  if (loading) {
    return (
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Loading Personalized Recommendations...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } shadow-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🎯</span>
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Smart Recommendations
          </h2>
          {refreshing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
        </div>
        
        <button
          onClick={fetchRecommendations}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
        {['all', 'technology', 'business', 'education', 'lifestyle'].map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === category
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className={`p-4 rounded-lg mb-6 ${
          theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onInteract={handleInteraction}
                theme={theme}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            No recommendations available
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Start interacting with content to get personalized recommendations!
          </p>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-6 pt-4 border-t text-center text-xs ${
        theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
      }`}>
        Powered by AI • Recommendations update based on your interactions
      </div>
    </div>
  );
}