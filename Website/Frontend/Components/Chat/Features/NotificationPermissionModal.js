'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationPermissionModal({
  isOpen,
  onClose,
  onAllow,
  onDeny,
  theme = 'light',
  stats = {}
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showBenefits, setShowBenefits] = useState(false);

  const isDark = theme === 'dark';
  const { pendingCount = 0, isConnected = false, userName = 'User' } = stats;

  // Auto show benefits after 3 seconds
  useEffect(() => {
    if (isOpen && !showBenefits) {
      const timer = setTimeout(() => {
        setShowBenefits(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, showBenefits]);

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const granted = await onAllow();
      if (granted) {
        setCurrentStep(3); // Success step
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setCurrentStep(2); // Error step
      }
    } catch (error) {
      console.error('Permission error:', error);
      setCurrentStep(2); // Error step
    }
    setIsLoading(false);
  };

  const handleDeny = () => {
    onDeny();
  };

  const benefits = [
    {
      icon: '💬',
      title: 'Real-time Message Alerts',
      description: 'Get notified instantly when someone sends you a message',
      highlight: 'Never miss important conversations'
    },
    {
      icon: '📱',
      title: 'Works in Background',
      description: 'Receive notifications even when SwagGo is not open',
      highlight: 'Stay connected 24/7'
    },
    {
      icon: '🔇',
      title: 'Smart & Respectful',
      description: 'Notifications only when you\'re away from active chats',
      highlight: 'No spam or interruptions'
    },
    {
      icon: '⚙️',
      title: 'Full Control',
      description: 'Turn on/off anytime in settings',
      highlight: 'Your preferences matter'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-900'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className={`relative px-6 pt-6 pb-4 ${
            isDark 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
              : 'bg-gradient-to-r from-purple-500 to-blue-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Enable Chat Notifications
                  </h2>
                  <p className="text-white/80 text-sm">
                    Stay connected with {userName || 'your friends'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Connection Status */}
            <div className="mt-3 flex items-center space-x-2 text-white/90 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
              }`}></div>
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              {pendingCount > 0 && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="font-medium">{pendingCount} messages waiting</span>
                </>
              )}
            </div>
          </div>

          <div className="px-6 pb-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Main Content */}
                <div className="py-4">
                  <div className={`text-center mb-6 ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
                    <p className="text-lg mb-2">
                      Never miss a message again! 
                    </p>
                    <p className="text-sm">
                      Enable notifications to get real-time chat updates
                    </p>
                  </div>

                  {/* Benefits List */}
                  <AnimatePresence>
                    {showBenefits && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="space-y-3 mb-6"
                      >
                        {benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-start space-x-3 p-3 rounded-lg ${
                              isDark 
                                ? 'bg-gray-700/50 hover:bg-gray-700' 
                                : 'bg-gray-100/50 hover:bg-gray-100'
                            } transition-colors`}
                          >
                            <div className="text-2xl flex-shrink-0">
                              {benefit.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold text-sm mb-1 ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {benefit.title}
                              </h4>
                              <p className={`text-xs ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {benefit.description}
                              </p>
                              <p className="text-xs text-blue-500 font-medium mt-1">
                                {benefit.highlight}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Privacy Note */}
                  <div className={`text-xs text-center p-3 rounded-lg mb-6 ${
                    isDark 
                      ? 'bg-blue-900/30 text-blue-200 border border-blue-800' 
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-semibold">Privacy Protected</span>
                    </div>
                    <p>We only show sender names and basic message info. Your message content stays private.</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAllow}
                      disabled={isLoading}
                      className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none ${
                        isDark
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      } shadow-lg hover:shadow-xl`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Enabling...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>🔔</span>
                          <span>Allow Notifications</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={handleDeny}
                      disabled={isLoading}
                      className={`px-4 py-3 rounded-xl font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:transform-none ${
                        isDark
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      Later
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-6 text-center"
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Notifications Blocked
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  To enable notifications:
                </p>
                <div className={`text-left text-sm space-y-2 mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Click the lock icon in your browser's address bar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Set notifications to "Allow"</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Refresh the page</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`py-2 px-6 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  I'll Try Later
                </button>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Perfect! You're All Set 🎉
                </h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  You'll now receive real-time notifications for new messages
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Notifications Active</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom gradient decoration */}
          <div className={`h-1 ${
            isDark
              ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600'
              : 'bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500'
          }`}></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}