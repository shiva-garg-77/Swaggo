import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Swaggo - Secure Messaging',
  description: '10/10 Secure Authentication System',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}