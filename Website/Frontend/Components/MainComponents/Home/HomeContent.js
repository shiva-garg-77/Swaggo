"use client";
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useQuery, useMutation } from '../../../lib/apollo-client-hooks';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { useRouter } from 'next/navigation';
import { GET_ALL_POSTS, TOGGLE_POST_LIKE, TOGGLE_SAVE_POST } from '../../../lib/graphql/queries';
import { triggerPostsRefetch } from '../../../lib/apollo/refetchHelper';
import InstagramPostModal from '../Post/InstagramPostModal';
import InstagramPost from '../Post/InstagramPost';
import UserSearch from '../../Search/UserSearch';
import SuggestedMoments from './SuggestedReels';
import WindowsNetworkDiagnostic from '../../Debug/WindowsNetworkDiagnostic';
import NetworkConnectivityHelper from '../../Debug/NetworkConnectivityHelper';
// CRITICAL MEMORY LEAK FIXES
import { useComprehensiveCleanup, useMemoryMonitoring } from '../../../utils/memoryLeakFixes';
// import AuthTokenChecker from '../../Debug/AuthTokenChecker'; // Temporarily disabled
import { LazyImage } from '../../../utils/performanceOptimizations';

export default function HomeContent() {
  const { theme } = useTheme();
  const { user, isAuthenticated, isLoading } = useFixedSecureAuth();
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserRecommendations, setShowUserRecommendations] = useState(true);
  
  // 🔧 CRITICAL: Initialize comprehensive memory leak prevention
  const cleanup = useComprehensiveCleanup();
  
  // 🔧 CRITICAL: Monitor memory usage and prevent leaks
  useMemoryMonitoring({
    alertThreshold: 50 * 1024 * 1024, // 50MB threshold
    checkInterval: 30000, // Check every 30 seconds
    onMemoryAlert: (memoryInfo) => {
      console.warn('🚨 MEMORY ALERT in HomeContent:', {
        used: `${(memoryInfo.used / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${memoryInfo.percentage.toFixed(1)}%`
      });
    }
  });
  
  // GraphQL Mutations
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);
  
  // FIXED: Stop excessive fetching and fix data loading
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all', // Return partial data even with GraphQL errors
    fetchPolicy: 'cache-first', // FIXED: Use cache-first to prevent excessive fetching
    notifyOnNetworkStatusChange: true, // Enable loading states for better UX
    // Add retry configuration for network issues
    context: {
      headers: {
        'X-Client-Info': 'HomeContent-Component',
        'X-Request-Context': 'feed-posts'
      }
    },
    // REMOVED: pollInterval to stop constant fetching
  });
  

  // FIXED: Handle actual GraphQL response structure
  const rawPosts = data?.getPosts || data?.posts || (data ? Object.values(data)[0] : []) || [];
  
  // Simple filter - only remove posts with truly empty URLs
  const posts = rawPosts.filter(post => {
    const imageUrl = post.postUrl || post.image;
    return imageUrl && imageUrl.trim() && imageUrl !== 'null' && imageUrl !== 'undefined';
  });
  
  // Enhanced debug logging to see actual data structure
  console.log('📄 ENHANCED Posts debug:', {
    loading,
    hasError: !!error,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : 'No data',
    fullData: data, // This will show us the complete data structure
    rawPostsCount: rawPosts.length,
    filteredPostsCount: posts.length,
    samplePost: posts[0] ? { id: posts[0].id || posts[0].postid, postUrl: posts[0].postUrl } : 'No posts'
  });

  // Modal handlers with memory leak prevention
  const openPostModal = useCallback((post) => {
    console.log('🔴 openPostModal called with post:', post?.postid || post?.id);
    console.log('🔴 User state:', { hasUser: !!user, profileId: user?.profileid, username: user?.username });
    console.log('🔴 Full post data:', post);
    setSelectedPost(post);
    setIsModalOpen(true);
    console.log('🔴 Modal state set - isModalOpen:', true, 'selectedPost:', post?.postid || post?.id);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }, [user?.profileid, user?.username]);

  const closePostModal = useCallback(() => {
    setSelectedPost(null);
    setIsModalOpen(false);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  }, []);
  
  // 🔧 CRITICAL: Cleanup body overflow on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
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
  
  // IMPROVED: Show loading only on initial load, not on every refetch
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-600">Loading posts...</span>
      </div>
    );
  }

  if (error) {
    console.error('Error loading posts:', error);
    
    // Show a user-friendly error message for network issues
    if (error.networkError && error.networkError.message?.includes('fetch')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Connection Error
            </h3>
            <p className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Unable to connect to the server. Please check your connection.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  console.log('🔄 Manual refetch initiated');
                  refetch().catch(console.error);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Connection
              </button>
              <p className="text-xs text-gray-500">
                Error: {error.networkError?.message || error.message}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // For other GraphQL errors, still show fallback posts
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

        {/* Suggested Moments - These will redirect to /reel page */}
        <SuggestedMoments />

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className={`text-center py-20 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <p className="text-lg mb-4">No posts found!</p>
            <p className="text-sm">Raw posts count: {rawPosts.length}</p>
            <p className="text-xs mt-2">Data keys: {data ? JSON.stringify(Object.keys(data)) : 'No data'}</p>
            <p className="text-xs">Loading: {loading ? 'Yes' : 'No'} | Error: {error ? 'Yes' : 'No'}</p>
            {rawPosts.length > 0 && (
              <div className="mt-4 text-xs">
                <p>Sample raw post:</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 text-left max-w-md mx-auto overflow-auto">
                  {JSON.stringify(rawPosts[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          posts.map((post) => {
            console.log('📄 Rendering InstagramPost with post:', { id: post.id || post.postid, hasOnCommentClick: true });
            return (
              <InstagramPost 
                key={post.id || post.postid} 
                post={post} 
                theme={theme}
                onCommentClick={() => {
                  console.log('📄 onCommentClick handler created for post:', post.postid || post.id);
                  openPostModal(post);
                }}
                onPostDeleted={handlePostDeleted}
                className="mb-4 lg:mb-6"
              />
            );
          })
        )}
      </div>

      {/* Post Modal - Using original InstagramPostModal */}
      <InstagramPostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={closePostModal}
      />
      
      
      {/* Windows Network Diagnostic */}
      <WindowsNetworkDiagnostic />
      
      {/* Network Connectivity Helper - Shows network error notifications */}
      <NetworkConnectivityHelper />
      
      {/* Auth Token Checker - Temporarily disabled */}
      {/* <AuthTokenChecker /> */}
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
              
              // Show error placeholder using React component
              setShowVideoError(true);
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
            <LazyImage
              src={postData.image}
              alt={postData.title || 'Post content'}
              className="w-full h-64 lg:h-80 object-cover hover:brightness-95 transition-all duration-200"
              placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxNjAiIHk9IjkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+"
            />
            
            {/* Video error display */}
            {showVideoError && (
              <VideoErrorDisplay onRetry={onImageClick} theme={theme} />
            )}
            
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
