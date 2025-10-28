'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import Performance Monitoring Provider
import { PerformanceMonitoringProvider } from '../Performance/PerformanceMonitoringDashboard';

// Import Accessibility Provider - Use the correct one
import { AccessibilityProvider } from '../Accessibility/AccessibilityUtils';

// Import Error Boundary
import UnifiedStableErrorBoundary from '../ErrorBoundary';

// Import all the providers that were in the original layout
import { FixedSecureAuthProvider } from '../../context/FixedSecureAuthContext';
import { I18nProvider } from '../../context/I18nContext';
import { UnifiedThemeProvider } from '../../context/UnifiedThemeProvider';
import { FeatureFlagProvider } from '../../context/FeatureFlagContext';
import { GraphQLAuthProvider } from '../../lib/GraphQLAuthProvider';
import { Toaster } from 'react-hot-toast';

// Import the PerfectSocketProvider
import PerfectSocketProvider from './PerfectSocketProvider.jsx';

// Dev tools - only load in development
const DevTools = dynamic(
  () => import('../Debug/DevToolsWrapper').catch(() => {
    // Fallback component in case of import error
    return () => null;
  }),
  {
    loading: () => null,
    ssr: false // Ensure it's client-side only
  }
);

// Memoize the component to prevent unnecessary re-renders
const MemoizedChildren = React.memo(({ children }) => children);

// Create a safe provider wrapper to prevent errors from breaking the entire tree
const SafeProviderWrapper = ({ children, provider: Provider, providerName }) => {
  // Handle case where provider is null or undefined
  if (!Provider) {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Provider ${providerName} is not available, rendering children directly`);
    }
    return children;
  }

  try {
    // Check if Provider is a valid React component
    if (typeof Provider !== 'function' && typeof Provider !== 'object') {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Provider ${providerName} is not a valid React component, rendering children directly`);
      }
      return children;
    }

    // Additional check to ensure Provider is callable
    if (typeof Provider !== 'function' && (!Provider || typeof Provider.type !== 'function')) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Provider ${providerName} is not a callable React component, rendering children directly`);
      }
      return children;
    }

    // Create the provider element
    let providerElement;
    try {
      providerElement = <Provider>{children}</Provider>;
    } catch (createElementError) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error creating provider element ${providerName}:`, createElementError);
      }
      return children;
    }

    // Check if the provider element is valid
    if (providerElement === undefined || providerElement === null) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Provider ${providerName} returned undefined/null, rendering children directly`);
      }
      return children;
    }

    return providerElement;
  } catch (error) {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error rendering provider ${providerName}:`, error);
    }
    // Render children even if provider fails
    return children;
  }
};

export default function ClientProviders({ children }) {
  // Only render dev tools in development
  const devTools = process.env.NODE_ENV === 'development' ? <DevTools /> : null;

  // ✅ FIX #4: Remove custom HMR handling - Let Next.js handle it
  // ✅ FIX #18: Proper SW registration - only once, production only
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // ✅ FIX: Unregister service workers in development to prevent errors
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        // Unregister all service workers in development
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister().then(() => {
              console.log('[SW] Unregistered in development');
            });
          });
        });
      } else if (process.env.NODE_ENV === 'production' && !swRegistered) {
        // Only register service worker in production
        // ✅ FIX: Use functional update to avoid infinite loop
        setSwRegistered(true);
        
        // Register after page load for better performance
        const registerSW = () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
              console.log('[SW] Registered successfully:', registration.scope);
              
              // Handle updates
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker?.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New SW ready, notify user
                    console.log('[SW] New version available');
                  }
                });
              });
            })
            .catch(error => {
              console.warn('[SW] Registration failed:', error);
            });
        };
        
        if (document.readyState === 'loading') {
          window.addEventListener('load', registerSW, { once: true });
        } else {
          registerSW();
        }
      }
    }
  }, []); // ✅ FIX: Empty dependency array to run only once

  // Define providers in order of dependency
  const providers = [
    { provider: FeatureFlagProvider, name: 'FeatureFlagProvider' },
    { provider: UnifiedThemeProvider, name: 'UnifiedThemeProvider' },
    { provider: I18nProvider, name: 'I18nProvider' },
    { provider: AccessibilityProvider, name: 'AccessibilityProvider' },
    { provider: FixedSecureAuthProvider, name: 'FixedSecureAuthProvider' },
    { provider: GraphQLAuthProvider, name: 'GraphQLAuthProvider' },
    { provider: PerfectSocketProvider, name: 'PerfectSocketProvider' }
  ];

  // Render providers in a more robust way
  const renderProviders = (children, providerList) => {
    return providerList.reduceRight((acc, { provider, name }) => {
      return <SafeProviderWrapper provider={provider} providerName={name}>{acc}</SafeProviderWrapper>;
    }, children);
  };

  // ✅ FIX #20: Simplified rendering - no forced remounting
  return (
    <UnifiedStableErrorBoundary
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      {renderProviders(
        <>
          {children}
          {devTools}

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                maxWidth: '500px',
              },
              success: {
                duration: 3000,
                style: { background: '#10B981' },
              },
              error: {
                duration: 5000,
                style: { background: '#EF4444' },
              },
              loading: {
                duration: Infinity,
                style: { background: '#3B82F6' },
              },
            }}
            aria-live="polite"
            role="status"
          />
        </>,
        providers
      )}
    </UnifiedStableErrorBoundary>
  );
}

// Add display name for debugging
ClientProviders.displayName = 'ClientProviders';