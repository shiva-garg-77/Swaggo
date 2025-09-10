import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'
import ReelsContent from '../../../Components/MainComponents/Reels/ReelsContent'

export default function ReelPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ReelsContent />
      </MainLayout>
    </ProtectedRoute>
  )
}
