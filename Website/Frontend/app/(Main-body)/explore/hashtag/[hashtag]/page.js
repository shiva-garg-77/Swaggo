'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFixedSecureAuth } from '../../../../../context/FixedSecureAuthContext';
import { useQuery } from '@apollo/client/react';
import { GET_POSTS_BY_HASHTAG } from '../../../../../lib/graphql/postStatsQueries';
import { useHashtagStore } from '../../../../../store/hashtagStore';
import HashtagHeader from '../../../../../Components/MainComponents/Explore/HashtagHeader';
import TrendingGrid from '../../../../../Components/MainComponents/Explore/TrendingGrid';
import InstagramPost from '../../../../../Components/MainComponents/Post/InstagramPost';
import { Hash } from 'lucide-react';

/**
 * Hashtag Detail Page
 * Shows all posts with a specific hashtag
 */
export default function HashtagDetailPage() {
  const { user, loading: authLoading } = useFixedSecureAuth();
  const router = useRouter();
  const params = useParams();
  const hashtag = params.hashtag;

  const {
    posts,
    viewMode,
    setPosts,
    setViewMode,
    setCurrentHashtag
  } = useHashtagStore();

  const { data, loading, error, fetchMore } = useQuery(GET_POSTS_BY_HASHTAG, {
    variables: {
      hashtag: hashtag?.replace('#', ''),
      limit: 20,
      offset: 0
    },
    skip: !hashtag || !user,
    onCompleted: (data) => {
      setPosts(data?.getPostsByHashtag || []);
    },
    errorPolicy: 'all'
  });

  useEffect(() => {
    if (hashtag) {
      setCurrentHashtag(hashtag.replace('#', ''));
    }
  }, [hashtag, setCurrentHashtag]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadMore = async () => {
    try {
      await fetchMore({
        variables: {
          offset: posts.length
        }
      });
    } catch (error) {
      console.error('Error loading more:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !hashtag) {
    return null;
  }

  const stats = {
    totalPosts: posts.length,
    totalViews: 0,
    trending: false
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <HashtagHeader
        hashtag={hashtag.replace('#', '')}
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme="light"
      />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Failed to load posts
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No posts found with #{hashtag}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Be the first to use this hashtag!
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <TrendingGrid posts={posts} theme="light" />
            {posts.length >= 20 && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <InstagramPost
                key={post.postid}
                post={post}
                theme="light"
              />
            ))}
            {posts.length >= 20 && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
