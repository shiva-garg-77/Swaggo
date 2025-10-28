"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_MENTIONS_BY_CONTEXT } from '../../lib/graphql/profileQueries';
import { AtSign, User } from 'lucide-react';

/**
 * Component to display mentions for a specific post or comment
 * Shows who has been mentioned in the content
 */
export default function MentionsViewer({ 
  contextType, 
  contextId, 
  theme = 'light',
  compact = false 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, loading, error } = useQuery(GET_MENTIONS_BY_CONTEXT, {
    variables: { contexttype: contextType, contextid: contextId },
    skip: !contextType || !contextId,
    errorPolicy: 'all'
  });

  const mentions = data?.getMentionsByContext || [];

  if (loading && !data) {
    return compact ? null : (
      <div className={`flex items-center space-x-2 text-sm ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <AtSign className="w-4 h-4 animate-pulse" />
        <span>Loading mentions...</span>
      </div>
    );
  }

  if (error) {
    console.error('Error loading mentions:', error);
    return null;
  }

  if (mentions.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-1 text-xs ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <AtSign className="w-3 h-3" />
        <span>{mentions.length} mention{mentions.length !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between w-full text-sm font-medium ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        <div className="flex items-center space-x-2">
          <AtSign className="w-4 h-4" />
          <span>
            {mentions.length} {mentions.length === 1 ? 'person' : 'people'} mentioned
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {mentions.map((mention) => (
            <div
              key={mention.mentionid}
              className={`flex items-center space-x-3 p-2 rounded hover:bg-opacity-50 transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <img
                src={mention.mentionedProfile?.profilePic || '/default-profile.svg'}
                alt={mention.mentionedProfile?.username}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/default-profile.svg';
                }}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <p className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    @{mention.mentionedProfile?.username}
                  </p>
                  {mention.mentionedProfile?.isVerified && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {mention.mentionedProfile?.name && (
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {mention.mentionedProfile.name}
                  </p>
                )}
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {!mention.isread && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
