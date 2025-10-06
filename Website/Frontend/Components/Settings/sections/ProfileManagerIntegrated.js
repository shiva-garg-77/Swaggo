'use client'

import React, { useState } from 'react'
import { useSecureAuth } from '../../../context/FixedSecureAuthContext'
import { useTheme } from '../../Helper/ThemeProvider'
import { 
  User, 
  Video, 
  Camera, 
  Settings,
  ArrowLeft,
  Edit3,
  Plus
} from 'lucide-react'

// Import existing components
// import ImprovedEditProfile from './ImprovedEditProfile' // Commented out until component exists
import ProfilePhotoStoryEditor from './ProfilePhotoStoryEditor'
import { useQuery } from '@apollo/client/react';
import { GET_USER_BY_USERNAME } from '../../../lib/graphql/profileQueries'

export default function ProfileManagerIntegrated({ onBack }) {
  const { theme } = useTheme()
  const { user } = useSecureAuth()
  const [activeMode, setActiveMode] = useState('overview') // 'overview', 'edit-profile', 'photo-story'
  
  // Get current user profile data
  const { data: currentUserData, loading } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: user?.username },
    skip: !user?.username,
    errorPolicy: 'all'
  })
  
  const currentProfile = currentUserData?.getUserbyUsername
  
  const renderOverview = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-4"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Profile Manager
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Preview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          {/* Cover Photo */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
            {currentProfile?.coverPhoto && (
              <img
                src={currentProfile.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex items-end -mt-12 mb-4">
              <img
                src={currentProfile?.profilePic || '/default-profile.svg'}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover"
              />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentProfile?.name || 'Your Name'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                @{currentProfile?.username || 'username'}
              </p>
              {currentProfile?.bio && (
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  {currentProfile.bio}
                </p>
              )}
              
              <div className="flex items-center mt-4 space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{currentProfile?.followers?.length || 0} followers</span>
                <span>{currentProfile?.following?.length || 0} following</span>
                <span>{currentProfile?.post?.length || 0} posts</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Management Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Edit Profile Card */}
          <div
            onClick={() => setActiveMode('edit-profile')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <Edit3 className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Edit Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Update your basic information, bio, contact details, interests, and privacy settings.
            </p>
          </div>
          
          {/* Photo & Story Management Card */}
          <div
            onClick={() => setActiveMode('photo-story')}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                <Camera className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Photos & Stories
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Change profile picture, cover photo, create stories, and manage highlights.
            </p>
          </div>
          
          {/* Story Analytics Card (Future Feature) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 opacity-75">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Story Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View story performance, audience insights, and engagement metrics.
            </p>
            <div className="mt-3">
              <span className="inline-block px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentProfile?.post?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentProfile?.followers?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentProfile?.following?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              0
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Stories</div>
          </div>
        </div>
      </div>
    </div>
  )
  
  // Render different modes
  switch (activeMode) {
    case 'edit-profile':
      // return <ImprovedEditProfile onBack={() => setActiveMode('overview')} />
      return <div className="p-8 text-center">Edit Profile feature coming soon</div>
    case 'photo-story':
      return <ProfilePhotoStoryEditor onBack={() => setActiveMode('overview')} theme={theme} currentProfile={currentProfile} />
    default:
      return renderOverview()
  }
}
