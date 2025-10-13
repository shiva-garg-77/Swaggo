'use client';

import React, { useEffect, useState } from 'react';
import { useFixedSecureAuth as useAuth } from '../../context/FixedSecureAuthContext';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

/**
 * 🛡️ ENHANCED PROTECTED ROUTE WRAPPER
 * 
 * Features:
 * - Authentication verification
 * - Role-based access control
 * - Permission-based access control
 * - Loading states
 * - Error handling
 * - Redirect management
 * - Security monitoring
 * - Granular permission checking
 */

const EnhancedProtectedRoute = ({ 
  children, 
  requiredRoles = [],
  requiredPermissions = [],
  requireAllPermissions = false,
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
      const userRole = permissions?.role || 'guest';
      const hasRole = requiredRoles.includes(userRole);
      
      if (!hasRole) {
        setAccessError(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
        setAccessGranted(false);
        return;
      }
    }
    
    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const userPermissions = permissions?.scopes || [];
      
      let hasPermission = false;
      if (requireAllPermissions) {
        // User must have ALL required permissions
        hasPermission = requiredPermissions.every(permission => 
          userPermissions.includes(permission)
        );
      } else {
        // User must have AT LEAST ONE required permission
        hasPermission = requiredPermissions.some(permission => 
          userPermissions.includes(permission)
        );
      }
      
      if (!hasPermission) {
        setAccessError(`Access denied. Required permissions: ${requiredPermissions.join(requireAllPermissions ? ' and ' : ' or ')}`);
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
  }, [isAuthenticated, isLoading, permissions, security, requiredRoles, requiredPermissions, requireAllPermissions, redirectTo, allowGuest]);

  // Loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Authentication Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <button
                onClick={clearError}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (!accessGranted) {
    if (unauthorizedComponent) {
      return unauthorizedComponent;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">{accessError || 'You do not have permission to access this page.'}</p>
            
            {/* User info */}
            {isAuthenticated && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Your Access</h3>
                <p className="text-sm text-gray-600">
                  Role: {permissions?.role || 'guest'}
                </p>
                {permissions?.scopes && permissions.scopes.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Permissions: {permissions.scopes.join(', ') || 'None'}
                  </p>
                )}
              </div>
            )}
            
            {/* Required access */}
            <div className="mt-4 bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Required Access</h3>
              {requiredRoles.length > 0 && (
                <p className="text-sm text-blue-700">Roles: {requiredRoles.join(', ')}</p>
              )}
              {requiredPermissions.length > 0 && (
                <p className="text-sm text-blue-700">
                  Permissions: {requiredPermissions.join(requireAllPermissions ? ' and ' : ' or ')}
                </p>
              )}
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
  return children;
};

// Higher-order component for easier usage
export const withEnhancedAuth = (Component, options = {}) => {
  const AuthenticatedComponent = (props) => {
    return (
      <EnhancedProtectedRoute {...options}>
        <Component {...props} />
      </EnhancedProtectedRoute>
    );
  };
  
  AuthenticatedComponent.displayName = `withEnhancedAuth(${Component.displayName || Component.name})`;
  return AuthenticatedComponent;
};

// Role-based HOC
export const withRole = (Component, requiredRoles) => {
  return withEnhancedAuth(Component, { requiredRoles });
};

// Permission-based HOC
export const withPermission = (Component, requiredPermissions, requireAll = false) => {
  return withEnhancedAuth(Component, { 
    requiredPermissions, 
    requireAllPermissions: requireAll 
  });
};

// Admin-only HOC
export const withAdmin = (Component) => {
  return withEnhancedAuth(Component, { requiredRoles: ['admin'] });
};

export default EnhancedProtectedRoute;