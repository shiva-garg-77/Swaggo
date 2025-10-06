'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import { AuthError } from '../../utils/authSecurityFixes';

/**
 * 🔔 Enhanced Authentication Error Notification Component
 * 
 * Provides comprehensive user feedback for authentication errors
 * with actionable recovery suggestions and better UX
 */
export const AuthErrorNotification = () => {
  const { error, clearError, isLoading } = useFixedSecureAuth();
  const [lastError, setLastError] = useState(null);
  const [showRecoveryActions, setShowRecoveryActions] = useState(false);

  useEffect(() => {
    if (error && error !== lastError) {
      setLastError(error);
      
      // Clear previous error notifications
      toast.dismiss();
      
      // Create appropriate notification based on error type
      if (typeof error === 'string') {
        // Simple string error
        showSimpleErrorNotification(error);
      } else if (error instanceof AuthError) {
        // Enhanced AuthError with user-friendly messaging
        showEnhancedErrorNotification(error);
      } else {
        // Generic error object
        showGenericErrorNotification(error);
      }
    }
    
    // Clear error if it's been resolved
    if (!error && lastError) {
      setLastError(null);
      setShowRecoveryActions(false);
    }
  }, [error, lastError]);

  const showSimpleErrorNotification = (errorMessage) => {
    toast.error(errorMessage, {
      duration: 5000,
      style: {
        background: '#fee2e2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        lineHeight: '1.5',
      },
      icon: '🚫',
      position: 'top-center',
    });
  };

  const showEnhancedErrorNotification = (authError) => {
    const userMessage = authError.getUserMessage();
    const recoveryActions = authError.getRecoveryActions();
    
    // Show main error notification
    toast.error(
      (t) => (
        <div className="flex flex-col space-y-2">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getErrorIcon(authError.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {userMessage}
              </p>
              {authError.type !== 'no_session' && authError.type !== 'unauthorized' && (
                <p className="text-xs text-gray-600 mt-1">
                  Error Code: {authError.type}
                </p>
              )}
            </div>
          </div>
          
          {recoveryActions.length > 0 && (
            <div className="mt-3 border-t pt-2">
              <p className="text-xs font-medium text-gray-700 mb-1">
                What you can do:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {recoveryActions.map((action, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <span>•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-3">
            <button
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
              onClick={() => {
                clearError();
                toast.dismiss(t.id);
              }}
            >
              Dismiss
            </button>
            {authError.type === 'network_error' && (
              <button
                className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      ),
      {
        duration: authError.isExpectedError() ? 4000 : 8000,
        style: {
          background: '#ffffff',
          color: '#374151',
          border: `2px solid ${getErrorColor(authError.type)}`,
          borderRadius: '12px',
          padding: '16px',
          minWidth: '320px',
          maxWidth: '400px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
        position: 'top-center',
      }
    );
  };

  const showGenericErrorNotification = (errorObject) => {
    const message = errorObject.message || errorObject.error || 'An unexpected error occurred';
    
    toast.error(message, {
      duration: 5000,
      style: {
        background: '#fef2f2',
        color: '#b91c1c',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '16px',
      },
      icon: '⚠️',
      position: 'top-center',
    });
  };

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'network_error':
        return '🌐';
      case 'timeout_error':
        return '⏱️';
      case 'unauthorized':
      case 'no_session':
        return '🔒';
      case 'forbidden':
        return '🚫';
      case 'rate_limited':
        return '⏳';
      case 'server_error':
        return '🔧';
      case 'validation_error':
        return '📝';
      default:
        return '⚠️';
    }
  };

  const getErrorColor = (errorType) => {
    switch (errorType) {
      case 'network_error':
        return '#3b82f6'; // Blue
      case 'timeout_error':
        return '#f59e0b'; // Amber
      case 'unauthorized':
      case 'no_session':
        return '#6b7280'; // Gray
      case 'forbidden':
        return '#dc2626'; // Red
      case 'rate_limited':
        return '#f59e0b'; // Amber
      case 'server_error':
        return '#dc2626'; // Red
      case 'validation_error':
        return '#f59e0b'; // Amber
      default:
        return '#dc2626'; // Red
    }
  };

  // Component doesn't render anything visible - it just handles notifications
  return null;
};

/**
 * 📊 Authentication Status Indicator Component
 * 
 * Shows current authentication status with visual feedback
 */
export const AuthStatusIndicator = () => {
  const { isLoading, isAuthenticated, error, user } = useFixedSecureAuth();

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg shadow-sm">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (error && !error.includes('Please log in')) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg shadow-sm">
          <span className="text-sm">🔴</span>
          <span className="text-sm font-medium">Connection issue</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg shadow-sm">
          <span className="text-sm">🟢</span>
          <span className="text-sm font-medium">
            Signed in as {user.username || user.email}
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthErrorNotification;