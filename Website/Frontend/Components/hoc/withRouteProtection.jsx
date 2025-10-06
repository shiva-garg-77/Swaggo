/**
 * Route Protection Higher-Order Component
 * Provides consistent route protection and authorization checks across the application
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Authentication is now handled via React Context (FixedSecureAuthContext)
// This component should use the useFixedSecureAuth hook instead
import errorHandlingService, { ERROR_TYPES } from '../../services/ErrorHandlingService';
import notificationService from '../../services/UnifiedNotificationService.js';

// Import the auth context hook
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';

/**
 * Protection Types
 */
const PROTECTION_TYPES = {
  AUTHENTICATED: 'authenticated',           // User must be logged in
  UNAUTHENTICATED: 'unauthenticated',     // User must NOT be logged in
  ROLE_BASED: 'role_based',               // User must have specific role
  PERMISSION_BASED: 'permission_based',   // User must have specific permission
  CONDITIONAL: 'conditional',             // Custom condition function
  PUBLIC: 'public'                        // No protection required
};

/**
 * Redirect Strategies
 */
const REDIRECT_STRATEGIES = {
  LOGIN: 'login',                         // Redirect to login page
  HOME: 'home',                          // Redirect to home page
  PREVIOUS: 'previous',                  // Redirect to previous page
  CUSTOM: 'custom',                      // Custom redirect path
  STAY: 'stay'                          // Stay on current page (show error)
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  protectionType: PROTECTION_TYPES.PUBLIC,
  redirectStrategy: REDIRECT_STRATEGIES.LOGIN,
  customRedirectPath: null,
  requiredRoles: [],
  requiredPermissions: [],
  customCondition: null,
  showLoadingSpinner: true,
  showErrorMessage: true,
  enableRetry: true,
  retryAttempts: 3,
  retryDelay: 1000,
  bypassInDevelopment: false,
  logAccess: true
};

/**
 * Loading Component
 */
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="route-protection-loading">
    <div className="spinner">
      <div className="spinner-circle"></div>
    </div>
    <p className="loading-message">{message}</p>
    <style jsx>{`
      .route-protection-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        padding: 2rem;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        margin-bottom: 1rem;
      }
      
      .spinner-circle {
        width: 100%;
        height: 100%;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-message {
        color: #666;
        font-size: 14px;
        margin: 0;
      }
    `}</style>
  </div>
);

/**
 * Access Denied Component
 */
const AccessDenied = ({ message, onRetry, canRetry, onGoBack }) => (
  <div className="route-protection-denied">
    <div className="denied-content">
      <div className="denied-icon">🔒</div>
      <h2>Access Denied</h2>
      <p className="denied-message">{message}</p>
      <div className="denied-actions">
        {canRetry && (
          <button className="retry-button" onClick={onRetry}>
            Try Again
          </button>
        )}
        <button className="back-button" onClick={onGoBack}>
          Go Back
        </button>
      </div>
    </div>
    <style jsx>{`
      .route-protection-denied {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        padding: 2rem;
      }
      
      .denied-content {
        text-align: center;
        max-width: 400px;
      }
      
      .denied-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
      
      .denied-content h2 {
        color: #e74c3c;
        margin-bottom: 1rem;
      }
      
      .denied-message {
        color: #666;
        margin-bottom: 2rem;
        line-height: 1.5;
      }
      
      .denied-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }
      
      .retry-button, .back-button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      
      .retry-button {
        background-color: #3498db;
        color: white;
      }
      
      .retry-button:hover {
        background-color: #2980b9;
      }
      
      .back-button {
        background-color: #95a5a6;
        color: white;
      }
      
      .back-button:hover {
        background-color: #7f8c8d;
      }
    `}</style>
  </div>
);

/**
 * Route Protection Status
 */
const PROTECTION_STATUS = {
  LOADING: 'loading',
  AUTHORIZED: 'authorized',
  UNAUTHORIZED: 'unauthorized',
  ERROR: 'error'
};

/**
 * Route Protection Hook
 */
