"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TOGGLE_POST_LIKE, 
  TOGGLE_SAVE_POST, 
  GET_POST_STATS 
} from '../../../lib/graphql/simpleQueries';
import VideoPlayer from './VideoPlayer';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';

export default function EnhancedPostModal({ 
  post, 
  isOpen, 
  onClose, 
  showNavigation = false,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  currentIndex,
  totalCount
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const modalRef = useRef(null);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // GraphQL mutations
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);

  // Get current post stats
  const { data: postStats, refetch: refetchPostStats } = useQuery(GET_POST_STATS, {
    variables: { postid: post?.postid },
    skip: !post?.postid || !isOpen,
    fetchPolicy: 'cache-and-network'
  });

  // Process post data
  const postData = useMemo(() => {
    if (!post) return null;
    
    return {
      id: post.postid || post.id,
      username: post.profile?.username || post.username || 'Unknown User',
      fullName: post.profile?.name || post.fullName || 'Unknown User',
      avatar: post.profile?.profilePic || post.avatar || '/default-profile.svg',
      mediaUrl: post.postUrl || post.image || null,
      caption: post.Description || post.caption || '',
      title: post.title || '',
      location: post.location || '',
      tags: post.tags || [],
      taggedPeople: post.taggedPeople || [],
      comments: post.comments || [],
      timeAgo: post.timeAgo || (post.createdAt ? formatTimeAgo(new Date(post.createdAt)) : 'Recently'),
      isVerified: post.profile?.isVerified || post.isVerified || false,
      postType: post.postType || 'IMAGE',
      allowComments: post.allowComments !== false,
      hideLikeCount: post.hideLikeCount || false,
      autoPlay: post.autoPlay !== false
    };
  }, [post]);

  // Update local state when stats change
  useEffect(() => {
    if (postStats?.getPostStats) {
      setLikeCount(postStats.getPostStats.likeCount);
      setIsLiked(postStats.getPostStats.isLikedByCurrentUser);
      setIsSaved(postStats.getPostStats.isSavedByCurrentUser);
    } else if (post) {
      setLikeCount(post.likeCount || post.likes || 0);
      setIsLiked(post.isLikedByUser || false);
      setIsSaved(post.isSavedByUser || false);
    }
  }, [postStats, post]);

  // Format time ago helper
  function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (showNavigation && !showShareModal) {
        if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
          e.preventDefault();
          onPrevious();
        } else if (e.key === 'ArrowRight' && hasNext && onNext) {
          e.preventDefault();
          onNext();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showNavigation, showShareModal, hasPrevious, hasNext, onPrevious, onNext]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  }, [onClose]);

  // Handle like with optimistic updates
  const handleLike = useCallback(async () => {
    if (!user?.profileid || !postData?.id) return;

    // Trigger like animation
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 600);

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      await togglePostLike({
        variables: {
          profileid: user.profileid,
          postid: postData.id
        }
      });
      
      // Refetch to get accurate data
      await refetchPostStats();
    } catch (error) {
      // Rollback on error
      setIsLiked(!newIsLiked);
      setLikeCount(likeCount);
      console.error('Error toggling post like:', error);
    }
  }, [user, postData, isLiked, likeCount, togglePostLike, refetchPostStats]);

  // Handle save with optimistic updates
  const handleSave = useCallback(async () => {
    if (!user?.profileid || !postData?.id) return;

    // Optimistic update
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);

    try {
      await toggleSavePost({
        variables: {
          profileid: user.profileid,
          postid: postData.id
        }
      });
      
      await refetchPostStats();
    } catch (error) {
      // Rollback on error
      setIsSaved(!newIsSaved);
      console.error('Error toggling save post:', error);
    }
  }, [user, postData, isSaved, toggleSavePost, refetchPostStats]);

  // Handle share
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  // Handle comment refresh
  const handleCommentRefresh = useCallback(() => {
    refetchPostStats();
  }, [refetchPostStats]);

  if (!isOpen || !postData) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`relative w-full max-w-6xl max-h-[95vh] rounded-2xl overflow-hidden shadow-2xl ${
            theme === 'dark' 
              ? 'bg-gray-900 border border-gray-700/50' 
              : 'bg-white border border-gray-200/50'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-sm ${
            theme === 'dark' 
              ? 'border-gray-700/60 bg-gray-900/95' 
              : 'border-gray-200/60 bg-white/95'
          }`}>
            <div className="flex items-center space-x-4">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={postData.avatar}
                alt={postData.username}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shadow-lg"
                onError={(e) => {
                  e.target.src = '/default-profile.svg';
                }}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <p className={`font-semibold text-base leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {postData.username}
                  </p>
                  {postData.isVerified && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 text-blue-500" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                  )}
                </div>
                <p className={`text-sm mt-0.5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {postData.location || postData.timeAgo}
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`p-2.5 rounded-full transition-all duration-200 ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/60' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
              }`}
            >
              <CloseIcon className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Navigation Arrows */}
          {showNavigation && (
            <>
              {hasPrevious && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onPrevious}
                  className={`absolute left-6 top-1/2 transform -translate-y-1/2 z-50 p-4 rounded-full backdrop-blur-lg border-2 transition-all duration-200 shadow-2xl ${
                    theme === 'dark'
                      ? 'bg-gray-900/95 hover:bg-gray-800 text-white border-gray-600'
                      : 'bg-white/95 hover:bg-white text-gray-900 border-gray-300'
                  }`}
                  title="Previous post (←)"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </motion.button>
              )}
              {hasNext && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onNext}
                  className={`absolute right-6 top-1/2 transform -translate-y-1/2 z-50 p-4 rounded-full backdrop-blur-lg border-2 transition-all duration-200 shadow-2xl ${
                    theme === 'dark'
                      ? 'bg-gray-900/95 hover:bg-gray-800 text-white border-gray-600'
                      : 'bg-white/95 hover:bg-white text-gray-900 border-gray-300'
                  }`}
                  title="Next post (→)"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </motion.button>
              )}
              
              {/* Navigation Indicator */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute top-6 right-6 z-40 px-3 py-1.5 rounded-full backdrop-blur-md text-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-900/80 text-white border border-gray-700'
                    : 'bg-white/80 text-gray-900 border border-gray-300'
                }`}
              >
                {currentIndex} / {totalCount}
              </motion.div>
            </>
          )}

          {/* Content */}
          <div className="flex flex-col lg:flex-row max-h-[calc(95vh-80px)]">
            {/* Media Section */}
            <div className="flex-1 flex items-center justify-center bg-black relative">
              {postData.postType === 'VIDEO' ? (
                <VideoPlayer
                  src={postData.mediaUrl}
                  autoPlay={postData.autoPlay}
                  loop={true}
                  muted={true}
                  controls={true}
                  isModal={true}
                  className="max-w-full max-h-full"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={postData.mediaUrl}
                  alt={postData.title || 'Post content'}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error('Modal image load error:', postData.mediaUrl);
                    e.target.src = '/default-profile.svg';
                  }}
                />
              )}
            </div>

            {/* Sidebar with Details and Comments */}
            <div className={`w-full lg:w-96 flex flex-col border-l backdrop-blur-sm ${
              theme === 'dark' 
                ? 'border-gray-700/60 bg-gradient-to-b from-gray-900/95 to-gray-900/95' 
                : 'border-gray-200/60 bg-gradient-to-b from-white/95 to-white/95'
            }`}>
              
              {/* Post Details */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                {postData.title && (
                  <h2 className={`text-xl font-bold mb-3 leading-tight ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {postData.title}
                  </h2>
                )}

                {postData.caption && (
                  <div className={`mb-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <span className="font-semibold">{postData.username}</span>{' '}
                    {postData.caption}
                  </div>
                )}

                {/* Tags and Tagged People */}
                {postData.tags && postData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {postData.tags.map((tag, index) => (
                      <motion.span
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        className={`text-sm px-3 py-1 rounded-full cursor-pointer ${
                          theme === 'dark' 
                            ? 'bg-blue-900/30 text-blue-300' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        #{tag}
                      </motion.span>
                    ))}
                  </div>
                )}

                {postData.taggedPeople && postData.taggedPeople.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {postData.taggedPeople.map((person, index) => (
                      <motion.span
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        className={`text-sm px-3 py-1 rounded-full cursor-pointer ${
                          theme === 'dark' 
                            ? 'bg-purple-900/30 text-purple-300' 
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        @{person}
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Like Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleLike}
                      disabled={!user?.profileid}
                      className={`p-2.5 rounded-full transition-all duration-200 relative ${
                        isLiked 
                          ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                          : theme === 'dark' 
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/10' 
                            : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                      } ${!user?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <AnimatePresence>
                        {isLikeAnimating && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <HeartIcon className="w-7 h-7 text-red-500 fill-current" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <HeartIcon className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-2.5 rounded-full transition-all duration-200 ${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800/30' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <CommentIcon className="w-7 h-7" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className={`p-2.5 rounded-full transition-all duration-200 ${
                        theme === 'dark' 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-800/30' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <ShareIcon className="w-7 h-7" />
                    </motion.button>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSave}
                    disabled={!user?.profileid}
                    className={`p-2.5 rounded-full transition-all duration-200 ${
                      isSaved 
                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                        : theme === 'dark' 
                          ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/10' 
                          : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-50'
                    } ${!user?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <BookmarkIcon className={`w-7 h-7 ${isSaved ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>

                {/* Likes Count */}
                {!postData.hideLikeCount && (
                  <motion.p
                    key={likeCount}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.2 }}
                    className={`font-semibold text-sm mt-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{likeCount.toLocaleString()}</span> {likeCount === 1 ? 'like' : 'likes'}
                  </motion.p>
                )}
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-hidden">
                <CommentSection
                  postId={postData.id}
                  comments={postData.comments}
                  onRefresh={handleCommentRefresh}
                  className="h-full p-6"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />
    </AnimatePresence>
  );
}

// Icon Components
function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function HeartIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function CommentIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function ShareIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
  );
}

function BookmarkIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
