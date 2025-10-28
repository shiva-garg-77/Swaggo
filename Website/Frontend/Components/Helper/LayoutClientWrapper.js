'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';

// Import the ClientProviders wrapper for client-side only providers
import ClientProviders from './ClientProviders';

export default function LayoutClientWrapper({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [key, setKey] = useState(0); // Key for forcing remount on HMR
  
  useEffect(() => {
    setIsMounted(true);
    
    // Handle hot module replacement
    if (process.env.NODE_ENV === 'development') {
      // Create a new key when the component mounts to force remount on HMR
      setKey(prev => prev + 1);
      
      // Handle webpack hot module replacement
      if (typeof module !== 'undefined' && module.hot) {
        module.hot.dispose(() => {
          // Cleanup before HMR
          setIsMounted(false);
        });
      }
    }
    
    return () => {
      setIsMounted(false);
    };
  }, []);
  
  // Don't render providers until component is fully mounted to avoid hot reload issues
  if (!isMounted) {
    return <main id="main-content" key={`main-${key}`}>{children}</main>;
  }
  
  // Use useMemo to prevent unnecessary re-renders
  const layoutContent = useMemo(() => (
    <>
      <ClientProviders key={`providers-${key}`}>
        <main id="main-content">
          {children}
        </main>

        {/* Optimized toast notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              maxWidth: '400px',
            },
            success: {
              duration: 2000,
              style: { background: '#10B981' },
            },
            error: {
              duration: 4000,
              style: { background: '#EF4444' },
            },
            loading: {
              duration: 5000,
              style: { background: '#3B82F6' },
            },
          }}
          aria-live="polite"
          role="status"
        />
      </ClientProviders>
    </>
  ), [children, key]);
  
  return layoutContent;
}