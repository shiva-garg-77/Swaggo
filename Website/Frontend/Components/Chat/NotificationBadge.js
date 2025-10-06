'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBadge({
  count = 0,
  maxCount = 99,
  onClick,
  onHover,
  theme = 'light',
  size = 'medium',
  position = 'fixed',
  className = '',
  showPulse = true,
  autoHide = false,
  hideDelay = 5000,
  style = {}
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const isDark = theme === 'dark';
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const hasCount = count > 0;

  // Trigger animation when count changes
  useEffect(() => {
    if (count > 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [count]);

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && hasCount) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, hasCount, hideDelay]);

  // Reset visibility when count changes
  useEffect(() => {
    if (hasCount) {
      setIsVisible(true);
    }
  }, [hasCount]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(count);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) {
      onHover(true, count);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onHover) {
      onHover(false, count);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-5 h-5 text-xs',
      font: 'text-xs',
      pulse: 'w-6 h-6'
    },
    medium: {
      container: 'w-6 h-6 text-xs',
      font: 'text-xs',
      pulse: 'w-8 h-8'
    },
    large: {
      container: 'w-8 h-8 text-sm',
      font: 'text-sm',
      pulse: 'w-10 h-10'
    }
  };

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  // Base positioning classes
  const positionClasses = position === 'fixed' 
    ? 'fixed top-4 right-4 z-40' 
    : 'absolute';

  if (!hasCount && !autoHide) return null;

  return (
    <AnimatePresence>
      {(isVisible && hasCount) && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: shouldAnimate ? [1, 1.2, 1] : 1,
            opacity: 1 
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: shouldAnimate ? 0.5 : 0.3,
            ease: "easeOut"
          }}
          className={`${positionClasses} ${className}`}
          style={style}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Pulse Animation Background */}
          {showPulse && (
            <motion.div
              animate={shouldAnimate ? {
                scale: [1, 1.5, 1],
                opacity: [0.6, 0, 0.6]
              } : {}}
              transition={{ 
                duration: 2,
                repeat: shouldAnimate ? 2 : 0,
                ease: "easeOut"
              }}
              className={`absolute inset-0 bg-red-400 rounded-full ${currentSize.pulse} -translate-x-1 -translate-y-1`}
            />
          )}

          {/* Main Badge */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`
              relative flex items-center justify-center rounded-full font-bold
              ${currentSize.container} ${currentSize.font}
              transition-all duration-200 cursor-pointer
              ${isDark 
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-900/50' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
              }
              ${isHovered ? 'ring-2 ring-red-300 ring-opacity-50' : ''}
            `}
            title={`${count} unread message${count !== 1 ? 's' : ''}`}
          >
            {/* Count Display */}
            <motion.span
              key={count}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="leading-none"
            >
              {displayCount}
            </motion.span>

            {/* Hover Effect Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-white/20 rounded-full"
            />

            {/* Shine Effect */}
            <motion.div
              animate={shouldAnimate ? {
                x: [-20, 20],
                opacity: [0, 1, 0]
              } : {}}
              transition={{ 
                duration: 0.6,
                delay: 0.1,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full transform -skew-x-12"
            />
          </motion.button>

          {/* Tooltip on Hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`
                  absolute -bottom-10 left-1/2 transform -translate-x-1/2 
                  px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                  ${isDark 
                    ? 'bg-gray-800 text-white border border-gray-700' 
                    : 'bg-gray-900 text-white'
                  }
                  shadow-lg z-50
                `}
              >
                {count === 1 ? '1 unread message' : `${count} unread messages`}
                
                {/* Tooltip Arrow */}
                <div className={`
                  absolute -top-1 left-1/2 transform -translate-x-1/2 
                  w-2 h-2 rotate-45
                  ${isDark ? 'bg-gray-800 border-l border-t border-gray-700' : 'bg-gray-900'}
                `} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Click Ripple Effect */}
          <AnimatePresence>
            {shouldAnimate && (
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-red-400 rounded-full pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Specialized variants for different use cases

export function FloatingNotificationBadge(props) {
  return (
    <NotificationBadge
      {...props}
      position="fixed"
      className="fixed top-4 right-4 z-40"
      showPulse={true}
      autoHide={false}
    />
  );
}

export function InlineNotificationBadge(props) {
  return (
    <NotificationBadge
      {...props}
      position="relative"
      className="ml-2"
      size="small"
      showPulse={false}
    />
  );
}

export function MenuNotificationBadge(props) {
  return (
    <NotificationBadge
      {...props}
      position="absolute"
      className="absolute -top-2 -right-2"
      size="small"
      showPulse={true}
    />
  );
}

// Hook for managing notification badge state
export function useNotificationBadge(initialCount = 0) {
  const [count, setCount] = useState(initialCount);
  const [isVisible, setIsVisible] = useState(false);

  const increment = (amount = 1) => {
    setCount(prev => prev + amount);
    setIsVisible(true);
  };

  const decrement = (amount = 1) => {
    setCount(prev => Math.max(0, prev - amount));
  };

  const reset = () => {
    setCount(0);
    setIsVisible(false);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const show = () => {
    setIsVisible(true);
  };

  useEffect(() => {
    setIsVisible(count > 0);
  }, [count]);

  return {
    count,
    isVisible,
    increment,
    decrement,
    reset,
    hide,
    show,
    setCount
  };
}