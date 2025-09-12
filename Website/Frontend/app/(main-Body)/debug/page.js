import { lazy, Suspense } from 'react'

// Lazy load the debugger
const GraphQLDebugger = lazy(() => import('../../../Components/Debug/GraphQLDebugger'))

export default function DebugPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    }>
      <GraphQLDebugger />
    </Suspense>
  )
}
