/**
 * EMPTY STATE COMPONENT
 * Solves: 6.9 - Memory Section Empty State
 */

'use client';

import React from 'react';

export default function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description = 'Get started by creating something new',
  actionLabel,
  onAction,
  size = 'md', // 'sm', 'md', 'lg'
  className = ''
}) {
  const sizeStyles = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl',
      title: 'text-base',
      description: 'text-sm'
    },
    md: {
      container: 'py-12',
      icon: 'text-6xl',
      title: 'text-lg',
      description: 'text-base'
    },
    lg: {
      container: 'py-16',
      icon: 'text-8xl',
      title: 'text-xl',
      description: 'text-lg'
    }
  };
  
  const style = sizeStyles[size];
  
  return (
    <div className={`flex flex-col items-center justify-center text-center ${style.container} ${className}`}>
      {/* Icon */}
      <div className={`${style.icon} mb-4 opacity-50`} aria-hidden="true">
        {icon}
      </div>
      
      {/* Title */}
      <h3 className={`${style.title} font-semibold text-gray-900 dark:text-white mb-2`}>
        {title}
      </h3>
      
      {/* Description */}
      <p className={`${style.description} text-gray-600 dark:text-gray-400 max-w-sm mb-6`}>
        {description}
      </p>
      
      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Predefined empty states
 */
export function EmptyPosts() {
  return (
    <EmptyState
      icon="📸"
      title="No posts yet"
      description="Share your first photo or video to get started"
      actionLabel="Create Post"
    />
  );
}

export function EmptyMemories() {
  return (
    <EmptyState
      icon="🎬"
      title="No memories yet"
      description="Create your first memory to share special moments"
      actionLabel="Create Memory"
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="🔔"
      title="No notifications"
      description="You're all caught up! Check back later for updates"
      size="sm"
    />
  );
}

export function EmptyFollowers() {
  return (
    <EmptyState
      icon="👥"
      title="No followers yet"
      description="Share great content to attract followers"
      size="sm"
    />
  );
}

export function EmptySavedPosts() {
  return (
    <EmptyState
      icon="🔖"
      title="No saved posts"
      description="Save posts you want to see again later"
      size="sm"
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description="Try adjusting your search or filters"
      size="sm"
    />
  );
}
