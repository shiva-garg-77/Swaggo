"use client";

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useTheme } from '../../Helper/ThemeProvider';
import { useAuth } from '../../Helper/AuthProvider';
import { 
  GET_POST_COMMENTS, 
  CREATE_COMMENT, 
  TOGGLE_COMMENT_LIKE,
  SEARCH_USERS 
} from '../../../lib/graphql/queries';

export default function InstagramStyleCommentSection({ 
  postId, 
  className = "",
  theme: propTheme,
  onCommentUpdate 
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const actualTheme = propTheme || theme;
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const inputRef = useRef(null);

  // Fetch comments
  const { data, loading, error, refetch } = useQuery(GET_POST_COMMENTS, {
    variables: { postid: postId },
    skip: !postId,
    errorPolicy: 'all'
  });

  const comments = data?.getCommentsByPost || [];

  // Mutations
  const [createComment] = useMutation(CREATE_COMMENT);
  const [toggleCommentLike] = useMutation(TOGGLE_COMMENT_LIKE);
  const [searchUsers] = useMutation(SEARCH_USERS);

  // Group comments Instagram-style: main comments and their replies in sequence
  const groupedComments = useCallback(() => {
    const mainComments = comments.filter(c => !c.isReply);
    const replies = comments.filter(c => c.isReply);
    
    const grouped = [];
    
    mainComments.forEach(comment => {
      grouped.push(comment);
      // Add replies immediately after the main comment
      const commentReplies = replies.filter(r => 
        r.originalCommentId === comment.commentid
      ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      grouped.push(...commentReplies);
    });
    
    return grouped;
  }, [comments]);

  // Handle mention detection in input
  const handleInputChange = async (value) => {
    setNewComment(value);
    
    // Check for @ mentions
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionPosition(mentionMatch.index);
      
      if (query.length > 0) {
        try {
          const { data } = await searchUsers({
            variables: { query, limit: 5 }
          });
          setUserSuggestions(data?.searchUsers || []);
          setShowUserSuggestions(true);
        } catch (err) {
          console.error('Error searching users:', err);
          setUserSuggestions([]);
        }
      } else {
        setUserSuggestions([]);
        setShowUserSuggestions(true);
      }
    } else {
      setShowUserSuggestions(false);
      setUserSuggestions([]);
    }
  };

  // Handle user mention selection
  const handleUserMention = (username) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterMention = newComment.substring(inputRef.current?.selectionStart || newComment.length);
    const newValue = `${beforeMention}@${username} ${afterMention}`;
    
    setNewComment(newValue);
    setShowUserSuggestions(false);
    setUserSuggestions([]);
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = beforeMention.length + username.length + 2;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 100);
  };

  // Handle new comment
  const handleCreateComment = async () => {
    if (!newComment.trim() || !user?.profileid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        postid: postId,
        profileid: user.profileid,
        comment: newComment.trim()
      };

      // Add reply data if replying
      if (replyingTo) {
        commentData.replyToUserId = replyingTo.profile.profileid;
        commentData.replyToUsername = replyingTo.profile.username;
        commentData.originalCommentId = replyingTo.isReply ? replyingTo.originalCommentId : replyingTo.commentid;
      }

      await createComment({
        variables: commentData
      });
      
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

  // Render comment text with mention highlights
  const renderCommentText = (commentText, mentionedUsers = []) => {
    let text = commentText;
    
    // Highlight mentioned users
    mentionedUsers.forEach(mention => {
      const mentionRegex = new RegExp(`@${mention.username}`, 'gi');
      text = text.replace(mentionRegex, `<span class="text-blue-500 font-medium cursor-pointer hover:underline">@${mention.username}</span>`);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

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

  if (loading) return <div className="text-center py-4">Loading comments...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error loading comments</div>;

  return (
    <div className={`${className} relative`}>
      {/* Comments list - Instagram flat style */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {groupedComments().length > 0 ? (
          groupedComments().map((comment) => (
            <div
              key={comment.commentid}
              className={`flex items-start space-x-3 ${
                comment.isReply ? 'ml-8 opacity-95' : ''
              } group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors px-3 py-2 rounded-lg`}
            >
              <img
                src={comment.profile?.profilePic || '/default-profile.svg'}
                alt={comment.profile?.username || 'User'}
                className={`rounded-full object-cover ${
                  comment.isReply ? 'w-7 h-7' : 'w-8 h-8'
                }`}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start flex-wrap">
                  <span className={`font-semibold text-sm mr-2 ${
                    actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {comment.profile?.username || 'Unknown User'}
                  </span>
                  
                  {comment.isReply && comment.replyToUsername && (
                    <span className="text-blue-500 text-sm mr-2">
                      @{comment.replyToUsername}
                    </span>
                  )}
                  
                  <div className={`text-sm flex-1 break-words ${
                    actualTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {renderCommentText(comment.comment, comment.mentionedUsers)}
                  </div>
                </div>
                
                {/* Comment actions */}
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`text-xs ${
                    actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {timeAgo(comment.createdAt)}
                  </span>
                  
                  {comment.likeCount > 0 && (
                    <span className={`text-xs font-medium ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {comment.likeCount} {comment.likeCount === 1 ? 'like' : 'likes'}
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleReply(comment)}
                    disabled={!user?.profileid}
                    className={`text-xs font-medium transition-colors ${
                      actualTheme === 'dark' 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-500 hover:text-gray-700'
                    } ${!user?.profileid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Reply
                  </button>
                </div>
              </div>
              
              {/* Like button */}
              <button
                onClick={() => handleCommentLike(comment.commentid)}
                disabled={!user?.profileid}
                className={`p-1 transition-colors opacity-0 group-hover:opacity-100 ${
                  comment.isLikedByUser ? 'opacity-100' : ''
                } ${!user?.profileid ? 'cursor-not-allowed' : ''}`}
              >
                <svg 
                  className={`w-3 h-3 transition-colors ${
                    comment.isLikedByUser 
                      ? 'text-red-500 fill-current' 
                      : actualTheme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                  }`} 
                  fill={comment.isLikedByUser ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
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

      {/* Reply indicator */}
      {replyingTo && (
        <div className={`px-4 py-2 border-t border-b ${
          actualTheme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${
              actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Replying to <span className="font-semibold text-blue-500">@{replyingTo.profile?.username}</span>
            </p>
            <button
              onClick={() => {
                setReplyingTo(null);
                setNewComment('');
              }}
              className={`text-sm px-2 py-1 rounded transition-colors ${
                actualTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* User suggestions dropdown */}
      {showUserSuggestions && userSuggestions.length > 0 && (
        <div className={`absolute bottom-full left-0 right-0 mb-2 ${
          actualTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10`}>
          {userSuggestions.map((suggestedUser) => (
            <button
              key={suggestedUser.profileid}
              onClick={() => handleUserMention(suggestedUser.username)}
              className={`flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              <img
                src={suggestedUser.profilePic || '/default-profile.svg'}
                alt={suggestedUser.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <div className="font-medium">{suggestedUser.username}</div>
                {suggestedUser.name && (
                  <div className="text-sm text-gray-500">{suggestedUser.name}</div>
                )}
              </div>
              {suggestedUser.isVerified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Comment input - Instagram style */}
      <div className={`flex items-center space-x-3 px-4 py-3 border-t ${
        actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <img
          src={user?.profilePic || '/default-profile.svg'}
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 flex items-center relative">
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => handleInputChange(e.target.value)}
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
              className="text-blue-500 hover:text-blue-600 font-semibold text-sm px-2 py-1 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
