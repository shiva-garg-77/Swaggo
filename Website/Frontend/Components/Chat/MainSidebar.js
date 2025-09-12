'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_ACTIVE_STORIES } from './queries';

export default function MainSidebar({ user, onStoryClick }) {
  const router = useRouter();
  const [activeIcon, setActiveIcon] = useState('messages');

  // Fetch active stories
  const { data: storiesData } = useQuery(GET_ACTIVE_STORIES, {
    skip: !user?.profileid,
    onError: (error) => {
      console.error('Error fetching stories:', error);
    }
  });

  const navigationItems = [
    {
      id: 'home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/',
      label: 'Home'
    },
    {
      id: 'create',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      path: '/create',
      label: 'Create'
    },
    {
      id: 'messages',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      path: '/message',
      label: 'Messages',
      isActive: true
    },
    {
      id: 'profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      path: '/profile',
      label: 'Profile'
    },
    {
      id: 'real',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-4 8V4m-4 8V4m8 8V4m-4 8l4-4M7 12l4-4" />
        </svg>
      ),
      path: '/reels',
      label: 'Reels'
    },
    {
      id: 'bonus',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 109.5 8H12m-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12a2 2 0 104 0M19 12a2 2 0 11-4 0" />
        </svg>
      ),
      path: '/bonus',
      label: 'Bonus'
    },
    {
      id: 'games',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      path: '/games',
      label: 'Games'
    }
  ];

  const handleNavigation = (item) => {
    setActiveIcon(item.id);
    if (item.path !== router.pathname) {
      router.push(item.path);
    }
  };

  const stories = storiesData?.getActiveStories || [];

  return (
    <div className="h-full bg-white flex flex-col border-r border-gray-200">
      {/* Top Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">S</span>
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`w-16 h-16 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                item.id === activeIcon || item.isActive
                  ? 'bg-gradient-to-br from-pink-50 to-red-50 text-red-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={item.label}
            >
              <div className={`transition-transform group-hover:scale-110 ${
                item.id === activeIcon || item.isActive ? 'scale-105' : ''
              }`}>
                {item.icon}
              </div>
              
              {/* Active indicator */}
              {(item.id === activeIcon || item.isActive) && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Stories Section */}
      {stories.length > 0 && (
        <div className="px-2 pb-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 px-2 mb-2">Stories</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stories.slice(0, 5).map((story) => (
                <button
                  key={story.storyid}
                  onClick={() => onStoryClick(story)}
                  className="w-12 h-12 rounded-full border-2 border-gradient-to-br from-pink-500 to-red-500 p-0.5 hover:scale-105 transition-transform mx-auto block"
                >
                  <img
                    src={story.profile?.profilePic || '/default-avatar.png'}
                    alt={story.profile?.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Profile at Bottom */}
      <div className="border-t border-gray-200 p-4">
        <Link href="/profile" className="block">
          <div className="w-12 h-12 rounded-full border-2 border-transparent hover:border-red-200 transition-colors">
            <img
              src={user?.profilePic || '/default-avatar.png'}
              alt={user?.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </Link>
      </div>

      {/* Logout Button */}
      <div className="p-4 pt-0">
        <button
          onClick={() => {
            // Add logout functionality here
            localStorage.removeItem('token');
            router.push('/login');
          }}
          className="w-16 h-12 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          title="Logout"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
