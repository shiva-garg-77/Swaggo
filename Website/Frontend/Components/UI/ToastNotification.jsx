/**
 * Toast Notification System
 * Fixes toast notification issues (Issue 12.3)
 * 
 * ✅ Configurable duration
 * ✅ Proper positioning
 * ✅ Accessible announcements
 * ✅ Multiple toast support
 * ✅ Action buttons
 * ✅ Auto-dismiss
 */

'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Z_INDEX, TOAST_DURATION, announceToScreenReader } from '../../utils/uiHelpers';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = TOAST_DURATION.medium, action = null) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration, action };

    setToasts(prev => [...prev, toast]);

    // Announce to screen readers
    const priority = type === 'error' ? 'assertive' : 'polite';
    announceToScreenReader(message, priority);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, duration, action) => addToast(message, 'success', duration, action),
    error: (message, duration, action) => addToast(message, 'error', duration, action),
    warning: (message, duration, action) => addToast(message, 'warning', duration, action),
    info: (message, duration, action) => addToast(message, 'info', duration, action),
    remove: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ zIndex: Z_INDEX.toast }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

function Toast({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  return (
    <div
      className={`pointer-events-auto min-w-[300px] max-w-md rounded-lg border shadow-lg p-4 transform transition-all duration-300 ${colors[toast.type]
        } ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {toast.message}
          </p>

          {toast.action && (
            <button
              onClick={() => {
                toast.action.onClick();
                handleClose();
              }}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleClose}
          className="shrink-0 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
}

export default ToastNotification;
