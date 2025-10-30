'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHighlightStore } from '../../../store/highlightStore';

/**
 * Highlight Viewer Component
 * Full-screen Instagram-style story viewer for highlights
 */
export default function HighlightViewer({ theme = 'light' }) {
  const {
    currentHighlight,
    currentStoryIndex,
    isPlaying,
    isViewerOpen,
    closeViewer,
    nextStory,
    previousStory,
    togglePlay,
    setPlaying
  } = useHighlightStore();

  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);
  const videoRef = useRef(null);

  const stories = currentHighlight?.stories || [];
  const currentStory = stories[currentStoryIndex];
  const duration = currentStory?.duration || 5000; // Default 5 seconds

  // Progress bar animation
  useEffect(() => {
    if (!isViewerOpen || !isPlaying || !currentStory) return;

    setProgress(0);
    const startTime = Date.now();

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / duration) * 100;

      if (newProgress >= 100) {
        clearInterval(progressInterval.current);
        nextStory();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isViewerOpen, isPlaying, currentStory, currentStoryIndex, duration, nextStory]);

  // Keyboard controls
  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight':
          nextStory();
          break;
        case 'ArrowLeft':
          previousStory();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'Escape':
          closeViewer();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, nextStory, previousStory, togglePlay, closeViewer]);

  // Touch/Click handlers
  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      previousStory();
    } else if (x > (2 * width) / 3) {
      nextStory();
    }
  };

  const handleHold = () => {
    setPlaying(false);
  };

  const handleRelease = () => {
    setPlaying(true);
  };

  if (!isViewerOpen || !currentHighlight) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: index < currentStoryIndex ? '100%' : index === currentStoryIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            <img
              src={currentHighlight.profile?.profilePic || '/default-avatar.png'}
              alt={currentHighlight.profile?.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-semibold">{currentHighlight.title}</p>
            <p className="text-xs opacity-70">
              {currentStoryIndex + 1} / {stories.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={closeViewer}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div
        className="relative w-full h-full max-w-md mx-auto cursor-pointer"
        onClick={handleTap}
        onMouseDown={handleHold}
        onMouseUp={handleRelease}
        onTouchStart={handleHold}
        onTouchEnd={handleRelease}
      >
        {currentStory && (
          currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )
        )}

        {/* Caption */}
        {currentStory?.caption && (
          <div className="absolute bottom-20 left-4 right-4 text-white">
            <p className="text-sm bg-black/50 px-3 py-2 rounded-lg">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Arrows (Desktop) */}
      <div className="hidden md:block">
        {currentStoryIndex > 0 && (
          <button
            onClick={previousStory}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        <button
          onClick={nextStory}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
