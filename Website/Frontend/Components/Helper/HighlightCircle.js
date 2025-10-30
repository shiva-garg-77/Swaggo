'use client';

import { useState } from 'react';
import { Edit3 } from 'lucide-react';

/**
 * Highlight Circle Component
 * Reusable circular highlight thumbnail
 */
export default function HighlightCircle({
  highlight,
  onClick,
  onLongPress,
  isOwner = false,
  theme = 'light',
  size = 'md'
}) {
  const [showEditIcon, setShowEditIcon] = useState(false);
  const [pressTimer, setPressTimer] = useState(null);

  const isDark = theme === 'dark';

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const handleMouseDown = () => {
    if (isOwner && onLongPress) {
      const timer = setTimeout(() => {
        onLongPress(highlight);
      }, 500);
      setPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (!pressTimer && onClick) {
      onClick(highlight);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative group cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onClick={handleClick}
        onMouseEnter={() => isOwner && setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        {/* Highlight Circle */}
        <div className={`${sizes[size]} rounded-full overflow-hidden border-2 transition-all ${
          isDark
            ? 'border-gray-600 group-hover:border-gray-500'
            : 'border-gray-300 group-hover:border-gray-400'
        }`}>
          {highlight.coverImage ? (
            <img
              src={highlight.coverImage}
              alt={highlight.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              isDark
                ? 'bg-gradient-to-br from-purple-900 to-blue-900'
                : 'bg-gradient-to-br from-purple-400 to-blue-500'
            }`}>
              <span className="text-white text-xl font-bold">
                {highlight.title?.charAt(0)?.toUpperCase() || 'H'}
              </span>
            </div>
          )}
        </div>

        {/* Story Count Badge */}
        {highlight.storyCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {highlight.storyCount}
          </div>
        )}

        {/* Edit Icon (Owner Only) */}
        {isOwner && showEditIcon && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Title */}
      <p className={`text-xs text-center max-w-[80px] truncate ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {highlight.title}
      </p>
    </div>
  );
}
