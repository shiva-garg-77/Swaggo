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
  Wifi,
  Monitor,
  Accessibility,
  Bot
} from 'lucide-react'

// Import enhanced section components
import MacOSEditProfile from './sections/MacOSEditProfile'
import HelpSupportSection from './sections/HelpSupportSection'
import EnhancedAccountSettings from './sections/EnhancedAccountSettings'
import BlockedAccountsEnhanced from './BlockedAccountsEnhanced';
import RestrictedAccountsEnhanced from './RestrictedAccountsEnhanced';
import CloseFriends from './sections/CloseFriendsComponent'
import TagsMentions from './sections/TagsMentions'
import {
  MacOSAccountSettings,
  MacOSMessageSettings,
  MacOSTransactions,
  MacOSSavedPosts,
  MacOSLikedPosts,
  MacOSPrivacyPolicy,
  MacOSContactUs,
  MacOSThemeSettings,
  MacOSAccessibilitySettings
} from './sections/MacOSPlaceholders'

const settingsSections = [
  {
    id: 'edit-profile',
    title: 'Edit Profile',
    description: 'Update your profile information and settings',
    icon: User,
    category: 'personal'
  },
  {
    id: 'account',
    title: 'Account Settings',
    description: 'Security, privacy and account management',
    icon: Shield,
    category: 'personal'
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
    description: 'Payment history and billing settings',
    icon: CreditCard,
    category: 'personal'
  },
  {
    id: 'restricted',
    title: 'Restricted Accounts',
    description: 'Manage restricted users and content',
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
    description: 'Organize your saved content collections',
    icon: Bookmark,
    category: 'content',
    badge: 47
  },
  {
    id: 'liked-posts',
    title: 'Liked Posts',
    description: 'View and manage posts you\'ve liked',
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
    title: 'Appearance',
    description: 'Customize theme and display settings',
    icon: Palette,
    category: 'system'
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    description: 'Accessibility and usability options',
    icon: Accessibility,
    category: 'system'
  },
  {
    id: 'privacy-policy',
    title: 'Privacy & Legal',
    description: 'Privacy policy and legal information',
    icon: FileText,
    category: 'legal'
  },
  {
    id: 'help-support',
    title: 'Help & Support (AI)',
    description: 'AI assistant, FAQ, guides and support',
    icon: Bot,
    category: 'support'
  }
]

const categories = {
  personal: { title: 'Personal', icon: User, color: 'text-blue-600' },
  privacy: { title: 'Privacy & Security', icon: Shield, color: 'text-green-600' },
  social: { title: 'Social', icon: Users, color: 'text-purple-600' },
  content: { title: 'Content', icon: Bookmark, color: 'text-orange-600' },
  system: { title: 'System', icon: Monitor, color: 'text-gray-600' },
  legal: { title: 'Legal & Support', icon: FileText, color: 'text-red-600' },
  support: { title: 'Help', icon: HelpCircle, color: 'text-indigo-600' }
}

