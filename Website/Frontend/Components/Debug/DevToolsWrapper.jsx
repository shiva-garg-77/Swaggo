'use client'

import dynamic from 'next/dynamic'

// Lazy load dev tools - zero impact on production
const NetworkStatusWidget = dynamic(() => import('./NetworkStatusWidget'), {
  ssr: false,
  loading: () => null
})

const HMRTest = dynamic(() => import('./HMRTest'), {
  ssr: false,
  loading: () => null
})

// Import the performance dashboard wrapper that includes the provider
const PerformanceDashboardWrapper = dynamic(
  () => import('./PerformanceDashboardWrapper'),
  {
    ssr: false,
    loading: () => null
  }
)

export default function DevToolsWrapper() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      <NetworkStatusWidget />
      <HMRTest />
      <PerformanceDashboardWrapper position="bottom-left" collapsed={true} />
    </>
  )
}