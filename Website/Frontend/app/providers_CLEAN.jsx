'use client';

import React, { useEffect, useState } from 'react';
import { FixedSecureAuthProvider as AuthProvider } from '../context/FixedSecureAuthContext';
import { Toaster } from 'react-hot-toast';

// Import ErrorBoundary
import ErrorBoundary from '../Components/ErrorBoundary';

// 🔍 DEBUG: Log ErrorBoundary import
console.log('🔍 DEBUG providers.jsx: ErrorBoundary =', ErrorBoundary);
console.log('🔍 DEBUG providers.jsx: typeof ErrorBoundary =', typeof ErrorBoundary);
console.log('🔍 DEBUG providers.jsx: ErrorBoundary is undefined?', ErrorBoundary === undefined);
console.log('🔍 DEBUG providers.jsx: AuthProvider =', AuthProvider);
console.log('🔍 DEBUG providers.jsx: typeof AuthProvider =', typeof AuthProvider);

import { isProduction, isDevelopment } from '../config/environment';
import dynamic from 'next/dynamic';

// Import all the providers
import { I18nProvider } from '../context/I18nContext';
import { UnifiedThemeProvider } from '../context/UnifiedThemeProvider';
import { FeatureFlagProvider } from '../context/FeatureFlagContext';
import { GraphQLAuthProvider } from '../lib/GraphQLAuthProvider';
import PerfectSocketProvider from '../Components/Helper/PerfectSocketProvider';
import { AccessibilityProvider } from '../Components/Accessibility';



// 🔍 DEBUG: Log AccessibilityProvider import

console.log('🔍 DEBUG providers.jsx: AccessibilityProvider =', AccessibilityProvider);
console.log('🔍 DEBUG providers.jsx: typeof AccessibilityProvider =', typeof AccessibilityProvider);
console.log('🔍 DEBUG providers.jsx: GraphQLAuthProvider =', GraphQLAuthProvider);
console.log('🔍 DEBUG providers.jsx: typeof GraphQLAuthProvider =', typeof GraphQLAuthProvider);
console.log('🔍 DEBUG providers.jsx: I18nProvider =', I18nProvider);
console.log('🔍 DEBUG providers.jsx: typeof I18nProvider =', typeof I18nProvider);
console.log('🔍 DEBUG providers.jsx: UnifiedThemeProvider =', UnifiedThemeProvider);
console.log('🔍 DEBUG providers.jsx: typeof UnifiedThemeProvider =', typeof UnifiedThemeProvider);
console.log('🔍 DEBUG providers.jsx: FeatureFlagProvider =', FeatureFlagProvider);
console.log('🔍 DEBUG providers.jsx: typeof FeatureFlagProvider =', typeof FeatureFlagProvider);
console.log('🔍 DEBUG providers.jsx: PerfectSocketProvider =', PerfectSocketProvider);
console.log('🔍 DEBUG providers.jsx: typeof PerfectSocketProvider =', typeof PerfectSocketProvider);

// Dev tools
const DevTools = dynamic(
  () => import('../Components/Debug/DevToolsWrapper').catch(() => {
    return () => null;
  }),
  {
    loading: () => null,
    ssr: false
  }
);

// Security-aware toast configuration
const getToastConfig = () => ({
  position: "top-right",
  reverseOrder: false,
  gutter: 8,
  containerClassName: "",
  containerStyle: {},
  toastOptions: {
    className: '',
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '14px',
      maxWidth: '500px',
      wordBreak: 'break-word',
      overflow: 'hidden'
    },
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
      duration: 8000,
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
      duration: 30000,
      style: {
        background: '#3B82F6',
        border: '1px solid #2563EB'
      },
    },
    custom: {
      duration: 10000,
      style: {
        background: '#F59E0B',
        color: '#000',
        border: '1px solid #D97706'
      }
    }
  }
});

