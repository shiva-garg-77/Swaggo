'use client'

import { useState, useEffect, useRef } from 'react'
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
  Eye,
  Settings,
  Bell,
  Download,
  Smartphone
} from 'lucide-react'

// Import enhanced section components
import EnhancedEditProfile from './sections/EnhancedEditProfile'
import EnhancedAccountSettings from './sections/EnhancedAccountSettings'
import EnhancedMessageSettings from './sections/EnhancedMessageSettings'
import EnhancedTransactions from './sections/EnhancedTransactions'
import EnhancedRestrictedAccounts from './sections/EnhancedRestrictedAccounts'
import EnhancedCloseFriends from './sections/EnhancedCloseFriends'
import EnhancedBlockedAccounts from './sections/EnhancedBlockedAccounts'
import EnhancedSavedPosts from './sections/EnhancedSavedPosts'
import EnhancedLikedPosts from './sections/EnhancedLikedPosts'
import EnhancedTagsMentions from './sections/EnhancedTagsMentions'
import EnhancedPrivacyPolicy from './sections/EnhancedPrivacyPolicy'
import EnhancedContactUs from './sections/EnhancedContactUs'
import EnhancedThemeSettings from './sections/EnhancedThemeSettings'
import EnhancedAccessibilitySettings from './sections/EnhancedAccessibilitySettings'

const settingsSections = [
  {
    id: 'edit-profile',
    title: 'Edit Profile',
    description: 'Update your profile information',
    icon: User,
    category: 'account'
  },
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Security and account management',
    icon: Shield,
    category: 'account'
  },
  {
    id: 'messages',
    title: 'Message Privacy',
    description: 'Control who can message you',
    icon: MessageSquare,
    category: 'privacy'
  },
  {
    id: 'transactions',
    title: 'Transactions & Payments',
    description: 'Payment history and methods',
    icon: CreditCard,
    category: 'account'
  },
  {
    id: 'restricted',
    title: 'Restricted Accounts',
    description: 'Manage restricted users',
    icon: UserX,
    category: 'privacy',
    badge: 3
  },
  {
    id: 'close-friends',
    title: 'Close Friends',
    description: 'Manage your close friends list',
    icon: Users,
    category: 'social',
    badge: 12
  },
  {
    id: 'blocked',
    title: 'Blocked Accounts',
    description: 'View and manage blocked users',
    icon: UserMinus,
    category: 'privacy',
    badge: 5
  },
  {
    id: 'saved-posts',
    title: 'Saved Posts',
    description: 'Organize your saved content',
    icon: Bookmark,
    category: 'content',
    badge: 47
  },
  {
    id: 'liked-posts',
    title: 'Liked Posts',
    description: 'View posts you\'ve liked',
    icon: Heart,
    category: 'content',
    badge: 156
  },
  {
    id: 'tags-mentions',
    title: 'Tags & Mentions',
    description: 'Manage posts where you\'re tagged',
    icon: Tag,
    category: 'privacy'
  },
  {
    id: 'theme',
    title: 'Theme & Display',
    description: 'Customize app appearance',
    icon: Palette,
    category: 'preferences'
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    description: 'Accessibility settings',
    icon: Eye,
    category: 'preferences'
  },
  {
    id: 'privacy-policy',
    title: 'Privacy & Policy',
    description: 'Privacy settings and policies',
    icon: FileText,
    category: 'legal'
  },
  {
    id: 'contact-us',
    title: 'Contact & Support',
    description: 'Get help and support',
    icon: HelpCircle,
    category: 'support'
  }
]

const categories = {
  account: { title: 'Account', icon: User },
  privacy: { title: 'Privacy', icon: Shield },
  social: { title: 'Social', icon: Users },
  content: { title: 'Content', icon: Bookmark },
  preferences: { title: 'Preferences', icon: Settings },
  legal: { title: 'Legal', icon: FileText },
  support: { title: 'Support', icon: HelpCircle }
}

