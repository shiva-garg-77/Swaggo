'use client'

import { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { ArrowLeft, AtSign, Tag, Bell, BellOff, Eye, EyeOff, Clock, MessageCircle, Image as ImageIcon, Video } from 'lucide-react'
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { GET_MENTIONS, MARK_MENTION_AS_READ, GET_USER_SETTINGS, UPDATE_USER_SETTINGS } from '../../../lib/graphql/profileQueries'

export default function TagsMentions({ onBack, isModal = false }) {
  const { user } = useFixedSecureAuth()
  const [mentions, setMentions] = useState([])
  const [settings, setSettings] = useState({
    allowMentions: true,
    mentionNotifications: true,
    tagNotifications: true,
    showTaggedPosts: true
  })
  const [activeTab, setActiveTab] = useState('mentions')
  
  const [getMentions, { data: mentionsData, loading: mentionsLoading }] = useLazyQuery(GET_MENTIONS)
  const [markMentionAsRead] = useMutation(MARK_MENTION_AS_READ)
  const [getUserSettings, { data: settingsData }] = useLazyQuery(GET_USER_SETTINGS)
  const [updateUserSettings] = useMutation(UPDATE_USER_SETTINGS)
  
  useEffect(() => {
    if (user?.profileid) {
      getMentions({ variables: { profileid: user.profileid } })
      getUserSettings({ variables: { profileid: user.profileid } })
    }
  }, [user?.profileid, getMentions, getUserSettings])
  
  useEffect(() => {
    if (mentionsData?.getMentions) {
      setMentions(mentionsData.getMentions)
    }
  }, [mentionsData])
  
  const handleMarkAsRead = async (mentionId) => {
    try {
      await markMentionAsRead({ variables: { mentionid: mentionId } })
      setMentions(mentions.map(m => m.mentionid === mentionId ? { ...m, isread: true } : m))
    } catch (error) {
      console.error('Error marking mention as read:', error)
    }
  }
  
  useEffect(() => {
    if (settingsData?.getUserSettings) {
      const s = settingsData.getUserSettings
      setSettings(prev => ({
        ...prev,
        allowMentions: s.allowMentions,
        mentionNotifications: s.mentionNotifications,
        tagNotifications: s.tagNotifications,
        showTaggedPosts: s.showTaggedPosts
      }))
    }
  }, [settingsData])

  const handleSettingsChange = async (setting, value) => {
    const newState = { ...settings, [setting]: value }
    setSettings(newState)
    // Persist to backend
    try {
      if (!user?.profileid) return
      await updateUserSettings({
        variables: {
          profileid: user.profileid,
          [setting]: value
        }
      })
    } catch (err) {
      console.error('Failed to update settings', err)
    }
  }
  
  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)
    
    if (diffInSeconds < 60) return 'now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }
  
  const getContextIcon = (contextType) => {
    switch (contextType) {
      case 'post':
        return <ImageIcon className="w-4 h-4" />
      case 'comment':
        return <MessageCircle className="w-4 h-4" />
      case 'story':
        return <Video className="w-4 h-4" />
      default:
        return <AtSign className="w-4 h-4" />
    }
  }

  return (
    <div className={isModal ? "p-6 bg-gray-50/50 dark:bg-gray-900/50 h-full overflow-y-auto" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      {!isModal && (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-3">
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center">
                  <AtSign className="w-6 h-6 text-blue-500 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tags & Mentions</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={isModal ? "max-w-4xl mx-auto space-y-6" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('mentions')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'mentions'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <AtSign className="w-4 h-4" />
                <span>Mentions</span>
                {mentions.filter(m => !m.isread).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {mentions.filter(m => !m.isread).length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-b-xl p-6 shadow-sm border-x border-b border-gray-200 dark:border-gray-700">
          {activeTab === 'mentions' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Mentions</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {mentions.length} total mentions
                </div>
              </div>
              
              {mentionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : mentions.length === 0 ? (
                <div className="text-center py-12">
                  <AtSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No mentions yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    When someone mentions you in a post or comment, it will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentions.map((mention) => (
                    <div
                      key={mention.mentionid}
                      className={`p-4 rounded-lg border transition-colors ${
                        mention.isread
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <img
                            src={mention.mentionerProfile?.profilePic || '/default-profile.svg'}
                            alt={mention.mentionerProfile?.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {mention.mentionerProfile?.username}
                              </p>
                              <span className="text-gray-500 dark:text-gray-400">mentioned you in a</span>
                              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                                {getContextIcon(mention.contexttype)}
                                <span className="text-sm">{mention.contexttype}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeAgo(mention.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!mention.isread && (
                            <button
                              onClick={() => handleMarkAsRead(mention.mentionid)}
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            title="View context"
                          >
                            <AtSign className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Mention & Tag Settings</h2>
              
              <div className="space-y-6">
                {/* Allow Mentions */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Allow Mentions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Let others mention you in their posts and comments
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowMentions}
                      onChange={(e) => handleSettingsChange('allowMentions', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {/* Mention Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Mention Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when someone mentions you
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {settings.mentionNotifications ? (
                      <Bell className="w-5 h-5 text-green-500" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-400" />
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.mentionNotifications}
                        onChange={(e) => handleSettingsChange('mentionNotifications', e.target.checked)}
                        className="sr-only peer"
                        disabled={!settings.allowMentions}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                    </label>
                  </div>
                </div>
                
                {/* Tag Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Tag Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when someone tags you in a post
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {settings.tagNotifications ? (
                      <Bell className="w-5 h-5 text-green-500" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-400" />
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.tagNotifications}
                        onChange={(e) => handleSettingsChange('tagNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                {/* Show Tagged Posts */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Show Tagged Posts on Profile</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Display posts you're tagged in on your profile
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {settings.showTaggedPosts ? (
                      <Eye className="w-5 h-5 text-green-500" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showTaggedPosts}
                        onChange={(e) => handleSettingsChange('showTaggedPosts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Info */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AtSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">How Tags & Mentions Work</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Mentions:</strong> When someone types @username in posts or comments</li>
                      <li>• <strong>Tags:</strong> When someone adds you to their post using the tag people feature</li>
                      <li>• <strong>Privacy:</strong> You can control who can mention and tag you in your privacy settings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
