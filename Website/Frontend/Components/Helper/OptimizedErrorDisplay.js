'use client';

import React, { memo } from 'react';

/**
 * Optimized Error Display Component
 * Replaces direct DOM manipulation with React components for better performance
 * 🔧 PERFORMANCE FIX #88: Reduce excessive DOM manipulation
 */

// Memoized Video Error Component
const VideoErrorDisplay = memo(({ onRetry, theme = 'light' }) => {
  return (
    <div className={`video-error w-full h-64 lg:h-80 flex flex-col items-center justify-center ${
      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
    } cursor-pointer`} onClick={onRetry}>
      <div className="text-center p-6">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
        </svg>
        <p className="text-lg font-medium mb-1">Video Unavailable</p>
        <p className="text-sm opacity-70">Unable to load video content</p>
        <p className="text-xs opacity-50 mt-2">Click to try viewing in full screen</p>
      </div>
    </div>
  );
});

VideoErrorDisplay.displayName = 'VideoErrorDisplay';

// Memoized Profile Error Component
const ProfileErrorDisplay = memo(({ postUrl, theme = 'light' }) => {
  return (
    <div className={`error-placeholder w-full h-full flex items-center justify-center ${
      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
    }`}>
      <div className="text-center p-4">
        <div className="text-3xl mb-3">📹</div>
        <div className="text-sm font-medium mb-1">Video Loading Failed</div>
        <div className="text-xs opacity-75">Backend may be offline</div>
        <div className="text-xs opacity-50 mt-2 max-w-xs break-all">{postUrl}</div>
      </div>
    </div>
  );
});

ProfileErrorDisplay.displayName = 'ProfileErrorDisplay';

// Optimized Loading Indicator Component
const OptimizedLoadingIndicator = memo(({ message = '🚀 Loading...', theme = 'light' }) => {
  return (
    <div className="fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm z-50 shadow-lg backdrop-blur-sm bg-opacity-90 transition-opacity duration-300">
      {message}
    </div>
  );
});

OptimizedLoadingIndicator.displayName = 'OptimizedLoadingIndicator';

export {
  VideoErrorDisplay,
  ProfileErrorDisplay,
  OptimizedLoadingIndicator
};

export default {
  VideoErrorDisplay,
  ProfileErrorDisplay,
  OptimizedLoadingIndicator
};