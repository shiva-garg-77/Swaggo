"use client";

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useMutation, useQuery } from '@apollo/client';
import { useAuth } from '../../Helper/AuthProvider';
import { gql } from '@apollo/client';

// GraphQL mutations and queries
const TOGGLE_POST_LIKE = gql`
  mutation TogglePostLike($profileid: String!, $postid: String!) {
    TogglePostLike(profileid: $profileid, postid: $postid) {
      profileid
      postid
      createdAt
    }
  }
`;

const TOGGLE_SAVE_POST = gql`
  mutation ToggleSavePost($profileid: String!, $postid: String!) {
    ToggleSavePost(profileid: $profileid, postid: $postid)
  }
`;

const TOGGLE_COMMENT_LIKE = gql`
  mutation ToggleCommentLike($profileid: String!, $commentid: String!) {
    ToggleCommentLike(profileid: $profileid, commentid: $commentid) {
      profileid
      commentid
      createdAt
    }
  }
`;

const GET_POST_COMMENTS = gql`
  query GetPostComments($postid: String!) {
    getCommentsByPost(postid: $postid) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        profileid
        username
        profilePic
        isVerified
      }
      replies {
        commentid
        comment
        likeCount
        isLikedByUser
        createdAt
        profile {
          profileid
          username
          profilePic
          isVerified
        }
      }
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($postid: String!, $profileid: String!, $comment: String!) {
    CreateComment(postid: $postid, profileid: $profileid, comment: $comment) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        username
        profilePic
        isVerified
      }
    }
  }
`;

const GET_POST_STATS = gql`
  query GetPostStats($postid: String!) {
    getPostStats(postid: $postid) {
      postid
      likeCount
      commentCount
      isLikedByCurrentUser
      isSavedByCurrentUser
    }
  }
`;

