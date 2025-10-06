"use client";

import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { GET_POST_COMMENTS, CREATE_COMMENT, TOGGLE_COMMENT_LIKE } from '../../../lib/graphql/queries';
import {
  Heart,
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  Reply,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function SimpleFlatCommentSystem({ postId, theme, onCommentUpdate, className = "" }) {
  const { user } = useSecureAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const inputRef = useRef(null);

  // Fetch comments
  const { data: commentsData, loading, error, refetch } = useQuery(GET_POST_COMMENTS, {
    variables: { postid: postId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !postId
  });

  // Mutations
  const [createComment] = useMutation(CREATE_COMMENT, {
    onCompleted: (data) => {
      console.log('✅ Comment created successfully:', data);
      refetch();
      onCommentUpdate?.();
    },
    onError: (error) => {
      console.error('❌ Error creating comment:', error);
      console.error('GraphQL errors:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
    }
  });

  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE, {
    onCompleted: (data) => {
      console.log('✅ Like toggled successfully:', data);
      refetch();
    },
    onError: (error) => {
      console.error('❌ Error toggling comment like:', error);
    }
  });

  // Process comments into flat structure with collapsible replies
  const processCommentsToFlat = (comments) => {
    if (!comments || !Array.isArray(comments)) return { flatComments: [], replyGroups: new Map() };

    // Get all comments including replies
    let allComments = [...comments];
    
    // Add replies from each comment to the full list
    comments.forEach(comment => {
      if (comment.replies && Array.isArray(comment.replies)) {
        allComments = allComments.concat(comment.replies);
      }
    });

    // Build a map for quick parent lookup
    const byId = new Map(allComments.map(c => [c.commentid, c]));

    // Helper: find the top-level ancestor id for any comment
    const findTopLevelId = (c) => {
      let current = c;
      const guard = new Set();
      while (current && current.commenttoid) {
        if (guard.has(current.commenttoid)) break; // safety against cycles
        guard.add(current.commenttoid);
        current = byId.get(current.commenttoid);
      }
      return current ? current.commentid : c.commentid;
    };

    // Group replies by their top-level ancestor id
    const topLevelComments = allComments.filter(c => !c.commenttoid);
    const replies = allComments.filter(c => c.commenttoid);

    const repliesByTop = new Map();
    for (const r of replies) {
      const topId = findTopLevelId(r);
      if (!repliesByTop.has(topId)) repliesByTop.set(topId, []);
      repliesByTop.get(topId).push(r);
    }

    const flatComments = [];
    const replyGroups = new Map();

    // Process each top-level comment
    for (const tl of topLevelComments) {
      flatComments.push({ ...tl, isTopLevel: true });

      const allDescReplies = (repliesByTop.get(tl.commentid) || []).slice();
      // stable chronological order
      allDescReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Store reply info for collapsible functionality
      replyGroups.set(tl.commentid, {
        count: allDescReplies.length,
        replies: allDescReplies.map(reply => {
          let replyToUsername = '';
          if (reply.userto?.username) {
            replyToUsername = reply.userto.username;
          } else if (reply.commenttoid) {
            const parent = byId.get(reply.commenttoid);
            replyToUsername = parent?.profile?.username || 'someone';
          } else {
            replyToUsername = tl.profile?.username;
          }

          return {
            ...reply,
            isTopLevel: false,
            isReply: true,
            replyToUsername,
            parentCommentId: tl.commentid
          };
        })
      });
    }

    return { flatComments, replyGroups };
  };
  
  // Get raw comments data
  const rawComments = commentsData?.getCommentsByPost || [];
  const { flatComments, replyGroups } = processCommentsToFlat(rawComments);
  
  // Debug logging
  if (rawComments.length > 0) {
    console.log('🐛 Raw comments from GraphQL:', rawComments);
    console.log('🏗️ Processed flat comments:', flatComments);
    console.log('📁 Reply groups:', replyGroups);
  }

  // Handle new comment submission
  const handleSubmitComment = async () => {
    console.log('📨 Submitting comment:', {
      newComment: newComment.trim(),
      user: user?.username,
      isSubmitting,
      replyingTo: replyingTo ? {
        commentid: replyingTo.commentid,
        username: replyingTo.profile?.username,
        replyToUsername: replyingTo.replyToUsername
      } : null
    });
    
    if (!newComment.trim() || !user || isSubmitting) {
      console.log('⚠️ Cannot submit comment - validation failed');
      return;
    }

    setIsSubmitting(true);
    try {
      const variables = {
        postid: postId,
        profileid: user.profileid,
        comment: newComment.trim(),
      };

      // If replying to someone
      if (replyingTo) {
        console.log('🔁 This is a reply to:', replyingTo);
        // For replies to replies, we want to reply to the specific comment, not the top-level
        variables.commenttoid = replyingTo.commentid;
        
        // Set usertoid to the person we're replying to
        if (replyingTo.profile?.profileid) {
          variables.usertoid = replyingTo.profile.profileid;
        }
        
        // Add @mention to the comment if not already present
        const targetUsername = replyingTo.replyToUsername || replyingTo.profile?.username;
        if (targetUsername && !newComment.includes(`@${targetUsername}`)) {
          variables.comment = `@${targetUsername} ${newComment.trim()}`;
        }
      }

      console.log('🚀 Sending GraphQL mutation with variables:', variables);
      await createComment({ variables });
      
      setNewComment('');
      setReplyingTo(null);
      console.log('✅ Comment submitted successfully!');
    } catch (error) {
      console.error('❌ Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like toggle
  const handleLikeToggle = async (commentId) => {
    if (!user) return;

    try {
      await toggleCommentLike({
        variables: {
          profileid: user.profileid,
          commentid: commentId
        }
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Handle reply
  const handleReply = (comment) => {
    console.log('💬 Starting reply to comment:', comment);
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    console.log('❌ Cancelling reply');
    setReplyingTo(null);
    setNewComment('');
  };

  // Toggle expand/collapse replies
  const toggleExpandReplies = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Loading state
  if (loading && !commentsData) {
    return (
      <div className={`${className} p-4`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`w-6 h-6 animate-spin ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
          <span className={`ml-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading comments...
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !commentsData?.getCommentsByPost) {
    console.error('❌ GraphQL Error loading comments:', error);
    return (
      <div className={`${className} p-4`}>
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className={`w-6 h-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-2`} />
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            Failed to load comments
          </p>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            {error.message || 'Unknown error occurred'}
          </p>
          <button 
            onClick={() => {
              console.log('🔄 Retrying to fetch comments...');
              refetch();
            }}
            className={`text-xs mt-2 px-3 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-col h-full`}>
      {/* Comments List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        <AnimatePresence>
          {flatComments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No comments yet. Be the first to comment!
              </p>
            </motion.div>
          ) : (
            flatComments.map((comment, index) => {
              const likeCount = comment.likeCount || 0;
              const isLiked = comment.isLikedByUser || false;
              const replyGroup = replyGroups.get(comment.commentid);
              const hasReplies = replyGroup && replyGroup.count > 0;
              const isExpanded = expandedComments.has(comment.commentid);
              
              return (
                <div key={comment.commentid}>
                  {/* Main Comment */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex space-x-3"
                  >
                  {/* Profile Picture */}
                  <img
                    src={comment.profile?.profilePic || '/default-profile.svg'}
                    alt={comment.profile?.username}
                    className={`${comment.isTopLevel ? 'w-8 h-8' : 'w-6 h-6'} rounded-full object-cover flex-shrink-0`}
                  />
                  
                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`inline-block px-3 py-2 rounded-2xl max-w-full ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`font-semibold text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {comment.profile?.username}
                        </span>
                        {comment.profile?.isVerified && (
                          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className={`text-sm break-words ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                        {/* Show @tag for replies */}
                        {comment.isReply && comment.replyToUsername && (
                          <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium mr-2">
                            <span className="text-blue-500 mr-1">@</span>{comment.replyToUsername}
                          </span>
                        )}
                        {comment.comment}
                      </p>
                    </div>
                    
                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4 mt-2 pl-3">
                      <button
                        onClick={() => handleLikeToggle(comment.commentid)}
                        className={`flex items-center space-x-1 text-xs transition-colors ${
                          isLiked 
                            ? 'text-red-500' 
                            : theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                        }`}
                        disabled={!user}
                      >
                        <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                      </button>
                      
                      <button
                        onClick={() => handleReply(comment)}
                        className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-all ${
                          replyingTo?.commentid === comment.commentid
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : theme === 'dark' 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                        disabled={!user}
                      >
                        <Reply className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                      
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      
                      {/* Show replies button for top-level comments with replies */}
                      {comment.isTopLevel && hasReplies && (
                        <button
                          onClick={() => toggleExpandReplies(comment.commentid)}
                          className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          <span>{replyGroup.count} {replyGroup.count === 1 ? 'reply' : 'replies'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  </motion.div>
                  
                  {/* Nested Replies - Collapsible */}
                  {comment.isTopLevel && hasReplies && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-8 mt-2 space-y-3 border-l-2 border-gray-200 dark:border-gray-600 pl-4"
                    >
                      {replyGroup.replies.map((reply, replyIndex) => {
                        const replyLikeCount = reply.likeCount || 0;
                        const replyIsLiked = reply.isLikedByUser || false;
                        
                        return (
                          <motion.div
                            key={reply.commentid}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: replyIndex * 0.05 }}
                            className="flex space-x-3"
                          >
                            {/* Reply Profile Picture */}
                            <img
                              src={reply.profile?.profilePic || '/default-profile.svg'}
                              alt={reply.profile?.username}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                            
                            {/* Reply Content */}
                            <div className="flex-1 min-w-0">
                              <div className={`inline-block px-3 py-2 rounded-2xl max-w-full ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className={`font-semibold text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {reply.profile?.username}
                                  </span>
                                  {reply.profile?.isVerified && (
                                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <p className={`text-sm break-words ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {/* Show @tag for replies */}
                                  {reply.replyToUsername && (
                                    <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium mr-2">
                                      <span className="text-blue-500 mr-1">@</span>{reply.replyToUsername}
                                    </span>
                                  )}
                                  {reply.comment}
                                </p>
                              </div>
                              
                              {/* Reply Actions */}
                              <div className="flex items-center space-x-4 mt-2 pl-3">
                                <button
                                  onClick={() => handleLikeToggle(reply.commentid)}
                                  className={`flex items-center space-x-1 text-xs transition-colors ${
                                    replyIsLiked 
                                      ? 'text-red-500' 
                                      : theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                                  }`}
                                  disabled={!user}
                                >
                                  <Heart className={`w-3 h-3 ${replyIsLiked ? 'fill-current' : ''}`} />
                                  {replyLikeCount > 0 && <span>{replyLikeCount}</span>}
                                </button>
                                
                                <button
                                  onClick={() => handleReply(reply)}
                                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-all ${
                                    replyingTo?.commentid === reply.commentid
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                      : theme === 'dark' 
                                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                  disabled={!user}
                                >
                                  <Reply className="w-3 h-3" />
                                  <span>Reply</span>
                                </button>
                                
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Comment Input */}
      {user && (
        <div className={`border-t p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Reply indicator */}
          {replyingTo && (
            <div className={`mb-3 p-2 rounded-lg flex items-center justify-between ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <div className="flex items-center space-x-2">
                <Reply className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  Replying to @{replyingTo.replyToUsername || replyingTo.profile?.username}
                </span>
              </div>
              <button
                onClick={cancelReply}
                className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="flex space-x-3">
            <img
              src={user.profilePic || '/default-profile.svg'}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder={replyingTo ? `Reply to @${replyingTo.replyToUsername || replyingTo.profile?.username}...` : "Write a comment..."}
                className={`flex-1 px-4 py-2 rounded-full border text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className={`p-2 rounded-full transition-all ${
                  newComment.trim() && !isSubmitting
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Login prompt */}
      {!user && (
        <div className={`border-t p-4 text-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Please log in to comment and interact with posts
          </p>
        </div>
      )}
    </div>
  );
}
