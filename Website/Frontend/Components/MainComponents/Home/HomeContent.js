"use client";
import { useState } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../Helper/AuthProvider';
import { GET_ALL_POSTS, TOGGLE_POST_LIKE, TOGGLE_SAVE_POST } from '../../../lib/graphql/simpleQueries';
import PostModal from '../Post/PostModal';

export default function HomeContent() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // GraphQL Mutations
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE);
  const [toggleSavePost] = useMutation(TOGGLE_SAVE_POST);
  
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all', // Return partial data on error
    fetchPolicy: 'cache-and-network', // Always try to fetch fresh data
    onError: (error) => {
      console.error('🔴 GraphQL Error:', error);
      if (error.graphQLErrors) {
        error.graphQLErrors.forEach((gqlError) => {
          console.error('🔴 GraphQL Error Details:', gqlError);
        });
      }
      if (error.networkError) {
        console.error('🌐 Network Error:', error.networkError);
      }
    },
    onCompleted: (data) => {
      console.log('✅ Posts loaded successfully:', data?.getPosts?.length || 0, 'posts');
    }
  });
  
  // Fallback sample posts data with reliable URLs
  const fallbackPosts = [
    {
      id: 1,
      username: 'alex_photographer',
      fullName: 'Alex Johnson',
      avatar: 'https://picsum.photos/100/100?random=1',
      image: 'https://picsum.photos/600/400?random=10',
      caption: 'Beautiful landscape! 🌅 Nature never fails to amaze me. #nature #photography',
      likes: 1420,
      comments: 45,
      timeAgo: '2h',
      isVerified: true
    },
    {
      id: 2,
      username: 'fitness_sarah',
      fullName: 'Sarah Wilson',
      avatar: 'https://picsum.photos/100/100?random=2',
      image: 'https://picsum.photos/600/400?random=20',
      caption: 'Just finished my morning workout! 💪 Feeling great and ready to take on the day. #fitness #motivation',
      likes: 892,
      comments: 23,
      timeAgo: '4h',
      isVerified: false
    },
    {
      id: 3,
      username: 'mike_developer',
      fullName: 'Mike Chang',
      avatar: 'https://picsum.photos/100/100?random=3',
      image: 'https://picsum.photos/600/400?random=30',
      caption: 'New project launch! Excited to share this with everyone ✨ Working on something amazing! #coding #tech #startup',
      likes: 2340,
      comments: 67,
      timeAgo: '6h',
      isVerified: true
    },
    {
      id: 4,
      username: 'travel_emma',
      fullName: 'Emma Davis',
      avatar: 'https://picsum.photos/100/100?random=4',
      image: 'https://picsum.photos/600/400?random=40',
      caption: 'Exploring the mountains today! The view from up here is absolutely breathtaking 🏔️ #travel #mountains #adventure',
      likes: 567,
      comments: 34,
      timeAgo: '8h',
      isVerified: false
    }
  ];

  // Use real posts if available, otherwise use fallback
  const rawPosts = data?.getPosts?.length > 0 ? data.getPosts : fallbackPosts;
  
  // Filter out posts with invalid or missing image URLs
  const posts = rawPosts.filter(post => {
    const imageUrl = post.postUrl || post.image;
    
    // Always allow fallback posts
    if (!post.postid) return true;
    
    // Check for basic validity
    if (!imageUrl || 
        imageUrl === 'null' || 
        imageUrl === 'undefined' || 
        imageUrl.trim() === '') {
      console.log('⚠️ Filtering out post with empty/null URL:', {
        postId: post.postid || post.id,
        imageUrl: imageUrl
      });
      return false;
    }
    
    // Check for example/test URLs that don't exist  
    const testUrls = [
      'https://example.com',
      'http://example.com',
      'https://test.com',
      'http://test.com',
      'example.jpg',
      'test.jpg',
      'debug-test',
      'placeholder'
    ];
    
    const isTestUrl = testUrls.some(testUrl => 
      imageUrl.toLowerCase().includes(testUrl.toLowerCase())
    );
    
    if (isTestUrl) {
      console.log('🧪 Filtering out test/example URL post:', {
        postId: post.postid || post.id,
        imageUrl: imageUrl,
        reason: 'Contains test/example URL'
      });
      return false;
    }
    
    return true;
  });
  
  console.log('📊 Posts stats:', {
    total: rawPosts?.length || 0,
    valid: posts?.length || 0,
    filtered: (rawPosts?.length || 0) - (posts?.length || 0)
  });

  // Modal handlers
  const openPostModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closePostModal = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };
  
  // Post action handlers
  const handlePostLike = async (postId) => {
    if (!user?.profileid) {
      alert('Please login to like posts');
      return;
    }
    
    console.log('🔄 Liking post:', postId, 'by user:', user.profileid);
    
    try {
      const result = await togglePostLike({
        variables: {
          profileid: user.profileid,
          postid: postId
        }
      });
      
      console.log('✅ Like toggle result:', result);
      
      // Refetch the posts to get updated like counts and states
      await refetch();
      
    } catch (error) {
      console.error('❌ Error toggling post like:', error);
      if (error.message?.includes('not logged in')) {
        alert('Please login to like posts');
      }
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
        }
      });
      
      console.log('✅ Save toggle result:', result);
      
      // Refetch the posts to get updated save states
      await refetch();
      
    } catch (error) {
      console.error('❌ Error toggling save post:', error);
      if (error.message?.includes('not logged in')) {
        alert('Please login to save posts');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
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
        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className={`text-center py-20 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <p className="text-lg mb-4">No posts yet!</p>
            <p className="text-sm">Create your first post to see it here.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id || post.postid} 
              post={post} 
              theme={theme} 
              user={user}
              onImageClick={() => openPostModal(post)}
              onLike={handlePostLike}
              onSave={handlePostSave}
            />
          ))
        )}
      </div>

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={closePostModal}
        theme={theme}
      />
    </>
  );
}

// Post Card Component
function PostCard({ post, theme, user, onImageClick, onLike, onSave }) {
  // Handle both real posts from database and fallback posts
  const isRealPost = !!post.postid;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
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
    likes: post.likeCount || post.likes || 0,
    comments: post.commentCount || post.comments || 0,
    timeAgo: post.timeAgo || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'),
    isVerified: post.profile?.isVerified || post.isVerified || false,
    postType: post.postType || 'IMAGE',
    isLikedByUser: post.isLikedByUser || false,
    isSavedByUser: post.isSavedByUser || false,
    allowComments: post.allowComments !== false,
    hideLikeCount: post.hideLikeCount || false,
    autoPlay: post.autoPlay || false
  };
  
  console.log('🖼️ Post image URL:', postData.image);
  
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
      <div className="relative cursor-pointer" onClick={onImageClick}>
        {postData.postType === 'VIDEO' ? (
          <video
            src={postData.image}
            className="w-full h-64 lg:h-80 object-cover hover:brightness-95 transition-all duration-200"
            autoPlay={postData.autoPlay}
            loop={postData.autoPlay}
            muted={postData.autoPlay}
            playsInline
            preload="metadata"
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onError={(e) => {
              console.error('❌ Video load error:', {
                url: postData.image,
                error: e.type || 'Unknown error',
                networkState: e.target?.networkState || 'Unknown',
                readyState: e.target?.readyState || 'Unknown',
                timestamp: new Date().toISOString()
              });
              
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
          <div className="relative">
            <img
              src={postData.image}
              alt={postData.title || 'Post content'}
              className="w-full h-64 lg:h-80 object-cover hover:brightness-95 transition-all duration-200"
              onError={(e) => {
                const errorDetails = {
                  url: postData.image,
                  error: e.type,
                  timestamp: new Date().toISOString(),
                  networkState: e.target.networkState,
                  readyState: e.target.readyState
                };
                console.error('❌ Image load error:', errorDetails);
                
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
              onClick={() => onLike && onLike(postData.id)}
              disabled={!user?.profileid || !isRealPost}
              className={`p-1 hover:bg-opacity-10 hover:bg-red-500 rounded-full transition-all duration-200 ${
                postData.isLikedByUser ? 'text-red-500 scale-110' : 'text-gray-500 hover:text-red-500'
              } ${!user?.profileid || !isRealPost ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className={`w-6 h-6 ${postData.isLikedByUser ? 'fill-current' : ''}`} fill={postData.isLikedByUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
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
            {postData.likes.toLocaleString()} {postData.likes === 1 ? 'like' : 'likes'}
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
