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
import UnifiedThemeProvider from '../../context/UnifiedThemeProvider';
// 🔄 TESTING: Use PerfectSocketProvider instead of old SocketProvider
import PerfectSocketProvider from '../../Components/Helper/PerfectSocketProvider';
import { Toaster } from 'react-hot-toast';
import { UnifiedStableErrorBoundary } from '../../Components/ErrorBoundary/UnifiedStableErrorBoundary';
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
        <UnifiedStableErrorBoundary>
          <PerformanceMonitoringProvider>
            <AccessibilityProvider>
              <SecureAuthProvider>
                <UnifiedStableErrorBoundary>
                  <GraphQLAuthProvider>
                    {/* 🔄 TESTING: PerfectSocketProvider */}
                    <PerfectSocketProvider>
                      <UnifiedThemeProvider>
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
                      </UnifiedThemeProvider>
                    </PerfectSocketProvider>
                  </GraphQLAuthProvider>
                </UnifiedStableErrorBoundary>
              </SecureAuthProvider>
            </AccessibilityProvider>
          </PerformanceMonitoringProvider>
        </UnifiedStableErrorBoundary>
      </body>
    </html>
  );
}