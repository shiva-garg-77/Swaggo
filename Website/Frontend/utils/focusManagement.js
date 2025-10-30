/**
 * FOCUS MANAGEMENT UTILITY
 * Detects input method (keyboard vs mouse) and applies appropriate focus styles
 * Improves accessibility by showing focus indicators only when needed
 */

let isKeyboardUser = false;

/**
 * Initialize focus management
 * Call this once when the app loads
 */
export function initializeFocusManagement() {
  if (typeof window === 'undefined') return;

  // Detect keyboard usage
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isKeyboardUser = true;
      document.body.classList.add('keyboard-navigation');
      document.body.classList.remove('mouse-navigation');
    }
  });

  // Detect mouse usage
  window.addEventListener('mousedown', () => {
    isKeyboardUser = false;
    document.body.classList.add('mouse-navigation');
    document.body.classList.remove('keyboard-navigation');
  });

  // Detect touch usage
  window.addEventListener('touchstart', () => {
    isKeyboardUser = false;
    document.body.classList.add('mouse-navigation');
    document.body.classList.remove('keyboard-navigation');
  });

  // Initialize with mouse mode
  document.body.classList.add('mouse-navigation');
}

/**
 * Check if user is currently using keyboard
 */
export function isUsingKeyboard() {
  return isKeyboardUser;
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container) {
  if (!container) return () => {};

  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

/**
 * Focus first element in container
 */
export function focusFirstElement(container) {
  const elements = getFocusableElements(container);
  elements[0]?.focus();
}

/**
 * Focus last element in container
 */
export function focusLastElement(container) {
  const elements = getFocusableElements(container);
  elements[elements.length - 1]?.focus();
}

/**
 * Save and restore focus (useful for modals)
 */
export function createFocusManager() {
  let previouslyFocusedElement = null;

  return {
    save() {
      previouslyFocusedElement = document.activeElement;
    },
    restore() {
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      }
    }
  };
}
