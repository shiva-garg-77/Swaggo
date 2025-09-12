"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import MomentsComments from './MomentsComments';

export default function CommentPanel({ isOpen, onClose, moment, theme }) {
  console.log('📱 CommentPanel rendered with:', { isOpen, moment: moment?.id, theme });

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
                Comments
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

        {/* Comments with Reply Functionality */}
        <div className="flex-1">
          <MomentsComments
            postId={moment?.id?.toString()}
            theme={theme}
            className="h-full"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
