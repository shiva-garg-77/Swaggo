/**
 * @fileoverview Responsive container components for mobile optimization
 * @module Components/Responsive/ResponsiveContainer
 */

import React from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

/**
 * Responsive container that adapts to different screen sizes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullWidth - Whether to use full width on mobile
 * @param {boolean} props.adaptivePadding - Whether to adjust padding based on screen size
 * @param {string} props.mobileClassName - Additional classes for mobile view
 * @param {string} props.tabletClassName - Additional classes for tablet view
 * @param {string} props.desktopClassName - Additional classes for desktop view
 * @param {string} props.role - ARIA role for accessibility
 * @param {string} props.ariaLabel - ARIA label for accessibility
 */
export function ResponsiveContainer({
  children,
  className = '',
  fullWidth = false,
  adaptivePadding = true,
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
  role,
  ariaLabel,
  ...props
}) {
  const { isMobile, isTablet, isDesktop } = useMobileDetection();
  
  // Base classes
  let containerClasses = 'container mx-auto';
  
  // Width classes
  if (fullWidth && isMobile) {
    containerClasses = 'w-full';
  }
  
  // Padding classes
  if (adaptivePadding) {
    if (isMobile) {
      containerClasses += ' px-4';
    } else if (isTablet) {
      containerClasses += ' px-6';
    } else {
      containerClasses += ' px-8';
    }
  }
  
  // Device-specific classes
  if (isMobile && mobileClassName) {
    containerClasses += ` ${mobileClassName}`;
  } else if (isTablet && tabletClassName) {
    containerClasses += ` ${tabletClassName}`;
  } else if (isDesktop && desktopClassName) {
    containerClasses += ` ${desktopClassName}`;
  }
  
  // Additional classes
  if (className) {
    containerClasses += ` ${className}`;
  }
  
  // Accessibility props
  const accessibilityProps = {};
  if (role) accessibilityProps.role = role;
  if (ariaLabel) accessibilityProps['aria-label'] = ariaLabel;
  
  return (
    <div className={containerClasses} {...accessibilityProps} {...props}>
      {children}
    </div>
  );
}

/**
 * Responsive grid container for flexible layouts
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {number} props.columns - Number of columns (will be responsive)
 * @param {number} props.gap - Gap between items
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.role - ARIA role for accessibility
 * @param {string} props.ariaLabel - ARIA label for accessibility
 */
export function ResponsiveGrid({
  children,
  columns = 1,
  gap = 4,
  className = '',
  role,
  ariaLabel,
  ...props
}) {
  const { isMobile, isTablet } = useMobileDetection();
  
  // Adjust columns based on screen size
  let responsiveColumns = columns;
  if (isMobile) {
    responsiveColumns = Math.min(columns, 1);
  } else if (isTablet) {
    responsiveColumns = Math.min(columns, 2);
  }
  
  const gridClasses = `
    grid 
    gap-${gap}
    ${responsiveColumns === 1 ? 'grid-cols-1' : ''}
    ${responsiveColumns === 2 ? 'grid-cols-2' : ''}
    ${responsiveColumns === 3 ? 'grid-cols-2 md:grid-cols-3' : ''}
    ${responsiveColumns >= 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : ''}
    ${className}
  `.trim();
  
  // Accessibility props
  const accessibilityProps = {};
  if (role) accessibilityProps.role = role;
  if (ariaLabel) accessibilityProps['aria-label'] = ariaLabel;
  
  return (
    <div className={gridClasses} {...accessibilityProps} {...props}>
      {children}
    </div>
  );
}

/**
 * Responsive card component with mobile optimization
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.mobileCompact - Whether to use compact design on mobile
 * @param {boolean} props.noShadow - Whether to remove shadow on mobile
 * @param {string} props.role - ARIA role for accessibility
 * @param {string} props.ariaLabel - ARIA label for accessibility
 */
