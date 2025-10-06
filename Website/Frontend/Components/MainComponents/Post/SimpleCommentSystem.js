"use client";

import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { 
  GET_POST_COMMENTS, 
  CREATE_COMMENT, 
  TOGGLE_COMMENT_LIKE,
  SEARCH_USERS 
} from '../../../lib/graphql/queries';
import {
  Heart,
  MessageCircle,
  Reply,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';

// Simple Comment Node Component with threading
const CommentNode = ({ 
  comment, 
  depth = 0, 
  onReply, 
  onLike, 
  theme,
  user,
  maxDepth = 3
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = depth < maxDepth;
  
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

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-lg transition-colors ${
          theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex space-x-3">
          <img
            src={comment.profile?.profilePic || '/default-profile.svg'}
            alt={comment.profile?.username}
            className={`rounded-full object-cover ${
              depth === 0 ? 'w-10 h-10' : 'w-8 h-8'
            }`}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`font-semibold ${
                depth === 0 ? 'text-sm' : 'text-xs'
              } ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {comment.profile?.username}
              </span>
              
              {comment.profile?.isVerified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.236 4.53L7.73 9.77a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l3.5-4.9z" clipRule="evenodd" />
                </svg>
              )}
              
              {comment.replyToUsername && (
                <div className="flex items-center text-xs">
                  <ArrowRight className="w-3 h-3 text-blue-500 mr-1" />
                  <span className="text-blue-500 font-medium">@{comment.replyToUsername}</span>
                </div>
              )}
              
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            
            <p className={`${
              depth === 0 ? 'text-sm' : 'text-xs'
            } break-words leading-relaxed ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            } mb-2`}>
              {comment.comment}
            </p>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onLike(comment.commentid)}
                disabled={!user?.profileid}
                className={`flex items-center space-x-1 text-xs transition-colors ${
                  comment.isLikedByUser
                    ? 'text-red-500'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-red-400'
                      : 'text-gray-500 hover:text-red-500'
                } disabled:opacity-50`}
              >
                <Heart className={`w-3 h-3 ${comment.isLikedByUser ? 'fill-current' : ''}`} />
                {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
              </button>
              
              {canReply && (
                <button
                  onClick={() => onReply(comment)}
                  disabled={!user?.profileid}
                  className={`flex items-center space-x-1 text-xs transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  } disabled:opacity-50`}
                >
                  <Reply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              )}
              
              {hasReplies && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className={`flex items-center space-x-1 text-xs transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showReplies ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Nested Replies */}
      <AnimatePresence>
        {hasReplies && showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            {comment.replies.map((reply) => (
              <CommentNode
                key={reply.commentid}
                comment={reply}
                depth={depth + 1}
                onReply={onReply}
                onLike={onLike}
                theme={theme}
                user={user}
                maxDepth={maxDepth}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Simple Comment System Component
export default function SimpleCommentSystem({ 
  postId, 
  className = "",
  theme: propTheme,
  onCommentUpdate
}) {
  const { theme } = useTheme();
  const { user } = useSecureAuth();
  const actualTheme = propTheme || theme;
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Fetch comments
  const { data, loading, error, refetch } = useQuery(GET_POST_COMMENTS, {
    variables: { postid: postId },
    skip: !postId,
    errorPolicy: 'all'
  });

  // Mutations
  const [createComment] = useMutation(CREATE_COMMENT);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);

  const comments = data?.getCommentsByPost || [];

  // Build simple threaded structure
  const threadedComments = useMemo(() => {
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create comment map
    comments.forEach(comment => {
      commentMap.set(comment.commentid, {
        ...comment,
        replies: []
      });
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      const commentNode = commentMap.get(comment.commentid);
      
      if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
        const parent = commentMap.get(comment.parentCommentId);
        parent.replies.push(commentNode);
      } else if (!comment.isReply && !comment.parentCommentId) {
        rootComments.push(commentNode);
      }
    });

    return rootComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [comments]);

  // Handle comment creation
  const handleCreateComment = async () => {
    if (!newComment.trim() || !user?.profileid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        postid: postId,
        profileid: user.profileid,
        comment: newComment.trim()
      };

      if (replyingTo) {
        commentData.parentCommentId = replyingTo.commentid;
        commentData.replyToUserId = replyingTo.profile.profileid;
        commentData.replyToUsername = replyingTo.profile.username;
      }

      await createComment({ variables: commentData });
      
      setNewComment('');
      setReplyingTo(null);
      await refetch();
      onCommentUpdate && onCommentUpdate();
      
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to post comment. Please try again.');
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
      onCommentUpdate && onCommentUpdate();
      
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  // Handle reply initiation
  const handleReply = (comment) => {
    setReplyingTo(comment);
    const replyText = `@${comment.profile?.username} `;
    setNewComment(replyText);
    inputRef.current?.focus();
  };

  if (loading) return (
    <div className="text-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-4 text-red-500">
      <p>Error loading comments</p>
    </div>
  );

  return (
    <div className={`${className} relative`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`text-sm font-medium ${
          actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </div>
      </div>

      {/* Comments list */}
      <div className="max-h-96 overflow-y-auto">
        {threadedComments.length > 0 ? (
          <div className="p-4 space-y-3">
            {threadedComments.map((comment) => (
              <CommentNode
                key={comment.commentid}
                comment={comment}
                depth={0}
                onReply={handleReply}
                onLike={handleCommentLike}
                theme={actualTheme}
                user={user}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageCircle className={`w-12 h-12 mb-4 ${
              actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm font-medium ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No comments yet
            </p>
            <p className={`text-xs mt-1 ${
              actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Be the first to comment
            </p>
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 border-t border-b ${
            actualTheme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-blue-500" />
              <p className={`text-sm ${
                actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Replying to <span className="font-semibold text-blue-500">@{replyingTo.profile?.username}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null);
                setNewComment('');
              }}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                actualTheme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Comment input */}
      <div className={`flex items-center space-x-3 px-4 py-3 border-t ${
        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <img
          src={user?.profilePic || '/default-profile.svg'}
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user?.profileid ? (replyingTo ? "Write a reply..." : "Add a comment...") : "Login to comment"}
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
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm px-3 py-1 disabled:opacity-50 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {isSubmitting ? 'Posting...' : (replyingTo ? 'Reply' : 'Post')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