// Security monitoring component
const SecurityMonitor = ({ children }) => {
  const [securityEvents, setSecurityEvents] = useState([]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    window.__SECURITY_MONITOR__ = {
      reportEvent: (event) => {
        setSecurityEvents(prev => [...prev.slice(-49), {
          ...event,
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(2)
        }]);
        
        if (isDevelopment) {
          console.warn('🚨 Security Event:', event);
        }
      },
      getEvents: () => securityEvents
    };
    
    const monitorDevTools = () => {
      const threshold = 160;
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
          window.__SECURITY_MONITOR__?.reportEvent({
            type: 'dev_tools_detected',
            severity: 'low',
            details: { 
              outerDimensions: { width: window.outerWidth, height: window.outerHeight },
              innerDimensions: { width: window.innerWidth, height: window.innerHeight }
            }
          });
        }
      }, 5000);
    };
    
    const handleContextMenu = (e) => {
      if (isProduction) {
        window.__SECURITY_MONITOR__?.reportEvent({
          type: 'context_menu_accessed',
          severity: 'low',
          details: { target: e.target.tagName, location: window.location.pathname }
        });
      }
    };
    
    const handleKeyDown = (e) => {
      const suspiciousKeys = [
        { keys: ['F12'], name: 'F12_dev_tools' },
        { keys: ['Control', 'Shift', 'I'], name: 'ctrl_shift_i' },
        { keys: ['Control', 'Shift', 'J'], name: 'ctrl_shift_j' },
        { keys: ['Control', 'U'], name: 'view_source' }
      ];
      
      suspiciousKeys.forEach(({ keys, name }) => {
        const isPressed = keys.every(key => {
          if (key === 'Control') return e.ctrlKey;
          if (key === 'Shift') return e.shiftKey;
          if (key === 'Alt') return e.altKey;
          return e.key === key;
        });
        
        if (isPressed && isProduction) {
          window.__SECURITY_MONITOR__?.reportEvent({
            type: 'suspicious_key_combination',
            severity: 'low',
            details: { combination: name, location: window.location.pathname }
          });
        }
      });
    };
    
    if (isProduction) {
      monitorDevTools();
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [securityEvents]);
  
  return children;
};

const Providers = ({ children }) => {
  console.log('🔍 DEBUG providers.jsx: Providers function called');
  console.log('🔍 DEBUG providers.jsx: ErrorBoundary in render =', ErrorBoundary);
  
  const devTools = process.env.NODE_ENV === 'development' ? <DevTools /> : null;

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Provider Import Check:', {
      FeatureFlagProvider: typeof FeatureFlagProvider,
      UnifiedThemeProvider: typeof UnifiedThemeProvider,
      I18nProvider: typeof I18nProvider,
      AccessibilityProvider: typeof AccessibilityProvider,
      AuthProvider: typeof AuthProvider,
      GraphQLAuthProvider: typeof GraphQLAuthProvider,
      PerfectSocketProvider: typeof PerfectSocketProvider
    });
  }

  console.log('🔍 DEBUG providers.jsx: About to return JSX with ErrorBoundary');
  console.log('🔍 DEBUG providers.jsx: ErrorBoundary before JSX =', ErrorBoundary);
  console.log('🔍 DEBUG providers.jsx: Is valid React element?', typeof ErrorBoundary === 'function' || (typeof ErrorBoundary === 'object' && ErrorBoundary !== null));
  
  return (
    <ErrorBoundary maxRetries={3} showErrorDetails={process.env.NODE_ENV === 'development'}>
      <SecurityMonitor>
        <FeatureFlagProvider>
          <UnifiedThemeProvider>
            <I18nProvider>
              <AccessibilityProvider>
                <AuthProvider>
                  <GraphQLAuthProvider>
                    <PerfectSocketProvider>
                      {children}
                      {devTools}
                      <Toaster {...getToastConfig()} />
                    </PerfectSocketProvider>
                  </GraphQLAuthProvider>
                </AuthProvider>
              </AccessibilityProvider>
            </I18nProvider>
          </UnifiedThemeProvider>
        </FeatureFlagProvider>
      </SecurityMonitor>
    </ErrorBoundary>
  );
};

export default Providers;
