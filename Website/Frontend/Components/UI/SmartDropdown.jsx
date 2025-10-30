/**
 * SMART DROPDOWN COMPONENT
 * Solves: 7.2 - Notification Dropdown Positioning, 5.22 - Post Actions Menu
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function SmartDropdown({
  isOpen,
  onClose,
  trigger,
  children,
  position = 'auto', // 'auto', 'bottom', 'top', 'left', 'right'
  align = 'start', // 'start', 'center', 'end'
  offset = 8,
  className = '',
  maxHeight = 400
}) {
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const [computedPosition, setComputedPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState('bottom');
  
  // Calculate optimal position
  useEffect(() => {
    if (!isOpen || !dropdownRef.current || !triggerRef.current) return;
    
    const dropdown = dropdownRef.current;
    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let top = 0;
    let left = 0;
    let finalPlacement = position;
    
    // Auto-detect best position
    if (position === 'auto') {
      const spaceBelow = viewport.height - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const spaceRight = viewport.width - triggerRect.right;
      const spaceLeft = triggerRect.left;
      
      // Prefer bottom, but use top if not enough space
      if (spaceBelow >= dropdownRect.height || spaceBelow > spaceAbove) {
        finalPlacement = 'bottom';
      } else {
        finalPlacement = 'top';
      }
      
      // Check horizontal space
      if (spaceRight < dropdownRect.width && spaceLeft > spaceRight) {
        align = 'end';
      }
    }
    
    // Calculate position based on placement
    switch (finalPlacement) {
      case 'bottom':
        top = triggerRect.bottom + offset;
        break;
      case 'top':
        top = triggerRect.top - dropdownRect.height - offset;
        break;
      case 'left':
        left = triggerRect.left - dropdownRect.width - offset;
        top = triggerRect.top;
        break;
      case 'right':
        left = triggerRect.right + offset;
        top = triggerRect.top;
        break;
    }
    
    // Calculate horizontal alignment
    if (finalPlacement === 'bottom' || finalPlacement === 'top') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + (triggerRect.width - dropdownRect.width) / 2;
          break;
        case 'end':
          left = triggerRect.right - dropdownRect.width;
          break;
      }
    }
    
    // Ensure dropdown stays within viewport
    if (left + dropdownRect.width > viewport.width) {
      left = viewport.width - dropdownRect.width - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + dropdownRect.height > viewport.height) {
      top = viewport.height - dropdownRect.height - 8;
    }
    if (top < 8) {
      top = 8;
    }
    
    setComputedPosition({ top, left });
    setPlacement(finalPlacement);
  }, [isOpen, position, align, offset]);
  
  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  return (
    <>
      {/* Trigger */}
      <div ref={triggerRef} onClick={() => !isOpen && onClose()}>
        {trigger}
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
          style={{
            top: `${computedPosition.top}px`,
            left: `${computedPosition.left}px`,
            maxHeight: `${maxHeight}px`,
            overflowY: 'auto'
          }}
          role="menu"
          aria-orientation="vertical"
        >
          {children}
        </div>
      )}
    </>
  );
}

/**
 * Dropdown Item Component
 */
export function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
  disabled = false,
  className = ''
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
        transition-colors
        ${danger 
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      role="menuitem"
    >
      {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

/**
 * Dropdown Divider
 */
export function DropdownDivider() {
  return <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" role="separator" />;
}
