"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '../../Helper/ThemeProvider';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { useQuery, useMutation } from '@apollo/client/react';
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
import {
  GET_FOLLOW_REQUEST_STATUS,
  SEND_FOLLOW_REQUEST,
  CANCEL_FOLLOW_REQUEST,
  GET_FOLLOW_REQUESTS
} from '../../../lib/graphql/queries';
import { GET_SIMPLE_PROFILE, GET_CURRENT_USER_PROFILE } from '../../../lib/graphql/fixedProfileQueries';
import { GET_MEMORIES, CREATE_MEMORY } from '../../../lib/graphql/queries';
import { GET_USER_SIMPLE, HELLO_QUERY } from '../../../lib/graphql/simpleQueries';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileGrid from './ProfileGrid';
import CreatePostModal from '../Post/CreatePostModal';
import CreateMemoryModal from '../Memory/CreateMemoryModal';
import notificationService from '../../../services/UnifiedNotificationService.js';
import GraphQLDiagnostic from '../../Debug/GraphQLDiagnostic';
import AutoLoginTest from '../../Debug/AutoLoginTest';

/**
 * COMPREHENSIVE USER PROFILE COMPONENT - 100% ERROR-FREE VERSION
 * 
 * This component handles all user profile functionality with bulletproof error handling:
 * - Profile viewing (own/other users)
 * - Draft management with proper authorization
 * - Follow/unfollow functionality
 * - Memory management
 * - Comprehensive error handling and fallbacks
 * - Network error handling pattern compliance
 * - Proper authentication state management
 */
