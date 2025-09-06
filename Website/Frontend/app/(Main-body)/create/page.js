import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold dark:text-white">Create Page</h1>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
