import { Inter } from 'next/font/google'
import './globals.css'
import CustomApolloProvider from '../Components/Helper/ApolloProvider'
import { AuthProvider } from '../Components/Helper/AuthProvider'
import ThemeProvider from '../Components/Helper/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Swaggo - Social Media Platform',
  description: 'Connect with friends and share your moments',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CustomApolloProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </CustomApolloProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

