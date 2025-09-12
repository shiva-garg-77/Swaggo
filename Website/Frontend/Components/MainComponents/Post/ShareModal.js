'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ShareModal = ({ isOpen, onClose, post, theme = 'light' }) => {
  const [copied, setCopied] = useState(false);
  
  // Generate share data
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.caption || 'Check out this post!';
  const shareDescription = post?.description || 'Amazing content shared on our platform';

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }, [shareUrl]);

  const shareViaWebAPI = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareDescription,
        url: shareUrl,
      }).catch(err => console.log('Error sharing:', err));
    }
  }, [shareUrl, shareTitle, shareDescription]);

  const shareToWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`${shareTitle}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [shareUrl, shareTitle]);

  const shareToTwitter = useCallback(() => {
    const text = encodeURIComponent(shareDescription);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }, [shareUrl, shareDescription]);

  const shareToFacebook = useCallback(() => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }, [shareUrl]);

  const shareToLinkedIn = useCallback(() => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  }, [shareUrl, shareTitle]);

  const shareToPinterest = useCallback(() => {
    const url = encodeURIComponent(shareUrl);
    const description = encodeURIComponent(shareDescription);
    const media = post?.postUrl ? encodeURIComponent(post.postUrl) : '';
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${description}&media=${media}`, '_blank');
  }, [shareUrl, shareDescription, post?.postUrl]);

  const shareToTelegram = useCallback(() => {
    const text = encodeURIComponent(`${shareTitle}\n\n${shareDescription}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }, [shareUrl, shareTitle, shareDescription]);

  if (!isOpen) return null;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: CopyIcon,
      action: copyToClipboard,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: copied ? 'Copied!' : 'Copy to clipboard'
    },
    ...(typeof window !== 'undefined' && navigator.share ? [{
      name: 'Share',
      icon: ShareIcon,
      action: shareViaWebAPI,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'System share menu'
    }] : []),
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      action: shareToWhatsApp,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Share on WhatsApp'
    },
    {
      name: 'Twitter',
      icon: TwitterIcon,
      action: shareToTwitter,
      color: 'bg-blue-400 hover:bg-blue-500',
      description: 'Share on Twitter'
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      action: shareToFacebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Share on Facebook'
    },
    {
      name: 'LinkedIn',
      icon: LinkedInIcon,
      action: shareToLinkedIn,
      color: 'bg-blue-700 hover:bg-blue-800',
      description: 'Share on LinkedIn'
    },
    {
      name: 'Pinterest',
      icon: PinterestIcon,
      action: shareToPinterest,
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Pin to Pinterest'
    },
    {
      name: 'Telegram',
      icon: TelegramIcon,
      action: shareToTelegram,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Share on Telegram'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`relative w-full max-w-lg mx-4 rounded-2xl shadow-xl overflow-hidden ${
            theme === 'dark' 
              ? 'bg-gray-900 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Share Post
              </h3>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Post preview */}
          <div className={`px-6 py-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-start space-x-3">
              {post?.postUrl && (
                <div className="flex-shrink-0">
                  {post.postType === 'VIDEO' ? (
                    <video 
                      src={post.postUrl} 
                      className="w-12 h-12 rounded-lg object-cover"
                      muted
                    />
                  ) : (
                    <img 
                      src={post.postUrl} 
                      alt="Post preview" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {shareTitle && (
                  <h4 className={`font-medium text-sm line-clamp-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {shareTitle}
                  </h4>
                )}
                {shareDescription && (
                  <p className={`text-sm mt-1 line-clamp-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {shareDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Share options */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-4 gap-4">
              {shareOptions.map((option) => (
                <motion.button
                  key={option.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={option.action}
                  className="flex flex-col items-center space-y-2 p-3 rounded-xl transition-colors hover:bg-opacity-10 hover:bg-gray-500"
                  title={option.description}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
                    option.color
                  }`}>
                    <option.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {option.name === 'Copy Link' && copied ? 'Copied!' : option.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* URL display */}
          <div className={`px-6 py-4 border-t ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Icon Components
function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CopyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ShareIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
  );
}

function TwitterIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LinkedInIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function PinterestIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.599 2.282-.744 2.840-.282 1.084-1.034 2.441-1.549 3.271C9.075 23.813 10.504 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-12.014C24.007 5.367 18.641.001 12.017.001z"/>
    </svg>
  );
}

function TelegramIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

export default ShareModal;
