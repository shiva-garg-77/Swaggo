"use client";

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { GET_TRENDING_POSTS } from '../../../lib/graphql/postStatsQueries';
import InstagramPost from '../Post/InstagramPost';
import { TrendingUp, Clock, Calendar } from 'lucide-react';

/**
 * Trending/Explore Page
 * Shows trending posts based on engagement
 */
export default function TrendingPage() {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedPost, setSelectedPost] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_TRENDING_POSTS, {
    variables: {
      timeRange,
      limit: 20
    },
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });

  const trendingPosts = data?.getTrendingPosts || [];

  const timeRangeOptions = [
    { value: '24h', label: 'Today', icon: Clock },
    { value: '7d', label: 'This Week', icon: Calendar },
    { value: '30d', label: 'This Month', icon: Calendar }
  ];

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-red-500" />
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Trending
              </h1>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              {timeRangeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      timeRange === option.value
                        ? 'bg-red-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Failed to load trending posts
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        ) : trendingPosts.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No trending posts yet
            </p>
            <p className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Check back later for trending content
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Header */}
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Showing {trendingPosts.length} trending posts based on engagement
              </p>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 gap-6">
              {trendingPosts.map((post, index) => (
                <div key={post.postid} className="relative">
                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                        : 'bg-gray-500'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>

                  <InstagramPost
                    post={post}
                    theme={theme}
                    onCommentClick={() => setSelectedPost(post)}
                  />

                  {/* Engagement Stats */}
                  <div className={`mt-2 p-3 rounded-lg flex items-center justify-between text-sm ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {post.likeCount} likes · {post.commentCount} comments
                    </span>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {post.engagementScore} engagement score
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
