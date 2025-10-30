'use client';

import { Check } from 'lucide-react';

/**
 * Highlight Cover Selector Component
 * Grid to select cover image from highlight stories
 */
export default function HighlightCoverSelector({ 
  stories, 
  selectedCover, 
  onCoverSelect, 
  theme = 'light' 
}) {
  const isDark = theme === 'dark';

  if (!stories || stories.length === 0) {
    return (
      <div className={`text-center py-8 ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        No stories available for cover selection
      </div>
    );
  }

  return (
    <div>
      <h3 className={`text-lg font-semibold mb-3 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        Choose Cover Image
      </h3>
      
      <div className="grid grid-cols-4 gap-3">
        {stories.map((story) => {
          const isSelected = selectedCover === story.mediaUrl;
          
          return (
            <button
              key={story.storyid}
              onClick={() => onCoverSelect(story.mediaUrl)}
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
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              
              {/* Video Indicator */}
              {story.mediaType === 'video' && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">▶</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <p className={`text-sm mt-3 ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Select an image to use as your highlight cover. This will be shown in your profile.
      </p>
    </div>
  );
}
