import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'
import PostsDebug from '../../../Components/MainComponents/PostsDebug'

export default function DebugPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <PostsDebug />
      </MainLayout>
    </ProtectedRoute>
  )
}
