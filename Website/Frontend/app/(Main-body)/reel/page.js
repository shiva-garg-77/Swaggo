import { lazy, Suspense } from 'react'

// Lazy load ReelsContent for better performance
const ReelsContent = lazy(() => import('../../../Components/MainComponents/Reels/ReelsContent'))

export default function ReelPage() {
  return (
    <Suspense fallback={null}>
      <ReelsContent />
    </Suspense>
  )
}
