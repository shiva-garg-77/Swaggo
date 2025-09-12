import { Inter } from 'next/font/google'
import './globals.css'
import CustomApolloProvider from '../Components/Helper/ApolloProvider'
import { AuthProvider } from '../Components/Helper/AuthProvider'
import ThemeProvider from '../Components/Helper/ThemeProvider'
import SocketProvider from '../Components/Helper/SocketProvider'

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
      <body className={inter.className}>
        <AuthProvider>
          <CustomApolloProvider>
            <SocketProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </SocketProvider>
          </CustomApolloProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

