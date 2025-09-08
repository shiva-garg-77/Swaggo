import MainLayout from '../../../Components/Layout/MainLayout'
import HomeContent from '../../../Components/MainComponents/Home/HomeContent'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'

export default function HomePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <HomeContent />
      </MainLayout>
    </ProtectedRoute>
  )
}
