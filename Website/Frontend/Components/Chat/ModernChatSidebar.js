'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ModernChatSidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();

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
      id: 'search',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      path: '/search',
      label: 'Search'
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
      label: 'Messages'
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
    }
  ];

  const handleNavigation = (item) => {
    if (item.path !== pathname) {
      router.push(item.path);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col border-r border-gray-200">
      {/* Top Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path || 
              (item.id === 'messages' && pathname.startsWith('/message'));
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-br from-pink-50 to-red-50 text-red-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={item.label}
              >
                <div className={`transition-transform group-hover:scale-110 ${
                  isActive ? 'scale-105' : ''
                }`}>
                  {item.icon}
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile at Bottom */}
      <div className="border-t border-gray-100 p-4">
        <button 
          onClick={() => router.push('/profile')}
          className="w-12 h-12 rounded-full border-2 border-transparent hover:border-red-200 transition-colors overflow-hidden"
        >
          <img
            src={user?.profilePic || '/default-avatar.png'}
            alt={user?.username}
            className="w-full h-full rounded-full object-cover"
          />
        </button>
      </div>
    </div>
  );
}
