"use client";
import { useTheme } from '../../Helper/ThemeProvider';
import { useQuery } from '@apollo/client';
import { GET_ALL_POSTS } from '../../../lib/graphql/simpleQueries';

export default function HomeContent() {
  const { theme } = useTheme();
  
  const { data, loading, error } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all', // Return partial data on error
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
  const rawPosts = data?.getPosts || fallbackPosts;
  
  // Filter out posts with invalid or missing image URLs
  const posts = rawPosts.filter(post => {
    const imageUrl = post.postUrl || post.image;
    
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
    
    // Check for valid URL format
    const isValidUrl = imageUrl.startsWith('http') || imageUrl.startsWith('/');
    
    if (!isValidUrl) {
      console.log('⚠️ Filtering out invalid URL format:', {
        postId: post.postid || post.id,
        imageUrl: imageUrl,
        reason: 'Invalid URL format'
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
          <PostCard key={post.id || post.postid} post={post} theme={theme} />
        ))
      )}
    </div>
  );
}

// Post Card Component
function PostCard({ post, theme }) {
  // Handle both real posts from database and fallback posts
  const isRealPost = !!post.postid;
  
  console.log('📋 Processing post:', post);
  
  const postData = {
    id: post.postid || post.id,
    username: post.profile?.username || post.username || 'Unknown User',
    fullName: post.profile?.name || post.fullName || 'Unknown User',
    avatar: post.profile?.profilePic || post.avatar || '/default-profile.svg',
    image: post.postUrl || post.image || null,
    caption: post.Description || post.caption || '',
    title: post.title || '',
    likes: post.likes || 0,
    comments: post.comments || 0,
    timeAgo: post.timeAgo || 'Recently',
    isVerified: post.profile?.isVerified || post.isVerified || false,
    postType: post.postType || 'IMAGE'
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
      <div className="relative">
        {postData.postType === 'VIDEO' ? (
          <video
            src={postData.image}
            className="w-full h-64 lg:h-80 object-cover"
            controls
            onError={(e) => {
              console.error('❌ Video load error for URL:', postData.image, e);
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent && !parent.querySelector('.video-error')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = `video-error w-full h-64 lg:h-80 flex flex-col items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`;
                errorDiv.innerHTML = `
                  <div class="text-center p-4">
                    <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                    </svg>
                    <p class="text-sm text-gray-500">Video could not be loaded</p>
                    <p class="text-xs text-gray-400 mt-1">Check your internet connection</p>
                  </div>
                `;
                parent.appendChild(errorDiv);
              }
            }}
            onLoadStart={() => {
              console.log('▶️ Video starting to load:', postData.image);
            }}
          />
        ) : (
          <div className="relative">
            <img
              src={postData.image}
              alt={postData.title || 'Post content'}
              className="w-full h-64 lg:h-80 object-cover"
              onError={(e) => {
                console.error('❌ Image load error for URL:', postData.image, e);
                console.error('Error details:', {
                  src: e.target.src,
                  naturalWidth: e.target.naturalWidth,
                  naturalHeight: e.target.naturalHeight,
                  complete: e.target.complete
                });
                
                // Replace with error placeholder
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                if (parent && !parent.querySelector('.image-error')) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = `image-error w-full h-64 lg:h-80 flex flex-col items-center justify-center ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`;
                  errorDiv.innerHTML = `
                    <div class="text-center p-4">
                      <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                      </svg>
                      <p class="text-sm text-gray-500">Image could not be loaded</p>
                      <p class="text-xs text-gray-400 mt-1">The image may be corrupted or unavailable</p>
                    </div>
                  `;
                  parent.appendChild(errorDiv);
                }
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', postData.image);
              }}
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button className="p-1 hover:bg-opacity-10 hover:bg-red-500 rounded-full transition-colors duration-200">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className={`p-1 hover:bg-opacity-10 hover:bg-gray-500 rounded-full transition-colors duration-200 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button className={`p-1 hover:bg-opacity-10 hover:bg-gray-500 rounded-full transition-colors duration-200 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
          <button className={`p-1 hover:bg-opacity-10 hover:bg-gray-500 rounded-full transition-colors duration-200 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        
        <p className={`font-semibold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {postData.likes.toLocaleString()} likes
        </p>
        
        {postData.caption && (
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <span className="font-semibold">{postData.username}</span> {postData.caption}
          </p>
        )}
        
        {postData.title && (
          <p className={`text-sm mt-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {postData.title}
          </p>
        )}
        
        <button className={`text-sm mt-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          View all comments
        </button>
      </div>
    </div>
  );
}
