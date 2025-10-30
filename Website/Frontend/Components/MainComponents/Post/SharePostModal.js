'use client';

import { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, Linkedin, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Share Post Modal
 * Multi-platform sharing functionality
 */
export default function SharePostModal({ post, isOpen, onClose, theme = 'light' }) {
  const [copied, setCopied] = useState(false);

  const isDark = theme === 'dark';
  const postUrl = `${window.location.origin}/post/${post?.postid}`;
  const shareText = post?.caption?.slice(0, 100) || 'Check out this post!';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareOptions = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-blue-400 hover:bg-blue-500',
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`,
          '_blank',
          'width=600,height=400'
        );
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
          '_blank',
          'width=600,height=400'
        );
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
          '_blank',
          'width=600,height=400'
        );
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`,
          '_blank'
        );
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent('Check out this post')}&body=${encodeURIComponent(shareText + '\n\n' + postUrl)}`;
      }
    }
  ];

  // Native Share API (if available)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Post',
          text: shareText,
          url: postUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`rounded-lg shadow-xl max-w-md w-full ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Share Post
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Post Preview */}
          <div className={`p-3 rounded-lg border ${
            isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex gap-3">
              {post.mediaUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={post.mediaUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm line-clamp-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {post.caption || 'No caption'}
                </p>
              </div>
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Post Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={postUrl}
                readOnly
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  copied
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Share via
            </label>
            <div className="grid grid-cols-3 gap-3">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className={`${option.color} text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Native Share (if available) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className={`w-full py-3 rounded-lg border-2 border-dashed transition-colors ${
                isDark
                  ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              More sharing options...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
