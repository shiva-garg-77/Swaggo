"use client";
import { useTheme } from '../Helper/ThemeProvider';

export default function HomeContent() {
  const { theme } = useTheme();

  // Sample posts data with real images and profile pictures
  const posts = [
    {
      id: 1,
      username: 'alex_photographer',
      fullName: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop',
      caption: 'Beautiful sunset at the beach! 🌅 Nature never fails to amaze me. #sunset #beach #photography',
      likes: 1420,
      comments: 45,
      timeAgo: '2h',
      isVerified: true
    },
    {
      id: 2,
      username: 'fitness_sarah',
      fullName: 'Sarah Wilson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b742?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop',
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
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=600&fit=crop',
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
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop',
      caption: 'Exploring the mountains today! The view from up here is absolutely breathtaking 🏔️ #travel #mountains #adventure',
      likes: 567,
      comments: 34,
      timeAgo: '8h',
      isVerified: false
    }
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Posts Feed */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} theme={theme} />
      ))}
    </div>
  );
}

// Post Card Component
function PostCard({ post, theme }) {
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
            src={post.avatar}
            alt={post.fullName || post.username}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-2">
              <p className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {post.username}
              </p>
              {post.isVerified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {post.timeAgo}
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

      {/* Post Image */}
      <div className="relative">
        <img
          src={post.image}
          alt="Post content"
          className="w-full h-64 lg:h-80 object-cover"
        />
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
          {post.likes.toLocaleString()} likes
        </p>
        
        <p className={`${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <span className="font-semibold">{post.username}</span> {post.caption}
        </p>
        
        <button className={`text-sm mt-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          View all comments
        </button>
      </div>
    </div>
  );
}
