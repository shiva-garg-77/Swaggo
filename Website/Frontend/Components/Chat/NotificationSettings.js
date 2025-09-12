'use client';

import React, { useState, useEffect } from 'react';
import notificationService from '../Helper/NotificationService';

export default function NotificationSettings({ isOpen, onClose }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [testSoundPlaying, setTestSoundPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load current settings
      setSoundEnabled(notificationService.isSoundEnabled());
      setNotificationPermission(notificationService.permission);
    }
  }, [isOpen]);

  const handleSoundToggle = (enabled) => {
    setSoundEnabled(enabled);
    notificationService.setSoundEnabled(enabled);
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(notificationService.permission);
    
    if (granted) {
      // Show test notification
      notificationService.showNotification('Notifications Enabled!', {
        body: 'You will now receive chat notifications',
        icon: '/icons/chat-icon-192.png'
      });
    }
  };

  const testSound = () => {
    setTestSoundPlaying(true);
    notificationService.playNotificationSound();
    
    setTimeout(() => {
      setTestSoundPlaying(false);
    }, 1000);
  };

  const testNotification = () => {
    notificationService.showNotification('Test Notification', {
      body: 'This is a test notification from Swaggo Chat',
      icon: '/icons/message-icon-192.png'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Browser Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Browser Notifications
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Permission Status: 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    notificationPermission === 'granted' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : notificationPermission === 'denied'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {notificationPermission}
                  </span>
                </div>
                {notificationPermission === 'denied' && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Please enable notifications in your browser settings
                  </div>
                )}
              </div>
              
              {notificationPermission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Enable
                </button>
              )}
            </div>

            {notificationPermission === 'granted' && (
              <button
                onClick={testNotification}
                className="mt-2 text-sm text-red-500 hover:text-red-600 underline"
              >
                Test Notification
              </button>
            )}
          </div>

          {/* Sound Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Sound Notifications
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Play notification sound
                </span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => handleSoundToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>

            {soundEnabled && (
              <button
                onClick={testSound}
                disabled={testSoundPlaying}
                className="mt-2 text-sm text-red-500 hover:text-red-600 underline disabled:opacity-50"
              >
                {testSoundPlaying ? 'Playing...' : 'Test Sound'}
              </button>
            )}
          </div>

          {/* Additional Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Tips
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Notifications only appear when the chat is not active</span>
              </div>
              
              <div className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sound alerts play even when notifications are disabled</span>
              </div>
              
              <div className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Click notification to jump directly to the conversation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
