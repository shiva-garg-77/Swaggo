'use client';
import { useState, useEffect, useRef } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { useTheme } from '../Helper/ThemeProvider';
import { useRouter } from 'next/navigation';
import { SEARCH_USERS } from '../../lib/graphql/queries';

export default function UserSearch({
  onUserSelect,
  placeholder = 'Search users...',
}) {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchUsers, { data, loading, error }] = useLazyQuery(SEARCH_USERS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        console.log('Searching for:', searchTerm.trim());
        searchUsers({
          variables: {
            query: searchTerm.trim(),
            limit: 10,
          },
        })
          .then(result => {
            console.log('Search result:', result);
          })
          .catch(err => {
            console.error('Search error:', err);
          });
        setIsOpen(true);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm, searchUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = user => {
    setSearchTerm(user.username);
    setIsOpen(false);

    console.log(
      '🔄 Navigating to profile of user:',
      user.username,
      user.profileid
    );

    // Navigate to the user's profile page using username
    router.push(`/Profile?user=${user.username}`);

    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const handleInputChange = e => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (data?.searchUsers?.length > 0 && searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const users = data?.searchUsers || [];
  console.log('Users data:', users);
  // Create a copy before sorting (Apollo data is read-only)
  const prioritizedUsers = [...users].sort((a, b) => {
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    return 0;
  });
  console.log('Prioritized users:', prioritizedUsers);

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-2 pl-10 pr-4 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />

        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg
            className={`w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-lg shadow-lg border z-50 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
              <p
                className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Searching...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <p
                className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}
              >
                Failed to search users
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            prioritizedUsers.length === 0 &&
            searchTerm.length >= 2 && (
              <div className="p-4 text-center">
                <p
                  className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  No users found for "{searchTerm}"
                </p>
              </div>
            )}

          {!loading && prioritizedUsers.length > 0 && (
            <div className="py-2">
              {prioritizedUsers.map(user => (
                <div
                  key={user.profileid}
                  onClick={() => handleUserClick(user)}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 hover:${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {user.profilePic ? (
                        <img
                          src={user.profilePic}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={e => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {user.username[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Online status indicator */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p
                          className={`font-bold truncate ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          @{user.username}
                        </p>
                        {user.isVerified && (
                          <svg
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p
                        className={`text-sm truncate font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {user.name || 'No name'}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        ID: {user.profileid}
                      </p>
                      {user.bio && (
                        <p
                          className={`text-xs truncate mt-1 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
                          {user.bio.length > 50
                            ? user.bio.substring(0, 50) + '...'
                            : user.bio}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col space-y-1">
                      <p
                        className={`text-xs font-semibold ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {user.followersCount || 0} followers
                      </p>
                      <p
                        className={`text-xs ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}
                      >
                        {user.postsCount || 0} posts
                      </p>
                      {/* Quick action indicator */}
                      <div className="flex items-center justify-end">
                        <span className="text-xs text-red-500 font-medium">
                          View Profile
                        </span>
                        <svg
                          className="w-3 h-3 text-red-500 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
