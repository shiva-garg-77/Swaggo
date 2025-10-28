'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { VIEW_STORY } from './queries';

export default function StoryViewer({ story, user, onClose }) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const progressInterval = useRef(null);
  
  const STORY_DURATION = 15000; // 15 seconds

  // View story mutation
  const [viewStory] = useMutation(VIEW_STORY, {
    onError: (error) => {
      console.error('Error viewing story:', error);
    }
  });

  // Start progress timer
  useEffect(() => {
    if (!story) return;

    // Mark story as viewed
    viewStory({
      variables: { storyid: story.storyid }
    });

    startProgress();
    
    return () => {
      stopProgress();
    };
  }, [story, viewStory]);

  const startProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    const startTime = Date.now();
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        stopProgress();
        onClose();
      }
    }, 16); // ~60fps
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      stopProgress();
    } else {
      startProgress();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    onClose(); // For now, just close. You can implement next story logic here
  };

  const handlePrevious = () => {
    onClose(); // For now, just close. You can implement previous story logic here
  };

  const reactions = ['❤️', '😍', '😂', '😮', '😢', '👏', '🔥', '💯'];

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      {/* Story container */}
      <div className="relative w-full max-w-sm h-full max-h-screen bg-black rounded-lg overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="w-full h-0.5 bg-white/30 rounded-full">
            <div 
              className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={story.profile?.profilePic || '/default-avatar.png'}
              alt={story.profile?.username}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-semibold text-sm">
                {story.profile?.name || story.profile?.username}
              </p>
              <p className="text-white/70 text-xs">
                {new Date(story.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Story content */}
        <div className="relative h-full flex items-center justify-center">
          {story.mediaType === 'image' ? (
            <img
              src={story.mediaUrl}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={story.mediaUrl}
              className="max-w-full max-h-full object-contain"
              autoPlay
              muted
              loop={false}
              onEnded={handleNext}
            />
          )}
          
          {/* Caption */}
          {story.caption && (
            <div className="absolute bottom-20 left-4 right-4">
              <p className="text-white text-center bg-black/50 rounded-lg p-3 backdrop-blur-sm">
                {story.caption}
              </p>
            </div>
          )}
        </div>

        {/* Navigation areas */}
        <div className="absolute inset-0 flex">
          <button 
            className="flex-1 h-full"
            onClick={handlePrevious}
            onTouchStart={stopProgress}
            onTouchEnd={startProgress}
          />
          <button 
            className="flex-1 h-full"
            onClick={handleNext}
            onTouchStart={stopProgress}
            onTouchEnd={startProgress}
          />
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-6 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePause}
              className="text-white/80 hover:text-white"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Only show reactions if it's not the user's own story */}
            {story.profile?.profileid !== user?.profileid && (
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="text-white/80 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>

          <div className="text-white/60 text-sm">
            {story.viewersCount || 0} views
          </div>
        </div>

        {/* Reactions popup */}
        {showReactions && (
          <div className="absolute bottom-20 right-4 bg-black/80 backdrop-blur-md rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-3">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    // Handle reaction here
                    setShowReactions(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform p-2"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
