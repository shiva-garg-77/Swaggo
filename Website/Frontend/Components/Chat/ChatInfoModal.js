'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../Helper/ThemeProvider';

export default function ChatInfoModal({ isOpen, onClose, chat, user, onChatUpdate, onChatDelete }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('details');
  const [notifications, setNotifications] = useState(true);
  const [muteUntil, setMuteUntil] = useState(null);
  const [chatTheme, setChatTheme] = useState('default');
  const [nickname, setNickname] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [vanishMode, setVanishMode] = useState(false);

  // Initialize state from chat props
  useEffect(() => {
    if (chat) {
      setNickname(chat.nickname || '');
      setIsArchived(chat.isArchived || false);
      setIsPinned(chat.isPinned || false);
      setEncryptionEnabled(chat.encryptionEnabled || false);
    }
  }, [chat]);

  if (!isOpen || !chat) return null;

  const isGroup = chat.chatType === 'group';
  const otherParticipant = !isGroup ? chat.participants?.find(p => p.profileid !== user.profileid) : null;
  const displayName = isGroup ? (chat.chatName || 'Group Chat') : (otherParticipant?.name || otherParticipant?.username || 'Unknown User');

  const handleMute = (duration) => {
    const until = duration === 'forever' ? null : new Date(Date.now() + duration * 60 * 1000);
    setMuteUntil(until);
    setNotifications(!until || until > new Date());
  };

  const handleArchiveChat = () => {
    setIsArchived(!isArchived);
    // In a real implementation, this would call an API
    console.log(`${isArchived ? 'Unarchiving' : 'Archiving'} chat:`, chat.chatid);
  };

  const handlePinChat = () => {
    setIsPinned(!isPinned);
    // In a real implementation, this would call an API
    console.log(`${isPinned ? 'Unpinning' : 'Pinning'} chat:`, chat.chatid);
  };

  const handleEncryptionToggle = () => {
    setEncryptionEnabled(!encryptionEnabled);
    // In a real implementation, this would call an API
    console.log(`${encryptionEnabled ? 'Disabling' : 'Enabling'} encryption for chat:`, chat.chatid);
  };

  const handleVanishModeToggle = () => {
    setVanishMode(!vanishMode);
    // In a real implementation, this would call an API
    console.log(`${vanishMode ? 'Disabling' : 'Enabling'} vanish mode for chat:`, chat.chatid);
  };

  const handleSaveNickname = () => {
    // In a real implementation, this would call an API
    console.log('Saving nickname:', nickname);
    if (onChatUpdate) {
      onChatUpdate({ ...chat, nickname });
    }
  };

  const handleDeleteChat = () => {
    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      console.log('Deleting chat:', chat.chatid);
      if (onChatDelete) {
        onChatDelete(chat.chatid);
      }
      onClose();
    }
  };

  const handleBlockUser = () => {
    if (window.confirm(`Are you sure you want to block ${displayName}?`)) {
      console.log('Blocking user:', otherParticipant?.profileid);
      // In a real implementation, this would call an API
    }
  };

  const handleReportUser = () => {
    if (window.confirm(`Are you sure you want to report ${displayName}?`)) {
      console.log('Reporting user:', otherParticipant?.profileid);
      // In a real implementation, this would call an API
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'media', label: 'Media', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  const themes = [
    { id: 'default', name: 'Default', color: 'from-red-500 to-red-600' },
    { id: 'blue', name: 'Ocean Blue', color: 'from-blue-500 to-blue-600' },
    { id: 'green', name: 'Forest Green', color: 'from-green-500 to-green-600' },
    { id: 'purple', name: 'Royal Purple', color: 'from-purple-500 to-purple-600' },
    { id: 'orange', name: 'Sunset Orange', color: 'from-orange-500 to-orange-600' },
    { id: 'pink', name: 'Pink Blossom', color: 'from-pink-500 to-pink-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl h-5/6 rounded-xl shadow-xl overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Chat Information</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Section */}
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 p-1">
            <img
              src={isGroup ? chat.chatAvatar : otherParticipant?.profilePic || '/default-avatar.png'}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold mb-2">{displayName}</h3>
          {!isGroup && (
            <p className="text-gray-600 dark:text-gray-400">@{otherParticipant?.username}</p>
          )}
          {isGroup && (
            <p className="text-gray-600 dark:text-gray-400">
              {chat.participants?.length || 0} members
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {isGroup ? (
                <>
                  <div>
                    <h4 className="font-semibold mb-3">Group Description</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {chat.description || 'No description available'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Members ({chat.participants?.length || 0})</h4>
                    <div className="space-y-3">
                      {chat.participants?.map((participant) => (
                        <div key={participant.profileid} className="flex items-center space-x-3">
                          <img
                            src={participant.profilePic || '/default-avatar.png'}
                            alt={participant.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{participant.name || participant.username}</p>
                            <p className="text-sm text-gray-500">@{participant.username}</p>
                          </div>
                          {participant.isAdmin && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">About</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {otherParticipant?.bio || 'No bio available'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Phone</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {otherParticipant?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Email</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {otherParticipant?.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Last Seen</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {otherParticipant?.lastSeen ? new Date(otherParticipant.lastSeen).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Shared Media</h4>
                <div className="grid grid-cols-3 gap-2">
                  {/* Mock media items */}
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Shared Files</h4>
                <div className="space-y-2">
                  {/* Mock files */}
                  {['Document.pdf', 'Presentation.pptx', 'Spreadsheet.xlsx'].map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium">{file}</p>
                        <p className="text-sm text-gray-500">2.3 MB • Yesterday</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Shared Links</h4>
                <div className="space-y-2">
                  {/* Mock links */}
                  {['https://example.com', 'https://github.com', 'https://stackoverflow.com'].map((link, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-blue-600 dark:text-blue-400 truncate">{link}</p>
                        <p className="text-sm text-gray-500">Shared yesterday</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePinChat}
                    className={`p-3 rounded-lg border transition-colors flex flex-col items-center ${
                      isPinned
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="text-sm">{isPinned ? 'Pinned' : 'Pin Chat'}</span>
                  </button>
                  <button
                    onClick={handleArchiveChat}
                    className={`p-3 rounded-lg border transition-colors flex flex-col items-center ${
                      isArchived
                        ? 'border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="text-sm">{isArchived ? 'Archived' : 'Archive'}</span>
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h4 className="font-semibold mb-3">Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Enable notifications</span>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Mute for</p>
                    <div className="flex space-x-2">
                      {[
                        { label: '15 min', value: 15 },
                        { label: '1 hour', value: 60 },
                        { label: '8 hours', value: 480 },
                        { label: 'Forever', value: 'forever' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleMute(option.value)}
                          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Privacy */}
              <div>
                <h4 className="font-semibold mb-3">Security & Privacy</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block">End-to-End Encryption</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Messages are encrypted</span>
                    </div>
                    <button
                      onClick={handleEncryptionToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        encryptionEnabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          encryptionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block">Vanish Mode</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Messages disappear after reading</span>
                    </div>
                    <button
                      onClick={handleVanishModeToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        vanishMode ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          vanishMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Theme */}
              <div>
                <h4 className="font-semibold mb-3">Chat Theme</h4>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => setChatTheme(themeOption.id)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        chatTheme === themeOption.id
                          ? 'border-red-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-full h-8 rounded bg-gradient-to-r ${themeOption.color} mb-2`}></div>
                      <p className="text-sm">{themeOption.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nickname */}
              <div>
                <h4 className="font-semibold mb-3">Nickname</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Set a nickname for this chat"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h4 className="font-semibold mb-3">Privacy</h4>
                <div className="space-y-3">
                  {!isGroup && (
                    <button 
                      onClick={handleBlockUser}
                      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <span>Block user</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </button>
                  )}
                  {!isGroup && (
                    <button 
                      onClick={handleReportUser}
                      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <span>Report user</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </button>
                  )}
                  <button 
                    onClick={handleDeleteChat}
                    className="w-full text-left p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <div className="flex items-center justify-between">
                      <span>Delete chat</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}