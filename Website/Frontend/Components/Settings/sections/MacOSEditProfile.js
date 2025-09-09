'use client'

import { useState, useRef } from 'react'
import { 
  Camera, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Check, 
  Upload, 
  Crop, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  Sparkles,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Lock,
  AlertCircle,
  Info
} from 'lucide-react'

export default function MacOSEditProfile({ onBack }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [profileData, setProfileData] = useState({
    username: 'john_doe',
    displayName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate about technology and design. Love creating amazing user experiences.',
    website: 'https://johndoe.com',
    location: 'San Francisco, CA',
    dateOfBirth: '1995-06-15',
    gender: 'male',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: null,
    profilePicturePreview: '/default-profile.svg',
    // Online Status & Privacy Settings
    onlineStatus: true,
    showOnlineStatus: true,
    profileVisibility: 'public', // public, friends, private
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessagesFrom: 'everyone', // everyone, friends, nobody
    searchable: true,
    showActivity: true
  })

  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropSettings, setCropSettings] = useState({
    zoom: 1,
    rotation: 0,
    filter: 'none'
  })

  const fileInputRef = useRef(null)

  const filters = [
    { name: 'none', label: 'Original', class: '' },
    { name: 'grayscale', label: 'B&W', class: 'grayscale' },
    { name: 'sepia', label: 'Sepia', class: 'sepia' },
    { name: 'saturate', label: 'Vibrant', class: 'saturate-150' },
    { name: 'contrast', label: 'High Contrast', class: 'contrast-125' },
    { name: 'brightness', label: 'Bright', class: 'brightness-110' }
  ]

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    
    if (field === 'newPassword') {
      calculatePasswordStrength(value)
    }
  }

  const calculatePasswordStrength = (password) => {
    let strength = 0
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ]
    
    strength = checks.filter(Boolean).length
    setPasswordStrength(strength)
  }

  const getPasswordStrengthInfo = () => {
    const levels = [
      { score: 0, label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
      { score: 1, label: 'Weak', color: 'bg-red-400', textColor: 'text-red-500' },
      { score: 2, label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
      { score: 3, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' },
      { score: 4, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600', textColor: 'text-green-700' }
    ]
    return levels[passwordStrength] || levels[0]
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profilePicture: file,
          profilePicturePreview: e.target.result
        }))
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    try {
      console.log('Saving profile data:', profileData)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const tabs = [
    { id: 'basic', label: 'General', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Password', icon: Lock }
  ]

  // macOS-style toggle component with green/red colors
  const MacOSToggle = ({ enabled, onChange, size = 'default' }) => {
    const sizeClasses = size === 'small' ? 'w-10 h-6' : 'w-12 h-7'
    const thumbClasses = size === 'small' ? 'w-4 h-4' : 'w-5 h-5'
    const translateClasses = size === 'small' ? 'translate-x-4' : 'translate-x-5'
    
    return (
      <button
        onClick={onChange}
        className={`relative inline-flex ${sizeClasses} rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 transform hover:scale-105 active:scale-95 ${
          enabled 
            ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg focus:ring-green-500/30' 
            : 'bg-gradient-to-r from-red-400 to-red-500 shadow-lg focus:ring-red-500/30'
        }`}
        style={{
          boxShadow: enabled 
            ? '0 4px 12px rgba(34, 197, 94, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.1)' 
            : '0 4px 12px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <span
          className={`inline-block ${thumbClasses} rounded-full bg-white shadow-xl transform transition-all duration-300 ease-in-out ${
            enabled ? translateClasses : 'translate-x-1'
          }`}
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Optional checkmark/X icons for clarity */}
          <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-200 ${
            enabled ? 'text-green-500' : 'text-red-500'
          }`}>
            {enabled ? (
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </span>
      </button>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30">
      {/* Modern Tab Navigation */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-700/30 px-6 py-6">
        <div className="flex justify-center mb-6">
          <div className="flex space-x-1 bg-gray-100/60 dark:bg-gray-700/60 p-1 rounded-2xl backdrop-blur-lg">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 min-w-[120px] ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                  style={activeTab === tab.id ? {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)'
                  } : {}}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-8">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Profile Header Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <img
                  src={profileData.profilePicturePreview}
                  alt="Profile"
                  className={`w-32 h-32 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-2xl ${cropSettings.filter !== 'none' ? filters.find(f => f.name === cropSettings.filter)?.class : ''}`}
                  style={{
                    transform: `rotate(${cropSettings.rotation}deg) scale(${cropSettings.zoom})`
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                  style={{ boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)' }}
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {profileData.displayName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">@{profileData.username}</p>
            </div>

            {/* Live Preview Card */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/40 dark:border-gray-700/40"
                 style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 shadow-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Live Preview</h3>
              </div>
              
              <div className="bg-gray-50/80 dark:bg-gray-700/80 rounded-xl p-4 backdrop-blur-lg">
                <div className="flex items-start space-x-3">
                  <img
                    src={profileData.profilePicturePreview}
                    alt="Profile"
                    className={`w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm ${cropSettings.filter !== 'none' ? filters.find(f => f.name === cropSettings.filter)?.class : ''}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {profileData.displayName}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        @{profileData.username}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {profileData.bio}
                    </p>
                    {profileData.location && (
                      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="w-3 h-3 mr-1" />
                        {profileData.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information Form */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/40 dark:border-gray-700/40"
                 style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-4 shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <div className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                      <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-5 py-4 bg-white/90 dark:bg-gray-700/90 backdrop-blur-lg border-2 border-gray-200/60 dark:border-gray-600/60 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/60 dark:text-white transition-all duration-300 text-base font-medium group-hover:border-gray-300/80 dark:group-hover:border-gray-500/80"
                      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.06)' }}
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                    placeholder="Enter display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                    placeholder="Enter location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200 resize-none"
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profileData.bio.length}/160 characters
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Info className="w-3 h-3 mr-1" />
                    This appears on your profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Online Status & Visibility */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/40 dark:border-gray-700/40"
                 style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-4 shadow-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Online Status & Profile Visibility
                </h3>
              </div>

              <div className="space-y-6">
                {/* Online Status */}
                <div className="flex items-center justify-between py-4 px-6 bg-gray-50/80 dark:bg-gray-700/80 rounded-2xl backdrop-blur-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${
                      profileData.onlineStatus ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Online Status
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Show when you're active and available
                      </p>
                    </div>
                  </div>
                  <MacOSToggle
                    enabled={profileData.onlineStatus}
                    onChange={() => handleInputChange('onlineStatus', !profileData.onlineStatus)}
                  />
                </div>

                {/* Show Online Status */}
                <div className="flex items-center justify-between py-4 px-6 bg-gray-50/80 dark:bg-gray-700/80 rounded-2xl backdrop-blur-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Show Online Status
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Let others see when you're online
                    </p>
                  </div>
                  <MacOSToggle
                    enabled={profileData.showOnlineStatus}
                    onChange={() => handleInputChange('showOnlineStatus', !profileData.showOnlineStatus)}
                  />
                </div>

                {/* Profile Visibility */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-blue-500" />
                    Profile Visibility
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'public', label: 'Public', desc: 'Anyone can view your profile' },
                      { value: 'friends', label: 'Friends Only', desc: 'Only friends can view your profile' },
                      { value: 'private', label: 'Private', desc: 'Only you can view your profile' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleInputChange('profileVisibility', option.value)}
                        className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-200 ${
                          profileData.profileVisibility === option.value
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500/60 ring-2 ring-blue-500/20'
                            : 'bg-white/80 dark:bg-gray-700/80 border-2 border-gray-200/60 dark:border-gray-600/60 hover:border-gray-300/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{option.label}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            profileData.profileVisibility === option.value
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {profileData.profileVisibility === option.value && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Privacy */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/40 dark:border-gray-700/40"
                 style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mr-4 shadow-lg">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Contact Information
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'showEmail', label: 'Show Email Address', desc: 'Display email on your profile', icon: Mail },
                  { key: 'showPhone', label: 'Show Phone Number', desc: 'Display phone number on your profile', icon: Phone },
                  { key: 'showLocation', label: 'Show Location', desc: 'Display your location on your profile', icon: MapPin }
                ].map((item) => {
                  const IconComponent = item.icon
                  return (
                    <div key={item.key} className="flex items-center justify-between py-4 px-6 bg-gray-50/80 dark:bg-gray-700/80 rounded-2xl backdrop-blur-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-gray-600/80 flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {item.label}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <MacOSToggle
                        enabled={profileData[item.key]}
                        onChange={() => handleInputChange(item.key, !profileData[item.key])}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Messaging & Interaction Privacy */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/40 dark:border-gray-700/40"
                 style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 shadow-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Messages & Interactions
                </h3>
              </div>

              <div className="space-y-6">
                {/* Allow Messages From */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-blue-500" />
                    Allow Messages From
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'everyone', label: 'Everyone', desc: 'Anyone can send you messages' },
                      { value: 'friends', label: 'Friends Only', desc: 'Only your friends can message you' },
                      { value: 'nobody', label: 'Nobody', desc: 'Disable all incoming messages' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleInputChange('allowMessagesFrom', option.value)}
                        className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-200 ${
                          profileData.allowMessagesFrom === option.value
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500/60 ring-2 ring-blue-500/20'
                            : 'bg-white/80 dark:bg-gray-700/80 border-2 border-gray-200/60 dark:border-gray-600/60 hover:border-gray-300/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">{option.label}</h5>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            profileData.allowMessagesFrom === option.value
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {profileData.allowMessagesFrom === option.value && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search & Discovery */}
                <div className="space-y-4">
                  {[
                    { key: 'searchable', label: 'Searchable Profile', desc: 'Allow others to find you in search results' },
                    { key: 'showActivity', label: 'Show Activity Status', desc: 'Display your recent activity to friends' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-4 px-6 bg-gray-50/80 dark:bg-gray-700/80 rounded-2xl backdrop-blur-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {item.label}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.desc}
                        </p>
                      </div>
                      <MacOSToggle
                        enabled={profileData[item.key]}
                        onChange={() => handleInputChange(item.key, !profileData[item.key])}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'security' && (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Security Notice */}
            <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-lg border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    Password Security
                  </h4>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                    <p>• Use at least 8 characters with mixed case</p>
                    <p>• Include numbers and special characters</p>
                    <p>• Avoid personal information or common words</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Form */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
                 style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-blue-500" />
                Change Password
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={profileData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                      style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={profileData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                      style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {profileData.newPassword && (
                    <div className="mt-3 p-3 bg-gray-50/80 dark:bg-gray-700/80 rounded-xl backdrop-blur-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Password Strength
                        </span>
                        <span className={`text-xs font-medium ${getPasswordStrengthInfo().textColor}`}>
                          {getPasswordStrengthInfo().label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthInfo().color}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={profileData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200"
                      style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {profileData.newPassword && profileData.confirmPassword && (
                    <div className="mt-2 flex items-center">
                      {profileData.newPassword === profileData.confirmPassword ? (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4 mr-1" />
                          <span className="text-xs">Passwords match</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <X className="w-4 h-4 mr-1" />
                          <span className="text-xs">Passwords do not match</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Picture Tab - removed by request */}
        {false && (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Current Picture */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 text-center"
                 style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
              <div className="relative inline-block mb-6">
                <img
                  src={profileData.profilePicturePreview}
                  alt="Profile"
                  className={`w-32 h-32 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-lg ${
                    cropSettings.filter !== 'none' ? filters.find(f => f.name === cropSettings.filter)?.class : ''
                  }`}
                  style={{
                    transform: `rotate(${cropSettings.rotation}deg) scale(${cropSettings.zoom})`
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                  style={{ boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)' }}
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload Options */}
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg"
                  style={{ boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)' }}
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload New Photo</span>
                </button>

                {profileData.profilePicture && (
                  <button
                    onClick={() => setShowCropModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-600/80 transition-all duration-200 font-medium"
                    style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                  >
                    <Crop className="w-5 h-5" />
                    <span>Edit & Crop</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters */}
            {profileData.profilePicture && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
                   style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                  Filters
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setCropSettings(prev => ({ ...prev, filter: filter.name }))}
                      className={`p-4 text-center border rounded-xl transition-all duration-200 ${
                        cropSettings.filter === filter.name
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/50'
                          : 'border-gray-200/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/50 hover:bg-gray-50/80 dark:hover:bg-gray-600/80'
                      }`}
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 ${filter.class}`} />
                      <span className="text-xs font-medium">{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
          <div className="flex items-center justify-end space-x-3 max-w-2xl mx-auto">
            <button
              onClick={() => {
                setProfileData({
                  username: 'john_doe',
                  displayName: 'John Doe',
                  email: 'john@example.com',
                  phone: '+1 (555) 123-4567',
                  bio: 'Passionate about technology and design. Love creating amazing user experiences.',
                  website: 'https://johndoe.com',
                  location: 'San Francisco, CA',
                  dateOfBirth: '1995-06-15',
                  gender: 'male',
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                  profilePicture: null,
                  profilePicturePreview: '/default-profile.svg',
                  // Online Status & Privacy Settings
                  onlineStatus: true,
                  showOnlineStatus: true,
                  profileVisibility: 'public',
                  showEmail: false,
                  showPhone: false,
                  showLocation: true,
                  allowMessagesFrom: 'everyone',
                  searchable: true,
                  showActivity: true
                })
                setHasChanges(false)
              }}
              className="px-6 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-600/80 transition-all duration-200 font-medium"
              style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg"
              style={{ boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)' }}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
