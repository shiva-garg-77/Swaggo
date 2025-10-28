"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';

export default function ProtectedRoute({ children }) {
  const auth = useFixedSecureAuth();
  // Add safety checks for destructuring
  const { isAuthenticated = false, isLoading = true } = auth || {};
  const router = useRouter();
  const initialized = !isLoading;

  useEffect(() => {
    // Only redirect if initialized and not authenticated
    if (initialized && !isAuthenticated) {
      router.push('/');
    }
  }, [initialized, isAuthenticated, router]);

  // Show nothing until initialized
  if (!initialized) {
    return null;
  }

  // If initialized but not authenticated, show nothing (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, show the protected content
  return children;
}