export default function InstagramPostModal({ 
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
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const [optimisticCount, setOptimisticCount] = useState(0);
  const [optimisticSaved, setOptimisticSaved] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // GraphQL hooks
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);
  const [createComment] = useMutation(CREATE_COMMENT);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);
  
  const { data: postStats, refetch: refetchStats } = useQuery(GET_POST_STATS, {
    variables: { postid: post?.postid },
    skip: !post?.postid,
    fetchPolicy: 'cache-and-network'
  });

  const { data: commentsData, refetch: refetchComments } = useQuery(GET_POST_COMMENTS, {
    variables: { postid: post?.postid },
    skip: !post?.postid,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      console.log('💬 Comments data loaded:', {
        postId: post?.postid,
        commentCount: data?.getCommentsByPost?.length || 0,
        comments: data?.getCommentsByPost || []
      });
    },
    onError: (error) => {
      console.error('❌ Error loading comments:', error);
    }
  });

  // Initialize optimistic states
  const currentLikeCount = postStats?.getPostStats?.likeCount ?? post?.likeCount ?? 0;
  const currentIsLiked = postStats?.getPostStats?.isLikedByCurrentUser ?? post?.isLikedByUser ?? false;
  const currentIsSaved = postStats?.getPostStats?.isSavedByCurrentUser ?? post?.isSavedByUser ?? false;
  const commentCount = postStats?.getPostStats?.commentCount ?? post?.commentCount ?? 0;

  useEffect(() => {
    setOptimisticLiked(currentIsLiked);
    setOptimisticCount(currentLikeCount);
    setOptimisticSaved(currentIsSaved);
  }, [currentIsLiked, currentLikeCount, currentIsSaved]);

  // Handle escape key and modal backdrop
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

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
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showNavigation, hasPrevious, hasNext, onPrevious, onNext]);
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Handle like with optimistic update
  const handleLike = async () => {
    if (!user?.profileid) {
      alert('Please log in to like posts');
      return;
    }

    // Trigger animation
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 600);

    // Optimistic update
    const newIsLiked = !optimisticLiked;
    const newCount = newIsLiked ? optimisticCount + 1 : Math.max(0, optimisticCount - 1);
    
    setOptimisticLiked(newIsLiked);
    setOptimisticCount(newCount);

    try {
      await togglePostLike({
        variables: {
          profileid: user.profileid,
          postid: post.postid
        }
      });
      
      // Refetch stats to get real data
      await refetchStats();
    } catch (error) {
      console.error('Error liking post:', error);
      // Rollback on error
      setOptimisticLiked(!newIsLiked);
      setOptimisticCount(optimisticCount);
      alert('Failed to like post. Please try again.');
    }
  };

  // Handle save with optimistic update
  const handleSave = async () => {
    if (!user?.profileid) {
      alert('Please log in to save posts');
      return;
    }

    // Optimistic update
    setOptimisticSaved(!optimisticSaved);

    try {
      await toggleSavePost({
        variables: {
          profileid: user.profileid,
          postid: post.postid
        }
      });
      
      await refetchStats();
    } catch (error) {
      console.error('Error saving post:', error);
      // Rollback on error
      setOptimisticSaved(!optimisticSaved);
      alert('Failed to save post. Please try again.');
    }
  };

  // Handle comment like - simplified version
  const handleCommentLike = async (commentId) => {
    console.log('🤍 Comment like handler called with:', {
      commentId,
      user: user,
      hasProfileId: !!user?.profileid,
      postId: post?.postid
    });
    
    if (!user?.profileid) {
      console.error('❌ No user profile ID available');
      alert('Please log in to like comments');
      return;
    }

    if (!commentId) {
      console.error('❌ No comment ID provided');
      alert('Invalid comment');
      return;
    }

    console.log('🤍 Attempting to like comment:', {
      commentId,
      userId: user.profileid,
      postId: post?.postid,
      mutationReady: !!toggleCommentLike
    });

    try {
      const result = await toggleCommentLike({
        variables: {
          profileid: user.profileid,
          commentid: commentId
        }
      });
      
      console.log('✅ Comment like mutation result:', result);
      
      // Always refetch comments to get updated data
      await refetchComments();
      console.log('✅ Comments refetched after like');
      
    } catch (error) {
      console.error('❌ Error liking comment:', {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
      alert(`Failed to like comment: ${error.message}`);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.profileid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment({
        variables: {
          postid: post.postid,
          profileid: user.profileid,
          comment: newComment.trim()
        }
      });

      setNewComment('');
      await refetchComments();
      await refetchStats();
      
      // Scroll to bottom to show new comment
      setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Common emoji list
  const commonEmojis = ['😀', '😂', '❤️', '😍', '👍', '🔥', '💯', '🙌', '😊', '👏', '😢', '😮', '😡', '🤔', '🎉', '💪'];

  const addEmoji = (emoji) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = newComment.substring(0, start) + emoji + newComment.substring(end);
      setNewComment(newValue);
      
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setNewComment(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  if (!isOpen || !post) return null;

  const comments = commentsData?.getCommentsByPost || [];

  return (
    <div 
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)' 
      }}
    >
      {/* Modal Container - Instagram style */}
      <div 
        className={`relative w-full max-w-5xl h-full max-h-[90vh] flex overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
        style={{ 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '12px'
        }}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Navigation Buttons */}
        {showNavigation && (
          <>
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={onNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}
          </>
        )}

        {/* Image Section - Instagram style */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          {post.postType === 'VIDEO' ? (
            <video
              src={post.postUrl}
              className="w-full h-full object-contain max-w-none"
              controls
              autoPlay
              muted
              playsInline
              style={{ maxHeight: '90vh' }}
            />
          ) : (
            <img
              src={post.postUrl}
              alt={post.title}
              className="w-full h-full object-contain max-w-none"
              style={{ maxHeight: '90vh' }}
              onLoad={(e) => {
                // Adjust modal size based on image aspect ratio
                const img = e.target;
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                if (aspectRatio < 1) {
                  // Portrait image - adjust container
                  e.target.className = "h-full object-contain";
                } else {
                  // Landscape or square - keep current styling
                  e.target.className = "w-full h-full object-contain max-w-none";
                }
              }}
            />
          )}
          
          {/* Instagram-style gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content Section - Instagram style */}
        <div className={`w-[420px] min-w-[420px] flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-l border-gray-700' : 'bg-white border-l border-gray-100'}`} 
             style={{ maxWidth: '420px' }}>
          
          {/* Header */}
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <img
                src={post.profile?.profilePic || '/default-profile.svg'}
                alt={post.profile?.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {post.profile?.username}
                  </p>
                  {post.profile?.isVerified && (
                    <VerifiedIcon className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                {post.location && (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {post.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div 
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide"
            style={{ 
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none'  /* Internet Explorer and Edge */
            }}
          >
            {/* Caption */}
            {(post.title || post.Description) && (
              <div className="flex space-x-3">
                <img
                  src={post.profile?.profilePic || '/default-profile.svg'}
                  alt={post.profile?.username}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    <span className="font-semibold mr-2">{post.profile?.username}</span>
                    {post.title && <span className="font-medium">{post.title}</span>}
                    {post.Description && <span>{post.title ? ' - ' : ''}{post.Description}</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Comments */}
            {comments.map((comment, index) => {
              console.log(`💬 Rendering comment ${index + 1}:`, {
                id: comment.commentid,
                text: comment.comment,
                username: comment.profile?.username,
                isLikedByUser: comment.isLikedByUser,
                likeCount: comment.likeCount
              });
              
              return (
                <div key={comment.commentid} className="flex space-x-3 group hover:bg-opacity-5 hover:bg-gray-500 -mx-2 px-2 py-1 rounded-md transition-colors duration-150">
                  <img
                    src={comment.profile?.profilePic || '/default-profile.svg'}
                    alt={comment.profile?.username}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        <span className="font-semibold mr-2 hover:opacity-70 cursor-pointer transition-opacity">
                          {comment.profile?.username}
                          {comment.profile?.isVerified && (
                            <VerifiedIcon className="w-3 h-3 text-blue-500 inline ml-1" />
                          )}
                        </span>
                        <span className="break-words">{comment.comment}</span>
                      </p>
                      <button 
                        onClick={() => {
                          console.log('🚀 Comment heart clicked:', comment.commentid);
                          handleCommentLike(comment.commentid);
                        }}
                        className={`ml-2 opacity-100 hover:scale-110 transition-all duration-150 ${
                          comment.isLikedByUser 
                            ? 'text-red-500' 
                            : theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                        }`}
                        title={comment.isLikedByUser ? 'Unlike comment' : 'Like comment'}
                      >
                        <HeartIcon className={`w-4 h-4 ${comment.isLikedByUser ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`text-xs cursor-pointer hover:opacity-70 transition-opacity ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    {comment.likeCount > 0 && (
                      <span className={`text-xs font-medium cursor-pointer hover:opacity-70 transition-opacity ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {comment.likeCount} {comment.likeCount === 1 ? 'like' : 'likes'}
                      </span>
                    )}
                    <button className={`text-xs font-medium transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                      Reply
                    </button>
                  </div>
                  
                  {/* Show replies if any */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-0 space-y-2">
                      <button className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                        — View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`transition-all duration-200 hover:scale-110 ${likeAnimation ? 'scale-125' : 'scale-100'}`}
                >
                  <HeartIcon 
                    className={`w-6 h-6 ${optimisticLiked ? 'text-red-500 fill-current' : theme === 'dark' ? 'text-white' : 'text-black'}`}
                  />
                </button>
                <button 
                  onClick={() => inputRef.current?.focus()}
                  className={`transition-all duration-200 hover:scale-110 ${theme === 'dark' ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`}
                >
                  <CommentIcon className="w-6 h-6" />
                </button>
              </div>
              <button 
                onClick={handleSave}
                className="transition-all duration-200 hover:scale-110"
              >
                <BookmarkIcon 
                  className={`w-6 h-6 ${optimisticSaved ? 'fill-current' : 'fill-none'} ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                />
              </button>
            </div>

            {/* Like Count */}
            {optimisticCount > 0 && (
              <div className="px-4 pb-2">
                <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {optimisticCount.toLocaleString()} {optimisticCount === 1 ? 'like' : 'likes'}
                </p>
              </div>
            )}

            {/* Add Comment */}
            <div className={`border-t px-4 py-3 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <form onSubmit={handleSubmitComment} className="flex items-center space-x-3 relative">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className={`w-full bg-transparent text-sm outline-none py-2 px-3 rounded-full border transition-colors ${
                      theme === 'dark' 
                        ? 'placeholder-gray-500 text-white border-gray-600 focus:border-gray-400' 
                        : 'placeholder-gray-400 text-black border-gray-200 focus:border-gray-400'
                    }`}
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                  
                  {/* Character Count */}
                  {newComment.length > 400 && (
                    <span className={`absolute -top-6 right-0 text-xs ${
                      newComment.length >= 500 ? 'text-red-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {newComment.length}/500
                    </span>
                  )}
                  
                  {/* Enhanced Emoji Picker */}
                  {showEmojiPicker && (
                    <div 
                      ref={emojiPickerRef}
                      className={`absolute bottom-full left-0 mb-2 p-3 rounded-xl shadow-xl border backdrop-blur-sm ${
                        theme === 'dark' ? 'bg-gray-800/95 border-gray-600' : 'bg-white/95 border-gray-200'
                      } grid grid-cols-8 gap-2 z-20 max-w-sm`}
                    >
                      <div className={`col-span-8 text-xs font-medium pb-2 border-b ${
                        theme === 'dark' ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'
                      }`}>
                        Frequently used
                      </div>
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className={`text-lg p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                          title={`Add ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`text-xl p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    showEmojiPicker 
                      ? 'bg-blue-500 text-white' 
                      : theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Add emoji"
                >
                  😊
                </button>
                
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={isSubmitting || newComment.length > 500}
                    className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-full transition-all"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Post'
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(parseInt(timestamp));
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

// Icon Components
function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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


function BookmarkIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function VerifiedIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.236 4.53L7.73 9.77a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l3.5-4.9z" clipRule="evenodd" />
    </svg>
  );
}
