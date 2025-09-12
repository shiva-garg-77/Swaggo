'use client'

import { useState } from 'react'
import { MapPin, Calendar } from 'lucide-react'

export default function ModalEditProfile() {
  const [profileData, setProfileData] = useState({
    name: 'default previous name',
    username: 'default previous username',
    bio: '',
    gender: '',
    location: '',
    dateOfBirth: ''
  })

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6">
      {/* Profile Picture Section */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center">
            <span className="text-white text-2xl font-bold">profilepic</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-3 mb-8">
        <button className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
          Change pic
        </button>
      </div>

      {/* Form Fields */}
      <div className="max-w-md mx-auto space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            NAME
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
            placeholder="default previous name"
          />
        </div>

        {/* Username Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            USERNAME
          </label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
            placeholder="default previous username"
          />
        </div>

        {/* Bio Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            BIO
          </label>
          <textarea
            rows={4}
            value={profileData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200 resize-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Location and Gender Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <MapPin className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Location</span>
            </button>
          </div>
          <div>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">Gender</span>
            </button>
          </div>
        </div>

        {/* Edit Button */}
        <div className="pt-4">
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200">
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
