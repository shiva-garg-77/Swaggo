import { Inter } from 'next/font/google'
import './globals.css'
// Targeted RSC streaming fix
import '../lib/RSCStreamingFix'
import { GraphQLAuthProvider } from '../lib/GraphQLAuthProvider'
import { FixedSecureAuthProvider as SecureAuthProvider } from '../context/FixedSecureAuthContext.jsx'
import ThemeProvider from '../Components/Helper/ThemeProvider'
import SocketProvider from '../Components/Helper/SocketProvider'
import { Toaster } from 'react-hot-toast'
import RSCErrorBoundary from '../Components/ErrorBoundary/RSCErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Swaggo - Social Media Platform',
  description: 'Connect with friends and share your moments',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ef4444'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* 🎯 MINIMAL RSC ERROR PREVENTION */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Only prevent the specific RSC Connection closed errors
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason?.message?.includes('Connection closed') && 
                  e.reason?.stack?.includes('react-server-dom-webpack-client')) {
                console.log('🎯 RSC connection error prevented');
                e.preventDefault();
              }
            }, true);
          `
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent flash and improve loading */
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
            }
            
            /* Loading animation for components */
            .loading-shimmer {
              animation: shimmer 1.5s infinite;
            }
            
            @keyframes shimmer {
              0% { opacity: 0.4; }
              50% { opacity: 1; }
              100% { opacity: 0.4; }
            }
          `
        }} />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <RSCErrorBoundary>
          <SecureAuthProvider>
            <GraphQLAuthProvider>
              <SocketProvider>
                <ThemeProvider>
                  <main id="main-content">
                    {children}
                  </main>

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
              </ThemeProvider>
            </SocketProvider>
          </GraphQLAuthProvider>
        </SecureAuthProvider>
        </RSCErrorBoundary>
      </body>
    </html>
  )
}