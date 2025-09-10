"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';

export default function SettingsBox({ onClose, userProfile }) {
  const { theme } = useTheme();
  const [activeSettings, setActiveSettings] = useState({
    notifications: true,
    privateAccount: false,
    allowMessages: 'everyone',
    showActivity: true,
    twoFactor: false
  });

  const [expandedSection, setExpandedSection] = useState(null);

  // Sample user data - replace with actual user data
  const defaultProfile = {
    profilePicture: '/default-profile.svg',
    username: 'johndoe',
    displayName: 'John Doe',
    email: 'john@example.com'
  };

  const profile = userProfile || defaultProfile;

  const settingsItems = [
    {
      id: 'account',
      title: 'Account',
      subtitle: 'Privacy, security, password',
      icon: <UserIcon />,
      color: 'from-blue-400 to-blue-600',
      hasToggle: false,
      action: () => console.log('Account settings')
    },
    {
      id: 'messages',
      title: 'Manage Who Can Message You',
      subtitle: 'Control your message settings',
      icon: <MessageIcon />,
      color: 'from-green-400 to-green-600',
      hasToggle: true,
      toggleKey: 'allowMessages',
      action: () => console.log('Message settings')
    },
    {
      id: 'transactions',
      title: 'Transactions',
      subtitle: 'Payment history and methods',
      icon: <CreditCardIcon />,
      color: 'from-purple-400 to-purple-600',
      hasToggle: false,
      action: () => console.log('Transaction history')
    },
    {
      id: 'restricted',
      title: 'Restricted / Unwanted Accounts',
      subtitle: 'Manage blocked and restricted users',
      icon: <ShieldIcon />,
      color: 'from-red-400 to-red-600',
      hasToggle: false,
      action: () => console.log('Restricted accounts')
    },
    {
      id: 'closeFriends',
      title: 'Close Friends',
      subtitle: 'Manage your close friends list',
      icon: <HeartIcon />,
      color: 'from-pink-400 to-pink-600',
      hasToggle: false,
      action: () => console.log('Close friends')
    },
    {
      id: 'blocked',
      title: 'Blocked Accounts',
      subtitle: 'View and manage blocked users',
      icon: <BlockIcon />,
      color: 'from-gray-400 to-gray-600',
      hasToggle: false,
      action: () => console.log('Blocked accounts')
    },
    {
      id: 'saved',
      title: 'Saved Posts',
      subtitle: 'Your saved content collection',
      icon: <BookmarkIcon />,
      color: 'from-yellow-400 to-yellow-600',
      hasToggle: false,
      action: () => console.log('Saved posts')
    },
    {
      id: 'liked',
      title: 'Liked Posts',
      subtitle: 'Posts you have liked',
      icon: <HeartFilledIcon />,
      color: 'from-rose-400 to-rose-600',
      hasToggle: false,
      action: () => console.log('Liked posts')
    },
    {
      id: 'tags',
      title: 'Tags & Mentions',
      subtitle: 'Manage how you are tagged',
      icon: <AtIcon />,
      color: 'from-indigo-400 to-indigo-600',
      hasToggle: true,
      toggleKey: 'showActivity',
      action: () => console.log('Tags & mentions')
    },
    {
      id: 'privacy',
      title: 'Privacy & Policy',
      subtitle: 'Terms, privacy, and data policy',
      icon: <LockIcon />,
      color: 'from-teal-400 to-teal-600',
      hasToggle: false,
      action: () => console.log('Privacy policy')
    },
    {
      id: 'contact',
      title: 'Contact Us',
      subtitle: 'Get help and support',
      icon: <SupportIcon />,
      color: 'from-orange-400 to-orange-600',
      hasToggle: false,
      action: () => console.log('Contact support')
    }
  ];

  const handleToggleChange = (key, value) => {
    setActiveSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
            : 'bg-gradient-to-br from-white to-gray-50'
        }`}
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className={`px-6 py-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeftIcon />
              </motion.button>
              <h1 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Settings
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Profile Section */}
          <motion.div 
            variants={itemVariants}
            className="p-6"
          >
            <div className={`rounded-2xl p-6 ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-gray-700 to-gray-800' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50'
            } border ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <img
                    src={profile.profilePicture}
                    alt={profile.displayName}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </motion.div>
                
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {profile.displayName}
                  </h3>
                  <p className={`${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    @{profile.username}
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => console.log('Edit profile')}
                >
                  Edit Profile
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Settings Items */}
          <div className="px-6 pb-6 space-y-4">
            {settingsItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                className={`rounded-2xl border transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                } shadow-lg hover:shadow-xl cursor-pointer overflow-hidden`}
                onClick={item.action}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Icon with gradient background */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                        <div className="text-white text-xl">
                          {item.icon}
                        </div>
                      </div>
                      
                      {/* Text Content */}
                      <div>
                        <h3 className={`font-semibold text-lg ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Toggle or Arrow */}
                    <div className="flex items-center space-x-3">
                      {item.hasToggle ? (
                        <ToggleSwitch
                          checked={activeSettings[item.toggleKey]}
                          onChange={(value) => handleToggleChange(item.toggleKey, value)}
                          theme={theme}
                        />
                      ) : (
                        <motion.div
                          whileHover={{ x: 5 }}
                          className={`${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          <ChevronRightIcon />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtle gradient overlay on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, theme }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
        checked
          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
          : theme === 'dark'
          ? 'bg-gray-600'
          : 'bg-gray-300'
      }`}
    >
      <motion.span
        layout
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </motion.button>
  );
}

// Icon Components
function ArrowLeftIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9ZM19 9H17V7H15V9H13V11H15V13H17V11H19V9Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 8H4V6H20V8Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM4 12C4 7.58 7.58 4 12 4C13.85 4 15.55 4.63 16.9 5.69L5.69 16.9C4.63 15.55 4 13.85 4 12ZM12 20C10.15 20 8.45 19.37 7.1 18.31L18.31 7.1C19.37 8.45 20 10.15 20 12C20 16.42 16.42 20 12 20Z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C13.75 22 15.36 21.44 16.74 20.47L15.46 19.18C14.5 19.73 13.28 20 12 20C7.59 20 4 16.41 4 12S7.59 4 12 4S20 7.59 20 12V13.5C20 14.61 19.11 15.5 18 15.5S16 14.61 16 13.5V12C16 9.79 14.21 8 12 8S8 9.79 8 12S9.79 16 12 16C13.11 16 14.11 15.5 14.83 14.75C15.17 15.52 16 16 16.99 16C17.38 16 17.74 15.95 18.07 15.86C19.2 15.55 20 14.55 20 13.5V12C20 6.48 15.52 2 12 2ZM12 14C10.9 14 10 13.1 10 12S10.9 10 12 10S14 10.9 14 12S13.1 14 12 14Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.4 7 14.8 8.6 14.8 10V11H16V16H8V11H9.2V10C9.2 8.6 10.6 7 12 7ZM12 8.2C11.2 8.2 10.4 8.7 10.4 10V11H13.6V10C13.6 8.7 12.8 8.2 12 8.2Z" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 2H5C3.9 2 3 2.9 3 4V18C3 19.1 3.9 20 5 20H9L12 23L15 20H19C20.1 20 21 19.1 21 18V4C21 2.9 20.1 2 19 2ZM13 18H11V16H13V18ZM15.07 10.25L14.17 11.17C13.45 11.9 13 12.5 13 14H11V13.5C11 12.4 11.45 11.4 12.17 10.67L13.41 9.41C13.78 9.05 14 8.55 14 8C14 6.9 13.1 6 12 6S10 6.9 10 8H8C8 5.79 9.79 4 12 4S16 5.79 16 8C16 8.88 15.64 9.68 15.07 10.25Z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
