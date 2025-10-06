'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useMutation, useQuery } from '@apollo/client/react';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { 
  Camera, 
  Save, 
  X, 
  Upload, 
  User,
  Image,
  Video,
  Edit,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Plus,
  Star,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react'
import { UPDATE_PROFILE_ENHANCED, CREATE_STORY, GET_USER_STORIES, DELETE_STORY, UPDATE_STORY } from '../../../lib/graphql/profileEnhancedQueries'

export default function ProfilePhotoStoryEditor({ onBack, theme, currentProfile }) {
  const { user } = useFixedSecureAuth()
  
  // State for profile editing
  const [profileData, setProfileData] = useState({
    profilePicture: null,
    profilePicturePreview: currentProfile?.profilePic || '',
    coverPhoto: null,
    coverPhotoPreview: currentProfile?.coverPhoto || 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&h=300&fit=crop',
    name: currentProfile?.name || '',
    username: currentProfile?.username || '',
    bio: currentProfile?.bio || '',
    location: currentProfile?.location || '',
    website: currentProfile?.website || '',
    dateOfBirth: currentProfile?.dateOfBirth || '',
    gender: currentProfile?.gender || '',
    phoneNumber: currentProfile?.phoneNumber || ''
  })
  
  // State for story management
  const [selectedStoryFile, setSelectedStoryFile] = useState(null)
  const [storyPreview, setStoryPreview] = useState(null)
  const [storyCaption, setStoryCaption] = useState('')
  const [isUploadingStory, setIsUploadingStory] = useState(false)
  const [activeStoryTab, setActiveStoryTab] = useState('create') // 'create', 'manage', 'highlights'
  
  // State management
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [toast, setToast] = useState({ show: false, type: '', message: '' })
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'story'
  
  // Refs
  const profileInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const storyInputRef = useRef(null)
  const videoRef = useRef(null)
  
  // Queries and mutations
  const [updateProfile] = useMutation(UPDATE_PROFILE_ENHANCED)
  const [createStory] = useMutation(CREATE_STORY)
  const [deleteStory] = useMutation(DELETE_STORY)
  const [updateStory] = useMutation(UPDATE_STORY)
  
  const { data: storiesData, loading: storiesLoading, refetch: refetchStories } = useQuery(GET_USER_STORIES, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    errorPolicy: 'all'
  })
  
  const userStories = storiesData?.getUserStories || []
  const activeStories = userStories.filter(story => story.isActive)
  const expiredStories = userStories.filter(story => !story.isActive)
  
  useEffect(() => {
    const changes = JSON.stringify(profileData) !== JSON.stringify({
      profilePicture: null,
      profilePicturePreview: currentProfile?.profilePic || '',
      coverPhoto: null,
      coverPhotoPreview: currentProfile?.coverPhoto || '',
      name: currentProfile?.name || '',
      username: currentProfile?.username || '',
      bio: currentProfile?.bio || '',
      location: currentProfile?.location || '',
      website: currentProfile?.website || '',
      dateOfBirth: currentProfile?.dateOfBirth || '',
      gender: currentProfile?.gender || '',
      phoneNumber: currentProfile?.phoneNumber || ''
    })
    setHasChanges(changes)
  }, [profileData, currentProfile])
  
  // Handle file uploads
  const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const apiUrl = `http://localhost:${process.env.NEXT_PUBLIC_PORT || 8000}/upload`
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const result = await response.json()
      return result.fileUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }
  
  const handleFileUpload = useCallback((type, file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (type === 'profile') {
          setProfileData(prev => ({
            ...prev,
            profilePicture: file,
            profilePicturePreview: e.target.result
          }))
        } else if (type === 'cover') {
          setProfileData(prev => ({
            ...prev,
            coverPhoto: file,
            coverPhotoPreview: e.target.result
          }))
        }
      }
      reader.readAsDataURL(file)
    }
  }, [])
  
  const handleStoryFileUpload = useCallback((file) => {
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setSelectedStoryFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setStoryPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }, [])
  
  const showToast = (type, message) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000)
  }
  
  const handleSaveProfile = async () => {
    if (!user?.profileid) {
      showToast('error', 'User profile ID not found')
      return
    }
    
    setIsLoading(true)
    
    try {
      let profilePicUrl = profileData.profilePicturePreview
      let coverPhotoUrl = profileData.coverPhotoPreview
      
      // Upload profile picture if new file selected
      if (profileData.profilePicture) {
        profilePicUrl = await uploadFile(profileData.profilePicture)
      }
      
      // Upload cover photo if new file selected
      if (profileData.coverPhoto) {
        coverPhotoUrl = await uploadFile(profileData.coverPhoto)
      }
      
      // Update profile
      await updateProfile({
        variables: {
          id: user.profileid,
          New_username: profileData.username,
          profilesPic: profilePicUrl,
          name: profileData.name,
          bio: profileData.bio,
          coverPhoto: coverPhotoUrl,
          location: profileData.location,
          website: profileData.website,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          phoneNumber: profileData.phoneNumber
        }
      })
      
      setHasChanges(false)
      showToast('success', 'Profile updated successfully!')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      showToast('error', 'Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCreateStory = async () => {
    if (!selectedStoryFile || !user?.profileid) {
      showToast('error', 'Please select a file to upload')
      return
    }
    
    setIsUploadingStory(true)
    
    try {
      // Upload media file
      const mediaUrl = await uploadFile(selectedStoryFile)
      const mediaType = selectedStoryFile.type.startsWith('video/') ? 'video' : 'image'
      
      // Create story
      await createStory({
        variables: {
          profileid: user.profileid,
          mediaUrl,
          mediaType,
          caption: storyCaption.trim() || null
        }
      })
      
      // Reset story form
      setSelectedStoryFile(null)
      setStoryPreview(null)
      setStoryCaption('')
      refetchStories()
      showToast('success', 'Story created successfully!')
      
    } catch (error) {
      console.error('Error creating story:', error)
      showToast('error', 'Failed to create story. Please try again.')
    } finally {
      setIsUploadingStory(false)
    }
  }
  
  const handleDeleteStory = async (storyId) => {
    if (!confirm('Are you sure you want to delete this story?')) return
    
    try {
      await deleteStory({
        variables: { storyid: storyId }
      })
      refetchStories()
      showToast('success', 'Story deleted successfully!')
    } catch (error) {
      console.error('Error deleting story:', error)
      showToast('error', 'Failed to delete story')
    }
  }
  
  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* Profile Picture Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-blue-500" />
          Profile Picture
        </h3>
        
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <img
              src={profileData.profilePicturePreview}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-600 shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
            <button
              onClick={() => profileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Change Profile Picture</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Upload a new profile picture. Square images work best.
            </p>
            <button
              onClick={() => profileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center text-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Picture
            </button>
          </div>
        </div>
        
        <input
          ref={profileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload('profile', e.target.files[0])}
          className="hidden"
        />
      </div>
      
      {/* Cover Photo Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Image className="w-5 h-5 mr-2 text-green-500" />
          Cover Photo
        </h3>
        
        <div className="relative group">
          <div className="relative h-48 rounded-lg overflow-hidden">
            <img
              src={profileData.coverPhotoPreview}
              alt="Cover"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Cover Photo
              </button>
            </div>
          </div>
          
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload('cover', e.target.files[0])}
            className="hidden"
          />
        </div>
      </div>
      
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <User className="w-5 h-5 mr-2 text-purple-500" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                placeholder="username"
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              rows={3}
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none"
              placeholder="Tell us about yourself..."
              maxLength={160}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {profileData.bio.length}/160 characters
            </p>
          </div>
        </div>
      </div>
    </div>
  )
  
  const renderStoryTab = () => (
    <div className="space-y-8">
      {/* Story Management Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Video className="w-5 h-5 mr-2 text-red-500" />
          Story Management
        </h3>
        
        <div className="flex space-x-4 mb-6">
          {['create', 'manage', 'highlights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStoryTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeStoryTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {activeStoryTab === 'create' && (
          <div className="space-y-4">
            {/* Story Creation */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              {storyPreview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    {selectedStoryFile?.type.startsWith('video/') ? (
                      <video
                        ref={videoRef}
                        src={storyPreview}
                        className="w-32 h-48 object-cover rounded-lg shadow-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={storyPreview}
                        alt="Story preview"
                        className="w-32 h-48 object-cover rounded-lg shadow-lg"
                      />
                    )}
                    <button
                      onClick={() => {
                        setSelectedStoryFile(null)
                        setStoryPreview(null)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <textarea
                    placeholder="Add a caption..."
                    value={storyCaption}
                    onChange={(e) => setStoryCaption(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={2}
                    maxLength={100}
                  />
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        setSelectedStoryFile(null)
                        setStoryPreview(null)
                        setStoryCaption('')
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateStory}
                      disabled={isUploadingStory}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                      {isUploadingStory ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Share Story
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Create New Story</h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Share a photo or video that disappears after 24 hours
                  </p>
                  <button
                    onClick={() => storyInputRef.current?.click()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center mx-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Media
                  </button>
                </div>
              )}
              
              <input
                ref={storyInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => handleStoryFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>
        )}
        
        {activeStoryTab === 'manage' && (
          <div className="space-y-6">
            {/* Active Stories */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                Active Stories ({activeStories.length})
              </h4>
              {activeStories.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No active stories. Create your first story above!
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {activeStories.map((story) => (
                    <div key={story.storyid} className="relative group">
                      {story.mediaType === 'video' ? (
                        <video
                          src={story.mediaUrl}
                          className="w-full aspect-[3/4] object-cover rounded-lg"
                          muted
                        />
                      ) : (
                        <img
                          src={story.mediaUrl}
                          alt="Story"
                          className="w-full aspect-[3/4] object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteStory(story.storyid)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                          <div className="flex items-center justify-between">
                            <span>{story.viewCount} views</span>
                            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-4"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Profile & Story Manager
              </h1>
            </div>
            
            {hasChanges && activeTab === 'profile' && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setProfileData({
                    profilePicture: null,
                    profilePicturePreview: currentProfile?.profilePic || '',
                    coverPhoto: null,
                    coverPhotoPreview: currentProfile?.coverPhoto || '',
                    name: currentProfile?.name || '',
                    username: currentProfile?.username || '',
                    bio: currentProfile?.bio || '',
                    location: currentProfile?.location || '',
                    website: currentProfile?.website || '',
                    dateOfBirth: currentProfile?.dateOfBirth || '',
                    gender: currentProfile?.gender || '',
                    phoneNumber: currentProfile?.phoneNumber || ''
                  })}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm flex items-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'profile', label: 'Profile Settings', icon: User },
              { id: 'story', label: 'Story Management', icon: Video }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'profile' ? renderProfileTab() : renderStoryTab()}
      </div>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right duration-300 ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
