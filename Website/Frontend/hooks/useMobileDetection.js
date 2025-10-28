/**
 * @fileoverview Mobile detection hook for responsive design
 * @module hooks/useMobileDetection
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect mobile devices and screen sizes
 * @returns {Object} Mobile detection state
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0
  });
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Mobile detection
      const mobile = width <= 768;
      const tablet = width > 768 && width <= 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Determine device type
      if (mobile) {
        setDeviceType('mobile');
      } else if (tablet) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Initial check
    checkDevice();

    // Add event listener for resize
    window.addEventListener('resize', checkDevice);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    deviceType,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
}

/**
 * Hook to detect orientation changes
 * @returns {string} Current orientation ('portrait' or 'landscape')
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    // Initial check
    checkOrientation();

    // Add event listeners
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

/**
 * Hook to detect virtual keyboard visibility on mobile devices
 * @returns {boolean} Whether virtual keyboard is visible
 */
export function useVirtualKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let initialViewportHeight = window.innerHeight;

    const checkKeyboard = () => {
      const currentViewportHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentViewportHeight;
      
      // Keyboard is likely visible if viewport height decreased by more than 150px
      setIsKeyboardVisible(heightDifference > 150);
    };

    // Initial check
    initialViewportHeight = window.innerHeight;
    checkKeyboard();

    // Add event listener for resize
    window.addEventListener('resize', checkKeyboard);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkKeyboard);
    };
  }, []);

  return isKeyboardVisible;
}

/**
 * Hook to detect safe area insets for mobile devices with notches
 * @returns {Object} Safe area insets
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateInsets = () => {
      // Try to get CSS environment variables for safe areas
      const getInset = (property) => {
        if (typeof window.CSS !== 'undefined' && window.CSS.supports) {
          try {
            const value = getComputedStyle(document.documentElement)
              .getPropertyValue(`--safe-area-inset-${property}`);
            return parseInt(value) || 0;
          } catch (e) {
            return 0;
          }
        }
        return 0;
      };

      setInsets({
        top: getInset('top'),
        right: getInset('right'),
        bottom: getInset('bottom'),
        left: getInset('left')
      });
    };

    // Initial update
    updateInsets();

    // Listen for orientation changes
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
}