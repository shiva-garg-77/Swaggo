/**
 * Accessible Modal Component
 * Fixes ALL modal/dialog issues (Category 18)
 * 
 * ✅ Issue 18.1: Centered on all screens
 * ✅ Issue 18.2: Scrollable content
 * ✅ Issue 18.3: Close button included
 * ✅ Issue 18.4: Configurable backdrop click
 * ✅ Issue 18.5: Smooth animations
 * ✅ Issue 18.6: Proper z-index
 * ✅ Issue 18.7: Focus trap
 * ✅ Issue 18.8: Initial focus
 * ✅ Issue 18.9: Return focus
 * ✅ Issue 18.10: Body scroll disabled
 * ✅ Issue 18.11: Full accessibility
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { FocusTrap, Z_INDEX, announceToScreenReader } from '../../utils/uiHelpers';

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = false,
  showCloseButton = true,
  initialFocusRef = null,
  className = '',
  theme = 'light'
}) {
  const modalRef = useRef(null);
  const focusTrapRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  const isDark = theme === 'dark';

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Disable body scroll (Issue 18.10)
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Announce to screen readers (Issue 18.11)
    announceToScreenReader(`${title || 'Dialog'} opened`, 'assertive');

    // Setup focus trap (Issue 18.7, 18.8, 18.9)
    if (modalRef.current) {
      focusTrapRef.current = new FocusTrap(modalRef.current);
      focusTrapRef.current.activate();

      // Set initial focus
      if (initialFocusRef?.current) {
        setTimeout(() => initialFocusRef.current.focus(), 100);
      }
    }

    // Cleanup
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }

      announceToScreenReader(`${title || 'Dialog'} closed`, 'polite');
    };
  }, [isOpen, title, initialFocusRef]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
      role="presentation"
    >
      {/* Backdrop (Issue 18.4) */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isDark ? 'bg-black/70' : 'bg-black/50'
        }`}
        style={{ zIndex: Z_INDEX.modalBackdrop }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal (Issue 18.1, 18.2, 18.5) */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizes[size]} max-h-[90vh] rounded-xl shadow-2xl transform transition-all duration-300 ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        } ${className}`}
        style={{ zIndex: Z_INDEX.modal + 1 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {title && (
            <h2
              id="modal-title"
              className="text-xl font-semibold"
            >
              {title}
            </h2>
          )}
          
          {/* Close Button (Issue 18.3) */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content (Issue 18.2 - Scrollable) */}
        <div
          id="modal-description"
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