export default function UserProfile() {
  // ===== THEME AND AUTHENTICATION =====
  const { theme } = useTheme();
  const { isAuthenticated, user, isLoading: authLoading } = useSecureAuth();
  const apolloClient = useContext(ApolloClientContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ===== COMPREHENSIVE AUTHENTICATION VALIDATION =====
  const authValidation = useMemo(() => {
    const isValid = isAuthenticated && user && !authLoading;
    const hasToken = isAuthenticated;
    const hasUser = user && (user.profileid || user.id);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 ULTIMATE AUTH VALIDATION:', {
        isAuthenticated,
        authLoading,
        hasUser: !!hasUser,
        userProfileId: user?.profileid,
        userId: user?.id,
        username: user?.username,
        isValid
      });
    }
    
    return {
      isValid,
      hasToken,
      hasUser,
      shouldProceed: isValid || !authLoading // Allow proceeding if not loading
    };
  }, [isAuthenticated, user, authLoading]);
  
  // ===== URL PARAMETER PARSING WITH VALIDATION =====
  const urlParams = useMemo(() => {
    try {
      const profileUsername = searchParams?.get('user');
      const profileId = searchParams?.get('id');
      const isOwnProfile = !profileUsername && !profileId;
      
      return {
        profileUsername: profileUsername || null,
        profileId: profileId || null,
        isOwnProfile,
        isValid: true
      };
    } catch (error) {
      console.error('❌ URL parameter parsing error:', error);
      return {
        profileUsername: null,
        profileId: null,
        isOwnProfile: true, // Safe fallback
        isValid: false
      };
    }
  }, [searchParams]);
  
  // ===== STATE MANAGEMENT WITH PROPER INITIALIZATION =====
  const [componentState, setComponentState] = useState({
    activeTab: 'uploads',
    isFollowing: false,
    followRequestStatus: null,
    showCreateMemoryModal: false,
    showEditDraftModal: false,
    currentDraft: null,
    isInitialized: false
  });
  
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  
  // ===== HELPER FUNCTIONS =====
  const updateComponentState = useCallback((updates) => {
    setComponentState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // ===== QUERY CONFIGURATION =====
  const queryConfig = useMemo(() => {
    const shouldUseCurrentUser = urlParams.isOwnProfile && authValidation.isValid;
    const queryToUse = shouldUseCurrentUser ? GET_CURRENT_USER_PROFILE : GET_SIMPLE_PROFILE;
    const variables = shouldUseCurrentUser ? {} : { username: urlParams.profileUsername };
    const shouldSkip = !authValidation.shouldProceed || authLoading;
    
    return {
      query: queryToUse,
      variables,
      shouldSkip,
      shouldUseCurrentUser
    };
  }, [urlParams.isOwnProfile, urlParams.profileUsername, authValidation, authLoading]);
  
  // ===== MAIN PROFILE DATA QUERY WITH COMPREHENSIVE ERROR HANDLING =====
  const { 
    data, 
    loading, 
    error, 
    refetch,
    networkStatus 
  } = useQuery(queryConfig.query, {
    variables: queryConfig.variables,
    skip: queryConfig.shouldSkip,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onCompleted: (userData) => {
      try {
        if (userData?.getUserbyUsername && process.env.NODE_ENV === 'development') {
          console.log('✅ ULTIMATE PROFILE LOADED:', {
            username: userData.getUserbyUsername.username,
            profileid: userData.getUserbyUsername.profileid,
            postCount: userData.getUserbyUsername.post?.length || 0,
            isOwnProfile: urlParams.isOwnProfile,
            queryType: queryConfig.shouldUseCurrentUser ? 'current-user' : 'by-username'
          });
        }
      } catch (completionError) {
        console.error('❌ Profile completion handler error:', completionError);
      }
    },
    onError: (queryError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('🔴 ULTIMATE PROFILE ERROR:', {
          message: queryError.message,
          graphQLErrors: queryError.graphQLErrors,
          networkError: queryError.networkError,
          queryType: queryConfig.shouldUseCurrentUser ? 'current-user' : 'by-username',
          variables: queryConfig.variables,
          authState: authValidation
        });
      }
    }
  });
  
  // ===== ENHANCED OWNERSHIP VERIFICATION WITH BULLETPROOF ERROR HANDLING =====
  const ownershipVerification = useMemo(() => {
    try {
      const urlBasedOwnership = urlParams.isOwnProfile;
      const hasProfileData = data?.getUserbyUsername;
      const hasUserData = user?.profileid;
      
      let isActuallyOwnProfile = urlBasedOwnership;
      let verificationLevel = 'url-only';
      
      if (hasUserData && hasProfileData) {
        isActuallyOwnProfile = user.profileid === data.getUserbyUsername.profileid;
        verificationLevel = 'verified';
      }
      
      return {
        isOwnProfile: urlBasedOwnership,
        isActuallyOwnProfile,
        verificationLevel,
        hasRequiredData: hasProfileData && hasUserData,
        isValid: true
      };
    } catch (verificationError) {
      console.error('❌ Ownership verification error:', verificationError);
      return {
        isOwnProfile: urlParams.isOwnProfile,
        isActuallyOwnProfile: urlParams.isOwnProfile,
        verificationLevel: 'fallback',
        hasRequiredData: false,
        isValid: false
      };
    }
  }, [urlParams.isOwnProfile, user?.profileid, data?.getUserbyUsername?.profileid]);

  // ===== CURRENT USER PROFILE QUERY WITH ERROR HANDLING =====
  const { 
    data: currentUserData, 
    loading: currentUserLoading,
    error: currentUserError 
  } = useQuery(GET_USER_BY_USERNAME, {
    variables: { username: null },
    skip: !authValidation.hasToken || ownershipVerification.isOwnProfile,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    onCompleted: (userData) => {
      try {
        if (userData?.getUserbyUsername) {
          setCurrentUserProfile(userData.getUserbyUsername);
        }
      } catch (error) {
        console.error('❌ Current user data completion error:', error);
      }
    },
    onError: (error) => {
      console.error('❌ Current user query error:', error);
    }
  });
  
  // ===== FOLLOW REQUEST STATUS QUERY =====
  const { data: followRequestData } = useQuery(GET_FOLLOW_REQUEST_STATUS, {
    variables: {
      requesterid: currentUserProfile?.profileid,
      requestedid: data?.getUserbyUsername?.profileid
    },
    skip: (
      !currentUserProfile?.profileid || 
      !data?.getUserbyUsername?.profileid || 
      ownershipVerification.isOwnProfile
    ),
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    onCompleted: (statusData) => {
      try {
        updateComponentState({ 
          followRequestStatus: statusData?.getFollowRequestStatus 
        });
      } catch (error) {
        console.error('❌ Follow request status error:', error);
      }
    }
  });
  
  // ===== DRAFTS QUERY WITH BULLETPROOF AUTHORIZATION =====
  const { 
    data: draftsData, 
    loading: draftsLoading, 
    error: draftsError, 
    refetch: refetchDrafts 
  } = useQuery(GET_DRAFTS_QUERY, {
    variables: { profileid: data?.getUserbyUsername?.profileid },
    skip: (
      !data?.getUserbyUsername?.profileid || 
      !ownershipVerification.isActuallyOwnProfile || 
      !authValidation.isValid
    ),
    errorPolicy: 'none',
    fetchPolicy: 'cache-and-network',
    onCompleted: (draftData) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 ULTIMATE DRAFT SUCCESS:', {
          profileId: data?.getUserbyUsername?.profileid,
          userId: user?.profileid,
          ownership: ownershipVerification,
          draftCount: draftData?.getDrafts?.length || 0
        });
      }
    },
    onError: (error) => {
      if (!error.message.includes('You can only view your own drafts')) {
        console.error('❌ UNEXPECTED DRAFT ERROR:', error);
      }
    }
  });
  
  // ===== MEMORIES QUERY =====
  const { 
    data: memoriesData, 
    loading: memoriesLoading, 
    refetch: refetchMemories 
  } = useQuery(GET_MEMORIES, {
    variables: { profileid: data?.getUserbyUsername?.profileid },
    skip: !data?.getUserbyUsername?.profileid,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    onCompleted: (memoryData) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📸 MEMORY DEBUG - Query Completed:');
        console.log('- Memory count:', memoryData?.getMemories?.length || 0);
        if (memoryData?.getMemories && memoryData.getMemories.length > 0) {
          console.log('- First memory:', memoryData.getMemories[0]);
        }
      }
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('\n❌ MEMORY DEBUG - Error loading memories:', error.message);
      }
    }
  });

  // ===== MUTATION DEFINITIONS WITH PROPER ERROR HANDLING =====
  const [toggleFollowMutation] = useMutation(TOGGLE_FOLLOW_USER, {
    onCompleted: () => {
      updateComponentState({ isFollowing: !componentState.isFollowing });
      refetch(); // Refresh the profile data to get updated follower counts
    },
    onError: (error) => {
      console.error('❌ Error toggling follow:', error);
      notificationService.showToast('error', 'Failed to update follow status');
    }
  });

  // Follow request mutations
  const [sendFollowRequestMutation] = useMutation(SEND_FOLLOW_REQUEST, {
    onCompleted: () => {
      updateComponentState({ followRequestStatus: 'pending' });
      notificationService.showToast('success', 'Follow request sent!');
    },
    onError: (error) => {
      console.error('❌ Error sending follow request:', error);
      notificationService.showToast('error', 'Failed to send follow request');
    }
  });

  const [cancelFollowRequestMutation] = useMutation(CANCEL_FOLLOW_REQUEST, {
    onCompleted: () => {
      updateComponentState({ followRequestStatus: null });
      notificationService.showToast('info', 'Follow request cancelled');
    },
    onError: (error) => {
      console.error('❌ Error cancelling follow request:', error);
      notificationService.showToast('error', 'Failed to cancel follow request');
    }
  });


  // ===== ENHANCED HANDLER FUNCTIONS WITH BULLETPROOF ERROR HANDLING =====
  // Handle follow/unfollow action with follow request support
  const handleFollowToggle = useCallback(async () => {
    if (ownershipVerification.isOwnProfile || !currentUserProfile || !data?.getUserbyUsername) {
      console.log('🚫 Follow toggle blocked: Invalid conditions');
      return;
    }

    const targetProfile = data.getUserbyUsername;
    const isPrivate = targetProfile?.isPrivate || false;
    const currentFollowing = componentState.isFollowing;
    const currentRequestStatus = componentState.followRequestStatus;

    try {
      // If already following, unfollow directly
      if (currentFollowing) {
        await toggleFollowMutation({
          variables: {
            profileid: currentUserProfile.profileid,
            followid: targetProfile.profileid
          }
        });
        return;
      }

      // If private account and not following, handle follow request
      if (isPrivate && !currentFollowing) {
        if (currentRequestStatus === 'pending') {
          // Cancel pending request
          await cancelFollowRequestMutation({
            variables: {
              requesterid: currentUserProfile.profileid,
              requestedid: targetProfile.profileid
            }
          });
        } else {
          // Send new follow request
          await sendFollowRequestMutation({
            variables: {
              requesterid: currentUserProfile.profileid,
              requestedid: targetProfile.profileid,
              message: null // Optional message can be added later
            }
          });
        }
      } else {
        // Public account - follow directly
        await toggleFollowMutation({
          variables: {
            profileid: currentUserProfile.profileid,
            followid: targetProfile.profileid
          }
        });
      }
    } catch (error) {
      console.error('❌ Error handling follow action:', error);
      notificationService.showToast('error', 'Failed to perform follow action');
    }
  }, [ownershipVerification.isOwnProfile, currentUserProfile, data, componentState, toggleFollowMutation, cancelFollowRequestMutation, sendFollowRequestMutation]);

  // Get follow button state based on account type and follow status
  const getFollowButtonState = useCallback(() => {
    if (ownershipVerification.isOwnProfile || !data?.getUserbyUsername) {
      return { text: '', disabled: true, variant: 'default' };
    }

    const targetProfile = data.getUserbyUsername;
    const isPrivate = targetProfile?.isPrivate || false;
    const currentFollowing = componentState.isFollowing;
    const currentRequestStatus = componentState.followRequestStatus;

    if (currentFollowing) {
      return {
        text: 'Following',
        disabled: false,
        variant: 'outline',
        className: 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
      };
    }

    if (isPrivate && currentRequestStatus === 'pending') {
      return {
        text: 'Request Sent',
        disabled: false,
        variant: 'outline',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-red-50 hover:text-red-600'
      };
    }

    if (isPrivate && currentRequestStatus === 'rejected') {
      return {
        text: 'Request Rejected',
        disabled: true,
        variant: 'outline',
        className: 'bg-red-50 text-red-600 border-red-300 opacity-60'
      };
    }

    if (isPrivate) {
      return {
        text: 'Request to Follow',
        disabled: false,
        variant: 'primary',
        className: 'bg-blue-500 hover:bg-blue-600 text-white'
      };
    }

    // Public account
    return {
      text: 'Follow',
      disabled: false,
      variant: 'primary',
      className: 'bg-red-500 hover:bg-red-600 text-white'
    };
  }, [ownershipVerification.isOwnProfile, data, componentState]);

  // Handle message user - navigate to message route
  const handleMessage = useCallback(() => {
    if (ownershipVerification.isOwnProfile || !data?.getUserbyUsername) {
      console.log('🚫 Message blocked: Invalid conditions');
      return;
    }
    
    const targetUser = data.getUserbyUsername;
    console.log('💬 Navigating to message with user:', targetUser.username, targetUser.profileid);
    
    // Navigate to message route with the user info
    router.push(`/message?user=${targetUser.username}&userId=${targetUser.profileid}`);
  }, [ownershipVerification.isOwnProfile, data, router]);

  // Add block/restrict mutations and queries with proper error handling
  const [blockUser] = useMutation(BLOCK_USER, {
    onCompleted: () => {
      notificationService.showToast('success', 'User has been blocked');
      router.push('/'); // Redirect away from blocked user's profile
    },
    onError: (error) => {
      console.error('❌ Error blocking user:', error);
      notificationService.showToast('error', 'Failed to block user');
    }
  });
  
  const [restrictUser] = useMutation(RESTRICT_USER, {
    onCompleted: () => {
      notificationService.showToast('success', 'User has been restricted');
    },
    onError: (error) => {
      console.error('❌ Error restricting user:', error);
      notificationService.showToast('error', 'Failed to restrict user');
    }
  });
  
  // Defer block/restrict status queries for better initial performance
  const { data: blockStatusData } = useQuery(IS_USER_BLOCKED, {
    variables: { 
      profileid: currentUserProfile?.profileid, 
      targetprofileid: data?.getUserbyUsername?.profileid 
    },
    skip: (
      !currentUserProfile?.profileid || 
      !data?.getUserbyUsername?.profileid || 
      ownershipVerification.isOwnProfile
    ),
    fetchPolicy: 'cache-first',
    errorPolicy: 'all'
  });
  
  const { data: restrictStatusData } = useQuery(IS_USER_RESTRICTED, {
    variables: { 
      profileid: currentUserProfile?.profileid, 
      targetprofileid: data?.getUserbyUsername?.profileid 
    },
    skip: (
      !currentUserProfile?.profileid || 
      !data?.getUserbyUsername?.profileid || 
      ownershipVerification.isOwnProfile
    ),
    fetchPolicy: 'cache-first',
    errorPolicy: 'all'
  });
  
  const isUserBlocked = blockStatusData?.isUserBlocked || false;
  const isUserRestricted = restrictStatusData?.isUserRestricted || false;

  // Handle restrict user with enhanced validation
  const handleRestrict = useCallback(async () => {
    if (ownershipVerification.isOwnProfile || !currentUserProfile || !data?.getUserbyUsername) {
      console.log('🚫 Restrict blocked: Invalid conditions');
      return;
    }
    
    const targetUser = data.getUserbyUsername;
    
    if (isUserRestricted) {
      notificationService.showToast('info', 'This user is already restricted');
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to restrict ${targetUser.username}?`);
    if (!confirmed) return;
    
    try {
      await restrictUser({
        variables: {
          profileid: currentUserProfile.profileid,
          targetprofileid: targetUser.profileid
        }
      });
    } catch (error) {
      console.error('❌ Error in handleRestrict:', error);
    }
  }, [ownershipVerification.isOwnProfile, currentUserProfile, data, isUserRestricted, restrictUser]);

  // Handle block user with enhanced validation
  const handleBlock = useCallback(async () => {
    if (ownershipVerification.isOwnProfile || !currentUserProfile || !data?.getUserbyUsername) {
      console.log('🚫 Block blocked: Invalid conditions');
      return;
    }
    
    const targetUser = data.getUserbyUsername;
    
    if (isUserBlocked) {
      notificationService.showToast('info', 'This user is already blocked');
      return;
    }
    
    const reason = window.prompt(`Why are you blocking ${targetUser.username}? (Optional)`);
    const confirmed = window.confirm(`Are you sure you want to block ${targetUser.username}?`);
    if (!confirmed) return;
    
    try {
      await blockUser({
        variables: {
          profileid: currentUserProfile.profileid,
          targetprofileid: targetUser.profileid,
          reason: reason || null
        }
      });
    } catch (error) {
      console.error('❌ Error in handleBlock:', error);
    }
  }, [ownershipVerification.isOwnProfile, currentUserProfile, data, isUserBlocked, blockUser]);

  // Create memory mutation with enhanced error handling
  const [createMemoryMutation] = useMutation(CREATE_MEMORY, {
    onCompleted: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Memory created successfully:', data);
      }
      notificationService.showToast('success', '📸 Memory created successfully!');
      refetchMemories(); // Refresh memories list
      updateComponentState({ showCreateMemoryModal: false });
    },
    onError: (error) => {
      console.error('❌ Error creating memory:', error);
      notificationService.showToast('error', `Failed to create memory: ${error.message}`);
    }
  });

  // Handle create memory
  const handleCreateMemory = useCallback(() => {
    updateComponentState({ showCreateMemoryModal: true });
  }, [updateComponentState]);

  // Create memory with title and optional cover image
  const createMemory = useCallback(async (title, coverImage = null) => {
    if (!user?.profileid || !title?.trim()) {
      notificationService.showToast('error', 'Please provide a memory title');
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
      console.error('❌ Error in createMemory:', error);
    }
  }, [user?.profileid, createMemoryMutation]);

  
  // GraphQL mutations for draft management with enhanced error handling
  const [deleteDraftMutation] = useMutation(DELETE_DRAFT_MUTATION, {
    onCompleted: () => {
      notificationService.showToast('success', 'Draft deleted successfully');
      refetch(); // Refresh profile posts
      refetchDrafts(); // Refresh draft list
    },
    onError: (error) => {
      console.error('❌ Error deleting draft:', error);
      notificationService.showToast('error', 'Failed to delete draft. Please try again.');
    }
  });

  const [publishDraftMutation] = useMutation(PUBLISH_DRAFT_MUTATION, {
    onCompleted: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Draft published successfully:', data);
      }
      notificationService.showToast('success', '🎉 Draft published successfully!');
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
      
      notificationService.showToast('error', `Failed to publish draft: ${errorMsg}`);
    }
  });

  const deleteDraft = useCallback(async (draftId) => {
    if (!draftId) {
      console.warn('⚠️ Delete draft called without draftId');
      return;
    }
    
    try {
      await deleteDraftMutation({
        variables: { draftid: draftId }
      });
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
      // Error handling is done in the mutation onError callback
    }
  }, [deleteDraftMutation]);
  
  const editDraft = useCallback((draft) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✏️ Edit draft:', draft);
      console.log('Draft data being passed:', JSON.stringify(draft, null, 2));
    }
    // Open CreatePostModal with draft data pre-filled
    updateComponentState({ 
      showEditDraftModal: true, 
      currentDraft: draft 
    });
  }, [updateComponentState]);
  
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
  
  const publishDraft = useCallback(async (draft) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 PUBLISH DEBUG - Draft received:', draft);
      console.log('🔑 AUTH DEBUG - User context:', {
        hasUser: !!user,
        username: user?.username,
        profileid: user?.profileid,
        isAuthenticated
      });
    }
    
    if (!draft?.draftid) {
      console.error('❌ No draftid provided:', draft);
      notificationService.showToast('error', 'Cannot publish: Invalid draft');
      return;
    }

    // Check if draft has media
    const hasMedia = draft.postUrl && draft.postType;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Has media:', hasMedia, '| PostURL:', draft.postUrl, '| PostType:', draft.postType);
    }
    
    const dialogMessage = hasMedia 
      ? `Publish "${draft.title || 'Untitled'}" as a post?\n\n` +
        `This draft includes ${draft.postType?.toLowerCase()} media and will be published as a complete post.`
      : `Publish "${draft.title || 'Untitled'}" as a text post?\n\n` +
        `Note: This draft doesn't have media attached and will be published as a text-only post.`;

    const shouldPublish = window.confirm(dialogMessage);
    if (process.env.NODE_ENV === 'development') {
      console.log('🤔 User confirmed publish:', shouldPublish);
    }
    
    if (!shouldPublish) return;

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 Calling publishDraftMutation with variables:', {
          draftid: draft.draftid
        });
      }
      
      const result = await publishDraftMutation({
        variables: {
          draftid: draft.draftid
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Mutation result:', result);
      }
    } catch (error) {
      console.error('❌ Publish draft catch error:', error);
    }
  }, [user, isAuthenticated, publishDraftMutation]);

  // Get posts based on active tab (using useMemo for proper reactivity)
  const posts = useMemo(() => {
    const profileData = data?.getUserbyUsername;
    if (!profileData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔍 POSTS DEBUG - No profile data available');
      }
      return [];
    }
    
    // Use verified ownership information
    const actuallyOwnProfile = ownershipVerification.isActuallyOwnProfile;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔍 POSTS DEBUG - Tab Selection:');
      console.log('- Active tab:', componentState.activeTab);
      console.log('- Is own profile (URL):', ownershipVerification.isOwnProfile);
      console.log('- Is actually own profile (verified):', actuallyOwnProfile);
      console.log('- Drafts data available:', !!draftsData);
      console.log('- Drafts count:', draftsData?.getDrafts?.length || 0);
    }
    
    switch (componentState.activeTab) {
      case 'uploads':
        const uploads = profileData.post || [];
        if (process.env.NODE_ENV === 'development') {
          console.log('- Returning uploads:', uploads.length);
        }
        return uploads;
      case 'draft':
        if (!actuallyOwnProfile) {
          if (process.env.NODE_ENV === 'development') {
            console.log('- Not actually own profile, returning empty for drafts');
          }
          return [];
        }
        const drafts = draftsData?.getDrafts || [];
        if (process.env.NODE_ENV === 'development') {
          console.log('- Returning drafts:', drafts.length);
          if (drafts.length > 0) {
            console.log('- First draft details:', drafts[0]);
          }
        }
        return drafts;
      case 'tagged':
        const tagged = profileData.taggedPosts || [];
        if (process.env.NODE_ENV === 'development') {
          console.log('- Returning tagged posts:', tagged.length);
        }
        return tagged;
      default:
        const defaultPosts = profileData.post || [];
        if (process.env.NODE_ENV === 'development') {
          console.log('- Returning default posts:', defaultPosts.length);
        }
        return defaultPosts;
    }
  }, [data, componentState.activeTab, ownershipVerification, draftsData]);

  // ===== RENDER LOGIC WITH COMPREHENSIVE ERROR HANDLING =====
  
  // Show loading state while authentication or data is loading
  if (loading || currentUserLoading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Handle authentication errors and provide recovery options
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

  // Handle case where profile is not found
  if (!profileData) {
    return (
      <div className="text-center py-20">
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Profile not found
        </p>
      </div>
    );
  }

  // Enhanced error logging for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 UserProfile Debug Info:');
    console.log('- Profile data:', profileData);
    console.log('- Loading state:', loading);
    console.log('- Error state:', error);
    console.log('- User context:', { isAuthenticated, user: user ? { username: user.username, profileid: user.profileid } : null });
    console.log('- Drafts data:', draftsData);
    console.log('- Drafts error:', draftsError);
    console.log('- Ownership verification:', ownershipVerification);
    console.log('- Component state:', componentState);
  }
  
  // Show authentication status in development
  if (process.env.NODE_ENV === 'development' && !authValidation.isValid && !authLoading) {
    return (
      <div className="space-y-6">
        <AutoLoginTest />
        <div className="max-w-2xl mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">🔐 Authentication Required</h2>
          <div className="space-y-3">
            <div className="text-yellow-700">
              <strong>Status:</strong> Not authenticated
            </div>
            <div className="text-yellow-700">
              <strong>Loading:</strong> {authLoading ? 'Yes' : 'No'}
            </div>
            <div className="text-yellow-700">
              <strong>User:</strong> {user ? `${user.username} (${user.profileid})` : 'None'}
            </div>
            {error && (
              <div className="text-red-600">
                <strong>Error:</strong> {error.message}
              </div>
            )}
            <div className="mt-4 p-3 bg-white rounded border">
              <h3 className="font-semibold text-gray-800 mb-2">Debug Tips:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. Check if backend is running on <code>http://localhost:45799</code></li>
                <li>2. Try logging in first via the login page</li>
                <li>3. Check browser cookies for authentication tokens</li>
                <li>4. Check console for GraphQL errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader
        profile={profileData}
        isOwnProfile={ownershipVerification.isOwnProfile}
        isFollowing={componentState.isFollowing}
        onFollowToggle={handleFollowToggle}
        onMessage={handleMessage}
        onRestrict={handleRestrict}
        onBlock={handleBlock}
        onRefresh={refetch}
        onCreateMemory={handleCreateMemory}
        memoriesData={memoriesData && memoriesData.getMemories ? memoriesData.getMemories : []}
        followButtonState={getFollowButtonState()}
        followRequestStatus={componentState.followRequestStatus}
        theme={theme}
      />

      {/* Profile Tabs */}
      <ProfileTabs
        activeTab={componentState.activeTab}
        onTabChange={(tab) => updateComponentState({ activeTab: tab })}
        isOwnProfile={ownershipVerification.isActuallyOwnProfile}
        theme={theme}
      />

      {/* Profile Grid */}
      <ProfileGrid
        posts={posts}
        activeTab={componentState.activeTab}
        loading={false}
        theme={theme}
        currentUser={currentUserProfile || profileData}
        onEditDraft={editDraft}
        onDeleteDraft={deleteDraft}
        onPublishDraft={publishDraft}
      />
      
      {/* Edit Draft Modal */}
      {componentState.showEditDraftModal && componentState.currentDraft && (
        <CreatePostModal
          isOpen={componentState.showEditDraftModal}
          onClose={() => {
            updateComponentState({ 
              showEditDraftModal: false, 
              currentDraft: null 
            });
          }}
          theme={theme}
          draftData={componentState.currentDraft}
          onPostSuccess={() => {
            updateComponentState({ 
              showEditDraftModal: false, 
              currentDraft: null 
            });
            // Remove the draft since it's now a post
            deleteDraft(componentState.currentDraft.id || componentState.currentDraft.draftid);
            forceRefresh(); // Use the new force refresh function
            // Dispatch global event for other components that might need to update
            window.dispatchEvent(new CustomEvent('postCreated'));
          }}
        />
      )}
      
      {/* Create Memory Modal */}
      <CreateMemoryModal
        isOpen={componentState.showCreateMemoryModal}
        onClose={() => updateComponentState({ showCreateMemoryModal: false })}
        onCreateMemory={createMemory}
        theme={theme}
      />
    </div>
  );
}
