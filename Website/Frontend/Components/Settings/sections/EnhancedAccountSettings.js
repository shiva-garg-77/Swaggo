'use client'

import React, { useState, useRef } from 'react'
import { 
  Shield,
  Eye,
  EyeOff,
  Lock,
  Key,
  AlertTriangle,
  Trash2,
  UserX,
  Clock,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  MoreHorizontal,
  Settings,
  Download,
  Archive,
  RefreshCw
} from 'lucide-react'
import AccountDeletion from './AccountDeletion'
import SecurityAIAssistant from './SecurityAIAssistant'

export default function EnhancedAccountSettings({ onBack, isModal = false }) {
  const [activeSection, setActiveSection] = useState('password')
  const [isLoading, setIsLoading] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [validationErrors, setValidationErrors] = useState({})
  const [toast, setToast] = useState({ show: false, type: '', message: '' })
  
  const sidebarSections = [
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'security', label: 'Security Settings', icon: Shield },
    { id: 'ai-security', label: 'AI Security Assistant', icon: RefreshCw },
    { id: 'sessions', label: 'Active Sessions', icon: Settings },
    { id: 'data', label: 'Data & Privacy', icon: Download },
    { id: 'danger', label: 'Account Management', icon: Trash2 }
  ]

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

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    if (field === 'newPassword') {
      calculatePasswordStrength(value)
    }
  }

  const validatePasswordForm = () => {
    const errors = {}
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required'
    } else if (passwordStrength < 3) {
      errors.newPassword = 'Password is too weak'
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const showToast = (type, message) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000)
  }

  const handlePasswordSave = async () => {
    if (!validatePasswordForm()) {
      showToast('error', 'Please fix the errors above')
      return
    }

    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      showToast('success', 'Password updated successfully!')
      
    } catch (error) {
      showToast('error', 'Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  const renderPasswordSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Keep your account secure by using a strong password and updating it regularly.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Password Security Tips
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-300 mt-2 space-y-1">
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
            Current Password *
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                validationErrors.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {validationErrors.currentPassword && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.currentPassword}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password *
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                validationErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {passwordData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getPasswordStrengthInfo().color}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${getPasswordStrengthInfo().textColor}`}>
                  {getPasswordStrengthInfo().label}
                </span>
              </div>
            </div>
          )}
          {validationErrors.newPassword && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.newPassword}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password *
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 ${
                validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        <button
          onClick={handlePasswordSave}
          disabled={isLoading}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Updating Password...' : 'Update Password'}
        </button>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Add an extra layer of security to your account</p>
          </div>
          <button 
            onClick={() => showToast('info', '2FA setup will be available in the next update!')}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Enable 2FA
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">Login Notifications</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Get notified when someone logs into your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">Suspicious Activity Alerts</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Alert me about unusual login attempts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderSessionsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Current Session (This device)
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Windows • Chrome • San Francisco, CA</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last active: Now</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">iPhone App</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">iOS • Mobile App • New York, NY</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last active: 2 hours ago</p>
            </div>
            <button className="text-red-500 hover:text-red-700 text-sm font-medium">
              End Session
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">MacBook Pro</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">macOS • Safari • Los Angeles, CA</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last active: 1 day ago</p>
            </div>
            <button 
              onClick={() => showToast('success', 'Session ended successfully!')}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              End Session
            </button>
          </div>
        </div>

        <button 
          onClick={() => showToast('success', 'All other sessions have been ended!')}
          className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
        >
          End All Other Sessions
        </button>
      </div>
    </div>
  )

  const renderDataSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data & Privacy</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Download Your Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Download a copy of all your data including posts, messages, and profile information.
          </p>
          <button 
            onClick={() => showToast('info', 'Data download request submitted. You will receive an email when ready.')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Request Data Download
          </button>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data Usage</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Posts</span>
              <span className="text-gray-900 dark:text-white font-medium">245</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Photos</span>
              <span className="text-gray-900 dark:text-white font-medium">1.2 GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Messages</span>
              <span className="text-gray-900 dark:text-white font-medium">3,421</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Privacy Settings</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Manage how your data is used and what information is shared.
          </p>
          <button 
            onClick={() => showToast('info', 'Privacy settings will be enhanced in the next update!')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Manage Privacy
          </button>
        </div>
      </div>
    </div>
  )

  const renderDangerSection = () => (
    <div className="space-y-6">
      <AccountDeletion />
    </div>
  )


  // Create security settings state to pass to AI assistant
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    passwordStrength: 2,
    lastPasswordChange: null,
    recentSessionsReview: false,
    profileVisibility: 'public',
    activeSessions: [
      { id: 1, device: 'Current Device', location: 'San Francisco, CA' },
      { id: 2, device: 'iPhone App', location: 'New York, NY' },
      { id: 3, device: 'MacBook Pro', location: 'Los Angeles, CA' }
    ]
  })

  const handleSecuritySettingsUpdate = (updatedSettings) => {
    setSecuritySettings(prev => ({ ...prev, ...updatedSettings }))
    // Here you could also sync with your backend API
  }

  const renderAISecuritySection = () => (
    <div className="h-full">
      <SecurityAIAssistant 
        userSettings={securitySettings}
        onSettingsUpdate={handleSecuritySettingsUpdate}
      />
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'password':
        return renderPasswordSection()
      case 'security':
        return renderSecuritySection()
      case 'ai-security':
        return renderAISecuritySection()
      case 'sessions':
        return renderSessionsSection()
      case 'data':
        return renderDataSection()
      case 'danger':
        return renderDangerSection()
      default:
        return renderPasswordSection()
    }
  }

  if (isModal) {
    // Modal layout without sidebar - fits within existing SettingsModal
    return (
      <div className="h-full">
        {/* Header with back button for clarity */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center space-x-3 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title="Back to Settings"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Account Settings
            </h2>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-6 pb-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            {sidebarSections.map((section) => {
              const IconComponent = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    )
  }

  // Full page layout with sidebar
  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account</h2>
          </div>
        </div>

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
                  <span className="font-medium text-sm">{section.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
