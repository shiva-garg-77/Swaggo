/**
 * BADGE COUNT COMPONENT
 * Solves: 7.1 - Notification Badge Count
 */

'use client';

import React from 'react';

export default function BadgeCount({
  count = 0,
  max = 99,
  showZero = false,
  size = 'md', // 'sm', 'md', 'lg'
  color = 'red', // 'red', 'blue', 'green', 'yellow'
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  className = '',
  pulse = false
}) {
  if (count === 0 && !showZero) return null;
  
  const displayCount = count > max ? `${max}+` : count;
  
  const sizeStyles = {
    sm: 'h-4 w-4 text-[10px] min-w-[16px]',
    md: 'h-5 w-5 text-xs min-w-[20px]',
    lg: 'h-6 w-6 text-sm min-w-[24px]'
  };
  
  const colorStyles = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black'
  };
  
  const positionStyles = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };
  
  return (
    <span
      className={`
        absolute ${positionStyles[position]}
        ${sizeStyles[size]}
        ${colorStyles[color]}
        ${pulse ? 'animate-pulse' : ''}
        flex items-center justify-center
        rounded-full
        font-bold
        border-2 border-white dark:border-gray-900
        shadow-sm
        ${className}
      `}
      aria-label={`${count} notifications`}
    >
      {displayCount}
    </span>
  );
}

/**
 * Badge with dot indicator (no count)
 */
export function BadgeDot({
  show = true,
  size = 'md',
  color = 'red',
  position = 'top-right',
  pulse = true,
  className = ''
}) {
  if (!show) return null;
  
  const sizeStyles = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };
  
  const colorStyles = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
  };
  
  const positionStyles = {
    'top-right': '-top-0.5 -right-0.5',
    'top-left': '-top-0.5 -left-0.5',
    'bottom-right': '-bottom-0.5 -right-0.5',
    'bottom-left': '-bottom-0.5 -left-0.5'
  };
  
  return (
    <span
      className={`
        absolute ${positionStyles[position]}
        ${sizeStyles[size]}
        ${colorStyles[color]}
        ${pulse ? 'animate-pulse' : ''}
        rounded-full
        border-2 border-white dark:border-gray-900
        ${className}
      `}
      aria-label="New notification"
    />
  );
}
