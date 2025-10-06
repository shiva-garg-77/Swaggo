/**
 * Mock Accessibility Hook - Minimal implementation for when full accessibility is disabled
 * Prevents useAccessibility errors while providing basic functionality
 */

export const useMockAccessibility = () => {
  const noop = () => {};
  
  return {
    announceToScreenReader: noop,
    setSkipTarget: noop,
    addKeyboardShortcut: noop,
    isScreenReaderActive: false,
    isKeyboardNavigation: false,
    currentFocusId: null,
    focusHistory: [],
    liveRegions: new Map(),
    colorContrastIssues: [],
    trapFocus: noop,
    releaseFocusTrap: noop,
    registerShortcut: noop,
    checkColorContrast: () => [],
    accessibilityManager: null
  };
};