'use client';

import React, { useEffect, useState } from 'react';
import { FixedSecureAuthProvider } from '../context/FixedSecureAuthContext';
import { Toaster } from 'react-hot-toast';
import { isProduction, isDevelopment } from '../config/environment';
import dynamic from 'next/dynamic';

// Import all the providers that were in the original layout
import { I18nProvider } from '../context/I18nContext';
import { UnifiedThemeProvider } from '../context/UnifiedThemeProvider';
import { FeatureFlagProvider } from '../context/FeatureFlagContext';
import { GraphQLAuthProvider } from '../lib/GraphQLAuthProvider';
import PerfectSocketProvider from '../Components/Helper/PerfectSocketProvider';
import { AccessibilityProvider } from '../Components/Accessibility';
import SecurityMonitor from '../Components/Helper/SecurityMonitor';

// Import ErrorBoundary - Using default export from index
import ErrorBoundary from '../Components/ErrorBoundary';

// Providers are properly imported and ready

// Dev tools - only load in development
const DevTools = dynamic(
  () => import('../Components/Debug/DevToolsWrapper').catch(() => {
    // Fallback component in case of import error
    return () => null;
  }),
  {
    loading: () => null,
    ssr: false // Ensure it's client-side only
  }
);

/**
 * 🔒 SECURE ROOT PROVIDERS COMPONENT
 * 
 * This component wraps the entire app with comprehensive security providers:
 * - Error boundaries with security-aware reporting
 * - Authentication context with advanced security
 * - Toast notifications with XSS protection
 * - Performance monitoring
 * - Security monitoring integration
 */

// Security-aware toast configuration
const getToastConfig = () => ({
  position: "top-right",
  reverseOrder: false,
  gutter: 8,
  containerClassName: "",
  containerStyle: {},
  toastOptions: {
    // Define default options with security considerations
    className: '',
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '14px',
      maxWidth: '500px',
      wordBreak: 'break-word', // Prevent long strings from breaking layout
      overflow: 'hidden'
    },
    
    // Sanitize HTML content to prevent XSS
    render: (message) => {
      // Escape HTML entities in toast messages
      const sanitizedMessage = typeof message === 'string' 
        ? message.replace(/[<>&"']/g, (char) => {
            const entities = {
              '<': '&lt;',
              '>': '&gt;',
              '&': '&amp;',
              '"': '&quot;',
              "'": '&#x27;'
            };
            return entities[char] || char;
          })
        : message;
      
      return <span dangerouslySetInnerHTML={{ __html: sanitizedMessage }} />;
    },
    
    // Security-focused toast type configurations
    success: {
      duration: 3000,
      style: {
        background: '#10B981',
        border: '1px solid #059669'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    },
    error: {
      duration: 8000, // Longer duration for security errors
      style: {
        background: '#EF4444',
        border: '1px solid #DC2626'
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    },
    loading: {
      duration: 30000, // 30 second timeout for loading states
      style: {
        background: '#3B82F6',
        border: '1px solid #2563EB'
      },
    },
    
    // Security warning toast configuration
    custom: {
      duration: 10000, // Longer duration for security warnings
      style: {
        background: '#F59E0B',
        color: '#000',
        border: '1px solid #D97706'
      }
    }
  }
});

// SecurityMonitor now imported from separate file

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

const Providers = ({ children }) => {

  // Define providers in order of dependency - filter out undefined ones
  const providers = [
    { provider: FeatureFlagProvider, name: 'FeatureFlagProvider' },
    { provider: UnifiedThemeProvider, name: 'UnifiedThemeProvider' },
    { provider: I18nProvider, name: 'I18nProvider' },
    { provider: AccessibilityProvider, name: 'AccessibilityProvider' },
    { provider: GraphQLAuthProvider, name: 'GraphQLAuthProvider' },
    { provider: PerfectSocketProvider, name: 'PerfectSocketProvider' }
  ].filter(({ provider, name }) => {
    if (!provider) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Provider ${name} is undefined!`);
      }
      return false;
    }
    // Accept both functions and objects (React.memo returns objects)
    const providerType = typeof provider;
    const isValid = providerType === 'function' || providerType === 'object';
    
    if (!isValid && process.env.NODE_ENV === 'development') {
      console.error(`❌ Provider ${name} has invalid type: ${providerType}`);
      return false;
    }
    
    return isValid;
  });

  // Render providers in a more robust way
  const renderProviders = (children, providerList) => {
    return providerList.reduceRight((acc, { provider, name }) => {
      return <SafeProviderWrapper provider={provider} providerName={name}>{acc}</SafeProviderWrapper>;
    }, children);
  };

  return (
    <ErrorBoundary maxRetries={3} showErrorDetails={process.env.NODE_ENV === 'development'}>
      <SecurityMonitor>
        <FeatureFlagProvider>
          <UnifiedThemeProvider>
            <I18nProvider>
              <AccessibilityProvider>
                <FixedSecureAuthProvider>
                  <GraphQLAuthProvider>
                    <PerfectSocketProvider>
                      {children}
                      {process.env.NODE_ENV === 'development' && <DevTools />}
                      <Toaster {...getToastConfig()} />
                    </PerfectSocketProvider>
                  </GraphQLAuthProvider>
                </FixedSecureAuthProvider>
              </AccessibilityProvider>
            </I18nProvider>
          </UnifiedThemeProvider>
        </FeatureFlagProvider>
      </SecurityMonitor>
    </ErrorBoundary>
  );
};

export default Providers;