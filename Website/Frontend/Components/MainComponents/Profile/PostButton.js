"use client";

import { useState } from 'react';
import CreatePostModal from '../Post/CreatePostModal';

export default function PostButton({ className, theme, size = 'default' }) {
  const [showCreatePost, setShowCreatePost] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-4 py-2 text-sm';
      case 'large':
        return 'px-8 py-4 text-lg';
      case 'default':
      default:
        return 'px-6 py-3 text-base';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowCreatePost(true)}
        className={`${getSizeClasses()} rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white' 
            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
        } ${className || ''}`}
      >
        <div className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span>Post</span>
        </div>
      </button>

      {showCreatePost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          theme={theme}
          onPostSuccess={() => {
            // Refresh the page to show new post
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
