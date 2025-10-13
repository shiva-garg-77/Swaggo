"use client";

import { useFixedSecureAuth as useSecureAuth } from '../context/FixedSecureAuthContext';
import Login from "../Components/LoginComponts/Login";
import { PerformanceDebugger } from "../Components/Helper/PerformanceMonitor";
import SplashScreen from "../Components/shared/SplashScreen";
// import AuthStateDebug from "../Components/Debug/AuthStateDebug"; // Temporarily disabled
import AuthTest from "../Components/Test/AuthTest";
import AuthBypassFixed from "../Components/Debug/AuthBypassFixed";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [authError, setAuthError] = useState(null);
  const [bypassAuth, setBypassAuth] = useState(false);
  const [mockAuthData, setMockAuthData] = useState(null);
  const [authData, setAuthData] = useState({ isAuthenticated: false, isLoading: true });
  const [redirecting, setRedirecting] = useState(false);
  
  const router = useRouter();
  
  useEffect(() => {
    try {
      const data = useSecureAuth();
      setAuthData(data);
    } catch (error) {
      console.error('😨 SecureAuth Hook Error:', error);
      setAuthError(error.message);
      setAuthData({ isAuthenticated: false, isLoading: false });
    }
  }, []);
  
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
  const { isAuthenticated, isLoading } = effectiveAuthData;
  const initialized = !isLoading; // Map isLoading to initialized

  // Debug logging
  console.log('📊 Page Debug:', {
    isAuthenticated,
    isLoading,
    initialized,
    redirecting,
    authError
  });
  
  // Show error screen if authentication system failed
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="text-6xl mb-4">😨</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Authentication System Error</h1>
          <p className="text-red-600 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

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
      <main>
        <Login />
      </main>
    </>
  );
}