'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';

// Import the ClientProviders wrapper for client-side only providers
const ClientProviders = dynamic(
  () => import('./ClientProviders'),
  { 
    loading: () => null
  }
);

export default function LayoutClientWrapper({ children }) {
  return (
    <>
      <ClientProviders>
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
  );
}