export default function EnhancedSettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const modalRef = useRef(null)

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const filteredSections = settingsSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedSections = filteredSections.reduce((acc, section) => {
    const category = section.category
    if (!acc[category]) acc[category] = []
    acc[category].push(section)
    return acc
  }, {})

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'edit-profile':
        return <EnhancedEditProfile onBack={() => setActiveSection(null)} />
      case 'account':
        return <EnhancedAccountSettings onBack={() => setActiveSection(null)} />
      case 'messages':
        return <EnhancedMessageSettings onBack={() => setActiveSection(null)} />
      case 'transactions':
        return <EnhancedTransactions onBack={() => setActiveSection(null)} />
      case 'restricted':
        return <EnhancedRestrictedAccounts onBack={() => setActiveSection(null)} />
      case 'close-friends':
        return <EnhancedCloseFriends onBack={() => setActiveSection(null)} />
      case 'blocked':
        return <EnhancedBlockedAccounts onBack={() => setActiveSection(null)} />
      case 'saved-posts':
        return <EnhancedSavedPosts onBack={() => setActiveSection(null)} />
      case 'liked-posts':
        return <EnhancedLikedPosts onBack={() => setActiveSection(null)} />
      case 'tags-mentions':
        return <EnhancedTagsMentions onBack={() => setActiveSection(null)} />
      case 'theme':
        return <EnhancedThemeSettings onBack={() => setActiveSection(null)} />
      case 'accessibility':
        return <EnhancedAccessibilitySettings onBack={() => setActiveSection(null)} />
      case 'privacy-policy':
        return <EnhancedPrivacyPolicy onBack={() => setActiveSection(null)} />
      case 'contact-us':
        return <EnhancedContactUs onBack={() => setActiveSection(null)} />
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 lg:p-4">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-900 w-full h-full lg:w-full lg:max-w-6xl lg:h-[90vh] lg:rounded-2xl flex overflow-hidden shadow-2xl animate-in fade-in-0 duration-300"
      >
        {/* Mobile Layout */}
        {isMobile ? (
          <div className="flex flex-col w-full">
            {activeSection ? (
              // Mobile Section View
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {settingsSections.find(s => s.id === activeSection)?.title}
                  </h1>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {renderSectionContent()}
                </div>
              </div>
            ) : (
              // Mobile Main Menu
              <div className="flex flex-col w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">SW</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search settings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Settings List */}
                <div className="flex-1 overflow-y-auto">
                  {Object.entries(groupedSections).map(([categoryKey, sections]) => (
                    <div key={categoryKey} className="py-4">
                      <h3 className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {categories[categoryKey]?.title}
                      </h3>
                      <div className="space-y-1 px-2">
                        {sections.map((section) => {
                          const IconComponent = section.icon
                          return (
                            <button
                              key={section.id}
                              onClick={() => setActiveSection(section.id)}
                              className="w-full flex items-center justify-between p-3 mx-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                                  <IconComponent className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="text-left">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {section.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {section.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {section.badge && (
                                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium px-2 py-1 rounded-full">
                                    {section.badge}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Desktop Layout
          <>
            {/* Left Sidebar */}
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

              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search settings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Settings Menu */}
              <div className="flex-1 overflow-y-auto p-2">
                {Object.entries(groupedSections).map(([categoryKey, sections]) => (
                  <div key={categoryKey} className="mb-6">
                    <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {categories[categoryKey]?.title}
                    </h3>
                    <div className="space-y-1">
                      {sections.map((section) => {
                        const IconComponent = section.icon
                        const isActive = activeSection === section.id
                        
                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                              isActive 
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent className={`w-4 h-4 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} />
                              <span className="text-sm font-medium">{section.title}</span>
                            </div>
                            {section.badge && (
                              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">
                                {section.badge}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col">
              {activeSection ? (
                <>
                  {/* Content Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {settingsSections.find(s => s.id === activeSection)?.title}
                      </h1>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Activity Status</span>
                          <div className="w-12 h-6 bg-red-500 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm transition-transform"></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Private Account</span>
                          <div className="w-12 h-6 bg-red-500 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm transition-transform"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {renderSectionContent()}
                  </div>
                </>
              ) : (
                // Welcome Screen
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      Customize your Swaggo experience. Select a category from the sidebar to get started.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
