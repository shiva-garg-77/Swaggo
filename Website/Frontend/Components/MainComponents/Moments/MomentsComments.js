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

export default function MomentsComments({ postId, theme, className = "" }) {
  const { user } = useSecureAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [visibleComments, setVisibleComments] = useState(10); // Pagination
  const inputRef = useRef(null);

  console.log('🎬 MomentsComments initialized with postId:', postId);

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
      console.log('✅ Moments comment created successfully:', data);
      refetch();
    },
    onError: (error) => {
      console.error('❌ Error creating moments comment:', error);
    }
  });

  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('❌ Error toggling moments comment like:', error);
    }
  });

  // Process comments into flat structure with reply groups
  const processCommentsToFlat = (comments) => {
    if (!comments || !Array.isArray(comments)) return { flatComments: [], replyGroups: new Map() };

    let allComments = [...comments];
    comments.forEach(c => {
      if (Array.isArray(c.replies) && c.replies.length) {
        allComments = allComments.concat(c.replies);
      }
    });

    const byId = new Map(allComments.map(c => [c.commentid, c]));
    const topLevelComments = allComments.filter(c => !c.commenttoid);
    const replies = allComments.filter(c => c.commenttoid);

    const flatComments = [];
    const replyGroups = new Map();

    topLevelComments.forEach(comment => {
      flatComments.push({ ...comment, isTopLevel: true });

      // Find all replies for this top-level comment
      const commentReplies = replies.filter(r => {
        let current = r;
        while (current && current.commenttoid) {
          const parent = byId.get(current.commenttoid);
          if (!parent) break;
          if (parent.commentid === comment.commentid) return true;
          current = parent;
        }
        return false;
      });

      commentReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Store reply group for collapsible functionality
      replyGroups.set(comment.commentid, {
        count: commentReplies.length,
        replies: commentReplies.map(reply => {
          let replyToUsername = '';
          if (reply.userto?.username) {
            replyToUsername = reply.userto.username;
          } else if (reply.commenttoid) {
            const parent = byId.get(reply.commenttoid);
            replyToUsername = parent?.profile?.username || 'someone';
          } else {
            replyToUsername = comment.profile?.username;
          }

          return {
            ...reply,
            isTopLevel: false,
            isReply: true,
            replyToUsername,
            parentCommentId: comment.commentid
          };
        })
      });
    });

    return { flatComments, replyGroups };
  };

  const { flatComments, replyGroups } = processCommentsToFlat(commentsData?.getCommentsByPost || []);
  console.log('🎬 Processed flat moments comments:', flatComments);
  console.log('🎬 Reply groups:', replyGroups);

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || isSubmitting) return;

    console.log('🎬 Submitting moments comment:', { newComment, replyingTo });
    setIsSubmitting(true);
    
    try {
      const variables = {
        postid: postId,
        profileid: user.profileid,
        comment: newComment.trim(),
      };

      if (replyingTo) {
        variables.commenttoid = replyingTo.commentid;
        if (replyingTo.profile?.profileid) {
          variables.usertoid = replyingTo.profile.profileid;
        }
        
        const targetUsername = replyingTo.replyToUsername || replyingTo.profile?.username;
        if (targetUsername && !newComment.includes(`@${targetUsername}`)) {
          variables.comment = `@${targetUsername} ${newComment.trim()}`;
        }
      }

      await createComment({ variables });
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('❌ Failed to create moments comment:', error);
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
    console.log('🎬 Starting reply to moments comment:', {
      commentId: comment.commentid,
      isReply: comment.isReply,
      isTopLevel: comment.isTopLevel,
      username: comment.profile?.username,
      replyToUsername: comment.replyToUsername,
      comment: comment.comment.substring(0, 50) + '...'
    });
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    console.log('🎬 Cancelling moments reply');
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

  // Load more comments
  const loadMoreComments = () => {
    setVisibleComments(prev => prev + 10);
  };

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

  if (error && !commentsData?.getCommentsByPost) {
    return (
      <div className={`${className} p-4`}>
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className={`w-6 h-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-2`} />
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            Failed to load comments
          </p>
          <button 
            onClick={() => refetch()}
            className={`text-xs mt-2 px-3 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Get visible comments for pagination
  const visibleTopLevelComments = flatComments.slice(0, visibleComments);
  const hasMoreComments = flatComments.length > visibleComments;

  return (
    <div className={`${className} flex flex-col h-full`}>
      {/* Debug Info - for QA */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`p-3 border-b text-xs ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <div><strong>🎬 Moments Debug:</strong></div>
          <div>PostID: {postId} | User: {user ? `${user.username} (${user.profileid})` : 'Not logged in'}</div>
          <div>Comments: {flatComments.length} | Visible: {visibleComments}</div>
          <div>Reply Groups: {replyGroups.size} | Currently Replying To: {replyingTo ? `${replyingTo.profile?.username} (${replyingTo.commentid})` : 'None'}</div>
          <div>Total Reply Buttons Expected: {flatComments.length + Array.from(replyGroups.values()).reduce((sum, group) => sum + group.count, 0)}</div>
        </div>
      )}
      
      {/* Comments List - Scrollable with collapsible replies */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 max-h-96">
        {flatComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          visibleTopLevelComments.map((comment, index) => {
            const likeCount = comment.likeCount || 0;
            const isLiked = comment.isLikedByUser || false;
            const replyGroup = replyGroups.get(comment.commentid);
            const hasReplies = replyGroup && replyGroup.count > 0;
            const isExpanded = expandedComments.has(comment.commentid);
            
            return (
              <div key={comment.commentid}>
                {/* Top-level comment only */}
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
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
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
                  
                  {/* Comment Actions - ALWAYS VISIBLE */}
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
                    
                    {/* REPLY BUTTON - ALWAYS VISIBLE */}
                    <button
                      onClick={() => handleReply(comment)}
                      className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full transition-all ${
                        replyingTo?.commentid === comment.commentid
                          ? 'bg-blue-500 text-white'
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
                    
                    {/* Show replies button if has replies */}
                    {hasReplies && (
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
                
                {/* Collapsible Replies */}
                {hasReplies && isExpanded && (
                  <div className="ml-6 mt-2 space-y-3 border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                    {/* Debug info for reply structure */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded mb-2">
                        Showing {replyGroup.replies.length} replies for comment {comment.commentid}
                      </div>
                    )}
                    {replyGroup.replies.map((reply, replyIndex) => {
                      console.log(`🎬 Rendering reply ${replyIndex + 1}/${replyGroup.replies.length} for comment ${comment.commentid}:`, {
                        replyId: reply.commentid,
                        replyUser: reply.profile?.username,
                        replyToUser: reply.replyToUsername,
                        hasProfile: !!reply.profile,
                        commentText: reply.comment?.substring(0, 30) + '...'
                      });
                      return (
                      <div key={reply.commentid} className="flex space-x-3">
                        <img
                          src={reply.profile?.profilePic || '/default-profile.svg'}
                          alt={reply.profile?.username}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`inline-block px-3 py-2 rounded-2xl max-w-full ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`font-semibold text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {reply.profile?.username}
                              </span>
                            </div>
                            <p className={`text-sm break-words ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                              {reply.replyToUsername && (
                                <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium mr-2">
                                  <span className="text-blue-500 mr-1">@</span>{reply.replyToUsername}
                                </span>
                              )}
                              {reply.comment}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 pl-3">
                            <button
                              onClick={() => handleLikeToggle(reply.commentid)}
                              className={`flex items-center space-x-1 text-xs transition-colors ${
                                reply.isLikedByUser 
                                  ? 'text-red-500' 
                                  : theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${reply.isLikedByUser ? 'fill-current' : ''}`} />
                              {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
                            </button>
                            
                            {/* REPLY BUTTON ON REPLIES - ENHANCED VISIBILITY */}
                            <button
                              onClick={() => handleReply(reply)}
                              className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full border-2 transition-all ${
                                replyingTo?.commentid === reply.commentid
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : theme === 'dark' 
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-700 border-gray-600 hover:border-gray-500' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
                              }`}
                              disabled={!user}
                              title="Reply to this comment"
                            >
                              <Reply className="w-3 h-3" />
                              <span className="font-medium">Reply</span>
                            </button>
                            
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                            
                            {/* Debug info for replies */}
                            {process.env.NODE_ENV === 'development' && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded">
                                REPLY-BTN-VISIBLE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Load More Button */}
        {hasMoreComments && (
          <div className="px-4 py-2">
            <button
              onClick={loadMoreComments}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Load {Math.min(10, flatComments.length - visibleComments)} more comments
            </button>
          </div>
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <div className={`border-t p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Reply indicator */}
          {replyingTo && (
            <div className={`mb-3 p-2 rounded-lg flex items-center justify-between ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
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
          
          <div className="flex items-center space-x-2">
            <img
              src={user.profilePic || '/default-profile.svg'}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder={replyingTo ? `Reply to @${replyingTo.replyToUsername || replyingTo.profile?.username}...` : "Add a comment..."}
                className={`w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isSubmitting}
              />
            </div>
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className={`p-2 rounded-full transition-all ${
                newComment.trim() && !isSubmitting
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className={`border-t p-4 text-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Please log in to comment and interact
          </p>
        </div>
      )}
    </div>
  );
}
