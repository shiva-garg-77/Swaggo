"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import {
  SEND_FOLLOW_REQUEST,
  CANCEL_FOLLOW_REQUEST,
  GET_FOLLOW_REQUEST_STATUS
} from '../../../lib/graphql/followRequestQueries';
import { TOGGLE_FOLLOW_USER } from '../../../lib/graphql/profileQueries';

/**
 * Smart follow button that handles both public and private profiles
 * - Public profiles: Direct follow/unfollow
 * - Private profiles: Send/cancel follow request
 */
export default function FollowRequestButton({ 
  targetProfile,
  isFollowing,
  onFollowChange,
  className = '',
  theme = 'light'
}) {
  const { user } = useFixedSecureAuth();
  const [requestStatus, setRequestStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check existing follow request status
  const { data: statusData, refetch: refetchStatus } = useQuery(GET_FOLLOW_REQUEST_STATUS, {
    variables: {
      requesterid: user?.profileid,
      requestedid: targetProfile?.profileid
    },
    skip: !user?.profileid || !targetProfile?.profileid || !targetProfile?.isPrivate,
    errorPolicy: 'all'
  });

  // Mutations
  const [toggleFollow] = useMutation(TOGGLE_FOLLOW_USER);
  const [sendFollowRequest] = useMutation(SEND_FOLLOW_REQUEST);
  const [cancelFollowRequest] = useMutation(CANCEL_FOLLOW_REQUEST);

  useEffect(() => {
    if (statusData?.getFollowRequestStatus) {
      setRequestStatus(statusData.getFollowRequestStatus);
    }
  }, [statusData]);

  const handleClick = async () => {
    if (!user?.profileid) {
      alert('Please login to follow users');
      return;
    }

    setLoading(true);

    try {
      // For public profiles or already following
      if (!targetProfile.isPrivate || isFollowing) {
        await toggleFollow({
          variables: {
            profileid: user.profileid,
            followid: targetProfile.profileid
          }
        });
        onFollowChange?.(!isFollowing);
      } 
      // For private profiles
      else {
        if (requestStatus === 'pending') {
          // Cancel pending request
          await cancelFollowRequest({
            variables: {
              requesterid: user.profileid,
              requestedid: targetProfile.profileid
            }
          });
          setRequestStatus(null);
        } else {
          // Send follow request
          await sendFollowRequest({
            variables: {
              requesterid: user.profileid,
              requestedid: targetProfile.profileid,
              message: null
            }
          });
          setRequestStatus('pending');
        }
        refetchStatus();
      }
    } catch (error) {
      console.error('Error handling follow:', error);
      alert(error.message || 'Failed to process follow action');
    } finally {
      setLoading(false);
    }
  };

  // Determine button text and style (Issue 6.4 - Make state clearer)
  const getButtonContent = () => {
    if (isFollowing) {
      return { text: '✓ Following', style: 'secondary', icon: '✓' };
    }

    if (targetProfile.isPrivate) {
      if (requestStatus === 'pending') {
        return { text: '⏱ Requested', style: 'secondary', icon: '⏱' };
      }
      return { text: '+ Request', style: 'primary', icon: '+' };
    }

    return { text: '+ Follow', style: 'primary', icon: '+' };
  };

  const { text, style, icon } = getButtonContent();

  const buttonClasses = `px-6 py-2 rounded-full font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
    style === 'primary'
      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
      : theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-2 border-gray-500'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-2 border-gray-400'
  } ${className}`;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={buttonClasses}
    >
      {loading ? (
        <span className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Processing...</span>
        </span>
      ) : (
        text
      )}
    </button>
  );
}
