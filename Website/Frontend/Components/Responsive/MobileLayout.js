/**
 * @fileoverview Mobile-optimized layout components
 * @module Components/Responsive/MobileLayout
 */

import React, { useState, useEffect } from 'react';
import { useMobileDetection, useOrientation, useVirtualKeyboard } from '../../hooks/useMobileDetection';
import { useTheme } from '../Helper/ThemeProvider';

/**
 * Mobile navigation bar component
 * @param {Object} props - Component props
 * @param {Array} props.navigationItems - Navigation items
 * @param {string} props.activeItem - Active navigation item
 * @param {Function} props.onNavigate - Navigation handler
 */
export function MobileNavBar({ navigationItems = [], activeItem, onNavigate }) {
  const { isMobile } = useMobileDetection();
  const { theme } = useTheme();
  const isKeyboardVisible = useVirtualKeyboard();
  
  // Hide navbar when keyboard is visible on mobile
  if (!isMobile || isKeyboardVisible) {
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center py-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              activeItem === item.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="w-6 h-6 mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/**
 * Mobile header component with title and actions
 * @param {Object} props - Component props
 * @param {string} props.title - Header title
 * @param {React.ReactNode} props.leftAction - Left action button
 * @param {React.ReactNode} props.rightAction - Right action button
 * @param {boolean} props.showBorder - Whether to show bottom border
 */
export function MobileHeader({ 
  title, 
  leftAction, 
  rightAction, 
  showBorder = true,
  className = ''
}) {
  const { isMobile } = useMobileDetection();
  const { theme } = useTheme();
  
  if (!isMobile) {
    return null;
  }
  
  const headerClasses = `
    fixed top-0 left-0 right-0 
    bg-white/90 dark:bg-gray-800/90 
    backdrop-blur-md 
    z-40
    py-4 px-4
    ${showBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''}
    ${className}
  `.trim();
  
  return (
    <header className={headerClasses}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {leftAction}
        </div>
        
        <div className="flex-1 text-center px-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center">
          {rightAction}
        </div>
      </div>
    </header>
  );
}

/**
 * Mobile-friendly scroll container with optimized performance
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.bounce - Whether to allow bounce scrolling
 */
export function MobileScrollContainer({ 
  children, 
  className = '',
  bounce = false,
  ...props
}) {
  const { isMobile } = useMobileDetection();
  const orientation = useOrientation();
  
  const containerClasses = `
    overflow-y-auto
    ${isMobile ? '-webkit-overflow-scrolling: touch' : ''}
    ${bounce ? '' : 'overscroll-y-none'}
    ${className}
  `.trim();
  
  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
}

/**
 * Mobile-optimized modal component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.title - Modal title
 * @param {boolean} props.fullScreen - Whether to use full screen on mobile
 */
export function MobileModal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  fullScreen = false,
  className = ''
}) {
  const { isMobile } = useMobileDetection();
  const { theme } = useTheme();
  
  if (!isOpen) return null;
  
  // Full screen modal on mobile for better usability
  const modalClasses = `
    fixed inset-0 z-50 flex items-end justify-center
    ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'}
    ${fullScreen && isMobile ? 'items-center' : ''}
  `.trim();
  
  const contentClasses = `
    bg-white dark:bg-gray-800 rounded-t-xl
    w-full max-w-md
    max-h-[90vh]
    overflow-hidden
    transform transition-transform duration-300
    ${fullScreen && isMobile 
      ? 'rounded-xl mx-4 max-w-none max-h-none h-[90vh]' 
      : 'rounded-t-xl'
    }
    ${className}
  `.trim();
  
  return (
    <div className={modalClasses} onClick={onClose}>
      <div 
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile-optimized floating action button
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.position - Position ('bottom-right', 'bottom-left', 'center')
 * @param {string} props.className - Additional CSS classes
 */
export function MobileFab({ 
  children, 
  onClick, 
  position = 'bottom-right',
  className = ''
}) {
  const { isMobile } = useMobileDetection();
  const isKeyboardVisible = useVirtualKeyboard();
  
  // Hide FAB when keyboard is visible
  if (!isMobile || isKeyboardVisible) {
    return null;
  }
  
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'center': 'bottom-20 left-1/2 transform -translate-x-1/2'
  };
  
  const fabClasses = `
    fixed z-40
    ${positionClasses[position]}
    w-14 h-14
    rounded-full
    bg-indigo-600 hover:bg-indigo-700
    text-white
    shadow-lg
    flex items-center justify-center
    transition-all duration-200
    hover:scale-105
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    ${className}
  `.trim();
  
  return (
    <button className={fabClasses} onClick={onClick}>
      {children}
    </button>
  );
}