"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Users, Star, ChevronRight, Sparkles } from 'lucide-react';

export default function ReelAI({ isOpen, onClose, theme, currentUser }) {
  // Mock recommended reels based on user behavior
  const recommendedReels = [
    {
      id: 1,
      thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6771',
      title: 'Amazing Nature Walk',
      username: '@nature_lover',
      views: '12.5K',
      duration: '0:45'
    },
    {
      id: 2,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      title: 'Coding in React',
      username: '@dev_pro',
      views: '8.2K',
      duration: '1:20'
    },
    {
      id: 3,
      thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
      title: 'Morning Workout',
      username: '@fitness_guru',
      views: '15.7K',
      duration: '0:38'
    },
    {
      id: 4,
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
      title: 'Food Recipe',
      username: '@chef_master',
      views: '22.1K',
      duration: '1:05'
    },
    {
      id: 5,
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
      title: 'Business Tips',
      username: '@entrepreneur',
      views: '9.4K',
      duration: '0:52'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 right-0 h-full w-80 z-50 ${
          theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl shadow-2xl border-l ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        } flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Recommended
              </h3>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Reels for you
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
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Recommended Reels */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {recommendedReels.map((reel, index) => (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-800 bg-gray-800/30' 
                    : 'hover:bg-gray-100 bg-gray-50/50'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={reel.thumbnail}
                    alt={reel.title}
                    className="w-16 h-20 rounded-lg object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                    {reel.duration}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h4 className={`font-medium text-sm line-clamp-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {reel.title}
                  </h4>
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {reel.username}
                  </p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`text-xs ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {reel.views} views
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Show More */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full mt-4 p-3 rounded-lg border-2 border-dashed transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-sm font-medium">Load More Recommendations</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
