"use client";

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { 
  GET_POST_COMMENTS, 
  CREATE_COMMENT, 
  CREATE_COMMENT_REPLY, 
  TOGGLE_COMMENT_LIKE 
} from '../../../lib/graphql/queries';
import { triggerCommentsRefetch } from '../../../lib/apollo/refetchHelper';

export default function SimpleCommentSection({ 
  postId, 
  className = "",
  theme: propTheme,
  onCommentUpdate 
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const actualTheme = propTheme || theme;
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments
  const { data, loading, error, refetch } = useQuery(GET_POST_COMMENTS, {
    variables: { postid: postId },
    skip: !postId,
    errorPolicy: 'all'
  });

  const comments = data?.getCommentsByPost || [];

  // Mutations
  const [createComment] = useMutation(CREATE_COMMENT);
  const [createCommentReply] = useMutation(CREATE_COMMENT_REPLY);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);

  // Handle new comment
  const handleCreateComment = async () => {
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
      triggerCommentsRefetch(postId);
      onCommentUpdate && onCommentUpdate();
      
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply
  const handleCreateReply = async () => {
    if (!replyText.trim() || !user?.profileid || !replyingTo || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createCommentReply({
        variables: {
          commentid: replyingTo.commentid,
          profileid: user.profileid,
          comment: replyText.trim()
        }
      });

      setReplyText('');
      setReplyingTo(null);
      await refetch();
      triggerCommentsRefetch(postId);
      onCommentUpdate && onCommentUpdate();
      
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment like
  const handleCommentLike = async (commentId) => {
    if (!user?.profileid) return;

    try {
      await toggleCommentLike({
        variables: {
          profileid: user.profileid,
          commentid: commentId
        }
      });
      
      await refetch();
      triggerCommentsRefetch(postId);
      onCommentUpdate && onCommentUpdate();
      
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  if (loading) return <div>Loading comments...</div>;
  if (error) return <div>Error loading comments</div>;

  return (
    <div className={`${className}`}>
      {/* Comments list - Instagram style */}
      <div className="space-y-0 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.commentid}
              comment={comment}
              onLike={handleCommentLike}
              onReply={(comment) => {
                setReplyingTo(comment);
                setReplyText(`@${comment.profile?.username} `);
              }}
              currentUser={user}
              theme={actualTheme}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${
              actualTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <svg className={`w-8 h-8 ${
                actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className={`text-sm font-medium ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No comments yet
            </p>
            <p className={`text-xs mt-1 ${
              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Start the conversation
            </p>
          </div>
        )}
      </div>

      {/* Reply input - Instagram style */}
      {replyingTo && (
        <div className={`px-4 py-3 border-t ${
          actualTheme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center mb-2">
            <p className={`text-sm flex-1 ${
              actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Replying to <span className="font-semibold text-blue-500">{replyingTo.profile?.username}</span>
            </p>
            <button
              onClick={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
              className={`text-sm px-2 py-1 rounded ${
                actualTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              ×
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <img
              src={user?.profilePic || '/default-profile.svg'}
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 flex items-center">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${replyingTo.profile?.username}...`}
                className={`flex-1 border-none outline-none bg-transparent text-sm placeholder-gray-400 ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateReply();
                  }
                }}
              />
              {replyText.trim() && (
                <button
                  onClick={handleCreateReply}
                  disabled={isSubmitting}
                  className="text-blue-500 hover:text-blue-600 font-semibold text-sm px-2 py-1 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New comment input - Instagram style */}
      <div className={`flex items-center space-x-3 px-4 py-3 border-t ${
        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <img
          src={user?.profilePic || '/default-profile.svg'}
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 flex items-center">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user?.profileid ? "Add a comment..." : "Login to comment"}
            disabled={!user?.profileid || isSubmitting}
            className={`flex-1 border-none outline-none bg-transparent text-sm placeholder-gray-400 ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            } ${!user?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateComment();
              }
            }}
          />
          {newComment.trim() && user?.profileid && (
            <button
              onClick={handleCreateComment}
              disabled={isSubmitting}
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm px-2 py-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Instagram-style Comment Item Component
function CommentItem({ comment, onLike, onReply, currentUser, theme }) {
  const [isLiked, setIsLiked] = useState(comment.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);

  const timeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return new Date(date).toLocaleDateString();
  };

  const handleLike = async () => {
    if (!currentUser?.profileid) return;
    
    // Optimistic update
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    setIsLiked(newIsLiked);
    setLikeCount(newCount);
    
    try {
      await onLike(comment.commentid);
    } catch (error) {
      // Rollback on error
      setIsLiked(!newIsLiked);
      setLikeCount(likeCount);
    }
  };

  return (
    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start space-x-3">
        <img
          src={comment.profile?.profilePic || '/default-profile.svg'}
          alt={comment.profile?.username || 'User'}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          {/* Comment content - Instagram style */}
          <div className="flex items-start flex-wrap">
            <span className={`font-semibold text-sm mr-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {comment.profile?.username || 'Unknown User'}
            </span>
            <span className={`text-sm flex-1 break-words ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {comment.comment}
            </span>
          </div>
          
          {/* Comment actions */}
          <div className="flex items-center space-x-4 mt-1">
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {timeAgo(comment.createdAt)}
            </span>
            
            {likeCount > 0 && (
              <span className={`text-xs font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </span>
            )}
            
            <button
              onClick={() => onReply(comment)}
              disabled={!currentUser?.profileid}
              className={`text-xs font-medium transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-500 hover:text-gray-700'
              } ${!currentUser?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Reply
            </button>
          </div>
        </div>
        
        {/* Like button - Instagram style */}
        <button
          onClick={handleLike}
          disabled={!currentUser?.profileid}
          className={`p-1 transition-colors ${
            !currentUser?.profileid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg 
            className={`w-3 h-3 transition-colors ${
              isLiked 
                ? 'text-red-500 fill-current' 
                : theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
            }`} 
            fill={isLiked ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-11 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.commentid} className="flex items-start space-x-3 px-4">
              <img
                src={reply.profile?.profilePic || '/default-profile.svg'}
                alt={reply.profile?.username}
                className="w-6 h-6 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start flex-wrap">
                  <span className={`font-semibold text-sm mr-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {reply.profile?.username}
                  </span>
                  <span className={`text-sm flex-1 break-words ${
                    theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {reply.comment}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {timeAgo(reply.createdAt)}
                  </span>
                  {reply.likeCount > 0 && (
                    <span className={`text-xs font-medium ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {reply.likeCount} {reply.likeCount === 1 ? 'like' : 'likes'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onLike(reply.commentid)}
                disabled={!currentUser?.profileid}
                className={`p-1 transition-colors ${!currentUser?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg 
                  className={`w-3 h-3 transition-colors ${
                    reply.isLikedByUser 
                      ? 'text-red-500 fill-current' 
                      : theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                  }`} 
                  fill={reply.isLikedByUser ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
