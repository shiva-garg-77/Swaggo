'use client';

import React, { useEffect, useState } from 'react';
import { useFixedSecureAuth as useAuth } from '../../context/FixedSecureAuthContext';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * 🛡️ PROTECTED ROUTE WRAPPER
 * 
 * Features:
 * - Authentication verification
 * - Role-based access control
 * - Loading states
 * - Error handling
 * - Redirect management
 * - Security monitoring
 */

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [],
  requiredScopes = [],
  fallbackComponent = null,
  loadingComponent = null,
  unauthorizedComponent = null,
  redirectTo = '/login',
  allowGuest = false
}) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    permissions,
    security,
    error,
    clearError
  } = useAuth();
  
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessError, setAccessError] = useState(null);
  
  // Check access permissions
  useEffect(() => {
    if (isLoading) return;
    
    // Allow guest access
    if (allowGuest && !isAuthenticated) {
      setAccessGranted(true);
      return;
    }
    
    // Require authentication
    if (!isAuthenticated) {
      setAccessError('Authentication required');
      // SecureAuthContext handles redirect internally
      window.location.href = redirectTo;
      return;
    }
    
    // Check role requirements
    if (requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => 
        permissions.role === role || permissions.scopes.includes(role)
      );
      
      if (!hasRole) {
        setAccessError(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
        setAccessGranted(false);
        return;
      }
    }
    
    // Check scope requirements
    if (requiredScopes.length > 0) {
      const hasScope = requiredScopes.every(scope =>
        permissions.scopes.includes(scope)
      );
      
      if (!hasScope) {
        setAccessError(`Access denied. Required permissions: ${requiredScopes.join(', ')}`);
        setAccessGranted(false);
        return;
      }
    }
    
    // Check security restrictions
    if (security?.accountLocked) {
      setAccessError('Account is locked due to security reasons');
      setAccessGranted(false);
      return;
    }
    
    if (security?.suspiciousActivity && security?.riskScore > 8) {
      setAccessError('Access restricted due to suspicious activity');
      setAccessGranted(false);
      return;
    }
    
    // Grant access
    setAccessGranted(true);
    setAccessError(null);
    
  }, [
    isAuthenticated,
    isLoading,
    permissions,
    security,
    requiredRoles,
    requiredScopes,
    allowGuest,
    redirectTo
  ]);
  
  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return loadingComponent;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="mt-2 text-gray-600">Verifying your access</p>
        </div>
      </div>
    );
  }
  
  // Authentication error
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = redirectTo}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Access denied
  if (!accessGranted && accessError) {
    if (unauthorizedComponent) {
      return unauthorizedComponent;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <ShieldCheckIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{accessError}</p>
          
          <div className="space-y-4">
            {/* User info */}
            {user && (
              <div className="bg-gray-100 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Current User</h3>
                <p className="text-sm text-gray-600">Username: {user.username}</p>
                <p className="text-sm text-gray-600">Role: {permissions.role}</p>
                <p className="text-sm text-gray-600">
                  Permissions: {permissions.scopes.join(', ') || 'None'}
                </p>
              </div>
            )}
            
            {/* Required access */}
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Required Access</h3>
              {requiredRoles.length > 0 && (
                <p className="text-sm text-blue-700">Roles: {requiredRoles.join(', ')}</p>
              )}
              {requiredScopes.length > 0 && (
                <p className="text-sm text-blue-700">Permissions: {requiredScopes.join(', ')}</p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Grant access
  if (accessGranted) {
    return (
      <>
        {children}
        
        {/* Security monitoring overlay for high-risk users */}
        {security?.riskScore > 7 && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-sm text-center z-50">
            <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
            High security risk detected. Your activity is being monitored.
          </div>
        )}
        
        {/* Account verification reminder */}
        {user && !user.emailVerified && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-40">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-2" />
              <div>
                <p className="font-medium">Verify your email</p>
                <p className="text-sm opacity-90 mt-1">
                  Please check your email and verify your account to unlock all features.
                </p>
                <button className="text-sm underline mt-2 hover:no-underline">
                  Resend verification
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Fallback
  return fallbackComponent || (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Checking...</h2>
        <p className="text-gray-600">Please wait while we verify your permissions</p>
      </div>
    </div>
  );
};

// Higher-order component for easier usage
export const withAuth = (Component, options = {}) => {
  const AuthenticatedComponent = (props) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
  
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return AuthenticatedComponent;
};

// Role-based HOC
export const withRole = (Component, requiredRoles) => {
  return withAuth(Component, { requiredRoles });
};

// Scope-based HOC
export const withScope = (Component, requiredScopes) => {
  return withAuth(Component, { requiredScopes });
};

export default ProtectedRoute;