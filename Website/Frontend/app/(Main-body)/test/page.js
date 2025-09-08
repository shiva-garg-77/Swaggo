import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'
import GraphQLTest from '../../../Components/MainComponents/GraphQLTest'

export default function TestPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <GraphQLTest />
      </MainLayout>
    </ProtectedRoute>
  )
}