export function ResponsiveCard({
  children,
  className = '',
  mobileCompact = false,
  noShadow = false,
  role,
  ariaLabel,
  ...props
}) {
  const { isMobile } = useMobileDetection();
  
  let cardClasses = 'bg-white dark:bg-gray-800 rounded-lg';
  
  // Shadow classes
  if (!noShadow) {
    cardClasses += isMobile ? ' shadow-sm' : ' shadow-md';
  }
  
  // Compact design on mobile
  if (mobileCompact && isMobile) {
    cardClasses += ' p-3';
  } else {
    cardClasses += ' p-6';
  }
  
  // Additional classes
  if (className) {
    cardClasses += ` ${className}`;
  }
  
  // Accessibility props
  const accessibilityProps = {};
  if (role) accessibilityProps.role = role;
  if (ariaLabel) accessibilityProps['aria-label'] = ariaLabel;
  
  return (
    <div className={cardClasses} {...accessibilityProps} {...props}>
      {children}
    </div>
  );
}

/**
 * Responsive button with mobile optimization
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullWidth - Whether button should be full width on mobile
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {string} props.ariaLabel - ARIA label for accessibility
 * @param {string} props.ariaDescribedBy - ID of element that describes the button
 */
export function ResponsiveButton({
  children,
  className = '',
  fullWidth = false,
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  ...props
}) {
  const { isMobile } = useMobileDetection();
  
  // Base classes
  let buttonClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes
  switch (size) {
    case 'sm':
      buttonClasses += ' text-xs px-2.5 py-1.5';
      break;
    case 'lg':
      buttonClasses += ' text-base px-6 py-3';
      break;
    default: // md
      buttonClasses += ' text-sm px-4 py-2';
  }
  
  // Full width on mobile
  if (fullWidth && isMobile) {
    buttonClasses += ' w-full';
  }
  
  // Additional classes
  if (className) {
    buttonClasses += ` ${className}`;
  }
  
  // Accessibility props
  const accessibilityProps = {};
  if (ariaLabel) accessibilityProps['aria-label'] = ariaLabel;
  if (ariaDescribedBy) accessibilityProps['aria-describedby'] = ariaDescribedBy;
  
  return (
    <button className={buttonClasses} {...accessibilityProps} {...props}>
      {children}
    </button>
  );
}

/**
 * Responsive input with mobile optimization
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullWidth - Whether input should be full width
 * @param {string} props.size - Input size ('sm', 'md', 'lg')
 * @param {string} props.label - Input label for accessibility
 * @param {string} props.id - Input ID for accessibility
 * @param {string} props.error - Error message for accessibility
 * @param {boolean} props.required - Whether input is required
 */
export function ResponsiveInput({
  className = '',
  fullWidth = true,
  size = 'md',
  label,
  id,
  error,
  required = false,
  ...props
}) {
  const { isMobile } = useMobileDetection();
  
  // Base classes
  let inputClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400';
  
  // Size classes
  switch (size) {
    case 'sm':
      inputClasses += ' text-xs px-2 py-1';
      break;
    case 'lg':
      inputClasses += ' text-base px-4 py-3';
      break;
    default: // md
      inputClasses += ' text-sm px-3 py-2';
  }
  
  // Full width
  if (fullWidth) {
    inputClasses += ' w-full';
  }
  
  // Mobile-specific adjustments
  if (isMobile) {
    inputClasses += ' text-base'; // Larger text on mobile for better usability
  }
  
  // Additional classes
  if (className) {
    inputClasses += ` ${className}`;
  }
  
  // Accessibility props
  const accessibilityProps = {
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-error` : undefined,
    'aria-required': required
  };
  
  if (id) accessibilityProps.id = id;
  
  return (
    <>
      {label && (
        <label 
          htmlFor={id} 
          className={`block text-sm font-medium ${
            error ? 'text-red-700 dark:text-red-500' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {label}
          {required && <span className="text-red-500" aria-label="required">*</span>}
        </label>
      )}
      <input 
        className={inputClasses} 
        {...accessibilityProps} 
        {...props} 
      />
      {error && (
        <p 
          id={error ? `${id}-error` : undefined} 
          className="mt-1 text-sm text-red-600 dark:text-red-500" 
          role="alert"
        >
          {error}
        </p>
      )}
    </>
  );
}