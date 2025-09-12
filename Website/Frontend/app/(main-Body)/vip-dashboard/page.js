"use client";

import { lazy, Suspense } from 'react'
import SplashScreen from '../../../Components/shared/SplashScreen'

// Lazy load VIPDashboard for better performance
const VIPDashboard = lazy(() => import('../../../Components/VIP/VIPDashboard'))

export default function VIPDashboardPage() {
  return (
    <Suspense fallback={<SplashScreen compact show />}>
      <VIPDashboard />
    </Suspense>
  )
}
