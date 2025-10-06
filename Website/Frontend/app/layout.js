import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

// Import startup optimizations
import '../lib/startup-optimization';

// Lazy load heavy providers with optimized settings
const SecureAuthProvider = dynamic(
  () => import('../context/FixedSecureAuthContext').then(mod => ({ default: mod.FixedSecureAuthProvider })),
  { 
    ssr: true,
    loading: () => null
  }
)

const ThemeProvider = dynamic(
  () => import('../Components/Helper/ThemeProvider'),
  { 
    ssr: true,
    loading: () => null
  }
)

// Import the Client Component wrapper for client-side providers
const LayoutClientWrapper = dynamic(
  () => import('../Components/Helper/LayoutClientWrapper'),
  { 
    loading: () => null
  }
)

// Optimized font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

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

// Optimized root layout
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="http://localhost:45799" />
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SecureAuthProvider>
          <ThemeProvider>
            <LayoutClientWrapper>
              {children}
            </LayoutClientWrapper>
          </ThemeProvider>
        </SecureAuthProvider>
      </body>
    </html>
  )
}