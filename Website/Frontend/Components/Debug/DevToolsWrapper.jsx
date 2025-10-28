'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Lazy load dev tools - zero impact on production
const NetworkStatusWidget = dynamic(() => import('./NetworkStatusWidget').catch(() => {
  return () => null;
}), {
  ssr: false,
  loading: () => null
})

const HMRTest = dynamic(() => import('./HMRTest').catch(() => {
  return () => null;
}), {
  ssr: false,
  loading: () => null
})

// Import the performance dashboard wrapper that includes the provider
const PerformanceDashboardWrapper = dynamic(
  () => import('./PerformanceDashboardWrapper').catch(() => {
    return () => null;
  }),
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
    <React.Suspense fallback={null}>
      <NetworkStatusWidget />
      <HMRTest />
      <PerformanceDashboardWrapper position="bottom-left" collapsed={true} />
    </React.Suspense>
  )
}