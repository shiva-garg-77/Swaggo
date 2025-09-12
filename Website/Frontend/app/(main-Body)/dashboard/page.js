"use client";

import { lazy, Suspense } from 'react'
import SplashScreen from '../../../Components/shared/SplashScreen'

// Lazy load Ads Management Dashboard for better performance
const AdsManagementDashboard = lazy(() => import('../../../Components/Dashboard/AdsManagementDashboard'))

export default function DashboardPage() {
  return (
    <Suspense fallback={<SplashScreen compact show />}>
      <AdsManagementDashboard />
    </Suspense>
  )
}
