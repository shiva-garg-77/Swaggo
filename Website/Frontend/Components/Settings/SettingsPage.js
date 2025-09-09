'use client'

import { useState } from 'react'
import { 
  ArrowLeft, 
  User, 
  Shield, 
  MessageSquare, 
  CreditCard, 
  UserX, 
  Users, 
  UserMinus, 
  Bookmark, 
  Heart, 
  Tag, 
  FileText, 
  HelpCircle,
  Search
} from 'lucide-react'

// Import individual section components
import EditProfile from './sections/EditProfile'
import AccountSettings from './sections/AccountSettings'
import MessageSettings from './sections/MessageSettings'
import Transactions from './sections/Transactions'
import RestrictedAccounts from './sections/RestrictedAccounts'
import CloseFriends from './sections/CloseFriends'
import BlockedAccounts from './sections/BlockedAccounts'
import SavedPosts from './sections/SavedPosts'
import LikedPosts from './sections/LikedPosts'
import TagsMentions from './sections/TagsMentions'
import PrivacyPolicy from './sections/PrivacyPolicy'
import ContactUs from './sections/ContactUs'

const settingsSections = [
  {
    id: 'edit-profile',
    title: 'Edit Profile',
    description: 'Update your profile information and settings',
    icon: 'User',
    path: 'edit-profile'
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Security, privacy and account preferences',
    icon: 'Shield',
    path: 'account'
  },
  {
    id: 'messages',
    title: 'Manage Who Can Message You',
    description: 'Control who can send you messages',
    icon: 'MessageSquare',
    path: 'messages'
  },
  {
    id: 'transactions',
    title: 'Transactions',
    description: 'View payment history and manage billing',
    icon: 'CreditCard',
    path: 'transactions'
  },
  {
    id: 'restricted',
    title: 'Restricted / Unwanted Accounts',
    description: 'Manage restricted users and content',
    icon: 'UserX',
    path: 'restricted',
    badge: 3
  },
  {
    id: 'close-friends',
    title: 'Close Friends',
    description: 'Manage your close friends list',
    icon: 'Users',
    path: 'close-friends',
    badge: 12
  },
  {
    id: 'blocked',
    title: 'Blocked Accounts',
    description: 'View and manage blocked users',
    icon: 'UserMinus',
    path: 'blocked',
    badge: 5
  },
  {
    id: 'saved-posts',
    title: 'Saved Posts',
    description: 'Access your saved posts and collections',
    icon: 'Bookmark',
    path: 'saved-posts',
    badge: 47
  },
  {
    id: 'liked-posts',
    title: 'Liked Posts',
    description: 'View posts you\'ve liked',
    icon: 'Heart',
    path: 'liked-posts'
  },
  {
    id: 'tags-mentions',
    title: 'Tags & Mentions',
    description: 'Manage posts where you\'re tagged',
    icon: 'Tag',
    path: 'tags-mentions'
  },
  {
    id: 'privacy-policy',
    title: 'Privacy & Policy',
    description: 'Privacy settings and terms of service',
    icon: 'FileText',
    path: 'privacy-policy'
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    description: 'Get help and support',
    icon: 'HelpCircle',
    path: 'contact-us'
  }
]

const iconComponents = {
  User,
  Shield,
  MessageSquare,
  CreditCard,
  UserX,
  Users,
  UserMinus,
  Bookmark,
  Heart,
  Tag,
  FileText,
  HelpCircle
}

export default function SettingsPage({ onBack }) {
  const [activeSection, setActiveSection] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSections = settingsSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'edit-profile':
        return <EditProfile onBack={() => setActiveSection(null)} />
      case 'account':
        return <AccountSettings onBack={() => setActiveSection(null)} />
      case 'messages':
        return <MessageSettings onBack={() => setActiveSection(null)} />
      case 'transactions':
        return <Transactions onBack={() => setActiveSection(null)} />
      case 'restricted':
        return <RestrictedAccounts onBack={() => setActiveSection(null)} />
      case 'close-friends':
        return <CloseFriends onBack={() => setActiveSection(null)} />
      case 'blocked':
        return <BlockedAccounts onBack={() => setActiveSection(null)} />
      case 'saved-posts':
        return <SavedPosts onBack={() => setActiveSection(null)} />
      case 'liked-posts':
        return <LikedPosts onBack={() => setActiveSection(null)} />
      case 'tags-mentions':
        return <TagsMentions onBack={() => setActiveSection(null)} />
      case 'privacy-policy':
        return <PrivacyPolicy onBack={() => setActiveSection(null)} />
      case 'contact-us':
        return <ContactUs onBack={() => setActiveSection(null)} />
      default:
        return null
    }
  }

  if (activeSection) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderSection()}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-3"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all duration-200"
            />
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-4 md:gap-6">
          {filteredSections.map((section) => {
            const IconComponent = iconComponents[section.icon]
            
            return (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors duration-200">
                      <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {section.badge && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {section.badge}
                      </span>
                    )}
                    <ArrowLeft className="w-5 h-5 text-gray-400 transform rotate-180 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No settings found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try searching with different keywords
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
