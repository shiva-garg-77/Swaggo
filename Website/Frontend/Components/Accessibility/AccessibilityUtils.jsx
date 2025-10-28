/**
 * @fileoverview Enhanced accessibility utilities for WCAG 2.1 AA compliance
 * @module Components/Accessibility/AccessibilityUtils
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useScreenReader, useFocusTrap, useScreenReaderDetection, useSkipNavigation } from '../../hooks/useAccessibility';
import { useKeyboardShortcuts as useServiceKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

/**
 * Accessibility context for managing global accessibility state
 */
const AccessibilityContext = createContext();

/**
 * Provider for accessibility context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AccessibilityProvider = ({ children }) => {
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const isScreenReaderActive = useScreenReaderDetection();
  const announce = useScreenReader();
  
  // Track keyboard navigation
  useEffect(() => {
    let keyboardUsed = false;
    
    const handleKeydown = (e) => {
      // Defensive check to ensure e.key exists before calling startsWith
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || (e.key && e.key.startsWith('Arrow'))) {
        keyboardUsed = true;
        setIsKeyboardNavigation(true);
        
        // Add visual focus indicators
        if (document.body) {
          document.body.classList.add('keyboard-navigation');
          document.body.classList.remove('mouse-navigation');
        }
      }
    };
    
    const handleMousedown = () => {
      if (keyboardUsed) {
        setIsKeyboardNavigation(false);
        keyboardUsed = false;
        
        // Remove visual focus indicators
        if (document.body) {
          document.body.classList.remove('keyboard-navigation');
          document.body.classList.add('mouse-navigation');
        }
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleMousedown);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mousedown', handleMousedown);
    };
  }, []);
  
  const contextValue = {
    isKeyboardNavigation,
    isScreenReaderActive,
    announce
  };
  
  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook for accessing accessibility context
 * @returns {Object} Accessibility context values
 */
export const useAccessibilityUtils = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityUtils must be used within an AccessibilityProvider');
  }
  return context;
};

/**
 * Accessible button component with proper ARIA attributes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.ariaLabel - ARIA label for screen readers
 * @param {string} props.ariaDescribedBy - ID of element that describes the button
 * @param {string} props.keyboardShortcut - Keyboard shortcut for the button
 */
export const AccessibleButton = React.forwardRef(({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  keyboardShortcut,
  className = '',
  ...props
}, ref) => {
  const { announce } = useAccessibilityUtils();
  const { registerShortcut, unregisterShortcut } = useServiceKeyboardShortcuts();
  
  const handleClick = useCallback((event) => {
    if (disabled) return;
    onClick?.(event);
    
    // Announce action to screen readers
    if (ariaLabel) {
      announce(`${ariaLabel} activated`, 'assertive');
    }
  }, [disabled, onClick, ariaLabel, announce]);
  
  // Register keyboard shortcut
  useEffect(() => {
    if (keyboardShortcut && onClick) {
      registerShortcut(keyboardShortcut, 'button_click', ariaLabel, handleClick);
      return () => unregisterShortcut(keyboardShortcut);
    }
  }, [keyboardShortcut, onClick, handleClick, ariaLabel, registerShortcut, unregisterShortcut]);
  
  const buttonClasses = `focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
  } ${className}`;
  
  return (
    <button
      ref={ref}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      className={buttonClasses}
      {...props}
    >
      {children}
      {keyboardShortcut && (
        <span className="sr-only">
          {` (Keyboard shortcut: ${keyboardShortcut})`}
        </span>
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

/**
 * Accessible input component with proper labeling
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.id - Input ID (required for accessibility)
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether input is required
 */
export const AccessibleInput = React.forwardRef(({
  label,
  id,
  error,
  required = false,
  className = '',
  ...props
}, ref) => {
  const { announce } = useAccessibilityUtils();
  const errorId = error ? `${id}-error` : undefined;
  
  const inputClasses = `block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
    error ? 'border-red-500' : ''
  } ${className}`;
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium ${
          error ? 'text-red-700 dark:text-red-500' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
        {required && <span className="text-red-500" aria-label="required">*</span>}
      </label>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

/**
 * Skip navigation component for keyboard users
 * @param {Object} props - Component props
 * @param {Array} props.links - Array of skip links
 */
export const SkipNavigation = ({ 
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' }
  ]
}) => {
  return (
    <div className="skip-navigation">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

/**
 * ARIA live region for dynamic content announcements
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the live region
 * @param {string} props.politeness - ARIA live politeness setting ('polite' or 'assertive')
 * @param {React.ReactNode} props.children - Content to announce
 */
export const LiveRegion = ({ 
  id,
  politeness = 'polite',
  children 
}) => {
  return (
    <div
      id={id}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
};