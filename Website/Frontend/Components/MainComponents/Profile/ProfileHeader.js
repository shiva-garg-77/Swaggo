"use client";

import { useState } from 'react';
import CreatePostModal from '../Post/CreatePostModal';
import HighlightsSection from './HighlightsSection';

export default function ProfileHeader({ 
  profile, 
  isOwnProfile, 
  isFollowing, 
  onFollowToggle, 
  onMessage, 
  onRestrict, 
  onBlock, 
  onRefresh,
  onCreateMemory,
  memoriesData,
  theme 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  if (!profile) return null;

  const followersCount = profile.followers?.length || 0;
  const followingCount = profile.following?.length || 0;
  const postsCount = profile.post?.length || 0;

  return (
    <div className="w-full px-4 py-4">
      {/* Instagram-style Horizontal Layout - Medium width */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-16 max-w-none w-full">
        {/* Profile Picture */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div className="relative">
            <img
              src={profile.profilepic || '/default-profile.svg'}
              alt={profile.displayname || profile.username}
              className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
            />
            {profile.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-2 border-white dark:border-gray-900">
                <CheckBadgeIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 space-y-4">
          
          {/* Username and Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl md:text-3xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {profile.username}
              </h1>
              {profile.name && (
                <p className={`text-base font-medium mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {profile.name}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => setShowCreatePost(true)}
                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors min-w-[100px] ${
                    theme === 'dark' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}>
                    + New Post
                  </button>
                  <button className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors min-w-[100px] ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                  }`}>
                    Edit Profile
                  </button>
                  <button className={`px-5 py-2.5 rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}>
                    <SettingsIcon className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onFollowToggle}
                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors min-w-[100px] ${
                      isFollowing
                        ? theme === 'dark'
                          ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                          : 'bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-200'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={onMessage}
                    className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors min-w-[100px] ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Message
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className={`px-5 py-2.5 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      <DotsHorizontalIcon className="w-5 h-5" />
                    </button>
                    
                    {showMenu && (
                      <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
                        theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                        <button
                          onClick={() => {
                            onRestrict();
                            setShowMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm rounded-t-lg hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          Restrict User
                        </button>
                        <button
                          onClick={() => {
                            onBlock();
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                        >
                          Block User
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8 md:gap-10">
            <div>
              <span className={`text-lg md:text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {postsCount.toLocaleString()}
              </span>
              <span className={`ml-1 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                posts
              </span>
            </div>
            <div>
              <span className={`text-lg md:text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {followersCount.toLocaleString()}
              </span>
              <span className={`ml-1 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                followers
              </span>
            </div>
            <div>
              <span className={`text-lg md:text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {followingCount.toLocaleString()}
              </span>
              <span className={`ml-1 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                following
              </span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className={`text-sm md:text-base leading-relaxed max-w-md ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {profile.bio}
            </div>
          )}
          
        </div>
      </div>
      
      {/* Highlights Section */}
      <HighlightsSection 
        profileData={profile}
        isOwnProfile={isOwnProfile}
        onCreateMemory={onCreateMemory}
        memoriesData={memoriesData || []}
        theme={theme}
        className="border-t border-gray-200 dark:border-gray-700 mt-4"
      />
      
      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          theme={theme}
          onPostSuccess={() => {
            setShowCreatePost(false);
            if (onRefresh) {
              onRefresh();
            } else {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}

// Icon Components
function CheckBadgeIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.236 4.53L7.73 9.77a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l3.5-4.9z" clipRule="evenodd" />
    </svg>
  );
}

function DotsHorizontalIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
