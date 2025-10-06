'use client';

/**
 * 🛡️ RSC-COMPATIBLE ERROR BOUNDARY WRAPPER
 * 
 * This client component wraps the error boundary to handle
 * event handlers properly without RSC serialization issues.
 */

import React from 'react';
import { UnifiedStableErrorBoundary } from '../../Components/ErrorBoundary/UnifiedStableErrorBoundary';

export default function ClientErrorBoundary({ children }) {
  const handleError = (error, errorInfo) => {
    // Log to monitoring service if available
    if (typeof window !== 'undefined' && window.errorReporting) {
      window.errorReporting.report({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    }
    
    // Safe console logging
    console.error('Application Error:', error.message);
  };

  return (
    <UnifiedStableErrorBoundary 
      onError={handleError}
      enableAutoRecovery={true}
      maxRetries={3}
      fallback={
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>Application Error</h2>
          <p>Something went wrong. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Refresh Page
          </button>
        </div>
      }
    >
      {children}
    </UnifiedStableErrorBoundary>
  );
}