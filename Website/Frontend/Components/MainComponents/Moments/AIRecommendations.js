"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Star, 
  Flag,
  AlertTriangle,
  X,
  ChevronRight
} from 'lucide-react';

export default function AIRecommendations({ theme, currentUser }) {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('');

  // AI-powered recommendations (mock data - replace with real AI recommendations)
  const recommendations = [
    {
      id: 1,
      type: 'trending',
      title: 'Trending Topics',
      description: 'Based on your interests',
      items: ['#SunsetVibes', '#TechLife', '#CreativeCode', '#NatureLove'],
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 2,
      type: 'creators',
      title: 'Recommended Creators',
      description: 'You might enjoy',
      items: ['@tech_guru', '@nature_explorer', '@creative_mind', '@dev_life'],
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 3,
      type: 'popular',
      title: 'Popular Right Now',
      description: 'What everyone\'s watching',
      items: ['Morning Routines', 'Tech Reviews', 'Art Tutorials', 'Travel Vlogs'],
      icon: <Star className="w-5 h-5" />
    }
  ];

  const reportReasons = [
    { id: 'spam', label: 'Spam or misleading content' },
    { id: 'harassment', label: 'Harassment or bullying' },
    { id: 'inappropriate', label: 'Inappropriate content' },
    { id: 'violence', label: 'Violence or dangerous content' },
    { id: 'copyright', label: 'Copyright infringement' },
    { id: 'fake', label: 'False information' },
    { id: 'other', label: 'Other' }
  ];

  const handleReport = () => {
    if (selectedReportReason) {
      // Handle report submission
      console.log('Report submitted:', selectedReportReason);
      setShowReportModal(false);
      setSelectedReportReason('');
      // Show success message
    }
  };

  return (
    <>
      {/* AI Recommendations Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowRecommendations(!showRecommendations)}
        className="fixed top-20 right-4 z-30 p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg backdrop-blur-md hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Report Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowReportModal(true)}
        className="fixed top-36 right-4 z-30 p-3 rounded-full bg-red-500/80 text-white backdrop-blur-md hover:bg-red-600/80 transition-all duration-300"
      >
        <Flag className="w-6 h-6" />
      </motion.button>

      {/* AI Recommendations Panel */}
      <AnimatePresence>
        {showRecommendations && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 right-0 h-full w-80 z-40 ${
              theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
            } backdrop-blur-xl shadow-2xl border-l ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            } flex flex-col`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    AI Recommendations
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Personalized for you
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowRecommendations(false)}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Recommendations Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {recommendations.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: category.id * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    theme === 'dark' 
                      ? 'border-gray-700 bg-gray-800/50' 
                      : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      category.type === 'trending' ? 'bg-orange-500/20 text-orange-500' :
                      category.type === 'creators' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-purple-500/20 text-purple-500'
                    }`}>
                      {category.icon}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {category.title}
                      </h4>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {category.items.map((item, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ x: 5 }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                          theme === 'dark' 
                            ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
                            : 'hover:bg-white text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-sm font-medium">{item}</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* AI Insights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`p-4 rounded-xl border-2 border-dashed ${
                  theme === 'dark' 
                    ? 'border-purple-500/50 bg-purple-500/5' 
                    : 'border-purple-300/50 bg-purple-50/50'
                }`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    AI Insights
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    You've been most active during evening hours and prefer creative content. 
                    Try exploring art tutorials for better engagement!
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`w-full max-w-md ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-white'
              } rounded-2xl shadow-2xl overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-red-500/20">
                    <Flag className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Report Content
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowReportModal(false)}
                  className={`p-2 rounded-full transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className={`flex items-start space-x-3 p-4 rounded-lg mb-6 ${
                  theme === 'dark' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Help us keep the community safe
                    </p>
                    <p className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Your report will be reviewed by our moderation team
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label className={`block text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Why are you reporting this content?
                  </label>
                  {reportReasons.map((reason) => (
                    <motion.button
                      key={reason.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedReportReason(reason.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedReportReason === reason.id
                          ? theme === 'dark'
                            ? 'border-red-500 bg-red-500/10 text-white'
                            : 'border-red-500 bg-red-50 text-gray-900'
                          : theme === 'dark'
                            ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50 text-gray-300'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-700'
                      }`}
                    >
                      {reason.label}
                    </motion.button>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReportModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReport}
                    disabled={!selectedReportReason}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedReportReason
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Submit Report
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
