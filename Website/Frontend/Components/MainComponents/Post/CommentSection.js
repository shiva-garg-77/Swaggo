"use client";

import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { 
  CREATE_COMMENT, 
  CREATE_COMMENT_REPLY, 
  TOGGLE_COMMENT_LIKE 
} from '../../../lib/graphql/simpleQueries';
import { motion, AnimatePresence } from 'framer-motion';

// Individual Comment Component
function CommentItem({ 
  comment, 
  onReply, 
  onLike,
  currentUser,
  theme,
  level = 0,
  isReply = false 
}) {
  const [showReplies, setShowReplies] = useState(true);
  const [isLiked, setIsLiked] = useState(comment.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);

  const handleLike = useCallback(async () => {
    if (!currentUser?.profileid) return;
    
    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newIsLiked);
    setLikeCount(Math.max(0, newLikeCount));

    try {
      await onLike(comment.commentid);
    } catch (error) {
      // Rollback on error
      setIsLiked(!newIsLiked);
      setLikeCount(likeCount);
      console.error('Error liking comment:', error);
    }
  }, [comment.commentid, currentUser, isLiked, likeCount, onLike]);

  const timeAgo = useMemo(() => {
    const date = new Date(comment.createdAt);
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
  }, [comment.createdAt]);

  const maxNestingLevel = 3; // Limit nesting to prevent infinite nesting

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`${level > 0 ? 'ml-8' : ''}`}
    >
      <div className="flex items-start space-x-3 py-2">
        {/* Avatar */}
        <img
          src={comment.profile?.profilePic || '/default-profile.svg'}
          alt={comment.profile?.username || 'User'}
          className={`rounded-full object-cover ${isReply ? 'w-6 h-6' : 'w-8 h-8'}`}
        />

        <div className="flex-1 min-w-0">
          {/* Comment content */}
          <div className={`rounded-2xl px-3 py-2 ${
            theme === 'dark' 
              ? 'bg-gray-800 text-gray-100' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="font-semibold text-sm">
              {comment.profile?.username || 'Unknown User'}
            </p>
            <p className="text-sm leading-relaxed">{comment.comment}</p>
          </div>

          {/* Comment actions */}
          <div className="flex items-center space-x-4 mt-1 ml-3">
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {timeAgo}
            </span>

            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={!currentUser?.profileid}
              className={`text-xs font-medium transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-red-400' 
                    : 'text-gray-600 hover:text-red-500'
              } ${!currentUser?.profileid ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {isLiked ? '♥' : '♡'} {likeCount > 0 && likeCount}
            </button>

            {/* Reply button */}
            {level < maxNestingLevel && (
              <button
                onClick={() => onReply(comment)}
                disabled={!currentUser?.profileid}
                className={`text-xs font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                } ${!currentUser?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Reply
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className={`text-xs font-medium mb-2 transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {showReplies ? '−' : '+'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
              
              <AnimatePresence>
                {showReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.commentid}
                        comment={reply}
                        onReply={onReply}
                        onLike={onLike}
                        currentUser={currentUser}
                        theme={theme}
                        level={level + 1}
                        isReply={true}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Main Comment Section Component
export default function CommentSection({ 
  postId, 
  comments = [], 
  onRefresh,
  className = ""
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL mutations
  const [createComment] = useMutation(CREATE_COMMENT);
  const [createCommentReply] = useMutation(CREATE_COMMENT_REPLY);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);

  // Handle new comment
  const handleCreateComment = useCallback(async () => {
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
      onRefresh?.();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, user, postId, createComment, onRefresh, isSubmitting]);

  // Handle reply
  const handleCreateReply = useCallback(async () => {
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
      onRefresh?.();
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [replyText, user, replyingTo, createCommentReply, onRefresh, isSubmitting]);

  // Handle comment like
  const handleCommentLike = useCallback(async (commentId) => {
    if (!user?.profileid) return;

    try {
      await toggleCommentLike({
        variables: {
          profileid: user.profileid,
          commentid: commentId
        }
      });
      
      // Refresh to get updated like states
      onRefresh?.();
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error; // Re-throw to allow optimistic rollback
    }
  }, [user, toggleCommentLike, onRefresh]);

  // Handle reply button click
  const handleReplyClick = useCallback((comment) => {
    setReplyingTo(comment);
    setReplyText(`@${comment.profile?.username} `);
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((e, isReply = false) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isReply) {
        handleCreateReply();
      } else {
        handleCreateComment();
      }
    }
  }, [handleCreateComment, handleCreateReply]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comments header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Comments ({comments.length})
        </h3>
        {comments.length > 0 && (
          <button
            onClick={onRefresh}
            className={`text-sm transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Refresh
          </button>
        )}
      </div>

      {/* Reply input (when replying) */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 rounded-lg border-l-4 ${
              theme === 'dark' 
                ? 'bg-blue-900/20 border-blue-500' 
                : 'bg-blue-50 border-blue-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
              }`}>
                Replying to <span className="font-semibold">{replyingTo.profile?.username}</span>
              </p>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                className={`text-sm ${
                  theme === 'dark' 
                    ? 'text-blue-300 hover:text-blue-200' 
                    : 'text-blue-700 hover:text-blue-800'
                }`}
              >
                Cancel
              </button>
            </div>
            <div className="flex items-end space-x-2">
              <img
                src={user?.profilePic || '/default-profile.svg'}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${replyingTo.profile?.username}...`}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  onKeyPress={(e) => handleKeyPress(e, true)}
                  disabled={isSubmitting}
                />
              </div>
              <button
                onClick={handleCreateReply}
                disabled={!replyText.trim() || isSubmitting}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  replyText.trim() && !isSubmitting
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments list */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment.commentid}
                comment={comment}
                onReply={handleReplyClick}
                onLike={handleCommentLike}
                currentUser={user}
                theme={theme}
              />
            ))
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-8 text-sm ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              No comments yet. Be the first to comment!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* New comment input */}
      <div className="flex items-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <img
          src={user?.profilePic || '/default-profile.svg'}
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user?.profileid ? "Add a comment..." : "Login to comment"}
            disabled={!user?.profileid || isSubmitting}
            rows={2}
            className={`w-full px-4 py-3 rounded-full border resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } ${!user?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
            onKeyPress={(e) => handleKeyPress(e, false)}
          />
        </div>
        <button
          onClick={handleCreateComment}
          disabled={!newComment.trim() || !user?.profileid || isSubmitting}
          className={`px-6 py-3 rounded-full font-medium transition-colors ${
            newComment.trim() && user?.profileid && !isSubmitting
              ? 'bg-red-500 text-white hover:bg-red-600'
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
