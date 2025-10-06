"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@apollo/client/react';
import { 
  X, 
  Flag, 
  Link, 
  Eye, 
  EyeOff, 
  UserX, 
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { TOGGLE_FOLLOW_USER } from '../../../lib/graphql/queries';
import { useState } from 'react';

export default function MoreOptionsModal({ isOpen, onClose, reel, theme, user, onBlockUser, onRestrictUser }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [toggleFollow] = useMutation(TOGGLE_FOLLOW_USER);
  
  if (!isOpen || !reel) return null;

  const options = [
    {
      id: 'report',
      label: 'Report',
      icon: <Flag className="w-5 h-5" />,
      color: 'text-red-500',
      action: () => handleReport()
    },
    {
      id: 'copy',
      label: 'Copy Link',
      icon: <Link className="w-5 h-5" />,
      color: 'text-blue-500',
      action: () => handleCopyLink()
    },
    {
      id: 'not-interested',
      label: 'Not Interested',
      icon: <EyeOff className="w-5 h-5" />,
      color: 'text-gray-500',
      action: () => handleNotInterested()
    },
    {
      id: 'restrict',
      label: `Restrict @${reel.profile?.username}`,
      icon: <EyeOff className="w-5 h-5" />,
      color: 'text-orange-500',
      action: () => handleRestrict()
    },
    {
      id: 'block',
      label: `Block @${reel.profile?.username}`,
      icon: <UserX className="w-5 h-5" />,
      color: 'text-red-500',
      action: () => handleBlock()
    },
    {
      id: 'download',
      label: 'Save Video',
      icon: <Download className="w-5 h-5" />,
      color: 'text-green-500',
      action: () => handleDownload()
    },
    {
      id: 'view-profile',
      label: `View Profile`,
      icon: <ExternalLink className="w-5 h-5" />,
      color: 'text-purple-500',
      action: () => handleViewProfile()
    }
  ];

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReport = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call for reporting
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('Content reported successfully. Thank you for helping keep our community safe.', 'success');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      showMessage('Failed to report content. Please try again.', 'error');
    }
    setIsProcessing(false);
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/reel/${reel.postid}`;
      await navigator.clipboard.writeText(url);
      showMessage('Link copied to clipboard!', 'success');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
      showMessage('Failed to copy link. Please try again.', 'error');
    }
  };

  const handleNotInterested = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call for 'not interested' feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      showMessage('Thank you for your feedback. We\'ll show you fewer posts like this.', 'success');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      showMessage('Failed to save your preference. Please try again.', 'error');
    }
    setIsProcessing(false);
  };

  const handleRestrict = async () => {
    if (!user?.profileid) {
      showMessage('Please log in to restrict users.', 'error');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onRestrictUser(reel);
      showMessage(`@${reel.profile?.username} has been restricted.`, 'success');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      showMessage('Failed to restrict user. Please try again.', 'error');
    }
    setIsProcessing(false);
  };

  const handleBlock = async () => {
    if (!user?.profileid) {
      showMessage('Please log in to block users.', 'error');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onBlockUser(reel);
      showMessage(`@${reel.profile?.username} has been blocked successfully.`, 'success');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      showMessage('Failed to block user. Please try again.', 'error');
    }
    setIsProcessing(false);
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      // Create download link for video
      const link = document.createElement('a');
      link.href = reel.postUrl;
      link.download = `reel_${reel.postid}.mp4`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
      
      showMessage('Download started successfully!', 'success');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Download failed:', error);
      showMessage('Failed to download video. Please try again.', 'error');
    }
    setIsProcessing(false);
  };

  const handleViewProfile = () => {
    if (reel.profile?.profileid) {
      window.location.href = `/profile/${reel.profile.profileid}`;
    } else {
      showMessage('Profile not found.', 'error');
    }
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
          <div className={`flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  More Options
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  @{reel.profile?.username}
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

          {/* Message Display */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mx-4 mb-4 p-4 rounded-xl border ${
                message.type === 'success'
                  ? theme === 'dark'
                    ? 'bg-green-900/20 border-green-700/50 text-green-400'
                    : 'bg-green-50 border-green-200 text-green-700'
                  : theme === 'dark'
                    ? 'bg-red-900/20 border-red-700/50 text-red-400'
                    : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </motion.div>
          )}

          {/* Options List */}
          <div className="p-4">
            <div className="space-y-2">
              {options.map((option, index) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={option.action}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : theme === 'dark' 
                        ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={option.color}>
                      {option.icon}
                    </div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </span>
                  </div>
                  {isProcessing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Warning for destructive actions */}
            <div className={`mt-4 p-3 rounded-lg ${
              theme === 'dark' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Report inappropriate content
                  </p>
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Help us keep the community safe by reporting violations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
