"use client";

import { useState, useRef } from 'react';
import { useAuth } from '../../Helper/AuthProvider';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { BLOCK_USER, RESTRICT_USER } from '../../../lib/graphql/profileQueries';

// GraphQL mutations
const DELETE_POST = gql`
  mutation DeletePost($postid: String!) {
    DeletePost(postid: $postid) {
      postid
      title
      postUrl
      postType
    }
  }
`;

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
    ToggleSavePost(profileid: $profileid, postid: $postid) {
      postid
      title
      Description
      postType
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

export default function InstagramPost({ 
  post, 
  theme = "light",
  onCommentClick,
  className = "",
  onPostDeleted // Callback when post is deleted
}) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const [optimisticCount, setOptimisticCount] = useState(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef(null);

  // GraphQL hooks
  const [deletePost] = useMutation(DELETE_POST);
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);
  const [createComment] = useMutation(CREATE_COMMENT);
  const [blockUser] = useMutation(BLOCK_USER);
  const [restrictUser] = useMutation(RESTRICT_USER);
  
  const { data: postStats, refetch: refetchStats } = useQuery(GET_POST_STATS, {
    variables: { postid: post?.postid },
    skip: !post?.postid
  });

  // Initialize optimistic states
  const currentLikeCount = postStats?.getPostStats?.likeCount ?? post?.likeCount ?? 0;
  const currentIsLiked = postStats?.getPostStats?.isLikedByCurrentUser ?? post?.isLikedByUser ?? false;
  const currentIsSaved = postStats?.getPostStats?.isSavedByCurrentUser ?? post?.isSavedByUser ?? false;
  const commentCount = postStats?.getPostStats?.commentCount ?? post?.commentCount ?? 0;

  // Update optimistic states when real data changes
  useState(() => {
    setOptimisticLiked(currentIsLiked);
    setOptimisticCount(currentLikeCount);
  }, [currentIsLiked, currentLikeCount]);

  // Handle like
  const handleLike = async () => {
    if (!user?.profileid) return;

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
      
      await refetchStats();
    } catch (error) {
      console.error('Error liking post:', error);
      // Rollback on error
      setOptimisticLiked(!newIsLiked);
      setOptimisticCount(optimisticCount);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!user?.profileid) return;

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
      await refetchStats();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDeletePost = async () => {
    if (!user?.profileid || !post?.postid) {
      alert('Unable to delete post. Please try again.');
      return;
    }

    // Check if user owns the post
    if (user.profileid !== post.profile?.profileid) {
      alert('You can only delete your own posts.');
      return;
    }

    setIsDeleting(true);
    try {
      await deletePost({
        variables: {
          postid: post.postid
        }
      });
      
      // Call the callback to notify parent component
      if (onPostDeleted) {
        onPostDeleted(post.postid);
      }
      
      // Show success message
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      const errorMessage = error.graphQLErrors?.[0]?.message || error.message || 'Failed to delete post';
      alert(`Failed to delete post: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setShowOptionsMenu(false);
    }
  };

  // Handle block user from post
  const handleBlockFromPost = async () => {
    if (!user?.profileid || !post?.profile?.profileid) return;
    
    const confirmed = confirm(`Are you sure you want to block ${post.profile.username}?`);
    if (!confirmed) return;
    
    try {
      await blockUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: post.profile.profileid,
          reason: 'Blocked from post'
        }
      });
      alert(`${post.profile.username} has been blocked.`);
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user. Please try again.');
    }
  };

  // Handle restrict user from post
  const handleRestrictFromPost = async () => {
    if (!user?.profileid || !post?.profile?.profileid) return;
    
    const confirmed = confirm(`Are you sure you want to restrict ${post.profile.username}?`);
    if (!confirmed) return;
    
    try {
      await restrictUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: post.profile.profileid
        }
      });
      alert(`${post.profile.username} has been restricted.`);
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Error restricting user:', error);
      alert('Failed to restrict user. Please try again.');
    }
  };

  // Handle share
  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.postid}`;
    
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Check out this post!',
        text: post.Description,
        url: postUrl
      }).catch(() => {
        navigator.clipboard.writeText(postUrl);
        alert('Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Link copied to clipboard!');
      });
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
      
      // Set cursor after emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setNewComment(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className={`${className} ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.profile?.profilePic || '/default-profile.svg'}
            alt={post.profile?.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">{post.profile?.username}</p>
            {post.location && (
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {post.location}
              </p>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {/* Options Dropdown */}
          {showOptionsMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowOptionsMenu(false)}
              ></div>
              <div className={`absolute right-0 top-8 z-20 py-2 w-48 rounded-lg shadow-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                {/* Only show delete option if user owns the post */}
                {user?.profileid === post.profile?.profileid && (
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-red-50 hover:text-red-600 flex items-center ${
                      theme === 'dark' 
                        ? 'text-gray-300 hover:bg-red-900/20 hover:text-red-400' 
                        : 'text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Post
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    handleShare();
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share Post
                </button>
                
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    navigator.clipboard.writeText(`${window.location.origin}/post/${post.postid}`);
                    alert('Link copied to clipboard!');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </button>
                
                {/* Block/Restrict options - only show if not own post */}
                {user?.profileid !== post.profile?.profileid && (
                  <>
                    <div className={`border-t my-1 ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}></div>
                    
                    <button
                      onClick={handleRestrictFromPost}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 hover:text-orange-600 flex items-center ${
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-orange-900/20 hover:text-orange-400' 
                          : 'text-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      Restrict User
                    </button>
                    
                    <button
                      onClick={handleBlockFromPost}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-red-50 hover:text-red-600 flex items-center ${
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-red-900/20 hover:text-red-400' 
                          : 'text-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                      </svg>
                      Block User
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Media */}
      <div className="relative">
        {post.postType === 'VIDEO' ? (
          <video
            src={post.postUrl}
            className="w-full max-h-96 object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={(e) => {
              console.error('Video load error for URL:', post.postUrl);
              e.target.style.display = 'none';
              // Show fallback image or placeholder
              const fallback = e.target.nextElementSibling;
              if (fallback) fallback.style.display = 'block';
            }}
            onLoadStart={() => {
              console.log('Video loading started:', post.postUrl);
            }}
            onLoadedData={() => {
              console.log('Video loaded successfully:', post.postUrl);
            }}
          />
        ) : (
          <img
            src={post.postUrl}
            alt={post.title}
            className="w-full max-h-96 object-cover"
            onError={(e) => {
              console.error('Image load error for URL:', post.postUrl);
              e.target.src = '/placeholder-image.png'; // Fallback image
            }}
          />
        )}
        
        {/* Video fallback placeholder */}
        {post.postType === 'VIDEO' && (
          <div 
            className="w-full max-h-96 bg-gray-200 flex items-center justify-center" 
            style={{ display: 'none', minHeight: '200px' }}
          >
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Video unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`transition-transform ${likeAnimation ? 'scale-125' : 'scale-100'}`}
          >
            <svg 
              className={`w-6 h-6 ${optimisticLiked ? 'text-red-500 fill-current' : theme === 'dark' ? 'text-white' : 'text-black'}`}
              fill={optimisticLiked ? 'currentColor' : 'none'}
              stroke="currentColor" 
              strokeWidth={optimisticLiked ? 0 : 2}
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          
          {/* Comment Button */}
          <button onClick={onCommentClick} className={theme === 'dark' ? 'text-white' : 'text-black'}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          
          {/* Share Button */}
          <button onClick={handleShare} className={theme === 'dark' ? 'text-white' : 'text-black'}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
        
        {/* Save Button */}
        <button onClick={handleSave}>
          <svg 
            className={`w-6 h-6 ${currentIsSaved ? 'fill-current' : 'fill-none'} ${theme === 'dark' ? 'text-white' : 'text-black'}`}
            stroke="currentColor" 
            strokeWidth={2} 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Like Count */}
      {optimisticCount > 0 && (
        <div className="px-4 pb-2">
          <p className="font-semibold text-sm">
            {optimisticCount.toLocaleString()} {optimisticCount === 1 ? 'like' : 'likes'}
          </p>
        </div>
      )}

      {/* Caption */}
      {(post.title || post.Description) && (
        <div className="px-4 pb-2">
          <p className="text-sm">
            <span className="font-semibold mr-2">{post.profile?.username}</span>
            {post.title && <span className="font-medium">{post.title}</span>}
            {post.Description && <span>{post.title ? ' - ' : ''}{post.Description}</span>}
          </p>
        </div>
      )}

      {/* View Comments */}
      {commentCount > 0 && (
        <button
          onClick={onCommentClick}
          className={`px-4 pb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
        >
          View all {commentCount} comments
        </button>
      )}

      {/* Add Comment */}
      <div className={`border-t px-4 py-3 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <form onSubmit={handleSubmitComment} className="flex items-center space-x-3">
          <img
            src={user?.profilePic || '/default-profile.svg'}
            alt="Your avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className={`w-full bg-transparent text-sm outline-none ${
                theme === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'
              }`}
              disabled={isSubmitting}
            />
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className={`absolute bottom-8 right-0 p-2 rounded-lg shadow-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              } grid grid-cols-8 gap-1 z-10`}>
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`text-lg ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            😊
          </button>
          
          {/* Post Button */}
          {newComment.trim() && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          )}
        </form>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-sm w-full mx-4 ${
            theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Delete Post?</h3>
            <p className={`text-sm mb-6 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
