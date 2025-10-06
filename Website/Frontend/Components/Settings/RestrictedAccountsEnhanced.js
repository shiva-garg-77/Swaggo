import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useSecureAuth } from '../../context/FixedSecureAuthContext';

const GET_RESTRICTED_ACCOUNTS = gql`
  query GetRestrictedAccounts($profileid: String!) {
    getRestrictedAccounts(profileid: $profileid) {
      restrictid
      restrictedprofileid
      createdAt
      restrictedProfile {
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

const UNRESTRICT_USER = gql`
  mutation UnrestrictUser($profileid: String!, $targetprofileid: String!) {
    UnrestrictUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      restrictid
      restrictedprofileid
    }
  }
`;

const RestrictedAccountsEnhanced = () => {
  const { user, accessToken } = useSecureAuth();
  const isAuthenticated = !!accessToken && !!user;
  const [unrestrictingIds, setUnrestrictingIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Query restricted accounts
  const { data: restrictedData, loading, error, refetch } = useQuery(GET_RESTRICTED_ACCOUNTS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    errorPolicy: 'all',
  });

  // Unrestrict mutation with immediate cache updates
  const [unrestrictUser] = useMutation(UNRESTRICT_USER, {
    onCompleted: (data) => {
      console.log('✅ User unrestricted successfully');
      
      // Remove from unrestricting set
      setUnrestrictingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.UnrestrictUser.restrictedprofileid);
        return newSet;
      });
    },
    onError: (error) => {
      console.error('❌ Error unrestricting user:', error);
      alert('Failed to unrestrict user. Please try again.');
    },
    update: (cache, { data: { UnrestrictUser } }) => {
      try {
        // Update restricted accounts cache
        const existingData = cache.readQuery({
          query: GET_RESTRICTED_ACCOUNTS,
          variables: { profileid: user?.profileid }
        });
        
        if (existingData) {
          cache.writeQuery({
            query: GET_RESTRICTED_ACCOUNTS,
            variables: { profileid: user?.profileid },
            data: {
              getRestrictedAccounts: existingData.getRestrictedAccounts.filter(
                item => item.restrictedprofileid !== UnrestrictUser.restrictedprofileid
              )
            }
          });
        }

        // Refresh posts cache to update any restriction-based filtering
        cache.evict({ fieldName: 'getPosts' });
        cache.gc();
        
        console.log('✅ Cache updated after unrestrict');
      } catch (err) {
        console.error('Cache update error:', err);
      }
    }
  });

  const handleUnrestrict = async (restrictedProfileId) => {
    if (!user?.profileid) {
      alert('Please log in to unrestrict users.');
      return;
    }

    setUnrestrictingIds(prev => new Set([...prev, restrictedProfileId]));
    
    try {
      await unrestrictUser({
        variables: {
          profileid: user.profileid,
          targetprofileid: restrictedProfileId
        }
      });
    } catch (error) {
      setUnrestrictingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(restrictedProfileId);
        return newSet;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please log in to manage restricted accounts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Restricted Accounts</h3>
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
        <h3 className="text-lg font-semibold mb-4">Restricted Accounts</h3>
        <div className="text-red-500 p-4 border border-red-200 rounded">
          <p>Error loading restricted accounts: {error.message}</p>
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

  const restrictedAccounts = restrictedData?.getRestrictedAccounts || [];
  
  const filteredAccounts = restrictedAccounts.filter(account =>
    account.restrictedProfile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.restrictedProfile.name && account.restrictedProfile.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Restricted Accounts</h3>
        <span className="text-sm text-gray-500">
          {restrictedAccounts.length} restricted
        </span>
      </div>

      {restrictedAccounts.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search restricted users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {filteredAccounts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {restrictedAccounts.length === 0 ? (
            <>
              <p>No restricted accounts</p>
              <p className="text-sm mt-1">Users you restrict will appear here</p>
              <p className="text-xs mt-2 text-gray-400">
                Restricted users can still see your posts but their interactions are limited
              </p>
            </>
          ) : (
            <p>No restricted accounts match your search</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <div key={account.restrictid} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {account.restrictedProfile.profilePic ? (
                    <img 
                      src={account.restrictedProfile.profilePic} 
                      alt={account.restrictedProfile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-medium">
                      {account.restrictedProfile.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{account.restrictedProfile.name || account.restrictedProfile.username}</p>
                  <p className="text-sm text-gray-500">@{account.restrictedProfile.username}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Limited interactions • Can't see your activity status
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnrestrict(account.restrictedProfile.profileid)}
                disabled={unrestrictingIds.has(account.restrictedProfile.profileid)}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {unrestrictingIds.has(account.restrictedProfile.profileid) ? 'Unrestricting...' : 'Unrestrict'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestrictedAccountsEnhanced;
