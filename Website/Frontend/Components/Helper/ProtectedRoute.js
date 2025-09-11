"use client";
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from './AuthProvider';

export default function ProtectedRoute({ children }) {
  const { accessToken, initialized } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Only redirect if initialized and no access token
    if (initialized && !accessToken) {
      router.push('/');
    }
  }, [initialized, accessToken, router]);

  // Show nothing until initialized
  if (!initialized) {
    return null;
  }

  // If initialized but no token, show nothing (will redirect)
  if (!accessToken) {
    return null;
  }

  // User is authenticated, show the protected content
  return children;
}
