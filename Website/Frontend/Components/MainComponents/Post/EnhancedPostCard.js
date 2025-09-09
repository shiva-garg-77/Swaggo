"use client";

import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TOGGLE_POST_LIKE, 
  TOGGLE_SAVE_POST 
} from '../../../lib/graphql/simpleQueries';
import VideoPlayer from './VideoPlayer';
import ShareModal from './ShareModal';

export default function EnhancedPostCard({ 
  post, 
  onImageClick, 
  onLike, 
  onSave,
  onRefresh,
  className = ""
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(post?.isLikedByUser || false);
  const [isSaved, setIsSaved] = useState(post?.isSavedByUser || false);
  const [likeCount, setLikeCount] = useState(post?.likeCount || post?.likes || 0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  // GraphQL mutations for optimistic updates
  const [togglePostLikeMutation] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePostMutation] = useMutation(TOGGLE_SAVE_POST);

  // Process post data
  const postData = useMemo(() => ({
    id: post?.postid || post?.id,
    username: post?.profile?.username || post?.username || 'Unknown User',
    fullName: post?.profile?.name || post?.fullName || 'Unknown User',
    avatar: post?.profile?.profilePic || post?.avatar || '/default-profile.svg',
    mediaUrl: post?.postUrl || post?.image || null,
    caption: post?.Description || post?.caption || '',
    title: post?.title || '',
    location: post?.location || '',
    tags: post?.tags || [],
    taggedPeople: post?.taggedPeople || [],
    likes: likeCount,
    comments: post?.commentCount || post?.comments || 0,
    timeAgo: post?.timeAgo || (post?.createdAt ? formatTimeAgo(new Date(post.createdAt)) : 'Recently'),
    isVerified: post?.profile?.isVerified || post?.isVerified || false,
    postType: post?.postType || 'IMAGE',
    allowComments: post?.allowComments !== false,
    hideLikeCount: post?.hideLikeCount || false,
    autoPlay: post?.autoPlay !== false // Default to true for better UX
  }), [post, likeCount]);

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

  // Handle like with optimistic updates
  const handleLike = useCallback(async () => {
    if (!user?.profileid || !postData.id) return;

    // Trigger like animation
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 600);

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      await togglePostLikeMutation({
        variables: {
          profileid: user.profileid,
          postid: postData.id
        }
      });
      
      // Call parent handler for additional updates
      onLike?.(postData.id);
      onRefresh?.();
    } catch (error) {
      // Rollback on error
      setIsLiked(!newIsLiked);
      setLikeCount(likeCount);
      console.error('Error toggling post like:', error);
    }
  }, [user, postData.id, isLiked, likeCount, togglePostLikeMutation, onLike, onRefresh]);

  // Handle save with optimistic updates  
  const handleSave = useCallback(async () => {
    if (!user?.profileid || !postData.id) return;

    // Optimistic update
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);

    try {
      await toggleSavePostMutation({
        variables: {
          profileid: user.profileid,
          postid: postData.id
        }
      });
      
      // Call parent handler for additional updates
      onSave?.(postData.id);
    } catch (error) {
      // Rollback on error
      setIsSaved(!newIsSaved);
      console.error('Error toggling save post:', error);
    }
  }, [user, postData.id, isSaved, toggleSavePostMutation, onSave]);

  // Handle share
  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  // Skip rendering if no valid media URL
  if (!postData.mediaUrl || postData.mediaUrl === 'null' || postData.mediaUrl === 'undefined') {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
          theme === 'dark' 
            ? 'bg-gray-900 border border-gray-700/50' 
            : 'bg-white border border-gray-200/50'
        } ${className}`}
      >
        {/* Post Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={postData.avatar}
              alt={postData.fullName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
              onError={(e) => {
                e.target.src = '/default-profile.svg';
              }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <p className={`font-semibold ${
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
              <div className="flex items-center space-x-2">
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {postData.timeAgo}
                </p>
                {postData.location && (
                  <>
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`}>•</span>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      📍 {postData.location}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <DotsIcon className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Post Media */}
        <div className="relative group">
          {postData.postType === 'VIDEO' ? (
            <VideoPlayer
              src={postData.mediaUrl}
              autoPlay={postData.autoPlay}
              loop={true}
              muted={true}
              onClick={onImageClick}
              className="w-full h-64 lg:h-80 cursor-pointer"
              showPlayButton={false}
            />
          ) : (
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="relative cursor-pointer"
              onClick={onImageClick}
            >
              <img
                src={postData.mediaUrl}
                alt={postData.title || 'Post content'}
                className="w-full h-64 lg:h-80 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  if (parent && !parent.querySelector('.image-error')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = `image-error w-full h-64 lg:h-80 flex flex-col items-center justify-center cursor-pointer ${
                      theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`;
                    errorDiv.innerHTML = `
                      <div class="text-center p-6">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,19H5V5H19V19M13.96,12.71L11.21,15.46L9.25,13.5L5.5,17.25H18.5L13.96,12.71Z" />
                        </svg>
                        <p class="text-lg font-medium mb-1">Image Unavailable</p>
                        <p class="text-sm opacity-70">Click to try viewing in full screen</p>
                      </div>
                    `;
                    errorDiv.onclick = onImageClick;
                    parent.appendChild(errorDiv);
                  }
                }}
              />
              
              {/* Hover overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/10 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  className="bg-white/90 rounded-full p-3"
                >
                  <ExpandIcon className="w-6 h-6 text-gray-800" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Post Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                disabled={!user?.profileid}
                className={`p-2 rounded-full transition-all duration-200 ${
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
                      <HeartIcon className="w-6 h-6 text-red-500 fill-current" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <HeartIcon className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>

              {/* Comment Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onImageClick}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <CommentIcon className="w-6 h-6" />
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ShareIcon className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              disabled={!user?.profileid}
              className={`p-2 rounded-full transition-all duration-200 ${
                isSaved 
                  ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/10' 
                    : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-50'
              } ${!user?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <BookmarkIcon className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* Likes Count */}
          {!postData.hideLikeCount && (
            <motion.p
              key={likeCount} // Re-animate on count change
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.2 }}
              className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
            </motion.p>
          )}

          {/* Post Content */}
          {postData.title && (
            <h3 className={`font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {postData.title}
            </h3>
          )}

          {postData.caption && (
            <p className={`mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <span className="font-semibold">{postData.username}</span>{' '}
              {postData.caption}
            </p>
          )}

          {/* Tags */}
          {postData.tags && postData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {postData.tags.map((tag, index) => (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className={`text-sm px-2 py-1 rounded-full cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/40' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          )}

          {/* Tagged People */}
          {postData.taggedPeople && postData.taggedPeople.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {postData.taggedPeople.map((person, index) => (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className={`text-sm px-2 py-1 rounded-full cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/40' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  @{person}
                </motion.span>
              ))}
            </div>
          )}

          {/* Comments Link */}
          {postData.allowComments && (
            <motion.button
              whileHover={{ x: 5 }}
              onClick={onImageClick}
              className={`text-sm mt-2 transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {postData.comments > 0 
                ? `View all ${postData.comments} comments` 
                : 'Be the first to comment'
              }
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />
    </>
  );
}

// Icon Components
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

function DotsIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  );
}

function ExpandIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  );
}