const useRouteProtection = (config) => {
  const [status, setStatus] = useState(PROTECTION_STATUS.LOADING);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use React Context for authentication
  const { user, isAuthenticated, loading } = useFixedSecureAuth();

  const checkAccess = useCallback(async () => {
    try {
      setStatus(PROTECTION_STATUS.LOADING);
      setError(null);

      // Check if bypass is enabled in development
      if (config.bypassInDevelopment && process.env.NODE_ENV === 'development') {
        if (config.logAccess) {
          console.log('Route protection bypassed in development mode');
        }
        setStatus(PROTECTION_STATUS.AUTHORIZED);
        return true;
      }

      let isAuthorized = false;

      switch (config.protectionType) {
        case PROTECTION_TYPES.PUBLIC:
          isAuthorized = true;
          break;

        case PROTECTION_TYPES.AUTHENTICATED:
          isAuthorized = isAuthenticated;
          break;

        case PROTECTION_TYPES.UNAUTHENTICATED:
          isAuthorized = !isAuthenticated;
          break;

        case PROTECTION_TYPES.ROLE_BASED:
          isAuthorized = await checkRoleAccess();
          break;

        case PROTECTION_TYPES.PERMISSION_BASED:
          isAuthorized = await checkPermissionAccess();
          break;

        case PROTECTION_TYPES.CONDITIONAL:
          isAuthorized = await checkConditionalAccess();
          break;

        default:
          isAuthorized = false;
      }

      if (isAuthorized) {
        setStatus(PROTECTION_STATUS.AUTHORIZED);
        if (config.logAccess) {
          logAccess(true);
        }
        return true;
      } else {
        setStatus(PROTECTION_STATUS.UNAUTHORIZED);
        if (config.logAccess) {
          logAccess(false);
        }
        handleUnauthorizedAccess();
        return false;
      }

    } catch (error) {
      setError(error);
      setStatus(PROTECTION_STATUS.ERROR);
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.AUTH_PERMISSION_DENIED,
          'Route protection check failed',
          { path: location.pathname, config, error }
        )
      );

      return false;
    }
  }, [config, location.pathname, navigate]);

  const checkRoleAccess = async () => {
    if (!config.requiredRoles || config.requiredRoles.length === 0) {
      return true;
    }

    try {
      // User roles should be available from the React Context user object
      const userRoles = user?.roles || [];
      return config.requiredRoles.some(role => userRoles.includes(role));
    } catch (error) {
      return false;
    }
  };

  const checkPermissionAccess = async () => {
    if (!config.requiredPermissions || config.requiredPermissions.length === 0) {
      return true;
    }

    try {
      // User permissions should be available from the React Context user object
      const userPermissions = user?.permissions || [];
      for (const permission of config.requiredPermissions) {
        if (!userPermissions.includes(permission)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const checkConditionalAccess = async () => {
    if (!config.customCondition || typeof config.customCondition !== 'function') {
      return true;
    }

    try {
      // User is already available from React Context
      return await config.customCondition(user, location, navigate);
    } catch (error) {
      return false;
    }
  };

  const handleUnauthorizedAccess = () => {
    const strategy = config.redirectStrategy;

    switch (strategy) {
      case REDIRECT_STRATEGIES.LOGIN:
        navigate('/login', { 
          state: { from: location.pathname },
          replace: true 
        });
        break;

      case REDIRECT_STRATEGIES.HOME:
        navigate('/', { replace: true });
        break;

      case REDIRECT_STRATEGIES.PREVIOUS:
        navigate(-1);
        break;

      case REDIRECT_STRATEGIES.CUSTOM:
        if (config.customRedirectPath) {
          navigate(config.customRedirectPath, { replace: true });
        }
        break;

      case REDIRECT_STRATEGIES.STAY:
        // Stay on current page, error will be shown
        if (config.showErrorMessage) {
          const message = getUnauthorizedMessage();
          notificationService.error('Access Denied', message);
        }
        break;

      default:
        navigate('/login', { 
          state: { from: location.pathname },
          replace: true 
        });
    }
  };

  const getUnauthorizedMessage = () => {
    switch (config.protectionType) {
      case PROTECTION_TYPES.AUTHENTICATED:
        return 'You must be logged in to access this page.';
      case PROTECTION_TYPES.UNAUTHENTICATED:
        return 'This page is only available to guests.';
      case PROTECTION_TYPES.ROLE_BASED:
        return `You need one of the following roles: ${config.requiredRoles.join(', ')}`;
      case PROTECTION_TYPES.PERMISSION_BASED:
        return `You need the following permissions: ${config.requiredPermissions.join(', ')}`;
      case PROTECTION_TYPES.CONDITIONAL:
        return 'You do not meet the requirements to access this page.';
      default:
        return 'You do not have permission to access this page.';
    }
  };

  const logAccess = (granted) => {
    console.log('Route Protection:', {
      path: location.pathname,
      granted,
      protectionType: config.protectionType,
      timestamp: new Date().toISOString()
    });
  };

  const retry = useCallback(async () => {
    if (retryCount >= config.retryAttempts) {
      return;
    }

    setRetryCount(prev => prev + 1);
    
    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, config.retryDelay * (retryCount + 1)));
    
    await checkAccess();
  }, [checkAccess, retryCount, config.retryAttempts, config.retryDelay]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Initial access check
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Listen to authentication changes from React Context
  useEffect(() => {
    // React Context will handle auth state changes automatically
    // Re-check access when auth state changes
    if (!loading) {
      checkAccess();
    }
  }, [checkAccess, isAuthenticated, user, loading]);

  return {
    status,
    error,
    isLoading: status === PROTECTION_STATUS.LOADING,
    isAuthorized: status === PROTECTION_STATUS.AUTHORIZED,
    isUnauthorized: status === PROTECTION_STATUS.UNAUTHORIZED,
    hasError: status === PROTECTION_STATUS.ERROR,
    retry,
    goBack,
    canRetry: config.enableRetry && retryCount < config.retryAttempts,
    retryCount,
    checkAccess
  };
};

/**
 * Higher-Order Component for Route Protection
 */
const withRouteProtection = (WrappedComponent, protectionConfig = {}) => {
  const config = { ...DEFAULT_CONFIG, ...protectionConfig };

  const ProtectedRoute = (props) => {
    const protection = useRouteProtection(config);

    // Show loading spinner
    if (protection.isLoading && config.showLoadingSpinner) {
      return <LoadingSpinner message="Checking access permissions..." />;
    }

    // Show error state
    if (protection.hasError) {
      const errorMessage = protection.error?.message || 'An error occurred while checking permissions';
      
      return (
        <AccessDenied
          message={errorMessage}
          onRetry={protection.retry}
          canRetry={protection.canRetry}
          onGoBack={protection.goBack}
        />
      );
    }

    // Show access denied (only for STAY strategy)
    if (protection.isUnauthorized && config.redirectStrategy === REDIRECT_STRATEGIES.STAY) {
      const message = getUnauthorizedMessage(config);
      
      return (
        <AccessDenied
          message={message}
          onRetry={protection.retry}
          canRetry={protection.canRetry}
          onGoBack={protection.goBack}
        />
      );
    }

    // Show protected component if authorized
    if (protection.isAuthorized) {
      return <WrappedComponent {...props} />;
    }

    // For other redirect strategies, show nothing (redirect will happen)
    return null;
  };

  // Set display name for debugging
  ProtectedRoute.displayName = `withRouteProtection(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  // Copy static properties
  ProtectedRoute.WrappedComponent = WrappedComponent;

  return ProtectedRoute;
};

/**
 * Helper function to get unauthorized message
 */
const getUnauthorizedMessage = (config) => {
  switch (config.protectionType) {
    case PROTECTION_TYPES.AUTHENTICATED:
      return 'You must be logged in to access this page.';
    case PROTECTION_TYPES.UNAUTHENTICATED:
      return 'This page is only available to guests.';
    case PROTECTION_TYPES.ROLE_BASED:
      return `You need one of the following roles: ${config.requiredRoles.join(', ')}`;
    case PROTECTION_TYPES.PERMISSION_BASED:
      return `You need the following permissions: ${config.requiredPermissions.join(', ')}`;
    case PROTECTION_TYPES.CONDITIONAL:
      return 'You do not meet the requirements to access this page.';
    default:
      return 'You do not have permission to access this page.';
  }
};

/**
 * Convenience HOCs for common protection patterns
 */

// Require authentication
export const requireAuth = (Component, options = {}) => {
  return withRouteProtection(Component, {
    protectionType: PROTECTION_TYPES.AUTHENTICATED,
    redirectStrategy: REDIRECT_STRATEGIES.LOGIN,
    ...options
  });
};

// Require guest (unauthenticated) access
export const requireGuest = (Component, options = {}) => {
  return withRouteProtection(Component, {
    protectionType: PROTECTION_TYPES.UNAUTHENTICATED,
    redirectStrategy: REDIRECT_STRATEGIES.HOME,
    ...options
  });
};

// Require specific roles
export const requireRoles = (Component, roles, options = {}) => {
  return withRouteProtection(Component, {
    protectionType: PROTECTION_TYPES.ROLE_BASED,
    requiredRoles: Array.isArray(roles) ? roles : [roles],
    redirectStrategy: REDIRECT_STRATEGIES.LOGIN,
    ...options
  });
};

// Require specific permissions
export const requirePermissions = (Component, permissions, options = {}) => {
  return withRouteProtection(Component, {
    protectionType: PROTECTION_TYPES.PERMISSION_BASED,
    requiredPermissions: Array.isArray(permissions) ? permissions : [permissions],
    redirectStrategy: REDIRECT_STRATEGIES.LOGIN,
    ...options
  });
};

// Admin only access
export const requireAdmin = (Component, options = {}) => {
  return withRouteProtection(Component, {
    protectionType: PROTECTION_TYPES.ROLE_BASED,
    requiredRoles: ['admin'],
    redirectStrategy: REDIRECT_STRATEGIES.HOME,
    showErrorMessage: true,
    ...options
  });
};

// Custom condition
export const requireCondition = (Component, condition, options = {}) => {
  return withRouteProtection(Component, {
    protectionType: PROTECTION_TYPES.CONDITIONAL,
    customCondition: condition,
    redirectStrategy: REDIRECT_STRATEGIES.LOGIN,
    ...options
  });
};

export default withRouteProtection;
export {
  PROTECTION_TYPES,
  REDIRECT_STRATEGIES,
  useRouteProtection,
  LoadingSpinner,
  AccessDenied
};