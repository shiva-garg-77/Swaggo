import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'
import CreatePost from '../../../Components/MainComponents/Post/CreatePost'

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <CreatePost />
      </MainLayout>
    </ProtectedRoute>
  )
}
