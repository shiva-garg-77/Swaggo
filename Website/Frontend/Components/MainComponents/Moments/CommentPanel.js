"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Smile } from 'lucide-react';

export default function CommentPanel({ isOpen, onClose, moment, theme }) {
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Mock comments data - replace with real API data
  const [comments, setComments] = useState([
    {
      id: 1,
      username: 'john_doe',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
      text: 'Amazing content! 🔥',
      timestamp: '5m ago',
      likes: 12,
      isLiked: false
    },
    {
      id: 2,
      username: 'sara_jane',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b742?w=50&h=50&fit=crop&crop=face',
      text: 'This is exactly what I needed to see today! 💫',
      timestamp: '12m ago',
      likes: 8,
      isLiked: true
    },
    {
      id: 3,
      username: 'dev_master',
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=50&h=50&fit=crop&crop=face',
      text: 'Love the creativity here! Keep it up 👏',
      timestamp: '1h ago',
      likes: 15,
      isLiked: false
    },
    {
      id: 4,
      username: 'creative_soul',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      text: 'Absolutely stunning! The colors are perfect 🎨',
      timestamp: '2h ago',
      likes: 23,
      isLiked: true
    }
  ]);

  // Common emoji picker
  const emojis = ['😊', '😍', '🔥', '💯', '👏', '❤️', '💫', '🎉', '🚀', '✨', '💖', '🌟'];

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        username: 'you',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
        text: newComment,
        timestamp: 'now',
        likes: 0,
        isLiked: false
      };
      setComments([comment, ...comments]);
      setNewComment('');
    }
  };

  const addEmoji = (emoji) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleCommentLike = (commentId) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
            }
          : comment
      )
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        } shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <img
              src={moment.avatar}
              alt={moment.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Comments
              </h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {comments.length} comments
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
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex space-x-3"
            >
              <img
                src={comment.avatar}
                alt={comment.username}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <div className={`bg-${theme === 'dark' ? 'gray-800' : 'gray-100'} rounded-2xl px-3 py-2`}>
                  <p className={`font-semibold text-sm ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {comment.username}
                  </p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {comment.text}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {comment.timestamp}
                  </span>
                  <button
                    onClick={() => toggleCommentLike(comment.id)}
                    className={`flex items-center space-x-1 text-xs ${
                      comment.isLiked
                        ? 'text-red-500'
                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comment Input */}
        <div className={`border-t p-4 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`mb-3 p-3 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <div className="grid grid-cols-6 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
                placeholder="Add a comment..."
                className={`w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-colors ${
                showEmojiPicker
                  ? 'bg-red-500 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-400 hover:text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={addComment}
              disabled={!newComment.trim()}
              className={`p-2 rounded-full transition-colors ${
                newComment.trim()
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
