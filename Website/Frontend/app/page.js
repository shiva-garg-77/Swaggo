"use client";

import { AuthContext } from "../Components/Helper/AuthProvider";
import Login from "../Components/LoginComponts/Login";
import { PerformanceDebugger } from "../Components/Helper/PerformanceMonitor";
import SplashScreen from "../Components/shared/SplashScreen";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

export default function Home() {
  const { accessToken, initialized } = useContext(AuthContext);
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  // Redirect if already logged in (only after initialization)
  useEffect(() => {
    if (initialized && accessToken) {
      setRedirecting(true);
      router.push("/home");
    }
  }, [initialized, accessToken, router]);

  // Show splash screen until initialized or while redirecting
  if (!initialized || redirecting) {
    return (
      <>
        <PerformanceDebugger enabled={process.env.NODE_ENV === 'development'} />
        <SplashScreen show={true} />
      </>
    );
  }

  return (
    <>
      <PerformanceDebugger enabled={process.env.NODE_ENV === 'development'} />
      <main>
        <Login />
      </main>
    </>
  );
}
