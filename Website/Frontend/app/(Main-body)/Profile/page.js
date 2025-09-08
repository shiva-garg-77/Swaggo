import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'
import UserProfile from '../../../Components/MainComponents/Profile/UserProfile'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <UserProfile />
      </MainLayout>
    </ProtectedRoute>
  )
}
