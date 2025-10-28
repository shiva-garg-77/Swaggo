"use client";

import { useQuery } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { GET_SUGGESTED_PROFILES } from '../../../lib/graphql/postStatsQueries';
import FollowRequestButton from './FollowRequestButton';
import { Users, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Suggested Profiles Component
 * Shows profile suggestions for the user
 */
export default function SuggestedProfiles({ limit = 5, compact = false }) {
  const { theme } = useTheme();
  const { user } = useFixedSecureAuth();
  const router = useRouter();

  const { data, loading, error } = useQuery(GET_SUGGESTED_PROFILES, {
    variables: {
      profileid: user?.profileid,
      limit
    },
    skip: !user?.profileid,
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });

  const suggestedProfiles = data?.getSuggestedProfiles || [];

  if (!user || loading || error || suggestedProfiles.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`rounded-lg border p-4 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Suggested for you
          </h3>
          <Users className="w-5 h-5 text-gray-500" />
        </div>

        <div className="space-y-3">
          {suggestedProfiles.slice(0, 5).map((profile) => (
            <div key={profile.profileid} className="flex items-center justify-between">
              <div
                onClick={() => router.push(`/Profile?username=${profile.username}`)}
                className="flex items-center space-x-3 flex-1 cursor-pointer"
              >
                <img
                  src={profile.profilePic || '/default-profile.svg'}
                  alt={profile.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => { e.target.src = '/default-profile.svg'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className={`text-sm font-medium truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {profile.username}
                    </p>
                    {profile.isVerified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-xs truncate ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {profile.followersCount} followers
                  </p>
                </div>
              </div>

              <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                Follow
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/explore/suggested')}
          className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          See All
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`border-b ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Users className="w-6 h-6 text-blue-500 mr-3" />
            <h1 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Suggested for You
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestedProfiles.map((profile) => (
            <div
              key={profile.profileid}
              className={`p-6 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <img
                  src={profile.profilePic || '/default-profile.svg'}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full object-cover cursor-pointer"
                  onClick={() => router.push(`/Profile?username=${profile.username}`)}
                  onError={(e) => { e.target.src = '/default-profile.svg'; }}
                />

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3
                      onClick={() => router.push(`/Profile?username=${profile.username}`)}
                      className={`font-semibold cursor-pointer hover:underline ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {profile.username}
                    </h3>
                    {profile.isVerified && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  <p className={`text-sm mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {profile.name}
                  </p>

                  {profile.bio && (
                    <p className={`text-sm mb-3 line-clamp-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {profile.bio}
                    </p>
                  )}

                  <div className={`flex items-center space-x-4 text-sm mb-4 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    <span>{profile.followersCount} followers</span>
                    <span>·</span>
                    <span>{profile.postsCount} posts</span>
                    {profile.mutualFollowersCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{profile.mutualFollowersCount} mutual</span>
                      </>
                    )}
                  </div>

                  <FollowRequestButton
                    targetProfile={profile}
                    isFollowing={false}
                    theme={theme}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
