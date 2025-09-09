"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../Helper/AuthProvider';
import { GET_ALL_POSTS } from '../../../lib/graphql/simpleQueries';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedPostCard from '../Post/EnhancedPostCard';
import EnhancedPostModal from '../Post/EnhancedPostModal';

export default function EnhancedHomeContent() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(null);

  // GraphQL query for posts
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error('🔴 GraphQL Error:', error);
    },
    onCompleted: (data) => {
      console.log('✅ Posts loaded successfully:', data?.getPosts?.length || 0, 'posts');
    }
  });


  // Process and filter posts from database only
  const posts = useMemo(() => {
    // Only use real posts from database, no fallback data
    const rawPosts = data?.getPosts || [];
    
    return rawPosts.filter(post => {
      const mediaUrl = post.postUrl || post.image;
      
      // Filter out invalid URLs
      if (!mediaUrl || 
          mediaUrl === 'null' || 
          mediaUrl === 'undefined' || 
          mediaUrl.trim() === '') {
        console.log('⚠️ Filtering out post with empty/null URL:', {
          postId: post.postid || post.id,
          imageUrl: mediaUrl
        });
        return false;
      }
      
      // Filter out test URLs
      const testUrls = [
        'https://example.com',
        'http://example.com',
        'example.jpg',
        'test.jpg',
        'debug-test',
        'placeholder'
      ];
      
      const isTestUrl = testUrls.some(testUrl => 
        mediaUrl.toLowerCase().includes(testUrl.toLowerCase())
      );
      
      if (isTestUrl) {
        console.log('🧪 Filtering out test/example URL post:', {
          postId: post.postid || post.id,
          imageUrl: mediaUrl,
          reason: 'Contains test/example URL'
        });
        return false;
      }
      
      return true;
    });
  }, [data?.getPosts]);

  // Handle post modal
  const openPostModal = useCallback((post, index) => {
    setSelectedPost(post);
    setSelectedPostIndex(index);
    setIsModalOpen(true);
  }, []);

  const closePostModal = useCallback(() => {
    setSelectedPost(null);
    setSelectedPostIndex(null);
    setIsModalOpen(false);
  }, []);

  // Handle post navigation
  const navigatePost = useCallback((direction) => {
    if (!posts || posts.length === 0 || selectedPostIndex === null) return;
    
    let newIndex;
    if (direction === 'next' && selectedPostIndex < posts.length - 1) {
      newIndex = selectedPostIndex + 1;
    } else if (direction === 'prev' && selectedPostIndex > 0) {
      newIndex = selectedPostIndex - 1;
    } else {
      return;
    }
    
    setSelectedPostIndex(newIndex);
    setSelectedPost(posts[newIndex]);
  }, [posts, selectedPostIndex]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle post actions
  const handlePostLike = useCallback(async (postId) => {
    console.log('Post liked:', postId);
    // The enhanced post card handles optimistic updates
  }, []);

  const handlePostSave = useCallback(async (postId) => {
    console.log('Post saved:', postId);
    // The enhanced post card handles optimistic updates
  }, []);

  // Intersection Observer for infinite scroll (future enhancement)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          // Could trigger loading more posts here
          console.log('Near bottom, could load more posts');
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  // Loading state
  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-8 w-8 border-b-2 border-red-500"
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 lg:space-y-8">
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {refreshing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center py-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-6 w-6 border-b-2 border-red-500 mr-2"
              />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Refreshing posts...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <div className="mb-8">
              <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg mb-4">No posts found!</p>
            <p className="text-sm mb-6">There are no posts to display at the moment.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg"
            >
              Refresh Feed
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => (
              <EnhancedPostCard
                key={post.id || post.postid || `post-${index}`}
                post={post}
                onImageClick={() => openPostModal(post, index)}
                onLike={handlePostLike}
                onSave={handlePostSave}
                onRefresh={handleRefresh}
                className="mb-6"
              />
            ))}
          </AnimatePresence>
        )}

        {/* Loading indicator for infinite scroll */}
        <div ref={loadingRef} className="h-4" />
        
        {loading && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-6 w-6 border-b-2 border-red-500 mr-2"
            />
            <span className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Loading more posts...
            </span>
          </motion.div>
        )}

        {/* End of feed indicator */}
        {posts.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600"></div>
              <span className="text-sm font-medium">You're all caught up!</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"></div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className={`text-sm px-4 py-2 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Refresh for new posts
            </motion.button>
          </motion.div>
        )}

        {/* Error state */}
        {error && posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            <div className="mb-8">
              <svg className="w-20 h-20 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg mb-4">Something went wrong</p>
            <p className="text-sm mb-6">We couldn't load the posts. Please try again.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg"
            >
              Try Again
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Enhanced Post Modal */}
      <EnhancedPostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={closePostModal}
        showNavigation={posts.length > 1}
        onNext={() => navigatePost('next')}
        onPrevious={() => navigatePost('prev')}
        hasNext={selectedPostIndex !== null && selectedPostIndex < posts.length - 1}
        hasPrevious={selectedPostIndex !== null && selectedPostIndex > 0}
        currentIndex={selectedPostIndex !== null ? selectedPostIndex + 1 : 1}
        totalCount={posts.length}
      />
    </>
  );
}
