/**
 * Focus Detection Utility
 * Detects input method (keyboard vs mouse) and applies appropriate classes
 * for better focus indicator management
 */

let isKeyboardUser = false;

export function initializeFocusDetection() {
  if (typeof window === 'undefined') return;

  // Detect keyboard usage
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      isKeyboardUser = true;
      document.body.classList.add('keyboard-navigation');
      document.body.classList.remove('mouse-navigation');
    }
  }

  // Detect mouse usage
  function handleMouseDown() {
    isKeyboardUser = false;
    document.body.classList.add('mouse-navigation');
    document.body.classList.remove('keyboard-navigation');
  }

  // Initial state
  document.body.classList.add('mouse-navigation');

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);

  // Cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleMouseDown);
  };
}

export function isUsingKeyboard() {
  return isKeyboardUser;
}
