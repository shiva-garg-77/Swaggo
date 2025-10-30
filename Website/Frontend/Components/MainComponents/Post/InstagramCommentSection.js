"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { gql } from '@apollo/client';
import { getRelativeTime } from '../../../utils/timeUtils';
import AutoExpandTextarea from '../../UI/AutoExpandTextarea';

// Define queries directly to avoid import issues
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
      }
    }
  }
`;

const CREATE_COMMENT_REPLY = gql`
  mutation CreateCommentReply($commentid: String!, $profileid: String!, $comment: String!) {
    CreateCommentReply(commentid: $commentid, profileid: $profileid, comment: $comment) {
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

const TOGGLE_COMMENT_LIKE = gql`
  mutation ToggleCommentLike($profileid: String!, $commentid: String!) {
    ToggleCommentLike(profileid: $profileid, commentid: $commentid) {
      profileid
      commentid
      createdAt
    }
  }
`;

export default function InstagramCommentSection({ 
  postId, 
  className = "",
  theme = "light",
  onCommentUpdate 
}) {
  const { user } = useSecureAuth();
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likeAnimations, setLikeAnimations] = useState({});
  const [optimisticLikes, setOptimisticLikes] = useState({}); // Track like states
  const inputRef = useRef(null);
  
  // Comment sorting with persistence (Issue 5.21)
  const [sortBy, setSortBy] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('commentSortPreference') || 'recent';
    }
    return 'recent';
  });

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    if (typeof window !== 'undefined') {
      localStorage.setItem('commentSortPreference', newSort);
    }
  };

  // Fetch comments
  const { data, loading, error, refetch } = useQuery(GET_POST_COMMENTS, {
    variables: { postid: postId },
    skip: !postId,
    fetchPolicy: 'cache-and-network'
  });

  let comments = data?.getCommentsByPost || [];
  
  // Sort comments based on preference
  comments = [...comments].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.likeCount || 0) - (a.likeCount || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else { // recent (default)
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Mutations
  const [createComment] = useMutation(CREATE_COMMENT);
  const [createCommentReply] = useMutation(CREATE_COMMENT_REPLY);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);

  // Time formatter - Use relative time utility (Issue 5.7)
  const formatTime = (timestamp) => {
    return getRelativeTime(timestamp);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)}w`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle new comment
  const handleCreateComment = async (e) => {
    e?.preventDefault();
    if (!newComment.trim() || !user?.profileid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment({
        variables: {
          postid: postId,
          profileid: user.profileid,
          comment: newComment.trim()
        }
      });
      
      setNewComment('');
      await refetch();
      onCommentUpdate?.();
      
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply
  const handleCreateReply = async (parentComment) => {
    if (!replyText.trim() || !user?.profileid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createCommentReply({
        variables: {
          commentid: parentComment.commentid,
          profileid: user.profileid,
          comment: replyText.trim()
        }
      });

      setReplyText('');
      setReplyingTo(null);
      await refetch();
      onCommentUpdate?.();
      
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment like with proper state management
  const handleCommentLike = async (commentId, currentIsLiked) => {
    if (!user?.profileid) return;

    // Optimistic update
    const newIsLiked = !currentIsLiked;
    setOptimisticLikes(prev => ({ ...prev, [commentId]: newIsLiked }));

    // Trigger animation
    setLikeAnimations(prev => ({ ...prev, [commentId]: true }));
    setTimeout(() => {
      setLikeAnimations(prev => ({ ...prev, [commentId]: false }));
    }, 400);

    try {
      await toggleCommentLike({
        variables: {
          profileid: user.profileid,
          commentid: commentId
        }
      });
      
      await refetch();
      onCommentUpdate?.();
      
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Rollback on error
      setOptimisticLikes(prev => ({ ...prev, [commentId]: currentIsLiked }));
    }
  };

  const CommentItem = ({ comment, isReply = false }) => {
    const actualIsLiked = optimisticLikes[comment.commentid] !== undefined 
      ? optimisticLikes[comment.commentid] 
      : (comment.isLikedByUser || false);
    const [showReplies, setShowReplies] = useState(false);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div className={`${isReply ? 'ml-12 pl-4 border-l-2' : ''} mb-4 ${
        isReply ? (theme === 'dark' ? 'border-gray-700' : 'border-gray-200') : ''
      }`}>
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={comment.profile?.profilePic || '/default-profile.svg'}
              alt={comment.profile?.username}
              className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full object-cover`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-2">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  <span className="font-semibold mr-2 hover:underline cursor-pointer">
                    {comment.profile?.username}
                    {comment.profile?.isVerified && (
                      <span className="ml-1 inline-block w-3 h-3">
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                    {comment.comment}
                  </span>
                </p>

                {/* Actions */}
                <div className="flex items-center mt-1 space-x-4">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatTime(comment.createdAt)}
                  </span>
                  
                  {comment.likeCount > 0 && (
                    <button className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {comment.likeCount} {comment.likeCount === 1 ? 'like' : 'likes'}
                    </button>
                  )}
                  
                  {!isReply && (
                    <button
                      onClick={() => {
                        setReplyingTo(comment);
                        setReplyText(`@${comment.profile?.username} `);
                        inputRef.current?.focus();
                      }}
                      className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Reply
                    </button>
                  )}
                </div>

                {/* View replies button */}
                {!isReply && hasReplies && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="mt-2 flex items-center space-x-2"
                  >
                    <div className={`w-6 h-px ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  </button>
                )}
              </div>

              {/* Like button - Professional Instagram Style */}
              <button
                onClick={() => handleCommentLike(comment.commentid, actualIsLiked)}
                className={`p-2 -mr-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full ${likeAnimations[comment.commentid] ? 'scale-110' : 'scale-100'}`}
              >
                <svg 
                  className={`w-3.5 h-3.5 transition-colors ${
                    actualIsLiked 
                      ? 'text-red-500 fill-current' 
                      : theme === 'dark' 
                        ? 'text-gray-400 hover:text-gray-300' 
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                  fill={actualIsLiked ? 'currentColor' : 'none'} 
                  stroke={actualIsLiked ? 'none' : 'currentColor'}
                  strokeWidth={actualIsLiked ? 0 : 1.5}
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Render replies */}
        {showReplies && hasReplies && (
          <div className="mt-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.commentid} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-sm">Unable to load comments</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Sort dropdown (Issue 5.21) */}
      {comments.length > 1 && (
        <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className={`text-xs px-2 py-1 rounded ${
              theme === 'dark' 
                ? 'bg-gray-800 text-gray-300 border-gray-600' 
                : 'bg-gray-100 text-gray-700 border-gray-300'
            } border focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      )}
      
      {/* Comments list - Scrollable content */}
      <div className={`flex-1 px-4 py-2 ${comments.length > 2 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600' : 'min-h-[200px]'}`}>
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem key={comment.commentid} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <svg className={`w-6 h-6 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className={`text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No comments yet
            </p>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Be the first to comment
            </p>
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className={`px-4 py-2 border-t border-b ${
          theme === 'dark' 
            ? 'border-gray-700 bg-gray-800/50' 
            : 'border-gray-200 bg-blue-50/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className={`text-sm ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Replying to <span className="font-semibold">@{replyingTo.profile?.username}</span>
              </span>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comment input - Fixed at bottom with professional styling */}
      <div className={`border-t px-4 py-3 ${
        theme === 'dark' 
          ? 'border-gray-700 bg-gray-900/95 backdrop-blur-sm' 
          : 'border-gray-200 bg-white/95 backdrop-blur-sm'
      }`}>
        <form onSubmit={replyingTo ? (e) => { e.preventDefault(); handleCreateReply(replyingTo); } : handleCreateComment} className="flex items-center space-x-3">
          <img
            src={user?.profilePic || '/default-profile.svg'}
            alt="Your avatar"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
          />
          <div className="flex-1 relative">
            {/* Auto-expanding textarea (Issue 5.5) */}
            <AutoExpandTextarea
              ref={inputRef}
              value={replyingTo ? replyText : newComment}
              onChange={(e) => replyingTo ? setReplyText(e.target.value) : setNewComment(e.target.value)}
              onSubmit={handleCreateComment}
              placeholder={replyingTo ? `Reply to @${replyingTo.profile?.username}...` : "Add a comment..."}
              className={`w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700' 
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:shadow-sm'
              }`}
              minHeight={40}
              maxHeight={120}
              disabled={isSubmitting}
            />
            {(replyingTo ? replyText.trim() : newComment.trim()) && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  'Post'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
