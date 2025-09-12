import { lazy, Suspense } from 'react'
import SplashScreen from '../../../Components/shared/SplashScreen'

// Lazy load UserProfile for better performance
const UserProfile = lazy(() => import('../../../Components/MainComponents/Profile/UserProfile'))

export default function ProfilePage() {
  return (
    <Suspense fallback={<SplashScreen compact show />}>
      <UserProfile />
    </Suspense>
  )
}
