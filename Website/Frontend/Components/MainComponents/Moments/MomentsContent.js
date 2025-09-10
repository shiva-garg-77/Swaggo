"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  VolumeX, 
  Volume2,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  UserPlus,
  Coins,
  Flame,
  Trophy,
  Gift
} from 'lucide-react';
import RewardSystem from './RewardSystem';
import CommentPanel from './CommentPanel';
import ShareModal from './ShareModal';
import AIRecommendations from './AIRecommendations';
import StreakSystem from './StreakSystem';

const MomentsContent = () => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0.0);
  const [watchStreak, setWatchStreak] = useState(0);
  const videoRefs = useRef([]);
  const watchTimeRef = useRef({});

  // Mock moments data - replace with real API data
  const moments = [
    {
      id: 1,
      username: 'alex_dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      title: 'Amazing sunset vibes 🌅',
      description: 'Caught this beautiful moment at the beach today. Nature is incredible!',
      videoUrl: '/videos/sample1.mp4', // Replace with real video URLs
      likes: 1247,
      comments: 89,
      shares: 156,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      username: 'sara_creative',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b742?w=100&h=100&fit=crop&crop=face',
      title: 'Creative coding session 💻',
      description: 'Building something amazing with React and animations!',
      videoUrl: '/videos/sample2.mp4',
      likes: 892,
      comments: 45,
      shares: 78,
      isLiked: true,
      isSaved: false,
      isFollowing: true,
      timestamp: '5 hours ago'
    },
    {
      id: 3,
      username: 'john_adventure',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      title: 'Mountain climbing adventure 🏔️',
      description: 'Reached the summit after 6 hours of climbing. Worth every step!',
      videoUrl: '/videos/sample3.mp4',
      likes: 2156,
      comments: 234,
      shares: 445,
      isLiked: false,
      isSaved: true,
      isFollowing: false,
      timestamp: '1 day ago'
    }
  ];

  const [momentsState, setMomentsState] = useState(moments);

  // Handle video navigation
  const nextVideo = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevVideo();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextVideo();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  // Auto-play management
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.currentTime = 0;
      currentVideo.play().catch(console.error);
      
      // Initialize watch time for this moment
      if (!watchTimeRef.current[moments[currentIndex].id]) {
        watchTimeRef.current[moments[currentIndex].id] = 0;
      }
    }

    // Pause other videos
    videoRefs.current.forEach((video, index) => {
      if (index !== currentIndex && video) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.muted = !isMuted;
    }
  };

  const toggleLike = (momentId) => {
    setMomentsState(prev => 
      prev.map(moment => 
        moment.id === momentId 
          ? { 
              ...moment, 
              isLiked: !moment.isLiked,
              likes: moment.isLiked ? moment.likes - 1 : moment.likes + 1
            }
          : moment
      )
    );
  };

  const toggleSave = (momentId) => {
    setMomentsState(prev => 
      prev.map(moment => 
        moment.id === momentId 
          ? { ...moment, isSaved: !moment.isSaved }
          : moment
      )
    );
  };

  const toggleFollow = (momentId) => {
    setMomentsState(prev => 
      prev.map(moment => 
        moment.id === momentId 
          ? { ...moment, isFollowing: !moment.isFollowing }
          : moment
      )
    );
  };

  const currentMoment = momentsState[currentIndex];

  return (
    <div className={`h-screen w-full relative overflow-hidden ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-900'
    }`}>
      {/* Video Container */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full relative"
          >
            {/* Background video or placeholder */}
            <div className="h-full w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              {/* Video placeholder - replace with actual video when available */}
              <div className="text-white text-center">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Flame className="w-16 h-16" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{currentMoment.title}</h3>
                <p className="text-white/80 max-w-md">{currentMoment.description}</p>
              </div>
              
              {/* Hidden video elements for future implementation */}
              {moments.map((moment, index) => (
                <video
                  key={moment.id}
                  ref={el => videoRefs.current[index] = el}
                  className="hidden"
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  onError={() => console.log('Video not available')}
                >
                  <source src={moment.videoUrl} type="video/mp4" />
                </video>
              ))}
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col space-y-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevVideo}
            disabled={currentIndex === 0}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
              currentIndex === 0 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextVideo}
            disabled={currentIndex === moments.length - 1}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
              currentIndex === moments.length - 1
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      {/* Sound Control */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        className="absolute top-4 right-4 z-20 p-3 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-all duration-300"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </motion.button>

      {/* User Info and Actions */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-end justify-between p-6">
          {/* User info and content */}
          <div className="flex-1 max-w-xs">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {/* User profile */}
              <div className="flex items-center space-x-3">
                <img
                  src={currentMoment.avatar}
                  alt={currentMoment.username}
                  className="w-12 h-12 rounded-full border-2 border-white/50"
                />
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">
                    @{currentMoment.username}
                  </h3>
                  <p className="text-white/70 text-sm">{currentMoment.timestamp}</p>
                </div>
                {!currentMoment.isFollowing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleFollow(currentMoment.id)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-full transition-all duration-300 flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </motion.button>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h4 className="text-white font-medium text-lg">{currentMoment.title}</h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  {currentMoment.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-center space-y-6 ml-4">
            {/* Like button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center space-y-2"
            >
              <button
                onClick={() => toggleLike(currentMoment.id)}
                className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
                  currentMoment.isLiked
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Heart className={`w-7 h-7 ${currentMoment.isLiked ? 'fill-current' : ''}`} />
              </button>
              <span className="text-white font-medium text-sm">{currentMoment.likes}</span>
            </motion.div>

            {/* Comment button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center space-y-2"
            >
              <button
                onClick={() => setShowComments(true)}
                className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all duration-300"
              >
                <MessageCircle className="w-7 h-7" />
              </button>
              <span className="text-white font-medium text-sm">{currentMoment.comments}</span>
            </motion.div>

            {/* Share button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center space-y-2"
            >
              <button
                onClick={() => setShowShare(true)}
                className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all duration-300"
              >
                <Share className="w-7 h-7" />
              </button>
              <span className="text-white font-medium text-sm">{currentMoment.shares}</span>
            </motion.div>

            {/* Save button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <button
                onClick={() => toggleSave(currentMoment.id)}
                className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 ${
                  currentMoment.isSaved
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Bookmark className={`w-7 h-7 ${currentMoment.isSaved ? 'fill-current' : ''}`} />
              </button>
            </motion.div>

            {/* More options */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <button className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all duration-300">
                <MoreHorizontal className="w-7 h-7" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Reward System */}
      <RewardSystem
        currentMoment={currentMoment}
        walletBalance={walletBalance}
        setWalletBalance={setWalletBalance}
        watchStreak={watchStreak}
        setWatchStreak={setWatchStreak}
        watchTimeRef={watchTimeRef}
      />

      {/* Comment Panel */}
      <CommentPanel
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        moment={currentMoment}
        theme={theme}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        moment={currentMoment}
        theme={theme}
      />

      {/* AI Recommendations */}
      <AIRecommendations
        theme={theme}
        currentUser="current_user"
      />

      {/* Streak System */}
      <StreakSystem
        watchStreak={watchStreak}
        setWatchStreak={setWatchStreak}
        walletBalance={walletBalance}
        setWalletBalance={setWalletBalance}
        theme={theme}
      />

      {/* Progress indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-2">
          {moments.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MomentsContent;
