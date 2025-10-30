'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Search, Filter, X, Calendar, MapPin, User, Tag, TrendingUp } from 'lucide-react';
import { SEARCH_POSTS } from '../../../lib/graphql/postStatsQueries';
import InstagramPost from '../Post/InstagramPost';

/**
 * Advanced Post Search Component
 * Search posts with advanced filters
 */
export default function AdvancedPostSearch({ theme = 'light' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    postType: '',
    location: '',
    username: '',
    hashtag: '',
    dateFrom: '',
    dateTo: '',
    minLikes: '',
    minComments: ''
  });

  const isDark = theme === 'dark';

  const { data, loading, refetch } = useQuery(SEARCH_POSTS, {
    variables: {
      query: searchQuery,
      limit: 20,
      offset: 0,
      filters: {
        postType: filters.postType || undefined,
        location: filters.location || undefined,
        username: filters.username || undefined,
        hashtag: filters.hashtag || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        minLikes: filters.minLikes ? parseInt(filters.minLikes) : undefined,
        minComments: filters.minComments ? parseInt(filters.minComments) : undefined
      }
    },
    skip: !searchQuery,
    errorPolicy: 'all'
  });

  const posts = data?.searchPosts || [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetch();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      postType: '',
      location: '',
      username: '',
      hashtag: '',
      dateFrom: '',
      dateTo: '',
      minLikes: '',
      minComments: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Search Header */}
      <div className={`sticky top-0 z-10 border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg border flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-white rounded-full"></span>
              )}
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Search
            </button>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className={`p-4 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Advanced Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Post Type */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Post Type
                  </label>
                  <select
                    value={filters.postType}
                    onChange={(e) => handleFilterChange('postType', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="carousel">Carousels</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="Enter location"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Username */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <User className="w-4 h-4 inline mr-1" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={filters.username}
                    onChange={(e) => handleFilterChange('username', e.target.value)}
                    placeholder="@username"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Hashtag */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Tag className="w-4 h-4 inline mr-1" />
                    Hashtag
                  </label>
                  <input
                    type="text"
                    value={filters.hashtag}
                    onChange={(e) => handleFilterChange('hashtag', e.target.value)}
                    placeholder="#hashtag"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Date From */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Min Likes */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Min Likes
                  </label>
                  <input
                    type="number"
                    value={filters.minLikes}
                    onChange={(e) => handleFilterChange('minLikes', e.target.value)}
                    placeholder="0"
                    min="0"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Min Comments */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Min Comments
                  </label>
                  <input
                    type="number"
                    value={filters.minComments}
                    onChange={(e) => handleFilterChange('minComments', e.target.value)}
                    placeholder="0"
                    min="0"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter a search query to find posts
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No posts found
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Found {posts.length} posts
            </p>
            <div className="grid grid-cols-1 gap-6">
              {posts.map((post) => (
                <InstagramPost key={post.postid} post={post} theme={theme} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
