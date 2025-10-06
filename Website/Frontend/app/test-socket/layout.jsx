/**
 * Test Layout for Socket Testing
 * Uses PerfectSocketProvider instead of old SocketProvider
 */

import { Inter } from 'next/font/google';
import '../globals.css';
import '../../lib/UnifiedWindowsRefreshHandler';
import '../../lib/RSCStreamingFix';
import { GraphQLAuthProvider } from '../../lib/GraphQLAuthProvider';
import { FixedSecureAuthProvider as SecureAuthProvider } from '../../context/FixedSecureAuthContext';
import ThemeProvider from '../../Components/Helper/ThemeProvider';
// 🔄 TESTING: Use PerfectSocketProvider instead of old SocketProvider
import PerfectSocketProvider from '../../Components/Helper/PerfectSocketProvider';
import { Toaster } from 'react-hot-toast';
import { UnifiedErrorProvider, ApolloErrorBoundary } from '../../Components/ErrorBoundary/UnifiedStableErrorBoundary';
import { AccessibilityProvider } from '../../Components/Accessibility/AccessibilityFramework';
import { PerformanceMonitoringProvider } from '../../Components/Performance/PerformanceMonitoringDashboard';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Socket Test - Swaggo',
  description: 'Testing PerfectSocketProvider integration',
};

export default function TestSocketLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className} suppressHydrationWarning={true}>
        <UnifiedErrorProvider>
          <PerformanceMonitoringProvider>
            <AccessibilityProvider>
              <SecureAuthProvider>
                <ApolloErrorBoundary>
                  <GraphQLAuthProvider>
                    {/* 🔄 TESTING: PerfectSocketProvider */}
                    <PerfectSocketProvider>
                      <ThemeProvider>
                        <main id="main-content">
                          {/* Banner indicating test mode */}
                          <div className="bg-yellow-500 text-black py-2 px-4 text-center font-semibold">
                            🧪 SOCKET TEST MODE - Using PerfectSocketProvider
                          </div>
                          
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
                          }}
                          aria-live="polite"
                          role="status"
                        />
                      </ThemeProvider>
                    </PerfectSocketProvider>
                  </GraphQLAuthProvider>
                </ApolloErrorBoundary>
              </SecureAuthProvider>
            </AccessibilityProvider>
          </PerformanceMonitoringProvider>
        </UnifiedErrorProvider>
      </body>
    </html>
  );
}