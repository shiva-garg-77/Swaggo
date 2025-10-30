'use client';

import { useFollowRequestStore } from '../../store/followRequestStore';

/**
 * Follow Request Badge Component
 * Shows unread follow request count
 */
export default function FollowRequestBadge({ className = '' }) {
  const { unreadCount } = useFollowRequestStore();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className={`
      inline-flex items-center justify-center
      min-w-[20px] h-5 px-1.5
      bg-red-500 text-white text-xs font-bold rounded-full
      ${className}
    `}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