export default function MacOSSettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef(null)
  const searchInputRef = useRef(null)

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle ESC key and focus management
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      // Focus search input after animation
      setTimeout(() => searchInputRef.current?.focus(), 150)
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
      setActiveSection(null)
      setSearchTerm('')
    }, 200)
  }

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
    const props = { onBack: () => setActiveSection(null) }
    
    switch (activeSection) {
      case 'edit-profile':
        return <MacOSEditProfile {...props} />
      case 'account':
        return <EnhancedAccountSettings isModal={true} {...props} />
      case 'messages':
        return <MacOSMessageSettings {...props} />
      case 'transactions':
        return <MacOSTransactions {...props} />
      case 'restricted':
        return <RestrictedAccountsEnhanced {...props} />
      case 'close-friends':
        return <CloseFriends isModal={true} {...props} />
      case 'blocked':
        return <BlockedAccountsEnhanced {...props} />
      case 'saved-posts':
        return <MacOSSavedPosts {...props} />
      case 'liked-posts':
        return <MacOSLikedPosts {...props} />
      case 'tags-mentions':
        return <TagsMentions isModal={true} {...props} />
      case 'theme':
        return <MacOSThemeSettings {...props} />
      case 'accessibility':
        return <MacOSAccessibilitySettings {...props} />
      case 'privacy-policy':
        return <MacOSPrivacyPolicy {...props} />
      case 'help-support':
        return <HelpSupportSection {...props} />
      default:
        return null
    }
  }

  if (!isOpen && !isClosing) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-8 transition-all duration-200 ${
      isClosing ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-xl"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`relative bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl w-full h-full lg:w-full lg:max-w-6xl lg:h-[88vh] lg:rounded-[20px] shadow-2xl border border-white/30 dark:border-gray-700/60 flex flex-col overflow-hidden transition-all duration-300 ${
          isClosing 
            ? 'scale-95 opacity-0' 
            : isMobile 
              ? 'scale-100 opacity-100'
              : 'scale-100 opacity-100'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* iOS-style Window Controls */}
        {!isMobile && (
          <div className="flex items-center justify-between px-6 py-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg border-b border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleClose}
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-150 flex items-center justify-center group shadow-sm hover:shadow-md"
                aria-label="Close"
                style={{
                  background: 'linear-gradient(135deg, #ff5f57 0%, #ff453a 100%)'
                }}
              >
                <span className="text-red-900 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150">✕</span>
              </button>
              <button
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-all duration-150 flex items-center justify-center group shadow-sm hover:shadow-md"
                aria-label="Minimize"
                style={{
                  background: 'linear-gradient(135deg, #ffbd2e 0%, #ff9500 100%)'
                }}
              >
                <span className="text-yellow-900 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150">−</span>
              </button>
              <button
                className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-150 flex items-center justify-center group shadow-sm hover:shadow-md"
                aria-label="Maximize"
                style={{
                  background: 'linear-gradient(135deg, #28ca42 0%, #30d158 100%)'
                }}
              >
                <span className="text-green-900 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150">⤢</span>
              </button>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-sm font-medium text-gray-700 dark:text-gray-200 tracking-wide">Settings</h1>
            </div>
            <div className="w-16 flex justify-end">
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 opacity-60"></div>
                <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 opacity-60"></div>
                <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 opacity-60"></div>
              </div>
            </div>
          </div>
        )}
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
        
        {/* Mobile Layout */}
        {isMobile ? (
          <div className="flex flex-col w-full bg-gray-50/90 dark:bg-gray-900/90">
            {activeSection ? (
              // Mobile Section View
              <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {settingsSections.find(s => s.id === activeSection)?.title}
                  </h1>
                  
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-all duration-200"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                
                {/* Mobile Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {renderSectionContent()}
                </div>
              </div>
            ) : (
              // Mobile Main Menu
              <div className="flex flex-col w-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <div className="w-4 h-4 rounded bg-white"></div>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-all duration-200"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-700/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search settings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent dark:text-white transition-all duration-200 text-sm"
                      style={{
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </div>
                </div>

                {/* Mobile Settings List */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50 scrollbar-hide">
                  {Object.entries(groupedSections).map(([categoryKey, sections]) => (
                    <div key={categoryKey} className="py-4">
                      <div className="px-4 py-2">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {categories[categoryKey]?.title}
                        </h3>
                      </div>
                      
                      <div className="px-4 space-y-2">
                        {sections.map((section) => {
                          const IconComponent = section.icon
                          return (
                            <button
                              key={section.id}
                              onClick={() => setActiveSection(section.id)}
                              className="w-full flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200 group"
                              style={{
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                                  <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-left">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {section.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {section.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {section.badge && (
                                  <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-1 rounded-full">
                                    {section.badge}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform duration-200" />
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
            <div className="w-80 bg-gray-50/60 dark:bg-gray-800/60 backdrop-blur-xl border-r border-gray-200/30 dark:border-gray-700/30 flex flex-col">
              {/* Search at Top */}
              <div className="p-4 border-b border-gray-200/30 dark:border-gray-700/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white/70 dark:bg-gray-700/70 backdrop-blur-lg border border-gray-200/40 dark:border-gray-600/40 rounded-lg focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/60 dark:text-white transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                    style={{
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                </div>
              </div>

              {/* Settings Menu */}
              <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
                {Object.entries(groupedSections).map(([categoryKey, sections]) => (
                  <div key={categoryKey} className="mb-6">
                    <div className="px-3 py-2">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {categories[categoryKey]?.title}
                      </h3>
                    </div>
                    
                    <div className="space-y-1">
                      {sections.map((section) => {
                        const IconComponent = section.icon
                        const isActive = activeSection === section.id
                        
                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                              isActive 
                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-sm' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                isActive 
                                  ? 'bg-blue-500/20' 
                                  : 'bg-gray-100/80 dark:bg-gray-600/60 group-hover:bg-white/80 dark:group-hover:bg-gray-600/80'
                              }`}>
                                <IconComponent className={`w-4 h-4 ${
                                  isActive 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`} />
                              </div>
                              <span className="text-sm font-medium">{section.title}</span>
                            </div>
                            {section.badge && (
                              <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-0.5 rounded-full">
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
            <div className="flex-1 flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
              {activeSection ? (
                <>
                  {/* Content Header */}
                  <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                          {(() => {
                            const section = settingsSections.find(s => s.id === activeSection)
                            const IconComponent = section?.icon || Settings
                            return <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          })()} 
                        </div>
                        <div>
                          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {settingsSections.find(s => s.id === activeSection)?.title}
                          </h1>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {settingsSections.find(s => s.id === activeSection)?.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Quick Toggles */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
                          <div className="relative">
                            <input type="checkbox" className="sr-only" defaultChecked />
                            <div className="w-10 h-6 bg-green-500 rounded-full shadow-inner cursor-pointer">
                              <div className="w-4 h-4 bg-white rounded-full shadow translate-x-5 transition-transform"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Private</span>
                          <div className="relative">
                            <input type="checkbox" className="sr-only" />
                            <div className="w-10 h-6 bg-gray-300 dark:bg-gray-600 rounded-full shadow-inner cursor-pointer">
                              <div className="w-4 h-4 bg-white rounded-full shadow transition-transform"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {renderSectionContent()}
                  </div>
                </>
              ) : (
                // Welcome Screen
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500"></div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                      Settings
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      Customize your Swaggo experience. Select a category from the sidebar to get started with personalizing your account, privacy, and preferences.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
