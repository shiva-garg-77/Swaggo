import MainLayout from '../../../Components/Layout/MainLayout'
import ProtectedRoute from '../../../Components/Helper/ProtectedRoute'
import DebugTest from '../../../Components/MainComponents/DebugTest'

export default function DebugPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DebugTest />
      </MainLayout>
    </ProtectedRoute>
  )
}
