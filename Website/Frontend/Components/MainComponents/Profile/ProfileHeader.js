"use client";

import { useState } from 'react';

export default function ProfileHeader({ 
  profile, 
  isOwnProfile, 
  isFollowing, 
  onFollowToggle, 
  onMessage, 
  onRestrict, 
  onBlock, 
  theme 
}) {
  const [showMenu, setShowMenu] = useState(false);

  if (!profile) return null;

  const followersCount = profile.followers?.length || 0;
  const followingCount = profile.following?.length || 0;
  const postsCount = profile.post?.length || 0;

  return (
    <div className="mb-12">
      {/* Profile Info Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              src={profile.profilePic || '/default-profile.svg'}
              alt={profile.username}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
            />
            {profile.isVerified && (
              <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1">
                <CheckBadgeIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="flex-1 min-w-0">
          {/* Username and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div>
              <h1 className={`text-2xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {profile.username}
              </h1>
              {profile.name && (
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {profile.name}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                  }`}>
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onFollowToggle}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isFollowing
                        ? theme === 'dark'
                          ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={onMessage}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-800 text-white hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Message
                  </button>
                  
                  {/* More Options Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-800' 
                          : 'text-gray-600 hover:bg-gray-100'
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
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          Restrict
                        </button>
                        <button
                          onClick={() => {
                            onBlock();
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Block
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {postsCount}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Uploads
              </div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {followersCount}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Followers
              </div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {followingCount}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Following
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {profile.bio}
            </div>
          )}

        </div>
      </div>
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
