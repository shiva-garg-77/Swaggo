'use client'

import { useState, useEffect } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { ArrowLeft, Search, UserMinus, UserPlus, Users, Star, CheckCircle, Hash, User, Heart, Eye } from 'lucide-react'
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { GET_CLOSE_FRIENDS, ADD_CLOSE_FRIEND, REMOVE_CLOSE_FRIEND, GET_ALL_USERS } from '../../../lib/graphql/profileQueries'
import { SEARCH_USERS } from '../../../lib/graphql/queries'

export default function CloseFriends({ onBack, isModal = false }) {
  const { user } = useFixedSecureAuth()
  const [closeFriends, setCloseFriends] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [popularUsers, setPopularUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPopular, setLoadingPopular] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)
  
  const [getCloseFriends, { data: closeFriendsData, loading: closeFriendsLoading, error: closeFriendsError }] = useLazyQuery(GET_CLOSE_FRIENDS)
  const [searchUsers, { data: searchData, loading: searchLoading, error: searchError }] = useLazyQuery(SEARCH_USERS)
  const [getAllUsers, { data: allUsersData, loading: allUsersLoading }] = useLazyQuery(GET_ALL_USERS)
  const [addCloseFriend] = useMutation(ADD_CLOSE_FRIEND)
  const [removeCloseFriend] = useMutation(REMOVE_CLOSE_FRIEND)
  
  // Function to load popular/suggested users
  const loadPopularUsers = () => {
    if (popularUsers.length > 0) return // Already loaded
    
    setLoadingPopular(true)
    getAllUsers()
  }
  
  useEffect(() => {
    if (user?.profileid) {
      getCloseFriends({ variables: { profileid: user.profileid } })
      // Load popular users for suggestions
      setTimeout(() => loadPopularUsers(), 1000) // Delay to let close friends load first
    }
  }, [user?.profileid, getCloseFriends])
  
  useEffect(() => {
    if (closeFriendsData?.getCloseFriends) {
      setCloseFriends(closeFriendsData.getCloseFriends)
    }
  }, [closeFriendsData])
  
  // Handle popular users data
  useEffect(() => {
    if (allUsersData?.getUsers && loadingPopular) {
      const currentFriendIds = closeFriends.map(cf => cf.closeFriend?.profileid)
      const filteredUsers = allUsersData.getUsers.filter(user => 
        !currentFriendIds.includes(user.profileid) && 
        user.profileid !== user?.profileid &&
        (user.followers?.length || 0) > 0 // Users with some followers
      )
      
      // Sort by follower count and verified status
      const sortedUsers = filteredUsers.sort((a, b) => {
        // Verified users first
        if (a.isVerified && !b.isVerified) return -1
        if (!a.isVerified && b.isVerified) return 1
        
        // Then by follower count
        const aFollowers = a.followers?.length || 0
        const bFollowers = b.followers?.length || 0
        return bFollowers - aFollowers
      })
      
      setPopularUsers(sortedUsers.slice(0, 6))
      setLoadingPopular(false)
    }
  }, [allUsersData, closeFriends, user?.profileid, loadingPopular])
  
  useEffect(() => {
    if (searchData?.searchUsers) {
      console.log('📊 Raw search data received:', searchData.searchUsers)
      // Filter out users who are already close friends
      const currentFriendIds = closeFriends.map(cf => cf.closeFriend?.profileid)
      const filteredResults = searchData.searchUsers.filter(searchUser => 
        !currentFriendIds.includes(searchUser.profileid) && 
        searchUser.profileid !== user?.profileid // Don't include self
      )
      
      // Smart ranking: prioritize real/active users
      const rankedResults = filteredResults.sort((a, b) => {
        // First priority: Exact username matches
        const aExactUsername = a.username?.toLowerCase() === searchQuery.toLowerCase()
        const bExactUsername = b.username?.toLowerCase() === searchQuery.toLowerCase()
        if (aExactUsername && !bExactUsername) return -1
        if (!aExactUsername && bExactUsername) return 1
        
        // Second priority: Verified users
        if (a.isVerified && !b.isVerified) return -1
        if (!a.isVerified && b.isVerified) return 1
        
        // Third priority: Users with activity (posts, followers)
        const aActivity = (a.postsCount || 0) + (a.followersCount || 0)
        const bActivity = (b.postsCount || 0) + (b.followersCount || 0)
        
        // Prefer users with some activity but not too much (avoid spam accounts)
        const getActivityScore = (activity) => {
          if (activity === 0) return 0 // No activity
          if (activity <= 50) return 3 // Good activity
          if (activity <= 200) return 2 // High activity
          return 1 // Very high activity (might be spam)
        }
        
        const aScore = getActivityScore(aActivity)
        const bScore = getActivityScore(bActivity)
        if (aScore !== bScore) return bScore - aScore
        
        // Fourth priority: Match type and relevance score
        if (a.matchType && b.matchType) {
          const matchTypeOrder = { 'exact': 0, 'username': 1, 'name': 2, 'partial': 3, 'related': 4 }
          const aMatchOrder = matchTypeOrder[a.matchType] || 5
          const bMatchOrder = matchTypeOrder[b.matchType] || 5
          if (aMatchOrder !== bMatchOrder) return aMatchOrder - bMatchOrder
        }
        
        // Fifth priority: Relevance score
        const aRelevance = a.relevanceScore || 0
        const bRelevance = b.relevanceScore || 0
        if (aRelevance !== bRelevance) return bRelevance - aRelevance
        
        // Final fallback: Alphabetical by username
        return (a.username || '').localeCompare(b.username || '')
      })
      
      console.log('✅ Filtered and ranked search results:', rankedResults)
      setSearchResults(rankedResults)
    }
  }, [searchData, closeFriends, user?.profileid, searchQuery])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [])
  
  const handleSearch = (query) => {
    setSearchQuery(query)
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    if (query.length > 1) {
      // Debounce search with shorter delay for better UX
      const timeout = setTimeout(() => {
        console.log('🔍 Searching for users with query:', query)
        searchUsers({ 
          variables: { 
            query: query.trim(),
            limit: 20,
            includeRelated: query.length <= 3 // Include related users for short queries
          } 
        })
      }, query.length <= 2 ? 800 : 400) // Longer delay for very short queries
      
      setSearchTimeout(timeout)
    } else {
      setSearchResults([])
    }
  }
  
  const handleAddCloseFriend = async (targetProfileId) => {
    try {
      setLoading(true)
      await addCloseFriend({
        variables: {
          profileid: user.profileid,
          targetprofileid: targetProfileId
        }
      })
      
      // Refresh close friends list
      getCloseFriends({ variables: { profileid: user.profileid } })
      
      // Clear search
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Error adding close friend:', error)
      alert('Failed to add close friend')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRemoveCloseFriend = async (targetProfileId) => {
    try {
      setLoading(true)
      await removeCloseFriend({
        variables: {
          profileid: user.profileid,
          targetprofileid: targetProfileId
        }
      })
      
      // Refresh close friends list
      getCloseFriends({ variables: { profileid: user.profileid } })
    } catch (error) {
      console.error('Error removing close friend:', error)
      alert('Failed to remove close friend')
    } finally {
      setLoading(false)
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
                  <Star className="w-6 h-6 text-green-500 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Close Friends</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={isModal ? "max-w-4xl mx-auto space-y-6" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Close Friends</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Close friends will see a green ring around your profile picture when you share content just for them.
                Only you can see who's on your close friends list.
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Close Friends</h3>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by username or name (e.g., @john_doe or John)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Search Loading */}
          {searchLoading && searchQuery.length > 1 && (
            <div className="mt-4 flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Searching...</span>
            </div>
          )}
          
          {/* Search Error */}
          {searchError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Error searching users: {searchError.message}</p>
            </div>
          )}
          
          {/* No Results Message */}
          {!searchLoading && searchQuery.length > 1 && searchResults.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <Search className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">No users found for "{searchQuery}"</h4>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Try searching with a different username or name. Make sure you're searching for real, active users.
                  </p>
                  <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <p className="font-medium mb-1">Search tips:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Use exact usernames for best results</li>
                      <li>Try partial names or usernames</li>
                      <li>Look for verified users (they have a blue checkmark)</li>
                      <li>Active users with posts and followers are prioritized</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Ranked by relevance and activity
                </span>
              </div>
              {searchResults.map((user) => (
                <div key={user.profileid} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.profilePic || '/default-profile.svg'}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/default-profile.svg' }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                        {user.isVerified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                        {/* Match type badge */}
                        {user.matchType && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {user.matchType}
                          </span>
                        )}
                      </div>
                      {user.name && <p className="text-sm text-gray-500 dark:text-gray-400">{user.name}</p>}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center space-x-1"><User className="w-3 h-3" /><span>{user.followersCount || 0} followers</span></span>
                        {typeof user.postsCount === 'number' && (
                          <span className="flex items-center space-x-1"><Eye className="w-3 h-3" /><span>{user.postsCount} posts</span></span>
                        )}
                        {typeof user.relevanceScore === 'number' && (
                          <span className="flex items-center space-x-1"><Hash className="w-3 h-3" /><span>score {user.relevanceScore}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddCloseFriend(user.profileid)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Popular Users Suggestions */}
          {searchQuery.length === 0 && popularUsers.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Users</h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">Active users you might know</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {popularUsers.map((user) => (
                  <div key={user.profileid} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-100 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <img
                        src={user.profilePic || '/default-profile.svg'}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/default-profile.svg' }}
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                          {user.isVerified && <CheckCircle className="w-3 h-3 text-blue-500" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.followers?.length || 0} followers
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCloseFriend(user.profileid)}
                      disabled={loading}
                      className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                      title="Add to close friends"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Loading state for popular users */}
          {searchQuery.length === 0 && (loadingPopular || allUsersLoading) && popularUsers.length === 0 && (
            <div className="mt-4 flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading suggestions...</span>
            </div>
          )}
        </div>

        {/* Current Close Friends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Close Friends ({closeFriends.length})
          </h3>
          
          {closeFriendsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : closeFriends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No close friends added yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Search for friends to add them to your close friends list</p>
            </div>
          ) : (
            <div className="space-y-2">
              {closeFriends.map((closeFriend) => (
                <div key={closeFriend.closefriendid} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={closeFriend.closeFriend?.profilePic || '/default-profile.svg'}
                        alt={closeFriend.closeFriend?.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white dark:border-gray-700">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{closeFriend.closeFriend?.username || 'Unknown'}</p>
                      {closeFriend.closeFriend?.name && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{closeFriend.closeFriend.name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCloseFriend(closeFriend.closeFriend?.profileid || closeFriend.closefriendid)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
