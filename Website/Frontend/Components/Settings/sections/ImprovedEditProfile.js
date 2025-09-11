'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Camera, 
  Save, 
  X, 
  Upload, 
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Heart,
  Music,
  Camera as CameraIcon,
  Gamepad2,
  Book,
  Plane,
  Coffee,
  Palette,
  Code,
  Instagram,
  Twitter,
  Linkedin,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  Check,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'

export default function ImprovedEditProfile({ onBack }) {
  const [activeSection, setActiveSection] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    // Basic Info
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate developer and creative enthusiast. Love building things that make a difference!',
    website: 'https://johndoe.dev',
    location: 'San Francisco, CA',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    
    // Profile Images
    profilePicture: null,
    profilePicturePreview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    coverPhoto: null,
    coverPhotoPreview: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&h=300&fit=crop',
    
    // Social Media
    instagram: '@johndoe',
    twitter: '@johndoe',
    linkedin: 'johndoe',
    
    // Privacy Settings
    profileVisibility: true,
    showEmail: false,
    showPhone: false,
    
    // Interests
    interests: ['technology', 'design']
  })

  const [originalData, setOriginalData] = useState({ ...profileData })
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [phoneVerified, setPhoneVerified] = useState(true)
  const [toast, setToast] = useState({ show: false, type: '', message: '' })

  const profileInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const availableInterests = [
    { id: 'technology', label: 'Technology', icon: Code },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'photography', label: 'Photography', icon: CameraIcon },
    { id: 'travel', label: 'Travel', icon: Plane },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'sports', label: 'Sports', icon: Heart },
    { id: 'cooking', label: 'Cooking', icon: Coffee },
    { id: 'reading', label: 'Reading', icon: Book },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { id: 'fitness', label: 'Fitness', icon: Heart }
  ]

  const sidebarSections = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'contact', label: 'Contact Info', icon: Phone },
    { id: 'interests', label: 'Interests', icon: Heart },
    { id: 'social', label: 'Social Links', icon: Globe },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'photos', label: 'Photos', icon: Camera }
  ]

  useEffect(() => {
    const changes = JSON.stringify(profileData) !== JSON.stringify(originalData)
    setHasChanges(changes)
  }, [profileData, originalData])

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = (type, file) => {
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
  }

  const toggleInterest = (interestId) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const validateForm = () => {
    const errors = {}
    
    if (!profileData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }
    
    if (!profileData.username.trim()) {
      errors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores'
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (profileData.website && !/^https?:\/\/.+/.test(profileData.website)) {
      errors.website = 'Please enter a valid URL starting with http:// or https://'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const showToast = (type, message) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('error', 'Please fix the errors above')
      return
    }

    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setOriginalData({ ...profileData })
      setHasChanges(false)
      showToast('success', 'Profile updated successfully!')
      
    } catch (error) {
      showToast('error', 'Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setProfileData({ ...originalData })
    setHasChanges(false)
    setValidationErrors({})
  }

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                validationErrors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your full name"
            />
            {validationErrors.fullName && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                  validationErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="username"
              />
            </div>
            {validationErrors.username && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.username}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={profileData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender
            </label>
            <select
              value={profileData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder="Your city"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              rows={4}
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {profileData.bio.length}/500 characters
              </p>
              <div className={`text-xs px-2 py-1 rounded-full ${
                profileData.bio.length > 400 ? 'bg-red-100 text-red-600' : 
                profileData.bio.length > 300 ? 'bg-yellow-100 text-yellow-600' : 
                'bg-green-100 text-green-600'
              }`}>
                {profileData.bio.length > 400 ? 'Almost full' : 
                 profileData.bio.length > 300 ? 'Getting long' : 
                 'Perfect'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContactInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="your@email.com"
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="flex space-x-2">
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder="+1 (555) 123-4567"
            />
            {phoneVerified && (
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verified
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website
          </label>
          <input
            type="url"
            value={profileData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${
              validationErrors.website ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="https://yourwebsite.com"
          />
          {validationErrors.website && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.website}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderInterests = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interests & Hobbies</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Select topics that interest you to help us personalize your experience
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {availableInterests.map((interest) => {
          const IconComponent = interest.icon
          const isSelected = profileData.interests.includes(interest.id)
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`group relative p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isSelected
                  ? 'border-red-500 bg-red-500 text-white shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-400'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <IconComponent className="w-5 h-5" />
                <span className="text-xs font-medium">{interest.label}</span>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-lg">
                  <Check className="w-3 h-3 text-red-500" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>{profileData.interests.length}</strong> interests selected. 
          {profileData.interests.length === 0 && " Select at least 3 interests for better recommendations."}
          {profileData.interests.length < 3 && profileData.interests.length > 0 && " Select a few more for better recommendations."}
          {profileData.interests.length >= 3 && " Perfect! This will help us show you relevant content."}
        </p>
      </div>
    </div>
  )

  const renderSocialLinks = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Media Links</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instagram
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <Instagram className="w-5 h-5 text-pink-500 mr-2" />
              <span className="text-gray-500 text-sm">instagram.com/</span>
            </div>
            <input
              type="text"
              value={profileData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              className="w-full pl-32 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder="@username"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Twitter
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <Twitter className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-gray-500 text-sm">twitter.com/</span>
            </div>
            <input
              type="text"
              value={profileData.twitter}
              onChange={(e) => handleInputChange('twitter', e.target.value)}
              className="w-full pl-28 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder="@username"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LinkedIn
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <Linkedin className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-gray-500 text-sm">linkedin.com/in/</span>
            </div>
            <input
              type="text"
              value={profileData.linkedin}
              onChange={(e) => handleInputChange('linkedin', e.target.value)}
              className="w-full pl-36 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder="profile-name"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderPrivacy = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">Profile Visibility</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Make your profile visible to everyone</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.profileVisibility}
              onChange={(e) => handleInputChange('profileVisibility', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">Show Email</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Display email address on your public profile</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.showEmail}
              onChange={(e) => handleInputChange('showEmail', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">Show Phone</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Display phone number on your profile</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.showPhone}
              onChange={(e) => handleInputChange('showPhone', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderPhotos = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Photos</h3>
      
      {/* Cover Photo */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Cover Photo</h4>
        <div className="relative group">
          <div className="relative h-32 rounded-lg overflow-hidden">
            <img
              src={profileData.coverPhotoPreview}
              alt="Cover"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button
                onClick={() => coverInputRef.current?.click()}
                className="bg-white/90 hover:bg-white text-gray-900 px-3 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Cover
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

      {/* Profile Picture */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Profile Picture</h4>
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <img
              src={profileData.profilePicturePreview}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white dark:ring-gray-600 shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
            <button
              onClick={() => profileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Choose a photo that represents you well. Square images work best.
            </p>
            <button
              onClick={() => profileInputRef.current?.click()}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center text-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Picture
            </button>
          </div>
          
          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload('profile', e.target.files[0])}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'basic':
        return renderBasicInfo()
      case 'contact':
        return renderContactInfo()
      case 'interests':
        return renderInterests()
      case 'social':
        return renderSocialLinks()
      case 'privacy':
        return renderPrivacy()
      case 'photos':
        return renderPhotos()
      default:
        return renderBasicInfo()
    }
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {sidebarSections.map((section) => {
              const IconComponent = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-red-50 text-red-600 border-l-4 border-red-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Save/Cancel Actions */}
        {hasChanges && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
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
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
