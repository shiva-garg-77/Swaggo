'use client';

import { Hash, TrendingUp, Grid3X3, List } from 'lucide-react';

/**
 * Hashtag Header Component
 * Header for hashtag pages with stats and controls
 */
export default function HashtagHeader({ 
  hashtag, 
  stats, 
  viewMode, 
  onViewModeChange,
  theme = 'light' 
}) {
  const isDark = theme === 'dark';

  const totalPosts = stats?.totalPosts || 0;
  const totalViews = stats?.totalViews || 0;
  const isTrending = stats?.trending || false;

  return (
    <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Hashtag Info */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Hash className="w-10 h-10 text-white" />
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  #{hashtag}
                </h1>
                {isTrending && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className={`flex items-center gap-4 mt-2 text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span className="font-semibold">
                  {formatNumber(totalPosts)} {totalPosts === 1 ? 'post' : 'posts'}
                </span>
                {totalViews > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatNumber(totalViews)} views</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewModeChange('feed')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'feed'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Feed view"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description (if available) */}
        {stats?.description && (
          <p className={`mt-4 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {stats.description}
          </p>
        )}
      </div>
    </div>
  );
}

// Helper function
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
