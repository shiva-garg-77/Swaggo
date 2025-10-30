'use client';

/**
 * Notification Badge Component
 * Reusable badge for showing notification counts
 */
export default function NotificationBadge({ 
  count = 0, 
  size = 'md',
  position = 'top-right',
  showZero = false,
  maxCount = 99,
  color = 'red'
}) {
  if (!showZero && count === 0) return null;

  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  const positionClasses = {
    'top-right': 'absolute -top-1 -right-1',
    'top-left': 'absolute -top-1 -left-1',
    'bottom-right': 'absolute -bottom-1 -right-1',
    'bottom-left': 'absolute -bottom-1 -left-1',
    'inline': 'relative'
  };

  const colorClasses = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <div 
      className={`${sizeClasses[size]} ${positionClasses[position]} ${colorClasses[color]} 
                  text-white rounded-full flex items-center justify-center font-bold 
                  shadow-lg border-2 border-white dark:border-gray-900 z-10`}
    >
      {displayCount}
    </div>
  );
}
