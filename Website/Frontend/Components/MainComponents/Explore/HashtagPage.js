"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { GET_POSTS_BY_HASHTAG } from '../../../lib/graphql/postStatsQueries';
import InstagramPost from '../Post/InstagramPost';
import { Hash, TrendingUp, Grid3X3 } from 'lucide-react';

/**
 * Hashtag Page
 * Shows all posts with a specific hashtag
 */
export default function HashtagPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hashtag = searchParams.get('tag') || '';
  const [viewMode, setViewMode] = useState('feed'); // 'feed' or 'grid'

  const { data, loading, error, fetchMore } = useQuery(GET_POSTS_BY_HASHTAG, {
    variables: {
      hashtag: hashtag.replace('#', ''),
      limit: 20,
      offset: 0
    },
    skip: !hashtag,
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });

  const posts = data?.getPostsByHashtag || [];

  const loadMore = () => {
    fetchMore({
      variables: {
        offset: posts.length
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          getPostsByHashtag: [...prev.getPostsByHashtag, ...fetchMoreResult.getPostsByHashtag]
        };
      }
    });
  };

  if (!hashtag) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          No hashtag specified
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            {/* Hashtag Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
                  <Hash className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    #{hashtag.replace('#', '')}
                  </h1>
                  <p className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {posts.length} posts
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('feed')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'feed'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid'
                      ? 'bg-red-500 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Failed to load posts
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No posts found with #{hashtag}
            </p>
            <p className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Be the first to use this hashtag!
            </p>
          </div>
        ) : viewMode === 'feed' ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <InstagramPost
                key={post.postid}
                post={post}
                theme={theme}
              />
            ))}
            
            {/* Load More */}
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Load More
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div
                key={post.postid}
                onClick={() => router.push(`/post/${post.postid}`)}
                className="aspect-square cursor-pointer hover:opacity-90 transition-opacity"
              >
                <img
                  src={post.postUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
