"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../Helper/ThemeProvider';
import { AuthContext } from '../../Helper/AuthProvider';
import { useQuery, useMutation } from '@apollo/client';
import { ApolloClientContext } from '../../Helper/ApolloProvider';
import { clearProfileCache, clearApolloCache } from '../../../lib/apollo/cacheUtils';
import { 
  GET_USER_BY_USERNAME, 
  TOGGLE_FOLLOW_USER, 
  TOGGLE_LIKE_POST, 
  TOGGLE_SAVE_POST,
  DELETE_DRAFT_MUTATION,
  PUBLISH_DRAFT_MUTATION,
  GET_DRAFTS_QUERY,
  BLOCK_USER,
  RESTRICT_USER,
  IS_USER_BLOCKED,
  IS_USER_RESTRICTED
} from '../../../lib/graphql/profileQueries';
import { GET_SIMPLE_PROFILE, GET_CURRENT_USER_PROFILE } from '../../../lib/graphql/fixedProfileQueries';
import { GET_MEMORIES, CREATE_MEMORY } from '../../../lib/graphql/queries';
import { GET_USER_SIMPLE, HELLO_QUERY } from '../../../lib/graphql/simpleQueries';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileGrid from './ProfileGrid';
import CreatePostModal from '../Post/CreatePostModal';
import CreateMemoryModal from '../Memory/CreateMemoryModal';

