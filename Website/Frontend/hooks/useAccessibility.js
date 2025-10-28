/**
 * @fileoverview Accessibility hooks for WCAG 2.1 AA compliance
 * @module hooks/useAccessibility
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for managing focus traps for modals, dialogs, etc.
 * @param {boolean} isActive - Whether the focus trap is active
 * @returns {Object} Focus trap utilities
 */
export const useFocusTrap = (isActive) => {
  const trapRef = useRef(null);
  const [firstFocusable, setFirstFocusable] = useState(null);
  const [lastFocusable, setLastFocusable] = useState(null);

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container) => {
    if (!container) return [];
    
    const focusableSelectors = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]:not([tabindex="-1"])'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        return el.offsetWidth > 0 && 
               el.offsetHeight > 0 && 
               !el.hasAttribute('hidden') &&
               window.getComputedStyle(el).display !== 'none' &&
               window.getComputedStyle(el).visibility !== 'hidden';
      });
  }, []);

  // Update focusable elements when trap is active
  useEffect(() => {
    if (!isActive || !trapRef.current) return;

    const focusableElements = getFocusableElements(trapRef.current);
    if (focusableElements.length > 0) {
      setFirstFocusable(focusableElements[0]);
      setLastFocusable(focusableElements[focusableElements.length - 1]);
      // Focus the first element
      focusableElements[0].focus();
    }
  }, [isActive, getFocusableElements]);

  // Handle keyboard navigation within trap
  useEffect(() => {
    if (!isActive || !trapRef.current) return;

    const handleKeydown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isActive, firstFocusable, lastFocusable]);

  return { trapRef };
};

/**
 * Hook for screen reader announcements using ARIA live regions
 * @returns {Function} Announce function
 */
export const useScreenReader = () => {
  const announce = useCallback((message, priority = 'polite') => {
    if (typeof document === 'undefined') return;

    // Create or get existing live region
    let liveRegion = document.getElementById(`sr-announcement-${priority}`);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = `sr-announcement-${priority}`;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Clear and set new message
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }, []);

  return announce;
};

/**
 * Hook for managing keyboard shortcuts
 * @returns {Object} Keyboard shortcut utilities
 */
export const useKeyboardShortcuts = () => {
  const shortcuts = useRef(new Map());

  const registerShortcut = useCallback((keyCombo, callback, description = '') => {
    shortcuts.current.set(keyCombo, { callback, description });
  }, []);

  const unregisterShortcut = useCallback((keyCombo) => {
    shortcuts.current.delete(keyCombo);
  }, []);

  useEffect(() => {
    const handleKeydown = (e) => {
      // Generate key combination string
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Meta');
      
      const key = e.key === ' ' ? 'Space' : e.key;
      const keyCombo = [...modifiers, key].join('+');
      
      const shortcut = shortcuts.current.get(keyCombo);
      if (shortcut) {
        e.preventDefault();
        shortcut.callback(e);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return { registerShortcut, unregisterShortcut };
};

/**
 * Hook for detecting screen reader usage
 * @returns {boolean} Whether a screen reader is detected
 */
export const useScreenReaderDetection = () => {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    // Check for screen reader indicators
    const checkScreenReader = () => {
      const indicators = {
        userAgent: /NVDA|JAWS|VoiceOver|TalkBack|Dragon/.test(navigator.userAgent),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        speechSynthesis: 'speechSynthesis' in window
      };
      
      return Object.values(indicators).some(Boolean);
    };

    setIsScreenReaderActive(checkScreenReader());
    
    // Also check when preferences change
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setIsScreenReaderActive(checkScreenReader());
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isScreenReaderActive;
};

/**
 * Hook for managing skip navigation links
 * @returns {Function} Function to set skip target
 */
export const useSkipNavigation = () => {
  const setSkipTarget = useCallback((targetId) => {
    // Ensure the target element exists and can receive focus
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  }, []);

  return setSkipTarget;
};