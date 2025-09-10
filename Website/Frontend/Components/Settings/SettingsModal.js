'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
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
  ChevronRight,
  ArrowLeft,
  Search,
  Palette,
  Globe,
  Eye
} from 'lucide-react'

// Import section components
import ModalEditProfile from './sections/ModalEditProfile'
import ModalAccountSettings from './sections/ModalAccountSettings'
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
import HelpSupportSection from './sections/HelpSupportSection'

const settingsSections = [
  {
    id: 'edit-profile',
    title: 'Edit Profile',
    icon: User,
  },
  {
    id: 'account',
    title: 'Account',
    icon: Shield,
  },
  {
    id: 'messages',
    title: 'Manage Who Can Message You',
    icon: MessageSquare,
  },
  {
    id: 'transactions',
    title: 'Transactions',
    icon: CreditCard,
  },
  {
    id: 'restricted',
    title: 'Restricted / Unwanted Accounts',
    icon: UserX,
  },
  {
    id: 'close-friends',
    title: 'Close Friends',
    icon: Users,
  },
  {
    id: 'blocked',
    title: 'Blocked Accounts',
    icon: UserMinus,
  },
  {
    id: 'saved-posts',
    title: 'Saved Post',
    icon: Bookmark,
  },
  {
    id: 'liked-posts',
    title: 'Like Post',
    icon: Heart,
  },
  {
    id: 'tags-mentions',
    title: 'Tags and Mentions',
    icon: Tag,
  },
  {
    id: 'privacy-policy',
    title: 'Privacy and Policy',
    icon: FileText,
  },
  {
    id: 'help-support',
    title: 'Help & Support (AI)',
    icon: HelpCircle,
  }
]

export default function SettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('edit-profile')

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'edit-profile':
        return <ModalEditProfile />
      case 'account':
        return <ModalAccountSettings />
      case 'messages':
        return <MessageSettings isModal={true} />
      case 'transactions':
        return <Transactions isModal={true} />
      case 'restricted':
        return <RestrictedAccounts isModal={true} />
      case 'close-friends':
        return <CloseFriends isModal={true} />
      case 'blocked':
        return <BlockedAccounts isModal={true} />
      case 'saved-posts':
        return <SavedPosts isModal={true} />
      case 'liked-posts':
        return <LikedPosts isModal={true} />
      case 'tags-mentions':
        return <TagsMentions isModal={true} />
      case 'privacy-policy':
        return <PrivacyPolicy isModal={true} />
      case 'help-support':
        return <HelpSupportSection isModal={true} />
      default:
        return <ModalEditProfile />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl h-[90vh] flex overflow-hidden shadow-2xl">
        {/* Left Sidebar - Settings Navigation */}
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SW</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">SWAGGO</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Settings</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Settings Menu */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {settingsSections.map((section) => {
                const IconComponent = section.icon
                const isActive = activeSection === section.id
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive 
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {settingsSections.find(s => s.id === activeSection)?.title}
              </h1>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Activity Status</span>
                  <div className="w-12 h-6 bg-red-500 rounded-full p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Private Account</span>
                  <div className="w-12 h-6 bg-red-500 rounded-full p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
