import { lazy, Suspense } from 'react'
import SplashScreen from '../../../Components/shared/SplashScreen'

// Lazy load HomeContent for better performance
const HomeContent = lazy(() => import('../../../Components/MainComponents/Home/HomeContent'))

export default function HomePage() {
  return (
    <Suspense fallback={<SplashScreen compact show />}>
      <HomeContent />
    </Suspense>
  )
}
