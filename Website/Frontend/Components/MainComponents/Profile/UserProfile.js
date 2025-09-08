"use client";

import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../Helper/ThemeProvider';
import { AuthContext } from '../../Helper/AuthProvider';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USER_BY_USERNAME, TOGGLE_FOLLOW_USER, TOGGLE_LIKE_POST, TOGGLE_SAVE_POST } from '../../../lib/graphql/profileQueries';
import { GET_USER_SIMPLE, HELLO_QUERY } from '../../../lib/graphql/simpleQueries';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileGrid from './ProfileGrid';
import MemorySection from './MemorySection';

export default function UserProfile() {
  const { theme } = useTheme();
  const { accessToken } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get username from URL params, if none provided, show current user's profile
  const profileUsername = searchParams.get('user');
  const isOwnProfile = !profileUsername;
  
  // State management
  const [activeTab, setActiveTab] = useState('uploads');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // GraphQL queries - using full query with likes and comments
  const { data, loading, error, refetch } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: profileUsername },
    skip: !accessToken,
    errorPolicy: 'all',
  });

  // Get current user's profile for follow status check
  const { data: currentUserData, loading: currentUserLoading } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: null }, // null will return current user's profile
    skip: !accessToken || isOwnProfile,
    errorPolicy: 'all',
    onCompleted: (userData) => {
      setCurrentUserProfile(userData?.getUserbyUsername);
      // Simplified for debugging - skip follow check for now
      // if (data?.getUserbyUsername && userData?.getUserbyUsername) {
      //   const targetProfileId = data.getUserbyUsername.profileid;
      //   const isFollowingUser = userData.getUserbyUsername.following?.some(
      //     f => f.profileid === targetProfileId
      //   );
      //   setIsFollowing(isFollowingUser || false);
      // }
    }
  });

  const [toggleFollowMutation] = useMutation(TOGGLE_FOLLOW_USER, {
    onCompleted: () => {
      setIsFollowing(!isFollowing);
      refetch(); // Refresh the profile data to get updated follower counts
    },
    onError: (error) => {
      console.error('Error toggling follow:', error);
    }
  });


  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (isOwnProfile || !currentUserProfile || !data?.getUserbyUsername) return;

    try {
      await toggleFollowMutation({
        variables: {
          profileid: currentUserProfile.profileid,
          followid: data.getUserbyUsername.profileid
        }
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Handle message user
  const handleMessage = () => {
    if (isOwnProfile || !data?.getUserbyUsername) return;
    router.push(`/message?user=${data.getUserbyUsername.username}`);
  };

  // Handle restrict user (placeholder)
  const handleRestrict = async () => {
    if (isOwnProfile) return;
    console.log('Restrict user functionality - to be implemented');
  };

  // Handle block user (placeholder)
  const handleBlock = async () => {
    if (isOwnProfile) return;
    console.log('Block user functionality - to be implemented');
  };

  // Handle create memory
  const handleCreateMemory = () => {
    console.log('Create memory functionality - to be implemented');
  };

  // Get posts based on active tab
  const getPosts = () => {
    const profileData = data?.getUserbyUsername;
    if (!profileData) return [];
    
    switch (activeTab) {
      case 'uploads':
        return profileData.post || [];
      case 'draft':
        return isOwnProfile ? [] : [];
      case 'tagged':
        return [];
      default:
        return profileData.post || [];
    }
  };

  if (loading || currentUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Error loading profile: {error.message}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  const profileData = data?.getUserbyUsername;

  if (!profileData) {
    return (
      <div className="text-center py-20">
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Profile not found
        </p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto transition-colors duration-300 ${
      theme === 'dark' ? 'text-white' : 'text-gray-900'
    }`}>
      {/* Profile Header */}
      <ProfileHeader
        profile={profileData}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onMessage={handleMessage}
        onRestrict={handleRestrict}
        onBlock={handleBlock}
        theme={theme}
      />

      {/* Memory Section */}
      <MemorySection
        memories={profileData.memories || []}
        isOwnProfile={isOwnProfile}
        theme={theme}
        onCreateMemory={handleCreateMemory}
      />

      {/* Profile Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOwnProfile={isOwnProfile}
        theme={theme}
      />

      {/* Profile Grid */}
      <ProfileGrid
        posts={getPosts()}
        activeTab={activeTab}
        loading={false}
        theme={theme}
        currentUser={currentUserProfile || profileData}
      />
    </div>
  );
}
