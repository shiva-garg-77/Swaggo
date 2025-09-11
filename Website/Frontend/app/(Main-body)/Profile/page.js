import { lazy, Suspense } from 'react'

// Lazy load UserProfile for better performance
const UserProfile = lazy(() => import('../../../Components/MainComponents/Profile/UserProfile'))

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <UserProfile />
    </Suspense>
  )
}
