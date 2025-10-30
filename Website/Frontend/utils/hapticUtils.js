/**
 * HAPTIC FEEDBACK UTILITIES
 * Cross-platform haptic feedback for mobile devices
 */

/**
 * Check if haptic feedback is supported
 * @returns {boolean}
 */
export function isHapticSupported() {
  return (
    'vibrate' in navigator ||
    'Vibration API' in window ||
    (window.navigator && 'vibrate' in window.navigator)
  );
}

/**
 * Trigger haptic feedback
 * @param {string} type - 'light', 'medium', 'heavy', 'success', 'warning', 'error'
 */
export function triggerHaptic(type = 'light') {
  if (!isHapticSupported()) return;
  
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30],
    selection: [5],
    impact: [15],
    notification: [10, 50, 10, 50, 10]
  };
  
  const pattern = patterns[type] || patterns.light;
  
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.warn('Haptic feedback error:', error);
  }
}

/**
 * Trigger haptic for button press
 */
export function hapticButtonPress() {
  triggerHaptic('light');
}

/**
 * Trigger haptic for like/favorite action
 */
export function hapticLike() {
  triggerHaptic('medium');
}

/**
 * Trigger haptic for success action
 */
export function hapticSuccess() {
  triggerHaptic('success');
}

/**
 * Trigger haptic for error
 */
export function hapticError() {
  triggerHaptic('error');
}

/**
 * Trigger haptic for selection change
 */
export function hapticSelection() {
  triggerHaptic('selection');
}

/**
 * Trigger haptic for notification
 */
export function hapticNotification() {
  triggerHaptic('notification');
}

/**
 * React hook for haptic feedback
 * @returns {object} Haptic functions
 */
export function useHaptic() {
  return {
    isSupported: isHapticSupported(),
    trigger: triggerHaptic,
    buttonPress: hapticButtonPress,
    like: hapticLike,
    success: hapticSuccess,
    error: hapticError,
    selection: hapticSelection,
    notification: hapticNotification
  };
}

/**
 * Add haptic feedback to element
 * @param {HTMLElement} element
 * @param {string} type
 */
export function addHapticToElement(element, type = 'light') {
  if (!element) return;
  
  element.addEventListener('click', () => {
    triggerHaptic(type);
  });
}

/**
 * Haptic feedback for form interactions
 */
export const hapticForm = {
  input: () => triggerHaptic('light'),
  submit: () => triggerHaptic('medium'),
  error: () => triggerHaptic('error'),
  success: () => triggerHaptic('success')
};

/**
 * Haptic feedback for animations
 */
export const hapticAnimation = {
  start: () => triggerHaptic('light'),
  end: () => triggerHaptic('medium'),
  bounce: () => triggerHaptic('selection')
};
