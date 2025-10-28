"use client";

import { useState, useRef, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_USERS } from '../../lib/graphql/queries';
import { getMentionSuggestionState } from '../../utils/mentionParser';

/**
 * Enhanced input component with mention autocomplete
 * Detects @mentions and shows user suggestions
 */
export default function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write a comment...',
  className = '',
  theme = 'light',
  maxLength = 500,
  disabled = false,
  autoFocus = false
}) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Search users query
  const [searchUsers, { data: searchData, loading: searchLoading }] = useLazyQuery(SEARCH_USERS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });

  // Track cursor position
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);
  };

  // Handle key events
  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  // Insert selected mention
  const insertMention = (user) => {
    const mentionState = getMentionSuggestionState(value, cursorPosition);
    if (!mentionState.isActive) return;

    const beforeMention = value.substring(0, mentionState.startPos);
    const afterMention = value.substring(cursorPosition);
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(0);
    
    // Set cursor position after mention
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = mentionState.startPos + user.username.length + 2;
        inputRef.current.setSelectionRange(newPos, newPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  // Check for mention trigger and search
  useEffect(() => {
    const mentionState = getMentionSuggestionState(value, cursorPosition);
    
    if (mentionState.isActive && mentionState.query.length >= 1) {
      // Search for users
      searchUsers({
        variables: {
          query: mentionState.query,
          limit: 5
        }
      });
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, cursorPosition, searchUsers]);

  // Update suggestions from search results
  useEffect(() => {
    if (searchData?.searchUsers) {
      setSuggestions(searchData.searchUsers);
      setSelectedIndex(0);
    }
  }, [searchData]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursorPosition(e.target.selectionStart)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={3}
        className={`w-full px-4 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } ${className}`}
      />
      
      {/* Character count */}
      {maxLength && (
        <div className={`absolute bottom-2 right-2 text-xs ${
          value.length > maxLength * 0.9
            ? 'text-red-500'
            : theme === 'dark'
            ? 'text-gray-500'
            : 'text-gray-400'
        }`}>
          {value.length}/{maxLength}
        </div>
      )}

      {/* Mention suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className={`absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          {searchLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className={`p-4 text-center text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No users found
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.profileid}
                onClick={() => insertMention(user)}
                className={`w-full px-4 py-2 flex items-center space-x-3 hover:bg-opacity-10 hover:bg-blue-500 transition-colors ${
                  index === selectedIndex
                    ? theme === 'dark'
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                    : ''
                }`}
              >
                <img
                  src={user.profilePic || '/default-profile.svg'}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-profile.svg';
                  }}
                />
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-1">
                    <p className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user.username}
                    </p>
                    {user.isVerified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {user.name && (
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {user.name}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
