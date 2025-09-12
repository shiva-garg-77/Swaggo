"use client";
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { 
  GET_ALL_POSTS, 
  TOGGLE_POST_LIKE, 
  TOGGLE_SAVE_POST 
} from '../../../lib/graphql/queries';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  Volume2, 
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Eye
} from 'lucide-react';

export default function SuggestedMoments({ onMomentClick = null }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const scrollContainerRef = useRef(null);
  const videoRefs = useRef({});

  // GraphQL queries and mutations
  const { data, loading, error } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-first'
  });

  const [toggleLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSave] = useMutation(TOGGLE_SAVE_POST);

  // Filter video posts for moments (limit to first 10 for suggested moments)
  const suggestedMoments = data?.getPosts?.filter(post => 
    post.postType === 'VIDEO' && post.postUrl
  ).slice(0, 10) || [];

  // Auto-play management with proper promise handling
  useEffect(() => {
    if (suggestedMoments.length > 0) {
      // Pause all videos first with promise handling
      const pausePromises = Object.values(videoRefs.current).map(video => {
        if (video && !video.paused) {
          return new Promise(resolve => {
            video.pause();
            video.onpause = () => resolve();
            // Fallback timeout in case onpause doesn't fire
            setTimeout(resolve, 100);
          });
        }
        return Promise.resolve();
      });

      // Wait for all videos to pause, then play current video
      Promise.all(pausePromises).then(() => {
        if (isPlaying && videoRefs.current[currentPlayingIndex]) {
          const currentVideo = videoRefs.current[currentPlayingIndex];
          currentVideo.currentTime = 0; // Reset to start
          
          // Handle play promise properly
          const playPromise = currentVideo.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              // Don't log the interruption error as it's expected behavior
              if (!error.message.includes('interrupted')) {
                console.error('Video play error:', error);
              }
            });
          }
        }
      });
    }
  }, [currentPlayingIndex, isPlaying, suggestedMoments.length]);

  // Handle video ended - move to next moment
  const handleVideoEnded = (index) => {
    if (index < suggestedMoments.length - 1) {
      setCurrentPlayingIndex(index + 1);
    } else {
      setCurrentPlayingIndex(0); // Loop back to start
    }
  };

  // Handle like
  const handleLike = async (postId, event) => {
    event.stopPropagation();
    if (!user?.profileid) return;

    try {
      await toggleLike({
        variables: {
          profileid: user.profileid,
          postid: postId
        }
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle save
  const handleSave = async (postId, event) => {
    event.stopPropagation();
    if (!user?.profileid) return;

    try {
      await toggleSave({
        variables: {
          profileid: user.profileid,
          postid: postId
        }
      });
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Scroll functions with improved performance
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 200 : 320; // Adjust for mobile
      const newPosition = Math.max(scrollPosition - scrollAmount, 0);
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 200 : 320; // Adjust for mobile
      const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
      const newPosition = Math.min(scrollPosition + scrollAmount, maxScroll);
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  // Toggle play/pause with proper promise handling
  const togglePlayPause = (event) => {
    event.stopPropagation();
    setIsPlaying(!isPlaying);
    
    if (videoRefs.current[currentPlayingIndex]) {
      const currentVideo = videoRefs.current[currentPlayingIndex];
      if (isPlaying) {
        currentVideo.pause();
      } else {
        const playPromise = currentVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // Don't log the interruption error as it's expected behavior
            if (!error.message.includes('interrupted')) {
              console.error('Video play error:', error);
            }
          });
        }
      }
    }
  };

  // Handle moment click - navigate to moments page
  const handleMomentClick = (moment, index) => {
    // Stop current playing video
    if (videoRefs.current[currentPlayingIndex]) {
      videoRefs.current[currentPlayingIndex].pause();
    }
    
    // Navigate to moments page with the selected moment index
    router.push(`/reel?moment=${index}`);
  };

  if (loading) {
    return (
      <div className={`mb-6 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Suggested Moments
          </h3>
          <div className="animate-pulse h-4 w-16 bg-gray-300 rounded"></div>
        </div>
        <div className="px-4 pb-4">
          <div className="flex space-x-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <div className="w-48 h-72 bg-gray-300 rounded-xl animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || suggestedMoments.length === 0) {
    return null; // Don't show the section if there are no moments
  }

  return (
    <div className={`mb-6 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gradient-to-r from-pink-500 to-red-500'}`}>
            <Play className="w-4 h-4 text-white" />
          </div>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Suggested Moments
          </h3>
          <span className={`text-sm px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {suggestedMoments.length}
          </span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/reel')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
            }`}
          >
            View All
          </button>
          
          <button
            onClick={togglePlayPause}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'}`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Moments Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={scrollLeft}
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} ${scrollPosition <= 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'}`}
          disabled={scrollPosition <= 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={scrollRight}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'} opacity-80 hover:opacity-100`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Scrollable Moments */}
        <div 
          ref={scrollContainerRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide px-4 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {suggestedMoments.map((moment, index) => (
            <motion.div
              key={moment.postid}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 relative group cursor-pointer"
              onClick={() => handleMomentClick(moment, index)}
            >
              {/* Moment Card - Small size */}
              <div className={`relative w-36 sm:w-40 h-52 sm:h-60 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 ${currentPlayingIndex === index ? 'ring-2 ring-red-500' : ''}`}>
                {/* Video */}
                <video
                  ref={(el) => videoRefs.current[index] = el}
                  src={moment.postUrl}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  loop={false}
                  playsInline
                  onEnded={() => handleVideoEnded(index)}
                  onLoadedData={() => {
                    if (index === currentPlayingIndex && isPlaying) {
                      const video = videoRefs.current[index];
                      if (video) {
                        const playPromise = video.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(error => {
                            // Don't log the interruption error as it's expected behavior
                            if (!error.message.includes('interrupted')) {
                              console.error('Video play error:', error);
                            }
                          });
                        }
                      }
                    }
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Playing Indicator */}
                {currentPlayingIndex === index && (
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      <Eye className="w-3 h-3" />
                      <span>Playing</span>
                    </div>
                  </div>
                )}

                {/* Content Overlay - Clean */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  {/* Title/Description Only */}
                  {(moment.title || moment.Description) && (
                    <p className="text-xs text-white/90 line-clamp-2 text-center">
                      {moment.title || moment.Description}
                    </p>
                  )}
                </div>

                {/* Hover Play Indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
