"use client";

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { GET_FOLLOWING_STORIES } from '../../../lib/graphql/profileEnhancedQueries';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StoriesBar({ onCreateStory, onStoryClick }) {
  const { theme } = useTheme();
  const { user } = useFixedSecureAuth();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch stories from followed users
  const { data, loading, error, refetch } = useQuery(GET_FOLLOWING_STORIES, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    pollInterval: 60000, // Refresh every minute for new stories
  });

  // ✅ FIX: Changed from getFollowingStories to getActiveStoriesForUser
  const stories = data?.getActiveStoriesForUser || [];

  // Group stories by profile
  const groupedStories = stories.reduce((acc, story) => {
    const profileId = story.profile?.profileid;
    if (!acc[profileId]) {
      acc[profileId] = {
        profile: story.profile,
        stories: [],
        hasUnviewed: false,
      };
    }
    acc[profileId].stories.push(story);
    if (!story.isViewed) {
      acc[profileId].hasUnviewed = true;
    }
    return acc;
  }, {});

  const profilesWithStories = Object.values(groupedStories);

  // Check scroll position
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [stories]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (loading && !data) {
    return (
      <div className={`mb-6 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center space-x-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
              <div className="w-14 h-3 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading stories:', error);
  }

  return (
    <div className={`mb-6 rounded-lg border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-800'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Stories container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center space-x-4 p-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Your Story / Create Story */}
          <button
            onClick={onCreateStory}
            className="flex flex-col items-center space-y-2 flex-shrink-0 group"
          >
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                  : 'bg-gray-100 border-gray-300 group-hover:border-gray-400'
              }`}>
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Your story"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className={`text-2xl ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Story
            </span>
          </button>

          {/* Following users' stories */}
          {profilesWithStories.length === 0 && !loading ? (
            <div className={`flex-1 text-center py-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p className="text-sm">No stories yet</p>
              <p className="text-xs mt-1">Stories from people you follow will appear here</p>
            </div>
          ) : (
            profilesWithStories.map(({ profile, stories, hasUnviewed }) => (
              <button
                key={profile.profileid}
                onClick={() => onStoryClick?.(stories)}
                className="flex flex-col items-center space-y-2 flex-shrink-0 group"
              >
                <div className="relative">
                  {/* Gradient ring for unviewed stories */}
                  <div className={`w-16 h-16 rounded-full p-[2px] ${
                    hasUnviewed
                      ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
                      : theme === 'dark'
                      ? 'bg-gray-600'
                      : 'bg-gray-300'
                  }`}>
                    <div className={`w-full h-full rounded-full p-[2px] ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <img
                        src={profile.profilePic || '/default-profile.svg'}
                        alt={profile.username}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-profile.svg';
                        }}
                      />
                    </div>
                  </div>
                  {/* Story count badge */}
                  {stories.length > 1 && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                      <span className="text-[10px] text-white font-bold">
                        {stories.length}
                      </span>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium max-w-[70px] truncate ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {profile.username}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-800'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
