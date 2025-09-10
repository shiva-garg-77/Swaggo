"use client";
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Smile, MessageCircle, User } from 'lucide-react';
import { GET_POST_COMMENTS, CREATE_COMMENT, CREATE_COMMENT_REPLY, TOGGLE_COMMENT_LIKE } from '../../../lib/graphql/queries';
import { useTheme } from '../../Helper/ThemeProvider';

export default function ReelComments({ isOpen, onClose, reel, user, refetch, variant = 'modal' }) {
  const { theme } = useTheme();
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to
  const [replyText, setReplyText] = useState('');
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const { data, loading, error, refetch: refetchComments } = useQuery(GET_POST_COMMENTS, {
    skip: !reel?.postid,
    variables: { postid: reel?.postid },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all'
  });

  const [createComment] = useMutation(CREATE_COMMENT);
  const [createCommentReply] = useMutation(CREATE_COMMENT_REPLY);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);

  const comments = data?.getCommentsByPost || [];
  
  // Debug logging
  console.log('ReelComments Debug:', {
    user: user,
    userProfileId: user?.profileid,
    reel: reel,
    reelPostId: reel?.postid,
    commentsLength: comments.length
  });
  
  // Enhanced emoji collection
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
    '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
    '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
    '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
    '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '🖤', '🤎',
    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️',
    '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌',
    '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
    '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌',
    '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿',
    '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️',
    '👅', '👄', '💋', '🩸', '👶', '🧒', '👦', '👧', '🧑', '👱',
    '👨', '🧔', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '🧑‍🦰', '👩‍🦱'
  ];

  const addComment = async () => {
    if (!newComment.trim() || !user?.profileid) return;
    try {
      console.log('Adding comment with data:', {
        postid: reel.postid,
        profileid: user.profileid,
        comment: newComment
      });
      
      const result = await createComment({
        variables: {
          postid: reel.postid,
          profileid: user.profileid,
          comment: newComment
        },
        update: (cache, { data }) => {
          const newComment = data.CreateComment;
          const existingComments = cache.readQuery({
            query: GET_POST_COMMENTS,
            variables: { postid: reel.postid }
          });
          
          if (existingComments && newComment) {
            cache.writeQuery({
              query: GET_POST_COMMENTS,
              variables: { postid: reel.postid },
              data: {
                getCommentsByPost: [...existingComments.getCommentsByPost, newComment]
              }
            });
          }
        }
      });
      
      console.log('Comment created successfully:', result);
      setNewComment('');
      setShowEmojiPicker(false);
      refetch?.(); // Update main post comment count
    } catch (e) {
      console.error('Error adding comment:', e);
      console.error('GraphQL errors:', e.graphQLErrors);
      console.error('Network error:', e.networkError);
    }
  };

  const addEmoji = (emoji) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const addReplyEmoji = (emoji) => {
    setReplyText(prev => prev + emoji);
    setShowReplyEmojiPicker(false);
  };

  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText('');
    setShowReplyEmojiPicker(false);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
    setShowReplyEmojiPicker(false);
  };

  const addReply = async (commentId) => {
    if (!replyText.trim() || !user?.profileid) return;
    
    try {
      console.log('Adding reply with data:', {
        commentid: commentId,
        profileid: user.profileid,
        comment: replyText
      });
      
      // Use nested reply creation
      const result = await createCommentReply({
        variables: {
          commentid: commentId,
          profileid: user.profileid,
          comment: replyText
        },
        update: (cache, { data }) => {
          const newReply = data.CreateCommentReply;
          const existingComments = cache.readQuery({
            query: GET_POST_COMMENTS,
            variables: { postid: reel.postid }
          });
          
          if (existingComments && newReply) {
            const updatedComments = existingComments.getCommentsByPost.map(comment => {
              if (comment.commentid === commentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newReply]
                };
              }
              return comment;
            });
            
            cache.writeQuery({
              query: GET_POST_COMMENTS,
              variables: { postid: reel.postid },
              data: {
                getCommentsByPost: updatedComments
              }
            });
          }
        }
      });
      
      console.log('Reply created successfully:', result);
      cancelReply();
      refetch?.(); // Update main post comment count
    } catch (e) {
      console.error('Error adding reply:', e);
      console.error('GraphQL errors:', e.graphQLErrors);
      console.error('Network error:', e.networkError);
    }
  };

  const likeComment = async (commentId) => {
    if (!user?.profileid) return;
    
    // Find comment or reply
    let currentComment = comments.find(c => c.commentid === commentId);
    let isReply = false;
    
    // If not found in main comments, search in replies
    if (!currentComment) {
      for (const comment of comments) {
        if (comment.replies) {
          currentComment = comment.replies.find(r => r.commentid === commentId);
          if (currentComment) {
            isReply = true;
            break;
          }
        }
      }
    }
    
    if (!currentComment) return;
    
    try {
      console.log('Liking comment with data:', {
        profileid: user.profileid,
        commentid: commentId
      });
      
      const result = await toggleCommentLike({
        variables: {
          profileid: user.profileid,
          commentid: commentId
        },
        optimisticResponse: {
          ToggleCommentLike: {
            __typename: 'CommentLike',
            profileid: user.profileid,
            commentid: commentId,
            createdAt: new Date().toISOString()
          }
        },
        update: (cache, { data }) => {
          // Update the comment in cache
          const existingComments = cache.readQuery({
            query: GET_POST_COMMENTS,
            variables: { postid: reel.postid }
          });
          
          if (existingComments) {
            const updatedComments = existingComments.getCommentsByPost.map(comment => {
              // Update main comment
              if (comment.commentid === commentId) {
                return {
                  ...comment,
                  isLikedByUser: !comment.isLikedByUser,
                  likeCount: comment.isLikedByUser 
                    ? Math.max(0, comment.likeCount - 1) 
                    : comment.likeCount + 1
                };
              }
              
              // Update reply within comment
              if (comment.replies) {
                const updatedReplies = comment.replies.map(reply => {
                  if (reply.commentid === commentId) {
                    return {
                      ...reply,
                      isLikedByUser: !reply.isLikedByUser,
                      likeCount: reply.isLikedByUser 
                        ? Math.max(0, reply.likeCount - 1) 
                        : reply.likeCount + 1
                    };
                  }
                  return reply;
                });
                
                return {
                  ...comment,
                  replies: updatedReplies
                };
              }
              
              return comment;
            });
            
            cache.writeQuery({
              query: GET_POST_COMMENTS,
              variables: { postid: reel.postid },
              data: {
                getCommentsByPost: updatedComments
              }
            });
          }
        }
      });
      
      console.log('Comment like toggled successfully:', result);
    } catch (e) {
      console.error('Error liking comment:', e);
      console.error('GraphQL errors:', e.graphQLErrors);
      console.error('Network error:', e.networkError);
      // Refetch on error to restore correct state
      refetchComments();
    }
  };

  const handleViewProfile = (profileId) => {
    if (profileId) {
      window.location.href = `/profile/${profileId}`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: variant === 'modal' ? '100%' : 24 }}
        animate={{ x: 0 }}
        exit={{ x: variant === 'modal' ? '100%' : 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`${variant === 'modal' 
          ? 'fixed top-1/2 right-4 transform -translate-y-1/2 w-96 z-50' 
          : 'w-full h-full' } ${
          theme === 'dark' ? 'bg-gray-900/98' : 'bg-white/98'
        } backdrop-blur-xl shadow-2xl flex flex-col rounded-3xl border ${
          theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}
        style={{ height: '90vh' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-50'} shadow-lg`}>
              <MessageCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Comments
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div className={`p-4 rounded-2xl border ${
              theme === 'dark' ? 'bg-red-900/20 border-red-700/50 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <p className="text-sm font-medium">Failed to load comments. Please try again.</p>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No comments yet
              </p>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Be the first to comment!
              </p>
            </div>
          )}
          {!loading && comments.map((comment, index) => (
            <motion.div 
              key={comment.commentid} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex space-x-3 group"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={comment.profile?.profilePic || '/default-avatar.png'}
                  alt={comment.profile?.username}
                  className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-red-500/30 transition-all duration-300"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`rounded-2xl px-4 py-3 transition-all duration-300 group-hover:scale-[1.02] ${
                  theme === 'dark' ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <button 
                      onClick={() => handleViewProfile(comment.profile?.profileid)}
                      className={`font-bold text-sm hover:underline cursor-pointer ${
                        theme === 'dark' ? 'text-white hover:text-red-400' : 'text-gray-900 hover:text-red-600'
                      }`}
                    >
                      @{comment.profile?.username}
                    </button>
                    {comment.profile?.isVerified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <span className={`text-xs ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {comment.comment}
                  </p>
                </div>
                <div className="flex items-center space-x-6 mt-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => likeComment(comment.commentid)}
                    className={`flex items-center space-x-2 text-xs font-medium transition-all duration-300 ${
                      comment.isLikedByUser
                        ? 'text-red-500'
                        : theme === 'dark' ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${comment.isLikedByUser ? 'fill-current' : ''}`} />
                    <span>{comment.likeCount || 0}</span>
                  </motion.button>
                  <button 
                    onClick={() => startReply(comment.commentid)}
                    className={`text-xs font-medium transition-colors ${
                      theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                    }`}>
                    Reply
                  </button>
                </div>

                {/* Reply Interface */}
                {replyingTo === comment.commentid && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 mt-3 p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600"
                  >
                    {/* Reply Emoji Picker */}
                    {showReplyEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`mb-3 p-3 rounded-lg max-h-32 overflow-y-auto ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        }`}
                      >
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.slice(0, 32).map((emoji) => (
                            <motion.button
                              key={emoji}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addReplyEmoji(emoji)}
                              className="text-lg hover:bg-red-500/10 transition-all p-1 rounded"
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                        className={`p-2 rounded-full transition-colors ${
                          showReplyEmojiPicker
                            ? 'text-red-500'
                            : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addReply(comment.commentid)}
                        placeholder={`Replying to @${comment.profile?.username}...`}
                        className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addReply(comment.commentid)}
                        disabled={!replyText.trim()}
                        className={`p-2 rounded-full transition-colors ${
                          replyText.trim()
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : theme === 'dark'
                            ? 'bg-gray-700 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={cancelReply}
                        className={`p-2 rounded-full transition-colors ${
                          theme === 'dark' 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Nested Replies Display */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    {comment.replies.map((reply, replyIndex) => (
                      <motion.div
                        key={reply.commentid}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: replyIndex * 0.05 }}
                        className="flex space-x-2 group"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={reply.profile?.profilePic || '/default-avatar.png'}
                            alt={reply.profile?.username}
                            className="w-8 h-8 rounded-full border border-transparent group-hover:border-red-500/30 transition-all duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`rounded-lg px-3 py-2 transition-all duration-300 group-hover:scale-[1.01] ${
                            theme === 'dark' ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-gray-100/60 hover:bg-gray-100'
                          }`}>
                            <div className="flex items-center space-x-1 mb-1">
                              <button 
                                onClick={() => handleViewProfile(reply.profile?.profileid)}
                                className={`font-semibold text-xs hover:underline ${
                                  theme === 'dark' ? 'text-white hover:text-red-400' : 'text-gray-900 hover:text-red-600'
                                }`}
                              >
                                @{reply.profile?.username}
                              </button>
                              {reply.profile?.isVerified && (
                                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <span className={`text-xs ${
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className={`text-xs leading-relaxed ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {reply.comment}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 ml-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => likeComment(reply.commentid)}
                              className={`flex items-center space-x-1 text-xs font-medium transition-all duration-300 ${
                                reply.isLikedByUser
                                  ? 'text-red-500'
                                  : theme === 'dark' ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${reply.isLikedByUser ? 'fill-current' : ''}`} />
                              <span>{reply.likeCount || 0}</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comment Input */}
        <div className={`border-t p-5 ${
          theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`mb-4 p-4 rounded-2xl max-h-48 overflow-y-auto shadow-lg border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addEmoji(emoji)}
                    className="text-2xl hover:bg-red-500/10 transition-all p-2 rounded-lg"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <img
                src={user?.profilePic || '/default-avatar.png'}
                alt={user?.username || 'You'}
                className="w-10 h-10 rounded-full border-2 border-gray-300"
              />
            </div>
            <div className="flex-1">
              <div className={`relative rounded-2xl border-2 transition-all duration-300 ${
                newComment.trim() 
                  ? theme === 'dark' 
                    ? 'border-red-500/50 bg-gray-800' 
                    : 'border-red-500/50 bg-white'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800 focus-within:border-red-500/50'
                    : 'border-gray-300 bg-white focus-within:border-red-500/50'
              }`}>
                <div className="flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-3 rounded-full transition-colors ${
                      showEmojiPicker
                        ? 'text-red-500'
                        : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Smile className="w-5 h-5" />
                  </motion.button>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    placeholder="Add a comment..."
                    className={`flex-1 px-2 py-3 bg-transparent focus:outline-none text-sm ${
                      theme === 'dark'
                        ? 'text-white placeholder-gray-400'
                        : 'text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <motion.button
                    whileHover={{ scale: newComment.trim() ? 1.1 : 1 }}
                    whileTap={{ scale: newComment.trim() ? 0.9 : 1 }}
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className={`p-3 m-1 rounded-full transition-all duration-300 ${
                      newComment.trim()
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

