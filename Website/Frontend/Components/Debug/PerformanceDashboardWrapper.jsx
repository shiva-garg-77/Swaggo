'use client';

import React from 'react';
import { PerformanceMonitoringProvider, PerformanceDashboard } from '../Performance/PerformanceMonitoringDashboard';

export default function PerformanceDashboardWrapper(props) {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <PerformanceMonitoringProvider>
      <PerformanceDashboard {...props} />
    </PerformanceMonitoringProvider>
  );
}