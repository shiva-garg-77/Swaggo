"use client";
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SplashScreen from '../../../Components/shared/SplashScreen';

// Lazy load MomentsContent for better performance
const MomentsContent = lazy(() => import('../../../Components/MainComponents/Reels/ReelsContent'));

function MomentsPageContent() {
  return (
    <Suspense fallback={<SplashScreen compact show />}>
      <MomentsContent />
    </Suspense>
  );
}

export default function MomentsPage() {
  return (
    <Suspense fallback={<SplashScreen show />}>
      <MomentsPageContent />
    </Suspense>
  );
}
