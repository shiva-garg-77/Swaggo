"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Share2, 
  MessageCircle, 
  Mail,
  Facebook,
  Twitter,
  Instagram,
  CheckCircle
} from 'lucide-react';

export default function ShareModal({ isOpen, onClose, reel, theme }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !reel) return null;

  const shareUrl = `${window.location.origin}/post/${reel.postid}`;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: <Copy className="w-5 h-5" />,
      action: () => copyToClipboard(shareUrl),
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      name: 'Message',
      icon: <MessageCircle className="w-5 h-5" />,
      action: () => shareViaMessage(),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      action: () => shareViaEmail(),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      action: () => shareToFacebook(),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      action: () => shareToTwitter(),
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      name: 'Instagram',
      icon: <Instagram className="w-5 h-5" />,
      action: () => shareToInstagram(),
      color: 'bg-pink-500 hover:bg-pink-600'
    }
  ];

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaMessage = () => {
    const text = `Check out this amazing reel: ${reel.title}`;
    const smsUrl = `sms:?body=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    window.open(smsUrl);
  };

  const shareViaEmail = () => {
    const text = `Check out this amazing reel: ${reel.title}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(reel.title)}&body=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    window.open(emailUrl);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const text = `Check out this amazing reel: ${reel.title}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToInstagram = () => {
    copyToClipboard(shareUrl);
    alert('Link copied! You can paste it in your Instagram story or bio.');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`w-full max-w-md ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          } rounded-t-2xl shadow-2xl overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Share Reel
            </h3>
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

          {/* Content Preview */}
          <div className="p-6">
            <div className={`p-4 rounded-lg mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={reel.profile?.profilePic || '/default-avatar.png'}
                  alt={reel.profile?.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    @{reel.profile?.username}
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {new Date(reel.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {reel.title && (
                <h5 className={`font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {reel.title}
                </h5>
              )}
              {reel.Description && (
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {reel.Description}
                </p>
              )}
            </div>

            {/* Share Options Grid */}
            <div className="grid grid-cols-3 gap-4">
              {shareOptions.map((option) => (
                <motion.button
                  key={option.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={option.action}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl text-white transition-all ${option.color}`}
                >
                  {option.icon}
                  <span className="text-xs mt-2 font-medium">{option.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Copy Link Section */}
            <div className={`mt-6 p-3 rounded-lg border ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Share Link
                  </p>
                  <p className={`text-xs break-all ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {shareUrl}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(shareUrl)}
                  className={`ml-3 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {copied ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Copied!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
