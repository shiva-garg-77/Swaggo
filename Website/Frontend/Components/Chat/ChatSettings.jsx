'use client';

import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, X, Palette, Type, Bell, Shield, Eye, EyeOff, 
  Clock, VolumeX, Archive, Flag, UserX, Moon, Sun, 
  Languages, Trash2, Lock, Unlock
} from 'lucide-react';

// Chat Themes (extracted from existing component)
const CHAT_THEMES = [
  { id: 'default', name: 'Default', primary: '#EF4444', secondary: '#F3F4F6', preview: 'linear-gradient(135deg, #EF4444, #DC2626)' },
  { id: 'ocean', name: 'Ocean', primary: '#3B82F6', secondary: '#DBEAFE', preview: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  { id: 'forest', name: 'Forest', primary: '#10B981', secondary: '#D1FAE5', preview: 'linear-gradient(135deg, #10B981, #059669)' },
  { id: 'sunset', name: 'Sunset', primary: '#F59E0B', secondary: '#FEF3C7', preview: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { id: 'purple', name: 'Purple', primary: '#8B5CF6', secondary: '#EDE9FE', preview: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
  { id: 'dark', name: 'Dark', primary: '#1F2937', secondary: '#374151', preview: 'linear-gradient(135deg, #1F2937, #111827)' },
];

const FONT_SIZES = [
  { id: 'small', name: 'Small', value: '14px' },
  { id: 'medium', name: 'Medium', value: '16px' },
  { id: 'large', name: 'Large', value: '18px' },
  { id: 'extra-large', name: 'Extra Large', value: '20px' }
];

const NOTIFICATION_SOUNDS = [
  { id: 'default', name: 'Default', file: '/sounds/notification-default.mp3' },
  { id: 'bell', name: 'Bell', file: '/sounds/notification-bell.mp3' },
  { id: 'chime', name: 'Chime', file: '/sounds/notification-chime.mp3' },
  { id: 'pop', name: 'Pop', file: '/sounds/notification-pop.mp3' },
  { id: 'none', name: 'Silent', file: null }
];

const AUTO_DELETE_OPTIONS = [
  { id: 0, name: 'Off', duration: 0 },
  { id: 1, name: '1 minute', duration: 60 },
  { id: 5, name: '5 minutes', duration: 300 },
  { id: 30, name: '30 minutes', duration: 1800 },
  { id: 60, name: '1 hour', duration: 3600 },
  { id: 1440, name: '24 hours', duration: 86400 }
];

/**
 * PERFORMANCE OPTIMIZATION: Extracted ChatSettings component
 * Benefits:
 * - Reduced main component complexity
 * - Organized settings in logical groups
 * - Improved settings management
 * - Better UX with categorized settings
 */
const ChatSettings = memo(({ 
  isOpen, 
  onClose, 
  onSettingsChange,
  currentSettings = {},
  theme = 'default',
  chatInfo = {}
}) => {
  const [activeSection, setActiveSection] = useState('appearance');
  const [localSettings, setLocalSettings] = useState({
    selectedTheme: 'default',
    chatBackground: 'default',
    fontSize: 'medium',
    chatNickname: '',
    notificationSound: 'default',
    vanishMode: false,
    secretChat: false,
    screenshotDetection: true,
    autoDeleteTimer: 0,
    showTranslation: false,
    translationLanguage: 'hi',
    ...currentSettings
  });

  const sections = [
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'advanced', name: 'Advanced', icon: Settings }
  ];

  const handleSettingChange = useCallback((key, value) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      onSettingsChange?.(newSettings);
      return newSettings;
    });
  }, [onSettingsChange]);

  const playNotificationSound = useCallback((soundId) => {
    const sound = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
    if (sound?.file) {
      try {
        const audio = new Audio(sound.file);
        audio.volume = 0.5;
        audio.play();
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-2xl max-h-[90vh] m-4 rounded-xl shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-500" />
              <h2 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Chat Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex h-96">
            {/* Sidebar */}
            <div className={`w-48 border-r ${
              theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="p-2">
                {sections.map(section => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-blue-500 text-white shadow-sm'
                          : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  {/* Chat Themes */}
                  <div>
                    <h3 className={`text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Chat Theme
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {CHAT_THEMES.map(chatTheme => (
                        <button
                          key={chatTheme.id}
                          onClick={() => handleSettingChange('selectedTheme', chatTheme.id)}
                          className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                            localSettings.selectedTheme === chatTheme.id
                              ? 'border-blue-500 shadow-sm'
                              : theme === 'dark'
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded mb-1"
                            style={{ background: chatTheme.preview }}
                          />
                          <span className={`text-xs ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {chatTheme.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <h3 className={`text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Message Font Size
                    </h3>
                    <div className="space-y-2">
                      {FONT_SIZES.map(size => (
                        <button
                          key={size.id}
                          onClick={() => handleSettingChange('fontSize', size.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                            localSettings.fontSize === size.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : theme === 'dark'
                              ? 'border-gray-600 hover:bg-gray-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                            {size.name}
                          </span>
                          <span 
                            className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
                            style={{ fontSize: size.value }}
                          >
                            Sample text
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Nickname */}
                  <div>
                    <h3 className={`text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Chat Nickname
                    </h3>
                    <input
                      type="text"
                      value={localSettings.chatNickname}
                      onChange={(e) => handleSettingChange('chatNickname', e.target.value)}
                      placeholder={`Nickname for ${chatInfo.name || 'this chat'}`}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    />
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  {/* Vanish Mode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Vanish Mode
                      </h3>
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Messages disappear after being seen
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('vanishMode', !localSettings.vanishMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        localSettings.vanishMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        localSettings.vanishMode ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Secret Chat */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Secret Chat
                      </h3>
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        End-to-end encrypted messages
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('secretChat', !localSettings.secretChat)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        localSettings.secretChat ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        localSettings.secretChat ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Screenshot Detection */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Screenshot Detection
                      </h3>
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Get notified when someone screenshots
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('screenshotDetection', !localSettings.screenshotDetection)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        localSettings.screenshotDetection ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        localSettings.screenshotDetection ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Auto Delete Timer */}
                  <div>
                    <h3 className={`text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Auto Delete Messages
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {AUTO_DELETE_OPTIONS.map(option => (
                        <button
                          key={option.id}
                          onClick={() => handleSettingChange('autoDeleteTimer', option.duration)}
                          className={`p-2 text-sm rounded-lg border transition-all duration-200 ${
                            localSettings.autoDeleteTimer === option.duration
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : theme === 'dark'
                              ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  {/* Notification Sound */}
                  <div>
                    <h3 className={`text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Notification Sound
                    </h3>
                    <div className="space-y-2">
                      {NOTIFICATION_SOUNDS.map(sound => (
                        <button
                          key={sound.id}
                          onClick={() => {
                            handleSettingChange('notificationSound', sound.id);
                            playNotificationSound(sound.id);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                            localSettings.notificationSound === sound.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : theme === 'dark'
                              ? 'border-gray-600 hover:bg-gray-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                            {sound.name}
                          </span>
                          {sound.id === 'none' ? (
                            <VolumeX className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Bell className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'advanced' && (
                <div className="space-y-6">
                  {/* Translation */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Auto Translation
                      </h3>
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Automatically translate messages
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('showTranslation', !localSettings.showTranslation)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        localSettings.showTranslation ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        localSettings.showTranslation ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Translation Language */}
                  {localSettings.showTranslation && (
                    <div>
                      <h3 className={`text-sm font-medium mb-3 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Translation Language
                      </h3>
                      <select
                        value={localSettings.translationLanguage}
                        onChange={(e) => handleSettingChange('translationLanguage', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>
                  )}

                  {/* Export Chat */}
                  <button
                    onClick={() => {
                      // Implement chat export functionality
                      console.log('Exporting chat...');
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                    <span>Export Chat</span>
                  </button>

                  {/* Clear Chat */}
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear this chat? This action cannot be undone.')) {
                        // Implement clear chat functionality
                        console.log('Clearing chat...');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Chat</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

ChatSettings.displayName = 'ChatSettings';

export default ChatSettings;
export { CHAT_THEMES, FONT_SIZES, NOTIFICATION_SOUNDS, AUTO_DELETE_OPTIONS };