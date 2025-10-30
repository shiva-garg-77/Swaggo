import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSecureAuth } from '../../context/FixedSecureAuthContext';

const GET_BLOCKED_ACCOUNTS = gql`
  query GetBlockedAccounts($profileid: String!) {
    getBlockedAccounts(profileid: $profileid) {
      blockid
      blockedprofileid
      reason
      createdAt
      blockedProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

const GET_POSTS = gql`
  query GetPosts {
    getPosts {
      postid
      profileid
      profile {
        username
        profilePic
      }
      title
      description
      postUrl
      postType
      createdAt
    }
  }
`;

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

const UNBLOCK_USER = gql`
  mutation UnblockUser($profileid: String!, $targetprofileid: String!) {
    UnblockUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      blockid
      blockedprofileid
    }
  }
`;

const BlockedAccountsEnhanced = () => {
  const { user, accessToken } = useSecureAuth();
  const isAuthenticated = !!accessToken && !!user;
  const [unblockingIds, setUnblockingIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Query blocked accounts
  const { data: blockedData, loading, error, refetch } = useQuery(GET_BLOCKED_ACCOUNTS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    errorPolicy: 'all',
  });

  // Unblock mutation with immediate cache updates
  const [unblockUser] = useMutation(UNBLOCK_USER, {
    onCompleted: (data) => {
      console.log('✅ User unblocked successfully');
      
      // Remove from unblocking set
      setUnblockingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.UnblockUser.blockedprofileid);
        return newSet;
      });
    },
    onError: (error) => {
      console.error('❌ Error unblocking user:', error);
      alert('Failed to unblock user. Please try again.');
    },
    update: (cache, { data: { UnblockUser } }) => {
      try {
        // Update blocked accounts cache
        const existingData = cache.readQuery({
          query: GET_BLOCKED_ACCOUNTS,
          variables: { profileid: user?.profileid }
        });
        
        if (existingData) {
          cache.writeQuery({
            query: GET_BLOCKED_ACCOUNTS,
            variables: { profileid: user?.profileid },
            data: {
              getBlockedAccounts: existingData.getBlockedAccounts.filter(
                item => item.blockedprofileid !== UnblockUser.blockedprofileid
              )
            }
          });
        }

        // Refetch posts to show previously blocked user's content
        cache.evict({ fieldName: 'getPosts' });
        cache.gc();
        
        console.log('✅ Cache updated after unblock');
      } catch (err) {
        console.error('Cache update error:', err);
      }
    }
  });

  const handleUnblock = async (blockedProfileId) => {
    if (!user?.profileid) {
      alert('Please log in to unblock users.');
      return;
    }

    setUnblockingIds(prev => new Set([...prev, blockedProfileId]));
    
    try {
      await unblockUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: blockedProfileId
        }
      });
    } catch (error) {
      setUnblockingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockedProfileId);
        return newSet;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please log in to manage blocked accounts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Blocked Accounts</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 border rounded">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Blocked Accounts</h3>
        <div className="text-red-500 p-4 border border-red-200 rounded">
          <p>Error loading blocked accounts: {error.message}</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const blockedAccounts = blockedData?.getBlockedAccounts || [];
  
  const filteredAccounts = blockedAccounts.filter(account =>
    account.blockedProfile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.blockedProfile.name && account.blockedProfile.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Blocked Accounts</h3>
        <span className="text-sm text-gray-500">
          {blockedAccounts.length} blocked
        </span>
      </div>

      {blockedAccounts.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search blocked users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {filteredAccounts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {blockedAccounts.length === 0 ? (
            <>
              <p>No blocked accounts</p>
              <p className="text-sm mt-1">Users you block will appear here</p>
            </>
          ) : (
            <p>No blocked accounts match your search</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <div key={account.blockid} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {account.blockedProfile.profilePic ? (
                    <img 
                      src={account.blockedProfile.profilePic} 
                      alt={account.blockedProfile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-medium">
                      {account.blockedProfile.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{account.blockedProfile.name || account.blockedProfile.username}</p>
                  <p className="text-sm text-gray-500">@{account.blockedProfile.username}</p>
                  {account.reason && (
                    <p className="text-xs text-red-500 mt-1">Reason: {account.reason}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleUnblock(account.blockedProfile.profileid)}
                disabled={unblockingIds.has(account.blockedProfile.profileid)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {unblockingIds.has(account.blockedProfile.profileid) ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedAccountsEnhanced;
