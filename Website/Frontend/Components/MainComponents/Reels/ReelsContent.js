"use client";
import { useState, useEffect, useRef, useContext } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';
import { AuthContext } from '../../Helper/AuthProvider';
import VideoPlayer from '../Post/VideoPlayer';
import ReelComments from './ReelComments';
import ReelBalance from './ReelBalance';
import ShareModal from './ShareModal';
import MoreOptionsModal from './MoreOptionsModal';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  MoreHorizontal,
  UserPlus,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Coins,
  Sparkles,
  Flame
} from 'lucide-react';

// Import your existing GraphQL queries
import { 
  GET_ALL_POSTS, 
  TOGGLE_POST_LIKE, 
  TOGGLE_SAVE_POST,
  TOGGLE_FOLLOW_USER 
} from '../../../lib/graphql/queries';
import { BLOCK_USER, RESTRICT_USER } from '../../../lib/graphql/profileQueries';

const MomentsContent = () => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const searchParams = useSearchParams();
  
  // Get initial moment index from URL parameter
  const initialMomentIndex = searchParams?.get('moment') ? parseInt(searchParams.get('moment')) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialMomentIndex);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0.0000);
  const [watchStreak, setWatchStreak] = useState(5);
  const [watchTime, setWatchTime] = useState(0);
  const reelsContainerRef = useRef(null);
  const watchTimeRef = useRef({});
  const watchedReelsHistory = useRef([]); // Track last 10 watched reels
  const uniqueReelsWatched = useRef(new Set()); // Track all unique reels ever watched

  // GraphQL queries and mutations
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all'
  });

  const [toggleLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSave] = useMutation(TOGGLE_SAVE_POST);
  const [toggleFollow] = useMutation(TOGGLE_FOLLOW_USER);
  const [blockUser] = useMutation(BLOCK_USER);
  const [restrictUser] = useMutation(RESTRICT_USER);

  // Filter only video posts for moments
  const videoMoments = data?.getPosts?.filter(post => 
    post.postType === 'VIDEO' && post.postUrl
  ) || [];
  
  // Set initial moment index when data loads
  useEffect(() => {
    if (videoMoments.length > 0 && initialMomentIndex >= 0 && initialMomentIndex < videoMoments.length) {
      setCurrentIndex(initialMomentIndex);
    } else if (videoMoments.length > 0 && initialMomentIndex >= videoMoments.length) {
      // If requested index is out of bounds, start from the beginning
      setCurrentIndex(0);
    }
  }, [videoMoments.length, initialMomentIndex]);

  // Enhanced watch time tracker for rewards with unique moment and 10-moment block system
  useEffect(() => {
    if (videoMoments.length > 0 && currentIndex < videoMoments.length) {
      const currentMoment = videoMoments[currentIndex];
      const momentId = currentMoment.postid;
      
      // Check if this moment is eligible for rewards
      const isUniqueMoment = !uniqueReelsWatched.current.has(momentId);
      const isNotInRecentHistory = !watchedReelsHistory.current.includes(momentId);
      const isEligibleForRewards = isUniqueMoment || isNotInRecentHistory;
      
      const interval = setInterval(() => {
        if (!watchTimeRef.current[momentId]) {
          watchTimeRef.current[momentId] = 0;
        }
        watchTimeRef.current[momentId] += 1;
        
        const watchedSeconds = watchTimeRef.current[momentId];
        
        // Only give rewards if eligible
        if (isEligibleForRewards) {
          // Calculate earnings based on watch time (0.001 dollar for 2 minutes = 120 seconds)
          const baseRewardPerSecond = 0.001 / 120;
          
          // Give small incremental rewards every 10 seconds for better UX
          if (watchedSeconds % 10 === 0) {
            const incrementalReward = baseRewardPerSecond * 10;
            setWalletBalance(prev => Number((prev + incrementalReward).toFixed(4)));
          }
          
          // Bonus reward every 2 minutes (120 seconds) for completion
          if (watchedSeconds % 120 === 0 && watchedSeconds > 0) {
            if (!watchTimeRef.current[`bonus_${momentId}_${Math.floor(watchedSeconds / 120)}`]) {
              const bonusReward = 0.0005; // Bonus for watching full 2 minutes
              setWalletBalance(prev => Number((prev + bonusReward).toFixed(4)));
              watchTimeRef.current[`bonus_${momentId}_${Math.floor(watchedSeconds / 120)}`] = true;
            }
          }
        }
        
        // Mark moment as watched after 30 seconds (significant watch time)
        if (watchedSeconds === 30) {
          // Add to unique moments watched
          uniqueReelsWatched.current.add(momentId);
          
          // Update recent history (keep only last 10)
          watchedReelsHistory.current.push(momentId);
          if (watchedReelsHistory.current.length > 10) {
            watchedReelsHistory.current.shift(); // Remove oldest
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentIndex, videoMoments]);

  // Handle like toggle
  const handleLike = async (postId) => {
    if (!user?.profileid) return;
    
    try {
      await toggleLike({
        variables: {
          profileid: user.profileid,
          postid: postId
        }
      });
      refetch();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle save toggle
  const handleSave = async (postId) => {
    if (!user?.profileid) return;
    
    try {
      await toggleSave({
        variables: {
          profileid: user.profileid,
          postid: postId
        }
      });
      refetch();
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Handle follow toggle
  const handleFollow = async (profileId) => {
    if (!user?.profileid) return;
    
    try {
      await toggleFollow({
        variables: {
          profileid: user.profileid,
          followid: profileId
        }
      });
      refetch();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Handle profile navigation
  const handleViewProfile = (profileId) => {
    if (profileId) {
      window.location.href = `/profile/${profileId}`;
    }
  };

  // Handle comments
  const handleComments = (moment) => {
    setSelectedReel(moment); // Keep the variable name for compatibility with ReelComments component
    setShowComments(true);
  };

  // Handle comment panel close
  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedReel(null);
    // Refetch posts to update comment counts
    refetch();
  };

  // Handle share
  const handleShare = (reel) => {
    setSelectedReel(reel);
    setShowShare(true);
  };

  // Handle block user from moment
  const handleBlockFromReel = async (moment) => {
    if (!user?.profileid || !moment?.profile?.profileid) return;
    
    const confirmed = confirm(`Are you sure you want to block ${moment.profile.username}?`);
    if (!confirmed) return;
    
    try {
      await blockUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: moment.profile.profileid,
          reason: 'Blocked from moment'
        }
      });
      alert(`${moment.profile.username} has been blocked.`);
      setShowMoreOptions(false);
      refetch(); // Refresh moments to remove blocked user's content
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user. Please try again.');
    }
  };

  // Handle restrict user from moment
  const handleRestrictFromReel = async (moment) => {
    if (!user?.profileid || !moment?.profile?.profileid) return;
    
    const confirmed = confirm(`Are you sure you want to restrict ${moment.profile.username}?`);
    if (!confirmed) return;
    
    try {
      await restrictUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: moment.profile.profileid
        }
      });
      alert(`${moment.profile.username} has been restricted.`);
      setShowMoreOptions(false);
      refetch(); // Refresh to apply any content filtering
    } catch (error) {
      console.error('Error restricting user:', error);
      alert('Failed to restrict user. Please try again.');
    }
  };

  // Navigate moments
  const nextMoment = () => {
    if (currentIndex < videoMoments.length - 1) {
      // Close comments when moving to the next moment
      setShowComments(false);
      setSelectedReel(null);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevMoment = () => {
    if (currentIndex > 0) {
      // Close comments when moving to the previous moment
      setShowComments(false);
      setSelectedReel(null);
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevMoment();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextMoment();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsMuted(!isMuted);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showComments) {
          handleCloseComments();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videoMoments.length, isMuted, showComments]);

  // Loading state removed

  if (error) {
    return (
      <div className="text-center py-10">
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Unable to load moments. Please try again later.
        </p>
      </div>
    );
  }

  if (videoMoments.length === 0) {
    return (
      <div className="text-center py-20">
        <div className={`text-6xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
          🎬
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          No Moments Yet
        </h3>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Be the first to share a video moment!
        </p>
      </div>
    );
  }

  const currentMoment = videoMoments[currentIndex];

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-screen">
      {/* Content Row: moment + optional comments panel */}
      <div className={`relative flex items-center justify-center transition-all duration-300 ${showComments ? 'gap-8' : ''}`}>
        {/* Moment Container */}
        <div className="relative" style={{ width: '480px', height: '90vh' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMoment?.postid}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl bg-black"
            >
            {/* Video Player */}
            <VideoPlayer
              src={currentMoment?.postUrl}
              autoPlay={true}
              muted={isMuted}
              loop={true}
              className="w-full h-full"
              showPlayButton={false}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10 pointer-events-none" />

            {/* Balance Box - Top Left */}
            <ReelBalance
              walletBalance={walletBalance}
              watchStreak={watchStreak}
              theme={theme}
              isEarningRewards={
                videoMoments.length > 0 && currentIndex < videoMoments.length
                  ? (!uniqueReelsWatched.current.has(videoMoments[currentIndex]?.postid) || 
                     !watchedReelsHistory.current.includes(videoMoments[currentIndex]?.postid))
                  : true
              }
            />

            {/* Sound Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-all"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </motion.button>

            {/* Navigation Controls */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
              <div className="flex flex-col space-y-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevMoment}
                  disabled={currentIndex === 0}
                  className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                    currentIndex === 0 
                      ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextMoment}
                  disabled={currentIndex === videoMoments.length - 1}
                  className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                    currentIndex === videoMoments.length - 1
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Main Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="flex items-end justify-between p-6">
                {/* Left Side - User Info & Content */}
                <div className="flex-1 max-w-xs">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    {/* User Profile Section */}
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleViewProfile(currentMoment?.profile?.profileid)}
                        className="relative hover:scale-105 transition-transform duration-200"
                      >
                        <img
                          src={currentMoment?.profile?.profilePic || '/default-avatar.png'}
                          alt={currentMoment?.profile?.username}
                          className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg hover:border-white/80 transition-all"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <button 
                            onClick={() => handleViewProfile(currentMoment?.profile?.profileid)}
                            className="text-white font-bold text-lg hover:underline transition-all"
                          >
                            @{currentMoment?.profile?.username}
                          </button>
                          {currentMoment?.profile?.isVerified && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          {/* Follow Button - Inline with username */}
                          {user?.profileid !== currentMoment?.profile?.profileid && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleFollow(currentMoment?.profile?.profileid)}
                              className="ml-3 px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold rounded-full transition-all duration-300 flex items-center space-x-1 shadow-lg"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Follow</span>
                            </motion.button>
                          )}
                        </div>
                        <p className="text-white/70 text-sm">
                          {new Date(currentMoment?.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-2">
                      {currentMoment?.title && (
                        <h4 className="text-white font-bold text-xl leading-tight">
                          {currentMoment.title}
                        </h4>
                      )}
                      {currentMoment?.Description && (
                        <p className="text-white/90 text-base leading-relaxed">
                          {currentMoment.Description}
                        </p>
                      )}
                      
                      {/* Tags */}
                      {currentMoment?.tags && currentMoment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {currentMoment.tags.slice(0, 4).map((tag, tagIndex) => (
                            <motion.span
                              key={tagIndex}
                              whileHover={{ scale: 1.05 }}
                              className="text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium cursor-pointer hover:bg-white/30 transition-all"
                            >
                              #{tag}
                            </motion.span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex flex-col items-center space-y-4 ml-4">
                  {/* Like Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center space-y-1"
                  >
                    <button
                      onClick={() => handleLike(currentMoment?.postid)}
                      className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${
                        currentMoment?.isLikedByUser
                          ? 'bg-red-500 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${currentMoment?.isLikedByUser ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-white font-semibold text-xs">
                      {currentMoment?.likeCount || 0}
                    </span>
                  </motion.div>

                  {/* Comment Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center space-y-1"
                  >
                    <button
                      onClick={() => handleComments(currentMoment)}
                      className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all duration-300 shadow-lg"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <span className="text-white font-semibold text-xs">
                      {currentMoment?.commentCount || 0}
                    </span>
                  </motion.div>

                  {/* Share Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center space-y-1"
                  >
                    <button
                      onClick={() => handleShare(currentMoment)}
                      className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Share className="w-6 h-6" />
                    </button>
                    <span className="text-white font-semibold text-xs">Share</span>
                  </motion.div>

                  {/* Save Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center space-y-1"
                  >
                    <button
                      onClick={() => handleSave(currentMoment?.postid)}
                      className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${
                        currentMoment?.isSavedByUser
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Bookmark className={`w-6 h-6 ${currentMoment?.isSavedByUser ? 'fill-current' : ''}`} />
                    </button>
                  </motion.div>

                  {/* More Options */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <button 
                      onClick={() => setShowMoreOptions(true)}
                      className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all duration-300 shadow-lg"
                    >
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute top-2 left-4 z-20">
              <div className="flex space-x-1">
                {videoMoments.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-white w-6'
                        : 'bg-white/40 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        </div>

        {/* Inline Sliding Comments Panel (same height/width as reel) */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative"
              style={{ width: '480px', height: '90vh' }}
            >
              <ReelComments
                isOpen={true}
                variant="inline"
                onClose={handleCloseComments}
                reel={selectedReel}
                user={user}
                refetch={refetch}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        reel={selectedReel}
        theme={theme}
      />

      {/* More Options Modal */}
      <MoreOptionsModal
        isOpen={showMoreOptions}
        onClose={() => setShowMoreOptions(false)}
        reel={currentMoment}
        theme={theme}
        user={user}
        onBlockUser={handleBlockFromReel}
        onRestrictUser={handleRestrictFromReel}
      />
    </div>
  );
};

export default MomentsContent;
