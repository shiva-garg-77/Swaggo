'use client'

import React, { useState, useRef, useEffect } from 'react'
import './edit-profile-animations.css'
import { 
  Camera, 
  Save, 
  X, 
  Check, 
  Upload, 
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  AlertCircle,
  Shield,
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
  Eye,
  BarChart3
} from 'lucide-react'


export default function FullFeaturedEditProfile({ onBack }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
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
  const otpInputRefs = useRef([])

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

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'interests', label: 'Interests', icon: Heart },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'photos', label: 'Photos', icon: Camera },
  ]

  useEffect(() => {
    const changes = JSON.stringify(profileData) !== JSON.stringify(originalData)
    setHasChanges(changes)
  }, [profileData, originalData])

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
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

  const verifyPhone = () => {
    setShowOTPModal(true)
    // Simulate sending OTP
    showToast('info', 'Verification code sent to your phone')
  }

  const handleOTPChange = (index, value) => {
    const newOTP = [...otpCode]
    newOTP[index] = value.slice(0, 1)
    setOtpCode(newOTP)
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const verifyOTP = async () => {
    const code = otpCode.join('')
    if (code.length === 6) {
      setIsLoading(true)
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 2000))
      setPhoneVerified(true)
      setShowOTPModal(false)
      setOtpCode(['', '', '', '', '', ''])
      setIsLoading(false)
      showToast('success', 'Phone number verified successfully!')
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('error', 'Please fix the errors above')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate API call
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="group p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 mr-3"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Edit Profile
              </h1>
            </div>
            
            {hasChanges && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="group px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-700/30 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {/* Live Preview */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-purple-500" />
                  Live Preview
                </h3>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={profileData.profilePicturePreview}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-gray-600 shadow-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          {profileData.fullName}
                        </h4>
                        <span className="text-gray-500 dark:text-gray-400">
                          @{profileData.username}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {profileData.bio}
                      </p>
                      {profileData.location && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {profileData.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300 ${
                        validationErrors.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {validationErrors.fullName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center animate-in slide-in-from-left-2 duration-300">
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
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">@</span>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300 ${
                          validationErrors.username ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="username"
                      />
                    </div>
                    {validationErrors.username && (
                      <p className="text-red-500 text-sm mt-1 flex items-center animate-in slide-in-from-left-2 duration-300">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300 ${
                        validationErrors.website ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="https://yourwebsite.com"
                    />
                    {validationErrors.website && (
                      <p className="text-red-500 text-sm mt-1 flex items-center animate-in slide-in-from-left-2 duration-300">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.website}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                      placeholder="Your city"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={profileData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300 resize-none"
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
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-purple-500" />
                  Contact Information
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300 ${
                        validationErrors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="your@email.com"
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center animate-in slide-in-from-left-2 duration-300">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                        placeholder="+1 (555) 123-4567"
                      />
                      <button
                        onClick={verifyPhone}
                        disabled={phoneVerified}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center ${
                          phoneVerified 
                            ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-600 hover:shadow-lg transform hover:scale-105'
                        }`}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        {phoneVerified ? 'Verified' : 'Verify'}
                      </button>
                    </div>
                    {phoneVerified && (
                      <p className="text-green-600 text-sm mt-1 flex items-center animate-in slide-in-from-left-2 duration-300">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Phone number verified
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Interests Tab */}
          {activeTab === 'interests' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-purple-500" />
                  Your Interests & Hobbies
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Select topics that interest you to help us personalize your experience
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {availableInterests.map((interest) => {
                    const IconComponent = interest.icon
                    const isSelected = profileData.interests.includes(interest.id)
                    return (
                      <button
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={`group relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isSelected
                            ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                            : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-400'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <IconComponent className={`w-6 h-6 transition-all duration-300 ${
                            isSelected ? 'scale-110' : 'group-hover:scale-110'
                          }`} />
                          <span className="text-sm font-medium">{interest.label}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-lg animate-in zoom-in-50 duration-300">
                            <Check className="w-3 h-3 text-purple-500" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>{profileData.interests.length}</strong> interests selected. 
                    {profileData.interests.length === 0 && " Select at least 3 interests for better recommendations."}
                    {profileData.interests.length < 3 && profileData.interests.length > 0 && " Select a few more for better recommendations."}
                    {profileData.interests.length >= 3 && " Perfect! This will help us show you relevant content."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-purple-500" />
                  Social Media Links
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Connect your social media profiles to help others find and connect with you
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Instagram className="w-4 h-4 inline mr-2 text-pink-500" />
                      Instagram
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                        <Instagram className="w-5 h-5 text-pink-500 mr-2" />
                        <span className="text-gray-500">instagram.com/</span>
                      </div>
                      <input
                        type="text"
                        value={profileData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        className="w-full pl-36 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Twitter className="w-4 h-4 inline mr-2 text-blue-400" />
                      Twitter
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                        <Twitter className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-gray-500">twitter.com/</span>
                      </div>
                      <input
                        type="text"
                        value={profileData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        className="w-full pl-32 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Linkedin className="w-4 h-4 inline mr-2 text-blue-600" />
                      LinkedIn
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                        <Linkedin className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-gray-500">linkedin.com/in/</span>
                      </div>
                      <input
                        type="text"
                        value={profileData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="w-full pl-40 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-300"
                        placeholder="profile-name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-purple-500" />
                  Privacy & Visibility Settings
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Control who can see your profile and contact information
                </p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Profile Visibility</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Make your profile visible to everyone</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.profileVisibility}
                        onChange={(e) => handleInputChange('profileVisibility', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Show Email</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Display email address on your public profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.showEmail}
                        onChange={(e) => handleInputChange('showEmail', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Show Phone</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Display phone number on your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.showPhone}
                        onChange={(e) => handleInputChange('showPhone', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Privacy Notice
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        These settings control your public profile visibility. Your data is always protected and never shared with third parties without your consent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {/* Cover Photo */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-purple-500" />
                  Cover Photo
                </h3>
                
                <div className="relative group">
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img
                      src={profileData.coverPhotoPreview}
                      alt="Cover"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center"
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
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
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
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Update Profile Picture
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Choose a photo that represents you well. Square images work best.
                    </p>
                    <button
                      onClick={() => profileInputRef.current?.click()}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center"
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
          )}

        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verify Phone Number
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Enter the verification code sent to your phone
              </p>
              
              <div className="flex justify-center space-x-2 mb-6">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpInputRefs.current[index] = el}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    className="w-12 h-12 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-semibold text-lg transition-all duration-200"
                    maxLength={1}
                  />
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowOTPModal(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyOTP}
                  disabled={isLoading || otpCode.join('').length !== 6}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4 duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
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
