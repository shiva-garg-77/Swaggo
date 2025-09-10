"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function MemoryViewer({ memory, isOpen, onClose, isCurrentUser = false, onAddStory = null, onRefresh = null }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setPaused] = useState(false);
  
  const stories = memory?.stories || [];
  const currentStory = stories[currentStoryIndex];
  const totalStories = stories.length;

  // Story progression timer
  useEffect(() => {
    if (!isOpen || isPaused || totalStories === 0) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentStoryIndex < totalStories - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            return 0;
          } else {
            // Close viewer when last story ends
            onClose();
            return 0;
          }
        }
        return prev + (100 / 50); // 5 seconds per story (50 intervals)
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isOpen, currentStoryIndex, totalStories, isPaused, onClose]);

  // Reset progress when story changes
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
    }
  }, [currentStoryIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousStory();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNextStory();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentStoryIndex, totalStories]);

  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < totalStories - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  }, [currentStoryIndex, totalStories, onClose]);

  const goToPreviousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  }, [currentStoryIndex]);

  const goToStory = (index) => {
    setCurrentStoryIndex(index);
    setProgress(0);
  };

  const handleAddStory = async () => {
    if (!onAddStory) return;
    
    const mediaUrl = prompt('Enter media URL (image or video):');
    if (!mediaUrl?.trim()) return;
    
    const mediaType = prompt('Enter media type (IMAGE or VIDEO):')?.toUpperCase();
    if (!['IMAGE', 'VIDEO'].includes(mediaType)) {
      alert('Media type must be IMAGE or VIDEO');
      return;
    }
    
    try {
      await onAddStory({
        variables: {
          memoryid: memory.memoryid,
          mediaUrl: mediaUrl.trim(),
          mediaType
        }
      });
      
      if (onRefresh) {
        onRefresh();
      }
      
      alert('Story added successfully!');
    } catch (error) {
      console.error('Error adding story:', error);
      alert('Failed to add story. Please try again.');
    }
  };

  if (!isOpen || !memory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onClick={onClose}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4">
            {/* Progress bars */}
            <div className="flex space-x-1 mb-4">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                  onClick={() => goToStory(index)}
                >
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: '0%' }}
                    animate={{
                      width: index < currentStoryIndex ? '100%' : 
                             index === currentStoryIndex ? `${progress}%` : '0%'
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              ))}
            </div>

            {/* Header info */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <img
                  src={memory.coverImage || `https://picsum.photos/40/40?random=${memory.memoryid}`}
                  alt={memory.title}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/40/40?random=${memory.memoryid}`;
                  }}
                />
                <div>
                  <h3 className="font-semibold text-sm">{memory.title}</h3>
                  <p className="text-xs text-white/70">
                    {currentStory && new Date(currentStory.createdAt).toLocaleDateString()}
                  </p>
                  {memory.postUrl && (
                    <p className="text-xs text-blue-300">
                      📎 Linked to post
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isCurrentUser && onAddStory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddStory();
                    }}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {totalStories > 0 ? (
            <div
              className="relative w-full h-full flex items-center justify-center"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navigation areas */}
              <button
                onClick={goToPreviousStory}
                disabled={currentStoryIndex === 0}
                className="absolute left-0 top-0 w-1/3 h-full z-10 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity"
              >
                {currentStoryIndex > 0 && (
                  <ChevronLeft className="w-8 h-8 text-white/70" />
                )}
              </button>

              <button
                onClick={goToNextStory}
                className="absolute right-0 top-0 w-1/3 h-full z-10 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-8 h-8 text-white/70" />
              </button>

              {/* Story content */}
              <div className="w-full h-full flex items-center justify-center max-w-md max-h-screen p-4">
                {currentStory?.mediaType === 'VIDEO' ? (
                  <video
                    src={currentStory.mediaUrl}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    loop
                    muted
                    onError={(e) => {
                      console.error('Video loading error:', e);
                    }}
                  />
                ) : (
                  <img
                    src={currentStory?.mediaUrl || `https://picsum.photos/400/600?random=${currentStory?.storyid || 'default'}`}
                    alt="Story content"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = `https://picsum.photos/400/600?random=${currentStory?.storyid || 'default'}`;
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-white p-8">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Stories Yet</h3>
              <p className="text-white/70 mb-4">
                {isCurrentUser ? 'Add your first story to this memory!' : 'This memory doesn\'t have any stories yet.'}
              </p>
              {isCurrentUser && onAddStory && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddStory();
                  }}
                  className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors"
                >
                  Add Story
                </button>
              )}
            </div>
          )}

          {/* Story counter */}
          {totalStories > 0 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm">
              {currentStoryIndex + 1} / {totalStories}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
