"use client";

import { useState, useRef } from 'react';
import { useAuth } from '../../Helper/AuthProvider';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL mutations
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
  className = "" 
}) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const [optimisticCount, setOptimisticCount] = useState(0);
  const inputRef = useRef(null);

  // GraphQL hooks
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);
  const [createComment] = useMutation(CREATE_COMMENT);
  
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
        
        <button className={`p-1 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Post Media */}
      <div className="relative">
        {post.postType === 'VIDEO' ? (
          <video
            src={post.postUrl}
            className="w-full max-h-96 object-cover"
            controls
            muted
          />
        ) : (
          <img
            src={post.postUrl}
            alt={post.title}
            className="w-full max-h-96 object-cover"
          />
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
    </div>
  );
}
