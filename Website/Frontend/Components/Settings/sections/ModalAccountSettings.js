'use client'

import { useState } from 'react'
import { Eye, EyeOff, Shield, Lock, Bell, Globe } from 'lucide-react'

export default function ModalAccountSettings() {
  const [settings, setSettings] = useState({
    twoFactor: false,
    loginNotifications: true,
    profileVisibility: 'public',
    dataDownload: false,
    activityStatus: true,
    readReceipts: true
  })

  const handleToggle = (setting) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }))
  }

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full p-1 transition-colors ${
        enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Security Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-orange-500" />
          Security
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
            </div>
            <ToggleSwitch 
              enabled={settings.twoFactor} 
              onToggle={() => handleToggle('twoFactor')} 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Login Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified of new login attempts</p>
            </div>
            <ToggleSwitch 
              enabled={settings.loginNotifications} 
              onToggle={() => handleToggle('loginNotifications')} 
            />
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Lock className="w-5 h-5 mr-2 text-orange-500" />
          Privacy
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Profile Visibility</h4>
              <Globe className="w-4 h-4 text-gray-500" />
            </div>
            <select 
              value={settings.profileVisibility}
              onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Activity Status</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Show when you're active</p>
            </div>
            <ToggleSwitch 
              enabled={settings.activityStatus} 
              onToggle={() => handleToggle('activityStatus')} 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Read Receipts</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Let others see when you read messages</p>
            </div>
            <ToggleSwitch 
              enabled={settings.readReceipts} 
              onToggle={() => handleToggle('readReceipts')} 
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-orange-500" />
          Data Management
        </h3>
        
        <div className="space-y-3">
          <button className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
            <h4 className="font-medium text-gray-900 dark:text-white">Download Your Data</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get a copy of your information</p>
          </button>

          <button className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
            <h4 className="font-medium text-gray-900 dark:text-white">Account Deactivation</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Temporarily disable your account</p>
          </button>

          <button className="w-full p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left border border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-600 dark:text-red-400">Delete Account</h4>
            <p className="text-sm text-red-500 dark:text-red-400">Permanently delete your account and data</p>
          </button>
        </div>
      </div>
    </div>
  )
}
