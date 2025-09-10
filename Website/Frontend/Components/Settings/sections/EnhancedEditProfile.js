'use client'

import { useState, useRef, useCallback } from 'react'
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
  AlertCircle
} from 'lucide-react'

export default function EnhancedEditProfile({ onBack }) {
  const [activeTab, setActiveTab] = useState('basic')
  const [profileData, setProfileData] = useState({
    // Basic Info
    username: 'john_doe',
    displayName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate about technology and design. Love creating amazing user experiences.',
    website: 'https://johndoe.com',
    location: 'San Francisco, CA',
    dateOfBirth: '1995-06-15',
    gender: 'male',
    
    // Password
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Profile Picture
    profilePicture: null,
    profilePicturePreview: '/default-profile.svg'
  })

  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropSettings, setCropSettings] = useState({
    zoom: 1,
    rotation: 0,
    filter: 'none'
  })

  const fileInputRef = useRef(null)
  const cropCanvasRef = useRef(null)

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

  const handleCropSave = () => {
    // Here you would apply the crop settings to the image
    setShowCropModal(false)
    setHasChanges(true)
  }

  const handleSave = async () => {
    // Validate data
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    // Simulate save operation
    try {
      // Here you would make API calls to save the data
      console.log('Saving profile data:', profileData)
      setHasChanges(false)
      setIsEditing(false)
      // Show success message
    } catch (error) {
      console.error('Error saving profile:', error)
      // Show error message
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'security', label: 'Password', icon: Lock },
    { id: 'picture', label: 'Profile Picture', icon: Camera }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg max-w-md">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Live Preview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-red-500" />
                Live Preview
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <img
                    src={profileData.profilePicturePreview}
                    alt="Profile"
                    className={`w-12 h-12 rounded-full object-cover ${cropSettings.filter !== 'none' ? filters.find(f => f.name === cropSettings.filter)?.class : ''}`}
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {profileData.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter phone number"
                />
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="https://example.com"
                />
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
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
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                rows={4}
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none"
                placeholder="Tell us about yourself..."
                maxLength={160}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {profileData.bio.length}/160 characters
              </p>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'security' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Password Security Tips
                  </h4>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                    <li>• Use at least 8 characters</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Add numbers and special characters</li>
                    <li>• Avoid common words or personal information</li>
                  </ul>
                </div>
              </div>
            </div>

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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {profileData.newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Password Strength
                      </span>
                      <span className={`text-xs font-medium ${getPasswordStrengthInfo().textColor}`}>
                        {getPasswordStrengthInfo().label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
        )}

        {/* Profile Picture Tab */}
        {activeTab === 'picture' && (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Current Picture */}
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={profileData.profilePicturePreview}
                  alt="Profile"
                  className={`w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 ${
                    cropSettings.filter !== 'none' ? filters.find(f => f.name === cropSettings.filter)?.class : ''
                  }`}
                  style={{
                    transform: `rotate(${cropSettings.rotation}deg) scale(${cropSettings.zoom})`
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
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
            </div>

            {/* Upload Options */}
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>Upload New Picture</span>
              </button>

              {profileData.profilePicture && (
                <button
                  onClick={() => setShowCropModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Crop className="w-5 h-5" />
                  <span>Edit & Crop</span>
                </button>
              )}
            </div>

            {/* Quick Filters */}
            {profileData.profilePicture && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Quick Filters
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setCropSettings(prev => ({ ...prev, filter: filter.name }))}
                      className={`p-3 text-center border rounded-lg transition-colors ${
                        cropSettings.filter === filter.name
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`w-8 h-8 mx-auto mb-2 rounded bg-gray-300 ${filter.class}`} />
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
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-end space-x-3">
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
                  profilePicturePreview: '/default-profile.svg'
                })
                setHasChanges(false)
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Profile Picture
                </h3>
                <button
                  onClick={() => setShowCropModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview */}
              <div className="mb-6 text-center">
                <div className="relative inline-block">
                  <img
                    src={profileData.profilePicturePreview}
                    alt="Preview"
                    className={`w-48 h-48 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 ${
                      cropSettings.filter !== 'none' ? filters.find(f => f.name === cropSettings.filter)?.class : ''
                    }`}
                    style={{
                      transform: `rotate(${cropSettings.rotation}deg) scale(${cropSettings.zoom})`
                    }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4 mb-6">
                {/* Zoom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zoom
                  </label>
                  <div className="flex items-center space-x-3">
                    <ZoomOut className="w-4 h-4 text-gray-500" />
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={cropSettings.zoom}
                      onChange={(e) => setCropSettings(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                      className="flex-1"
                    />
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rotation
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setCropSettings(prev => ({ ...prev, rotation: prev.rotation - 90 }))}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <RotateCw className="w-4 h-4 transform rotate-180" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={cropSettings.rotation}
                      onChange={(e) => setCropSettings(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <button
                      onClick={() => setCropSettings(prev => ({ ...prev, rotation: prev.rotation + 90 }))}
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filters
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {filters.map((filter) => (
                      <button
                        key={filter.name}
                        onClick={() => setCropSettings(prev => ({ ...prev, filter: filter.name }))}
                        className={`p-2 text-center border rounded-lg transition-colors ${
                          cropSettings.filter === filter.name
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className={`w-6 h-6 mx-auto mb-1 rounded bg-gray-300 ${filter.class}`} />
                        <span className="text-xs">{filter.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCropModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
