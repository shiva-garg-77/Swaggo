'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, TrendingUp, Play } from 'lucide-react';

/**
 * Trending Grid Component
 * Masonry grid layout for trending posts
 */
export default function TrendingGrid({ posts, theme = 'light' }) {
  const router = useRouter();
  const [hoveredPost, setHoveredPost] = useState(null);

  const isDark = theme === 'dark';

  const handlePostClick = (postId) => {
    router.push(`/post/${postId}`);
  };

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No trending posts yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {posts.map((post, index) => (
        <div
          key={post.postid}
          onClick={() => handlePostClick(post.postid)}
          onMouseEnter={() => setHoveredPost(post.postid)}
          onMouseLeave={() => setHoveredPost(null)}
          className="relative aspect-square cursor-pointer group overflow-hidden"
        >
          {/* Post Image/Video */}
          <div className="w-full h-full">
            {post.postType === 'video' ? (
              <div className="relative w-full h-full">
                <img
                  src={post.postUrl}
                  alt={post.title || 'Post'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Play className="w-6 h-6 text-white drop-shadow-lg" fill="white" />
                </div>
              </div>
            ) : (
              <img
                src={post.postUrl}
                alt={post.title || 'Post'}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Trending Badge */}
          {index < 3 && (
            <div className="absolute top-2 left-2 z-10">
              <div className={`px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                  : index === 1
                  ? 'bg-gradient-to-r from-gray-300 to-gray-500'
                  : 'bg-gradient-to-r from-orange-400 to-orange-600'
              }`}>
                <TrendingUp className="w-3 h-3" />
                #{index + 1}
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className={`
            absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
            transition-opacity duration-200 flex items-center justify-center
            ${hoveredPost === post.postid ? 'opacity-100' : ''}
          `}>
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-1">
                <Heart className="w-5 h-5" fill="white" />
                <span className="font-semibold">{formatNumber(post.likeCount || 0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-5 h-5" fill="white" />
                <span className="font-semibold">{formatNumber(post.commentCount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Multiple Images Indicator */}
          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{post.images.length}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper function to format numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
