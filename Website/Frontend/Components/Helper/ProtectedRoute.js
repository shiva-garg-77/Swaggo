"use client";
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from './AuthProvider';
import SplashScreen from './SplashScreen';

export default function ProtectedRoute({ children }) {
  const { accessToken, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // If loading is complete and no access token, redirect to login
    if (!loading && !accessToken) {
      router.push('/');
    }
  }, [loading, accessToken, router]);

  // Show splash screen while loading
  if (loading) {
    return <SplashScreen />;
  }

  // If no token after loading, show splash while redirecting
  if (!accessToken) {
    return <SplashScreen />;
  }

  // User is authenticated, show the protected content
  return children;
}
