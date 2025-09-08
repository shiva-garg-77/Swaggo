import MainLayout from '../../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../../Components/Helper/ProtectedRoute'
import { notFound } from 'next/navigation'

export default function PostPage({ params }) {
  const { id } = params

  if (!id) {
    notFound()
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Post View</h1>
            <p className="text-gray-600 mb-6">
              Post ID: {id}
            </p>
            <div className="p-8 border border-gray-200 rounded-lg">
              <p className="text-gray-500">
                🚧 Individual post view is coming soon!
              </p>
              <p className="text-sm text-gray-400 mt-2">
                For now, you can view posts in the profile grid.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
