"use client";

import { useFixedSecureAuth as useSecureAuth } from '../context/FixedSecureAuthContext';
import Login from "../Components/LoginComponts/Login";
import { PerformanceDebugger } from "../Components/Helper/PerformanceMonitor";
import SplashScreen from "../Components/shared/SplashScreen";
// import AuthStateDebug from "../Components/Debug/AuthStateDebug"; // Temporarily disabled
import AuthTest from "../Components/Test/AuthTest";
import AuthBypassFixed from "../Components/Debug/AuthBypassFixed";
import { InvisiblePreloader } from '../Components/Helper/InvisibleSpeedBoost';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [authError, setAuthError] = useState(null);
  const [bypassAuth, setBypassAuth] = useState(false);
  const [mockAuthData, setMockAuthData] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  
  const router = useRouter();
  
  // Call the hook at the top level
  const authData = useSecureAuth();
  
  // Handle auth bypass for development
  const handleAuthBypass = (mockData) => {
    console.log('🛠️ Auth bypassed with mock data:', mockData);
    setBypassAuth(true);
    setMockAuthData({
      isAuthenticated: true,
      isLoading: false,
      user: mockData.user,
      permissions: mockData.permissions,
      session: mockData.session,
      security: mockData.security
    });
  };
  
  // Use bypass data if available
  const effectiveAuthData = bypassAuth && mockAuthData ? mockAuthData : authData;
  
  // Add safety checks for destructuring
  const { isAuthenticated = false, isLoading = true } = effectiveAuthData || {};
  const initialized = !isLoading; // Map isLoading to initialized

  // Debug logging
  console.log('📊 Page Debug:', {
    isAuthenticated,
    isLoading,
    initialized,
    redirecting,
    effectiveAuthData,
    authData,
    mockAuthData,
    bypassAuth
  });

  // Redirect if already logged in (only after initialization)
  useEffect(() => {
    if (initialized && isAuthenticated && !redirecting) {
      setRedirecting(true);
      router.push("/home");
    }
  }, [initialized, isAuthenticated, redirecting, router]);

  // Show splash screen until initialized or while redirecting
  if (!initialized || redirecting) {
    return (
      <>
        <PerformanceDebugger enabled={process.env.NODE_ENV === 'development'} />
        {/* <AuthStateDebug /> */}
        <AuthTest />
        <SplashScreen show={true} />
        {/* Development bypass for stuck auth */}
        <AuthBypassFixed onBypass={handleAuthBypass} />
      </>
    );
  }

  return (
    <>
      <PerformanceDebugger enabled={process.env.NODE_ENV === 'development'} />
      {/* <AuthStateDebug /> */}
      <AuthTest />
      {/* ✅ FIX: Only preload unauthenticated routes when user is NOT authenticated */}
      <InvisiblePreloader routes={['/signup', '/forget-password']} />
      <main>
        <Login />
      </main>
    </>
  );
}