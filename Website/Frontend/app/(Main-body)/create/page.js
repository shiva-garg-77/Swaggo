import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'
import CreatePostComponent from '../../../Components/MainComponents/Post/CreatePost'

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <CreatePostComponent />
      </MainLayout>
    </ProtectedRoute>
  )
}