export default function UserProfile() {
  const { theme } = useTheme();
  const { accessToken, user } = useContext(AuthContext);
  const apolloClient = useContext(ApolloClientContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get username from URL params, if none provided, show current user's profile
  const profileUsername = searchParams.get('user');
  const isOwnProfile = !profileUsername;
  
  // State management
  const [activeTab, setActiveTab] = useState('uploads');
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [showCreateMemoryModal, setShowCreateMemoryModal] = useState(false);

  // Use simpler profile query to avoid schema mismatch issues
  const queryToUse = isOwnProfile ? GET_CURRENT_USER_PROFILE : GET_SIMPLE_PROFILE;
  const queryVariables = isOwnProfile ? {} : { username: profileUsername };
  
  const { data, loading, error, refetch } = useQuery(queryToUse, {
    variables: queryVariables,
    skip: !accessToken,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first', // Use cache first for faster loading
    notifyOnNetworkStatusChange: false, // Reduce re-renders
    onCompleted: (userData) => {
      if (process.env.NODE_ENV === 'development' && userData?.getUserbyUsername) {
        console.log('✅ Profile data loaded successfully:', {
          username: userData.getUserbyUsername.username,
          profileid: userData.getUserbyUsername.profileid,
          postCount: userData.getUserbyUsername.post?.length || 0,
          isOwnProfile: isOwnProfile
        });
      }
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('🔴 Profile loading error:', {
          message: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          queryType: isOwnProfile ? 'current-user' : 'by-username',
          variables: queryVariables
        });
      }
    }
  });

  // Get current user's profile for follow status check
  const { data: currentUserData, loading: currentUserLoading } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: null }, // null will return current user's profile
    skip: !accessToken || isOwnProfile,
    errorPolicy: 'all',
    fetchPolicy: 'cache-only', // Use cache-only for even faster loading
    notifyOnNetworkStatusChange: false,
    onCompleted: (userData) => {
      setCurrentUserProfile(userData?.getUserbyUsername);
    }
  });

  // Query to get drafts from backend
  const { data: draftsData, loading: draftsLoading, error: draftsError, refetch: refetchDrafts } = useQuery(GET_DRAFTS_QUERY, {
    variables: { profileid: data?.getUserbyUsername?.profileid },
    skip: !data?.getUserbyUsername?.profileid || !isOwnProfile,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    onCompleted: (draftData) => {
      console.log('\n🔍 DRAFT DEBUG - Query Completed:');
      console.log('- ProfileID used:', data?.getUserbyUsername?.profileid);
      console.log('- Is own profile:', isOwnProfile);
      console.log('- Drafts received:', draftData);
      console.log('- Draft count:', draftData?.getDrafts?.length || 0);
      console.log('- Active tab:', activeTab);
      if (draftData?.getDrafts && draftData.getDrafts.length > 0) {
        console.log('- First draft:', draftData.getDrafts[0]);
      }
    },
    onError: (error) => {
      console.error('\n❌ DRAFT DEBUG - Error loading drafts:');
      console.error('- Error details:', error.message);
      console.error('- GraphQL errors:', error.graphQLErrors);
      console.error('- Network error:', error.networkError);
      console.error('- ProfileID attempted:', data?.getUserbyUsername?.profileid);
      console.error('- Is own profile:', isOwnProfile);
    }
  });

  // Query to get memories for this profile
  const { data: memoriesData, loading: memoriesLoading, refetch: refetchMemories } = useQuery(GET_MEMORIES, {
    variables: { profileid: data?.getUserbyUsername?.profileid },
    skip: !data?.getUserbyUsername?.profileid,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    onCompleted: (memoryData) => {
      console.log('\n📸 MEMORY DEBUG - Query Completed:');
      console.log('- Memory count:', memoryData?.getMemories?.length || 0);
      if (memoryData?.getMemories && memoryData.getMemories.length > 0) {
        console.log('- First memory:', memoryData.getMemories[0]);
      }
    },
    onError: (error) => {
      console.error('\n❌ MEMORY DEBUG - Error loading memories:', error.message);
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

  // Add block/restrict mutations and queries
  const [blockUser] = useMutation(BLOCK_USER);
  const [restrictUser] = useMutation(RESTRICT_USER);
  
  // Defer block/restrict status queries for better initial performance
  const { data: blockStatusData } = useQuery(IS_USER_BLOCKED, {
    variables: { 
      profileid: currentUserProfile?.profileid, 
      targetprofileid: data?.getUserbyUsername?.profileid 
    },
    skip: true, // Skip initially, can be enabled later when needed
    fetchPolicy: 'cache-first'
  });
  
  const { data: restrictStatusData } = useQuery(IS_USER_RESTRICTED, {
    variables: { 
      profileid: currentUserProfile?.profileid, 
      targetprofileid: data?.getUserbyUsername?.profileid 
    },
    skip: true, // Skip initially, can be enabled later when needed
    fetchPolicy: 'cache-first'
  });
  
  const isUserBlocked = blockStatusData?.isUserBlocked || false;
  const isUserRestricted = restrictStatusData?.isUserRestricted || false;

  // Handle restrict user
  const handleRestrict = async () => {
    if (isOwnProfile || !currentUserProfile || !data?.getUserbyUsername) return;
    
    if (isUserRestricted) {
      alert('This user is already restricted.');
      return;
    }
    
    const confirmed = confirm(`Are you sure you want to restrict ${data.getUserbyUsername.username}?`);
    if (!confirmed) return;
    
    try {
      await restrictUser({
        variables: {
          profileid: currentUserProfile.profileid,
          targetprofileid: data.getUserbyUsername.profileid
        }
      });
      alert('User has been restricted.');
    } catch (error) {
      console.error('Error restricting user:', error);
      alert('Failed to restrict user. Please try again.');
    }
  };

  // Handle block user
  const handleBlock = async () => {
    if (isOwnProfile || !currentUserProfile || !data?.getUserbyUsername) return;
    
    if (isUserBlocked) {
      alert('This user is already blocked.');
      return;
    }
    
    const reason = prompt(`Why are you blocking ${data.getUserbyUsername.username}? (Optional)`);
    const confirmed = confirm(`Are you sure you want to block ${data.getUserbyUsername.username}?`);
    if (!confirmed) return;
    
    try {
      await blockUser({
        variables: {
          profileid: currentUserProfile.profileid,
          targetprofileid: data.getUserbyUsername.profileid,
          reason: reason || null
        }
      });
      alert('User has been blocked.');
      // Optionally redirect away from blocked user's profile
      router.push('/');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user. Please try again.');
    }
  };

  // Create memory mutation
  const [createMemoryMutation] = useMutation(CREATE_MEMORY, {
    onCompleted: (data) => {
      console.log('✅ Memory created successfully:', data);
      alert('📸 Memory created successfully!');
      refetchMemories(); // Refresh memories list
      setShowCreateMemoryModal(false);
    },
    onError: (error) => {
      console.error('❌ Error creating memory:', error);
      alert(`Failed to create memory: ${error.message}`);
    }
  });

  // Handle create memory
  const handleCreateMemory = () => {
    setShowCreateMemoryModal(true);
  };

  // Create memory with title and optional cover image
  const createMemory = async (title, coverImage = null) => {
    if (!user?.profileid || !title.trim()) {
      alert('Please provide a memory title');
      return;
    }

    try {
      await createMemoryMutation({
        variables: {
          profileid: user.profileid,
          title: title.trim(),
          coverImage: coverImage,
          postUrl: null // Can be added later when stories are added
        }
      });
    } catch (error) {
      console.error('Error in createMemory:', error);
    }
  };

  
  // GraphQL mutations for draft management
  const [deleteDraftMutation] = useMutation(DELETE_DRAFT_MUTATION, {
    onCompleted: () => {
      refetch(); // Refresh profile posts
      refetchDrafts(); // Refresh draft list
    },
    onError: (error) => {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft. Please try again.');
    }
  });

  const [publishDraftMutation] = useMutation(PUBLISH_DRAFT_MUTATION, {
    onCompleted: (data) => {
      console.log('✅ Draft published successfully:', data);
      alert('🎉 Draft published successfully!');
      forceRefresh(); // Use the new force refresh function
      // Dispatch global event for real-time updates
      window.dispatchEvent(new CustomEvent('draftPublished'));
    },
    onError: (error) => {
      console.error('❌ Full error publishing draft:', error);
      console.error('- Error message:', error.message);
      console.error('- GraphQL errors:', error.graphQLErrors);
      console.error('- Network error:', error.networkError);
      
      let errorMsg = 'Unknown error';
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMsg = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMsg = error.networkError.message;
      } else {
        errorMsg = error.message;
      }
      
      alert(`Failed to publish draft: ${errorMsg}`);
    }
  });

  const deleteDraft = async (draftId) => {
    if (!draftId) return;
    
    try {
      await deleteDraftMutation({
        variables: { draftid: draftId }
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      // Error handling is done in the mutation onError callback
    }
  };
  
  const editDraft = (draft) => {
    console.log('✏️ Edit draft:', draft);
    console.log('Draft data being passed:', JSON.stringify(draft, null, 2));
    // Open CreatePostModal with draft data pre-filled
    setShowEditDraftModal(true);
    setCurrentDraft(draft);
  };
  
  const [showEditDraftModal, setShowEditDraftModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(null);
  
  // Add global refresh handler for real-time updates
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Forcing profile refresh...');
    
    // Clear profile cache to fix type mismatches
    if (apolloClient) {
      console.log('🗑️ Clearing profile cache...');
      clearProfileCache(apolloClient);
    }
    
    await refetch();
    await refetchDrafts();
    await refetchMemories();
    console.log('✅ Profile refresh complete');
  }, [refetch, refetchDrafts, refetchMemories, apolloClient]);
  
  // Listen for global post creation events (if available)
  useEffect(() => {
    const handlePostCreated = () => {
      console.log('📝 Post created event detected, refreshing profile...');
      forceRefresh();
    };
    
    // Add event listener for custom post creation events
    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('draftPublished', handlePostCreated);
    
    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('draftPublished', handlePostCreated);
    };
  }, [forceRefresh]);
  
  const publishDraft = async (draft) => {
    console.log('📝 PUBLISH DEBUG - Draft received:', draft);
    console.log('🔑 AUTH DEBUG - User context:', {
      hasUser: !!user,
      username: user?.username,
      profileid: user?.profileid,
      hasAccessToken: !!accessToken
    });
    
    if (!draft.draftid) {
      console.error('❌ No draftid provided:', draft);
      alert('Cannot publish: Invalid draft');
      return;
    }

    // Check if draft has media
    const hasMedia = draft.postUrl && draft.postType;
    console.log('🔍 Has media:', hasMedia, '| PostURL:', draft.postUrl, '| PostType:', draft.postType);
    
    const dialogMessage = hasMedia 
      ? `Publish "${draft.title || 'Untitled'}" as a post?\n\n` +
        `This draft includes ${draft.postType.toLowerCase()} media and will be published as a complete post.`
      : `Publish "${draft.title || 'Untitled'}" as a text post?\n\n` +
        `Note: This draft doesn't have media attached and will be published as a text-only post.`;

    const shouldPublish = window.confirm(dialogMessage);
    console.log('🤔 User confirmed publish:', shouldPublish);
    
    if (!shouldPublish) return;

    try {
      console.log('📤 Calling publishDraftMutation with variables:', {
        draftid: draft.draftid
      });
      
      const result = await publishDraftMutation({
        variables: {
          draftid: draft.draftid
        }
      });
      
      console.log('🎯 Mutation result:', result);
    } catch (error) {
      console.error('❌ Publish draft catch error:', error);
    }
  };

  // Get posts based on active tab (using useMemo for proper reactivity)
  const posts = useMemo(() => {
    const profileData = data?.getUserbyUsername;
    if (!profileData) {
      console.log('\n🔍 POSTS DEBUG - No profile data available');
      return [];
    }
    
    console.log('\n🔍 POSTS DEBUG - Tab Selection:');
    console.log('- Active tab:', activeTab);
    console.log('- Is own profile:', isOwnProfile);
    console.log('- Drafts data available:', !!draftsData);
    console.log('- Drafts count:', draftsData?.getDrafts?.length || 0);
    
    switch (activeTab) {
      case 'uploads':
        const uploads = profileData.post || [];
        console.log('- Returning uploads:', uploads.length);
        return uploads;
      case 'draft':
        if (!isOwnProfile) {
          console.log('- Not own profile, returning empty for drafts');
          return [];
        }
        const drafts = draftsData?.getDrafts || [];
        console.log('- Returning drafts:', drafts.length);
        if (drafts.length > 0) {
          console.log('- First draft details:', drafts[0]);
        }
        return drafts;
      case 'tagged':
        const tagged = profileData.taggedPosts || [];
        console.log('- Returning tagged posts:', tagged.length);
        return tagged;
      default:
        const defaultPosts = profileData.post || [];
        console.log('- Returning default posts:', defaultPosts.length);
        return defaultPosts;
    }
  }, [data, activeTab, isOwnProfile, draftsData, draftsError]);

  if (loading || currentUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    const handleClearCacheAndRetry = async () => {
      if (apolloClient) {
        console.log('🗑️ Clearing all cache and retrying...');
        await clearApolloCache(apolloClient);
      }
      setTimeout(() => refetch(), 500);
    };

    return (
      <div className="text-center py-20">
        <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Error loading profile: {error.message.includes('profileid') ? 'Profile data mismatch detected' : error.message}
        </p>
        <div className="space-x-4">
          <button
            onClick={() => refetch()}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            Try Again
          </button>
          <button
            onClick={handleClearCacheAndRetry}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            Clear Cache & Retry
          </button>
        </div>
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
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader
        profile={profileData}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onMessage={handleMessage}
        onRestrict={handleRestrict}
        onBlock={handleBlock}
        onRefresh={refetch}
        onCreateMemory={handleCreateMemory}
        memoriesData={memoriesData?.getMemories || []}
        theme={theme}
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
        posts={posts}
        activeTab={activeTab}
        loading={false}
        theme={theme}
        currentUser={currentUserProfile || profileData}
        onEditDraft={editDraft}
        onDeleteDraft={deleteDraft}
        onPublishDraft={publishDraft}
      />
      
      {/* Edit Draft Modal */}
      {showEditDraftModal && currentDraft && (
        <CreatePostModal
          isOpen={showEditDraftModal}
          onClose={() => {
            setShowEditDraftModal(false);
            setCurrentDraft(null);
          }}
          theme={theme}
          draftData={currentDraft}
          onPostSuccess={() => {
            setShowEditDraftModal(false);
            setCurrentDraft(null);
            // Remove the draft since it's now a post
            deleteDraft(currentDraft.id || currentDraft.draftid);
            forceRefresh(); // Use the new force refresh function
            // Dispatch global event for other components that might need to update
            window.dispatchEvent(new CustomEvent('postCreated'));
          }}
        />
      )}
      
      {/* Create Memory Modal */}
      <CreateMemoryModal
        isOpen={showCreateMemoryModal}
        onClose={() => setShowCreateMemoryModal(false)}
        onCreateMemory={createMemory}
        theme={theme}
      />
    </div>
  );
}
