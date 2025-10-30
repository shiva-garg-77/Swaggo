'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import FollowRequestsManager from '../../../Components/MainComponents/Profile/FollowRequestsManager';

/**
 * Follow Requests Page
 * Full page for managing follow requests
 */
export default function FollowRequestsPage() {
  const { user, loading } = useFixedSecureAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return <FollowRequestsManager />;
}
