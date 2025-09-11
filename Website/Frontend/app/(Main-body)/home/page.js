import { lazy, Suspense } from 'react'

// Lazy load HomeContent for better performance
const HomeContent = lazy(() => import('../../../Components/MainComponents/Home/HomeContent'))

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
