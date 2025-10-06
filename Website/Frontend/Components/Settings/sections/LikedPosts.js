'use client'

import { ArrowLeft, Bookmark, Heart, MessageCircle, MoreHorizontal } from 'lucide-react'
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_USER_BY_USERNAME, TOGGLE_POST_LIKE, TOGGLE_SAVE_POST } from '@/lib/graphql/queries'
import { useState } from 'react'
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import Image from 'next/image'
import InstagramPostModal from '../../MainComponents/Post/InstagramPostModal'

export default function LikedPosts({ onBack, isModal = false }) {
  const { user } = useFixedSecureAuth()
  const [selectedPost, setSelectedPost] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { loading, error, data, refetch } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: user?.username },
    skip: !user?.username,
  })

  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE, {
    onCompleted: () => {
      refetch()
    },
  })

  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST, {
    onCompleted: () => {
      refetch()
    },
  })

  const handleUnlikePost = async (postid, e) => {
    e?.stopPropagation() // Prevent post modal from opening
    if (!user?.profileid) {
      console.error('No profile ID available');
      alert('Please login again to perform this action');
      return;
    }
    
    try {
      await togglePostLike({
        variables: {
          profileid: user.profileid,
          postid: postid,
        },
      })
    } catch (err) {
      console.error('Error unliking post:', err)
      alert('Failed to unlike post. Please try again.');
    }
  }

  const handleSavePost = async (postid, e) => {
    e?.stopPropagation() // Prevent post modal from opening
    if (!user?.profileid) {
      console.error('No profile ID available');
      alert('Please login again to perform this action');
      return;
    }
    
    try {
      await toggleSavePost({
        variables: {
          profileid: user.profileid,
          postid: postid,
        },
      })
    } catch (err) {
      console.error('Error saving post:', err)
      alert('Failed to save post. Please try again.');
    }
  }

  const openPostModal = (post) => {
    setSelectedPost(post)
    setIsModalOpen(true)
  }

  const closePostModal = () => {
    setSelectedPost(null)
    setIsModalOpen(false)
  }

  const likedPosts = data?.getUserbyUsername?.likedpost || []

  // If in modal, don't show the header
  if (isModal) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">Error loading liked posts</p>
          </div>
        ) : likedPosts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Liked Posts Yet</h2>
            <p className="text-gray-500 dark:text-gray-400">Posts you like will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {likedPosts.map((post) => (
              <div
                key={post.postid}
                onClick={() => openPostModal(post)}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                {/* Post Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.profile?.profilePic ? (
                      <img
                        src={post.profile.profilePic}
                        alt={post.profile.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {post.profile?.username}
                    </span>
                    {post.profile?.isVerified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Post Image/Video */}
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                  {post.postType === 'IMAGE' ? (
                    <img
                      src={post.postUrl}
                      alt={post.title || 'Post'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png'
                      }}
                    />
                  ) : post.postType === 'VIDEO' ? (
                    <video
                      src={post.postUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <p className="text-gray-700 dark:text-gray-300 text-center">
                        {post.Description || post.title || 'Text post'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleUnlikePost(post.postid, e)}
                        className="hover:scale-110 transition-transform"
                        title="Unlike post"
                      >
                        <Heart className="w-6 h-6 text-red-500 fill-current" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          openPostModal(post)
                        }}
                        className="hover:scale-110 transition-transform"
                      >
                        <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                    <button 
                      onClick={(e) => handleSavePost(post.postid, e)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Bookmark className={`w-6 h-6 ${post.isSavedByUser ? 'text-gray-700 dark:text-gray-300 fill-current' : 'text-gray-700 dark:text-gray-300'}`} />
                    </button>
                  </div>
                  
                  {/* Post Stats */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{post.likeCount || 0} likes</span>
                    {post.title && (
                      <p className="mt-1">
                        <span className="font-semibold">{post.profile?.username}</span> {post.title}
                      </p>
                    )}
                    {post.Description && (
                      <p className="mt-1 line-clamp-2">{post.Description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Standalone view with header
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-3">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liked Posts</h1>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">Error loading liked posts</p>
          </div>
        ) : likedPosts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Liked Posts Yet</h2>
            <p className="text-gray-500 dark:text-gray-400">Posts you like will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {likedPosts.map((post) => (
              <div
                key={post.postid}
                onClick={() => openPostModal(post)}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              >
                {/* Post Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.profile?.profilePic ? (
                      <img
                        src={post.profile.profilePic}
                        alt={post.profile.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {post.profile?.username}
                    </span>
                    {post.profile?.isVerified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Post Image/Video */}
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                  {post.postType === 'IMAGE' ? (
                    <img
                      src={post.postUrl}
                      alt={post.title || 'Post'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png'
                      }}
                    />
                  ) : post.postType === 'VIDEO' ? (
                    <video
                      src={post.postUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <p className="text-gray-700 dark:text-gray-300 text-center">
                        {post.Description || post.title || 'Text post'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleUnlikePost(post.postid, e)}
                        className="hover:scale-110 transition-transform"
                        title="Unlike post"
                      >
                        <Heart className="w-6 h-6 text-red-500 fill-current" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          openPostModal(post)
                        }}
                        className="hover:scale-110 transition-transform"
                      >
                        <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                      </button>
                    </div>
                    <button 
                      onClick={(e) => handleSavePost(post.postid, e)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Bookmark className={`w-6 h-6 ${post.isSavedByUser ? 'text-gray-700 dark:text-gray-300 fill-current' : 'text-gray-700 dark:text-gray-300'}`} />
                    </button>
                  </div>
                  
                  {/* Post Stats */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{post.likeCount || 0} likes</span>
                    {post.title && (
                      <p className="mt-1">
                        <span className="font-semibold">{post.profile?.username}</span> {post.title}
                      </p>
                    )}
                    {post.Description && (
                      <p className="mt-1 line-clamp-2">{post.Description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Post Modal */}
      {isModalOpen && selectedPost && (
        <InstagramPostModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={closePostModal}
          showNavigation={false}
        />
      )}
    </div>
  )
}
