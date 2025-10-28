/**
 * @fileoverview Accessibility Module Barrel Export
 * @description Central export point for accessibility utilities
 * 
 * IMPORTANT: Only AccessibilityUtils.jsx's AccessibilityProvider is exported
 * to avoid conflicts with AccessibilityFramework.jsx
 */

// Export everything from AccessibilityUtils as the primary provider
export { 
  AccessibilityProvider,
  AccessibleButton,
  AccessibleInput,
  LiveRegion,
  SkipNavigation,
  useAccessibilityUtils
} from './AccessibilityUtils';

// Export the framework provider with a different name to avoid conflicts
export { AccessibilityProvider as AccessibilityFrameworkProvider } from './AccessibilityFramework';
