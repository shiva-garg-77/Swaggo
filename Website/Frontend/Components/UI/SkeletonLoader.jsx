/**
 * SKELETON LOADER COMPONENT
 * Reusable skeleton loaders for different content types
 */

'use client';

import React from 'react';

export function Skeleton({ className = '', width, height, circle = false, count = 1 }) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${
        circle ? 'rounded-full' : 'rounded'
      } ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        marginBottom: count > 1 && i < count - 1 ? '0.5rem' : 0
      }}
    />
  ));
  
  return count === 1 ? skeletons[0] : <div>{skeletons}</div>;
}

export function SkeletonPost() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Skeleton circle width="40px" height="40px" />
        <div className="ml-3 flex-1">
          <Skeleton width="120px" height="14px" />
          <Skeleton width="80px" height="12px" className="mt-1" />
        </div>
      </div>
      
      {/* Image */}
      <Skeleton height="300px" className="mb-4" />
      
      {/* Actions */}
      <div className="flex space-x-4 mb-4">
        <Skeleton width="24px" height="24px" />
        <Skeleton width="24px" height="24px" />
        <Skeleton width="24px" height="24px" />
      </div>
      
      {/* Caption */}
      <Skeleton count={2} />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Profile Header */}
      <div className="flex items-center mb-6">
        <Skeleton circle width="80px" height="80px" />
        <div className="ml-6 flex-1">
          <Skeleton width="150px" height="20px" className="mb-2" />
          <Skeleton width="200px" height="14px" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex space-x-8 mb-6">
        <Skeleton width="60px" height="16px" />
        <Skeleton width="60px" height="16px" />
        <Skeleton width="60px" height="16px" />
      </div>
      
      {/* Bio */}
      <Skeleton count={3} />
    </div>
  );
}

export function SkeletonComment() {
  return (
    <div className="flex mb-4">
      <Skeleton circle width="32px" height="32px" />
      <div className="ml-3 flex-1">
        <Skeleton width="100px" height="12px" className="mb-2" />
        <Skeleton count={2} />
      </div>
    </div>
  );
}

export function SkeletonNotification() {
  return (
    <div className="flex items-center p-3 mb-2">
      <Skeleton circle width="40px" height="40px" />
      <div className="ml-3 flex-1">
        <Skeleton width="200px" height="14px" className="mb-1" />
        <Skeleton width="80px" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 9 }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height="200px" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton circle width="48px" height="48px" />
          <div className="ml-4 flex-1">
            <Skeleton width="150px" height="16px" className="mb-2" />
            <Skeleton width="200px" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <Skeleton height="150px" className="mb-4" />
      <Skeleton width="80%" height="18px" className="mb-2" />
      <Skeleton count={2} />
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return <Skeleton count={lines} />;
}

export function SkeletonAvatar({ size = '40px' }) {
  return <Skeleton circle width={size} height={size} />;
}

export function SkeletonButton({ width = '100px' }) {
  return <Skeleton width={width} height="36px" className="rounded-full" />;
}
