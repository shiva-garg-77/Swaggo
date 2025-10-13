'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Import Performance Monitoring Provider
import { PerformanceMonitoringProvider } from '../Performance/PerformanceMonitoringDashboard';

// Import Accessibility Provider
import { AccessibilityProvider } from '../Accessibility/AccessibilityFramework';

// Import Error Boundary
import { UnifiedStableErrorBoundary } from '../ErrorBoundary/UnifiedStableErrorBoundary';

// Dynamically import providers that need to run on the client side
// Using PerfectSocketProvider - consolidated, production-ready socket implementation
const SocketProvider = dynamic(
  () => import('./PerfectSocketProvider'),
  { 
    ssr: false,
    loading: () => null
  }
);

// Dev tools - only load in development
const DevTools = dynamic(
  () => import('../Debug/DevToolsWrapper'),
  { 
    ssr: false,
    loading: () => null
  }
);

// GraphQL Auth Provider
const GraphQLAuthProvider = dynamic(
  () => import('../../lib/GraphQLAuthProvider').then(mod => ({ default: mod.GraphQLAuthProvider })),
  { 
    ssr: false,
    loading: () => null
  }
);

// Memoize the component to prevent unnecessary re-renders
const MemoizedChildren = React.memo(({ children }) => children);

export default function ClientProviders({ children }) {
  // Only render dev tools in development
  const devTools = process.env.NODE_ENV === 'development' ? <DevTools /> : null;
  
  return (
    <UnifiedStableErrorBoundary 
      enableAutoRecovery={true} 
      maxRetries={3}
      showErrorDetails={process.env.NODE_ENV === 'development'}
    >
      <AccessibilityProvider>
        <PerformanceMonitoringProvider>
          <GraphQLAuthProvider>
            <SocketProvider>
              <MemoizedChildren>
                {children}
              </MemoizedChildren>
              {devTools}
            </SocketProvider>
          </GraphQLAuthProvider>
        </PerformanceMonitoringProvider>
      </AccessibilityProvider>
    </UnifiedStableErrorBoundary>
  );
}

// Add display name for debugging
ClientProviders.displayName = 'ClientProviders';