import React, { useState } from 'react';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSecureAuth } from '../../context/FixedSecureAuthContext';

const BLOCK_USER = gql`
  mutation BlockUser($profileid: String!, $targetprofileid: String!, $reason: String) {
    BlockUser(profileid: $profileid, targetprofileid: $targetprofileid, reason: $reason) {
      blockid
      blockedprofileid
      reason
      blockedProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

const RESTRICT_USER = gql`
  mutation RestrictUser($profileid: String!, $targetprofileid: String!) {
    RestrictUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      restrictid
      restrictedprofileid
      restrictedProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

const UNBLOCK_USER = gql`
  mutation UnblockUser($profileid: String!, $targetprofileid: String!) {
    UnblockUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      blockid
      blockedprofileid
    }
  }
`;

const UNRESTRICT_USER = gql`
  mutation UnrestrictUser($profileid: String!, $targetprofileid: String!) {
    UnrestrictUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      restrictid
      restrictedprofileid
    }
  }
`;

const BlockRestrictActions = ({ 
  targetUserId, 
  targetUsername, 
  isBlocked = false, 
  isRestricted = false,
  onActionComplete = () => {},
  className = "",
  variant = "dropdown" // "dropdown" | "buttons"
}) => {
  const { user, accessToken } = useSecureAuth();
  const isAuthenticated = !!accessToken && !!user;
  const client = useApolloClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const [blockUser] = useMutation(BLOCK_USER, {
    onCompleted: () => {
      console.log('✅ User blocked successfully');
      // Immediately remove blocked user's content from cache
      client.cache.evict({ fieldName: 'getPosts' });
      client.cache.gc();
      setIsLoading(false);
      onActionComplete('blocked');
      setShowBlockReasonModal(false);
      setBlockReason('');
    },
    onError: (error) => {
      console.error('❌ Error blocking user:', error);
      alert('Failed to block user. Please try again.');
      setIsLoading(false);
    }
  });

  const [restrictUser] = useMutation(RESTRICT_USER, {
    onCompleted: () => {
      console.log('✅ User restricted successfully');
      // Refresh cache to apply restriction filtering
      client.cache.evict({ fieldName: 'getPosts' });
      client.cache.gc();
      setIsLoading(false);
      onActionComplete('restricted');
    },
    onError: (error) => {
      console.error('❌ Error restricting user:', error);
      alert('Failed to restrict user. Please try again.');
      setIsLoading(false);
    }
  });

  const [unblockUser] = useMutation(UNBLOCK_USER, {
    onCompleted: () => {
      console.log('✅ User unblocked successfully');
      // Refresh cache to show previously blocked content
      client.cache.evict({ fieldName: 'getPosts' });
      client.cache.gc();
      setIsLoading(false);
      onActionComplete('unblocked');
    },
    onError: (error) => {
      console.error('❌ Error unblocking user:', error);
      alert('Failed to unblock user. Please try again.');
      setIsLoading(false);
    }
  });

  const [unrestrictUser] = useMutation(UNRESTRICT_USER, {
    onCompleted: () => {
      console.log('✅ User unrestricted successfully');
      // Refresh cache to remove restriction filtering
      client.cache.evict({ fieldName: 'getPosts' });
      client.cache.gc();
      setIsLoading(false);
      onActionComplete('unrestricted');
    },
    onError: (error) => {
      console.error('❌ Error unrestricting user:', error);
      alert('Failed to unrestrict user. Please try again.');
      setIsLoading(false);
    }
  });

  const handleBlock = async (reason = '') => {
    if (!isAuthenticated || !user?.profileid) {
      alert('Please log in to block users.');
      return;
    }

    if (user.profileid === targetUserId) {
      alert('You cannot block yourself.');
      return;
    }

    // Add confirmation (Issue 6.12)
    const confirmed = window.confirm(
      `Block @${targetUsername}?\n\nThis will:\n• Hide all their posts\n• Prevent them from seeing your profile\n• Stop them from contacting you`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await blockUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: targetUserId,
          reason: reason || null
        }
      });
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleRestrict = async () => {
    if (!isAuthenticated || !user?.profileid) {
      alert('Please log in to restrict users.');
      return;
    }

    if (user.profileid === targetUserId) {
      alert('You cannot restrict yourself.');
      return;
    }

    // Add confirmation (Issue 6.12)
    const confirmed = window.confirm(
      `Restrict @${targetUsername}?\n\nThis will:\n• Limit their interactions with you\n• Hide their comments from others\n• They won't be notified`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await restrictUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: targetUserId
        }
      });
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!isAuthenticated || !user?.profileid) {
      alert('Please log in to unblock users.');
      return;
    }

    setIsLoading(true);
    try {
      await unblockUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: targetUserId
        }
      });
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleUnrestrict = async () => {
    if (!isAuthenticated || !user?.profileid) {
      alert('Please log in to unrestrict users.');
      return;
    }

    setIsLoading(true);
    try {
      await unrestrictUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: targetUserId
        }
      });
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleBlockWithReason = () => {
    setShowDropdown(false);
    setShowBlockReasonModal(true);
  };

  const confirmBlock = () => {
    handleBlock(blockReason);
  };

  if (!isAuthenticated || user?.profileid === targetUserId) {
    return null;
  }

  if (variant === "buttons") {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {isBlocked ? (
          <button
            onClick={handleUnblock}
            disabled={isLoading}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Unblocking...' : 'Unblock'}
          </button>
        ) : (
          <button
            onClick={() => handleBlock()}
            disabled={isLoading}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? 'Blocking...' : 'Block'}
          </button>
        )}
        
        {isRestricted ? (
          <button
            onClick={handleUnrestrict}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Unrestricting...' : 'Unrestrict'}
          </button>
        ) : (
          <button
            onClick={handleRestrict}
            disabled={isLoading}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? 'Restricting...' : 'Restrict'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 hover:bg-gray-100 rounded-full"
        disabled={isLoading}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
          <div className="py-1">
            {isBlocked ? (
              <button
                onClick={handleUnblock}
                disabled={isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Unblocking...' : `Unblock @${targetUsername}`}
              </button>
            ) : (
              <button
                onClick={handleBlockWithReason}
                disabled={isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Blocking...' : `Block @${targetUsername}`}
              </button>
            )}
            
            {isRestricted ? (
              <button
                onClick={handleUnrestrict}
                disabled={isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Unrestricting...' : `Unrestrict @${targetUsername}`}
              </button>
            ) : (
              <button
                onClick={handleRestrict}
                disabled={isLoading}
                className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Restricting...' : `Restrict @${targetUsername}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {showBlockReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Block @{targetUsername}</h3>
            <p className="text-gray-600 mb-4">
              This will hide all their posts and prevent them from interacting with you.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Why are you blocking this user?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                maxLength={200}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBlockReasonModal(false);
                  setBlockReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlock}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default BlockRestrictActions;
