"use client";

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '../../Helper/AuthProvider';
import { TOGGLE_POST_LIKE, TOGGLE_COMMENT_LIKE, CREATE_COMMENT, CREATE_COMMENT_REPLY, TOGGLE_SAVE_POST, GET_POST_STATS } from '../../../lib/graphql/simpleQueries';

export default function PostModal({ post, isOpen, onClose, theme: propTheme, showNavigation = false, onNext, onPrevious, hasNext = false, hasPrevious = false, currentIndex, totalCount }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const actualTheme = propTheme || theme;
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef(null);
  const videoRef = useRef(null);

  // GraphQL Mutations
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);
  const [createComment] = useMutation(CREATE_COMMENT);
  const [createCommentReply] = useMutation(CREATE_COMMENT_REPLY);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);

  // Get current post stats
  const { data: postStats, refetch: refetchPostStats } = useQuery(GET_POST_STATS, {
    variables: { postid: post?.postid },
    skip: !post?.postid || !isOpen,
    fetchPolicy: 'cache-and-network'
  });


  // Multiple images support
  const postImages = Array.isArray(post?.postUrl) ? post.postUrl : [post?.postUrl].filter(Boolean);
  const hasMultipleImages = postImages.length > 1;

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (showNavigation) {
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
  }, [isOpen, onClose, showNavigation, hasPrevious, hasNext, onPrevious, onNext]);

  // Video autoplay effect
  useEffect(() => {
    if (isOpen && post?.postType === 'VIDEO' && videoRef.current && post?.autoPlay) {
      videoRef.current.play().catch(e => {
        console.log('Autoplay prevented:', e);
      });
    }
  }, [isOpen, post?.postType, post?.autoPlay]);

  if (!isOpen || !post) return null;

  const currentProfileId = user?.profileid;
  const currentLikeCount = postStats?.getPostStats?.likeCount ?? post?.likeCount ?? 0;
  const currentCommentCount = postStats?.getPostStats?.commentCount ?? post?.commentCount ?? 0;
  const isLikedByUser = postStats?.getPostStats?.isLikedByCurrentUser ?? post?.isLikedByUser ?? false;
  const isSavedByUser = postStats?.getPostStats?.isSavedByCurrentUser ?? post?.isSavedByUser ?? false;

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const handleLike = async () => {
    if (!currentProfileId || !post?.postid) return;
    
    try {
      await togglePostLike({
        variables: {
          profileid: currentProfileId,
          postid: post.postid
        }
      });
      
      // Refetch post stats to update UI
      await refetchPostStats();
    } catch (error) {
      console.error('Error toggling post like:', error);
    }
  };

  const handleSave = async () => {
    if (!currentProfileId || !post?.postid) return;
    
    try {
      await toggleSavePost({
        variables: {
          profileid: currentProfileId,
          postid: post.postid
        }
      });
      
      // Refetch post stats to update UI
      await refetchPostStats();
    } catch (error) {
      console.error('Error toggling save post:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !currentProfileId || !post?.postid) return;
    
    console.log('💬 Creating comment:', {
      postId: post.postid,
      userId: currentProfileId,
      comment: commentText.trim()
    });
    
    try {
      const result = await createComment({
        variables: {
          postid: post.postid,
          profileid: currentProfileId,
          comment: commentText.trim()
        }
      });
      
      console.log('✅ Comment created:', result);
      
      setCommentText('');
      
      // Refetch post stats to update UI
      await refetchPostStats();
    } catch (error) {
      console.error('❌ Error creating comment:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentProfileId || !replyingTo) return;
    
    console.log('🔄 Creating reply:', {
      commentId: replyingTo.commentid,
      userId: currentProfileId,
      reply: replyText.trim()
    });
    
    try {
      const result = await createCommentReply({
        variables: {
          commentid: replyingTo.commentid,
          profileid: currentProfileId,
          comment: replyText.trim()
        }
      });
      
      console.log('✅ Reply created:', result);
      
      setReplyText('');
      setReplyingTo(null);
      
      // Refetch post stats to update UI
      await refetchPostStats();
    } catch (error) {
      console.error('❌ Error creating reply:', error);
    }
  };

  const handleCommentLike = async (commentid) => {
    if (!currentProfileId || !commentid) return;
    
    console.log('❤️ Toggling comment like:', {
      commentId: commentid,
      userId: currentProfileId
    });
    
    try {
      const result = await toggleCommentLike({
        variables: {
          profileid: currentProfileId,
          commentid: commentid
        }
      });
      
      console.log('✅ Comment like toggled:', result);
      
      // Refetch post stats to update UI
      await refetchPostStats();
    } catch (error) {
      console.error('❌ Error toggling comment like:', error);
    }
  };

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % postImages.length);
    }
  };

  const previousImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
    }
  };

  const handleShare = () => {
    // Create a proper post URL instead of using profile URL
    const postUrl = `${window.location.origin}/post/${post.postid || post.id || 'unknown'}`;
    
    console.log('🔗 Sharing post:', {
      postId: post.postid || post.id,
      postUrl: postUrl,
      title: post.title,
      description: post.caption || post.Description
    });
    
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Check out this post!',
        text: post.caption || post.Description,
        url: postUrl
      }).catch(() => {
        // Fallback to clipboard if share fails
        navigator.clipboard.writeText(postUrl);
        alert('Link copied to clipboard!');
      });
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Link copied to clipboard!');
      }).catch(() => {
        // Ultimate fallback - show the URL in a prompt
        prompt('Copy this post link:', postUrl);
      });
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${actualTheme === 'dark' ? '#374151 transparent' : '#d1d5db transparent'};
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${actualTheme === 'dark' ? '#374151' : '#d1d5db'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${actualTheme === 'dark' ? '#4b5563' : '#9ca3af'};
        }
      `}</style>
      <div 
        ref={modalRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn"
        onClick={handleBackdropClick}
      >
      <div 
        className={`relative w-full max-w-6xl max-h-[95vh] rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 animate-scaleIn ${
          actualTheme === 'dark' 
            ? 'bg-gray-900 border border-gray-700/50' 
            : 'bg-white border border-gray-200/50'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-sm ${
          actualTheme === 'dark' 
            ? 'border-gray-700/60 bg-gray-900/95' 
            : 'border-gray-200/60 bg-white/95'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={post.profile?.profilePic || post.avatar || '/default-profile.svg'}
                alt={post.profile?.username || post.username}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shadow-lg"
              />
              {post.profile?.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <p className={`font-semibold text-base leading-tight ${
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {post.profile?.username || post.username}
              </p>
              <p className={`text-sm mt-0.5 ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {post.location || new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: new Date(post.createdAt || Date.now()).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2.5 rounded-full transition-all duration-200 hover:scale-105 ${
              actualTheme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 shadow-lg' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 shadow-md'
            }`}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Navigation Arrows - Highly Visible */}
        {showNavigation && (
          <>
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className={`absolute left-6 top-1/2 transform -translate-y-1/2 z-50 p-4 rounded-full backdrop-blur-lg border-2 transition-all duration-200 hover:scale-125 active:scale-110 shadow-2xl ${
                  actualTheme === 'dark'
                    ? 'bg-gray-900/95 hover:bg-gray-800 text-white border-gray-600 hover:border-gray-500'
                    : 'bg-white/95 hover:bg-white text-gray-900 border-gray-300 hover:border-gray-400'
                }`}
                title="Previous post (Left arrow)"
              >
                <ChevronLeftIcon className="w-8 h-8 stroke-2" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={onNext}
                className={`absolute right-6 top-1/2 transform -translate-y-1/2 z-50 p-4 rounded-full backdrop-blur-lg border-2 transition-all duration-200 hover:scale-125 active:scale-110 shadow-2xl ${
                  actualTheme === 'dark'
                    ? 'bg-gray-900/95 hover:bg-gray-800 text-white border-gray-600 hover:border-gray-500'
                    : 'bg-white/95 hover:bg-white text-gray-900 border-gray-300 hover:border-gray-400'
                }`}
                title="Next post (Right arrow)"
              >
                <ChevronRightIcon className="w-8 h-8 stroke-2" />
              </button>
            )}
            
            {/* Navigation Indicator */}
            <div className={`absolute top-6 right-6 z-40 px-3 py-1.5 rounded-full backdrop-blur-md text-sm font-medium ${
              actualTheme === 'dark'
                ? 'bg-gray-900/80 text-white border border-gray-700'
                : 'bg-white/80 text-gray-900 border border-gray-300'
            }`}>
              {currentIndex} / {totalCount}
            </div>
          </>
        )}

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Media Section */}
          <div className="flex-1 flex items-center justify-center bg-black relative">
            {post.postType === 'VIDEO' ? (
              <video
                ref={videoRef}
                src={postImages[currentImageIndex] || post.postUrl || post.image}
                controls
                autoPlay={post?.autoPlay}
                loop={post?.autoPlay}
                muted={post?.autoPlay}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.error('❌ Modal Video load error:', {
                    url: postImages[currentImageIndex] || post.postUrl || post.image,
                    error: e.type,
                    timestamp: new Date().toISOString()
                  });
                }}
                onLoadStart={() => {
                  console.log('🎬 Modal video loading started:', postImages[currentImageIndex] || post.postUrl || post.image);
                }}
              />
            ) : (
              <img
                src={postImages[currentImageIndex] || post.postUrl || post.image}
                alt={post.title || 'Post content'}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.error('❌ Modal Image load error:', {
                    url: postImages[currentImageIndex] || post.postUrl || post.image,
                    error: e.type,
                    timestamp: new Date().toISOString()
                  });
                }}
                onLoad={() => {
                  console.log('✅ Modal image loaded successfully:', postImages[currentImageIndex] || post.postUrl || post.image);
                }}
              />
            )}
            
            {/* Navigation arrows for multiple images */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
                
                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {postImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar with Details */}
          <div className={`w-full lg:w-96 flex flex-col border-l backdrop-blur-sm ${
            actualTheme === 'dark' 
              ? 'border-gray-700/60 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-gray-900/95' 
              : 'border-gray-200/60 bg-gradient-to-b from-white/95 via-gray-50/90 to-white/95'
          }`}>
            
            {/* Post Details */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Title */}
              {post.title && (
                <h2 className={`text-xl font-bold mb-4 leading-tight ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {post.title}
                </h2>
              )}

              {/* Caption */}
              {(post.caption || post.Description) && (
                <div className={`mb-4 ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <span className="font-semibold">{post.profile?.username || post.username}</span>{' '}
                  {post.caption || post.Description}
                </div>
              )}

              {/* Location */}
              {post.location && (
                <div className={`flex items-center mb-3 text-sm ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <LocationIcon className="w-4 h-4 mr-2" />
                  {post.location}
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`text-sm px-3 py-1 rounded-full cursor-pointer hover:opacity-80 ${
                        actualTheme === 'dark' 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Tagged People */}
              {post.taggedPeople && post.taggedPeople.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.taggedPeople.map((person, index) => (
                    <span
                      key={index}
                      className={`text-sm px-3 py-1 rounded-full cursor-pointer hover:opacity-80 ${
                        actualTheme === 'dark' 
                          ? 'bg-purple-900/30 text-purple-300' 
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      @{person}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className={`font-semibold ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Comments ({currentCommentCount})
                </h3>
                
                {/* Real Comments */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(post?.comments || []).map((comment) => (
                    <div key={comment.commentid} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <img
                          src={comment.profile?.profilePic || '/default-profile.svg'}
                          alt={comment.profile?.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${
                            actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <span className="font-semibold">{comment.profile?.username}</span>{' '}
                            {comment.comment}
                          </p>
                          <div className="flex items-center space-x-3 mt-1">
                            <p className={`text-xs ${
                              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                            <button
                              onClick={() => handleCommentLike(comment.commentid)}
                              className={`text-xs transition-colors ${
                                comment.isLikedByUser 
                                  ? 'text-red-500' 
                                  : actualTheme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
                              }`}
                            >
                              {comment.isLikedByUser ? '♥' : '♡'} {comment.likeCount > 0 && comment.likeCount}
                            </button>
                            <button
                              onClick={() => setReplyingTo(comment)}
                              className={`text-xs transition-colors ${
                                actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Replies */}
                      {comment.replies?.length > 0 && (
                        <div className="ml-11 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.commentid} className="flex items-start space-x-3">
                              <img
                                src={reply.profile?.profilePic || '/default-profile.svg'}
                                alt={reply.profile?.username}
                                className="w-6 h-6 rounded-full"
                              />
                              <div className="flex-1">
                                <p className={`text-sm ${
                                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  <span className="font-semibold">{reply.profile?.username}</span>{' '}
                                  {reply.comment}
                                </p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <p className={`text-xs ${
                                    actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                  }`}>
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </p>
                                  <button
                                    onClick={() => handleCommentLike(reply.commentid)}
                                    className={`text-xs transition-colors ${
                                      reply.isLikedByUser 
                                        ? 'text-red-500' 
                                        : actualTheme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
                                    }`}
                                  >
                                    {reply.isLikedByUser ? '♥' : '♡'} {reply.likeCount > 0 && reply.likeCount}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )) || (
                    <p className={`text-sm text-center py-8 ${
                      actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={`border-t backdrop-blur-sm p-5 ${
              actualTheme === 'dark' 
                ? 'border-gray-700/60 bg-gray-900/80' 
                : 'border-gray-200/60 bg-white/80'
            }`}>
              {/* Action Buttons */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-5">
                  <button
                    onClick={handleLike}
                    disabled={!currentProfileId}
                    className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                      isLikedByUser 
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                        : actualTheme === 'dark' 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/10' 
                          : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                    } ${!currentProfileId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <HeartIcon className={`w-7 h-7 ${isLikedByUser ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                    actualTheme === 'dark' 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/30' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                    <CommentIcon className="w-7 h-7" />
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                      actualTheme === 'dark' 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800/30' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <ShareIcon className="w-7 h-7" />
                  </button>
                </div>
                
                <button
                  onClick={handleSave}
                  disabled={!currentProfileId}
                  className={`p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                    isSavedByUser 
                      ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                      : actualTheme === 'dark' 
                        ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/10' 
                        : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-50'
                  } ${!currentProfileId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <BookmarkIcon className={`w-7 h-7 ${isSavedByUser ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Likes Count */}
              <div className={`mb-4 pb-3 border-b ${
                actualTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
              }`}>
                <p className={`font-semibold text-sm ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <span className="text-lg">{currentLikeCount.toLocaleString()}</span> {currentLikeCount === 1 ? 'like' : 'likes'}
                </p>
              </div>

              {/* Reply Input (when replying to a comment) */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-opacity-20 bg-blue-500 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm ${
                      actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      Replying to <span className="font-semibold">{replyingTo.profile?.username}</span>
                    </p>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className={`text-sm ${
                        actualTheme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${replyingTo.profile?.username}...`}
                      className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleReply();
                        }
                      }}
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim() || !currentProfileId}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        replyText.trim() && currentProfileId
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : actualTheme === 'dark'
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Comment Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={currentProfileId ? "Add a comment..." : "Login to comment"}
                  disabled={!currentProfileId}
                  className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    actualTheme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${!currentProfileId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleComment();
                    }
                  }}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || !currentProfileId}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    commentText.trim() && currentProfileId
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : actualTheme === 'dark'
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
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

function LocationIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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
