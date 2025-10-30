'use client';

import { Bell, Heart, MessageCircle, AtSign, UserPlus, Filter } from 'lucide-react';

/**
 * Notification Filters Component
 * Filter tabs for different notification types
 */
export default function NotificationFilters({ 
  activeFilter, 
  onFilterChange, 
  counts = {},
  theme = 'light' 
}) {
  const isDark = theme === 'dark';

  const filters = [
    {
      id: 'all',
      label: 'All',
      icon: Bell,
      count: counts.all || 0
    },
    {
      id: 'likes',
      label: 'Likes',
      icon: Heart,
      count: counts.likes || 0
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: MessageCircle,
      count: counts.comments || 0
    },
    {
      id: 'mentions',
      label: 'Mentions',
      icon: AtSign,
      count: counts.mentions || 0
    },
    {
      id: 'follows',
      label: 'Follows',
      icon: UserPlus,
      count: counts.follows || 0
    }
  ];

  return (
    <div className={`flex items-center gap-2 overflow-x-auto scrollbar-hide p-2 ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{filter.label}</span>
            {filter.count > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                isActive
                  ? 'bg-white/20 text-white'
                  : isDark
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {filter.count > 99 ? '99+' : filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
