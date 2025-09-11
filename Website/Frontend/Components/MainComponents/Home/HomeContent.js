"use client";
import { useState } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../Helper/AuthProvider';
import { GET_ALL_POSTS, TOGGLE_POST_LIKE, TOGGLE_SAVE_POST } from '../../../lib/graphql/queries';
import { triggerPostsRefetch } from '../../../lib/apollo/refetchHelper';
import InstagramPostModal from '../Post/InstagramPostModal';
import InstagramPost from '../Post/InstagramPost';
import UserSearch from '../../Search/UserSearch';

export default function HomeContent() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserRecommendations, setShowUserRecommendations] = useState(true);
  
  // GraphQL Mutations
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);
  
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-first', // Fast cache, fallback to network
    notifyOnNetworkStatusChange: false
  });
  

  // Use posts from database with minimal filtering for performance
  const rawPosts = data?.getPosts || [];
  
  // Simple filter - only remove posts with truly empty URLs
  const posts = rawPosts.filter(post => {
    const imageUrl = post.postUrl || post.image;
    return imageUrl && imageUrl.trim() && imageUrl !== 'null' && imageUrl !== 'undefined';
  });
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Posts loaded:', posts.length);
  }

  // Modal handlers
  const openPostModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closePostModal = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };
  
  // Like handler with proper cache updates
  const handlePostLike = async (postId) => {
    if (!user?.profileid) {
      alert('Please login to like posts');
      return;
    }
    
    try {
      await togglePostLike({
        variables: {
          profileid: user.profileid,
          postid: postId
        },
        // Update cache without refetching to prevent scroll jump
        update: (cache, { data: mutationResult }) => {
          try {
            // Read current posts data
            const existingData = cache.readQuery({ query: GET_ALL_POSTS });
            
            if (existingData?.getPosts) {
              const updatedPosts = existingData.getPosts.map(post => {
                if ((post.id || post.postid) === postId) {
                  const currentLiked = post.isLikedByUser;
                  const currentLikeCount = post.likeCount || post.likes || 0;
                  
                  return {
                    ...post,
                    isLikedByUser: !currentLiked,
                    likeCount: currentLiked ? currentLikeCount - 1 : currentLikeCount + 1
                  };
                }
                return post;
              });
              
              // Write updated data back to cache
              cache.writeQuery({
                query: GET_ALL_POSTS,
                data: {
                  ...existingData,
                  getPosts: updatedPosts
                }
              });
            }
          } catch (cacheError) {
            console.log('Cache update failed, will rely on refetch:', cacheError);
          }
        }
      });
      
    } catch (error) {
      console.error('Like failed:', error);
      // Don't refetch on error to avoid scroll jump
      alert('Failed to like post. Please try again.');
    }
  };
  
  const handlePostSave = async (postId) => {
    if (!user?.profileid) {
      alert('Please login to save posts');
      return;
    }
    
    console.log('🔖 Saving post:', postId, 'by user:', user.profileid);
    
    try {
      const result = await toggleSavePost({
        variables: {
          profileid: user.profileid,
          postid: postId
        },
        // Update cache for save status without refetch
        update: (cache, { data: mutationResult }) => {
          try {
            const existingData = cache.readQuery({ query: GET_ALL_POSTS });
            
            if (existingData?.getPosts) {
              const updatedPosts = existingData.getPosts.map(post => {
                if ((post.id || post.postid) === postId) {
                  return {
                    ...post,
                    isSavedByUser: !post.isSavedByUser
                  };
                }
                return post;
              });
              
              cache.writeQuery({
                query: GET_ALL_POSTS,
                data: {
                  ...existingData,
                  getPosts: updatedPosts
                }
              });
            }
          } catch (cacheError) {
            console.log('Save cache update failed:', cacheError);
          }
        }
      });
      
      console.log('✅ Save toggle result:', result);
      
    } catch (error) {
      console.error('❌ Error toggling save post:', error);
      if (error.message?.includes('not logged in')) {
        alert('Please login to save posts');
      }
    }
  };
  
  // Handle post deletion
  const handlePostDeleted = (deletedPostId) => {
    console.log('🗑️ Post deleted:', deletedPostId);
    // Refetch posts to update the UI
    refetch().catch(console.error);
  };
  
  // Handle user selection from search
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowUserRecommendations(false);
    console.log('👤 User selected:', user);
    // You can navigate to user profile or show their posts here
    // For now, we'll just store the selected user
  };
  
  // Clear search and show all posts again
  const clearSearch = () => {
    setSelectedUser(null);
    setShowUserRecommendations(true);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading posts:', error);
    // Still show fallback posts on error
  }

  return (
    <>
      <div className="space-y-4 lg:space-y-6">
        <div className="mb-6">
          <UserSearch
            onUserSelect={handleUserSelect}
            placeholder="Search users..."
          />
          {selectedUser && (
            <div className="mt-4">
              <div className="text-center mb-4">
                <button
                  onClick={clearSearch}
                  className={`text-sm px-4 py-2 rounded-full transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  Clear Search
                </button>
              </div>
              <div className={`rounded-lg p-6 border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedUser.profilePic || '/default-profile.svg'}
                    alt={selectedUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = '/default-profile.svg';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {selectedUser.username}
                      </h3>
                      {selectedUser.isVerified && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedUser.name}
                    </p>
                    {selectedUser.bio && (
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {selectedUser.bio}
                      </p>
                    )}
                    <div className={`flex items-center space-x-4 mt-2 text-xs ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <span>{selectedUser.followersCount || 0} followers</span>
                      <span>{selectedUser.followingCount || 0} following</span>
                      <span>{selectedUser.postsCount || 0} posts</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg">
                      Follow
                    </button>
                    <button className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {showUserRecommendations && (
            <div className={`text-center py-4 mt-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p className="text-sm">
                🔍 Start typing to search for users
              </p>
            </div>
          )}
        </div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className={`text-center py-20 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <p className="text-lg mb-4">No posts found!</p>
            <p className="text-sm">There are no posts to display at the moment.</p>
          </div>
        ) : (
          posts.map((post) => (
            <InstagramPost 
              key={post.id || post.postid} 
              post={post} 
              theme={theme}
              onCommentClick={() => openPostModal(post)}
              onPostDeleted={handlePostDeleted}
              className="mb-4 lg:mb-6"
            />
          ))
        )}
      </div>

      {/* Post Modal */}
      <InstagramPostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={closePostModal}
      />
    </>
  );
}

// Post Card Component
function PostCard({ post, theme, user, onImageClick, onLike, onSave }) {
  // Handle both real posts from database and fallback posts
  const isRealPost = !!post.postid;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  // Simple state from server data
  const likeCount = post.likeCount || post.likes || 0;
  const isLiked = post.isLikedByUser || false;
  
  console.log('📋 Processing post:', post);
  
  const postData = {
    id: post.postid || post.id,
    username: post.profile?.username || post.username || 'Unknown User',
    fullName: post.profile?.name || post.fullName || 'Unknown User',
    avatar: post.profile?.profilePic || post.avatar || '/default-profile.svg',
    image: post.postUrl || post.image || null,
    caption: post.Description || post.caption || '',
    title: post.title || '',
    location: post.location || '',
    tags: post.tags || [],
    taggedPeople: post.taggedPeople || [],
    timeAgo: post.timeAgo || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'),
    isVerified: post.profile?.isVerified || post.isVerified || false,
    postType: post.postType || 'IMAGE',
    allowComments: post.allowComments !== false,
    hideLikeCount: post.hideLikeCount || false
  };
  
  console.log('🖼️ Post image URL:', postData.image);

  const handleLikeClick = async () => {
    if (!user?.profileid || !isRealPost) return;
    await onLike?.(postData.id);
  };
  
  // Skip rendering if no valid image URL
  if (!postData.image || postData.image === 'null' || postData.image === 'undefined') {
    console.log('⚠️ Skipping post due to invalid image URL:', postData.image);
    return null;
  }
  
  return (
    <div className={`rounded-lg overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } shadow-sm border ${
      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
    }`}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={postData.avatar}
            alt={postData.fullName || postData.username}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              console.log('❌ Avatar image failed to load:', postData.avatar);
              e.target.src = '/default-profile.svg';
            }}
            onLoad={() => {
              console.log('✅ Avatar loaded successfully:', postData.avatar);
            }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {postData.username}
              </p>
              {postData.isVerified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {postData.timeAgo}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg">
            Follow
          </button>
          <button className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post Media */}
      <div className="relative cursor-pointer" 
           onClick={onImageClick}
           onDoubleClick={handleLikeClick}>
        {postData.postType === 'VIDEO' ? (
          <video
            src={postData.image}
            className="w-full h-64 lg:h-80 object-cover hover:brightness-95 transition-all duration-200"
            autoPlay={postData.autoPlay !== false}
            loop={true}
            muted
            playsInline
            preload="auto"
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleLikeClick();
            }}
            onError={(e) => {
              // Create a safe error object for logging
              const errorInfo = {
                url: postData.image || 'No URL provided',
                error: e.type || 'Unknown error',
                timestamp: new Date().toISOString(),
                networkState: e.target?.networkState || 'Unknown',
                readyState: e.target?.readyState || 'Unknown',
                videoWidth: e.target?.videoWidth || 0,
                videoHeight: e.target?.videoHeight || 0
              };
              
              // Log individual properties to avoid serialization issues
              console.group('❌ Video Load Error');
              console.error('URL:', errorInfo.url);
              console.error('Error type:', errorInfo.error);
              console.error('Timestamp:', errorInfo.timestamp);
              console.error('Network state:', errorInfo.networkState);
              console.error('Ready state:', errorInfo.readyState);
              if (errorInfo.videoWidth === 0 && errorInfo.videoHeight === 0) {
                console.error('Issue: Video dimensions are 0x0 - likely a broken or invalid video URL');
              }
              console.groupEnd();
              
              // Hide broken video
              e.target.style.display = 'none';
              
              // Show error placeholder
              const parent = e.target.parentElement;
              if (parent && !parent.querySelector('.video-error')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'video-error w-full h-64 lg:h-80 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer';
                errorDiv.innerHTML = `
                  <div class="text-center p-6">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                    </svg>
                    <p class="text-lg font-medium mb-1">Video Unavailable</p>
                    <p class="text-sm opacity-70">Unable to load video content</p>
                    <p class="text-xs opacity-50 mt-2">Click to try viewing in full screen</p>
                  </div>
                `;
                errorDiv.onclick = onImageClick;
                parent.appendChild(errorDiv);
              }
            }}
            onLoadStart={() => {
              console.log('▶️ Video loading started:', postData.image);
            }}
          />
        ) : (
          <div className="relative" onDoubleClick={(e) => {
              e.stopPropagation();
              handleLikeClick();
            }}>
            <img
              src={postData.image}
              alt={postData.title || 'Post content'}
              className="w-full h-64 lg:h-80 object-cover hover:brightness-95 transition-all duration-200"
              onError={(e) => {
                // Create a safe error object for logging
                const errorInfo = {
                  url: postData.image || 'No URL provided',
                  error: e.type || 'Unknown error',
                  timestamp: new Date().toISOString(),
                  networkState: e.target?.networkState || 'Unknown',
                  readyState: e.target?.readyState || 'Unknown',
                  naturalWidth: e.target?.naturalWidth || 0,
                  naturalHeight: e.target?.naturalHeight || 0
                };
                
                // Log individual properties to avoid serialization issues
                console.group('❌ Image Load Error');
                console.error('URL:', errorInfo.url);
                console.error('Error type:', errorInfo.error);
                console.error('Timestamp:', errorInfo.timestamp);
                console.error('Network state:', errorInfo.networkState);
                console.error('Ready state:', errorInfo.readyState);
                if (errorInfo.naturalWidth === 0 && errorInfo.naturalHeight === 0) {
                  console.error('Issue: Image dimensions are 0x0 - likely a broken or invalid image URL');
                }
                console.groupEnd();
                
                // Replace with enhanced error placeholder
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                if (parent && !parent.querySelector('.image-error')) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = `image-error w-full h-64 lg:h-80 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`;
                  errorDiv.innerHTML = `
                    <div class="text-center p-6">
                      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,19H5V5H19V19M13.96,12.71L11.21,15.46L9.25,13.5L5.5,17.25H18.5L13.96,12.71Z" />
                      </svg>
                      <p class="text-lg font-medium mb-1">Image Unavailable</p>
                      <p class="text-sm opacity-70">This image could not be loaded</p>
                      <p class="text-xs opacity-50 mt-2">Click to try viewing in modal</p>
                    </div>
                  `;
                  errorDiv.onclick = onImageClick;
                  parent.appendChild(errorDiv);
                }
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', postData.image);
              }}
            />
            
            {/* Hover overlay for better UX */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="bg-white bg-opacity-90 rounded-full p-2">
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLikeClick}
              disabled={!user?.profileid || !isRealPost}
              className={`p-1 hover:bg-opacity-10 hover:bg-red-500 rounded-full transition-all duration-200 ${
                isLiked ? 'text-red-500 scale-110' : 'text-gray-500 hover:text-red-500'
              } ${!user?.profileid || !isRealPost ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button 
              onClick={onImageClick}
              className={`p-1 hover:bg-opacity-10 hover:bg-gray-500 rounded-full transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button className={`p-1 hover:bg-opacity-10 hover:bg-gray-500 rounded-full transition-colors duration-200 ${
              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
          <button 
            onClick={() => onSave && onSave(postData.id)}
            disabled={!user?.profileid || !isRealPost}
            className={`p-1 hover:bg-opacity-10 hover:bg-yellow-500 rounded-full transition-all duration-200 ${
              postData.isSavedByUser ? 'text-yellow-500 scale-110' : 'text-gray-500 hover:text-yellow-500'
            } ${!user?.profileid || !isRealPost ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className={`w-6 h-6 ${postData.isSavedByUser ? 'fill-current' : ''}`} fill={postData.isSavedByUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        
        {!postData.hideLikeCount && (
          <p className={`font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}
        
        {postData.caption && (
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <span className="font-semibold">{postData.username}</span> {postData.caption}
          </p>
        )}
        
        {postData.title && (
          <p className={`text-sm mt-1 font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
          }`}>
            {postData.title}
          </p>
        )}
        
        {/* Location */}
        {postData.location && (
          <div className={`flex items-center mt-2 text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {postData.location}
          </div>
        )}
        
        {/* Tags */}
        {postData.tags && postData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {postData.tags.map((tag, index) => (
              <span
                key={index}
                className={`text-sm px-2 py-1 rounded-full ${
                  theme === 'dark' 
                    ? 'bg-blue-900/30 text-blue-300' 
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Tagged People */}
        {postData.taggedPeople && postData.taggedPeople.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {postData.taggedPeople.map((person, index) => (
              <span
                key={index}
                className={`text-sm px-2 py-1 rounded-full cursor-pointer hover:opacity-80 ${
                  theme === 'dark' 
                    ? 'bg-purple-900/30 text-purple-300' 
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                @{person}
              </span>
            ))}
          </div>
        )}
        
        {postData.allowComments && (
          <button 
            onClick={onImageClick}
            className={`text-sm mt-3 transition-colors ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {postData.comments > 0 ? `View all ${postData.comments} comments` : 'Be the first to comment'}
          </button>
        )}
      </div>
    </div>
  );
}
