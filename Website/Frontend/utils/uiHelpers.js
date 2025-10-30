/**
 * UI Helper Utilities
 * Comprehensive solutions for PART3 UI issues
 * 
 * ✅ Category 12: Helper Component Issues
 * ✅ Category 14: Accessibility Issues
 * ✅ Category 16: Animation Issues
 * ✅ Category 22: Z-Index/Layering Issues
 */

// ============================================
// Z-INDEX SYSTEM (Issue 22.1)
// ============================================
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  max: 9999
};

// ============================================
// ANIMATION UTILITIES (Category 16)
// ============================================
export const ANIMATION_DURATIONS = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500
};

export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

// GPU-accelerated animation (Issue 16.8)
export const gpuAccelerate = (element) => {
  if (element) {
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform, opacity';
    element.style.backfaceVisibility = 'hidden';
  }
};

// Smooth animation with cancellation (Issue 16.6)
export class CancelableAnimation {
  constructor(element, keyframes, options) {
    this.element = element;
    this.animation = element.animate(keyframes, options);
    this.cancelled = false;
  }

  cancel() {
    this.cancelled = true;
    this.animation.cancel();
  }

  async finished() {
    if (this.cancelled) return;
    return this.animation.finished;
  }
}

// ============================================
// ACCESSIBILITY UTILITIES (Category 14)
// ============================================

// Generate unique IDs for ARIA (Issue 14.17)
let idCounter = 0;
export const generateId = (prefix = 'ui') => {
  return `${prefix}-${++idCounter}-${Date.now()}`;
};

// Announce to screen readers (Issue 14.6, 14.18)
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus trap for modals (Issue 14.14)
export class FocusTrap {
  constructor(element) {
    this.element = element;
    this.previousFocus = document.activeElement;
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;
  }

  activate() {
    this.updateFocusableElements();
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }
    this.element.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }
  }

  updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors)
    );
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

// Check color contrast (Issue 14.11)
export const checkColorContrast = (foreground, background) => {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: ratio.toFixed(2),
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    passesAALarge: ratio >= 3
  };
};

// ============================================
// LOADING STATES (Issue 12.1, 12.10)
// ============================================
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`${sizes[size]} ${className}`} role="status" aria-label="Loading">
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ============================================
// ERROR MESSAGES (Issue 12.2)
// ============================================
export const formatErrorMessage = (error) => {
  const errorMessages = {
    'Network request failed': 'Unable to connect. Please check your internet connection.',
    'Failed to fetch': 'Unable to load data. Please try again.',
    'Unauthorized': 'Please log in to continue.',
    'Forbidden': 'You don\'t have permission to access this.',
    'Not Found': 'The requested item could not be found.',
    'Internal Server Error': 'Something went wrong. Please try again later.',
    'Bad Request': 'Invalid request. Please check your input.',
    'Timeout': 'Request timed out. Please try again.'
  };

  const errorString = error?.message || error?.toString() || 'Unknown error';
  
  for (const [key, message] of Object.entries(errorMessages)) {
    if (errorString.includes(key)) {
      return message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

// ============================================
// TOAST NOTIFICATIONS (Issue 12.3)
// ============================================
export const TOAST_DURATION = {
  short: 2000,
  medium: 4000,
  long: 6000,
  persistent: 0
};

// ============================================
// TOOLTIP POSITIONING (Issue 12.4)
// ============================================
export const calculateTooltipPosition = (triggerElement, tooltipElement, preferredPosition = 'top') => {
  const triggerRect = triggerElement.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  const positions = {
    top: {
      top: triggerRect.top - tooltipRect.height - 8,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
    },
    bottom: {
      top: triggerRect.bottom + 8,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
    },
    left: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.left - tooltipRect.width - 8
    },
    right: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.right + 8
    }
  };

  // Check if preferred position fits
  let position = positions[preferredPosition];
  let finalPosition = preferredPosition;

  // Check boundaries and adjust
  if (position.top < 0) {
    position = positions.bottom;
    finalPosition = 'bottom';
  } else if (position.top + tooltipRect.height > viewport.height) {
    position = positions.top;
    finalPosition = 'top';
  }

  if (position.left < 0) {
    position.left = 8;
  } else if (position.left + tooltipRect.width > viewport.width) {
    position.left = viewport.width - tooltipRect.width - 8;
  }

  return { ...position, position: finalPosition };
};

// ============================================
// RESPONSIVE UTILITIES (Category 13)
// ============================================
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export const useMediaQuery = (query) => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
};

export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
};

// Touch target size check (Issue 13.5)
export const MINIMUM_TOUCH_TARGET = 44; // 44x44px minimum

export const isTouchTargetAccessible = (element) => {
  const rect = element.getBoundingClientRect();
  return rect.width >= MINIMUM_TOUCH_TARGET && rect.height >= MINIMUM_TOUCH_TARGET;
};

// ============================================
// PERFORMANCE UTILITIES (Category 15)
// ============================================

// Debounce (Issue 15.18)
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle (Issue 15.18)
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy load images (Issue 15.3)
export const lazyLoadImage = (img) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lazyImage = entry.target;
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.classList.remove('lazy');
        observer.unobserve(lazyImage);
      }
    });
  });
  observer.observe(img);
};

// ============================================
// FORM UTILITIES (Category 17)
// ============================================

// Auto-resize textarea (Issue 17.6)
export const autoResizeTextarea = (textarea) => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};

// Password strength (Issue 17.13)
export const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 20;

  return {
    score: strength,
    label: strength < 40 ? 'Weak' : strength < 60 ? 'Fair' : strength < 80 ? 'Good' : 'Strong',
    color: strength < 40 ? 'red' : strength < 60 ? 'yellow' : strength < 80 ? 'blue' : 'green'
  };
};

// ============================================
// MOBILE UTILITIES (Category 23)
// ============================================

// Remove tap delay (Issue 23.4)
export const removeTapDelay = () => {
  if (typeof document !== 'undefined') {
    document.addEventListener('touchstart', function() {}, { passive: true });
  }
};

// Prevent pull-to-refresh (Issue 23.3)
export const preventPullToRefresh = (element) => {
  let startY = 0;
  element.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    const y = e.touches[0].pageY;
    if (element.scrollTop === 0 && y > startY) {
      e.preventDefault();
    }
  }, { passive: false });
};

// Haptic feedback (Issue 23.17)
export const triggerHaptic = (type = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      error: [20, 100, 20]
    };
    navigator.vibrate(patterns[type] || 10);
  }
};

export default {
  Z_INDEX,
  ANIMATION_DURATIONS,
  EASING,
  gpuAccelerate,
  CancelableAnimation,
  generateId,
  announceToScreenReader,
  FocusTrap,
  checkColorContrast,
  LoadingSpinner,
  formatErrorMessage,
  TOAST_DURATION,
  calculateTooltipPosition,
  BREAKPOINTS,
  useMediaQuery,
  isMobile,
  isTablet,
  isDesktop,
  MINIMUM_TOUCH_TARGET,
  isTouchTargetAccessible,
  debounce,
  throttle,
  lazyLoadImage,
  autoResizeTextarea,
  calculatePasswordStrength,
  removeTapDelay,
  preventPullToRefresh,
  triggerHaptic
};
