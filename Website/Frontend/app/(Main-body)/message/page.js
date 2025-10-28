import { lazy, Suspense } from 'react'
import SplashScreen from '../../../Components/shared/SplashScreen'

// Lazy load MessagePageContent for better performance and to avoid read-only params issues
const MessagePageContent = lazy(() => import('../../../Components/MainComponents/Messages/MessagePageContent'))

export default function MessagePage() {
  return (
    <Suspense fallback={<SplashScreen compact show />}>
      <MessagePageContent />
    </Suspense>
  )
}