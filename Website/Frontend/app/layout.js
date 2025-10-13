import { Inter } from 'next/font/google'
import './globals.css';
import { registerServiceWorker } from '../utils/serviceWorkerRegistration';
import { FixedSecureAuthProvider } from '../context/FixedSecureAuthContext';

// Register service worker when the app loads
if (typeof window !== 'undefined') {
  registerServiceWorker();
}

export const metadata = {
  title: 'Swaggo - Secure Messaging',
  description: '10/10 Secure Authentication System',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#dc2626" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <FixedSecureAuthProvider>
          {children}
        </FixedSecureAuthProvider>
      </body>
    </html>
  );
}
