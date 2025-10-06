"use client";

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { GET_ALL_POSTS } from '../../../lib/graphql/queries';
import SimpleFlatCommentSystem from './SimpleFlatCommentSystem';
import InstagramPost from './InstagramPost';
import { 
  MessageCircle, 
  Heart, 
  TrendingUp, 
  Clock, 
  Filter,
  Grid3X3,
  ChevronDown,
  Eye
} from 'lucide-react';

const TAB_CONFIG = {
  all: { icon: Grid3X3, label: 'All Posts', colorClass: 'bg-blue-500 hover:bg-blue-600' },
  trending: { icon: TrendingUp, label: 'Trending', colorClass: 'bg-red-500 hover:bg-red-600' },
  recent: { icon: Clock, label: 'Recent', colorClass: 'bg-green-500 hover:bg-green-600' },
  discussed: { icon: MessageCircle, label: 'Most Discussed', colorClass: 'bg-purple-500 hover:bg-purple-600' }
};

export default function PostTabsContainer({ 
  className = "",
  showMomentsHeader = true,
  initialTab = 'all'
}) {
  const { theme } = useTheme();
  const { user } = useSecureAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, discussed
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all posts
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false
  });

  const rawPosts = data?.getPosts || [];

  // Filter and sort posts based on active tab
  const filteredPosts = useMemo(() => {
    let posts = rawPosts.filter(post => {
      const imageUrl = post.postUrl || post.image;
      return imageUrl && imageUrl.trim() && imageUrl !== 'null' && imageUrl !== 'undefined';
    });

    switch (activeTab) {
      case 'trending':
        // Posts with high like counts (trending)
        posts = posts.filter(post => (post.likeCount || 0) >= 5);
        break;
      case 'recent':
        // Posts from last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        posts = posts.filter(post => new Date(post.createdAt) >= weekAgo);
        break;
      case 'discussed':
        // Posts with high comment counts
        posts = posts.filter(post => (post.commentCount || 0) >= 3);
        break;
      default:
        // All posts
        break;
    }

    // Sort posts
    switch (sortBy) {
      case 'popular':
        return posts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      case 'discussed':
        return posts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
      default: // recent
        return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [rawPosts, activeTab, sortBy]);

  // Handle comment toggle
  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Handle post selection for detailed view
  const handlePostSelect = (post) => {
    setSelectedPost(post);
    if (!showComments[post.postid]) {
      toggleComments(post.postid);
    }
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedPost(null);
    setShowComments({});
  };

  if (loading) {
    return (
      <div className={`${className} rounded-xl overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex space-x-4">
              {Object.keys(TAB_CONFIG).map((_, i) => (
                <div key={i} className="h-10 w-24 bg-gray-300 rounded-full"></div>
              ))}
            </div>
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && filteredPosts.length === 0) {
    return (
      <div className={`${className} rounded-xl overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="p-6 text-center">
          <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className={`text-lg font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            No posts available
          </p>
          <p className={`text-sm mt-2 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Check back later for new content
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-xl overflow-hidden ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      
      {/* Header with Tabs */}
      <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        {showMomentsHeader && (
          <div className="px-6 pt-4 pb-2">
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Community Posts
            </h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Discover and engage with posts from the community
            </p>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex space-x-1">
            {Object.entries(TAB_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = activeTab === key;
              const postCount = key === 'all' ? filteredPosts.length : 
                               key === 'trending' ? filteredPosts.filter(p => (p.likeCount || 0) >= 5).length :
                               key === 'recent' ? filteredPosts.filter(p => {
                                 const weekAgo = new Date();
                                 weekAgo.setDate(weekAgo.getDate() - 7);
                                 return new Date(p.createdAt) >= weekAgo;
                               }).length :
                               filteredPosts.filter(p => (p.commentCount || 0) >= 3).length;

              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${config.colorClass} text-white shadow-lg scale-105`
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                  {postCount > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {postCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Sort and Filter Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="capitalize">{sortBy}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Filter Dropdown */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-10 ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    {['recent', 'popular', 'discussed'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors border-b last:border-b-0 ${
                          sortBy === option
                            ? theme === 'dark'
                              ? 'bg-blue-500/20 text-blue-400 border-gray-700'
                              : 'bg-blue-50 text-blue-600 border-gray-200'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-700 border-gray-700'
                              : 'text-gray-700 hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className="capitalize">{option}</span>
                        {option === 'recent' && <span className="text-xs opacity-70 ml-2">Latest first</span>}
                        {option === 'popular' && <span className="text-xs opacity-70 ml-2">Most liked</span>}
                        {option === 'discussed' && <span className="text-xs opacity-70 ml-2">Most comments</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full mb-4 mx-auto flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Eye className={`w-8 h-8 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <p className={`text-lg font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              No posts found
            </p>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Try switching to a different tab or filter
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.postid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg overflow-hidden transition-all duration-200 ${
                  selectedPost?.postid === post.postid
                    ? theme === 'dark' 
                      ? 'ring-2 ring-blue-500 bg-gray-700/50' 
                      : 'ring-2 ring-blue-500 bg-blue-50/50'
                    : theme === 'dark'
                      ? 'hover:bg-gray-700/50'
                      : 'hover:bg-gray-50'
                }`}
              >
                {/* Post Preview - Simplified */}
                <div 
                  className="cursor-pointer p-4"
                  onClick={() => handlePostSelect(post)}
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={post.profile?.profilePic || '/default-profile.svg'}
                      alt={post.profile?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className={`font-semibold text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {post.profile?.username}
                        </p>
                        {post.profile?.isVerified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Post Content Preview */}
                      <div className="flex space-x-3">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {post.postType === 'VIDEO' ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                              <video
                                src={post.postUrl}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={post.postUrl}
                              alt={post.title || 'Post'}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          {post.title && (
                            <p className={`font-medium text-sm mb-1 line-clamp-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {post.title}
                            </p>
                          )}
                          {post.Description && (
                            <p className={`text-sm line-clamp-3 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {post.Description}
                            </p>
                          )}
                          {post.location && (
                            <p className={`text-xs mt-1 flex items-center ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {post.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Actions Bar */}
                <div className={`px-4 py-3 border-t flex items-center justify-between ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handlePostSelect(post)}
                      className={`flex items-center space-x-2 text-sm transition-colors ${
                        showComments[post.postid]
                          ? 'text-blue-500'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentCount || 0} comments</span>
                    </button>
                    
                    <div className={`flex items-center space-x-2 text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Heart className="w-4 h-4" />
                      <span>{post.likeCount || 0} likes</span>
                    </div>
                  </div>

                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Threaded Comments Section */}
                <AnimatePresence>
                  {showComments[post.postid] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`border-t ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <SimpleFlatCommentSystem
                        postId={post.postid}
                        theme={theme}
                        onCommentUpdate={() => refetch()}
                        className="max-h-96"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {filteredPosts.length > 0 && (
        <div className={`px-6 py-3 border-t text-center ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
            {activeTab !== 'all' && (
              <span> • {TAB_CONFIG[activeTab].label}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
