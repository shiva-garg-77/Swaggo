'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { X, TrendingUp, Eye, Heart, MessageCircle, Share2, Bookmark, Users, Calendar } from 'lucide-react';
import { GET_POST_STATS } from '../../../lib/graphql/postStatsQueries';

/**
 * Post Analytics Modal
 * Shows detailed analytics for a post (creator only)
 */
export default function PostAnalytics({ post, isOpen, onClose, theme = 'light' }) {
  const [timeRange, setTimeRange] = useState('7d');

  // Real-time updates with polling (Issue 5.11)
  const { data, loading } = useQuery(GET_POST_STATS, {
    variables: {
      postid: post?.postid,
      timeRange
    },
    skip: !post?.postid || !isOpen,
    pollInterval: 30000, // Poll every 30 seconds for real-time updates
    errorPolicy: 'all'
  });

  const stats = data?.getPostStats || {};
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const metrics = [
    {
      label: 'Total Reach',
      value: stats.reach || 0,
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Likes',
      value: stats.likes || post?.likeCount || 0,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      label: 'Comments',
      value: stats.comments || post?.commentCount || 0,
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      label: 'Shares',
      value: stats.shares || 0,
      icon: Share2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'Saves',
      value: stats.saves || 0,
      icon: Bookmark,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      label: 'Engagement Rate',
      value: `${stats.engagementRate || 0}%`,
      icon: TrendingUp,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Post Analytics
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className={`p-4 rounded-lg ${
                        isDark ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                          <Icon className={`w-5 h-5 ${metric.color}`} />
                        </div>
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {metric.label}
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {metric.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Post Preview */}
              <div className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Post Preview
                </h3>
                <div className="flex gap-4">
                  {post.mediaUrl && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={post.mediaUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {post.caption?.slice(0, 200)}
                      {post.caption?.length > 200 && '...'}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className={`flex items-center gap-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Calendar className="w-4 h-4" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience Demographics */}
              {stats.demographics && (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Users className="w-5 h-5" />
                    Audience Demographics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Top Locations
                      </p>
                      <ul className="space-y-1">
                        {stats.demographics.topLocations?.map((location, index) => (
                          <li key={index} className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {location.name}: {location.percentage}%
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className={`text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Age Groups
                      </p>
                      <ul className="space-y-1">
                        {stats.demographics.ageGroups?.map((group, index) => (
                          <li key={index} className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {group.range}: {group.percentage}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tips */}
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  💡 Performance Tips
                </h3>
                <ul className={`text-sm space-y-1 ${
                  isDark ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  <li>• Post during peak hours (6-9 PM) for better reach</li>
                  <li>• Use 3-5 relevant hashtags to increase discoverability</li>
                  <li>• Engage with comments within the first hour</li>
                  <li>• High-quality images get 2x more engagement</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
