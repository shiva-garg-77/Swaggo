'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Check, Search, Calendar } from 'lucide-react';
import { GET_EXPIRED_STORIES } from '../../../lib/graphql/storyQueries';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';

/**
 * Expired Stories Selector Component
 * Grid to select expired stories for highlights
 */
export default function ExpiredStoriesSelector({ 
  selectedStories, 
  onSelectionChange, 
  theme = 'light' 
}) {
  const { user } = useSecureAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, week, month, 3months

  const { data, loading, error } = useQuery(GET_EXPIRED_STORIES, {
    variables: {
      profileid: user?.profileid,
      limit: 100
    },
    skip: !user?.profileid,
    errorPolicy: 'all'
  });

  const isDark = theme === 'dark';
  const stories = data?.getExpiredStories || [];

  // Filter stories based on search and date
  const filteredStories = stories.filter(story => {
    const matchesSearch = !searchQuery || 
      story.caption?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const storyDate = new Date(story.createdAt);
    const now = new Date();
    const daysDiff = (now - storyDate) / (1000 * 60 * 60 * 24);
    
    let matchesDate = true;
    switch (dateFilter) {
      case 'week':
        matchesDate = daysDiff <= 7;
        break;
      case 'month':
        matchesDate = daysDiff <= 30;
        break;
      case '3months':
        matchesDate = daysDiff <= 90;
        break;
    }
    
    return matchesSearch && matchesDate;
  });

  const handleStoryToggle = (story) => {
    const isSelected = selectedStories.some(s => s.storyid === story.storyid);
    
    if (isSelected) {
      onSelectionChange(selectedStories.filter(s => s.storyid !== story.storyid));
    } else {
      onSelectionChange([...selectedStories, story]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStories.length === filteredStories.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredStories);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || stories.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className={`text-lg ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          No expired stories found
        </p>
        <p className={`text-sm mt-2 ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          Stories older than 24 hours will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Select Stories ({selectedStories.length} selected)
        </h3>
        
        <button
          onClick={handleSelectAll}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {selectedStories.length === filteredStories.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        >
          <option value="all">All Time</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="3months">Last 3 Months</option>
        </select>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-8">
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            No stories match your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
          {filteredStories.map((story) => {
            const isSelected = selectedStories.some(s => s.storyid === story.storyid);
            
            return (
              <button
                key={story.storyid}
                onClick={() => handleStoryToggle(story)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-600/30'
                    : isDark
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={story.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Video Indicator */}
                {story.mediaType === 'video' && (
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">▶</span>
                    </div>
                  </div>
                )}
                
                {/* Date */}
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      <p className={`text-sm ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Select the stories you want to add to your highlight. You can choose multiple stories.
      </p>
    </div>
  );
}
