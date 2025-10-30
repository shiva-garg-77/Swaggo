'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import TrendingPage from '../../../Components/MainComponents/Explore/TrendingPage';

/**
 * Explore/Trending Page Route
 */
export default function ExplorePage() {
  const { user, loading } = useFixedSecureAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <TrendingPage />;
}
